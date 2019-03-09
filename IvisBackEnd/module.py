from pymongo import MongoClient
from pprint import pprint

import logging
logging.basicConfig(filename='error.log',level=logging.ERROR)
mongo_url = "mongodb+srv://master:team10Ivis@cluster0-2cmky.mongodb.net/test?retryWrites=true"
client = MongoClient(mongo_url)

db = client.insight

collections = ['current_position', 'hist_position', 'insyn_1991', 'insyn_2018', 'instruments']

def get_records(collection, filter, offset=0, limit=500):

    if collection not in collection:
        logging.error('Collection not found')
        return None

    if not isinstance(filter, dict):
        logging.error('Wrong filter format')
        return None

    try:
        records = db[collection].find(filter=filter, projection={'_id': False}, skip=offset, limit=limit)
    except:
        logging.exception('ERROR')
        return None

    return list(records)

def get_uniquie_names():
    unique_records = []
    try:
        records = db['insyn_1991'].find({}).distinct('issuer')
    except:
        logging.exception('ERROR')
        return None

    unique_records.extend(list(records))
    try:
        records = db['insyn_2018'].find({}).distinct('Issuer')
    except:
        logging.exception('ERROR')
        return None

    unique_records.extend(records)
    return list(unique_records)