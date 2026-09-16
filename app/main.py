import os
import random
from sqlalchemy.exc import IntegrityError, OperationalError
import logging
import time
from fastapi.responses import JSONResponse
from fastapi import Request


from fastapi import BackgroundTasks
from fastapi.responses import StreamingResponse
import io
import csv
import json
import base64
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization
from pywebpush import webpush, WebPushException

from fastapi import Depends, FastAPI, Header, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import text

from . import balances, models, schemas, auth, deps
from fastapi.security import OAuth2PasswordRequestForm
from .database import Base, engine, get_db, SessionLocal

# Base.metadata.create_all(bind=engine)  # Removed in favor of Alembic migrations

app = FastAPI(title="Evenly API")

from sqlalchemy import text



logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled error processing {request.method} {request.url}")
    return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})


# Same-origin in production (this app serves its own frontend), so CORS is
# mostly a local-dev convenience here. Auth is via a per-member secret
# header rather than cookies, so an open CORS policy doesn't expose a CSRF
# risk the way it would for cookie-based auth.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

PALETTE = ["#B4863A", "#4F7D5A", "#A8483A", "#5C7A8A", "#8A5C7A", "#7A8A4F"]



from collections import defaultdict
import time

# Basic in-memory rate limiting (max 10 auth attempts per minute per IP)
auth_attempts = defaultdict(list)

def rate_limit_auth(request: Request):
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    
    # Prune old attempts
    auth_attempts[client_ip] = [t for t in auth_attempts[client_ip] if now - t < 60]
    
    if len(auth_attempts[client_ip]) >= 10:
        logger.warning(f"Rate limited auth attempt from {client_ip}")
        raise HTTPException(status_code=429, detail="Too many attempts. Please wait a minute.")
    
    auth_attempts[client_ip].append(now)

def pick_color() -> str:
    return random.choice(PALETTE)



@app.post("/api/auth/register")
def register(payload: schemas.UserCreate, db: Session = Depends(get_db), _=Depends(rate_limit_auth)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(payload.password)
    user = models.User(email=payload.email, password_hash=hashed_password)
    db.add(user)
    db.commit()
    db.refresh(user)
    
    access_token = auth.create_access_token(data={"sub": user.id})
    return {"access_token": access_token, "token_type": "bearer", "user": {"email": user.email}}

@app.post("/api/auth/login")
def login(payload: schemas.UserLogin, db: Session = Depends(get_db), _=Depends(rate_limit_auth)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or not auth.verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token = auth.create_access_token(data={"sub": user.id})
    return {"access_token": access_token, "token_type": "bearer", "user": {"email": user.email}}

@app.get("/api/users/me/groups", response_model=list[schemas.MembershipResponse])
def get_my_groups(user: models.User = Depends(deps.get_current_user), db: Session = Depends(get_db)):
    return [
        {
            "group": {"id": m.group.id, "name": m.group.name, "invite_code": m.group.invite_code},
            "member": {"id": m.id, "name": m.name, "color": m.color}
        }
        for m in user.memberships
    ]





def member_out(m: models.Member, net: dict) -> dict:
    return {"id": m.id, "name": m.name, "color": m.color, "balance": net.get(m.id, 0.0)}


@app.post("/api/groups", response_model=schemas.CreateJoinResponse)
def create_group(payload: schemas.GroupCreate, user: models.User = Depends(deps.get_current_user), db: Session = Depends(get_db)):
    for attempt in range(3):
        try:
            group = models.Group(name=payload.name)
            db.add(group)
            db.flush()

            member = models.Member(group_id=group.id, user_id=user.id, name=payload.your_name, color=pick_color(), is_admin=True)
            db.add(member)
            db.commit()
            db.refresh(group)
            db.refresh(member)
            
            return {
                "group": {"id": group.id, "name": group.name, "invite_code": group.invite_code},
                "member": {"id": member.id, "name": member.name, "color": member.color},
            }
        except IntegrityError:
            db.rollback()
            if attempt == 2:
                logger.error("Failed to generate a unique invite code after 3 attempts.")
                raise HTTPException(status_code=500, detail="Could not create tab. Please try again.")



@app.get("/api/groups/by-code/{invite_code}")
def preview_group(invite_code: str, db: Session = Depends(get_db)):
    group = db.query(models.Group).filter(models.Group.invite_code == invite_code).first()
    if not group:
        raise HTTPException(status_code=404, detail="No tab found for that code")
    return {"id": group.id, "name": group.name, "member_count": len(group.members)}


@app.post("/api/groups/by-code/{invite_code}/join", response_model=schemas.CreateJoinResponse)
def join_group(invite_code: str, payload: schemas.JoinRequest, user: models.User = Depends(deps.get_current_user), db: Session = Depends(get_db)):
    group = db.query(models.Group).filter(models.Group.invite_code == invite_code).first()
    if not group:
        raise HTTPException(status_code=404, detail="No tab found for that code")

    member = models.Member(group_id=group.id, user_id=user.id, name=payload.name, color=pick_color())
    db.add(member)
    db.commit()
    db.refresh(member)

    return {
        "group": {"id": group.id, "name": group.name, "invite_code": group.invite_code},
        "member": {"id": member.id, "name": member.name, "color": member.color},
    }


@app.get("/api/groups/{group_id}", response_model=schemas.GroupDetailResponse)
def get_group(group_id: str, member: models.Member = Depends(deps.get_current_member), db: Session = Depends(get_db)):
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Tab not found")

    net = balances.compute_net_balances(db, group_id)
    name_lookup = {m.id: m.name for m in group.members}
    debts = balances.simplify_debts(net)
    debts_out = [
        {**d, "from_name": name_lookup.get(d["from_member"], "?"), "to_name": name_lookup.get(d["to_member"], "?")}
        for d in debts
    ]

    return {
        "id": group.id,
        "name": group.name,
        "invite_code": group.invite_code,
        "members": [member_out(m, net) for m in group.members],
        "simplified_debts": debts_out,
    }


@app.put("/api/groups/{group_id}", response_model=schemas.BasicResponse)
def update_group(group_id: str, payload: schemas.GroupUpdate, member: models.Member = Depends(deps.get_current_member), db: Session = Depends(get_db)):
    if not member.is_admin:
        raise HTTPException(status_code=403, detail="Only the tab creator can edit tab settings")
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Tab not found")
    group.name = payload.name
    db.commit()
    return {"ok": True}

@app.delete("/api/groups/{group_id}", response_model=schemas.BasicResponse)
def delete_group(group_id: str, member: models.Member = Depends(deps.get_current_member), db: Session = Depends(get_db)):
    if not member.is_admin:
        raise HTTPException(status_code=403, detail="Only the tab creator can delete this tab")
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Tab not found")
    db.delete(group)
    db.commit()
    return {"ok": True}

@app.get("/api/groups/{group_id}/activity", response_model=list[schemas.ActivityResponse])
def get_activity(
    group_id: str, 
    limit: int = 50, 
    offset: int = 0, 
    member: models.Member = Depends(deps.get_current_member), 
    db: Session = Depends(get_db)
):
    members = db.query(models.Member).filter(models.Member.group_id == group_id).all()
    name_lookup = {m.id: m.name for m in members}

    items = []
    # Eagerly load splits to prevent N+1 queries
    expenses = (
        db.query(models.Expense)
        .options(selectinload(models.Expense.splits))
        .filter(models.Expense.group_id == group_id)
        .all()
    )
    for e in expenses:
        items.append(
            {
                "type": "expense",
                "id": e.id,
                "description": e.description,
                "category": e.category,
                "amount": e.amount,
                "paid_by": e.paid_by,
                "paid_by_name": name_lookup.get(e.paid_by, "?"),
                "split_type": e.split_type.value if hasattr(e.split_type, 'value') else str(e.split_type),
                "created_at": e.created_at,
                "splits": [
                    {"member_id": s.member_id, "name": name_lookup.get(s.member_id, "?"), "share_amount": s.share_amount}
                    for s in e.splits
                ],
            }
        )
    for s in db.query(models.Settlement).filter(models.Settlement.group_id == group_id).all():
        items.append(
            {
                "type": "settlement",
                "id": s.id,
                "from_member": s.from_member,
                "from_name": name_lookup.get(s.from_member, "?"),
                "to_member": s.to_member,
                "to_name": name_lookup.get(s.to_member, "?"),
                "amount": s.amount,
                "created_at": s.created_at,
                "description": "Settlement",
                "paid_by_name": name_lookup.get(s.from_member, "?"),
            }
        )

    items.sort(key=lambda x: x["created_at"], reverse=True)
    return items[offset : offset + limit]


@app.post("/api/groups/{group_id}/expenses", response_model=schemas.ExpenseResponse)
def add_expense(
    group_id: str,
    payload: schemas.ExpenseCreate,
    background_tasks: BackgroundTasks,
    member: models.Member = Depends(deps.get_current_member),
    db: Session = Depends(get_db),
):
    expense = models.Expense(
        group_id=group_id,
        description=payload.description,
        amount=payload.amount,
        paid_by=payload.paid_by,
        split_type=payload.split_type,
        category=payload.category,
    )
    db.add(expense)
    db.flush()

    balances.process_expense_splits(db, group_id, expense, payload)
    
    db.commit()
    
    # Send push
    members = db.query(models.Member).filter(models.Member.group_id == group_id).all()
    other_user_ids = [m.user_id for m in members if m.user_id and m.id != member.id]
    if other_user_ids:
        group = db.query(models.Group).filter(models.Group.id == group_id).first()
        background_tasks.add_task(send_web_push, other_user_ids, group.name, f"{member.name} added an expense: {payload.description} for {payload.amount}")

    return {"ok": True, "expense_id": expense.id}


@app.put("/api/groups/{group_id}/expenses/{expense_id}", response_model=schemas.BasicResponse)
def update_expense(
    group_id: str,
    expense_id: str,
    payload: schemas.ExpenseCreate,
    member: models.Member = Depends(deps.get_current_member),
    db: Session = Depends(get_db),
):
    expense = db.query(models.Expense).filter(models.Expense.id == expense_id, models.Expense.group_id == group_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    if not member.is_admin and expense.paid_by != member.id:
        raise HTTPException(status_code=403, detail="Only the tab creator or the person who paid can edit this expense")
        
    # Delete old splits
    db.query(models.ExpenseSplit).filter(models.ExpenseSplit.expense_id == expense.id).delete()
    
    # Update fields
    expense.description = payload.description
    expense.amount = payload.amount
    expense.paid_by = payload.paid_by
    expense.category = payload.category
    expense.split_type = payload.split_type
    
    # Recreate splits
    balances.process_expense_splits(db, group_id, expense, payload)
    
    db.commit()
    return {"ok": True}

@app.delete("/api/groups/{group_id}/expenses/{expense_id}", response_model=schemas.BasicResponse)
def delete_expense(
    group_id: str,
    expense_id: str,
    member: models.Member = Depends(deps.get_current_member),
    db: Session = Depends(get_db),
):
    expense = (
        db.query(models.Expense)
        .filter(models.Expense.id == expense_id, models.Expense.group_id == group_id)
        .first()
    )
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    if not member.is_admin and expense.paid_by != member.id:
        raise HTTPException(status_code=403, detail="Only the tab creator or the person who paid can delete this expense")
    db.delete(expense)
    db.commit()
    return {"ok": True}


@app.post("/api/groups/{group_id}/settlements", response_model=schemas.BasicResponse)
def add_settlement(
    group_id: str,
    payload: schemas.SettlementCreate,
    background_tasks: BackgroundTasks,
    member: models.Member = Depends(deps.get_current_member),
    db: Session = Depends(get_db),
):
    valid_ids = {m.id for m in db.query(models.Member).filter(models.Member.group_id == group_id).all()}
    if payload.from_member not in valid_ids or payload.to_member not in valid_ids:
        raise HTTPException(status_code=400, detail="Both people must be in this tab")

    settlement = models.Settlement(
        group_id=group_id, from_member=payload.from_member, to_member=payload.to_member, amount=payload.amount
    )
    db.add(settlement)
    db.commit()
    
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    members = db.query(models.Member).filter(models.Member.group_id == group_id).all()
    other_user_ids = [m.user_id for m in members if m.user_id and m.id != member.id]
    if other_user_ids:
        background_tasks.add_task(send_web_push, other_user_ids, group.name, f"{member.name} recorded a settlement of {payload.amount}")
        
    return {"ok": True}


@app.get("/api/health")
def health():
    return {"status": "ok"}



from fastapi.responses import FileResponse
import os

@app.get("/group-{group_id}", include_in_schema=False)
@app.get("/settings", include_in_schema=False)
@app.get("/new", include_in_schema=False)
def serve_spa():
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))

# Serve the PWA frontend. Registered last so the /api/* routes above always

# take precedence over the static file catch-all.
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(STATIC_DIR):
    app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")

@app.delete("/api/groups/{group_id}/members/{target_member_id}", response_model=schemas.BasicResponse)
def remove_member(
    group_id: str,
    target_member_id: str,
    member: models.Member = Depends(deps.get_current_member),
    db: Session = Depends(get_db),
):
    # Check permissions
    if member.id != target_member_id and not member.is_admin:
        raise HTTPException(status_code=403, detail="You do not have permission to remove this member")
    
    target = db.query(models.Member).filter(models.Member.id == target_member_id, models.Member.group_id == group_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Member not found")
        
    # Check balances
    net = balances.compute_net_balances(db, group_id)
    target_balance = net.get(target_member_id, 0.0)
    
    if abs(target_balance) > 0.01:
        msg = "You cannot leave the tab with an unsettled balance" if member.id == target_member_id else "Cannot remove member with an unsettled balance"
        raise HTTPException(status_code=400, detail=msg)
        
    db.delete(target)
    db.commit()
    return {"ok": True}


@app.put("/api/groups/{group_id}/settlements/{settlement_id}", response_model=schemas.BasicResponse)
def update_settlement(
    group_id: str,
    settlement_id: str,
    payload: schemas.SettlementCreate,
    member: models.Member = Depends(deps.get_current_member),
    db: Session = Depends(get_db),
):
    settlement = db.query(models.Settlement).filter(models.Settlement.id == settlement_id, models.Settlement.group_id == group_id).first()
    if not settlement:
        raise HTTPException(status_code=404, detail="Settlement not found")
    if not member.is_admin and settlement.from_member != member.id and settlement.to_member != member.id:
        raise HTTPException(status_code=403, detail="Only the sender, receiver, or admin can edit this settlement")
    
    settlement.amount = payload.amount
    db.commit()
    return {"ok": True}

@app.delete("/api/groups/{group_id}/settlements/{settlement_id}", response_model=schemas.BasicResponse)
def delete_settlement(
    group_id: str,
    settlement_id: str,
    member: models.Member = Depends(deps.get_current_member),
    db: Session = Depends(get_db),
):
    settlement = db.query(models.Settlement).filter(models.Settlement.id == settlement_id, models.Settlement.group_id == group_id).first()
    if not settlement:
        raise HTTPException(status_code=404, detail="Settlement not found")
    if not member.is_admin and settlement.from_member != member.id and settlement.to_member != member.id:
        raise HTTPException(status_code=403, detail="Only the sender, receiver, or admin can delete this settlement")
        
    db.delete(settlement)
    db.commit()
    return {"ok": True}


@app.post("/api/notifications/subscribe", response_model=schemas.BasicResponse)
def subscribe_push(
    payload: schemas.PushSubscriptionCreate,
    user: models.User = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
):
    # Check if already exists
    sub = db.query(models.PushSubscription).filter_by(user_id=user.id, endpoint=payload.endpoint).first()
    if not sub:
        sub = models.PushSubscription(user_id=user.id, endpoint=payload.endpoint, p256dh=payload.p256dh, auth=payload.auth)
        db.add(sub)
        db.commit()
    return {"ok": True}


def send_web_push(user_ids: list, title: str, body: str):
    from .database import SessionLocal
    db = SessionLocal()
    try:
        vapid_priv = os.environ.get("VAPID_PRIVATE_KEY")
        if not vapid_priv: return
        
        subs = db.query(models.PushSubscription).filter(models.PushSubscription.user_id.in_(user_ids)).all()
        for sub in subs:
            try:
                webpush(
                    subscription_info={"endpoint": sub.endpoint, "keys": {"p256dh": sub.p256dh, "auth": sub.auth}},
                    data=json.dumps({"title": title, "body": body}),
                    vapid_private_key=vapid_priv,
                    vapid_claims={"sub": "mailto:admin@evenly.app"}
                )
            except WebPushException as e:
                if e.response and e.response.status_code in [404, 410]:
                    db.delete(sub)
                    db.commit()
    finally:
        db.close()

@app.get("/api/notifications/vapid-public")
def get_vapid_public():
    return {"public_key": os.environ.get("VAPID_PUBLIC_KEY")}

@app.get("/api/groups/{group_id}/export/csv")
def export_csv(
    group_id: str,
    member: models.Member = Depends(deps.get_current_member),
    db: Session = Depends(get_db)
):
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    members = db.query(models.Member).filter(models.Member.group_id == group_id).all()
    name_lookup = {m.id: m.name for m in members}

    expenses = db.query(models.Expense).filter(models.Expense.group_id == group_id).all()
    settlements = db.query(models.Settlement).filter(models.Settlement.group_id == group_id).all()

    items = []
    for e in expenses:
        items.append({
            "Date": e.created_at.strftime("%Y-%m-%d %H:%M"),
            "Type": "Expense",
            "Category": e.category or "General",
            "Description": e.description,
            "Amount": f"{e.amount:.2f}",
            "Paid By": name_lookup.get(e.paid_by, "?"),
            "Details": f"Split: {e.split_type}"
        })
    for s in settlements:
        items.append({
            "Date": s.created_at.strftime("%Y-%m-%d %H:%M"),
            "Type": "Settlement",
            "Category": "-",
            "Description": "Settlement",
            "Amount": f"{s.amount:.2f}",
            "Paid By": name_lookup.get(s.from_member, "?"),
            "Details": f"Paid to: {name_lookup.get(s.to_member, '?')}"
        })

    items.sort(key=lambda x: x["Date"])

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=["Date", "Type", "Category", "Description", "Amount", "Paid By", "Details"])
    writer.writeheader()
    writer.writerows(items)
    output.seek(0)

    filename = f"{group.name.replace(' ', '_')}_export.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
