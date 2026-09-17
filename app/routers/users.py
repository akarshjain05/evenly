from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select

from app import models, schemas, deps
from app.database import get_db

router = APIRouter(prefix='/api/users', tags=['users'])

@router.get("/me")
async def get_me(user: models.User = Depends(deps.get_current_user)):
    return {"id": user.id, "email": user.email}

@router.get("/me/groups", response_model=list[schemas.MembershipResponse])
async def get_my_groups(user: models.User = Depends(deps.get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(models.Member).options(selectinload(models.Member.group)).filter(models.Member.user_id == user.id)
    )
    members = result.scalars().all()
    return [
        {
            "group": {"id": m.group.id, "name": m.group.name, "invite_code": m.group.invite_code},
            "member": {"id": m.id, "name": m.name, "color": m.color}
        }
        for m in members
    ]

