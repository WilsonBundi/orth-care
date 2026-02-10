let currentStep = 1;
const totalSteps = 6;
let dependantCount = 0;
const formData = {};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateProgress();
    
    // Citizenship change handler
    document.querySelectorAll('input[name="citizenship"]').forEach(radio => {
        radio.addEventListener('change', updateIdTypeOptions);
    });
});

function updateProgress() {
    const progressLine = document.getElementById('progressLine');
    const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;
    progressLine.style.width = progress + '%';
    
    // Update step indicators
    document.querySelectorAll('.step').forEach((step, index) => {
        const stepNum = index + 1;
        step.classList.remove('active', 'completed');
        
        if (stepNum < currentStep) {
            step.classList.add('completed');
        } else if (stepNum === currentStep) {
            step.classList.add('active');
        }
    });
    
    // Show/hide buttons
    document.getElementById('prevBtn').style.display = currentStep === 1 ? 'none' : 'block';
    document.getElementById('btnText').textContent = currentStep === totalSteps ? 'Complete Registration' : 'Next';
}

function nextStep() {
    if (!validateCurrentStep()) {
        return;
    }
    
    saveCurrentStepData();
    
    if (currentStep === totalSteps) {
        submitRegistration();
        return;
    }
    
    // Hide current step
    document.querySelector(`.step-content[data-step="${currentStep}"]`).classList.remove('active');
    
    // Show next step
    currentStep++;
    document.querySelector(`.step-content[data-step="${currentStep}"]`).classList.add('active');
    
    updateProgress();
    window.scrollTo(0, 0);
}

function previousStep() {
    if (currentStep === 1) return;
    
    // Hide current step
    document.querySelector(`.step-content[data-step="${currentStep}"]`).classList.remove('active');
    
    // Show previous step
    currentStep--;
    document.querySelector(`.step-content[data-step="${currentStep}"]`).classList.add('active');
    
    updateProgress();
    window.scrollTo(0, 0);
}

function validateCurrentStep() {
    hideAlert();
    clearAllErrors();
    
    let isValid = true;
    
    switch(currentStep) {
        case 1: // Citizenship
            if (!document.querySelector('input[name="citizenship"]:checked')) {
                showAlert('Please select your citizenship status', 'error');
                isValid = false;
            }
            if (!document.getElementById('idNumber').value.trim()) {
                showFieldError('idNumber', 'ID/Passport number is required');
                isValid = false;
            }
            break;
            
        case 2: // Personal Info
            if (!document.getElementById('firstName').value.trim()) {
                showFieldError('firstName', 'First name is required');
                isValid = false;
            }
            if (!document.getElementById('lastName').value.trim()) {
                showFieldError('lastName', 'Last name is required');
                isValid = false;
            }
            if (!document.getElementById('dateOfBirth').value) {
                showFieldError('dateOfBirth', 'Date of birth is required');
                isValid = false;
            }
            if (!document.getElementById('gender').value) {
                showFieldError('gender', 'Gender is required');
                isValid = false;
            }
            break;
            
        case 3: // Location
            if (!document.getElementById('country').value) {
                showFieldError('country', 'Country is required');
                isValid = false;
            }
            if (!document.getElementById('county').value) {
                showFieldError('county', 'County is required');
                isValid = false;
            }
            if (!document.getElementById('constituency').value.trim()) {
                showFieldError('constituency', 'Constituency is required');
                isValid = false;
            }
            if (!document.getElementById('ward').value.trim()) {
                showFieldError('ward', 'Ward is required');
                isValid = false;
            }
            if (!document.getElementById('address').value.trim()) {
                showFieldError('address', 'Physical address is required');
                isValid = false;
            }
            break;
            
        case 4: // Contact
            const phone = document.getElementById('phoneNumber').value.trim();
            const email = document.getElementById('email').value.trim();
            
            if (!phone) {
                showFieldError('phoneNumber', 'Phone number is required');
                isValid = false;
            } else if (!validatePhone(phone)) {
                showFieldError('phoneNumber', 'Invalid phone format. Use: +254 700 000 000');
                isValid = false;
            }
            
            if (!email) {
                showFieldError('email', 'Email is required');
                isValid = false;
            } else if (!validateEmail(email)) {
                showFieldError('email', 'Invalid email address');
                isValid = false;
            }
            break;
            
        case 5: // Dependants (optional, no validation needed)
            break;
            
        case 6: // Security
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            if (!password) {
                showFieldError('password', 'Password is required');
                isValid = false;
            } else if (!validatePassword(password)) {
                showFieldError('password', 'Password must be at least 8 characters with uppercase, lowercase, number, and special character');
                isValid = false;
            }
            
            if (password !== confirmPassword) {
                showFieldError('confirmPassword', 'Passwords do not match');
                isValid = false;
            }
            
            if (!document.getElementById('termsAccept').checked) {
                showAlert('Please accept the terms and conditions', 'error');
                isValid = false;
            }
            break;
    }
    
    if (!isValid) {
        showAlert('Please fix the errors above', 'error');
    }
    
    return isValid;
}

function saveCurrentStepData() {
    const inputs = document.querySelector(`.step-content[data-step="${currentStep}"]`).querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        if (input.type === 'radio') {
            if (input.checked) {
                formData[input.name] = input.value;
            }
        } else if (input.type === 'checkbox') {
            formData[input.name] = input.checked;
        } else {
            formData[input.name] = input.value;
        }
    });
}

function addDependant() {
    dependantCount++;
    const container = document.getElementById('dependantsContainer');
    
    const dependantCard = document.createElement('div');
    dependantCard.className = 'dependant-card';
    dependantCard.id = `dependant-${dependantCount}`;
    
    dependantCard.innerHTML = `
        <div class="dependant-header">
            <div class="dependant-title">Dependant ${dependantCount}</div>
            <button type="button" class="btn-remove" onclick="removeDependant(${dependantCount})">Remove</button>
        </div>
        
        <div class="form-group">
            <label>Relationship <span class="required">*</span></label>
            <select name="dependant_${dependantCount}_relationship" required>
                <option value="">Select Relationship</option>
                <option value="spouse">Spouse</option>
                <option value="child">Biological Child</option>
                <option value="adopted">Adopted Child</option>
                <option value="loco_parentis">Child in Loco Parentis</option>
                <option value="disabled_relative">Disabled Relative</option>
            </select>
        </div>
        
        <div class="form-row">
            <div class="form-group">
                <label>First Name <span class="required">*</span></label>
                <input type="text" name="dependant_${dependantCount}_firstName" required>
            </div>
            <div class="form-group">
                <label>Last Name <span class="required">*</span></label>
                <input type="text" name="dependant_${dependantCount}_lastName" required>
            </div>
        </div>
        
        <div class="form-row">
            <div class="form-group">
                <label>ID/Birth Certificate Number <span class="required">*</span></label>
                <input type="text" name="dependant_${dependantCount}_idNumber" required>
            </div>
            <div class="form-group">
                <label>Date of Birth <span class="required">*</span></label>
                <input type="date" name="dependant_${dependantCount}_dob" required>
            </div>
        </div>
        
        <div class="form-group">
            <label>Gender <span class="required">*</span></label>
            <select name="dependant_${dependantCount}_gender" required>
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
            </select>
        </div>
    `;
    
    container.appendChild(dependantCard);
}

function removeDependant(id) {
    const card = document.getElementById(`dependant-${id}`);
    if (card) {
        card.remove();
    }
}

function updateIdTypeOptions() {
    const citizenship = document.querySelector('input[name="citizenship"]:checked').value;
    const idTypeSelect = document.getElementById('idType');
    
    idTypeSelect.innerHTML = '';
    
    if (citizenship === 'kenyan') {
        idTypeSelect.innerHTML = `
            <option value="national_id">National ID</option>
            <option value="birth_certificate">Birth Certificate (Under 18)</option>
        `;
    } else if (citizenship === 'foreign') {
        idTypeSelect.innerHTML = `
            <option value="passport">Passport</option>
            <option value="refugee_id">Refugee ID</option>
        `;
    } else if (citizenship === 'resident') {
        idTypeSelect.innerHTML = `
            <option value="passport">Passport</option>
            <option value="resident_permit">Resident Permit</option>
        `;
    }
}

async function submitRegistration() {
    setLoading(true);
    
    try {
        // Collect all form data
        saveCurrentStepData();
        
        // Collect dependants
        const dependants = [];
        document.querySelectorAll('.dependant-card').forEach(card => {
            const inputs = card.querySelectorAll('input, select');
            const dependant = {};
            inputs.forEach(input => {
                const key = input.name.split('_').pop();
                dependant[key] = input.value;
            });
            dependants.push(dependant);
        });
        
        formData.dependants = dependants;
        
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAlert('Registration successful! Redirecting to dashboard...', 'success');
            
            // Store auth data
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            setTimeout(() => {
                window.location.href = '/dashboard.html';
            }, 2000);
        } else {
            showAlert(data.error || 'Registration failed. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showAlert('Network error. Please check your connection and try again.', 'error');
    } finally {
        setLoading(false);
    }
}

// Validation helpers
function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone) {
    return /^\+254\s?\d{3}\s?\d{3}\s?\d{3}$/.test(phone);
}

function validatePassword(password) {
    return password.length >= 8 &&
           /[A-Z]/.test(password) &&
           /[a-z]/.test(password) &&
           /[0-9]/.test(password) &&
           /[^A-Za-z0-9]/.test(password);
}

// UI helpers
function showFieldError(field, message) {
    const input = document.getElementById(field);
    const error = document.getElementById(field + 'Error');
    if (input) input.classList.add('error');
    if (error) {
        error.textContent = message;
        error.classList.add('show');
    }
}

function clearFieldError(field) {
    const input = document.getElementById(field);
    const error = document.getElementById(field + 'Error');
    if (input) input.classList.remove('error');
    if (error) {
        error.classList.remove('show');
        error.textContent = '';
    }
}

function clearAllErrors() {
    document.querySelectorAll('.field-error').forEach(el => el.classList.remove('show'));
    document.querySelectorAll('input, select').forEach(el => el.classList.remove('error'));
}

function showAlert(message, type = 'error') {
    const alertMsg = document.getElementById('alertMsg');
    alertMsg.textContent = message;
    alertMsg.className = 'alert ' + type + ' show';
    alertMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideAlert() {
    document.getElementById('alertMsg').classList.remove('show');
}

function setLoading(loading) {
    const btn = document.getElementById('nextBtn');
    const btnText = document.getElementById('btnText');
    btn.disabled = loading;
    if (loading) {
        btnText.innerHTML = '<span class="loading"></span>Processing...';
    } else {
        btnText.textContent = currentStep === totalSteps ? 'Complete Registration' : 'Next';
    }
}

// Clear errors on input
document.addEventListener('input', (e) => {
    if (e.target.id) {
        clearFieldError(e.target.id);
    }
});
