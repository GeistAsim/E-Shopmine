import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

DB_USER = os.getenv("Mongo_DB_USER")
DB_PASS = os.getenv("Mongo_DB_PASS")
DB_HOST = os.getenv("Mongo_DB_HOST")
DB_DEBUG = os.getenv("Mongo_DB_DEBUG")

try:
    client = f"mongodb+srv://{DB_USER}:{DB_PASS}@{DB_HOST}"
    conn = MongoClient(client)
except Exception as e:
    print("MongoDB Error!")
    print(e)
