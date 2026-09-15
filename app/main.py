import os
import random
from sqlalchemy.exc import IntegrityError, OperationalError
import logging
import time
from fastapi.responses import JSONResponse
from fastapi import Request

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session, selectinload

from . import balances, models, schemas, auth, deps
from fastapi.security import OAuth2PasswordRequestForm
from .database import Base, engine, get_db

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Evenly API")

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

            member = models.Member(group_id=group.id, user_id=user.id, name=payload.your_name, color=pick_color())
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
                "amount": e.amount,
                "paid_by": e.paid_by,
                "paid_by_name": name_lookup.get(e.paid_by, "?"),
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
    member: models.Member = Depends(deps.get_current_member),
    db: Session = Depends(get_db),
):
    expense = models.Expense(
        group_id=group_id,
        description=payload.description,
        amount=payload.amount,
        paid_by=payload.paid_by,
        split_type=payload.split_type,
    )
    db.add(expense)
    db.flush()

    balances.process_expense_splits(db, group_id, expense, payload)
    
    db.commit()
    return {"ok": True, "expense_id": expense.id}


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
    db.delete(expense)
    db.commit()
    return {"ok": True}


@app.post("/api/groups/{group_id}/settlements", response_model=schemas.BasicResponse)
def add_settlement(
    group_id: str,
    payload: schemas.SettlementCreate,
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
    return {"ok": True}


@app.get("/api/health")
def health():
    return {"status": "ok"}


# Serve the PWA frontend. Registered last so the /api/* routes above always
# take precedence over the static file catch-all.
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(STATIC_DIR):
    app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")
