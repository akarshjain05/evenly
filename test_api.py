import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url = "https://evenly-eight.vercel.app/api/groups/7609908e44da4247b9e3309737e9a9e9"
req = urllib.request.Request(url)
# But I need auth token!
