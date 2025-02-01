document.getElementById('login').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    console.log(`Login attempt: ${username}, ${password}`); // Debugging statement

    fetch('http://10.0.0.89:5000/login', {  // Make sure the URL uses the laptop's IP
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => {
        console.log(`Response status: ${response.status}`); // Debugging statement
        return response.json()
    })
    .then(data => {
        const loginMessage = document.getElementById('loginMessage');
        if (data.msg === "Login successful!") {
            console.log('Login successful'); // Debugging statement
            document.getElementById('loginForm').style.display = 'none';
            document.getElementById('itemForm').style.display = 'block';
            document.getElementById('shoppingList').style.display = 'none';
            loadItems();  // Ensure items load after login
            loadShoppingList();
            loadExistingItems();  // Load existing items for dropdown
        } else {
            console.log(`Login error: ${data.msg}`); // Debugging statement
            loginMessage.textContent = data.msg;
        }
    })
    .catch(error => console.error(`Error: ${error}`)); // Debugging statement
});

document.getElementById('register').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const registerMessage = document.getElementById('registerMessage');

    if (password !== confirmPassword) {
        registerMessage.textContent = "Passwords do not match!";
        return;
    }

    console.log(`Register attempt: ${username}, ${password}`); // Debugging statement

    fetch('http://10.0.0.89:5000/register', {  // Make sure the URL uses the laptop's IP
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => {
        console.log(`Response status: ${response.status}`); // Debugging statement
        return response.json();
    })
    .then(data => {
        if (data.msg === "User registered!") {
            console.log('Registration successful'); // Debugging statement
            showLoginForm();
            registerMessage.textContent = "Registration successful! Please log in.";
        } else {
            console.log(`Registration error: ${data.msg}`); // Debugging statement
            registerMessage.textContent = data.msg;
        }
    })
    .catch(error => console.error(`Error: ${error}`)); // Debugging statement
});

document.getElementById('itemForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const name = document.getElementById('name').value;
    const quantity = document.getElementById('quantity').value;
    const measurement_unit = document.getElementById('measurement_unit').value;
    const threshold = document.getElementById('threshold').value;
    const expiration_date = document.getElementById('expiration_date').value;

    fetch('http://10.0.0.89:5000/items', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, quantity: parseFloat(quantity), measurement_unit, threshold: parseFloat(threshold), expiration_date })
    })
    .then(response => {
        console.log(`Response status: ${response.status}`);
        return response.json();
    })
    .then(data => {
        console.log(data);
        clearForm();
        loadItems();
        loadShoppingList();
        loadExistingItems();  // Reload existing items for dropdown
    })
    .catch(error => console.error(`Error: ${error}`));
});

function clearForm() {
    document.getElementById('name').value = '';
    document.getElementById('quantity').value = '';
    document.getElementById('measurement_unit').value = '';
    document.getElementById('threshold').value = '';
    document.getElementById('expiration_date').value = '';
}

function loadItems() {
    fetch('http://10.0.0.89:5000/items')
    .then(response => {
        console.log(`Response status: ${response.status}`);
        return response.json();
    })
    .then(items => {
        const itemsTableBody = document.getElementById('items');
        itemsTableBody.innerHTML = '';
        items.forEach(item => {
            const row = document.createElement('tr');
            console.log(`Item: ${item.name}, Quantity: ${item.quantity}, Threshold: ${item.threshold}`);

            let rowClass = 'white';

            if (item.quantity <= 0) {
                rowClass = 'red';
            } else if (item.quantity <= item.threshold) {
                rowClass = 'yellow';
            }

            if (item.expiration_date) {
                const today = new Date();
                const expirationDate = new Date(item.expiration_date);
                const timeToExpire = (expirationDate - today) / (1000 * 60 * 60 * 24);

                if (timeToExpire <= 0) {
                    rowClass = 'red';
                } else if (timeToExpire < 14) {
                    rowClass = 'yellow';
                }
            }

            row.className = rowClass;

            row.innerHTML = `
                <td>${item.name}</td>
                <td><input type="number" step="0.01" value="${item.quantity}" onchange="updateQuantity('${item.name}', this.value)" size="4"></td>
                <td>${item.measurement_unit}</td>
                <td>${item.expiration_date ? new Date(item.expiration_date).toLocaleDateString() : 'N/A'}</td>
                <td><button onclick="deleteItem('${item.name}')">Delete</button></td>
            `;

            itemsTableBody.appendChild(row);
        });
    })
    .catch(error => console.error(`Error: ${error}`));
}

function loadShoppingList() {
    fetch('http://10.0.0.89:5000/shopping_list')
    .then(response => {
        console.log(`Response status: ${response.status}`);
        return response.json();
    })
    .then(items => {
        const shoppingItemsTable = document.getElementById('shoppingItems');
        shoppingItemsTable.innerHTML = '';
        items.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.index}</td>
                <td>${item.name}</td>
                <td><input type="checkbox" onclick="toggleItem('${item.name}', this.checked)"></td>
            `;
            shoppingItemsTable.appendChild(row);
        });
    })
    .catch(error => console.error(`Error: ${error}`));
}

function updateQuantity(name, newQuantity) {
    fetch('http://10.0.0.89:5000/items/update', {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, quantity: parseFloat(newQuantity) })
    })
    .then(response => {
        console.log(`Response status: ${response.status}`);
        return response.json();
    })
    .then(data => {
        console.log(data);
        loadItems();
        loadShoppingList();
    })
    .catch(error => console.error(`Error: ${error}`));
}

function deleteItem(name) {
    fetch('http://10.0.0.89:5000/items/delete', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name })
    })
    .then(response => {
        console.log(`Response status: ${response.status}`);
        return response.json();
    })
    .then(data => {
        console.log(data);
        loadItems();
        loadShoppingList();
    })
    .catch(error => console.error(`Error: ${error}`));
}

function toggleItem(name, checked) {
    console.log(`Item: ${name}, Checked: ${checked}`);
}

function showItemList() {
    document.getElementById('shoppingList').style.display = 'none';
    document.getElementById('itemForm').style.display = 'block';
    loadItems();
    loadExistingItems();  // Load existing items for dropdown
}

function showShoppingList() {
    document.getElementById('itemForm').style.display = 'none';
    document.getElementById('shoppingList').style.display = 'block';
    loadShoppingList();
}

function showLoginForm() {
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
}

function showRegisterForm() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
}

function checkLoginStatus() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('itemForm').style.display = 'none';
    document.getElementById('shoppingList').style.display = 'none';
}

function loadExistingItems() {
    fetch('http://10.0.0.89:5000/existing_items')
    .then(response => response.json())
    .then(items => {
        const datalist = document.getElementById('existingItems');
        datalist.innerHTML = '';
        items.forEach(item => {
            const option = document.createElement('option');
            option.value = item.name;
            option.setAttribute('data-unit', item.measurement_unit);
            option.setAttribute('data-threshold', item.threshold);
            datalist.appendChild(option);
        });
    })
    .catch(error => console.error(`Error: ${error}`));
}

document.getElementById('name').addEventListener('input', function() {
    const selectedItem = this.value;
    const options = document.querySelectorAll('#existingItems option');
    options.forEach(option => {
        if (option.value === selectedItem) {
            document.getElementById('measurement_unit').value = option.getAttribute('data-unit');
            document.getElementById('threshold').value = option.getAttribute('data-threshold');
        }
    });
});

checkLoginStatus();
