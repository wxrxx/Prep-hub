// ============================================
// PREP HUB - Main Application JavaScript
// ============================================

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function () {
    console.log('🎓 PREP HUB Initialized');

    // Initialize all components
    initMobileMenu();
    initSearch();
    initCarousel();
    initFavorites();
    initAuthUI(); // New Auth UI Handler

    // Initialize detail buttons
    initDetailButtons();
});

// ============================================
// AUTH UI
// ============================================
function initAuthUI() {
    // Wait for auth to be available (api.js should be loaded)
    if (typeof auth === 'undefined') {
        console.warn('Auth module not loaded');
        return;
    }

    const navbarActions = document.getElementById('navbarActions');
    const mobileMenuActions = document.getElementById('mobileMenuActions');

    // Only proceed if elements exist
    if (!navbarActions && !mobileMenuActions) return;

    // Helper to render logged-in UI
    function renderLoggedInUI() {
        const user = auth.getUser();
        const isAdmin = user?.role === 'admin';
        // Use root-relative paths (works on deployed site)
        const dashboardUrl = isAdmin ? '/pages/admin/index.html' : '/pages/user/dashboard.html';
        const userName = user?.fullname || user?.name || 'Dashboard';

        // Avatar Logic
        let avatarHtml = `<span style="background: var(--primary-100); padding: 4px 8px; border-radius: 99px; font-size: 12px;">👤</span>`;
        if (user?.avatar && (user.avatar.startsWith('data:') || user.avatar.startsWith('http'))) {
            avatarHtml = `<div style="width: 24px; height: 24px; border-radius: 50%; background-image: url('${user.avatar}'); background-size: cover; background-position: center; border: 1px solid var(--color-gray-200);"></div>`;
        } else if (user?.name) {
            const initials = user.name.substring(0, 2).toUpperCase();
            avatarHtml = `<span style="background: var(--primary-100); color: var(--primary-700); padding: 2px 6px; border-radius: 99px; font-size: 12px; font-weight: 600;">${initials}</span>`;
        }

        const navHtml = `
            <a href="${dashboardUrl}" class="btn btn-ghost btn-sm" style="display: flex; align-items: center; gap: 8px;">
                ${avatarHtml}
                ${userName}
            </a>
            <button onclick="auth.logout()" class="btn btn-secondary btn-sm">ออกจากระบบ</button>
        `;

        const mobileHtml = `
            <a href="${dashboardUrl}" class="btn btn-secondary" style="display: flex; align-items: center; gap: 8px;">
                 ${avatarHtml} ${userName}
            </a>
            <button onclick="auth.logout()" class="btn btn-primary">ออกจากระบบ</button>
        `;

        if (navbarActions) navbarActions.innerHTML = navHtml;
        if (mobileMenuActions) mobileMenuActions.innerHTML = mobileHtml;
    }

    // Helper to render guest UI
    function renderGuestUI() {
        // Determine correct path based on current page location
        const isInSubfolder = window.location.pathname.includes('/pages/');
        const loginPath = isInSubfolder ? '../auth/login.html' : 'pages/auth/login.html';
        const registerPath = isInSubfolder ? '../auth/register.html' : 'pages/auth/register.html';

        const navHtml = `
            <a href="${loginPath}" class="btn btn-ghost btn-sm">เข้าสู่ระบบ</a>
            <a href="${registerPath}" class="btn btn-primary btn-sm">สมัครสมาชิก</a>
        `;

        const mobileHtml = `
            <a href="${loginPath}" class="btn btn-secondary">เข้าสู่ระบบ</a>
            <a href="${registerPath}" class="btn btn-primary">สมัครสมาชิก</a>
        `;

        if (navbarActions) navbarActions.innerHTML = navHtml;
        if (mobileMenuActions) mobileMenuActions.innerHTML = mobileHtml;
    }

    if (auth.isLoggedIn()) {
        // Show logged-in UI immediately for better UX
        renderLoggedInUI();
        console.log('Auth UI Initialized: Logged In (verifying...)');

        // Verify session in background - if invalid, redirect to guest UI
        auth.verifySession().then(isValid => {
            if (!isValid) {
                console.log('Session expired, updating UI...');
                renderGuestUI();
            } else {
                // Refresh UI with updated user data from server
                renderLoggedInUI();
            }
        }).catch(() => {
            // Network error - keep current state, don't log user out
            console.log('Could not verify session (network error)');
        });
    } else {
        renderGuestUI();
        console.log('Auth UI Initialized: Guest');
    }
}

// ============================================
// MOBILE MENU
// ============================================
function initMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
    const mobileMenuClose = document.getElementById('mobileMenuClose');

    function openMenu() {
        mobileMenuBtn?.classList.add('active');
        mobileMenu?.classList.add('active');
        mobileMenuOverlay?.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
        mobileMenuBtn?.classList.remove('active');
        mobileMenu?.classList.remove('active');
        mobileMenuOverlay?.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function () {
            if (mobileMenu?.classList.contains('active')) {
                closeMenu();
            } else {
                openMenu();
            }
        });
    }

    if (mobileMenuClose) {
        mobileMenuClose.addEventListener('click', closeMenu);
    }

    if (mobileMenuOverlay) {
        mobileMenuOverlay.addEventListener('click', closeMenu);
    }

    // Close menu on window resize (if going to desktop)
    window.addEventListener('resize', function () {
        if (window.innerWidth > 768) {
            closeMenu();
        }
    });
}

// ============================================
// SEARCH FUNCTIONALITY
// ============================================
function initSearch() {
    const searchInput = document.getElementById('heroSearch');
    const searchSuggestions = document.getElementById('searchSuggestions');

    if (!searchInput) return;

    // Mock search data
    const searchData = [
        'คณิตศาสตร์ ม.6',
        'ฟิสิกส์ ม.6',
        'เคมี ม.6',
        'ชีววิทยา ม.6',
        'TGAT',
        'TPAT',
        'A-Level คณิต',
        'A-Level ฟิสิกส์',
        'สายแพทย์',
        'Enconcept',
        'Dek-D School',
        'Chula Tutor',
        'O-NET คณิต',
        'O-NET วิทย์'
    ];

    // Show suggestions on focus
    searchInput.addEventListener('focus', function () {
        if (searchSuggestions && this.value.length === 0) {
            searchSuggestions.style.display = 'block';
        }
    });

    // Hide suggestions on blur (with delay for clicking)
    searchInput.addEventListener('blur', function () {
        setTimeout(() => {
            if (searchSuggestions) {
                searchSuggestions.style.display = 'none';
            }
        }, 200);
    });

    // Filter suggestions on input
    searchInput.addEventListener('input', function () {
        const query = this.value.toLowerCase().trim();

        if (query.length === 0) {
            if (searchSuggestions) {
                searchSuggestions.style.display = 'block';
            }
            return;
        }

        // Filter search data
        const filtered = searchData.filter(item =>
            item.toLowerCase().includes(query)
        );

        // Update suggestions
        if (searchSuggestions && filtered.length > 0) {
            updateSuggestions(filtered.slice(0, 5));
            searchSuggestions.style.display = 'block';
        } else if (searchSuggestions) {
            searchSuggestions.style.display = 'none';
        }
    });

    // Handle Enter key
    searchInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            performSearch(this.value);
        }
    });

    // Handle keyword tag clicks
    const keywordTags = document.querySelectorAll('.keyword-tag');
    keywordTags.forEach(tag => {
        tag.addEventListener('click', function () {
            const keyword = this.textContent.trim();
            searchInput.value = keyword;
            performSearch(keyword);
        });
    });
}

function updateSuggestions(suggestions) {
    const searchSuggestions = document.getElementById('searchSuggestions');
    if (!searchSuggestions) return;

    searchSuggestions.innerHTML = suggestions.map(item => `
        <div class="suggestion-item" onclick="selectSuggestion('${item}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
            </svg>
            <span>${item}</span>
        </div>
    `).join('');
}

// Global function for onclick attribute
window.selectSuggestion = function (suggestion) {
    const searchInput = document.getElementById('heroSearch');
    if (searchInput) {
        searchInput.value = suggestion;
        performSearch(suggestion);
    }
};

function performSearch(query) {
    if (!query || query.trim().length === 0) return;

    console.log('Searching for:', query);

    // Save to search history
    saveSearchHistory(query);

    // Redirect to search results page
    // Check if we are in a subdirectory or root
    const path = window.location.pathname;

    // Simple path detection logic
    if (path.endsWith('index.html') || path.endsWith('/')) {
        // From root
        window.location.href = `pages/search.html?q=${encodeURIComponent(query)}`;
    } else if (path.includes('/pages/courses/') || path.includes('/pages/brands/') || path.includes('/pages/auth/') || path.includes('/pages/user/') || path.includes('/pages/certificates/')) {
        // From 2 levels deep
        window.location.href = `../../pages/search.html?q=${encodeURIComponent(query)}`;
    } else if (path.includes('/pages/')) {
        // From 1 level deep (e.g. pages/search.html itself)
        window.location.href = `search.html?q=${encodeURIComponent(query)}`;
    } else {
        // Fallback
        window.location.href = `pages/search.html?q=${encodeURIComponent(query)}`;
    }
}

function saveSearchHistory(query) {
    let history = JSON.parse(localStorage.getItem('searchHistory') || '[]');

    // Remove if already exists
    history = history.filter(item => item !== query);

    // Add to beginning
    history.unshift(query);

    // Keep only last 10
    history = history.slice(0, 10);

    localStorage.setItem('searchHistory', JSON.stringify(history));
}

// ============================================
// CAROUSEL
// ============================================
function initCarousel() {
    const track = document.getElementById('carouselTrack');
    const prevBtn = document.getElementById('carouselPrev');
    const nextBtn = document.getElementById('carouselNext');

    if (!track || !prevBtn || !nextBtn) return;

    let currentIndex = 0;
    const cards = track.querySelectorAll('.card-course');
    const totalCards = cards.length;

    // Calculate cards per view based on screen size
    function getCardsPerView() {
        if (window.innerWidth < 768) return 1;
        if (window.innerWidth < 1024) return 2;
        return 3;
    }

    let cardsPerView = getCardsPerView();
    const maxIndex = Math.max(0, totalCards - cardsPerView);

    // Update carousel position
    function updateCarousel() {
        const cardWidth = cards[0].offsetWidth;
        const gap = 24; // var(--space-6)
        const offset = -(currentIndex * (cardWidth + gap));
        track.style.transform = `translateX(${offset}px)`;

        // Update button states
        prevBtn.disabled = currentIndex === 0;
        nextBtn.disabled = currentIndex >= maxIndex;

        prevBtn.style.opacity = currentIndex === 0 ? '0.5' : '1';
        nextBtn.style.opacity = currentIndex >= maxIndex ? '0.5' : '1';
    }

    // Previous button
    prevBtn.addEventListener('click', function () {
        if (currentIndex > 0) {
            currentIndex--;
            updateCarousel();
        }
    });

    // Next button
    nextBtn.addEventListener('click', function () {
        if (currentIndex < maxIndex) {
            currentIndex++;
            updateCarousel();
        }
    });

    // Handle window resize
    let resizeTimeout;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            cardsPerView = getCardsPerView();
            currentIndex = Math.min(currentIndex, Math.max(0, totalCards - cardsPerView));
            updateCarousel();
        }, 250);
    });

    // Auto-play (optional)
    let autoplayInterval;

    function startAutoplay() {
        autoplayInterval = setInterval(() => {
            if (currentIndex >= maxIndex) {
                currentIndex = 0;
            } else {
                currentIndex++;
            }
            updateCarousel();
        }, 5000); // Change slide every 5 seconds
    }

    function stopAutoplay() {
        clearInterval(autoplayInterval);
    }

    // Start autoplay
    startAutoplay();

    // Pause on hover
    track.addEventListener('mouseenter', stopAutoplay);
    track.addEventListener('mouseleave', startAutoplay);

    // Initial update
    updateCarousel();
}

// ============================================
// FAVORITES
// ============================================
function initFavorites() {
    const favoriteButtons = document.querySelectorAll('.btn-favorite');

    favoriteButtons.forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            const svg = this.querySelector('svg');
            const isFavorited = svg.getAttribute('fill') !== 'none';

            if (isFavorited) {
                // Remove from favorites
                svg.setAttribute('fill', 'none');
                svg.style.fill = 'none';
                console.log('Removed from favorites');
            } else {
                // Add to favorites
                svg.setAttribute('fill', '#ef4444');
                svg.style.fill = '#ef4444';
                console.log('Added to favorites');

                // Show feedback
                showToast('เพิ่มในรายการโปรดแล้ว ❤️');
            }

            // TODO: Save to localStorage or backend
        });
    });
}

// ============================================
// UTILITIES
// ============================================
function showToast(message, duration = 3000) {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        background: var(--color-gray-900);
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
        font-weight: 500;
    `;

    document.body.appendChild(toast);

    // Remove after duration
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, duration);
}

// ============================================
// COURSE DETAIL MODAL
// ============================================
const mockCourses = [
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
        reviews: 245,
        price: 2990,
        originalPrice: 3990,
        image: 'https://via.placeholder.com/900x400/0ea5e9/ffffff?text=คณิต+ม.6',
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
        reviews: 189,
        price: 3500,
        originalPrice: 4500,
        image: 'https://via.placeholder.com/900x400/0369a1/ffffff?text=TGAT',
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
        reviews: 312,
        price: 2790,
        originalPrice: 3500,
        image: 'https://via.placeholder.com/900x400/7dd3fc/000000?text=ฟิสิกส์',
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
        reviews: 428,
        price: 4200,
        originalPrice: 5500,
        image: 'https://via.placeholder.com/900x400/38bdf8/ffffff?text=สายแพทย์',
        description: 'คอร์สชีววิทยาสำหรับน้องที่มุ่งสู่สายแพทย์โดยเฉพาะ ครบทั้งเนื้อหาพื้นฐานและเนื้อหาเกินหลักสูตร',
        highlights: ['เนื้อหาเกินหลักสูตร', 'เจาะลึกทุกระบบ', 'ข้อสอบสนามจริง', 'Tips เด็ดมากมาย']
    }
];

function showCourseDetail(courseId) {
    const course = mockCourses[courseId - 1] || mockCourses[0];

    // Create modal if not exists
    let modalOverlay = document.getElementById('courseModalOverlay');

    if (!modalOverlay) {
        modalOverlay = document.createElement('div');
        modalOverlay.id = 'courseModalOverlay';
        modalOverlay.className = 'course-modal-overlay';
        modalOverlay.innerHTML = `
            <div class="course-modal">
                <div class="course-modal-header">
                    <img src="" alt="" class="course-modal-image" id="modalImage">
                    <button class="course-modal-close" id="modalClose">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                    <div class="course-modal-badges" id="modalBadges"></div>
                </div>
                
                <div class="course-modal-body">
                    <h2 class="course-modal-title" id="modalTitle"></h2>
                    
                    <div class="course-modal-meta" id="modalMeta"></div>
                    
                    <div class="course-modal-description">
                        <h4>รายละเอียดคอร์ส</h4>
                        <p id="modalDescription"></p>
                    </div>
                    
                    <div class="course-highlights" id="modalHighlights"></div>
                    
                    <div class="course-teacher" id="modalTeacher"></div>
                    
                    <div class="course-reviews-summary" id="modalReviews"></div>
                </div>
                
                <div class="course-modal-footer">
                    <div class="course-modal-price" id="modalPrice"></div>
                    <div class="course-modal-actions">
                        <button class="btn btn-secondary btn-favorite-modal">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                            บันทึก
                        </button>
                        <a href="#" class="btn btn-primary" id="modalLink">ไปที่คอร์ส</a>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modalOverlay);

        // Add event listeners
        document.getElementById('modalClose').addEventListener('click', closeCourseModal);
        modalOverlay.addEventListener('click', function (e) {
            if (e.target === modalOverlay) {
                closeCourseModal();
            }
        });

        // ESC key to close
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                closeCourseModal();
            }
        });

        // Favorite button
        modalOverlay.querySelector('.btn-favorite-modal').addEventListener('click', function () {
            this.classList.toggle('active');
            if (this.classList.contains('active')) {
                this.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" stroke-width="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                    บันทึกแล้ว
                `;
                showToast('✅ บันทึกคอร์สเรียบร้อย');
            } else {
                this.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                    บันทึก
                `;
            }
        });
    }

    // Populate modal with course data
    document.getElementById('modalImage').src = course.image;
    document.getElementById('modalImage').alt = course.title;
    document.getElementById('modalTitle').textContent = course.title;
    document.getElementById('modalDescription').textContent = course.description;

    // Badges
    document.getElementById('modalBadges').innerHTML = `
        <span class="badge badge-primary">${course.category}</span>
        <span class="badge badge-gray">${course.subject}</span>
    `;

    // Meta info
    document.getElementById('modalMeta').innerHTML = `
        <div class="course-meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span>${course.brand}</span>
        </div>
        <div class="course-meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>${course.duration}</span>
        </div>
        <div class="course-meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path>
            </svg>
            <span>${course.lessons} บทเรียน</span>
        </div>
        <div class="course-meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span>${course.students.toLocaleString()} นักเรียน</span>
        </div>
    `;

    // Highlights
    const highlightIcons = ['📚', '✍️', '🔄', '💬'];
    document.getElementById('modalHighlights').innerHTML = course.highlights.map((h, i) => `
        <div class="course-highlight-item">
            <div class="course-highlight-icon">${highlightIcons[i] || '✅'}</div>
            <div class="course-highlight-text">
                <h5>${h}</h5>
            </div>
        </div>
    `).join('');

    // Teacher
    document.getElementById('modalTeacher').innerHTML = `
        <div class="course-teacher-avatar">👨‍🏫</div>
        <div class="course-teacher-info">
            <h5>${course.teacher}</h5>
            <p>${course.teacherBio}</p>
        </div>
    `;

    // Reviews
    document.getElementById('modalReviews').innerHTML = `
        <div class="course-reviews-number">${course.rating}</div>
        <div class="course-reviews-details">
            <div class="course-reviews-stars">${'⭐'.repeat(Math.round(course.rating))}</div>
            <div class="course-reviews-count">จาก ${course.reviews} รีวิว</div>
        </div>
    `;

    // Price
    document.getElementById('modalPrice').innerHTML = `
        <span class="price-current">฿${course.price.toLocaleString()}</span>
        <span class="price-original">฿${course.originalPrice.toLocaleString()}</span>
    `;

    // Show modal
    setTimeout(() => {
        modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }, 10);
}

function closeCourseModal() {
    const modalOverlay = document.getElementById('courseModalOverlay');
    if (modalOverlay) {
        modalOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function initDetailButtons() {
    const detailButtons = document.querySelectorAll('.card-course .btn-primary');
    detailButtons.forEach((btn, index) => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            showCourseDetail(index + 1);
        });
    });
}
