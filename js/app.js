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
    initCourseManager(); // Add Course Manager (Mock)

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
// ============================================
// SHARED UI COMPONENTS
// ============================================
window.createCourseCardHtml = function (course) {
    return `
        <div class="card-course">
            <div class="course-image-wrapper loading">
                <div class="skeleton-image"></div>
                <img src="${course.image_url}" 
                     alt="${course.title}" 
                     class="card-course-image" 
                     loading="lazy"
                     onload="this.classList.add('loaded'); this.previousElementSibling.style.display='none'; this.parentElement.classList.remove('loading');"
                     onerror="this.src='https://via.placeholder.com/800x450?text=No+Image'; this.classList.add('loaded'); this.previousElementSibling.style.display='none';">
                <button class="btn-favorite" data-course-id="${course.id}">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                </button>
            </div>
            <div class="card-course-body">
                <div class="course-badges">
                    <span class="badge badge-primary">${course.category}</span>
                    <span class="badge badge-gray">${course.subject}</span>
                </div>
                <h3 class="card-course-title">${course.title}</h3>
                <div class="card-course-meta">
                    <span>📍 ${course.brand}</span>
                    <span>👤 ${course.teacher}</span>
                </div>
                <div class="course-rating">
                    <span class="stars">⭐⭐⭐⭐⭐</span>
                    <span class="rating-text">${course.rating} (${course.reviews_count})</span>
                </div>
                <div class="card-course-price">฿${course.price.toLocaleString()}</div>
                <button class="btn btn-primary" onclick="showCourseDetail(${course.id})" style="width: 100%;">ดูรายละเอียด</button>
            </div>
        </div>
    `;
};

// ============================================
// CAROUSEL & POPULAR COURSES
// ============================================
async function initCarousel() {
    const track = document.getElementById('carouselTrack');
    const prevBtn = document.getElementById('carouselPrev');
    const nextBtn = document.getElementById('carouselNext');
    const container = document.getElementById('carouselContainer');
    const emptyState = document.getElementById('emptyStateCourses');

    if (!track || !prevBtn || !nextBtn) return;

    // 1. Fetch Data
    let coursesData = [];
    try {
        // Use getAll with a random shuffle or slice for "Popular"
        const result = await courses.getAll();
        // Shuffle and take 6 items for "Popular"
        coursesData = result.courses.sort(() => 0.5 - Math.random()).slice(0, 7);
    } catch (e) {
        console.error('Failed to load courses:', e);
    }

    // 2. Render content
    if (coursesData.length === 0) {
        if (container) container.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
        return;
    } else {
        if (container) container.style.display = 'block';
        if (emptyState) emptyState.style.display = 'none';
    }

    track.innerHTML = coursesData.map(course => createCourseCardHtml(course)).join('');

    // Re-bind favorites (detail button is now inline onclick)
    initFavorites();

    // 3. Carousel Logic
    let currentIndex = 0;
    const cards = track.querySelectorAll('.card-course');
    const totalCards = cards.length;

    function getCardsPerView() {
        if (window.innerWidth < 768) return 1;
        if (window.innerWidth < 1024) return 2;
        return 3;
    }

    let cardsPerView = getCardsPerView();
    let maxIndex = Math.max(0, totalCards - cardsPerView);

    function updateCarousel() {
        // Recalculate based on current state
        cardsPerView = getCardsPerView();
        maxIndex = Math.max(0, totalCards - cardsPerView);
        currentIndex = Math.min(currentIndex, maxIndex);

        if (cards.length === 0) return;

        const cardWidth = cards[0].offsetWidth;
        const gap = 24;
        const offset = -(currentIndex * (cardWidth + gap));
        track.style.transform = `translateX(${offset}px)`;

        prevBtn.disabled = currentIndex === 0;
        nextBtn.disabled = currentIndex >= maxIndex;
        prevBtn.style.opacity = currentIndex === 0 ? '0.5' : '1';
        nextBtn.style.opacity = currentIndex >= maxIndex ? '0.5' : '1';
    }

    // Event Listeners
    prevBtn.onclick = () => {
        if (currentIndex > 0) {
            currentIndex--;
            updateCarousel();
        }
    };

    nextBtn.onclick = () => {
        if (currentIndex < maxIndex) {
            currentIndex++;
            updateCarousel();
        }
    };

    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(updateCarousel, 250);
    });

    // Auto-play
    let autoplayInterval;
    function startAutoplay() {
        if (autoplayInterval) clearInterval(autoplayInterval);
        autoplayInterval = setInterval(() => {
            if (currentIndex >= maxIndex) {
                currentIndex = 0;
            } else {
                currentIndex++;
            }
            updateCarousel();
        }, 5000);
    }
    function stopAutoplay() {
        clearInterval(autoplayInterval);
    }

    startAutoplay();
    track.addEventListener('mouseenter', stopAutoplay);
    track.addEventListener('mouseleave', startAutoplay);

    // Initial Trigger
    setTimeout(updateCarousel, 100);
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
// ============================================
// COURSE DETAIL MODAL
// ============================================
async function showCourseDetail(courseId) {
    let course;
    try {
        course = await courses.getById(courseId);
    } catch (e) {
        console.error('Course not found:', e);
        showToast('❌ ไม่พบข้อมูลคอร์ส');
        return;
    }

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
                        <button class="btn btn-secondary" id="modalEditBtn" style="min-width: 40px; padding: 0.5rem;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
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
    document.getElementById('modalImage').src = course.image_url;
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
        <span class="price-original">฿${course.original_price.toLocaleString()}</span>
    `;

    // Edit Button Handler
    const editBtn = document.getElementById('modalEditBtn');
    // Remove old listeners (simple way: clone node)
    const newEditBtn = editBtn.cloneNode(true);
    editBtn.parentNode.replaceChild(newEditBtn, editBtn);

    newEditBtn.addEventListener('click', () => {
        closeCourseModal();
        openEditCourseModal(course);
    });

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
    detailButtons.forEach((btn) => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            // Get ID from closest card or data attribute if available
            // For now, we assume visual index + 1 matches ID or we need better ID handling
            // Better: Add data-id to the button in generation
            const card = this.closest('.card-course');
            const index = Array.from(card.parentNode.children).indexOf(card);
            showCourseDetail(index + 1);
        });
    });
}

// ============================================
// COURSE MANAGER (ADD COURSE)
// ============================================
function initCourseManager() {
    // 1. Inject Floating Action Button
    const fab = document.createElement('button');
    fab.className = 'fab-add';
    fab.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
    `;
    document.body.appendChild(fab);

    // 2. Inject Add Course Modal
    const modalHtml = `
        <div class="modal-overlay" id="addCourseModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h4>เพิ่มคอร์สเรียนใหม่</h4>
                    <button class="modal-close" id="closeAddModal">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="addCourseForm">
                        <div class="input-group">
                            <label class="input-label">ชื่อคอร์ส</label>
                            <input type="text" name="title" class="input-field" required placeholder="ตัวอย่าง: คณิตศาสตร์ ม.4 เทอม 1">
                        </div>
                        
                        <div class="form-grid">
                            <div class="input-group">
                                <label class="input-label">หมวดหมู่</label>
                                <select name="category" class="input-field" required>
                                    <option value="ม.4">ม.4</option>
                                    <option value="ม.5">ม.5</option>
                                    <option value="ม.6">ม.6</option>
                                    <option value="สายแพทย์">สายแพทย์</option>
                                </select>
                            </div>
                            <div class="input-group">
                                <label class="input-label">วิชา</label>
                                <input type="text" name="subject" class="input-field" required placeholder="เช่น คณิตศาสตร์">
                            </div>
                        </div>

                        <div class="form-grid">
                            <div class="input-group">
                                <label class="input-label">สถาบัน/แบรนด์</label>
                                <input type="text" name="brand" class="input-field" required placeholder="เช่น Prep Tutor">
                            </div>
                            <div class="input-group">
                                <label class="input-label">ชื่อผู้สอน</label>
                                <input type="text" name="teacher" class="input-field" required placeholder="เช่น อ.สมชาย">
                            </div>
                        </div>

                        <div class="form-grid">
                            <div class="input-group">
                                <label class="input-label">ราคา (บาท)</label>
                                <input type="number" name="price" class="input-field" required min="0">
                            </div>
                            <div class="input-group">
                                <label class="input-label">จำนวนชั่วโมง</label>
                                <input type="text" name="duration" class="input-field" required placeholder="เช่น 20 ชม.">
                            </div>
                        </div>

                         <div class="input-group">
                            <label class="input-label">รายละเอียดคอร์ส</label>
                            <textarea name="description" class="input-field" rows="3" required placeholder="รายละเอียดโดยย่อ..."></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-ghost" id="cancelAddCourse">ยกเลิก</button>
                    <button class="btn btn-primary" id="submitAddCourse">บันทึกคอร์ส</button>
                </div>
            </div>
        </div>
    `;

    // Create a container for the modal and append it
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer.firstElementChild);

    // 3. Event Listeners
    const modal = document.getElementById('addCourseModal');
    const form = document.getElementById('addCourseForm');
    const closeBtn = document.getElementById('closeAddModal');
    const cancelBtn = document.getElementById('cancelAddCourse');
    const submitBtn = document.getElementById('submitAddCourse');

    function openModal() {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        form.reset();
    }

    fab.addEventListener('click', () => {
        // Reset to "Add" state
        delete form.dataset.courseId;
        modal.querySelector('.modal-header h4').textContent = 'เพิ่มคอร์สเรียนใหม่';
        submitBtn.textContent = 'บันทึกคอร์ส';
        openModal();
    });
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    // Close on click outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Expose open function globally (careful with scope, but simple for now)
    window.openEditCourseModal = function (course) {
        // Populate form
        const form = document.getElementById('addCourseForm');
        form.title.value = course.title;
        form.category.value = course.category;
        form.subject.value = course.subject;
        form.brand.value = course.brand;
        form.teacher.value = course.teacher;
        form.price.value = course.price;
        form.duration.value = course.duration.replace(' ชม.', ''); // Simple strip, might need regex if format varies
        form.description.value = course.description;

        // Store ID for update
        form.dataset.courseId = course.id;

        // Update UI Text
        modal.querySelector('.modal-header h4').textContent = 'แก้ไขคอร์สเรียน';
        submitBtn.textContent = 'อัพเดทคอร์ส';

        openModal();
    };

    // Handle Submit
    submitBtn.addEventListener('click', async () => {
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Convert price to number
        data.price = Number(data.price);
        data.duration = data.duration + ' ชม.'; // Add unit back

        const isEdit = !!form.dataset.courseId;

        try {
            submitBtn.disabled = true;
            submitBtn.textContent = 'กำลังบันทึก...';

            if (isEdit) {
                await courses.update(form.dataset.courseId, data);
                showToast('✅ อัพเดทคอร์สเรียบร้อยแล้ว');
            } else {
                // Add random mock data for other fields only if adding
                data.lessons = Math.floor(Math.random() * 30) + 10;
                data.highlights = ['สอนสด', 'มีวิดีโอย้อนหลัง', 'เอกสารครบ'];
                await courses.add(data);
                showToast('✅ เพิ่มคอร์สเรียบร้อยแล้ว');
            }

            closeModal();

            // Reload page or re-fetch grid if on courses page
            setTimeout(() => {
                window.location.reload();
            }, 1000);

        } catch (error) {
            console.error(error);
            showToast('❌ เกิดข้อผิดพลาด');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = isEdit ? 'อัพเดทคอร์ส' : 'บันทึกคอร์ส';
        }
    });

}
