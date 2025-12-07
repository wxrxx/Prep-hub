// ============================================
// PREP HUB - API Configuration
// ============================================

// Change this to your Render backend URL after deployment
const API_CONFIG = {
    // Development (local)
    // BASE_URL: 'http://localhost:3000',

    // Production (Render)
    BASE_URL: 'https://prep-hub-qwej.onrender.com',

    // Endpoints
    ENDPOINTS: {
        // Auth
        LOGIN: '/api/auth/login',
        REGISTER: '/api/auth/register',
        ME: '/api/auth/me',
        PROFILE: '/api/auth/profile',

        // Courses
        COURSES: '/api/courses',
        COURSE: (id) => `/api/courses/${id}`,

        // Favorites
        FAVORITES: '/api/favorites',
        FAVORITE: (courseId) => `/api/favorites/${courseId}`,
        CHECK_FAVORITE: (courseId) => `/api/favorites/check/${courseId}`,

        // Brands
        BRANDS: '/api/brands',
        BRAND: (id) => `/api/brands/${id}`,

        // Stats
        STATS: '/api/stats'
    }
};

// API Helper Functions
const api = {
    // Get auth token from localStorage (always use localStorage for simplicity)
    getToken() {
        return localStorage.getItem('prepHubToken');
    },

    // Set auth token
    setToken(token) {
        localStorage.setItem('prepHubToken', token);
    },

    // Remove auth token
    removeToken() {
        localStorage.removeItem('prepHubToken');
    },

    // Make API request
    async request(endpoint, options = {}) {
        const url = API_CONFIG.BASE_URL + endpoint;
        const token = this.getToken();

        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            const data = await response.json();

            if (!response.ok) {
                const error = new Error(data.error || 'เกิดข้อผิดพลาด');
                error.status = response.status;
                throw error;
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // GET request
    get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    },

    // POST request
    post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    // PUT request
    put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    // DELETE request
    delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
};

// Auth functions
const auth = {
    async login(email, password, rememberMe = true) {
        const data = await api.post(API_CONFIG.ENDPOINTS.LOGIN, { email, password });
        if (data.token) {
            api.setToken(data.token);
            localStorage.setItem('prepHubUser', JSON.stringify(data.user));
            // Store rememberMe preference
            localStorage.setItem('prepHubRememberMe', rememberMe ? 'true' : 'false');
        }
        return data;
    },

    async register(name, email, password) {
        const data = await api.post(API_CONFIG.ENDPOINTS.REGISTER, { name, email, password });
        if (data.token) {
            api.setToken(data.token);
            localStorage.setItem('prepHubUser', JSON.stringify(data.user));
            localStorage.setItem('prepHubRememberMe', 'true');
        }
        return data;
    },

    async updateProfile(data) {
        const response = await api.put(API_CONFIG.ENDPOINTS.PROFILE, data);
        if (response.message) {
            // Update local storage user data
            const currentUser = this.getUser();
            const updatedUser = { ...currentUser, ...data };
            localStorage.setItem('prepHubUser', JSON.stringify(updatedUser));
        }
        return response;
    },

    logout() {
        api.removeToken();
        localStorage.removeItem('prepHubUser');
        localStorage.removeItem('prepHubRememberMe');
        window.location.href = '/';
    },

    isLoggedIn() {
        return !!api.getToken();
    },

    getUser() {
        const user = localStorage.getItem('prepHubUser');
        return user ? JSON.parse(user) : null;
    },

    // Verify that stored token is still valid with the server
    async verifySession() {
        const token = api.getToken();
        if (!token) return false;

        try {
            // Call /api/auth/me to verify token is still valid
            const data = await api.get(API_CONFIG.ENDPOINTS.ME);
            // Update stored user data with fresh data from server
            if (data.user) {
                localStorage.setItem('prepHubUser', JSON.stringify(data.user));
            }
            console.log('✅ Session verified');
            return true;
        } catch (error) {
            // Only clear token if explicitly unauthorized (401) or forbidden (403)
            if (error.status === 401 || error.status === 403) {
                console.log('❌ Session expired or invalid (401/403)');
                api.removeToken();
                localStorage.removeItem('prepHubUser');
                return false;
            }
            // For other errors (network, 500, etc), throw so caller knows it failed but don't log out
            console.warn('⚠️ Session verification failed (network/server error), keeping local session', error);
            throw error;
        }
    },

    // Initialize session on page load
    async initSession() {
        if (this.isLoggedIn()) {
            const isValid = await this.verifySession();
            return isValid;
        }
        return false;
    }
};

// Courses functions
const courses = {
    async getAll(params = {}) {
        const query = new URLSearchParams(params).toString();
        const endpoint = API_CONFIG.ENDPOINTS.COURSES + (query ? `?${query}` : '');
        return api.get(endpoint);
    },

    async getById(id) {
        return api.get(API_CONFIG.ENDPOINTS.COURSE(id));
    },

    async search(searchTerm, filters = {}) {
        return this.getAll({ search: searchTerm, ...filters });
    }
};

// Favorites functions
const favorites = {
    async getAll() {
        return api.get(API_CONFIG.ENDPOINTS.FAVORITES);
    },

    async add(courseId) {
        return api.post(API_CONFIG.ENDPOINTS.FAVORITE(courseId));
    },

    async remove(courseId) {
        return api.delete(API_CONFIG.ENDPOINTS.FAVORITE(courseId));
    },

    async check(courseId) {
        return api.get(API_CONFIG.ENDPOINTS.CHECK_FAVORITE(courseId));
    }
};

// Export for use
window.API_CONFIG = API_CONFIG;
window.api = api;
window.auth = auth;
window.courses = courses;
window.favorites = favorites;
