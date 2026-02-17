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
    // Mock Data
    MOCK_DATA: [
        {
            id: 1,
            title: 'คณิตศาสตร์ ม.6 เทอม 1 (Full Course)',
            category: 'ม.6',
            subject: 'คณิตศาสตร์',
            brand: 'Enconcept',
            teacher: 'อ.ปอนด์',
            teacherBio: 'ครูสอนคณิตศาสตร์ชื่อดัง ประสบการณ์มากกว่า 10 ปี',
            duration: '30 ชม.',
            lessons: 45,
            students: 1250,
            rating: 4.9,
            reviews_count: 245,
            price: 2990,
            original_price: 3990,
            image_url: 'https://via.placeholder.com/900x400/0ea5e9/ffffff?text=Math+M6',
            description: 'คอร์สเรียนคณิตศาสตร์ ม.6 เทอม 1 แบบครบถ้วน ครอบคลุมทุกบท ตั้งแต่พื้นฐานไปจนถึงโจทย์ยาก เหมาะสำหรับนักเรียนที่ต้องการเข้าใจลึกซึ้งและพร้อมสอบ',
            highlights: ['เนื้อหาครบ 45 บทเรียน', 'มีแบบฝึกหัดพร้อมเฉลย', 'ดูซ้ำได้ไม่จำกัด', 'มีกลุ่มถามตอบ']
        },
        {
            id: 2,
            title: 'TGAT ติวเข้ม ครบทุกเทคนิค',
            category: 'ม.6',
            subject: 'TGAT',
            brand: 'Dek-D School',
            teacher: 'อ.เบิร์ด',
            teacherBio: 'ผู้เชี่ยวชาญด้านการสอบเข้ามหาวิทยาลัย',
            duration: '25 ชม.',
            lessons: 35,
            students: 980,
            rating: 4.8,
            reviews_count: 189,
            price: 3500,
            original_price: 4500,
            image_url: 'https://via.placeholder.com/900x400/0369a1/ffffff?text=TGAT',
            description: 'คอร์สติว TGAT แบบเข้มข้น รวมเทคนิคการทำข้อสอบทุกรูปแบบ พร้อมข้อสอบจำลองและแนวข้อสอบล่าสุด',
            highlights: ['เทคนิคการทำข้อสอบ', 'ข้อสอบจำลอง 10 ชุด', 'วิเคราะห์แนวข้อสอบ', 'สรุปเนื้อหาครบ']
        },
        {
            id: 3,
            title: 'ฟิสิกส์ ม.6 พื้นฐาน-ยาก',
            category: 'ม.6',
            subject: 'ฟิสิกส์',
            brand: 'Chula Tutor',
            teacher: 'อ.โอม',
            teacherBio: 'รุ่นพี่วิศวะจุฬาฯ เกรด 4.0',
            duration: '28 ชม.',
            lessons: 40,
            students: 1500,
            rating: 4.9,
            reviews_count: 312,
            price: 2790,
            original_price: 3500,
            image_url: 'https://via.placeholder.com/900x400/7dd3fc/000000?text=Physics',
            description: 'เรียนฟิสิกส์ ม.6 จากพื้นฐานไปจนถึงโจทย์ยากสุด สอนโดยรุ่นพี่วิศวะจุฬาฯ ที่เข้าใจน้องๆ มากที่สุด',
            highlights: ['สอนละเอียดทุกบท', 'โจทย์กว่า 500 ข้อ', 'เทคนิคการคิดเลข', 'เฉลยละเอียดทุกข้อ']
        },
        {
            id: 4,
            title: 'ชีววิทยา สายแพทย์ ฉบับสมบูรณ์',
            category: 'สายแพทย์',
            subject: 'ชีววิทยา',
            brand: 'Enconcept',
            teacher: 'อ.แบงค์',
            teacherBio: 'จบแพทย์จุฬาฯ สอบติดอันดับ 1',
            duration: '35 ชม.',
            lessons: 50,
            students: 2000,
            rating: 5.0,
            reviews_count: 428,
            price: 4200,
            original_price: 5500,
            image_url: 'https://via.placeholder.com/900x400/38bdf8/ffffff?text=Biology',
            description: 'คอร์สชีววิทยาสำหรับน้องที่มุ่งสู่สายแพทย์โดยเฉพาะ ครบทั้งเนื้อหาพื้นฐานและเนื้อหาเกินหลักสูตร',
            highlights: ['เนื้อหาเกินหลักสูตร', 'เจาะลึกทุกระบบ', 'ข้อสอบสนามจริง', 'Tips เด็ดมากมาย']
        },
        {
            id: 5,
            title: 'คณิตศาสตร์ ม.4 เทอม 1',
            category: 'ม.4',
            subject: 'คณิตศาสตร์',
            brand: 'We By The Brain',
            teacher: 'พี่ช้าง',
            teacherBio: 'ติวเตอร์คณิตศาสตร์อันดับ 1',
            duration: '40 ชม.',
            lessons: 60,
            students: 3500,
            rating: 4.9,
            reviews_count: 512,
            price: 3200,
            original_price: 4500,
            image_url: 'https://via.placeholder.com/900x400/f59e0b/ffffff?text=Math+M4',
            description: 'ปูพื้นฐานคณิตศาสตร์ ม.4 ให้แน่นเตรียมพร้อมสู่มหาวิทยาลัย',
            highlights: ['ปูพื้นฐานแน่น', 'โจทย์เยอะจุใจ', 'เทคนิคเพียบ']
        },
        {
            id: 6,
            title: 'A-Level ภาษาอังกฤษ',
            category: 'ม.6',
            subject: 'ภาษาอังกฤษ',
            brand: 'Enconcept',
            teacher: 'ครูพี่แนน',
            teacherBio: 'GURU ภาษาอังกฤษ',
            duration: '32 ชม.',
            lessons: 48,
            students: 2800,
            rating: 4.8,
            reviews_count: 340,
            price: 3900,
            original_price: 4900,
            image_url: 'https://via.placeholder.com/900x400/ec4899/ffffff?text=English',
            description: 'ติวเข้ม A-Level ภาษาอังกฤษ พิชิตคณะในฝัน',
            highlights: ['ศัพท์แน่น', 'Grammar แม่น', 'Reading เร็ว']
        }
    ],

    _getStoredCourses() {
        const stored = localStorage.getItem('prepHubCourses');
        return stored ? JSON.parse(stored) : [];
    },

    _saveStoredCourses(courses) {
        localStorage.setItem('prepHubCourses', JSON.stringify(courses));
    },

    async getAll(params = {}) {
        // Retrieve local courses
        const localCourses = this._getStoredCourses();

        // Create a map of courses by ID
        const courseMap = new Map();

        // 1. Add Mock Data first
        this.MOCK_DATA.forEach(c => courseMap.set(c.id, c));

        // 2. Add/Overwrite with Local Data
        localCourses.forEach(c => courseMap.set(c.id, c));

        // Convert back to array
        let allCourses = Array.from(courseMap.values());

        // Filter logic (simple implementation)
        if (params.category) {
            allCourses = allCourses.filter(c => c.category === params.category);
        }
        if (params.search) {
            const lowerSearch = params.search.toLowerCase();
            allCourses = allCourses.filter(c =>
                c.title.toLowerCase().includes(lowerSearch) ||
                c.subject.toLowerCase().includes(lowerSearch)
            );
        }

        // Simulate API delay
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({ courses: allCourses });
            }, 300);
        });
    },

    async getById(id) {
        // Same logic as getAll to ensure consistent data
        const localCourses = this._getStoredCourses();
        const courseMap = new Map();
        this.MOCK_DATA.forEach(c => courseMap.set(c.id, c));
        localCourses.forEach(c => courseMap.set(c.id, c));

        const course = courseMap.get(Number(id)) || courseMap.get(String(id)); // Handle string/number ID mismatch

        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (course) resolve(course);
                else reject(new Error('Course not found'));
            }, 200);
        });
    },

    async search(searchTerm, filters = {}) {
        return this.getAll({ search: searchTerm, ...filters });
    },

    async add(courseData) {
        const localCourses = this._getStoredCourses();
        const newId = Date.now(); // Simple ID generation

        const newCourse = {
            id: newId,
            ...courseData,
            rating: 0,
            reviews_count: 0,
            students: 0,
            original_price: courseData.price * 1.2 // Mock original price
        };

        if (!newCourse.image_url) {
            newCourse.image_url = `https://via.placeholder.com/900x400/10b981/ffffff?text=${encodeURIComponent(newCourse.subject)}`;
        }

        localCourses.push(newCourse);
        this._saveStoredCourses(localCourses);

        return new Promise(resolve => {
            setTimeout(() => {
                resolve({ success: true, course: newCourse });
            }, 500);
        });
    },

    async update(id, courseData) {
        let localCourses = this._getStoredCourses();

        // Check if course is in local storage
        let courseIndex = localCourses.findIndex(c => c.id == id);

        // If not in local but in MOCK (meaning it's a default course being edited for the first time)
        if (courseIndex === -1) {
            const mockCourse = this.MOCK_DATA.find(c => c.id == id);
            if (mockCourse) {
                // Add to local storage effectively "overriding" the mock one
                // But we need to make sure we don't duplicate. 
                // Our getAll strategy is [...MOCK, ...LOCAL]. 
                // If we want to edit a mock course, we should probably add it to local storage 
                // AND updated getAll to prefer local version if IDs match.
                // For simplicity: We will just push to local. 
                // BUT getAll needs to handle ID collision.
                // Let's refactor getAll slightly to handle overrides.
            } else {
                return Promise.reject(new Error('Course not found'));
            }
        }

        // Refined Strategy for "Mock" edit:
        // 1. We essentially "clone" the mock course to local storage with the changes.
        // 2. We need `getAll` to de-duplicate based on ID, preferring local.

        // Let's implement the override logic in getAll first (implicitly), 
        // or just accept that for this prototype, we might see duplicates if we don't handle it.
        // Better approach:
        // When saving, if it's a mock course ID, we save it to local.
        // When fetching, we create a map by ID. local overwrites mock.

        // Re-implementing getAll logic inside update temporarily to explain (will update getAll next)

        // ... proceeding with update logic assuming getAll will be fixed ...

        // Check if it already exists in local
        if (courseIndex !== -1) {
            // Update existing local
            localCourses[courseIndex] = { ...localCourses[courseIndex], ...courseData };
        } else {
            // It's a mock course being edited
            const mockCourse = this.MOCK_DATA.find(c => c.id == id);
            if (!mockCourse) return Promise.reject(new Error('Course not found'));

            // Create new local entry merging mock + changes
            const newLocal = { ...mockCourse, ...courseData };
            localCourses.push(newLocal);
        }

        this._saveStoredCourses(localCourses);

        return new Promise(resolve => {
            setTimeout(() => {
                resolve({ success: true });
            }, 500);
        });
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
