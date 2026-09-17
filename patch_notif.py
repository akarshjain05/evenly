with open("app/routers/notifications.py", "r") as f:
    content = f.read()

# Remove top level import
content = content.replace("from pywebpush import webpush, WebPushException\n", "")

# We need to find where webpush is used and inject the import
def_send_notif = "async def _send_web_push(subscription_info: str, payload: str):"
new_send_notif = "async def _send_web_push(subscription_info: str, payload: str):\n    from pywebpush import webpush, WebPushException\n"

content = content.replace(def_send_notif, new_send_notif)

with open("app/routers/notifications.py", "w") as f:
    f.write(content)
