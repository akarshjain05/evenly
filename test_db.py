import sqlite3
conn = sqlite3.connect('evenly.db')
cursor = conn.cursor()
cursor.execute("SELECT * FROM members;")
print(cursor.fetchall())
