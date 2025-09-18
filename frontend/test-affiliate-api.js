// Simple test to verify affiliate API calls
async function testAffiliateAPI() {
    const API_BASE_URL = 'http://localhost:5000/api';
    
    console.log('🔍 Testing Affiliate API...');
    
    // Get token from localStorage (you'll need to be logged in)
    const token = localStorage.getItem('access_token');
    console.log('Auth token:', token ? 'Present' : 'Missing');
    
    if (!token) {
        console.error('❌ No auth token found! Please log in first.');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/affiliates`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', [...response.headers.entries()]);
        
        const data = await response.json();
        console.log('Response data:', data);
        
        if (response.ok) {
            console.log('✅ API call successful!');
            if (data.success && data.data) {
                console.log(`Found ${data.data.length} affiliates:`, data.data);
            }
        } else {
            console.error('❌ API call failed:', data);
        }
    } catch (error) {
        console.error('❌ Network error:', error);
    }
}

// Run the test
testAffiliateAPI();