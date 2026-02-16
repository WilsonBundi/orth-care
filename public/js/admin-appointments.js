// Admin Appointment Management JavaScript

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
    alert('Access denied: This page requires staff privileges (Receptionist level or higher)');
    window.location.href = '/dashboard.html';
}

let allAppointments = [];
let filteredAppointments = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadAppointments();
    loadDoctors();
    setTodayDate();
});

function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('filterDate').value = today;
}

async function loadDoctors() {
    // Load doctors for filter dropdown
    const doctors = [
        { id: 'doc1', name: 'Dr. James Mwangi' },
        { id: 'doc2', name: 'Dr. Sarah Njeri' },
        { id: 'doc3', name: 'Dr. Peter Kamau' },
        { id: 'doc4', name: 'Dr. Grace Wanjiku' },
        { id: 'doc5', name: 'Dr. David Ochieng' },
        { id: 'doc6', name: 'Dr. Mary Akinyi' },
        { id: 'doc7', name: 'Dr. John Kipchoge' }
    ];
    
    const select = document.getElementById('filterDoctor');
    doctors.forEach(doc => {
        const option = document.createElement('option');
        option.value = doc.id;
        option.textContent = doc.name;
        select.appendChild(option);
    });
}

async function loadAppointments() {
    try {
        const response = await fetch('/api/appointments/all', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            allAppointments = await response.json();
            filteredAppointments = [...allAppointments];
            updateStatistics();
            displayAppointments();
        } else {
            console.error('Failed to load appointments');
            allAppointments = [];
            filteredAppointments = [];
            displayAppointments();
        }
    } catch (error) {
        console.error('Error loading appointments:', error);
        allAppointments = [];
        filteredAppointments = [];
        displayAppointments();
    }
}

function updateStatistics() {
    const today = new Date().toISOString().split('T')[0];
    
    const total = allAppointments.length;
    const todayAppts = allAppointments.filter(apt => 
        apt.appointmentDate && apt.appointmentDate.startsWith(today)
    ).length;
    const pending = allAppointments.filter(apt => 
        apt.status === 'scheduled'
    ).length;
    const completedToday = allAppointments.filter(apt => 
        apt.appointmentDate && apt.appointmentDate.startsWith(today) && apt.status === 'completed'
    ).length;
    
    document.getElementById('totalAppointments').textContent = total;
    document.getElementById('todayAppointments').textContent = todayAppts;
    document.getElementById('pendingAppointments').textContent = pending;
    document.getElementById('completedToday').textContent = completedToday;
}

function applyFilters() {
    const dateFilter = document.getElementById('filterDate').value;
    const statusFilter = document.getElementById('filterStatus').value;
    const doctorFilter = document.getElementById('filterDoctor').value;
    const searchFilter = document.getElementById('searchPatient').value.toLowerCase();
    
    filteredAppointments = allAppointments.filter(apt => {
        // Date filter
        if (dateFilter && apt.appointmentDate && !apt.appointmentDate.startsWith(dateFilter)) {
            return false;
        }
        
        // Status filter
        if (statusFilter && apt.status !== statusFilter) {
            return false;
        }
        
        // Doctor filter
        if (doctorFilter && apt.doctorId !== doctorFilter) {
            return false;
        }
        
        // Patient search
        if (searchFilter) {
            const patientName = (apt.patientName || '').toLowerCase();
            const patientId = (apt.userId || '').toLowerCase();
            if (!patientName.includes(searchFilter) && !patientId.includes(searchFilter)) {
                return false;
            }
        }
        
        return true;
    });
    
    displayAppointments();
}

function displayAppointments() {
    const container = document.getElementById('appointmentsContainer');
    
    if (filteredAppointments.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📅</div>
                <p>No appointments found</p>
                <p style="font-size: 14px; margin-top: 10px;">Try adjusting your filters</p>
            </div>
        `;
        return;
    }
    
    // Sort by date and time (most recent first)
    const sorted = [...filteredAppointments].sort((a, b) => {
        const dateA = new Date(a.appointmentDate + ' ' + (a.appointmentTime || '00:00'));
        const dateB = new Date(b.appointmentDate + ' ' + (b.appointmentTime || '00:00'));
        return dateB - dateA;
    });
    
    container.innerHTML = `
        <table class="appointments-table">
            <thead>
                <tr>
                    <th>Date & Time</th>
                    <th>Patient</th>
                    <th>Doctor</th>
                    <th>Specialty</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${sorted.map(apt => {
                    const date = apt.appointmentDate ? new Date(apt.appointmentDate).toLocaleDateString() : 'N/A';
                    const time = apt.appointmentTime || 'N/A';
                    const patientName = apt.patientName || 'Unknown Patient';
                    const doctorName = getDoctorName(apt.doctorId);
                    const specialty = formatSpecialty(apt.specialty);
                    const type = formatAppointmentType(apt.appointmentType);
                    const status = apt.status || 'scheduled';
                    
                    return `
                        <tr>
                            <td><strong>${date}</strong><br>${time}</td>
                            <td>${patientName}</td>
                            <td>${doctorName}</td>
                            <td>${specialty}</td>
                            <td>${type}</td>
                            <td><span class="status-badge status-${status}">${formatStatus(status)}</span></td>
                            <td>
                                <div class="action-buttons">
                                    ${status === 'scheduled' ? `
                                        <button class="btn btn-success" onclick="confirmAppointment('${apt.id}')">Confirm</button>
                                    ` : ''}
                                    ${status === 'confirmed' ? `
                                        <button class="btn btn-primary" onclick="completeAppointment('${apt.id}')">Complete</button>
                                    ` : ''}
                                    ${status !== 'completed' && status !== 'cancelled' ? `
                                        <button class="btn btn-danger" onclick="cancelAppointment('${apt.id}')">Cancel</button>
                                    ` : ''}
                                    <button class="btn btn-secondary" onclick="viewDetails('${apt.id}')">Details</button>
                                </div>
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

function getDoctorName(doctorId) {
    const doctors = {
        'doc1': 'Dr. James Mwangi',
        'doc2': 'Dr. Sarah Njeri',
        'doc3': 'Dr. Peter Kamau',
        'doc4': 'Dr. Grace Wanjiku',
        'doc5': 'Dr. David Ochieng',
        'doc6': 'Dr. Mary Akinyi',
        'doc7': 'Dr. John Kipchoge'
    };
    return doctors[doctorId] || 'Unknown Doctor';
}

function formatSpecialty(specialty) {
    const specialties = {
        'orthopedics': 'Orthopedics',
        'sports_medicine': 'Sports Medicine',
        'spine': 'Spine Care',
        'joint': 'Joint Replacement',
        'trauma': 'Trauma Care',
        'pediatric': 'Pediatric Orthopedics'
    };
    return specialties[specialty] || specialty;
}

function formatAppointmentType(type) {
    const types = {
        'consultation': 'Consultation',
        'follow_up': 'Follow-up',
        'routine_checkup': 'Routine Checkup',
        'emergency': 'Emergency'
    };
    return types[type] || type;
}

function formatStatus(status) {
    const statuses = {
        'scheduled': 'Scheduled',
        'confirmed': 'Confirmed',
        'completed': 'Completed',
        'cancelled': 'Cancelled'
    };
    return statuses[status] || status;
}

async function confirmAppointment(appointmentId) {
    if (!confirm('Confirm this appointment?')) return;
    
    try {
        const response = await fetch(`/api/appointments/${appointmentId}/confirm`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            alert('Appointment confirmed successfully!');
            loadAppointments();
        } else {
            const error = await response.json();
            alert(`Failed to confirm appointment: ${error.message || 'Please try again'}`);
        }
    } catch (error) {
        console.error('Error confirming appointment:', error);
        alert('Failed to confirm appointment. Please check your connection.');
    }
}

async function completeAppointment(appointmentId) {
    if (!confirm('Mark this appointment as completed?')) return;
    
    try {
        const response = await fetch(`/api/appointments/${appointmentId}/complete`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            alert('Appointment marked as completed!');
            loadAppointments();
        } else {
            const error = await response.json();
            alert(`Failed to complete appointment: ${error.message || 'Please try again'}`);
        }
    } catch (error) {
        console.error('Error completing appointment:', error);
        alert('Failed to complete appointment. Please check your connection.');
    }
}

async function cancelAppointment(appointmentId) {
    const reason = prompt('Enter cancellation reason (optional):');
    if (reason === null) return; // User clicked cancel
    
    try {
        const response = await fetch(`/api/appointments/${appointmentId}/cancel`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ reason: reason || 'Cancelled by admin' })
        });
        
        if (response.ok) {
            alert('Appointment cancelled successfully!');
            loadAppointments();
        } else {
            const error = await response.json();
            alert(`Failed to cancel appointment: ${error.message || 'Please try again'}`);
        }
    } catch (error) {
        console.error('Error cancelling appointment:', error);
        alert('Failed to cancel appointment. Please check your connection.');
    }
}

function viewDetails(appointmentId) {
    const apt = allAppointments.find(a => a.id === appointmentId);
    if (!apt) return;
    
    const date = apt.appointmentDate ? new Date(apt.appointmentDate).toLocaleDateString() : 'N/A';
    const time = apt.appointmentTime || 'N/A';
    const patientName = apt.patientName || 'Unknown Patient';
    const doctorName = getDoctorName(apt.doctorId);
    const specialty = formatSpecialty(apt.specialty);
    const type = formatAppointmentType(apt.appointmentType);
    const status = formatStatus(apt.status || 'scheduled');
    const reason = apt.reason || 'Not provided';
    const symptoms = apt.symptoms || 'Not provided';
    
    const details = `
Appointment Details
==================

Date: ${date}
Time: ${time}
Status: ${status}

Patient: ${patientName}
Doctor: ${doctorName}
Specialty: ${specialty}
Type: ${type}

Reason for Visit:
${reason}

Symptoms:
${symptoms}

Appointment ID: ${apt.id}
Created: ${apt.createdAt ? new Date(apt.createdAt).toLocaleString() : 'N/A'}
    `;
    
    alert(details);
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
