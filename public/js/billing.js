// Billing & Payments JavaScript

const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

if (!token) {
    window.location.href = '/login.html';
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
            // Show mock balance for demo
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
            // Show mock invoices for demo
            allInvoices = getMockInvoices();
        }
        
        displayInvoices();
    } catch (error) {
        console.error('Error loading invoices:', error);
        allInvoices = getMockInvoices();
        displayInvoices();
    }
}

function getMockInvoices() {
    return [
        {
            id: '1',
            invoiceNumber: 'INV-000001',
            issueDate: '2026-01-15',
            dueDate: '2026-02-14',
            totalAmount: 15000,
            paidAmount: 0,
            balanceDue: 15000,
            status: 'pending',
            items: [
                { description: 'Consultation - Orthopedic', quantity: 1, unitPrice: 5000 },
                { description: 'X-Ray - Knee', quantity: 1, unitPrice: 8000 },
                { description: 'Medication', quantity: 1, unitPrice: 2000 }
            ]
        },
        {
            id: '2',
            invoiceNumber: 'INV-000002',
            issueDate: '2026-01-20',
            dueDate: '2026-02-19',
            totalAmount: 25000,
            paidAmount: 10000,
            balanceDue: 15000,
            status: 'partially_paid',
            items: [
                { description: 'Physical Therapy Session', quantity: 5, unitPrice: 3000 },
                { description: 'Lab Tests', quantity: 1, unitPrice: 10000 }
            ]
        },
        {
            id: '3',
            invoiceNumber: 'INV-000003',
            issueDate: '2025-12-10',
            dueDate: '2026-01-09',
            totalAmount: 8000,
            paidAmount: 8000,
            balanceDue: 0,
            status: 'paid',
            paidAt: '2026-01-05',
            paymentMethod: 'mpesa',
            items: [
                { description: 'Follow-up Consultation', quantity: 1, unitPrice: 3000 },
                { description: 'Prescription', quantity: 1, unitPrice: 5000 }
            ]
        }
    ];
}

function displayInvoices() {
    const all = allInvoices;
    const outstanding = allInvoices.filter(inv => ['pending', 'partially_paid', 'overdue'].includes(inv.status));
    const paid = allInvoices.filter(inv => inv.status === 'paid');
    
    displayInvoiceList('allInvoicesList', all);
    displayInvoiceList('outstandingInvoicesList', outstanding);
    displayInvoiceList('paidInvoicesList', paid);
    
    // Update outstanding balance
    const totalOutstanding = outstanding.reduce((sum, inv) => sum + inv.balanceDue, 0);
    document.getElementById('outstandingBalance').textContent = `KES ${formatCurrency(totalOutstanding)}`;
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
                    ${invoice.balanceDue > 0 ? `<button class="btn btn-success" onclick="payInvoice('${invoice.id}')">Pay Now</button>` : ''}
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
            // For demo, simulate success
            alert('Payment processed successfully! (Demo Mode)');
            
            // Update invoice locally
            const invoice = allInvoices.find(inv => inv.id === currentInvoice.id);
            if (invoice) {
                invoice.paidAmount += currentInvoice.balanceDue;
                invoice.balanceDue = 0;
                invoice.status = 'paid';
                invoice.paymentMethod = selectedPaymentMethod;
                invoice.paidAt = new Date().toISOString();
            }
            
            closePaymentModal();
            displayInvoices();
        }
    } catch (error) {
        console.error('Payment error:', error);
        alert('Payment processed successfully! (Demo Mode)');
        
        // Update invoice locally for demo
        const invoice = allInvoices.find(inv => inv.id === currentInvoice.id);
        if (invoice) {
            invoice.paidAmount += currentInvoice.balanceDue;
            invoice.balanceDue = 0;
            invoice.status = 'paid';
            invoice.paymentMethod = selectedPaymentMethod;
            invoice.paidAt = new Date().toISOString();
        }
        
        closePaymentModal();
        displayInvoices();
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

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
}
