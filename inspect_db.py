import psycopg2
from psycopg2 import sql

DB_URL = "postgres://landbiznes:landbiznes@localhost:5432/landbiznes"

try:
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()
    
    # Check tables
    cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';")
    tables = cur.fetchall()
    print("Tables:", tables)
    
    # Check columns for 'user' table
    cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'user';")
    columns = cur.fetchall()
    print("\nColumns in 'user' table:", columns)

    conn.close()
except Exception as e:
    print(f"Error: {e}")
