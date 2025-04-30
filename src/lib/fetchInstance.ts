const API_URL = import.meta.env.VITE_API_URL

const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
    const token = sessionStorage.getItem('token')
    // console.log('token received: ', token)

    if (!token) {
        throw new Error('No authentication token found');
    }
    
    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
    };
    
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Authentication failed');
    }
    
    return response.json();
};

export default fetchWithAuth;