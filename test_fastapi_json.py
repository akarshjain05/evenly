import asyncio
from fastapi.encoders import jsonable_encoder
from app.models import SplitType

print(jsonable_encoder({"type": SplitType.equal}))
