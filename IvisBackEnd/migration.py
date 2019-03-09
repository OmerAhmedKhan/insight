## Migration
## Change mixed case to upper case for Insync2018

from pymongo import MongoClient
from pprint import pprint

mongo_url = "mongodb+srv://master:team10Ivis@cluster0-2cmky.mongodb.net/test?retryWrites=true"
client = MongoClient(mongo_url)

db = client.insight


records = db['insyn_2018'].find()

for record in records:
    issuer_name = record.get('Issuer')
    if issuer_name:
        issuer_name_uc = issuer_name.upper()

    try:
        db['insyn_2018'].update_one({'_id': record.get('_id')}, {'$set':{'Issuer': issuer_name_uc}})
    except Exception as e:
        print(e)

