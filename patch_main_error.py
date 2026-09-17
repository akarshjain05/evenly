with open("app/main.py", "r") as f:
    content = f.read()

content = content.replace(
    'return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})',
    'return JSONResponse(status_code=500, content={"detail": f"Internal Server Error: {str(exc)}"})'
)

with open("app/main.py", "w") as f:
    f.write(content)
