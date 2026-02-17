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
            reviews_count: 300,
            image_url: 'https://images.unsplash.com/photo-1530210124550-912dc1381cb8?auto=format&fit=crop&w=800&q=80',
            students: 3000,
            lessons: 60,
            duration: '80 ชม.',
            description: 'คอร์สชีววิทยาที่ละเอียดที่สุด เข้าใจกลไกการทำงานของสิ่งมีชีวิต พร้อมภาพประกอบสวยงาม',
            teacherBio: 'หมอบีม ติวเตอร์ชีวะระดับประเทศ',
            highlights: ['ภาพสวยเข้าใจง่าย', 'เชื่อมโยงเนื้อหาดีมาก', 'เหมาะสำหรับสายแพทย์'],
            reviews: 300
        },

        // --- M.5 ---
        {
            id: 11,
            title: 'ฟิสิกส์ ม.5 เทอม 1-2',
            category: 'ม.5',
            subject: 'ฟิสิกส์',
            brand: 'Applied Physics',
            teacher: 'อ.ประกิตเผ่า',
            price: 3200,
            original_price: 4000,
            rating: 4.6,
            reviews_count: 50,
            image_url: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&w=800&q=80',
            students: 600,
            lessons: 40,
            duration: '50 ชม.',
            description: 'รวมเนื้อหาฟิสิกส์ ม.5 ทั้งหมด แสง เสียง ไฟฟ้า ปูพื้นฐานแน่นสู่ ม.6',
            teacherBio: 'อาจารย์ฟิสิกส์ประสบการณ์สูง',
            highlights: ['เน้นความเข้าใจ', 'โจทย์เยอะ', 'สอนสนุก'],
            reviews: 50
        },
        {
            id: 12,
            title: 'เคมี ม.5 (กรด-เบส, ไฟฟ้าเคมี)',
            category: 'ม.5',
            subject: 'เคมี',
            brand: 'Chem Ou',
            teacher: 'อ.อุ๊',
            price: 3400,
            original_price: 4200,
            rating: 4.9,
            reviews_count: 150,
            image_url: 'https://images.unsplash.com/photo-1628863353691-0071c8c1874c?auto=format&fit=crop&w=800&q=80',
            students: 1200,
            lessons: 35,
            duration: '45 ชม.',
            description: 'เจาะลึกเนื้อหาเคมีคำนวณที่ยากที่สุดใน ม.ปลาย ให้เป็นเรื่องง่าย',
            teacherBio: 'ตำนานแห่งวงการเคมี',
            highlights: ['เทคนิคจำตารางธาตุ', 'โจทย์คำนวณขั้นเทพ', 'สอนละเอียด'],
            reviews: 150
        },

        // --- M.4 ---
        {
            id: 21,
            title: 'คณิตศาสตร์ ม.4 เทอม 1 (เซต, ตรรกศาสตร์)',
            category: 'ม.4',
            subject: 'คณิตศาสตร์',
            brand: 'We by The Brain',
            teacher: 'พี่กอล์ฟ',
            price: 2500,
            original_price: 3000,
            rating: 4.5,
            reviews_count: 40,
            image_url: 'https://images.unsplash.com/photo-1596495577886-d920f1fb7238?auto=format&fit=crop&w=800&q=80',
            students: 800,
            lessons: 25,
            duration: '30 ชม.',
            description: 'ปรับพื้นฐานจาก ม.ต้น สู่ ม.ปลาย เริ่มต้นดีมีชัยไปกว่าครึ่ง',
            teacherBio: 'ติวเตอร์วัยรุ่น เข้าใจเด็ก',
            highlights: ['ปูพื้นฐานแน่น', 'โจทย์ไล่ระดับ', 'บรรยากาศเป็นกันเอง'],
            reviews: 40
        },
        {
            id: 22,
            title: 'วิทยาศาสตร์กายภาพ (ดาราศาสตร์)',
            category: 'ม.4',
            subject: 'วิทยาศาสตร์',
            brand: 'Da\'vance',
            teacher: 'อ.ปิง',
            price: 2200,
            original_price: 2800,
            rating: 4.7,
            reviews_count: 70,
            image_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
            students: 500,
            lessons: 20,
            duration: '25 ชม.',
            description: 'เรียนรู้เรื่องโลก ดาราศาสตร์ และอวกาศ อย่างสนุกสนานและเข้าใจง่าย',
            teacherBio: 'อาจารย์สายฮา สาระแน่น',
            highlights: ['จำแม่นด้วยเรื่องเล่า', 'เก็งข้อสอบตรงจุด', 'เรียนไม่เครียด'],
            reviews: 70
        },

        // --- Medical (Sai Phat) ---
        {
            id: 31,
            title: 'ความถนัดแพทย์ (TPAT 1)',
            category: 'สายแพทย์',
            subject: 'TPAT 1',
            brand: 'OnDemand',
            teacher: 'ทีมแพทย์',
            price: 4500,
            original_price: 6000,
            rating: 4.9,
            reviews_count: 220,
            image_url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80',
            students: 2000,
            lessons: 40,
            duration: '50 ชม.',
            description: 'เตรียมสอบหมอ ครบทั้งจริยธรรม เชาวน์ปัญญา และเชื่อมโยง',
            teacherBio: 'ทีมแพทย์เฉพาะทาง',
            highlights: ['จริยธรรมแพทย์', 'เทคนิคทำพาร์ทเชื่อมโยง', 'จำลองสนามสอบ'],
            reviews: 220
        },

        // --- University ---
        {
            id: 41,
            title: 'Calculus 1 for Engineering',
            category: 'มหาวิทยาลัย',
            subject: 'Calculus',
            brand: 'P-Hub Univ',
            teacher: 'Dr. Math',
            price: 1500,
            original_price: 2500,
            rating: 4.8,
            reviews_count: 30,
            image_url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80',
            students: 200,
            lessons: 15,
            duration: '20 ชม.',
            description: 'แคลคูลัสสำหรับเด็กวิศวะ ปี 1 ดิฟ อินทิเกรต ลิมิต ครบถ้วน',
            teacherBio: 'อาจารย์มหาวิทยาลัย',
            highlights: ['เน้นโจทย์สอบจริง', 'ตัดเกรด A', 'สอนละเอียด'],
            reviews: 30
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
