import json

with open('vercel.json', 'r') as f:
    config = json.load(f)

if "github" in config:
    del config["github"]

with open('vercel.json', 'w') as f:
    json.dump(config, f, indent=2)
