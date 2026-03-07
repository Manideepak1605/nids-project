import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    withCredentials: true, // Required for HttpOnly cookies
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to inject CSRF token
api.interceptors.request.use(
    (config) => {
        const ST_METHODS = ['post', 'put', 'delete', 'patch'];
        if (ST_METHODS.includes(config.method?.toLowerCase())) {
            // We can't use hooks here, but we can access the latest token if we store it globally 
            // or pass it via a separate mechanism. For Next.js, we often use a custom store or 
            // a trick with a non-hook getter. 
            // For now, we'll try to get it from a global variable if set by the AuthProvider.
            if (typeof window !== 'undefined' && window.__CSRF_TOKEN__) {
                config.headers['X-CSRF-Token'] = window.__CSRF_TOKEN__;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor to handle 401 Unauthorized errors
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Attempt to refresh the token
                const { data } = await axios.post('/api/auth/refresh', {}, { withCredentials: true });

                // Elite 9.8: If refresh succeeds, update the CSRF token globally
                if (data.csrfToken && typeof window !== 'undefined') {
                    window.__CSRF_TOKEN__ = data.csrfToken;
                }

                // If refresh succeeds, retry the original request
                return api(originalRequest);
            } catch (refreshError) {
                // If refresh fails, redirect to login or clear context
                // Prevent infinite loop if already on login page
                if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
