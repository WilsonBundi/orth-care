// Appointments Management JavaScript

const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

if (!token) {
    window.location.href = '/login.html';
}

// Mock doctors data (in production, fetch from API)
const doctors = {
    orthopedics: [
        { id: 'doc1', name: 'Dr. James Mwangi', specialty: 'Orthopedics' },
        { id: 'doc2', name: 'Dr. Sarah Njeri', specialty: 'Orthopedics' }
    ],
    sports_medicine: [
        { id: 'doc3', name: 'Dr. Peter Kamau', specialty: 'Sports Medicine' }
    ],
    spine: [
        { id: 'doc4', name: 'Dr. Grace Wanjiku', specialty: 'Spine Care' }
    ],
    joint: [
        { id: 'doc5', name: 'Dr. David Ochieng', specialty: 'Joint Replacement' }
    ],
    trauma: [
        { id: 'doc6', name: 'Dr. Mary Akinyi', specialty: 'Trauma Care' }
    ],
    pediatric: [
        { id: 'doc7', name: 'Dr. John Kipchoge', specialty: 'Pediatric Orthopedics' }
    ]
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadAppointments();
    setMinDate();
});

function setupEventListeners() {
    // Specialty change
    document.getElementById('specialty').addEventListener('change', (e) => {
        loadDoctors(e.target.value);
        clearTimeSlots();
    });
    
    // Doctor or date change
    document.getElementById('doctor').addEventListener('change', loadTimeSlots);
    document.getElementById('appointmentDate').addEventListener('change', loadTimeSlots);
    
    // Form submission
    document.getElementById('bookingForm').addEventListener('submit', handleBooking);
}

function setMinDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('appointmentDate').setAttribute('min', today);
}

function loadDoctors(specialty) {
    const doctorSelect = document.getElementById('doctor');
    doctorSelect.innerHTML = '<option value="">Select Doctor</option>';
    
    if (specialty && doctors[specialty]) {
        doctors[specialty].forEach(doc => {
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = doc.name;
            doctorSelect.appendChild(option);
        });
    }
}

async function loadTimeSlots() {
    const doctorId = document.getElementById('doctor').value;
    const date = document.getElementById('appointmentDate').value;
    
    if (!doctorId || !date) {
        clearTimeSlots();
        return;
    }
    
    const timeSlotsContainer = document.getElementById('timeSlots');
    timeSlotsContainer.innerHTML = '<p style="color: #999;">Loading available slots...</p>';
    
    try {
        const response = await fetch(`/api/appointments/available-slots?doctorId=${doctorId}&date=${date}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            displayTimeSlots(data.slots || generateDefaultSlots());
        } else {
            displayTimeSlots(generateDefaultSlots());
        }
    } catch (error) {
        console.error('Error loading slots:', error);
        displayTimeSlots(generateDefaultSlots());
    }
}

function generateDefaultSlots() {
    const slots = [];
    for (let hour = 9; hour < 17; hour++) {
        slots.push(`${hour.toString().padStart(2, '0')}:00`);
        slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
}

function displayTimeSlots(slots) {
    const container = document.getElementById('timeSlots');
    container.innerHTML = '';
    
    if (slots.length === 0) {
        container.innerHTML = '<p style="color: #999;">No available slots for this date</p>';
        return;
    }
    
    slots.forEach(slot => {
        const slotDiv = document.createElement('div');
        slotDiv.className = 'time-slot';
        slotDiv.textContent = slot;
        slotDiv.onclick = () => selectTimeSlot(slot, slotDiv);
        container.appendChild(slotDiv);
    });
}

function selectTimeSlot(time, element) {
    // Remove previous selection
    document.querySelectorAll('.time-slot').forEach(slot => {
        slot.classList.remove('selected');
    });
    
    // Select new slot
    element.classList.add('selected');
    document.getElementById('selectedTime').value = time;
}

function clearTimeSlots() {
    document.getElementById('timeSlots').innerHTML = '<p style="color: #999;">Select a date and doctor to view available slots</p>';
    document.getElementById('selectedTime').value = '';
}

async function handleBooking(e) {
    e.preventDefault();
    
    const selectedTime = document.getElementById('selectedTime').value;
    if (!selectedTime) {
        showAlert('Please select a time slot', 'error');
        return;
    }
    
    const formData = {
        doctorId: document.getElementById('doctor').value,
        appointmentDate: document.getElementById('appointmentDate').value,
        startTime: selectedTime,
        endTime: calculateEndTime(selectedTime),
        appointmentType: document.getElementById('appointmentType').value,
        reason: document.getElementById('reason').value,
        symptoms: document.getElementById('symptoms').value.split(',').map(s => s.trim()).filter(s => s)
    };
    
    try {
        const response = await fetch('/api/appointments', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            showAlert('Appointment booked successfully! You will receive a confirmation email.', 'success');
            document.getElementById('bookingForm').reset();
            clearTimeSlots();
            loadAppointments();
            setTimeout(() => switchTab('upcoming'), 2000);
        } else {
            const error = await response.json();
            showAlert(error.error || 'Failed to book appointment', 'error');
        }
    } catch (error) {
        console.error('Booking error:', error);
        showAlert('Network error. Please try again.', 'error');
    }
}

function calculateEndTime(startTime) {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endMinutes = minutes + 30;
    const endHours = hours + Math.floor(endMinutes / 60);
    return `${endHours.toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`;
}

async function loadAppointments() {
    try {
        const response = await fetch('/api/appointments/my-appointments', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const appointments = await response.json();
            displayAppointments(appointments);
        } else {
            console.error('Failed to load appointments');
        }
    } catch (error) {
        console.error('Error loading appointments:', error);
    }
}

function displayAppointments(appointments) {
    const now = new Date();
    const upcoming = appointments.filter(apt => {
        const aptDate = new Date(apt.appointmentDate);
        return aptDate >= now && ['scheduled', 'confirmed'].includes(apt.status);
    });
    
    const past = appointments.filter(apt => {
        const aptDate = new Date(apt.appointmentDate);
        return aptDate < now || ['completed', 'cancelled', 'no_show'].includes(apt.status);
    });
    
    displayAppointmentList('upcomingList', upcoming, true);
    displayAppointmentList('pastList', past, false);
}

function displayAppointmentList(containerId, appointments, showActions) {
    const container = document.getElementById(containerId);
    
    if (appointments.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📅</div>
                <p>No ${containerId.includes('upcoming') ? 'upcoming' : 'past'} appointments</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = appointments.map(apt => {
        const date = new Date(apt.appointmentDate);
        const doctorName = getDoctorName(apt.doctorId);
        
        return `
            <div class="appointment-item">
                <div class="appointment-date">
                    <span class="day">${date.getDate()}</span>
                    <span class="month">${date.toLocaleString('default', { month: 'short' })}</span>
                </div>
                <div class="appointment-details">
                    <h3>${doctorName}</h3>
                    <p><strong>Time:</strong> ${apt.startTime} - ${apt.endTime}</p>
                    <p><strong>Type:</strong> ${formatAppointmentType(apt.appointmentType)}</p>
                    <p><strong>Reason:</strong> ${apt.reason || 'N/A'}</p>
                    <span class="status-badge status-${apt.status}">${apt.status}</span>
                </div>
                ${showActions ? `
                    <div class="appointment-actions">
                        <button class="btn btn-secondary btn-sm" onclick="rescheduleAppointment('${apt.id}')">Reschedule</button>
                        <button class="btn btn-danger btn-sm" onclick="cancelAppointment('${apt.id}')">Cancel</button>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

function getDoctorName(doctorId) {
    for (const specialty in doctors) {
        const doctor = doctors[specialty].find(d => d.id === doctorId);
        if (doctor) return doctor.name;
    }
    return 'Doctor';
}

function formatAppointmentType(type) {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

async function cancelAppointment(appointmentId) {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    
    const reason = prompt('Please provide a reason for cancellation (optional):');
    
    try {
        const response = await fetch(`/api/appointments/${appointmentId}/cancel`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ reason })
        });
        
        if (response.ok) {
            alert('Appointment cancelled successfully');
            loadAppointments();
        } else {
            alert('Failed to cancel appointment');
        }
    } catch (error) {
        console.error('Cancel error:', error);
        alert('Network error. Please try again.');
    }
}

async function rescheduleAppointment(appointmentId) {
    alert('Reschedule feature: Please cancel this appointment and book a new one.');
    // In production, implement a proper reschedule modal
}

function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

function showAlert(message, type) {
    const alertDiv = document.getElementById('bookingAlert');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    alertDiv.style.display = 'block';
    
    setTimeout(() => {
        alertDiv.style.display = 'none';
    }, 5000);
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
