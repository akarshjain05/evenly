import os

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from . import balances, models, schemas
from .database import Base, engine, get_db

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Evenly API")

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


def pick_color(index: int) -> str:
    return PALETTE[index % len(PALETTE)]


def get_current_member(
    group_id: str,
    x_member_id: str = Header(...),
    x_member_secret: str = Header(...),
    db: Session = Depends(get_db),
) -> models.Member:
    member = (
        db.query(models.Member)
        .filter(models.Member.id == x_member_id, models.Member.group_id == group_id)
        .first()
    )
    if not member or member.secret != x_member_secret:
        raise HTTPException(status_code=401, detail="Not recognized as a member of this tab")
    return member


def member_out(m: models.Member, net: dict) -> dict:
    return {"id": m.id, "name": m.name, "color": m.color, "balance": net.get(m.id, 0.0)}


@app.post("/api/groups")
def create_group(payload: schemas.GroupCreate, db: Session = Depends(get_db)):
    group = models.Group(name=payload.name)
    db.add(group)
    db.flush()

    member = models.Member(group_id=group.id, name=payload.your_name, color=pick_color(0))
    db.add(member)
    db.commit()
    db.refresh(group)
    db.refresh(member)

    return {
        "group": {"id": group.id, "name": group.name, "invite_code": group.invite_code},
        "member": {"id": member.id, "name": member.name, "secret": member.secret, "color": member.color},
    }


@app.get("/api/groups/by-code/{invite_code}")
def preview_group(invite_code: str, db: Session = Depends(get_db)):
    group = db.query(models.Group).filter(models.Group.invite_code == invite_code).first()
    if not group:
        raise HTTPException(status_code=404, detail="No tab found for that code")
    return {"id": group.id, "name": group.name, "member_count": len(group.members)}


@app.post("/api/groups/by-code/{invite_code}/join")
def join_group(invite_code: str, payload: schemas.JoinRequest, db: Session = Depends(get_db)):
    group = db.query(models.Group).filter(models.Group.invite_code == invite_code).first()
    if not group:
        raise HTTPException(status_code=404, detail="No tab found for that code")

    member = models.Member(group_id=group.id, name=payload.name, color=pick_color(len(group.members)))
    db.add(member)
    db.commit()
    db.refresh(member)

    return {
        "group": {"id": group.id, "name": group.name, "invite_code": group.invite_code},
        "member": {"id": member.id, "name": member.name, "secret": member.secret, "color": member.color},
    }


@app.get("/api/groups/{group_id}")
def get_group(group_id: str, member: models.Member = Depends(get_current_member), db: Session = Depends(get_db)):
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


@app.get("/api/groups/{group_id}/activity")
def get_activity(group_id: str, member: models.Member = Depends(get_current_member), db: Session = Depends(get_db)):
    members = db.query(models.Member).filter(models.Member.group_id == group_id).all()
    name_lookup = {m.id: m.name for m in members}

    items = []
    for e in db.query(models.Expense).filter(models.Expense.group_id == group_id).all():
        items.append(
            {
                "type": "expense",
                "id": e.id,
                "description": e.description,
                "amount": e.amount,
                "paid_by": e.paid_by,
                "paid_by_name": name_lookup.get(e.paid_by, "?"),
                "created_at": e.created_at.isoformat(),
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
                "created_at": s.created_at.isoformat(),
            }
        )

    items.sort(key=lambda x: x["created_at"], reverse=True)
    return items


@app.post("/api/groups/{group_id}/expenses")
def add_expense(
    group_id: str,
    payload: schemas.ExpenseCreate,
    member: models.Member = Depends(get_current_member),
    db: Session = Depends(get_db),
):
    valid_ids = {m.id for m in db.query(models.Member).filter(models.Member.group_id == group_id).all()}
    if payload.paid_by not in valid_ids:
        raise HTTPException(status_code=400, detail="Payer is not in this tab")

    expense = models.Expense(
        group_id=group_id,
        description=payload.description,
        amount=payload.amount,
        paid_by=payload.paid_by,
        split_type=payload.split_type,
    )
    db.add(expense)
    db.flush()

    splits: list[models.ExpenseSplit] = []

    if payload.split_type == "equal":
        participants = [p for p in (payload.participant_ids or list(valid_ids)) if p in valid_ids]
        if not participants:
            raise HTTPException(status_code=400, detail="Pick at least one person to split with")
        share = round(payload.amount / len(participants), 2)
        remainder = round(payload.amount - share * len(participants), 2)
        for i, pid in enumerate(participants):
            amt = share + (remainder if i == 0 else 0)
            splits.append(models.ExpenseSplit(expense_id=expense.id, member_id=pid, share_amount=round(amt, 2)))

    elif payload.split_type == "exact":
        if not payload.splits:
            raise HTTPException(status_code=400, detail="Exact split needs an amount per person")
        total = round(sum(s.value for s in payload.splits), 2)
        if abs(total - payload.amount) > 0.02:
            raise HTTPException(status_code=400, detail=f"Splits add up to {total}, not {payload.amount}")
        for s in payload.splits:
            if s.member_id not in valid_ids:
                raise HTTPException(status_code=400, detail="Split includes someone outside this tab")
            splits.append(models.ExpenseSplit(expense_id=expense.id, member_id=s.member_id, share_amount=round(s.value, 2)))

    elif payload.split_type == "percentage":
        if not payload.splits:
            raise HTTPException(status_code=400, detail="Percentage split needs a % per person")
        total_pct = round(sum(s.value for s in payload.splits), 2)
        if abs(total_pct - 100) > 0.5:
            raise HTTPException(status_code=400, detail=f"Percentages add up to {total_pct}%, not 100%")
        for s in payload.splits:
            if s.member_id not in valid_ids:
                raise HTTPException(status_code=400, detail="Split includes someone outside this tab")
            amt = round(payload.amount * s.value / 100, 2)
            splits.append(models.ExpenseSplit(expense_id=expense.id, member_id=s.member_id, share_amount=amt))

    for split in splits:
        db.add(split)
    db.commit()
    return {"ok": True, "expense_id": expense.id}


@app.delete("/api/groups/{group_id}/expenses/{expense_id}")
def delete_expense(
    group_id: str,
    expense_id: str,
    member: models.Member = Depends(get_current_member),
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


@app.post("/api/groups/{group_id}/settlements")
def add_settlement(
    group_id: str,
    payload: schemas.SettlementCreate,
    member: models.Member = Depends(get_current_member),
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
