import psycopg2

DB_URL = "postgres://landbiznes:landbiznes@localhost:5432/landbiznes"

try:
    conn = psycopg2.connect(DB_URL)
    conn.autocommit = True
    cur = conn.cursor()
    
    print("Adding 'role' column to 'user' table...")
    cur.execute('ALTER TABLE "user" ADD COLUMN "role" TEXT DEFAULT \'user\';')
    print("Column added successfully!")
    
    conn.close()
except Exception as e:
    print(f"Error: {e}")
