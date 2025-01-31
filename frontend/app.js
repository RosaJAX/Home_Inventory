document.getElementById('itemForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const name = document.getElementById('name').value;
    const quantity = document.getElementById('quantity').value;
    const measurement_unit = document.getElementById('measurement_unit').value;
    const threshold = document.getElementById('threshold').value;
    const expiration_date = document.getElementById('expiration_date').value;

    fetch('http://localhost:5000/items', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, quantity: parseFloat(quantity), measurement_unit, threshold: parseFloat(threshold), expiration_date })
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        clearForm();
        loadItems();
    });
});

function clearForm() {
    document.getElementById('name').value = '';
    document.getElementById('quantity').value = '';
    document.getElementById('measurement_unit').value = '';
    document.getElementById('threshold').value = '';
    document.getElementById('expiration_date').value = '';
}

function loadItems() {
    fetch('http://localhost:5000/items')
    .then(response => response.json())
    .then(items => {
        const itemsTableBody = document.getElementById('items');
        itemsTableBody.innerHTML = '';
        items.forEach(item => {
            const row = document.createElement('tr');
            console.log(`Item: ${item.name}, Quantity: ${item.quantity}, Threshold: ${item.threshold}`); // Debugging statement

            let rowClass = 'white';

            // Check quantity threshold
            if (item.quantity <= 0) {
                rowClass = 'red';
            } else if (item.quantity <= item.threshold) {
                rowClass = 'yellow';
            }

            // Check expiration date
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
                <td><input type="number" step="0.01" value="${item.quantity}" onchange="updateQuantity('${item.name}', this.value)"></td>
                <td>${item.measurement_unit}</td>
                <td>${item.expiration_date ? new Date(item.expiration_date).toLocaleDateString() : 'N/A'}</td>
                <td><button onclick="deleteItem('${item.name}')">Delete</button></td>
            `;

            itemsTableBody.appendChild(row);
        });
    });
}

function updateQuantity(name, newQuantity) {
    fetch('http://localhost:5000/items/update', {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, quantity: parseFloat(newQuantity) })
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        loadItems();
    });
}

function deleteItem(name) {
    fetch('http://localhost:5000/items/delete', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name })
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        loadItems();
    });
}

loadItems();
