with open("app/services/group_service.py", "r") as f:
    content = f.read()

content = content.replace(
    "split_type=payload.split_type,",
    "split_type=models.SplitType(payload.split_type),"
)

with open("app/services/group_service.py", "w") as f:
    f.write(content)
