import sqlite3
conn = sqlite3.connect("evenly.db")
c = conn.cursor()
c.execute("SELECT is_deleted FROM expenses LIMIT 1")
print(c.fetchone())
