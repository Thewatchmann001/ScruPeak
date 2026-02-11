import psycopg2
import os
import sys

# DATABASE_URL=postgres://landbiznes:landbiznes@localhost:5432/landbiznes
DB_URL = "postgres://landbiznes:landbiznes@localhost:5432/landbiznes"

print(f"Connecting to {DB_URL}...")
try:
    conn = psycopg2.connect(DB_URL)
    print("Connected successfully!")
    cur = conn.cursor()
    cur.execute("SELECT 1;")
    print(f"Query result: {cur.fetchone()}")
    conn.close()
except Exception as e:
    print(f"Connection failed: {e}")
