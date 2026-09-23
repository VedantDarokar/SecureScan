import logging
from pymongo import MongoClient, ASCENDING
import mongomock
from app.core.config import settings

logger = logging.getLogger(__name__)

def create_mongo_client():
    uri = settings.MONGO_URI
    db_name = settings.MONGO_DB_NAME

    try:
        # Test connection with 8 second timeout for cloud Atlas / local MongoDB
        client = MongoClient(uri, serverSelectionTimeoutMS=8000)
        client.admin.command('ping')
        logger.info(f"Connected successfully to MongoDB at: {uri} (Database: {db_name})")
        return client, client[db_name]
    except Exception as e:
        logger.warning(
            f"Could not connect to MongoDB at '{uri}' ({e}). "
            "Falling back to in-memory Mock MongoDB (mongomock) for zero-friction local development."
        )
        mock_client = mongomock.MongoClient()
        return mock_client, mock_client[db_name]

_client, db = create_mongo_client()

# Collections
users_col = db["users"]
scans_col = db["scans"]
counters_col = db["counters"]

# Ensure unique index on email
try:
    users_col.create_index([("email", ASCENDING)], unique=True)
    scans_col.create_index([("id", ASCENDING)], unique=True)
except Exception:
    pass

def get_db():
    """Dependency / accessor for MongoDB database instance."""
    return db

def get_next_id(sequence_name: str) -> int:
    """Generates sequential integer IDs (1, 2, 3...) for user-friendly URL routes."""
    ret = counters_col.find_one_and_update(
        {"_id": sequence_name},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True
    )
    if ret and "seq" in ret:
        return int(ret["seq"])
    
    # Fallback counter calculation if find_one_and_update differs in mock
    doc = counters_col.find_one({"_id": sequence_name})
    if not doc:
        counters_col.insert_one({"_id": sequence_name, "seq": 1})
        return 1
    new_val = doc.get("seq", 0) + 1
    counters_col.update_one({"_id": sequence_name}, {"$set": {"seq": new_val}})
    return new_val
