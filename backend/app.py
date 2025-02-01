from flask import Flask, request, jsonify, render_template
from pymongo import MongoClient
from datetime import datetime
from flask_cors import CORS
import bcrypt

app = Flask(__name__, static_folder="../frontend/static", template_folder="../frontend/templates")
CORS(app)

client = MongoClient("mongodb://localhost:27017/")
db = client.Home_Inventory  # Ensure consistent case
items_collection = db.items
users_collection = db.users

MAX_USERS = 5

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/register', methods=['POST'])
def register():
    user = request.json
    if users_collection.count_documents({}) >= MAX_USERS:
        return jsonify({"msg": "User limit reached!"}), 400

    hashed_pw = bcrypt.hashpw(user['password'].encode('utf-8'), bcrypt.gensalt())
    user['password'] = hashed_pw
    users_collection.insert_one(user)
    return jsonify({"msg": "User registered!"}), 201

@app.route('/login', methods=['POST'])
def login():
    user = request.json
    db_user = users_collection.find_one({'username': user['username']})
    if db_user and bcrypt.checkpw(user['password'].encode('utf-8'), db_user['password']):
        return jsonify({"msg": "Login successful!"}), 200
    return jsonify({"msg": "Invalid credentials!"}), 401

@app.route('/items', methods=['GET', 'POST'])
def manage_items():
    if request.method == 'POST':
        item = request.json
        try:
            existing_item = items_collection.find_one({'name': item['name']})
            if existing_item:
                new_quantity = existing_item['quantity'] + item['quantity']
                items_collection.update_one(
                    {'name': item['name']},
                    {'$set': {'quantity': new_quantity, 'expiration_date': item['expiration_date']}}
                )
                return jsonify({"msg": "Item updated!"}), 200
            else:
                if 'expiration_date' in item and item['expiration_date']:
                    item['expiration_date'] = datetime.strptime(item['expiration_date'], '%Y-%m-%d')
                else:
                    item['expiration_date'] = None
                items_collection.insert_one(item)
                return jsonify({"msg": "Item added!"}), 201
        except Exception as e:
            return jsonify({"msg": f"Error: {e}"}), 500

    items = list(items_collection.find({}, {'_id': 0}).sort("name", 1))
    return jsonify(items), 200

@app.route('/existing_items', methods=['GET'])
def get_existing_items():
    items = list(items_collection.find({}, {'_id': 0, 'name': 1, 'measurement_unit': 1, 'threshold': 1}).sort("name", 1))
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

@app.route('/shopping_list', methods=['GET'])
def get_shopping_list():
    items = list(items_collection.find({}, {'_id': 0}))
    shopping_list = []

    for item in items:
        if item['quantity'] <= 0 or item['quantity'] <= item['threshold']:
            shopping_list.append(item)
        elif item['expiration_date']:
            today = datetime.now()
            expiration_date = item['expiration_date']
            time_to_expire = (expiration_date - today).days

            if time_to_expire < 14:
                shopping_list.append(item)

    shopping_list.sort(key=lambda x: x['quantity'])
    shopping_list = [{'index': i + 1, 'name': item['name']} for i, item in enumerate(shopping_list)]
    
    return jsonify(shopping_list), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
