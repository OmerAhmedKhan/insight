from pymongo import MongoClient
from pprint import pprint
import pandas as pd


mongo_url = "mongodb+srv://master:team10Ivis@cluster0-2cmky.mongodb.net/test?retryWrites=true"
client = MongoClient(mongo_url)

db = client.insight

queries = {
        "publication_date": float('nan'),
        "lei_code": float('nan'),
        "position": float('nan'),
        "relative": float('nan'),
        "correction": float('nan'),
        "correction_description": float('nan'),
        "first_time_reporting": float('nan'),
        "trade": float('nan'),
        "security_type": float('nan'),
        "security_name": float('nan'),
        "isin": float('nan'),
        "transaction_date": float('nan'),
        "volume": float('nan'),
        "unit": float('nan'),
        "price": float('nan'),
        "currency": float('nan'),
        "marketplace": float('nan'),
        "Status": float('nan'),
        "connected_to_securities_program":  float('nan'),
}

errors = []
for k, v in queries.items():
    rec = db['insyn_2018'].find({k:v})
    try:
        db['insyn_2018'].update_many({k:v}, {'$set': {k: ""}})
    except Exception as e:
        print(e)
        errors.extend(list(rec))


print(errors)