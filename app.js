// RestaurantPro App - Main Application Logic
// ==========================================

// Data Storage
let restaurant = {
    name: 'Mein Restaurant',
    address: '',
    phone: '',
    tables: [],
    orders: [],
    reservations: [],
    billings: [],
    menuItems: [
        { id: 1, name: 'Pizza Margherita', price: 12.50, category: 'Pizza' },
        { id: 2, name: 'Pasta Carbonara', price: 14.00, category: 'Pasta' },
        { id: 3, name: 'Salat Caesar', price: 10.00, category: 'Salate' },
        { id: 4, name: 'Fisch des Tages', price: 18.50, category: 'Hauptgänge' },
        { id: 5, name: 'Steak 300g', price: 22.00, category: 'Hauptgänge' },
        { id: 6, name: 'Cappuccino', price: 3.50, category: 'Getränke' },
        { id: 7, name: 'Rotwein Glas', price: 6.50, category: 'Getränke' },
        { id: 8, name: 'Tiramisu', price: 7.50, category: 'Desserts' },
    ]
};

let currentEditingTableId = null;
let currentEditingOrderId = null;
let currentViewingBillingId = null;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
    initializeTables();
    showDashboard();
    updateDashboard();
    loadRestaurantSettings();
});

// ==========================================
// LocalStorage Management
// ==========================================

function saveToLocalStorage() {
    localStorage.setItem('restaurantData', JSON.stringify(restaurant));
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem('restaurantData');
    if (saved) {
        try {
            restaurant = JSON.parse(saved);
        } catch (e) {
            console.error('Error loading data from localStorage:', e);
        }
    }
}

// ==========================================
// Navigation Functions
// ==========================================

function showDashboard() {
    switchSection('dashboard');
    updateDashboard();
}

function showTables() {
    switchSection('tables');
    renderTables();
}

function showOrders() {
    switchSection('orders');
    renderOrders();
}

function showReservations() {
    switchSection('reservations');
    renderReservations();
}

function showBilling() {
    switchSection('billing');
    renderBillings();
}

function showSettings() {
    switchSection('settings');
}

function switchSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });

    // Remove active class from all nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });

    // Show selected section
    document.getElementById(sectionId).classList.add('active');

    // Add active class to corresponding nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.textContent.toLowerCase().includes(sectionId.split('')[0])) {
            link.classList.add('active');
        }
    });
}

// ==========================================
// Dashboard Functions
// ==========================================

function updateDashboard() {
    // Active tables
    const activeTables = restaurant.tables.filter(t => t.status === 'occupied').length;
    document.getElementById('activeTables').textContent = activeTables;

    // Daily revenue
    const paidBillings = restaurant.billings.filter(b => b.status === 'paid');
    const dailyRevenue = paidBillings.reduce((sum, b) => sum + b.total, 0);
    document.getElementById('dailyRevenue').textContent = '€' + dailyRevenue.toFixed(2);

    // Active orders
    const activeOrders = restaurant.orders.filter(o => 
        o.status !== 'completed' && o.status !== 'paid'
    ).length;
    document.getElementById('activeOrders').textContent = activeOrders;

    // Reservations count
    const todayReservations = restaurant.reservations.filter(r => {
        const today = new Date().toISOString().split('T')[0];
        return r.date === today;
    }).length;
    document.getElementById('reservationCount').textContent = todayReservations;
}

// ==========================================
// Table Management
// ==========================================

function initializeTables() {
    if (restaurant.tables.length === 0) {
        const tablesData = [
            { number: 1, seats: 2, area: 'main' },
            { number: 2, seats: 4, area: 'main' },
            { number: 3, seats: 4, area: 'main' },
            { number: 4, seats: 2, area: 'lounge' },
            { number: 5, seats: 6, area: 'lounge' },
            { number: 6, seats: 4, area: 'terrace' },
            { number: 7, seats: 8, area: 'terrace' },
            { number: 8, seats: 4, area: 'main' },
            { number: 9, seats: 2, area: 'vip' },
            { number: 10, seats: 6, area: 'vip' },
        ];

        tablesData.forEach(tableData => {
            restaurant.tables.push({
                id: generateId(),
                ...tableData,
                status: 'free',
                currentCustomer: '',
                currentOrderId: null
            });
        });

        saveToLocalStorage();
    }
}

function renderTables() {
    const grid = document.getElementById('tablesGrid');
    grid.innerHTML = '';

    const filteredTables = filterTablesByStatus(restaurant.tables);

    if (filteredTables.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px;">Keine Tische gefunden</p>';
        return;
    }

    filteredTables.forEach(table => {
        const card = createTableCard(table);
        grid.appendChild(card);
    });
}

function filterTablesByStatus(tables) {
    const filter = document.getElementById('tableFilter').value;
    if (!filter) return tables;
    return tables.filter(t => t.status === filter);
}

function filterTables() {
    renderTables();
}

function createTableCard(table) {
    const card = document.createElement('div');
    card.className = `table-card ${table.status}`;

    let statusText = '';
    if (table.status === 'free') statusText = '✓ Frei';
    else if (table.status === 'occupied') statusText = '🍽️ Belegt';
    else if (table.status === 'reserved') statusText = '📅 Reserviert';

    card.innerHTML = `
        <div class="table-number">Tisch ${table.number}</div>
        <div class="table-seats">${table.seats} Plätze</div>
        <div class="table-status status-${table.status}">${statusText}</div>
        <div class="table-customer">${table.currentCustomer ? table.currentCustomer : 'Keine Reservierung'}</div>
        <div class="table-actions">
            <button onclick="editTable('${table.id}')" class="btn btn-secondary">Bearbeiten</button>
            <button onclick="openTableMenu('${table.id}')" class="btn btn-info">Menü</button>
        </div>
    `;

    card.style.cursor = 'pointer';
    card.addEventListener('click', (e) => {
        if (!e.target.closest('.table-actions')) {
            openTableDetails(table);
        }
    });

    return card;
}

function openTableDetails(table) {
    if (table.status === 'occupied' && table.currentOrderId) {
        // Show order details
        const order = restaurant.orders.find(o => o.id === table.currentOrderId);
        if (order) {
            editOrder(order.id);
        }
    }
}

function openTableMenu(tableId) {
    const table = restaurant.tables.find(t => t.id === tableId);
    if (table) {
        document.getElementById('orderTable').value = tableId;
        showNewOrder();
    }
}

function addTable() {
    currentEditingTableId = null;
    document.getElementById('tableModalTitle').textContent = 'Tisch hinzufügen';
    document.getElementById('tableNumber').value = '';
    document.getElementById('tableSeats').value = '';
    document.getElementById('tableArea').value = 'main';
    openModal('tableModal');
}

function editTable(tableId) {
    const table = restaurant.tables.find(t => t.id === tableId);
    if (table) {
        currentEditingTableId = tableId;
        document.getElementById('tableModalTitle').textContent = 'Tisch bearbeiten';
        document.getElementById('tableNumber').value = table.number;
        document.getElementById('tableSeats').value = table.seats;
        document.getElementById('tableArea').value = table.area;
        openModal('tableModal');
    }
}

function saveTable() {
    const number = parseInt(document.getElementById('tableNumber').value);
    const seats = parseInt(document.getElementById('tableSeats').value);
    const area = document.getElementById('tableArea').value;

    if (!number || !seats) {
        alert('Bitte füllen Sie alle erforderlichen Felder aus');
        return;
    }

    if (currentEditingTableId) {
        // Edit existing table
        const table = restaurant.tables.find(t => t.id === currentEditingTableId);
        if (table) {
            table.number = number;
            table.seats = seats;
            table.area = area;
        }
    } else {
        // Create new table
        restaurant.tables.push({
            id: generateId(),
            number: number,
            seats: seats,
            area: area,
            status: 'free',
            currentCustomer: '',
            currentOrderId: null
        });
    }

    saveToLocalStorage();
    closeModal('tableModal');
    renderTables();
}

function deleteTable(tableId) {
    if (confirm('Sind Sie sicher, dass Sie diesen Tisch löschen möchten?')) {
        restaurant.tables = restaurant.tables.filter(t => t.id !== tableId);
        saveToLocalStorage();
        renderTables();
    }
}

// ==========================================
// Order Management
// ==========================================

function renderOrders() {
    const list = document.getElementById('ordersList');
    list.innerHTML = '';

    const filteredOrders = filterOrdersByStatus(restaurant.orders);

    if (filteredOrders.length === 0) {
        list.innerHTML = '<p style="text-align: center; padding: 40px;">Keine Bestellungen gefunden</p>';
        return;
    }

    filteredOrders.forEach(order => {
        const card = createOrderCard(order);
        list.appendChild(card);
    });
}

function filterOrdersByStatus(orders) {
    const filter = document.getElementById('orderFilter').value;
    if (!filter) return orders;
    return orders.filter(o => o.status === filter);
}

function filterOrders() {
    renderOrders();
}

function createOrderCard(order) {
    const card = document.createElement('div');
    card.className = 'order-card';

    const table = restaurant.tables.find(t => t.id === order.tableId);
    const tableName = table ? `Tisch ${table.number}` : 'Unbekannt';

    let statusClass = order.status;
    let statusText = '';
    switch(order.status) {
        case 'pending': statusText = 'Ausstehend'; break;
        case 'preparing': statusText = 'In Zubereitung'; break;
        case 'ready': statusText = 'Fertig'; break;
        case 'served': statusText = 'Serviert'; break;
        case 'completed': statusText = 'Abgeschlossen'; break;
    }

    const itemsHtml = order.items.map(item => 
        `<div class="order-item">
            <span>${item.quantity}x ${item.name}</span>
            <span>€${(item.price * item.quantity).toFixed(2)}</span>
        </div>`
    ).join('');

    card.innerHTML = `
        <div class="order-header">
            <div>
                <div class="order-id">Bestellung #${order.id.substring(0, 8).toUpperCase()}</div>
                <div class="order-detail-item">
                    <span class="order-detail-label">Tisch:</span> ${tableName}
                </div>
            </div>
            <span class="order-status ${statusClass}">${statusText}</span>
        </div>
        <div class="order-details">
            <div class="order-detail-item">
                <span class="order-detail-label">Zeit:</span> ${formatTime(order.timestamp)}
            </div>
            <div class="order-detail-item">
                <span class="order-detail-label">Artikel:</span> ${order.items.length}
            </div>
        </div>
        <div class="order-items">
            ${itemsHtml}
            <div class="order-total">
                Gesamtbetrag: €${order.total.toFixed(2)}
            </div>
        </div>
        ${order.notes ? `<div style="background: #fff3cd; padding: 10px; border-radius: 5px; font-size: 0.9em; margin: 10px 0;">
            <strong>Notizen:</strong> ${order.notes}
        </div>` : ''}
        <div class="order-actions">
            <button onclick="editOrder('${order.id}')" class="btn btn-primary">Bearbeiten</button>
            <button onclick="updateOrderStatus('${order.id}', 'preparing')" class="btn btn-info">Zubereitung</button>
            <button onclick="updateOrderStatus('${order.id}', 'ready')" class="btn btn-success">Fertig</button>
            <button onclick="updateOrderStatus('${order.id}', 'served')" class="btn btn-secondary">Serviert</button>
            <button onclick="completeOrder('${order.id}')" class="btn btn-primary">Abrechnung</button>
        </div>
    `;

    return card;
}

function showNewOrder() {
    currentEditingOrderId = null;
    document.getElementById('orderTable').innerHTML = '';
    
    restaurant.tables.forEach(table => {
        const option = document.createElement('option');
        option.value = table.id;
        option.textContent = `Tisch ${table.number} (${table.seats} Plätze)`;
        document.getElementById('orderTable').appendChild(option);
    });

    renderMenuItems();
    document.getElementById('orderNotes').value = '';
    document.getElementById('orderPreview').innerHTML = '';
    openModal('orderModal');
}

function renderMenuItems() {
    const container = document.getElementById('menuItemsList');
    container.innerHTML = '';

    restaurant.menuItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'menu-item';
        div.innerHTML = `
            <input type="checkbox" id="item-${item.id}" data-item-id="${item.id}" onchange="updateOrderPreview()">
            <label for="item-${item.id}">
                <strong>${item.name}</strong> - €${item.price.toFixed(2)}
            </label>
            <input type="number" min="1" value="1" class="item-quantity" id="qty-${item.id}" 
                   style="width: 50px; padding: 5px;" onchange="updateOrderPreview()">
        `;
        container.appendChild(div);
    });
}

function updateOrderPreview() {
    const preview = document.getElementById('orderPreview');
    const selectedItems = [];
    let total = 0;

    document.querySelectorAll('.menu-item input[type="checkbox"]:checked').forEach(checkbox => {
        const itemId = checkbox.dataset.itemId;
        const item = restaurant.menuItems.find(i => i.id == itemId);
        const quantity = parseInt(document.getElementById(`qty-${itemId}`).value) || 1;
        
        if (item) {
            selectedItems.push({
                ...item,
                quantity: quantity,
                subtotal: item.price * quantity
            });
            total += item.price * quantity;
        }
    });

    if (selectedItems.length === 0) {
        preview.innerHTML = '';
        return;
    }

    let html = '<h4>Bestellungsvorschau:</h4>';
    selectedItems.forEach(item => {
        html += `
            <div class="preview-item">
                <span>${item.quantity}x ${item.name}</span>
                <span>€${item.subtotal.toFixed(2)}</span>
            </div>
        `;
    });
    html += `<div class="preview-total"><span>Gesamtbetrag:</span><span>€${total.toFixed(2)}</span></div>`;

    preview.innerHTML = html;
}

function createOrder() {
    const tableId = document.getElementById('orderTable').value;
    const notes = document.getElementById('orderNotes').value;
    const items = [];
    let total = 0;

    document.querySelectorAll('.menu-item input[type="checkbox"]:checked').forEach(checkbox => {
        const itemId = checkbox.dataset.itemId;
        const item = restaurant.menuItems.find(i => i.id == itemId);
        const quantity = parseInt(document.getElementById(`qty-${itemId}`).value) || 1;
        
        if (item) {
            items.push({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: quantity
            });
            total += item.price * quantity;
        }
    });

    if (items.length === 0) {
        alert('Bitte wählen Sie mindestens einen Artikel aus');
        return;
    }

    if (!tableId) {
        alert('Bitte wählen Sie einen Tisch aus');
        return;
    }

    const order = {
        id: generateId(),
        tableId: tableId,
        items: items,
        total: total,
        status: 'pending',
        notes: notes,
        timestamp: new Date().toISOString(),
        completedAt: null
    };

    restaurant.orders.push(order);

    // Update table status
    const table = restaurant.tables.find(t => t.id === tableId);
    if (table) {
        table.status = 'occupied';
        table.currentOrderId = order.id;
    }

    saveToLocalStorage();
    closeModal('orderModal');
    renderOrders();
    renderTables();
    updateDashboard();
    alert('Bestellung erstellt!');
}

function editOrder(orderId) {
    const order = restaurant.orders.find(o => o.id === orderId);
    if (!order) return;

    // For now, we'll just show a simple edit interface
    // In a full app, you'd rebuild the modal with current selections
    alert('Bestellung #' + order.id.substring(0, 8).toUpperCase() + '\nStatus: ' + order.status + '\nGesamtbetrag: €' + order.total.toFixed(2));
}

function updateOrderStatus(orderId, newStatus) {
    const order = restaurant.orders.find(o => o.id === orderId);
    if (order) {
        order.status = newStatus;
        saveToLocalStorage();
        renderOrders();
        updateDashboard();
    }
}

function completeOrder(orderId) {
    const order = restaurant.orders.find(o => o.id === orderId);
    if (order) {
        order.status = 'completed';
        order.completedAt = new Date().toISOString();

        // Create billing
        const billing = {
            id: generateId(),
            orderId: orderId,
            tableId: order.tableId,
            items: order.items,
            subtotal: order.total,
            tax: parseFloat((order.total * 0.19).toFixed(2)),
            total: parseFloat((order.total * 1.19).toFixed(2)),
            status: 'pending',
            timestamp: new Date().toISOString(),
            paidAt: null
        };

        restaurant.billings.push(billing);

        saveToLocalStorage();
        renderOrders();
        renderBillings();
        updateDashboard();
        alert('Bestellung abgeschlossen! Rechnung erstellt.');
    }
}

// ==========================================
// Reservation Management
// ==========================================

function renderReservations() {
    const list = document.getElementById('reservationsList');
    list.innerHTML = '';

    if (restaurant.reservations.length === 0) {
        list.innerHTML = '<p style="text-align: center; padding: 40px;">Keine Reservierungen vorhanden</p>';
        return;
    }

    restaurant.reservations.forEach(reservation => {
        const card = createReservationCard(reservation);
        list.appendChild(card);
    });
}

function createReservationCard(reservation) {
    const card = document.createElement('div');
    card.className = 'reservation-card';

    const table = restaurant.tables.find(t => t.id === reservation.tableId);
    const tableName = table ? `Tisch ${table.number}` : 'Nicht zugewiesen';

    card.innerHTML = `
        <div class="reservation-header">
            ${reservation.name} (${reservation.guests} Gäste)
        </div>
        <div class="reservation-details">
            <div class="reservation-detail">
                <span class="reservation-detail-label">Datum:</span>
                ${formatDate(reservation.date)}
            </div>
            <div class="reservation-detail">
                <span class="reservation-detail-label">Zeit:</span>
                ${reservation.time}
            </div>
            <div class="reservation-detail">
                <span class="reservation-detail-label">Tisch:</span>
                ${tableName}
            </div>
            <div class="reservation-detail">
                <span class="reservation-detail-label">Telefon:</span>
                ${reservation.phone}
            </div>
        </div>
        ${reservation.notes ? `<div style="margin: 10px 0; padding: 10px; background: #f0f7ff; border-radius: 5px; font-size: 0.9em;">
            <strong>Notizen:</strong> ${reservation.notes}
        </div>` : ''}
        <div style="margin-top: 10px;">
            <span class="reservation-status">${reservation.status === 'confirmed' ? '✓ Bestätigt' : 'Ausstehend'}</span>
        </div>
        <div class="reservation-actions">
            <button onclick="editReservation('${reservation.id}')" class="btn btn-primary">Bearbeiten</button>
            <button onclick="confirmReservation('${reservation.id}')" class="btn btn-success">Bestätigen</button>
            <button onclick="cancelReservation('${reservation.id}')" class="btn btn-danger">Stornieren</button>
        </div>
    `;

    return card;
}

function showNewReservation() {
    currentEditingTableId = null;
    document.getElementById('reservationName').value = '';
    document.getElementById('reservationPhone').value = '';
    document.getElementById('reservationDate').value = '';
    document.getElementById('reservationTime').value = '';
    document.getElementById('reservationGuests').value = '';
    document.getElementById('reservationTable').innerHTML = '<option value="">Automatisch zuweisen</option>';
    document.getElementById('reservationNotes').value = '';

    restaurant.tables.forEach(table => {
        const option = document.createElement('option');
        option.value = table.id;
        option.textContent = `Tisch ${table.number} (${table.seats} Plätze)`;
        document.getElementById('reservationTable').appendChild(option);
    });

    openModal('reservationModal');
}

function saveReservation() {
    const name = document.getElementById('reservationName').value.trim();
    const phone = document.getElementById('reservationPhone').value.trim();
    const date = document.getElementById('reservationDate').value;
    const time = document.getElementById('reservationTime').value;
    const guests = parseInt(document.getElementById('reservationGuests').value);
    const tableId = document.getElementById('reservationTable').value;
    const notes = document.getElementById('reservationNotes').value.trim();

    if (!name || !phone || !date || !time || !guests) {
        alert('Bitte füllen Sie alle erforderlichen Felder aus');
        return;
    }

    const reservation = {
        id: generateId(),
        name: name,
        phone: phone,
        date: date,
        time: time,
        guests: guests,
        tableId: tableId || null,
        notes: notes,
        status: 'pending',
        createdAt: new Date().toISOString()
    };

    restaurant.reservations.push(reservation);

    // If table is selected, update its status
    if (tableId) {
        const table = restaurant.tables.find(t => t.id === tableId);
        if (table) {
            table.status = 'reserved';
            table.currentCustomer = name;
        }
    }

    saveToLocalStorage();
    closeModal('reservationModal');
    renderReservations();
    renderTables();
    updateDashboard();
}

function editReservation(reservationId) {
    const reservation = restaurant.reservations.find(r => r.id === reservationId);
    if (reservation) {
        document.getElementById('reservationName').value = reservation.name;
        document.getElementById('reservationPhone').value = reservation.phone;
        document.getElementById('reservationDate').value = reservation.date;
        document.getElementById('reservationTime').value = reservation.time;
        document.getElementById('reservationGuests').value = reservation.guests;
        document.getElementById('reservationTable').value = reservation.tableId || '';
        document.getElementById('reservationNotes').value = reservation.notes;
        
        currentEditingTableId = reservationId;
        openModal('reservationModal');
    }
}

function confirmReservation(reservationId) {
    const reservation = restaurant.reservations.find(r => r.id === reservationId);
    if (reservation) {
        reservation.status = 'confirmed';
        saveToLocalStorage();
        renderReservations();
    }
}

function cancelReservation(reservationId) {
    if (confirm('Sind Sie sicher, dass Sie diese Reservierung stornieren möchten?')) {
        restaurant.reservations = restaurant.reservations.filter(r => r.id !== reservationId);
        
        // Free up the table if it was reserved
        const reservation = restaurant.reservations.find(r => r.id === reservationId);
        if (reservation && reservation.tableId) {
            const table = restaurant.tables.find(t => t.id === reservation.tableId);
            if (table && table.status === 'reserved') {
                table.status = 'free';
                table.currentCustomer = '';
            }
        }
        
        saveToLocalStorage();
        renderReservations();
        renderTables();
    }
}

// ==========================================
// Billing Management
// ==========================================

function renderBillings() {
    const list = document.getElementById('billingsList');
    list.innerHTML = '';

    const filteredBillings = filterBillingsByStatus(restaurant.billings);

    if (filteredBillings.length === 0) {
        list.innerHTML = '<p style="text-align: center; padding: 40px;">Keine Rechnungen vorhanden</p>';
        return;
    }

    filteredBillings.forEach(billing => {
        const card = createBillingCard(billing);
        list.appendChild(card);
    });
}

function filterBillingsByStatus(billings) {
    const filter = document.getElementById('billingFilter').value;
    if (!filter) return billings;
    return billings.filter(b => b.status === filter);
}

function filterBillings() {
    renderBillings();
}

function createBillingCard(billing) {
    const card = document.createElement('div');
    card.className = 'billing-card';

    const table = restaurant.tables.find(t => t.id === billing.tableId);
    const tableName = table ? `Tisch ${table.number}` : 'Unbekannt';

    const itemsHtml = billing.items.map(item => 
        `<div class="billing-item">
            <span>${item.quantity}x ${item.name}</span>
            <span>€${(item.price * item.quantity).toFixed(2)}</span>
        </div>`
    ).join('');

    card.innerHTML = `
        <div class="billing-header">
            <div class="billing-id">Rechnung #${billing.id.substring(0, 8).toUpperCase()}</div>
            <span class="billing-status ${billing.status}">${billing.status === 'paid' ? '✓ Bezahlt' : '⏳ Ausstehend'}</span>
        </div>
        <div style="margin-top: 10px; font-size: 0.9em;">
            <div>Tisch: ${tableName}</div>
            <div>Datum: ${formatDate(billing.timestamp)}</div>
        </div>
        <div class="billing-item" style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e0e0e0;">
            <strong>Artikel (${billing.items.length})</strong>
        </div>
        <div style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin: 10px 0;">
            ${itemsHtml}
        </div>
        <div class="billing-item">
            <span>Zwischensumme:</span>
            <span>€${billing.subtotal.toFixed(2)}</span>
        </div>
        <div class="billing-item">
            <span>MwSt. (19%):</span>
            <span>€${billing.tax.toFixed(2)}</span>
        </div>
        <div class="billing-item-total">
            <span>GESAMTBETRAG:</span>
            <span>€${billing.total.toFixed(2)}</span>
        </div>
        <div style="display: flex; gap: 8px; margin-top: 15px;">
            <button onclick="viewBilling('${billing.id}')" class="btn btn-info" style="flex: 1;">Anzeigen</button>
            <button onclick="printBilling('${billing.id}')" class="btn btn-secondary" style="flex: 1;">Drucken</button>
            ${billing.status === 'pending' ? `<button onclick="markBillingAsPaid('${billing.id}')" class="btn btn-success" style="flex: 1;">Bezahlt</button>` : ''}
        </div>
    `;

    return card;
}

function viewBilling(billingId) {
    const billing = restaurant.billings.find(b => b.id === billingId);
    if (!billing) return;

    currentViewingBillingId = billingId;

    const table = restaurant.tables.find(t => t.id === billing.tableId);
    const tableName = table ? `Tisch ${table.number}` : 'Unbekannt';

    const itemsHtml = billing.items.map(item => 
        `<div class="billing-item">
            <span>${item.quantity}x ${item.name}</span>
            <span>€${(item.price * item.quantity).toFixed(2)}</span>
        </div>`
    ).join('');

    const content = `
        <div style="text-align: center; margin-bottom: 20px;">
            <h2>${restaurant.name}</h2>
            <p>${restaurant.address}</p>
            <p>${restaurant.phone}</p>
        </div>
        
        <hr>
        
        <div style="margin-bottom: 15px;">
            <div><strong>Rechnung #:</strong> ${billing.id.substring(0, 8).toUpperCase()}</div>
            <div><strong>Tisch:</strong> ${tableName}</div>
            <div><strong>Datum:</strong> ${formatDate(billing.timestamp)}</div>
            <div><strong>Zeit:</strong> ${new Date(billing.timestamp).toLocaleTimeString('de-DE')}</div>
        </div>
        
        <hr>
        
        <div style="margin-bottom: 10px;">
            ${itemsHtml}
        </div>
        
        <hr>
        
        <div class="billing-item">
            <span><strong>Zwischensumme:</strong></span>
            <span><strong>€${billing.subtotal.toFixed(2)}</strong></span>
        </div>
        <div class="billing-item">
            <span><strong>MwSt. (19%):</strong></span>
            <span><strong>€${billing.tax.toFixed(2)}</strong></span>
        </div>
        <div class="billing-item" style="font-size: 1.2em; border-top: 2px solid #000; padding-top: 10px; margin-top: 10px;">
            <span><strong>GESAMTBETRAG:</strong></span>
            <span><strong>€${billing.total.toFixed(2)}</strong></span>
        </div>
        
        <hr>
        
        <div style="text-align: center; margin-top: 20px; font-size: 0.9em; color: #666;">
            <p>Vielen Dank für Ihren Besuch!</p>
            <p>${billing.status === 'paid' ? '✓ Bezahlt' : 'Zahlung ausstehend'}</p>
        </div>
    `;

    document.getElementById('billingContent').innerHTML = content;
    document.getElementById('billingTitle').textContent = 'Rechnung #' + billing.id.substring(0, 8).toUpperCase();
    openModal('billingModal');
}

function printBilling(billingId = currentViewingBillingId) {
    if (!billingId) return;
    
    window.print();
}

function markAsPaid(billingId = currentViewingBillingId) {
    if (!billingId) return;
    
    markBillingAsPaid(billingId);
    closeModal('billingModal');
}

function markBillingAsPaid(billingId) {
    const billing = restaurant.billings.find(b => b.id === billingId);
    if (billing) {
        billing.status = 'paid';
        billing.paidAt = new Date().toISOString();
        
        // Free up the table
        const table = restaurant.tables.find(t => t.id === billing.tableId);
        if (table) {
            table.status = 'free';
            table.currentCustomer = '';
            table.currentOrderId = null;
        }
        
        saveToLocalStorage();
        renderBillings();
        renderTables();
        updateDashboard();
    }
}

// ==========================================
// Settings Management
// ==========================================

function loadRestaurantSettings() {
    document.getElementById('restaurantName').value = restaurant.name;
    document.getElementById('restaurantAddress').value = restaurant.address;
    document.getElementById('restaurantPhone').value = restaurant.phone;
}

function saveSettings() {
    restaurant.name = document.getElementById('restaurantName').value;
    restaurant.address = document.getElementById('restaurantAddress').value;
    restaurant.phone = document.getElementById('restaurantPhone').value;

    saveToLocalStorage();
    alert('Einstellungen gespeichert!');
}

function clearAllData() {
    if (confirm('⚠️ Sind Sie sicher? Dies löscht ALLE Daten!\n\nDiese Aktion kann nicht rückgängig gemacht werden.')) {
        if (confirm('Dies ist die letzte Warnung. Alle Daten werden gelöscht!')) {
            localStorage.removeItem('restaurantData');
            restaurant = {
                name: 'Mein Restaurant',
                address: '',
                phone: '',
                tables: [],
                orders: [],
                reservations: [],
                billings: [],
                menuItems: restaurant.menuItems
            };
            location.reload();
        }
    }
}

function exportData() {
    const dataStr = JSON.stringify(restaurant, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `restaurantpro-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
}

function exportDailyReport() {
    const today = new Date().toISOString().split('T')[0];
    const todaysOrders = restaurant.orders.filter(o => o.timestamp.startsWith(today));
    const todaysBillings = restaurant.billings.filter(b => b.timestamp.startsWith(today) && b.status === 'paid');
    const todaysRevenue = todaysBillings.reduce((sum, b) => sum + b.total, 0);

    let report = `TAGESBERICHT - ${new Date(today).toLocaleDateString('de-DE')}\n`;
    report += `=${'='.repeat(50)}\n\n`;
    report += `Restaurant: ${restaurant.name}\n`;
    report += `Datum: ${new Date(today).toLocaleDateString('de-DE')}\n\n`;
    report += `ZUSAMMENFASSUNG:\n`;
    report += `- Bestellungen: ${todaysOrders.length}\n`;
    report += `- Bezahlte Rechnungen: ${todaysBillings.length}\n`;
    report += `- Tagesumsatz: €${todaysRevenue.toFixed(2)}\n`;
    report += `- Durchschnittliche Rechnung: €${todaysBillings.length > 0 ? (todaysRevenue / todaysBillings.length).toFixed(2) : '0.00'}\n\n`;
    report += `BESTELLTE ARTIKEL:\n`;

    const itemCounts = {};
    todaysOrders.forEach(order => {
        order.items.forEach(item => {
            if (!itemCounts[item.name]) {
                itemCounts[item.name] = { count: 0, revenue: 0 };
            }
            itemCounts[item.name].count += item.quantity;
            itemCounts[item.name].revenue += item.price * item.quantity;
        });
    });

    Object.entries(itemCounts).forEach(([itemName, data]) => {
        report += `- ${itemName}: ${data.count}x (€${data.revenue.toFixed(2)})\n`;
    });

    alert(report);

    // Also download as text file
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tagesbericht-${today}.txt`;
    link.click();
}

// ==========================================
// Modal Functions
// ==========================================

function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
    }
};

// ==========================================
// Utility Functions
// ==========================================

function generateId() {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('de-DE', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

// Auto-save and update dashboard every minute
setInterval(() => {
    if (document.getElementById('dashboard').classList.contains('active')) {
        updateDashboard();
    }
}, 60000);
