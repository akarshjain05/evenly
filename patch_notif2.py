with open("app/routers/notifications.py", "r") as f:
    content = f.read()

def_send_notif = "async def send_web_push(user_ids: list, title: str, body: str):"
new_send_notif = "async def send_web_push(user_ids: list, title: str, body: str):\n    from pywebpush import webpush, WebPushException\n"

content = content.replace(def_send_notif, new_send_notif)

with open("app/routers/notifications.py", "w") as f:
    f.write(content)
