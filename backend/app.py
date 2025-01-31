from flask import Flask, request, jsonify
from pymongo import MongoClient
from datetime import datetime, timedelta
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

client = MongoClient("mongodb://localhost:27017/")
db = client.Home_Inventory
items_collection = db.items

@app.route('/items', methods=['GET', 'POST'])
def manage_items():
    if request.method == 'POST':
        item = request.json
        print(f"Received item: {item}")  # Debugging statement
        try:
            if 'expiration_date' in item and item['expiration_date']:
                item['expiration_date'] = datetime.strptime(item['expiration_date'], '%Y-%m-%d')
            else:
                item['expiration_date'] = None
            items_collection.insert_one(item)
            print("Item inserted into the database")  # Debugging statement
            return jsonify({"msg": "Item added!"}), 201
        except Exception as e:
            print(f"Error: {e}")  # Debugging statement
            return jsonify({"msg": "Error adding item!"}), 500
    
    items = list(items_collection.find({}, {'_id': 0}))
    print(f"Items in database: {items}")  # Debugging statement
    return jsonify(items), 200

@app.route('/items/update', methods=['PATCH'])
def update_item():
    data = request.json
    item_name = data['name']
    new_quantity = data['quantity']
    
    item = items_collection.find_one({'name': item_name})
    if item:
        items_collection.update_one({'name': item_name}, {'$set': {'quantity': new_quantity}})
        return jsonify({"msg": "Item updated!"}), 200
    return jsonify({"msg": "Item not found!"}), 404

@app.route('/items/delete', methods=['DELETE'])
def delete_item():
    data = request.json
    item_name = data['name']
    
    result = items_collection.delete_one({'name': item_name})
    if result.deleted_count > 0:
        return jsonify({"msg": "Item deleted!"}), 200
    return jsonify({"msg": "Item not found!"}), 404

@app.route('/items/threshold', methods=['GET'])
def check_threshold():
    threshold_items = list(items_collection.find({'quantity': {'$lt': 5}}, {'_id': 0}))
    return jsonify(threshold_items), 200

if __name__ == '__main__':
    app.run(debug=True)
