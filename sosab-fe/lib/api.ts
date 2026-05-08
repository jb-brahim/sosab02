import axios from 'axios';

// Create an axios instance
export const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://57-131-35-75.sslip.io/sosab02';
const api = axios.create({
    baseURL: `${BACKEND_URL}/api`,
    timeout: 60000, // 60 seconds to accommodate PDF generation
});

// Add a request interceptor to inject the token
api.interceptors.request.use(
    (config) => {
        // Get token from localStor
        // Note: auth-context saves the user object which might contain the token, 
        // or we might save the token separately. 
        // For now, let's assume we'll modify auth-context to save 'token' in localStorage
        // or we'll parse it from the user object.

        // Let's implement a safe check
        const storedUser = localStorage.getItem('sosab-user');
        if (storedUser) {
            try {
                const user = JSON.parse(storedUser);
                if (user.token) {
                    config.headers.Authorization = `Bearer ${user.token}`;
                }
            } catch (error) {
                // failed to parse
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle 401 errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('sosab-user');
            // Force redirect to login
            if (typeof window !== 'undefined') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
