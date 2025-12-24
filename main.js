// LocalDeals Hub - Main JavaScript Functionality
// Comprehensive interactive features for deal discovery and store mapping

// Global variables and state management
let currentDeals = [];
let currentStores = [];
let filteredDeals = [];
let filteredStores = [];
let currentCategory = 'all';
let map = null;
let markers = [];

// Sample data for demonstration
const sampleDeals = [
    {
        id: 1,
        title: "Summer Dress Collection - 30% Off",
        store: "Bella's Boutique",
        category: "clothing",
        originalPrice: 70,
        salePrice: 49,
        discount: 30,
        type: "weekly",
        image: "resources/deal-fashion.jpg",
        description: "Stunning summer dresses perfect for any occasion. Limited time offer on our most popular styles.",
        endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000 + 32 * 60 * 1000),
        address: "123 Fashion Ave, Downtown",
        phone: "(555) 123-4567",
        hours: "Mon-Sat 10AM-8PM, Sun 12PM-6PM",
        distance: "0.3 miles",
        rating: 4.8,
        reviews: 127
    },
    {
        id: 2,
        title: "Wireless Headphones - Flash Sale",
        store: "TechHub Electronics",
        category: "electronics",
        originalPrice: 129,
        salePrice: 79,
        discount: 39,
        type: "flash",
        image: "resources/deal-tech.jpg",
        description: "Premium wireless headphones with noise cancellation. Limited quantity available.",
        endTime: new Date(Date.now() + 5 * 60 * 60 * 1000 + 18 * 60 * 1000 + 42 * 1000),
        address: "456 Tech Street, Midtown",
        phone: "(555) 234-5678",
        hours: "Mon-Sat 9AM-9PM, Sun 11AM-7PM",
        distance: "0.7 miles",
        rating: 4.6,
        reviews: 89
    },
    {
        id: 3,
        title: "Organic Produce - Buy One Get One",
        store: "Fresh Market Grocery",
        category: "grocery",
        originalPrice: 25,
        salePrice: 12.5,
        discount: 50,
        type: "weekly",
        image: "resources/deal-grocery.jpg",
        description: "Fresh organic fruits and vegetables. Support local farmers while saving money.",
        endTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000 + 15 * 60 * 1000),
        address: "789 Market Blvd, Westside",
        phone: "(555) 345-6789",
        hours: "Daily 7AM-10PM",
        distance: "1.2 miles",
        rating: 4.9,
        reviews: 203
    },
    {
        id: 4,
        title: "Luxury Skincare Sets - 25% Off",
        store: "Glow Beauty Supply",
        category: "beauty",
        originalPrice: 119,
        salePrice: 89,
        discount: 25,
        type: "limited",
        image: "resources/deal-cosmetics.jpg",
        description: "Premium skincare collections from top brands. Perfect for gifting or treating yourself.",
        endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 22 * 60 * 60 * 1000 + 45 * 60 * 1000),
        address: "321 Beauty Lane, Uptown",
        phone: "(555) 456-7890",
        hours: "Mon-Sat 10AM-8PM, Sun 11AM-6PM",
        distance: "0.9 miles",
        rating: 4.7,
        reviews: 156
    },
    {
        id: 5,
        title: "Athletic Footwear - BOGO 50% Off",
        store: "Stride Footwear",
        category: "shoes",
        originalPrice: 120,
        salePrice: 90,
        discount: 25,
        type: "weekly",
        image: "resources/deal-footwear.jpg",
        description: "High-performance athletic shoes for running, training, and everyday wear.",
        endTime: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000),
        address: "654 Sports Way, Eastside",
        phone: "(555) 567-8901",
        hours: "Mon-Sat 10AM-9PM, Sun 12PM-7PM",
        distance: "1.5 miles",
        rating: 4.5,
        reviews: 94
    },
    {
        id: 6,
        title: "Fashion Accessories - Flash Sale",
        store: "Style Corner",
        category: "accessories",
        originalPrice: 45,
        salePrice: 25,
        discount: 44,
        type: "flash",
        image: "resources/deal-accessories.jpg",
        description: "Trendy handbags, jewelry, and accessories. Perfect additions to any outfit.",
        endTime: new Date(Date.now() + 2 * 60 * 60 * 1000 + 45 * 60 * 1000),
        address: "147 Style Street, Fashion District",
        phone: "(555) 678-9012",
        hours: "Mon-Sat 11AM-7PM",
        distance: "0.5 miles",
        rating: 4.4,
        reviews: 67
    }
];

const sampleStores = [
    {
        id: 1,
        name: "Bella's Boutique",
        category: "clothing",
        image: "resources/store-boutique.jpg",
        description: "Trendy women's fashion boutique offering the latest styles and personalized service.",
        address: "123 Fashion Ave, Downtown",
        phone: "(555) 123-4567",
        website: "bellasboutique.com",
        hours: {
            mon: "10AM-8PM",
            tue: "10AM-8PM",
            wed: "10AM-8PM",
            thu: "10AM-8PM",
            fri: "10AM-8PM",
            sat: "10AM-8PM",
            sun: "12PM-6PM"
        },
        rating: 4.8,
        reviews: 127,
        status: "open",
        features: ["Personal Styling", "Alterations", "Gift Wrapping", "Loyalty Program"],
        deals: [1],
        lat: 40.7589,
        lng: -73.9851
    },
    {
        id: 2,
        name: "TechHub Electronics",
        category: "electronics",
        image: "resources/store-electronics.jpg",
        description: "Your local source for the latest gadgets, computers, and tech accessories.",
        address: "456 Tech Street, Midtown",
        phone: "(555) 234-5678",
        website: "techhub.com",
        hours: {
            mon: "9AM-9PM",
            tue: "9AM-9PM",
            wed: "9AM-9PM",
            thu: "9AM-9PM",
            fri: "9AM-9PM",
            sat: "9AM-9PM",
            sun: "11AM-7PM"
        },
        rating: 4.6,
        reviews: 89,
        status: "open",
        features: ["Tech Support", "Warranty Service", "Trade-ins", "Financing"],
        deals: [2],
        lat: 40.7614,
        lng: -73.9776
    },
    {
        id: 3,
        name: "Fresh Market Grocery",
        category: "grocery",
        image: "resources/store-convenience.jpg",
        description: "Organic and locally-sourced groceries with a focus on fresh, healthy options.",
        address: "789 Market Blvd, Westside",
        phone: "(555) 345-6789",
        website: "freshmarket.com",
        hours: {
            mon: "7AM-10PM",
            tue: "7AM-10PM",
            wed: "7AM-10PM",
            thu: "7AM-10PM",
            fri: "7AM-10PM",
            sat: "7AM-10PM",
            sun: "7AM-10PM"
        },
        rating: 4.9,
        reviews: 203,
        status: "open",
        features: ["Organic Products", "Local Sourcing", "Delivery", "Bulk Discounts"],
        deals: [3],
        lat: 40.7505,
        lng: -73.9934
    },
    {
        id: 4,
        name: "Glow Beauty Supply",
        category: "beauty",
        image: "resources/store-beauty.jpg",
        description: "Premium beauty and cosmetics store featuring top brands and expert advice.",
        address: "321 Beauty Lane, Uptown",
        phone: "(555) 456-7890",
        website: "glowbeauty.com",
        hours: {
            mon: "10AM-8PM",
            tue: "10AM-8PM",
            wed: "10AM-8PM",
            thu: "10AM-8PM",
            fri: "10AM-8PM",
            sat: "10AM-8PM",
            sun: "11AM-6PM"
        },
        rating: 4.7,
        reviews: 156,
        status: "open",
        features: ["Makeup Tutorials", "Skin Consultations", "Gift Sets", "Loyalty Points"],
        deals: [4],
        lat: 40.7736,
        lng: -73.9566
    },
    {
        id: 5,
        name: "Stride Footwear",
        category: "shoes",
        image: "resources/store-shoes.jpg",
        description: "Specialized footwear store for athletic and casual shoes with expert fitting.",
        address: "654 Sports Way, Eastside",
        phone: "(555) 567-8901",
        website: "stridefootwear.com",
        hours: {
            mon: "10AM-9PM",
            tue: "10AM-9PM",
            wed: "10AM-9PM",
            thu: "10AM-9PM",
            fri: "10AM-9PM",
            sat: "10AM-9PM",
            sun: "12PM-7PM"
        },
        rating: 4.5,
        reviews: 94,
        status: "closed",
        features: ["Professional Fitting", "Custom Orders", "Repair Service", "Sports Consultation"],
        deals: [5],
        lat: 40.7282,
        lng: -73.7949
    },
    {
        id: 6,
        name: "Style Corner",
        category: "accessories",
        image: "resources/store-exterior1.jpg",
        description: "Fashion accessories boutique with unique jewelry, bags, and statement pieces.",
        address: "147 Style Street, Fashion District",
        phone: "(555) 678-9012",
        website: "stylecorner.com",
        hours: {
            mon: "11AM-7PM",
            tue: "11AM-7PM",
            wed: "11AM-7PM",
            thu: "11AM-7PM",
            fri: "11AM-7PM",
            sat: "11AM-7PM",
            sun: "Closed"
        },
        rating: 4.4,
        reviews: 67,
        status: "open",
        features: ["Custom Jewelry", "Personal Shopping", "Gift Wrapping", "Style Consultations"],
        deals: [6],
        lat: 40.7411,
        lng: -74.0040
    }
];

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Initialize data
    currentDeals = [...sampleDeals];
    currentStores = [...sampleStores];
    filteredDeals = [...sampleDeals];
    filteredStores = [...sampleStores];
    
    // Initialize page-specific functionality
    const currentPage = getCurrentPage();
    
    switch(currentPage) {
        case 'index':
            initializeHomePage();
            break;
        case 'deals':
            initializeDealsPage();
            break;
        case 'stores':
            initializeStoresPage();
            break;
        case 'about':
            initializeAboutPage();
            break;
    }
    
    // Initialize common functionality
    initializeNavigation();
    initializeAnimations();
}

function getCurrentPage() {
    const path = window.location.pathname;
    if (path.includes('deals.html')) return 'deals';
    if (path.includes('stores.html')) return 'stores';
    if (path.includes('about.html')) return 'about';
    return 'index';
}

// Home page initialization
function initializeHomePage() {
    // Initialize typewriter effect
    if (document.getElementById('typed-text')) {
        new Typed('#typed-text', {
            strings: [
                'Discover the Best Local Deals Near You',
                'Support Local Businesses',
                'Save Money Every Day',
                'Find Amazing Promotions'
            ],
            typeSpeed: 50,
            backSpeed: 30,
            backDelay: 2000,
            loop: true,
            showCursor: true,
            cursorChar: '|'
        });
    }
    
    // Initialize deals carousel
    if (document.getElementById('deals-carousel')) {
        new Splide('#deals-carousel', {
            type: 'loop',
            perPage: 3,
            perMove: 1,
            gap: '2rem',
            autoplay: true,
            interval: 4000,
            pauseOnHover: true,
            breakpoints: {
                1024: { perPage: 2 },
                640: { perPage: 1 }
            }
        }).mount();
    }
    
    // Initialize countdown timers
    updateCountdownTimers();
    setInterval(updateCountdownTimers, 1000);
}

// Deals page initialization
function initializeDealsPage() {
    renderDealsGrid();
    updateCountdownTimers();
    setInterval(updateCountdownTimers, 1000);
    
    // Check for category filter from URL
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    if (category) {
        filterByCategory(category);
    }
}

// Stores page initialization
function initializeStoresPage() {
    initializeMap();
    renderStoreList();
    
    // Default to map view
    switchToMapView();
}

// About page initialization
function initializeAboutPage() {
    // Initialize FAQ functionality
    initializeFAQ();
    
    // Initialize stats counters
    initializeStatsCounters();
}

// Navigation functionality
function initializeNavigation() {
    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileMenuClose = document.querySelector('.mobile-menu-close');
    
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.add('active');
        });
    }
    
    if (mobileMenuClose && mobileMenu) {
        mobileMenuClose.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
        });
    }
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (mobileMenu && !mobileMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
            mobileMenu.classList.remove('active');
        }
    });
}

// Animation initialization
function initializeAnimations() {
    // Animate elements on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    document.querySelectorAll('.card-hover, .step-card, .pricing-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// Deal filtering and search functionality
function filterByCategory(category) {
    currentCategory = category;
    
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-category="${category}"]`).classList.add('active');
    
    filterDeals();
}

function filterDeals() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const dealTypes = Array.from(document.querySelectorAll('.deal-type-filter:checked')).map(cb => cb.value);
    const maxPrice = parseInt(document.getElementById('priceRange')?.value || 500);
    
    filteredDeals = currentDeals.filter(deal => {
        const matchesCategory = currentCategory === 'all' || deal.category === currentCategory;
        const matchesSearch = deal.title.toLowerCase().includes(searchTerm) || 
                            deal.store.toLowerCase().includes(searchTerm) ||
                            deal.description.toLowerCase().includes(searchTerm);
        const matchesType = dealTypes.includes(deal.type);
        const matchesPrice = deal.salePrice <= maxPrice;
        
        return matchesCategory && matchesSearch && matchesType && matchesPrice;
    });
    
    renderDealsGrid();
    updateResultsCount();
}

function sortDeals() {
    const sortBy = document.getElementById('sortBy')?.value || 'popular';
    
    switch(sortBy) {
        case 'discount':
            filteredDeals.sort((a, b) => b.discount - a.discount);
            break;
        case 'ending':
            filteredDeals.sort((a, b) => new Date(a.endTime) - new Date(b.endTime));
            break;
        case 'distance':
            filteredDeals.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
            break;
        case 'newest':
            filteredDeals.sort((a, b) => b.id - a.id);
            break;
        default: // popular
            filteredDeals.sort((a, b) => b.rating - a.rating);
    }
    
    renderDealsGrid();
}

function updatePriceRange(value) {
    const priceValue = document.getElementById('priceValue');
    if (priceValue) {
        priceValue.textContent = value >= 500 ? '$500+' : `$${value}`;
    }
}

function renderDealsGrid() {
    const dealsGrid = document.getElementById('dealsGrid');
    if (!dealsGrid) return;
    
    dealsGrid.innerHTML = filteredDeals.map(deal => `
        <div class="card-hover bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer" onclick="openDealModal(${deal.id})">
            <div class="relative">
                <img src="${deal.image}" alt="${deal.title}" class="w-full h-48 object-cover">
                <div class="deal-badge absolute top-4 left-4 px-3 py-1 rounded-full text-sm">
                    ${deal.type === 'flash' ? 'FLASH SALE' : deal.type === 'weekly' ? 'WEEKLY DEAL' : 'LIMITED TIME'}
                </div>
                <div class="countdown-pulse absolute top-4 right-4 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs font-mono" data-endtime="${deal.endTime.getTime()}">
                    ${formatCountdown(deal.endTime)}
                </div>
            </div>
            <div class="p-6">
                <h3 class="text-xl font-semibold mb-2">${deal.title}</h3>
                <p class="text-gray-600 mb-4">${deal.store}</p>
                <div class="flex justify-between items-center">
                    <div>
                        <span class="text-2xl font-bold text-red-500">$${deal.salePrice}</span>
                        <span class="text-lg text-gray-500 line-through ml-2">$${deal.originalPrice}</span>
                    </div>
                    <div class="text-right">
                        <div class="text-sm text-gray-600">${deal.distance}</div>
                        <div class="flex items-center">
                            <span class="text-yellow-400">★</span>
                            <span class="text-sm ml-1">${deal.rating}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function updateResultsCount() {
    const resultsCount = document.getElementById('resultsCount');
    if (resultsCount) {
        resultsCount.textContent = filteredDeals.length;
    }
}

// Countdown timer functionality
function updateCountdownTimers() {
    document.querySelectorAll('.countdown-pulse').forEach(timer => {
        const endTime = parseInt(timer.dataset.endtime);
        if (endTime) {
            timer.textContent = formatCountdown(new Date(endTime));
        }
    });
}

function formatCountdown(endTime) {
    const now = new Date();
    const diff = endTime - now;
    
    if (diff <= 0) return 'EXPIRED';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    return `${minutes}m ${seconds}s`;
}

// Deal modal functionality
function openDealModal(dealId) {
    const deal = currentDeals.find(d => d.id === dealId);
    if (!deal) return;
    
    // Populate modal content
    document.getElementById('modalImage').src = deal.image;
    document.getElementById('modalTitle').textContent = deal.title;
    document.getElementById('modalStore').textContent = deal.store;
    document.getElementById('modalDiscount').textContent = `${deal.discount}% OFF`;
    document.getElementById('modalPrice').textContent = `$${deal.salePrice}`;
    document.getElementById('modalOriginalPrice').textContent = `$${deal.originalPrice}`;
    document.getElementById('modalDescription').textContent = deal.description;
    document.getElementById('modalAddress').textContent = deal.address;
    document.getElementById('modalPhone').textContent = deal.phone;
    document.getElementById('modalHours').textContent = deal.hours;
    document.getElementById('modalDistance').textContent = deal.distance;
    
    // Show modal
    const modal = document.getElementById('dealModal');
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeDealModal() {
    const modal = document.getElementById('dealModal');
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

// Store functionality
function initializeMap() {
    if (typeof L === 'undefined') return;
    
    // Initialize Leaflet map
    map = L.map('map').setView([40.7589, -73.9851], 13);
    
    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    // Add store markers
    addStoreMarkers();
}

function addStoreMarkers() {
    if (!map) return;
    
    // Clear existing markers
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
    
    // Add new markers
    filteredStores.forEach(store => {
        const marker = L.marker([store.lat, store.lng])
            .addTo(map)
            .bindPopup(`
                <div class="p-2">
                    <h3 class="font-bold text-lg mb-2">${store.name}</h3>
                    <p class="text-sm text-gray-600 mb-2">${store.description}</p>
                    <p class="text-sm mb-2">${store.address}</p>
                    <div class="flex justify-between items-center">
                        <span class="text-sm">⭐ ${store.rating} (${store.reviews} reviews)</span>
                        <button class="bg-red-500 text-white px-3 py-1 rounded text-sm" onclick="openStoreModal(${store.id})">
                            View Details
                        </button>
                    </div>
                </div>
            `);
        
        markers.push(marker);
    });
}

function renderStoreList() {
    const storeList = document.getElementById('storeList');
    if (!storeList) return;
    
    storeList.innerHTML = filteredStores.map(store => `
        <div class="bg-white rounded-lg p-4 shadow cursor-pointer hover:shadow-lg transition-shadow" onclick="openStoreModal(${store.id})">
            <div class="flex items-start justify-between mb-2">
                <h4 class="font-semibold">${store.name}</h4>
                <span class="store-status ${store.status}">${store.status.toUpperCase()}</span>
            </div>
            <p class="text-sm text-gray-600 mb-2">${store.description}</p>
            <div class="flex justify-between items-center text-sm">
                <span class="text-gray-500">${store.category}</span>
                <div class="flex items-center">
                    <span class="text-yellow-400">★</span>
                    <span class="ml-1">${store.rating}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function renderStoresGrid() {
    const storesGrid = document.getElementById('storesGrid');
    if (!storesGrid) return;
    
    storesGrid.innerHTML = filteredStores.map(store => `
        <div class="card-hover bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer" onclick="openStoreModal(${store.id})">
            <img src="${store.image}" alt="${store.name}" class="w-full h-48 object-cover">
            <div class="p-6">
                <div class="flex justify-between items-start mb-4">
                    <h3 class="text-xl font-semibold">${store.name}</h3>
                    <span class="store-status ${store.status}">${store.status.toUpperCase()}</span>
                </div>
                <p class="text-gray-600 mb-4">${store.description}</p>
                <div class="flex justify-between items-center">
                    <div>
                        <div class="flex items-center mb-1">
                            <span class="text-yellow-400">★</span>
                            <span class="ml-1">${store.rating} (${store.reviews} reviews)</span>
                        </div>
                        <p class="text-sm text-gray-500">${store.category}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-sm text-gray-600">${store.deals.length} active deals</p>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function filterByStoreCategory(category) {
    currentCategory = category;
    
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-category="${category}"]`).classList.add('active');
    
    filterStores();
}

function filterStores() {
    const searchTerm = document.getElementById('storeSearch')?.value.toLowerCase() || '';
    
    filteredStores = currentStores.filter(store => {
        const matchesCategory = currentCategory === 'all' || store.category === currentCategory;
        const matchesSearch = store.name.toLowerCase().includes(searchTerm) || 
                            store.description.toLowerCase().includes(searchTerm) ||
                            store.category.toLowerCase().includes(searchTerm);
        
        return matchesCategory && matchesSearch;
    });
    
    if (getCurrentPage() === 'stores') {
        renderStoreList();
        renderStoresGrid();
        addStoreMarkers();
        updateStoreResultsCount();
    }
}

function sortStores() {
    const sortBy = document.getElementById('sortStoresBy')?.value || 'distance';
    
    switch(sortBy) {
        case 'rating':
            filteredStores.sort((a, b) => b.rating - a.rating);
            break;
        case 'name':
            filteredStores.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'deals':
            filteredStores.sort((a, b) => b.deals.length - a.deals.length);
            break;
        default: // distance
            filteredStores.sort((a, b) => parseFloat(a.distance || '1') - parseFloat(b.distance || '1'));
    }
    
    renderStoresGrid();
}

function updateStoreResultsCount() {
    const resultsCount = document.getElementById('storeResultsCount');
    if (resultsCount) {
        resultsCount.textContent = filteredStores.length;
    }
}

// View switching
function switchToMapView() {
    document.getElementById('mapView').classList.remove('hidden');
    document.getElementById('listView').classList.add('hidden');
    document.getElementById('mapViewBtn').classList.add('active');
    document.getElementById('listViewBtn').classList.remove('active');
    
    if (map) {
        setTimeout(() => map.invalidateSize(), 100);
    }
}

function switchToListView() {
    document.getElementById('mapView').classList.add('hidden');
    document.getElementById('listView').classList.remove('hidden');
    document.getElementById('mapViewBtn').classList.remove('active');
    document.getElementById('listViewBtn').classList.add('active');
    
    renderStoresGrid();
}

// Store modal functionality
function openStoreModal(storeId) {
    const store = currentStores.find(s => s.id === storeId);
    if (!store) return;
    
    // Populate modal content
    document.getElementById('modalStoreImage').src = store.image;
    document.getElementById('modalStoreName').textContent = store.name;
    document.getElementById('modalStoreRating').innerHTML = '★'.repeat(Math.floor(store.rating));
    document.getElementById('modalStoreReviews').textContent = `(${store.reviews} reviews)`;
    document.getElementById('modalStoreStatus').textContent = store.status.toUpperCase();
    document.getElementById('modalStoreStatus').className = `store-status ${store.status}`;
    document.getElementById('modalStoreDescription').textContent = store.description;
    document.getElementById('modalStoreAddress').textContent = store.address;
    document.getElementById('modalStorePhone').textContent = store.phone;
    document.getElementById('modalStoreWebsite').textContent = store.website;
    
    // Populate hours
    const hoursContainer = document.getElementById('modalStoreHours');
    hoursContainer.innerHTML = Object.entries(store.hours).map(([day, hours]) => 
        `<p><strong>${day.charAt(0).toUpperCase() + day.slice(1)}:</strong> ${hours}</p>`
    ).join('');
    
    // Populate features
    const featuresContainer = document.getElementById('modalStoreFeatures');
    featuresContainer.innerHTML = store.features.map(feature => 
        `<span class="bg-gray-100 px-3 py-1 rounded-full text-sm">${feature}</span>`
    ).join('');
    
    // Populate deals
    const dealsContainer = document.getElementById('modalStoreDeals');
    const storeDeals = currentDeals.filter(deal => store.deals.includes(deal.id));
    dealsContainer.innerHTML = storeDeals.map(deal => `
        <div class="bg-gray-50 rounded-lg p-4">
            <h5 class="font-semibold mb-2">${deal.title}</h5>
            <div class="flex justify-between items-center">
                <span class="text-red-500 font-bold">$${deal.salePrice}</span>
                <button class="btn-primary px-3 py-1 rounded text-sm" onclick="openDealModal(${deal.id})">
                    View Deal
                </button>
            </div>
        </div>
    `).join('');
    
    // Show modal
    const modal = document.getElementById('storeModal');
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeStoreModal() {
    const modal = document.getElementById('storeModal');
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

// About page functionality
function initializeFAQ() {
    // FAQ toggle functionality is handled by toggleFAQ function
}

function toggleFAQ(element) {
    const answer = element.nextElementSibling;
    const icon = element.querySelector('svg');
    
    if (answer.classList.contains('active')) {
        answer.classList.remove('active');
        icon.style.transform = 'rotate(0deg)';
    } else {
        // Close all other FAQs
        document.querySelectorAll('.faq-answer').forEach(ans => {
            ans.classList.remove('active');
        });
        document.querySelectorAll('.faq-question svg').forEach(ic => {
            ic.style.transform = 'rotate(0deg)';
        });
        
        // Open this FAQ
        answer.classList.add('active');
        icon.style.transform = 'rotate(180deg)';
    }
}

function initializeStatsCounters() {
    // Animate stats counters when they come into view
    const counters = document.querySelectorAll('.stats-counter');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
            }
        });
    });
    
    counters.forEach(counter => observer.observe(counter));
}

function animateCounter(element) {
    const target = parseInt(element.textContent);
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;
    
    const timer = setInterval(() => {
        current += step;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current);
    }, 16);
}

// Utility functions
function loadMoreDeals() {
    // Simulate loading more deals
    alert('Loading more deals... This would fetch additional deals from the server.');
}

function loadMoreStores() {
    // Simulate loading more stores
    alert('Loading more stores... This would fetch additional stores from the server.');
}

function getDirections() {
    alert('Opening directions... This would integrate with Google Maps or similar service.');
}

function shareDeal() {
    if (navigator.share) {
        navigator.share({
            title: 'Check out this amazing deal!',
            text: 'I found this great deal on LocalDeals Hub',
            url: window.location.href
        });
    } else {
        // Fallback for browsers that don't support Web Share API
        alert('Sharing functionality would be implemented here.');
    }
}

function saveDeal() {
    alert('Deal saved! You can view your saved deals in your profile.');
}

function getStoreDirections() {
    alert('Opening store directions... This would integrate with Google Maps or similar service.');
}

function callStore() {
    alert('Calling store... This would initiate a phone call.');
}

function shareStore() {
    if (navigator.share) {
        navigator.share({
            title: 'Check out this store!',
            text: 'I found this great store on LocalDeals Hub',
            url: window.location.href
        });
    } else {
        alert('Store sharing functionality would be implemented here.');
    }
}

function viewStoreDeals() {
    // Redirect to deals page with store filter
    window.location.href = 'deals.html';
}

function openStoreSignup() {
    alert('Store signup form would be displayed here. This would collect business information and payment details.');
}

// Email signup functionality
function handleEmailSignup(event) {
    event.preventDefault();
    const email = event.target.querySelector('input[type="email"]').value;
    
    // Simulate email signup
    alert(`Thank you for subscribing with ${email}! You'll receive weekly deal updates.`);
    event.target.reset();
}

function handleModalSignup(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    // Simulate signup process
    alert('Welcome to LocalDeals Hub! You\'ll receive a confirmation email shortly.');
    closeSignupModal();
}

function openSignupModal() {
    const modal = document.getElementById('signupModal');
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeSignupModal() {
    const modal = document.getElementById('signupModal');
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

// Close modals when clicking outside
document.addEventListener('click', (e) => {
    const dealModal = document.getElementById('dealModal');
    const storeModal = document.getElementById('storeModal');
    const signupModal = document.getElementById('signupModal');
    
    if (dealModal && e.target === dealModal) {
        closeDealModal();
    }
    if (storeModal && e.target === storeModal) {
        closeStoreModal();
    }
    if (signupModal && e.target === signupModal) {
        closeSignupModal();
    }
});

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeDealModal();
        closeStoreModal();
        closeSignupModal();
    }
});

console.log('LocalDeals Hub initialized successfully!');