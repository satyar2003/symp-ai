import database

conn = database.get_db()
cursor = conn.cursor()

cursor.execute("SELECT id, title FROM conversations")
rows = cursor.fetchall()
for row in rows:
    print(dict(row))