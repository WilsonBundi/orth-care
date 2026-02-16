// Billing & Payments JavaScript

const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

if (!token) {
    window.location.href = '/login.html';
}

// Define role hierarchy
const roleLevel = {
    'patient': 1,
    'receptionist': 2,
    'nurse': 3,
    'billing_clerk': 3,
    'records_manager': 4,
    'doctor': 5,
    'specialist': 6,
    'clinic_manager': 7,
    'system_admin': 8,
    'super_admin': 9
};

const userLevel = roleLevel[user.role] || 1;
const requiredLevel = roleLevel.billing_clerk; // Minimum BILLING_CLERK role required
const isAdmin = userLevel >= requiredLevel;

// Check if user has sufficient role level
if (userLevel < requiredLevel) {
    alert('Access denied: This page requires billing staff privileges (Billing Clerk level or higher)');
    window.location.href = '/dashboard.html';
}

// Show appropriate UI based on role
if (isAdmin) {
    document.getElementById('adminStatsCard').style.display = 'block';
    document.getElementById('patientBalanceCard').style.display = 'none';
} else {
    document.getElementById('adminStatsCard').style.display = 'none';
    document.getElementById('patientBalanceCard').style.display = 'block';
}

let allInvoices = [];
let currentInvoice = null;
let selectedPaymentMethod = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadOutstandingBalance();
    loadInvoices();
});

async function loadOutstandingBalance() {
    try {
        const response = await fetch('/api/invoices/outstanding-balance', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            document.getElementById('outstandingBalance').textContent = `KES ${formatCurrency(data.balance)}`;
        } else {
            document.getElementById('outstandingBalance').textContent = 'KES 0.00';
        }
    } catch (error) {
        console.error('Error loading balance:', error);
        document.getElementById('outstandingBalance').textContent = 'KES 0.00';
    }
}

async function loadInvoices() {
    try {
        const response = await fetch('/api/invoices/my-invoices', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            allInvoices = await response.json();
        } else {
            allInvoices = [];
            console.error('Failed to load invoices');
        }
        
        displayInvoices();
    } catch (error) {
        console.error('Error loading invoices:', error);
        allInvoices = [];
        displayInvoices();
    }
}

function displayInvoices() {
    const all = allInvoices;
    const outstanding = allInvoices.filter(inv => ['pending', 'partially_paid', 'overdue'].includes(inv.status));
    const paid = allInvoices.filter(inv => inv.status === 'paid');
    
    displayInvoiceList('allInvoicesList', all);
    displayInvoiceList('outstandingInvoicesList', outstanding);
    displayInvoiceList('paidInvoicesList', paid);
    
    // Update stats
    const totalOutstanding = outstanding.reduce((sum, inv) => sum + inv.balanceDue, 0);
    
    if (isAdmin) {
        // Admin stats
        document.getElementById('totalOutstanding').textContent = `KES ${formatCurrency(totalOutstanding)}`;
        document.getElementById('totalInvoices').textContent = all.length;
        
        // Calculate monthly revenue (paid this month)
        const thisMonth = new Date().getMonth();
        const thisYear = new Date().getFullYear();
        const monthlyRevenue = paid
            .filter(inv => {
                const paidDate = new Date(inv.paidAt);
                return paidDate.getMonth() === thisMonth && paidDate.getFullYear() === thisYear;
            })
            .reduce((sum, inv) => sum + inv.totalAmount, 0);
        document.getElementById('monthlyRevenue').textContent = `KES ${formatCurrency(monthlyRevenue)}`;
    } else {
        // Patient balance
        document.getElementById('outstandingBalance').textContent = `KES ${formatCurrency(totalOutstanding)}`;
    }
}

function displayInvoiceList(containerId, invoices) {
    const container = document.getElementById(containerId);
    
    if (invoices.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <p>No invoices found</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = invoices.map(invoice => {
        const issueDate = new Date(invoice.issueDate);
        const dueDate = new Date(invoice.dueDate);
        const isOverdue = dueDate < new Date() && invoice.balanceDue > 0;
        
        return `
            <div class="invoice-item">
                <div class="invoice-number">${invoice.invoiceNumber}</div>
                <div class="invoice-details">
                    <p><strong>Issue Date:</strong> ${issueDate.toLocaleDateString()}</p>
                    <p><strong>Due Date:</strong> ${dueDate.toLocaleDateString()}</p>
                    <p><strong>Status:</strong> <span class="status-badge status-${invoice.status}">${formatStatus(invoice.status)}</span></p>
                    ${invoice.paymentMethod ? `<p><strong>Payment Method:</strong> ${formatPaymentMethod(invoice.paymentMethod)}</p>` : ''}
                </div>
                <div class="invoice-amount">
                    <div class="total">KES ${formatCurrency(invoice.totalAmount)}</div>
                    ${invoice.balanceDue > 0 ? `<div class="balance">Balance: KES ${formatCurrency(invoice.balanceDue)}</div>` : ''}
                </div>
                <div class="invoice-actions">
                    <button class="btn btn-secondary" onclick="viewInvoice('${invoice.id}')">View Details</button>
                    ${isAdmin ? `
                        <button class="btn btn-primary" onclick="editInvoice('${invoice.id}')">Edit</button>
                        ${invoice.balanceDue > 0 ? `<button class="btn btn-success" onclick="recordPayment('${invoice.id}')">Record Payment</button>` : ''}
                    ` : `
                        ${invoice.balanceDue > 0 ? `<button class="btn btn-success" onclick="payInvoice('${invoice.id}')">Pay Now</button>` : ''}
                    `}
                </div>
            </div>
        `;
    }).join('');
}

function viewInvoice(invoiceId) {
    const invoice = allInvoices.find(inv => inv.id === invoiceId);
    if (!invoice) return;
    
    let itemsHtml = '';
    if (invoice.items && invoice.items.length > 0) {
        itemsHtml = invoice.items.map(item => `
            <tr>
                <td>${item.description}</td>
                <td style="text-align: center;">${item.quantity}</td>
                <td style="text-align: right;">KES ${formatCurrency(item.unitPrice)}</td>
                <td style="text-align: right;">KES ${formatCurrency(item.quantity * item.unitPrice)}</td>
            </tr>
        `).join('');
    }
    
    const detailsHtml = `
        <div style="padding: 20px;">
            <h2 style="color: #1e3c72; margin-bottom: 20px;">Invoice ${invoice.invoiceNumber}</h2>
            
            <div style="margin-bottom: 20px;">
                <p><strong>Issue Date:</strong> ${new Date(invoice.issueDate).toLocaleDateString()}</p>
                <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
                <p><strong>Status:</strong> <span class="status-badge status-${invoice.status}">${formatStatus(invoice.status)}</span></p>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <thead>
                    <tr style="background: #f8f9fa; border-bottom: 2px solid #dee2e6;">
                        <th style="padding: 10px; text-align: left;">Description</th>
                        <th style="padding: 10px; text-align: center;">Qty</th>
                        <th style="padding: 10px; text-align: right;">Unit Price</th>
                        <th style="padding: 10px; text-align: right;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>
            
            <div style="text-align: right; margin-top: 20px;">
                <p style="font-size: 18px;"><strong>Total Amount:</strong> KES ${formatCurrency(invoice.totalAmount)}</p>
                <p style="font-size: 16px; color: #666;"><strong>Paid:</strong> KES ${formatCurrency(invoice.paidAmount)}</p>
                <p style="font-size: 20px; color: #1e3c72;"><strong>Balance Due:</strong> KES ${formatCurrency(invoice.balanceDue)}</p>
            </div>
            
            ${invoice.balanceDue > 0 ? `
                <div style="margin-top: 30px; text-align: center;">
                    <button class="btn btn-success" onclick="payInvoice('${invoice.id}')">Pay Now</button>
                </div>
            ` : ''}
        </div>
    `;
    
    // Create a simple modal or alert
    const detailsWindow = window.open('', 'Invoice Details', 'width=800,height=600');
    detailsWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Invoice ${invoice.invoiceNumber}</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
                .status-badge {
                    display: inline-block;
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 600;
                    text-transform: uppercase;
                }
                .status-pending { background: #fff3cd; color: #856404; }
                .status-paid { background: #d4edda; color: #155724; }
                .status-partially_paid { background: #d1ecf1; color: #0c5460; }
                .status-overdue { background: #f8d7da; color: #721c24; }
                .btn {
                    padding: 12px 30px;
                    border: none;
                    border-radius: 8px;
                    font-size: 15px;
                    font-weight: 600;
                    cursor: pointer;
                    background: #28a745;
                    color: white;
                }
            </style>
        </head>
        <body>${detailsHtml}</body>
        </html>
    `);
}

function payInvoice(invoiceId) {
    const invoice = allInvoices.find(inv => inv.id === invoiceId);
    if (!invoice) return;
    
    currentInvoice = invoice;
    document.getElementById('paymentInvoiceNumber').textContent = invoice.invoiceNumber;
    document.getElementById('paymentAmount').textContent = formatCurrency(invoice.balanceDue);
    document.getElementById('paymentModal').classList.add('active');
}

function payAll() {
    const outstanding = allInvoices.filter(inv => inv.balanceDue > 0);
    if (outstanding.length === 0) {
        alert('No outstanding invoices to pay');
        return;
    }
    
    // For simplicity, pay the first outstanding invoice
    payInvoice(outstanding[0].id);
}

function closePaymentModal() {
    document.getElementById('paymentModal').classList.remove('active');
    currentInvoice = null;
    selectedPaymentMethod = null;
    
    // Hide all payment forms
    document.getElementById('mpesaForm').style.display = 'none';
    document.getElementById('cardForm').style.display = 'none';
    
    // Deselect all payment methods
    document.querySelectorAll('.payment-method').forEach(method => {
        method.classList.remove('selected');
    });
}

function selectPaymentMethod(method) {
    selectedPaymentMethod = method;
    
    // Update UI
    document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('selected'));
    event.target.closest('.payment-method').classList.add('selected');
    
    // Show appropriate form
    document.getElementById('mpesaForm').style.display = method === 'mpesa' ? 'block' : 'none';
    document.getElementById('cardForm').style.display = method === 'card' ? 'block' : 'none';
}

async function processPayment() {
    if (!currentInvoice || !selectedPaymentMethod) {
        alert('Please select a payment method');
        return;
    }
    
    let paymentReference = '';
    
    if (selectedPaymentMethod === 'mpesa') {
        const phone = document.getElementById('mpesaPhone').value;
        if (!phone) {
            alert('Please enter M-Pesa phone number');
            return;
        }
        paymentReference = phone;
    } else if (selectedPaymentMethod === 'card') {
        const cardNumber = document.getElementById('cardNumber').value;
        if (!cardNumber) {
            alert('Please enter card details');
            return;
        }
        paymentReference = cardNumber.slice(-4);
    }
    
    try {
        const response = await fetch(`/api/invoices/${currentInvoice.id}/payment`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: currentInvoice.balanceDue,
                paymentMethod: selectedPaymentMethod,
                paymentReference: paymentReference,
                transactionId: `TXN-${Date.now()}`
            })
        });
        
        if (response.ok) {
            alert('Payment processed successfully!');
            closePaymentModal();
            loadInvoices();
            loadOutstandingBalance();
        } else {
            const error = await response.json();
            alert(`Payment failed: ${error.message || 'Please try again'}`);
        }
    } catch (error) {
        console.error('Payment error:', error);
        alert('Payment failed. Please check your connection and try again.');
    }
}

function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

function formatCurrency(amount) {
    return amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatStatus(status) {
    const statuses = {
        pending: 'Pending',
        paid: 'Paid',
        partially_paid: 'Partially Paid',
        overdue: 'Overdue',
        cancelled: 'Cancelled'
    };
    return statuses[status] || status;
}

function formatPaymentMethod(method) {
    const methods = {
        mpesa: 'M-Pesa',
        card: 'Card',
        bank_transfer: 'Bank Transfer',
        cash: 'Cash',
        insurance: 'Insurance'
    };
    return methods[method] || method;
}

async function logout() {
    try {
        await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error('Logout error:', error);
    }
    
    localStorage.removeItem('token');
    localStorage.removeItem('sessionId');
    localStorage.removeItem('user');
    localStorage.removeItem('profileData');
    window.location.href = '/login.html';
}

// Admin Functions
function showCreateInvoiceModal() {
    document.getElementById('createInvoiceModal').classList.add('active');
    updateInvoiceTotal();
}

function closeCreateInvoiceModal() {
    document.getElementById('createInvoiceModal').classList.remove('active');
    // Reset form
    document.getElementById('patientSelect').value = '';
    document.getElementById('invoiceDueDate').value = '';
    document.getElementById('invoiceItems').innerHTML = `
        <div class="invoice-item-row" style="display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 10px; margin-bottom: 10px;">
            <input type="text" placeholder="Description" class="item-description" style="padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px;">
            <input type="number" placeholder="Qty" class="item-quantity" value="1" min="1" style="padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px;">
            <input type="number" placeholder="Price" class="item-price" min="0" step="0.01" style="padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px;">
            <button type="button" onclick="removeInvoiceItem(this)" style="padding: 10px; background: #f44336; color: white; border: none; border-radius: 8px; cursor: pointer;">×</button>
        </div>
    `;
}

function addInvoiceItem() {
    const container = document.getElementById('invoiceItems');
    const newRow = document.createElement('div');
    newRow.className = 'invoice-item-row';
    newRow.style.cssText = 'display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 10px; margin-bottom: 10px;';
    newRow.innerHTML = `
        <input type="text" placeholder="Description" class="item-description" style="padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px;">
        <input type="number" placeholder="Qty" class="item-quantity" value="1" min="1" onchange="updateInvoiceTotal()" style="padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px;">
        <input type="number" placeholder="Price" class="item-price" min="0" step="0.01" onchange="updateInvoiceTotal()" style="padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px;">
        <button type="button" onclick="removeInvoiceItem(this)" style="padding: 10px; background: #f44336; color: white; border: none; border-radius: 8px; cursor: pointer;">×</button>
    `;
    container.appendChild(newRow);
}

function removeInvoiceItem(button) {
    const rows = document.querySelectorAll('.invoice-item-row');
    if (rows.length > 1) {
        button.closest('.invoice-item-row').remove();
        updateInvoiceTotal();
    } else {
        alert('At least one item is required');
    }
}

function updateInvoiceTotal() {
    const rows = document.querySelectorAll('.invoice-item-row');
    let total = 0;
    
    rows.forEach(row => {
        const qty = parseFloat(row.querySelector('.item-quantity').value) || 0;
        const price = parseFloat(row.querySelector('.item-price').value) || 0;
        total += qty * price;
    });
    
    document.getElementById('invoiceTotal').textContent = formatCurrency(total);
}

async function createInvoice() {
    const patient = document.getElementById('patientSelect').value;
    const dueDate = document.getElementById('invoiceDueDate').value;
    
    if (!patient) {
        alert('Please enter patient name or ID');
        return;
    }
    
    if (!dueDate) {
        alert('Please select due date');
        return;
    }
    
    const rows = document.querySelectorAll('.invoice-item-row');
    const items = [];
    
    rows.forEach(row => {
        const description = row.querySelector('.item-description').value;
        const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
        const unitPrice = parseFloat(row.querySelector('.item-price').value) || 0;
        
        if (description && quantity > 0 && unitPrice > 0) {
            items.push({ description, quantity, unitPrice });
        }
    });
    
    if (items.length === 0) {
        alert('Please add at least one valid item');
        return;
    }
    
    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    
    try {
        const response = await fetch('/api/invoices/create', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                patientIdentifier: patient,
                dueDate: dueDate,
                items: items,
                totalAmount: totalAmount
            })
        });
        
        if (response.ok) {
            const newInvoice = await response.json();
            alert(`Invoice ${newInvoice.invoiceNumber} created successfully!`);
            closeCreateInvoiceModal();
            loadInvoices();
        } else {
            const error = await response.json();
            alert(`Failed to create invoice: ${error.message || 'Please try again'}`);
        }
    } catch (error) {
        console.error('Error creating invoice:', error);
        alert('Failed to create invoice. Please check your connection and try again.');
    }
}

function editInvoice(invoiceId) {
    alert('Edit invoice functionality - Coming soon!');
}

async function recordPayment(invoiceId) {
    const invoice = allInvoices.find(inv => inv.id === invoiceId);
    if (!invoice) return;
    
    const amount = prompt(`Record payment for ${invoice.invoiceNumber}\nBalance Due: KES ${formatCurrency(invoice.balanceDue)}\n\nEnter payment amount:`);
    
    if (amount && !isNaN(amount) && parseFloat(amount) > 0) {
        const paymentAmount = parseFloat(amount);
        
        if (paymentAmount > invoice.balanceDue) {
            alert('Payment amount cannot exceed balance due');
            return;
        }
        
        try {
            const response = await fetch(`/api/invoices/${invoiceId}/payment`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount: paymentAmount,
                    paymentMethod: 'cash',
                    paymentReference: `ADMIN-${Date.now()}`,
                    transactionId: `TXN-${Date.now()}`
                })
            });
            
            if (response.ok) {
                alert(`Payment of KES ${formatCurrency(paymentAmount)} recorded successfully!`);
                loadInvoices();
            } else {
                const error = await response.json();
                alert(`Failed to record payment: ${error.message || 'Please try again'}`);
            }
        } catch (error) {
            console.error('Error recording payment:', error);
            alert('Failed to record payment. Please check your connection and try again.');
        }
    }
}

// Add event listeners for invoice total calculation
document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('input', (e) => {
        if (e.target.classList.contains('item-quantity') || e.target.classList.contains('item-price')) {
            updateInvoiceTotal();
        }
    });
});
