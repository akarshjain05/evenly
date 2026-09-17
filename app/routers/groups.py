from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Request
from fastapi.responses import JSONResponse, FileResponse, StreamingResponse
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import text
from typing import List, Dict, Any
import os
import io
import csv
import json
import time

from app import models, schemas, deps, auth, balances
from app.database import get_db
from sqlalchemy.exc import IntegrityError
import random

PALETTE = ["#B4863A", "#4F7D5A", "#A8483A", "#5C7A8A", "#8A5C7A", "#7A8A4F"]

def pick_color() -> str:
    return random.choice(PALETTE)

router = APIRouter(prefix='/api/groups', tags=['groups'])

from app.routers.notifications import send_web_push
def member_out(m: models.Member, net: dict) -> dict:
    return {'id': m.id, 'name': m.name, 'color': m.color, 'balance': net.get(m.id, 0.0)}
@router.post("", response_model=schemas.CreateJoinResponse)
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

@router.get("/by-code/{invite_code}")
def preview_group(invite_code: str, db: Session = Depends(get_db)):
    group = db.query(models.Group).filter(models.Group.invite_code == invite_code).first()
    if not group:
        raise HTTPException(status_code=404, detail="No tab found for that code")
    return {"id": group.id, "name": group.name, "member_count": len(group.members)}

@router.post("/by-code/{invite_code}/join", response_model=schemas.CreateJoinResponse)
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

@router.get("/{group_id}", response_model=schemas.GroupDetailResponse)
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

@router.put("/{group_id}", response_model=schemas.BasicResponse)
def update_group(group_id: str, payload: schemas.GroupUpdate, member: models.Member = Depends(deps.get_current_member), db: Session = Depends(get_db)):
    if not member.is_admin:
        raise HTTPException(status_code=403, detail="Only the tab creator can edit tab settings")
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Tab not found")
    group.name = payload.name
    db.commit()
    return {"ok": True}

@router.delete("/{group_id}", response_model=schemas.BasicResponse)
def delete_group(group_id: str, member: models.Member = Depends(deps.get_current_member), db: Session = Depends(get_db)):
    if not member.is_admin:
        raise HTTPException(status_code=403, detail="Only the tab creator can delete this tab")
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Tab not found")
    db.delete(group)
    db.commit()
    return {"ok": True}

@router.get("/{group_id}/activity", response_model=list[schemas.ActivityResponse])
def get_activity(
    group_id: str, 
    limit: int = 50, 
    offset: int = 0, 
    member: models.Member = Depends(deps.get_current_member), 
    db: Session = Depends(get_db)
):
    members = db.query(models.Member).filter(models.Member.group_id == group_id).all()
    name_lookup = {m.id: m.name for m in members}

    # Fetch the union of expenses and settlements ordered by created_at DESC with limit/offset
    query = text("""
        SELECT 'expense' as type, id, created_at FROM expenses WHERE group_id = :group_id
        UNION ALL
        SELECT 'settlement' as type, id, created_at FROM settlements WHERE group_id = :group_id
        ORDER BY created_at DESC
        LIMIT :limit OFFSET :offset
    """)
    results = db.execute(query, {"group_id": group_id, "limit": limit, "offset": offset}).fetchall()

    expense_ids = [r.id for r in results if r.type == 'expense']
    settlement_ids = [r.id for r in results if r.type == 'settlement']

    expenses_map = {}
    if expense_ids:
        expenses = (
            db.query(models.Expense)
            .options(selectinload(models.Expense.splits))
            .filter(models.Expense.id.in_(expense_ids))
            .all()
        )
        expenses_map = {e.id: e for e in expenses}

    settlements_map = {}
    if settlement_ids:
        settlements = db.query(models.Settlement).filter(models.Settlement.id.in_(settlement_ids)).all()
        settlements_map = {s.id: s for s in settlements}

    items = []
    for row in results:
        if row.type == 'expense':
            e = expenses_map.get(row.id)
            if not e: continue
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
        elif row.type == 'settlement':
            s = settlements_map.get(row.id)
            if not s: continue
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

    return items

@router.post("/{group_id}/expenses", response_model=schemas.ExpenseResponse)
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
    db.flush()
    balances.apply_expense(db, expense)
    db.commit()
    
    # Send push
    members = db.query(models.Member).filter(models.Member.group_id == group_id).all()
    other_user_ids = [m.user_id for m in members if m.user_id and m.id != member.id]
    if other_user_ids:
        group = db.query(models.Group).filter(models.Group.id == group_id).first()
        background_tasks.add_task(send_web_push, other_user_ids, group.name, f"{member.name} added an expense: {payload.description} for {payload.amount}")

    return {"ok": True, "expense_id": expense.id}

@router.put("/{group_id}/expenses/{expense_id}", response_model=schemas.BasicResponse)
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
        
    # Revert old balance impact
    db.flush() # ensure old expense object has splits
    balances.revert_expense(db, expense)
    
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
    db.flush()
    
    # Apply new balance impact
    balances.apply_expense(db, expense)
    
    db.commit()
    return {"ok": True}

@router.delete("/{group_id}/expenses/{expense_id}", response_model=schemas.BasicResponse)
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
    balances.revert_expense(db, expense)
    db.delete(expense)
    db.commit()
    return {"ok": True}

@router.post("/{group_id}/settlements", response_model=schemas.BasicResponse)
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
    balances.apply_settlement(db, settlement)
    db.commit()
    
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    members = db.query(models.Member).filter(models.Member.group_id == group_id).all()
    other_user_ids = [m.user_id for m in members if m.user_id and m.id != member.id]
    if other_user_ids:
        background_tasks.add_task(send_web_push, other_user_ids, group.name, f"{member.name} recorded a settlement of {payload.amount}")
        
    return {"ok": True}

@router.delete("/{group_id}/members/me", response_model=schemas.BasicResponse)
def leave_group(
    group_id: str,
    member: models.Member = Depends(deps.get_current_member),
    db: Session = Depends(get_db),
):
    return remove_member(group_id, member.id, member, db)

@router.delete("/{group_id}/members/{target_member_id}", response_model=schemas.BasicResponse)
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

@router.put("/{group_id}/settlements/{settlement_id}", response_model=schemas.BasicResponse)
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

@router.delete("/{group_id}/settlements/{settlement_id}", response_model=schemas.BasicResponse)
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
        
    balances.revert_settlement(db, settlement)
    db.delete(settlement)
    db.commit()
    return {"ok": True}

@router.get("/{group_id}/export/csv")
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
