/**
 * Kenya Location Data Loader
 * Loads counties and constituencies dynamically
 */

let locationData = null;

// Load location data from JSON file
async function loadLocationData() {
    try {
        const response = await fetch('/data/kenya-locations.json');
        locationData = await response.json();
        populateCounties();
    } catch (error) {
        console.error('Error loading location data:', error);
        // Fallback to basic data if file not found
        useFallbackData();
    }
}

// Populate county dropdown
function populateCounties() {
    const countySelect = document.getElementById('county');
    if (!countySelect || !locationData) return;
    
    // Clear existing options except the first one
    countySelect.innerHTML = '<option value="">Select County</option>';
    
    // Add all counties
    locationData.locations.forEach(location => {
        const option = document.createElement('option');
        option.value = location.county;
        option.textContent = location.county;
        countySelect.appendChild(option);
    });
}

// Load constituencies based on selected county
function loadConstituencies() {
    const countySelect = document.getElementById('county');
    const constituencySelect = document.getElementById('constituency');
    
    if (!countySelect || !constituencySelect || !locationData) return;
    
    const selectedCounty = countySelect.value;
    
    // Reset constituency dropdown
    constituencySelect.innerHTML = '<option value="">Select Constituency</option>';
    constituencySelect.disabled = true;
    
    if (!selectedCounty) return;
    
    // Find the selected county data
    const countyData = locationData.locations.find(loc => loc.county === selectedCounty);
    
    if (countyData && countyData.constituencies) {
        constituencySelect.disabled = false;
        
        // Add constituencies
        countyData.constituencies.forEach(constituency => {
            const option = document.createElement('option');
            option.value = constituency;
            option.textContent = constituency;
            constituencySelect.appendChild(option);
        });
    }
}

// Fallback data if JSON file fails to load
function useFallbackData() {
    locationData = {
        locations: [
            {
                code: "47",
                county: "Nairobi",
                constituencies: ["Dagoretti North", "Dagoretti South", "Embakasi Central", "Embakasi East", "Embakasi North", "Embakasi South", "Embakasi West", "Kamukunji", "Kasarani", "Kibra", "Langata", "Makadara", "Mathare", "Roysambu", "Ruaraka", "Starehe", "Westlands"]
            },
            {
                code: "01",
                county: "Mombasa",
                constituencies: ["Changamwe", "Jomvu", "Kisauni", "Likoni", "Mvita", "Nyali"]
            },
            {
                code: "22",
                county: "Kiambu",
                constituencies: ["Gatundu North", "Gatundu South", "Githunguri", "Juja", "Kabete", "Kiambaa", "Kiambu Town", "Kikuyu", "Lari", "Limuru", "Ruiru", "Thika Town"]
            }
        ]
    };
    populateCounties();
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadLocationData);
} else {
    loadLocationData();
}

// Export functions for use in other scripts
window.loadLocationData = loadLocationData;
window.loadConstituencies = loadConstituencies;
