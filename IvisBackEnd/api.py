from flask import Flask
from flask_restful import Resource, Api
from module import get_records
from bson.json_util import dumps
from json import loads
from flask_restful import request
import logging
logging.basicConfig(filename='error.log',level=logging.ERROR)

app = Flask(__name__)
api = Api(app)

def basic_validations(args):

    for k, v in args.items():
        if k not in ['limit', 'offset', 'filter']:
            return False

    try:
        limit = int(args['limit'])

        if limit > 10000:
            logging.error('Limit is too large')
            return False
    except KeyError:
        pass
    except:
        logging.error('Invalid limit')
        return False

    try:
        offset = int(args['offset'])
        if offset < 0:
            logging.error('Invalid offset')
            return False
    except KeyError:
        pass
    except:
        logging.error('Invalid offset')
        return False

    try:
        loads(args.get('filter', "{}"))
    except:
        logging.error('Invalid filter')
        return False

    return True


class CurrentPositionRecords(Resource):
    def get(self):
        filters = {}
        args = request.args
        if not basic_validations(args):
            return {}, 401

        limit = int(args.get('limit', 500))
        offset = int(args.get('offset', 0))
        filters = loads(args.get('filter', "{}"))
        records = get_records('current_position', filters, offset, limit)
        if records is None:
            return {}, 401

        return dumps(records)

class HistPositionRecords(Resource):
    def get(self):
        filters = {}

        args = request.args
        if not basic_validations(args):
            return {}, 401

        limit = int(args.get('limit', 500))
        offset = int(args.get('offset', 0))
        filters = loads(args.get('filter', "{}"))
        records = get_records('hist_position', filters, offset, limit)
        if records is None:
            return {}, 401

        return dumps(records)

class Insync2018(Resource):
    def get(self):
        filters = {}

        args = request.args
        if not basic_validations(args):
            return {}, 401

        limit = int(args.get('limit', 500))
        offset = int(args.get('offset', 0))
        filters = loads(args.get('filter', "{}"))
        records = get_records('insyn_2018', filters, offset, limit)
        if records is None:
            return {}, 401

        return dumps(records)

class Insync1991(Resource):
    def get(self):
        filters = {}
        args = request.args
        if not basic_validations(args):
            return {}, 401

        limit = int(args.get('limit', 500))
        offset = int(args.get('offset', 0))
        filters = loads(args.get('filter', "{}"))
        records = get_records('insyn_1991', filters, offset, limit)
        if records is None:
            return {}, 401

        return dumps(records)

class Instrumenmt(Resource):
    def get(self):
        filters = {}
        args = request.args
        if not basic_validations(args):
            return {}, 401

        limit = int(args.get('limit', 500))
        offset = int(args.get('offset', 0))
        filters = loads(args.get('filter', "{}"))
        records = get_records('instruments', filters, offset, limit)
        if records is None:
            return {}, 401

        return dumps(records)




api.add_resource(CurrentPositionRecords, '/currentPosition/')
api.add_resource(HistPositionRecords, '/histPosition/')
api.add_resource(Insync2018, '/insync2018/')
api.add_resource(Insync1991, '/insync1991/')
api.add_resource(Instrumenmt, '/instruments/')

if __name__ == '__main__':
    app.run(debug=True, port=5000, host='0.0.0.0')
