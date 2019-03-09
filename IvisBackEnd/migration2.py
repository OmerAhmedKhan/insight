from pymongo import MongoClient
from pprint import pprint
import pandas as pd


mongo_url = "mongodb+srv://master:team10Ivis@cluster0-2cmky.mongodb.net/test?retryWrites=true"
client = MongoClient(mongo_url)

db = client.insight

# {
#     "publication_date": "12/29/2018 14:02:59",
#     "Issuer": "DISTIT AB (PUBL)",
#     "lei_code": "213800CGP4AKXSLWWS08",
#     "alias_reporter": 25247,
#     "alias_pdmr": 29442,
#     "position": "Styrelseledamot/suppleant",
#     "relative": "Ja",
#     "correction": "",
#     "correction_description": "",
#     "first_time_reporting": "Ja",
#     "connected_to_securities_program": "",
#     "trade": "Förvärv",
#     "security_type": "Aktie",
#     "security_name": "DistIt",
#     "isin": "SE0003883800",
#     "transaction_date": "12/28/2018 00:00:00",
#     "volume": 614,
#     "unit": "Antal",
#     "price": 34.47,
#     "currency": "SEK",
#     "marketplace": "FIRST NORTH SWEDEN",
#     "Status": "Aktuell"
# }

df = pd.read_csv('insight_2017.csv')
missed_data = []
count = 0
for index, row in df.iterrows():
    data = {
        "publication_date":row.get("publication_date", ""),
        "Issuer":row.get("Issuer", "").upper(),
        "lei_code":row.get("lei_code", ""),
        "alias_reporter":row.get("alias_reporter"),
        "alias_pdmr":row.get("alias_pdmr"),
        "position":row.get("position", ""),
        "relative":row.get("relative", ""),
        "correction":row.get("correction", ""),
        "correction_description":row.get("correction_description", ""),
        "first_time_reporting":row.get("first_time_reporting", ""),
        "connected_to_securities_program":row.get("connected_to_securities_program", ""),
        "trade":row.get("trade", ""),
        "security_type":row.get("security_type", ""),
        "security_name":row.get("security_name", ""),
        "isin":row.get("isin", ""),
        "transaction_date":row.get("transaction_date", ""),
        "volume":row.get("volume"),
        "unit":row.get("unit", ""),
        "price":row.get("price"),
        "currency":row.get("currency", ""),
        "marketplace":row.get("Marketplace", ""),
        "Status":row.get("status", "")
    }

    try:
        db['insyn_2018'].insert_one(data)
        count+=1
        print(count)
    except Exception as e:
        print(Exception)
        missed_data.append(data)

