// Admin Patient Management JavaScript

const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

if (!token) {
    window.location.href = '/login.html';
}

// Check admin access
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
const requiredLevel = roleLevel.receptionist; // Minimum RECEPTIONIST role required

if (userLevel < requiredLevel) {
    alert('Access denied: This page requires staff privileges');
    window.location.href = '/dashboard.html';
}

let allPatients = [];
let filteredPatients = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadCountyFilter();
    loadPatients();
});

// Load county filter options
async function loadCountyFilter() {
    try {
        const response = await fetch('/data/kenya-locations.json');
        const data = await response.json();
        
        const countyFilter = document.getElementById('countyFilter');
        data.locations.forEach(location => {
            const option = document.createElement('option');
            option.value = location.county;
            option.textContent = location.county;
            countyFilter.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading counties:', error);
    }
}

// Load all patients
async function loadPatients() {
    try {
        const response = await fetch('/api/admin/patients', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            allPatients = await response.json();
        } else {
            // Use mock data for demo
            allPatients = getMockPatients();
        }
        
        filteredPatients = [...allPatients];
        displayPatients();
        updateStats();
    } catch (error) {
        console.error('Error loading patients:', error);
        allPatients = getMockPatients();
        filteredPatients = [...allPatients];
        displayPatients();
        updateStats();
    }
}

// Mock patient data
function getMockPatients() {
    return [
        {
            id: 'user_001',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            phoneNumber: '+254712345678',
            dateOfBirth: '1990-05-15',
            address: {
                country: 'Kenya',
                county: 'Nairobi',
                constituency: 'Westlands',
                ward: 'Parklands',
                street: '123 Waiyaki Way'
            },
            role: 'patient',
            createdAt: '2026-02-10T10:30:00Z'
        },
        {
            id: 'user_002',
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane.smith@example.com',
            phoneNumber: '+254723456789',
            dateOfBirth: '1985-08-22',
            address: {
                country: 'Kenya',
                county: 'Kiambu',
                constituency: 'Ruiru',
                ward: 'Biashara',
                street: '456 Thika Road'
            },
            role: 'patient',
            createdAt: '2026-02-15T14:20:00Z'
        },
        {
            id: 'user_003',
            firstName: 'Peter',
            lastName: 'Mwangi',
            email: 'peter.mwangi@example.com',
            phoneNumber: '+254734567890',
            dateOfBirth: '1992-03-10',
            address: {
                country: 'Kenya',
                county: 'Nairobi',
                constituency: 'Embakasi East',
                ward: 'Mihango',
                street: '789 Jogoo Road'
            },
            role: 'patient',
            createdAt: '2026-02-16T09:15:00Z'
        }
    ];
}

// Display patients in table
function displayPatients() {
    const tbody = document.getElementById('patientsTableBody');
    document.getElementById('patientCount').textContent = `${filteredPatients.length} patients`;
    
    if (filteredPatients.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="empty-state">
                        <div class="empty-icon">🔍</div>
                        <p>No patients found</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = filteredPatients.map(patient => {
        const registeredDate = new Date(patient.createdAt);
        const age = calculateAge(patient.dateOfBirth);
        
        return `
            <tr>
                <td>
                    <div class="patient-name">${patient.firstName} ${patient.lastName}</div>
                    <div class="patient-id">${age} years • ID: ${patient.id}</div>
                </td>
                <td>
                    <div>${patient.email}</div>
                    <div style="color: #666; font-size: 13px;">${patient.phoneNumber}</div>
                </td>
                <td>
                    <div>${patient.address?.county || 'N/A'}</div>
                    <div style="color: #666; font-size: 13px;">${patient.address?.constituency || 'N/A'}</div>
                </td>
                <td>${registeredDate.toLocaleDateString()}</td>
                <td>
                    <button class="btn-view" onclick="viewPatient('${patient.id}')">View Details</button>
                </td>
            </tr>
        `;
    }).join('');
}

// Update statistics
function updateStats() {
    document.getElementById('totalPatients').textContent = allPatients.length;
    
    // Count new patients today
    const today = new Date().toDateString();
    const newToday = allPatients.filter(p => {
        const createdDate = new Date(p.createdAt).toDateString();
        return createdDate === today;
    }).length;
    document.getElementById('newToday').textContent = newToday;
    
    // Find top county
    const countyCounts = {};
    allPatients.forEach(p => {
        const county = p.address?.county || 'Unknown';
        countyCounts[county] = (countyCounts[county] || 0) + 1;
    });
    
    const topCounty = Object.keys(countyCounts).reduce((a, b) => 
        countyCounts[a] > countyCounts[b] ? a : b, 'N/A'
    );
    document.getElementById('topCounty').textContent = topCounty;
}

// Search patients
function searchPatients() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const countyFilter = document.getElementById('countyFilter').value;
    
    filteredPatients = allPatients.filter(patient => {
        const matchesSearch = !searchTerm || 
            patient.firstName.toLowerCase().includes(searchTerm) ||
            patient.lastName.toLowerCase().includes(searchTerm) ||
            patient.email.toLowerCase().includes(searchTerm) ||
            patient.phoneNumber.includes(searchTerm);
        
        const matchesCounty = !countyFilter || 
            patient.address?.county === countyFilter;
        
        return matchesSearch && matchesCounty;
    });
    
    displayPatients();
}

// View patient details
function viewPatient(patientId) {
    const patient = allPatients.find(p => p.id === patientId);
    if (!patient) return;
    
    const age = calculateAge(patient.dateOfBirth);
    const registeredDate = new Date(patient.createdAt);
    
    const detailsHtml = `
        <div class="detail-section">
            <div class="section-title">Personal Information</div>
            <div class="detail-grid">
                <div class="detail-item">
                    <div class="detail-label">Full Name</div>
                    <div class="detail-value">${patient.firstName} ${patient.lastName}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Date of Birth</div>
                    <div class="detail-value">${new Date(patient.dateOfBirth).toLocaleDateString()} (${age} years)</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Patient ID</div>
                    <div class="detail-value">${patient.id}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Registration Date</div>
                    <div class="detail-value">${registeredDate.toLocaleDateString()}</div>
                </div>
            </div>
        </div>
        
        <div class="detail-section">
            <div class="section-title">Contact Information</div>
            <div class="detail-grid">
                <div class="detail-item">
                    <div class="detail-label">Email Address</div>
                    <div class="detail-value">${patient.email}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Phone Number</div>
                    <div class="detail-value">${patient.phoneNumber}</div>
                </div>
            </div>
        </div>
        
        <div class="detail-section">
            <div class="section-title">Location Information</div>
            <div class="detail-grid">
                <div class="detail-item">
                    <div class="detail-label">Country</div>
                    <div class="detail-value">${patient.address?.country || 'N/A'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">County</div>
                    <div class="detail-value">${patient.address?.county || 'N/A'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Constituency</div>
                    <div class="detail-value">${patient.address?.constituency || 'N/A'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Ward</div>
                    <div class="detail-value">${patient.address?.ward || 'N/A'}</div>
                </div>
                <div class="detail-item" style="grid-column: 1 / -1;">
                    <div class="detail-label">Physical Address</div>
                    <div class="detail-value">${patient.address?.street || 'N/A'}</div>
                </div>
            </div>
        </div>
        
        <div class="detail-section">
            <div class="section-title">Account Information</div>
            <div class="detail-grid">
                <div class="detail-item">
                    <div class="detail-label">Role</div>
                    <div class="detail-value">${formatRole(patient.role)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Account Status</div>
                    <div class="detail-value" style="color: #28a745;">Active</div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('patientDetails').innerHTML = detailsHtml;
    document.getElementById('patientModal').classList.add('active');
}

// Close patient modal
function closePatientModal() {
    document.getElementById('patientModal').classList.remove('active');
}

// Calculate age from date of birth
function calculateAge(dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age;
}

// Format role
function formatRole(role) {
    const roles = {
        'patient': 'Patient',
        'receptionist': 'Receptionist',
        'nurse': 'Nurse',
        'billing_clerk': 'Billing Clerk',
        'records_manager': 'Records Manager',
        'doctor': 'Doctor',
        'specialist': 'Specialist',
        'clinic_manager': 'Clinic Manager',
        'system_admin': 'System Administrator',
        'super_admin': 'Super Administrator'
    };
    return roles[role] || role;
}

// Logout
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

// Add event listeners
document.getElementById('searchInput').addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
        searchPatients();
    }
});

document.getElementById('countyFilter').addEventListener('change', searchPatients);
