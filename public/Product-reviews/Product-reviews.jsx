// ===== CONFIGURATION =====
const CONFIG = {
    SLIDE_INTERVAL: 5000,
    NOTIFICATION_TIMEOUT: 3000,
    CART_KEY: 'aabhira_cart',
    WISHLIST_KEY: 'aabhira_wishlist',
    RECENTLY_VIEWED_KEY: 'aabhira_recently_viewed'
    // ZOOM_ENABLED को remove करें यदि zoom function नहीं है
};

// ===== STATE =====
let currentSlide = 0;
let slideInterval;
let cart = [];
let isCartOpen = false;
let isChatOpen = false;

// ===== DOM ELEMENTS =====
const heroSlider = document.querySelector('.hero-slider');
const cartOverlay = document.getElementById('cartOverlay');
const cartDrawer = document.getElementById('cartDrawer');
const bagIcon = document.getElementById('bagIcon');
const closeCartBtn = document.getElementById('closeCart');
const continueShoppingBtn = document.getElementById('continueShopping');
const checkoutBtn = document.getElementById('checkoutBtn');
const cartItemsContainer = document.getElementById('cartItems');
const cartEmpty = document.getElementById('cartEmpty');
const cartCount = document.querySelector('.cart-count');
const chatToggle = document.getElementById('chatToggle');
const chatBox = document.getElementById('chatBox');
const closeChatBtn = document.getElementById('closeChat');
const chatInput = document.getElementById('chatInput');
const sendMessageBtn = document.getElementById('sendMessageBtn');
const chatBody = document.getElementById('chatBody');
const wishlistIcon = document.getElementById('wishlistIcon');

// ===== FIREBASE INITIALIZATION =====
function initFirebase() {
    console.log('Initializing Firebase...');
    
    // Check if Firebase is available
    if (window.firebaseUtils && window.firebaseUtils.isFirebaseAvailable()) {
        console.log('Firebase is available');
        
        // Load cart from Firebase if user is logged in
        const user = window.firebaseAuth?.currentUser;
        if (user) {
            loadCartFromFirebase(user.uid);
        }
        
    } else {
        console.log('Using localStorage fallback');
        loadCartFromStorage();
    }
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('AABHIRA FASHION - Homepage Loaded');
    
    // Initialize Firebase first
    initFirebase();
    
    // Then initialize other components
    initHeroSlider();
    initCart();
    initChat();
    initWishlist();
    initCategoryCards();
    initAccountDropdown();
    initSearch();
    
    // Update UI with loaded cart
    updateCartUI();
});

// ===== HERO SLIDER =====
function initHeroSlider() {
    const slides = document.querySelectorAll('.hero-slide');
    if (!slides.length) return;
    
    // Show first slide
    slides[0].classList.add('active');
    
    // Auto slide
    startAutoSlide();
    
    // Pause on hover
    heroSlider?.addEventListener('mouseenter', pauseSlider);
    heroSlider?.addEventListener('mouseleave', startAutoSlide);
}

function startAutoSlide() {
    clearInterval(slideInterval);
    slideInterval = setInterval(nextSlide, CONFIG.SLIDE_INTERVAL);
}

function pauseSlider() {
    clearInterval(slideInterval);
}

// BEFORE:
function nextSlide() {
    const slides = document.querySelectorAll('.hero-slide');
    if (!slides.length) return;
    
    slides[currentSlide].classList.remove('active');
    currentSlide = (currentSlide + 1) % slides.length;
    slides[currentSlide].classList.add('active');
}

// AFTER (Optimized):
function nextSlide() {
    const slides = document.querySelectorAll('.hero-slide');
    if (!slides.length) return;
    
    requestAnimationFrame(() => {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    });
}

// ===== CART SYSTEM =====
function initCart() {
    bagIcon?.addEventListener('click', openCart);
    closeCartBtn?.addEventListener('click', closeCart);
    continueShoppingBtn?.addEventListener('click', closeCart);
    cartOverlay?.addEventListener('click', closeCart);
    checkoutBtn?.addEventListener('click', proceedToCheckout);
}

function openCart() {
    isCartOpen = true;
    cartDrawer.classList.add('active');
    cartOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCart() {
    isCartOpen = false;
    cartDrawer.classList.remove('active');
    cartOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

function loadCartFromStorage() {
    try {
        const savedCart = localStorage.getItem(CONFIG.CART_KEY);
        if (savedCart) {
            cart = JSON.parse(savedCart);
        }
    } catch (e) {
        console.error('Error loading cart:', e);
        cart = [];
    }
}

async function loadCartFromFirebase(userId) {
    try {
        if (window.firebaseUtils) {
            const cartData = await window.firebaseUtils.getData('carts', userId);
            if (cartData) {
                cart = cartData.items || [];
            }
        }
    } catch (e) {
        console.error('Error loading cart from Firebase:', e);
        loadCartFromStorage(); // Fallback to localStorage
    }
}

function saveCartToStorage() {
    try {
        localStorage.setItem(CONFIG.CART_KEY, JSON.stringify(cart));
    } catch (e) {
        console.error('Error saving cart:', e);
    }
}

async function saveCartToFirebase(userId) {
    try {
        if (window.firebaseUtils) {
            await window.firebaseUtils.saveData('carts', { 
                userId, 
                items: cart,
                updatedAt: new Date().toISOString()
            }, userId);
        }
    } catch (e) {
        console.error('Error saving cart to Firebase:', e);
        saveCartToStorage(); // Fallback to localStorage
    }
}

function updateCartUI() {
    if (!cartItemsContainer || !cartEmpty || !cartCount) return;
    
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Update count
    cartCount.textContent = `(${totalItems} ${totalItems === 1 ? 'item' : 'items'})`;
    
    // Update total price
    const btnPrice = document.querySelector('.btn-price');
    if (btnPrice) {
        btnPrice.textContent = `₹${totalPrice.toLocaleString()}`;
    }
    
    // Show/hide empty state
    if (cart.length === 0) {
        cartEmpty.classList.add('active');
        cartItemsContainer.classList.remove('active');
        checkoutBtn.disabled = true;
    } else {
        cartEmpty.classList.remove('active');
        cartItemsContainer.classList.add('active');
        checkoutBtn.disabled = false;
        
        // Render cart items
        cartItemsContainer.innerHTML = cart.map((item, index) => `
            <div class="cart-item">
                <div class="item-image">
                    <img src="${item.image}" alt="${item.name}">
                    <button class="remove-item" onclick="removeFromCart(${index})">×</button>
                </div>
                <div class="item-details">
                    <h3>${item.brand}</h3>
                    <p>${item.name}</p>
                    <div class="item-price">
                        <span class="current-price">₹${(item.price * item.quantity).toLocaleString()}</span>
                        ${item.originalPrice ? `
                            <span class="original-price">₹${item.originalPrice.toLocaleString()}</span>
                            <span class="discount">${Math.round((1 - item.price/item.originalPrice) * 100)}% off</span>
                        ` : ''}
                    </div>
                    <div class="quantity-control">
                        <button class="qty-minus" onclick="updateQuantity(${index}, -1)">−</button>
                        <span class="qty-value">${item.quantity}</span>
                        <button class="qty-plus" onclick="updateQuantity(${index}, 1)">+</button>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

async function addToCart(product) {
    const existingIndex = cart.findIndex(item => 
        item.id === product.id && item.size === product.size
    );
    
    if (existingIndex > -1) {
        cart[existingIndex].quantity += product.quantity;
    } else {
        cart.push({...product});
    }
    
    // Save to appropriate storage
    const user = window.firebaseAuth?.currentUser;
    if (user) {
        await saveCartToFirebase(user.uid);
    } else {
        saveCartToStorage();
    }
    
    updateCartUI();
    showNotification(`${product.name} added to cart!`);
    
    if (!isCartOpen) {
        openCart();
    }
}

async function removeFromCart(index) {
    const item = cart[index];
    cart.splice(index, 1);
    
    // Save to appropriate storage
    const user = window.firebaseAuth?.currentUser;
    if (user) {
        await saveCartToFirebase(user.uid);
    } else {
        saveCartToStorage();
    }
    
    updateCartUI();
    showNotification(`${item.name} removed from cart`);
}

async function updateQuantity(index, change) {
    cart[index].quantity += change;
    
    if (cart[index].quantity < 1) {
        removeFromCart(index);
        return;
    }
    
    // Save to appropriate storage
    const user = window.firebaseAuth?.currentUser;
    if (user) {
        await saveCartToFirebase(user.uid);
    } else {
        saveCartToStorage();
    }
    
    updateCartUI();
}

function proceedToCheckout() {
    if (cart.length === 0) {
        showNotification('Your cart is empty!');
        return;
    }
    
    showNotification('Redirecting to checkout...');
    // In real app: window.location.href = '/checkout.html';
}

// ===== CHAT SYSTEM =====
function initChat() {
    chatToggle?.addEventListener('click', toggleChat);
    closeChatBtn?.addEventListener('click', toggleChat);
    chatInput?.addEventListener('keypress', handleChatInput);
    sendMessageBtn?.addEventListener('click', sendMessage);
}

function toggleChat() {
    isChatOpen = !isChatOpen;
    chatBox.classList.toggle('active');
    
    if (isChatOpen) {
        chatInput.focus();
    }
}

function handleChatInput(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
}

function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;
    
    // Add user message
    addChatMessage(message, 'user');
    chatInput.value = '';
    
    // Simulate bot reply
    setTimeout(() => {
        const replies = [
            "I'll help you with that. Can you provide more details?",
            "Thanks for your question! Our team will get back to you.",
            "You can check that in your account section.",
            "Let me check that information for you."
        ];
        const reply = replies[Math.floor(Math.random() * replies.length)];
        addChatMessage(reply, 'bot');
    }, 1000);
}

function addChatMessage(text, sender) {
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    messageDiv.innerHTML = `
        <div class="message-content">
            <div class="message-text">${text}</div>
            <div class="message-time">${time}</div>
        </div>
    `;
    
    chatBody.appendChild(messageDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
}

// ===== WISHLIST =====
function initWishlist() {
    wishlistIcon?.addEventListener('click', toggleWishlist);
}

function toggleWishlist() {
    const icon = wishlistIcon;
    const isSolid = icon.classList.contains('fa-solid');
    
    if (isSolid) {
        icon.classList.remove('fa-solid');
        icon.classList.add('fa-regular');
        icon.style.color = '';
        showNotification('Removed from wishlist');
    } else {
        icon.classList.remove('fa-regular');
        icon.classList.add('fa-solid');
        icon.style.color = '#ff3f8e';
        showNotification('Added to wishlist');
    }
    
    // Save wishlist state
    try {
        const wishlist = JSON.parse(localStorage.getItem(CONFIG.WISHLIST_KEY) || '[]');
        const newState = !isSolid;
        localStorage.setItem(CONFIG.WISHLIST_KEY, JSON.stringify({...wishlist, active: newState}));
    } catch (e) {
        console.error('Error saving wishlist:', e);
    }
}

// ===== CATEGORY CARDS =====
function initCategoryCards() {
    const categoryCards = document.querySelectorAll('.category-card');
    categoryCards.forEach(card => {
        card.addEventListener('click', () => {
            const category = card.dataset.category || card.querySelector('.category-name').textContent;
            navigateToCategory(category);
        });
    });
}

function navigateToCategory(category) {
    showNotification(`Loading ${category}...`);
    // In real app: window.location.href = `/category/${category.toLowerCase()}`;
}

// ===== ACCOUNT DROPDOWN =====
function initAccountDropdown() {
    // Hover functionality is handled by CSS
    // Add click functionality for mobile
    if (window.innerWidth <= 768) {
        const accountWrapper = document.querySelector('.account-wrapper');
        const dropdown = document.querySelector('.account-dropdown');
        
        accountWrapper?.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
        });
        
        // Close when clicking outside
        document.addEventListener('click', () => {
            dropdown.style.display = 'none';
        });
    }
}

// ===== SEARCH =====
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchIcon = document.getElementById('searchIcon');
    
    const performSearch = () => {
        const query = searchInput.value.trim();
        if (query) {
            showNotification(`Searching for "${query}"...`);
            // In real app: window.location.href = `/search?q=${encodeURIComponent(query)}`;
        }
    };
    
    searchIcon?.addEventListener('click', performSearch);
    searchInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
}

// ===== NOTIFICATIONS =====
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification-toast';
    notification.innerHTML = `
        <div class="toast-content">
            <span class="toast-icon">✓</span>
            <span class="toast-message">${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('active');
    }, 10);
    
    // Remove after timeout
    setTimeout(() => {
        notification.classList.remove('active');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, CONFIG.NOTIFICATION_TIMEOUT);
}

// ===== PERFORMANCE OPTIMIZATION =====
// Debounce function for performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function for performance
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Optimize all click handlers
document.addEventListener('DOMContentLoaded', function() {
    console.log('AABHIRA FASHION - Homepage Loaded');
    
    // Initialize with debounce
    const debouncedInit = debounce(initFirebase, 100);
    debouncedInit();
    
    // Optimize other initializations
    setTimeout(() => {
        initHeroSlider();
        initCart();
        initChat();
        initWishlist();
        initCategoryCards();
        initAccountDropdown();
        initSearch();
        updateCartUI();
    }, 50);
});

// ===== GLOBAL FUNCTIONS =====
window.nextSlide = nextSlide;
window.openCart = openCart;
window.closeCart = closeCart;
window.toggleChat = toggleChat;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateQuantity = updateQuantity;
window.showNotification = showNotification;

// ===== ZOOM FEATURE FIX =====
// यदि initZoomFeature function नहीं है तो उसे define करें
function initZoomFeature() {
    console.log('Zoom feature initialized');
    // Add your zoom functionality here if needed
    // या इसे remove करें यदि zoom की जरूरत नहीं है
}



// ===== PRODUCT DATA =====
function initCurrentProduct() {
    currentProduct = {
        id: 'prod_001',
        name: document.querySelector('.product-title')?.textContent || 'Smartphone Pro X 256GB - Phantom Black',
        brand: document.querySelector('.brand-name')?.textContent || 'TechBrand',
        price: parseFloat(priceElement?.textContent.replace('$', '') || '749.99'),
        originalPrice: parseFloat(document.querySelector('.mrp')?.textContent.replace('$', '') || '999.99'),
        discount: discountBadge?.textContent || '-25%',
        images: [
            'https://via.placeholder.com/500x500/cccccc/666666?text=Product+Main',
            'https://via.placeholder.com/500x500/cccccc/666666?text=Thumb2',
            'https://via.placeholder.com/500x500/cccccc/666666?text=Thumb3',
            'https://via.placeholder.com/500x500/cccccc/666666?text=Thumb4'
        ],
        rating: 4.5,
        reviewsCount: 2348,
        inStock: true,
        description: document.querySelector('.product-description p')?.textContent || 'Experience the future of smartphones...',
        features: Array.from(document.querySelectorAll('.features li')).map(li => li.textContent),
        specifications: getProductSpecifications(),
        category: 'Electronics',
        subcategory: 'Mobile Phones',
        sku: 'TB-PROX-256-BLK'
    };
}

function getProductSpecifications() {
    const specs = {};
    const rows = document.querySelectorAll('.product-specs table tr');
    rows.forEach(row => {
        const key = row.cells[0]?.textContent;
        const value = row.cells[1]?.textContent;
        if (key && value) {
            specs[key.trim()] = value.trim();
        }
    });
    return specs;
}

// ===== IMAGE GALLERY =====
function initImageGallery() {
    if (!thumbnails.length || !mainImage) return;
    
    // Set first thumbnail as active
    thumbnails[0]?.classList.add('active');
    
    // Add click events to thumbnails
    thumbnails.forEach((thumb, index) => {
        thumb.addEventListener('click', () => {
            // Update active thumbnail
            thumbnails.forEach(t => t.classList.remove('active'));
            thumb.classList.add('active');
            
            // Update main image
            selectedImageIndex = index;
            updateMainImage(index);
        });
    });
    
    // Add zoom functionality if enabled
    if (CONFIG.ZOOM_ENABLED) {
        initImageZoom();
    }
}

function updateMainImage(index) {
    if (!currentProduct || !currentProduct.images[index]) return;
    
    mainImage.src = currentProduct.images[index];
    mainImage.alt = `${currentProduct.name} - Image ${index + 1}`;
    
    // Add fade effect
    mainImage.style.opacity = '0';
    setTimeout(() => {
        mainImage.style.opacity = '1';
    }, 100);
}

function initImageZoom() {
    mainImage.addEventListener('mouseenter', () => {
        if (!isZoomActive) {
            mainImage.style.transform = 'scale(1.2)';
            mainImage.style.transition = 'transform 0.3s ease';
            isZoomActive = true;
        }
    });
    
    mainImage.addEventListener('mouseleave', () => {
        if (isZoomActive) {
            mainImage.style.transform = 'scale(1)';
            isZoomActive = false;
        }
    });
}

// ===== CART SYSTEM =====
function initCartSystem() {
    // Load existing cart
    loadCartFromStorage();
    
    // Setup event listeners
    addToCartBtn?.addEventListener('click', handleAddToCart);
    buyNowBtn?.addEventListener('click', handleBuyNow);
    bagIcon?.addEventListener('click', openCart);
    closeCartBtn?.addEventListener('click', closeCart);
    cartOverlay?.addEventListener('click', closeCart);
}

function loadCartFromStorage() {
    try {
        const savedCart = localStorage.getItem(CONFIG.CART_KEY);
        if (savedCart) {
            cart = JSON.parse(savedCart);
        }
    } catch (e) {
        console.error('Error loading cart:', e);
        cart = [];
    }
}

function saveCartToStorage() {
    try {
        localStorage.setItem(CONFIG.CART_KEY, JSON.stringify(cart));
    } catch (e) {
        console.error('Error saving cart:', e);
    }
}

function updateCartUI() {
    if (!cartCount) return;
    
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems > 0 ? totalItems : '';
    
    // Update cart count badge
    const badge = document.querySelector('.cart-badge') || createCartBadge();
    if (badge) {
        badge.textContent = totalItems;
        badge.style.display = totalItems > 0 ? 'flex' : 'none';
    }
}

function createCartBadge() {
    if (!bagIcon) return null;
    
    const badge = document.createElement('span');
    badge.className = 'cart-badge';
    bagIcon.appendChild(badge);
    return badge;
}

function handleAddToCart() {
    if (!currentProduct) return;
    
    const productToAdd = {
        ...currentProduct,
        quantity: selectedQuantity,
        selectedSize: getSelectedSize(),
        selectedColor: getSelectedColor(),
        image: currentProduct.images[0],
        addedAt: new Date().toISOString()
    };
    
    addToCart(productToAdd);
}

function addToCart(product) {
    const existingIndex = cart.findIndex(item => 
        item.id === product.id && 
        item.selectedSize === product.selectedSize &&
        item.selectedColor === product.selectedColor
    );
    
    if (existingIndex > -1) {
        cart[existingIndex].quantity += product.quantity;
        showNotification(`${product.name} quantity updated in cart!`);
    } else {
        cart.push(product);
        showNotification(`${product.name} added to cart!`);
    }
    
    saveCartToStorage();
    updateCartUI();
    
    // Open cart drawer on mobile
    if (window.innerWidth <= 768) {
        openCart();
    }
}

function handleBuyNow() {
    handleAddToCart();
    
    // Redirect to checkout
    setTimeout(() => {
        window.location.href = '/checkout.html';
    }, 500);
}

function openCart() {
    // Check if cart drawer exists
    if (!cartDrawer || !cartOverlay) {
        // Redirect to cart page
        window.location.href = '/cart.html';
        return;
    }
    
    cartDrawer.classList.add('active');
    cartOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    renderCartItems();
}

function closeCart() {
    if (cartDrawer && cartOverlay) {
        cartDrawer.classList.remove('active');
        cartOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function renderCartItems() {
    if (!cartItemsContainer || !cartEmpty) return;
    
    if (cart.length === 0) {
        cartEmpty.style.display = 'block';
        cartItemsContainer.style.display = 'none';
        return;
    }
    
    cartEmpty.style.display = 'none';
    cartItemsContainer.style.display = 'block';
    
    cartItemsContainer.innerHTML = cart.map((item, index) => `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.name}" class="cart-item-image">
            <div class="cart-item-details">
                <h4>${item.name}</h4>
                <p>${item.brand}</p>
                <div class="cart-item-price">
                    <span class="current">$${item.price}</span>
                    ${item.originalPrice ? `<span class="original">$${item.originalPrice}</span>` : ''}
                </div>
                <div class="cart-item-quantity">
                    <button onclick="updateCartQuantity(${index}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="updateCartQuantity(${index}, 1)">+</button>
                </div>
            </div>
            <button class="remove-item" onclick="removeFromCart(${index})">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
}

// ===== WISHLIST =====
function initWishlist() {
    loadWishlistFromStorage();
    
    // Find or create wishlist icon
    const wishlistIcon = document.getElementById('wishlistIcon') || createWishlistIcon();
    
    if (wishlistIcon) {
        wishlistIcon.addEventListener('click', toggleWishlist);
        updateWishlistUI();
    }
}

function createWishlistIcon() {
    const actionButtons = document.querySelector('.product-actions');
    if (!actionButtons) return null;
    
    const icon = document.createElement('button');
    icon.id = 'wishlistIcon';
    icon.className = 'wishlist-btn';
    icon.innerHTML = '<i class="far fa-heart"></i> Add to Wishlist';
    actionButtons.appendChild(icon);
    
    return icon;
}

function loadWishlistFromStorage() {
    try {
        const saved = localStorage.getItem(CONFIG.WISHLIST_KEY);
        if (saved) {
            wishlist = JSON.parse(saved);
        }
    } catch (e) {
        console.error('Error loading wishlist:', e);
        wishlist = [];
    }
}

function saveWishlistToStorage() {
    try {
        localStorage.setItem(CONFIG.WISHLIST_KEY, JSON.stringify(wishlist));
    } catch (e) {
        console.error('Error saving wishlist:', e);
    }
}

function updateWishlistUI() {
    const icon = document.getElementById('wishlistIcon');
    if (!icon) return;
    
    const isInWishlist = wishlist.some(item => item.id === currentProduct.id);
    const heartIcon = icon.querySelector('i');
    
    if (isInWishlist) {
        heartIcon.className = 'fas fa-heart';
        heartIcon.style.color = '#ff3f8e';
        icon.innerHTML = '<i class="fas fa-heart"></i> Added to Wishlist';
    } else {
        heartIcon.className = 'far fa-heart';
        heartIcon.style.color = '';
        icon.innerHTML = '<i class="far fa-heart"></i> Add to Wishlist';
    }
}

function toggleWishlist() {
    const index = wishlist.findIndex(item => item.id === currentProduct.id);
    
    if (index > -1) {
        // Remove from wishlist
        wishlist.splice(index, 1);
        showNotification('Removed from wishlist');
    } else {
        // Add to wishlist
        wishlist.push({
            id: currentProduct.id,
            name: currentProduct.name,
            price: currentProduct.price,
            image: currentProduct.images[0],
            addedAt: new Date().toISOString()
        });
        showNotification('Added to wishlist!');
    }
    
    saveWishlistToStorage();
    updateWishlistUI();
}

// ===== QUANTITY SELECTOR =====
function initQuantitySelector() {
    if (!quantitySelect) return;
    
    selectedQuantity = parseInt(quantitySelect.value);
    
    quantitySelect.addEventListener('change', (e) => {
        selectedQuantity = parseInt(e.target.value);
        updatePriceDisplay();
    });
}

function updatePriceDisplay() {
    const priceDisplay = document.querySelector('.price-display .price');
    if (priceDisplay && currentProduct) {
        const total = currentProduct.price * selectedQuantity;
        priceDisplay.textContent = `$${total.toFixed(2)}`;
    }
}

// ===== PRODUCT VARIANTS INTERACTIVITY =====
function initProductVariants() {
    console.log('Initializing product variants...');
    
    // COLOR SELECTION
    const colorOptions = document.querySelectorAll('.color-option');
    colorOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove active class from all
            colorOptions.forEach(opt => opt.classList.remove('active'));
            
            // Add active to clicked
            this.classList.add('active');
            
            // Update selected color text
            const colorName = this.querySelector('.color-name').textContent;
            document.querySelector('.selected-color').textContent = colorName;
            
            // Get image index
            const imageIndex = this.dataset.color || '1';
            updateProductImage(imageIndex);
            
            console.log('Color selected:', colorName);
        });
    });
    
    // SIZE SELECTION
    const sizeOptions = document.querySelectorAll('.size-option');
    sizeOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove active class from all
            sizeOptions.forEach(opt => opt.classList.remove('active'));
            
            // Add active to clicked
            this.classList.add('active');
            
            const size = this.querySelector('.size-value').textContent;
            console.log('Size selected:', size);
            
            // Show notification
            showNotification(`Size ${size} selected`);
        });
    });
    
    // FIT SELECTION
    const fitOptions = document.querySelectorAll('.fit-option');
    fitOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove active class from all
            fitOptions.forEach(opt => opt.classList.remove('active'));
            
            // Add active to clicked
            this.classList.add('active');
            
            const fit = this.dataset.fit || 'regular';
            console.log('Fit selected:', fit);
        });
    });
    
    // SIZE CHART TOGGLE
    const sizeChartBtn = document.querySelector('.size-chart-btn');
    const sizeGuide = document.getElementById('sizeGuide');
    
    sizeChartBtn?.addEventListener('click', function(e) {
        e.preventDefault();
        sizeGuide.classList.toggle('active');
        
        if (sizeGuide.classList.contains('active')) {
            this.innerHTML = '<i class="fas fa-times"></i> Close Size Chart';
        } else {
            this.innerHTML = '<i class="fas fa-ruler-combined"></i> Size Chart';
        }
    });
    
    // CHANGE LOCATION
    const changeLocationBtn = document.querySelector('.change-location');
    changeLocationBtn?.addEventListener('click', function(e) {
        e.preventDefault();
        const newLocation = prompt('Enter your pincode:', '400001');
        if (newLocation) {
            document.querySelector('.delivery-location strong').textContent = 
                `Mumbai ${newLocation}`;
            showNotification(`Delivery location updated to ${newLocation}`);
        }
    });
}

// ===== IMAGE GALLERY =====
function updateProductImage(imageIndex) {
    const mainImage = document.getElementById('mainProductImage');
    const thumbnails = document.querySelectorAll('.thumb');
    
    if (!mainImage) return;
    
    // Get corresponding thumbnail
    const thumb = document.querySelector(`.thumb[data-image="${imageIndex}"]`);
    if (thumb) {
        // Update thumbnail active state
        thumbnails.forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
        
        // Get image from thumbnail
        const thumbImg = thumb.querySelector('img');
        if (thumbImg) {
            // Fade effect
            mainImage.style.opacity = '0.5';
            setTimeout(() => {
                mainImage.src = thumbImg.src;
                mainImage.alt = thumbImg.alt;
                mainImage.style.opacity = '1';
            }, 300);
            
            console.log('Image updated to:', thumbImg.alt);
        }
    }
}

// ===== INITIALIZE EVERYTHING =====
function initProductPage() {
    console.log('Initializing product page...');
    
    // Initialize variants
    initProductVariants();
    
    // Initialize image gallery
    initImageGallery();
    
    // Initialize quantity selector
    initQuantitySelector();
    
    // Initialize tabs
    initTabs();
    
    console.log('Product page initialized!');
}

// ===== CALL INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for DOM to fully load
    setTimeout(() => {
        initProductPage();
    }, 100);
});

// ===== HELPER FUNCTIONS =====
function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add styles if not exists
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: #4CAF50;
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                display: flex;
                align-items: center;
                gap: 10px;
                z-index: 9999;
                transform: translateY(100px);
                opacity: 0;
                transition: all 0.3s ease;
            }
            .notification.show {
                transform: translateY(0);
                opacity: 1;
            }
            .notification.error {
                background: #f44336;
            }
            .notification.info {
                background: #2196F3;
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Auto remove
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function getSelectedSize() {
    const activeSize = document.querySelector('.size-btn.active');
    return activeSize ? activeSize.dataset.size : null;
}

function getSelectedColor() {
    const activeColor = document.querySelector('.color-swatch.active');
    return activeColor ? activeColor.dataset.color : null;
}

function updateProductColor(color) {
    // In real app, you would fetch images for this color
    const colorImages = {
        'black': ['https://via.placeholder.com/500x500/333333/ffffff?text=Black'],
        'white': ['https://via.placeholder.com/500x500/ffffff/333333?text=White'],
        'blue': ['https://via.placeholder.com/500x500/0066cc/ffffff?text=Blue']
    };
    
    if (colorImages[color]) {
        currentProduct.images = colorImages[color];
        updateMainImage(0);
        
        // Update thumbnails
        thumbnails.forEach((thumb, index) => {
            const img = thumb.querySelector('img');
            if (img && colorImages[color][index]) {
                img.src = colorImages[color][index];
            }
        });
    }
}

// ===== RELATED PRODUCTS =====
function initRelatedProducts() {
    relatedProducts?.forEach(product => {
        product.addEventListener('click', () => {
            const productId = product.dataset.id;
            navigateToProduct(productId);
        });
        
        // Add quick add to cart
        const quickAddBtn = product.querySelector('.quick-add-btn');
        if (quickAddBtn) {
            quickAddBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const productData = getProductDataFromCard(product);
                addToCart({...productData, quantity: 1});
            });
        }
    });
}

function getProductDataFromCard(card) {
    return {
        id: card.dataset.id || `prod_${Math.random().toString(36).substr(2, 9)}`,
        name: card.querySelector('h3')?.textContent || 'Product',
        price: parseFloat(card.querySelector('.card-price')?.textContent.replace('$', '') || '0'),
        image: card.querySelector('img')?.src || '',
        brand: 'AABHIRA'
    };
}

function navigateToProduct(productId) {
    showNotification(`Loading product...`);
    // In real app: window.location.href = `/product/${productId}`;
}

// ===== REVIEWS =====
function initReviews() {
    reviewCards?.forEach(card => {
        // Add helpful button functionality
        const helpfulBtn = card.querySelector('.helpful-btn');
        if (helpfulBtn) {
            helpfulBtn.addEventListener('click', () => {
                const countSpan = helpfulBtn.querySelector('.count');
                let count = parseInt(countSpan.textContent);
                
                if (helpfulBtn.classList.contains('active')) {
                    count--;
                    helpfulBtn.classList.remove('active');
                    helpfulBtn.innerHTML = `<i class="far fa-thumbs-up"></i> Helpful (${count})`;
                } else {
                    count++;
                    helpfulBtn.classList.add('active');
                    helpfulBtn.innerHTML = `<i class="fas fa-thumbs-up"></i> Helpful (${count})`;
                }
                
                countSpan.textContent = count;
            });
        }
        
        // Add report functionality
        const reportBtn = card.querySelector('.report-btn');
        if (reportBtn) {
            reportBtn.addEventListener('click', () => {
                showNotification('Review reported. Thank you for your feedback.');
            });
        }
    });
    
    // Initialize review form if exists
    const reviewForm = document.getElementById('reviewForm');
    if (reviewForm) {
        initReviewForm(reviewForm);
    }
}

function initReviewForm(form) {
    const ratingStars = form.querySelectorAll('.review-rating i');
    let selectedRating = 0;
    
    ratingStars.forEach((star, index) => {
        star.addEventListener('click', () => {
            selectedRating = index + 1;
            
            // Update star display
            ratingStars.forEach((s, i) => {
                if (i <= index) {
                    s.className = 'fas fa-star';
                } else {
                    s.className = 'far fa-star';
                }
            });
            
            // Update hidden input
            form.querySelector('[name="rating"]').value = selectedRating;
        });
        
        star.addEventListener('mouseenter', () => {
            ratingStars.forEach((s, i) => {
                s.className = i <= index ? 'fas fa-star' : 'far fa-star';
            });
        });
        
        star.addEventListener('mouseleave', () => {
            ratingStars.forEach((s, i) => {
                s.className = i < selectedRating ? 'fas fa-star' : 'far fa-star';
            });
        });
    });
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        if (selectedRating === 0) {
            showNotification('Please select a rating');
            return;
        }
        
        const formData = new FormData(form);
        const reviewData = {
            rating: selectedRating,
            comment: formData.get('comment'),
            title: formData.get('title'),
            name: formData.get('name') || 'Anonymous'
        };
        
        submitReview(reviewData);
        form.reset();
        selectedRating = 0;
        
        // Reset stars
        ratingStars.forEach(s => s.className = 'far fa-star');
    });
}

function submitReview(reviewData) {
    // Here you would send to your backend
    console.log('Submitting review:', reviewData);
    showNotification('Thank you for your review! It will be visible after approval.');
}

// ===== SHARE FUNCTIONALITY =====
function initShareButtons() {
    const shareBtn = document.querySelector('.share-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', shareProduct);
    }
    
    // Social share buttons
    document.querySelectorAll('.social-share').forEach(btn => {
        btn.addEventListener('click', () => {
            const platform = btn.dataset.platform;
            shareOnPlatform(platform);
        });
    });
}

function shareProduct() {
    const url = window.location.href;
    const title = currentProduct?.name || document.title;
    const text = `Check out this product: ${title}`;
    
    if (navigator.share) {
        navigator.share({
            title: title,
            text: text,
            url: url
        });
    } else {
        // Fallback to copying to clipboard
        navigator.clipboard.writeText(url).then(() => {
            showNotification('Link copied to clipboard!');
        });
    }
}

function shareOnPlatform(platform) {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(currentProduct?.name || 'Check out this product');
    
    const shareUrls = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
        twitter: `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
        whatsapp: `https://wa.me/?text=${title}%20${url}`,
        pinterest: `https://pinterest.com/pin/create/button/?url=${url}&description=${title}`
    };
    
    if (shareUrls[platform]) {
        window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
}

// ===== RECENTLY VIEWED =====
function saveToRecentlyViewed() {
    try {
        let recentlyViewed = JSON.parse(localStorage.getItem(CONFIG.RECENTLY_VIEWED_KEY) || '[]');
        
        // Remove if already exists
        recentlyViewed = recentlyViewed.filter(item => item.id !== currentProduct.id);
        
        // Add to beginning
        recentlyViewed.unshift({
            id: currentProduct.id,
            name: currentProduct.name,
            price: currentProduct.price,
            image: currentProduct.images[0],
            category: currentProduct.category,
            viewedAt: new Date().toISOString()
        });
        
        // Keep only last 10 items
        recentlyViewed = recentlyViewed.slice(0, 10);
        
        localStorage.setItem(CONFIG.RECENTLY_VIEWED_KEY, JSON.stringify(recentlyViewed));
    } catch (e) {
        console.error('Error saving to recently viewed:', e);
    }
}

// ===== NOTIFICATIONS =====
function showNotification(message, type = 'success') {
    // Remove existing notification
    const existing = document.querySelector('.notification-toast');
    if (existing) {
        existing.remove();
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification-toast ${type}`;
    notification.innerHTML = `
        <div class="toast-content">
            <i class="toast-icon ${type === 'success' ? 'fas fa-check-circle' : 'fas fa-info-circle'}"></i>
            <span class="toast-message">${message}</span>
        </div>
        <button class="toast-close">&times;</button>
    `;
    
    // Add styles if not already added
    addNotificationStyles();
    
    document.body.appendChild(notification);
    
    // Show with animation
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Close button
    notification.querySelector('.toast-close').addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    });
    
    // Auto remove
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }
    }, CONFIG.NOTIFICATION_TIMEOUT);
}

function addNotificationStyles() {
    if (document.getElementById('notification-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        .notification-toast {
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            color: #333;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            display: flex;
            align-items: center;
            gap: 12px;
            z-index: 10000;
            transform: translateX(120%);
            transition: transform 0.3s ease;
            max-width: 350px;
            border-left: 4px solid #4CAF50;
        }
        
        .notification-toast.show {
            transform: translateX(0);
        }
        
        .notification-toast.success {
            border-left-color: #4CAF50;
        }
        
        .notification-toast.info {
            border-left-color: #2196F3;
        }
        
        .notification-toast.error {
            border-left-color: #f44336;
        }
        
        .toast-content {
            display: flex;
            align-items: center;
            gap: 10px;
            flex: 1;
        }
        
        .toast-icon {
            font-size: 20px;
        }
        
        .success .toast-icon {
            color: #4CAF50;
        }
        
        .info .toast-icon {
            color: #2196F3;
        }
        
        .toast-close {
            background: none;
            border: none;
            font-size: 20px;
            cursor: pointer;
            color: #666;
            padding: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
    `;
    document.head.appendChild(style);
}

// ===== GLOBAL FUNCTIONS =====
window.updateCartQuantity = function(index, change) {
    cart[index].quantity += change;
    
    if (cart[index].quantity < 1) {
        cart.splice(index, 1);
    }
    
    saveCartToStorage();
    updateCartUI();
    renderCartItems();
};

window.removeFromCart = function(index) {
    const item = cart[index];
    cart.splice(index, 1);
    saveCartToStorage();
    updateCartUI();
    renderCartItems();
    showNotification(`${item.name} removed from cart`);
};

window.updateQuantity = function(index, change) {
    // This is for product page quantity
    if (quantitySelect) {
        const current = parseInt(quantitySelect.value);
        const newValue = Math.max(1, current + change);
        quantitySelect.value = newValue;
        selectedQuantity = newValue;
        updatePriceDisplay();
    }
};

// ===== PRODUCT ACTIONS =====
function initProductActions() {
    // Compare button
    const compareBtn = document.querySelector('.compare-btn');
    if (compareBtn) {
        compareBtn.addEventListener('click', addToComparison);
    }
    
    // Ask question button
    const questionBtn = document.querySelector('.question-btn');
    if (questionBtn) {
        questionBtn.addEventListener('click', openQuestionModal);
    }
}

function addToComparison() {
    const compareList = JSON.parse(localStorage.getItem('aabhira_compare') || '[]');
    
    if (compareList.some(item => item.id === currentProduct.id)) {
        showNotification('Already in comparison list');
        return;
    }
    
    if (compareList.length >= 4) {
        showNotification('Maximum 4 products can be compared', 'info');
        return;
    }
    
    compareList.push({
        id: currentProduct.id,
        name: currentProduct.name,
        price: currentProduct.price,
        image: currentProduct.images[0],
        specs: currentProduct.specifications
    });
    
    localStorage.setItem('aabhira_compare', JSON.stringify(compareList));
    showNotification('Added to comparison list');
}

function openQuestionModal() {
    // Create modal for asking question
    const modal = document.createElement('div');
    modal.className = 'question-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Ask a Question</h3>
            <textarea placeholder="Type your question about this product..." rows="4"></textarea>
            <div class="modal-buttons">
                <button class="btn-cancel">Cancel</button>
                <button class="btn-submit">Submit Question</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .question-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        }
        
        .modal-content {
            background: white;
            padding: 30px;
            border-radius: 10px;
            max-width: 500px;
            width: 90%;
        }
        
        .modal-content h3 {
            margin-bottom: 15px;
        }
        
        .modal-content textarea {
            width: 100%;
            padding: 10px;
            margin-bottom: 20px;
            border: 1px solid #ddd;
            border-radius: 5px;
            resize: vertical;
        }
        
        .modal-buttons {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
        }
        
        .btn-cancel, .btn-submit {
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        }
        
        .btn-cancel {
            background: #f0f0f0;
        }
        
        .btn-submit {
            background: #ff3f8e;
            color: white;
        }
    `;
    document.head.appendChild(style);
    
    // Event listeners
    modal.querySelector('.btn-cancel').addEventListener('click', () => modal.remove());
    modal.querySelector('.btn-submit').addEventListener('click', () => {
        const question = modal.querySelector('textarea').value.trim();
        if (question) {
            submitQuestion(question);
            modal.remove();
        } else {
            showNotification('Please enter a question', 'info');
        }
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

function submitQuestion(question) {
    // Submit question to backend
    console.log('Question submitted:', question);
    showNotification('Question submitted! We\'ll respond within 24 hours.');
}

// ===== PAGE VISIBILITY =====
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        // Page became visible again
        updateCartUI();
    }
});



// ===== CART MANAGEMENT SYSTEM =====
class CartSystem {
    constructor() {
        this.cart = this.loadCart();
        this.updateCartCount();
        this.initCart();
    }
    
    // Load cart from localStorage
    loadCart() {
        try {
            const savedCart = localStorage.getItem('aabhira_cart');
            return savedCart ? JSON.parse(savedCart) : [];
        } catch (e) {
            console.error('Error loading cart:', e);
            return [];
        }
    }
    
    // Save cart to localStorage
    saveCart() {
        try {
            localStorage.setItem('aabhira_cart', JSON.stringify(this.cart));
        } catch (e) {
            console.error('Error saving cart:', e);
        }
    }
    
    // Initialize cart functionality
    initCart() {
        this.setupEventListeners();
        this.renderCart();
    }
    
    // Setup event listeners
    setupEventListeners() {
        // Cart open/close
        document.getElementById('bagIcon')?.addEventListener('click', () => this.openCart());
        document.getElementById('closeCart')?.addEventListener('click', () => this.closeCart());
        document.getElementById('continueShopping')?.addEventListener('click', () => this.closeCart());
        document.getElementById('cartOverlay')?.addEventListener('click', () => this.closeCart());
        
        // Checkout button
        document.getElementById('checkoutBtn')?.addEventListener('click', () => this.proceedToCheckout());
        
        // Add to cart buttons
        document.querySelectorAll('.add-to-cart-btn, .btn-add-to-cart').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleAddToCart(e));
        });
        
        // Bundle add button
        document.querySelector('.add-bundle-btn')?.addEventListener('click', () => this.addBundleToCart());
    }
    
    // Open cart drawer
    openCart() {
        document.getElementById('cartOverlay').classList.add('active');
        document.getElementById('cartDrawer').classList.add('active');
        document.body.style.overflow = 'hidden';
        this.renderCart();
    }
    
    // Close cart drawer
    closeCart() {
        document.getElementById('cartOverlay').classList.remove('active');
        document.getElementById('cartDrawer').classList.remove('active');
        document.body.style.overflow = '';
    }
    
    // Update cart count in header
    updateCartCount() {
        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        const cartCount = document.getElementById('cartCount');
        if (cartCount) {
            cartCount.textContent = totalItems;
            cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
        }
    }
    
    // Render cart items
    renderCart() {
        const cartItemsContainer = document.getElementById('cartItems');
        const cartEmpty = document.getElementById('cartEmpty');
        const cartBody = document.getElementById('cartBody');
        const cartTotal = document.getElementById('cartTotal');
        
        if (this.cart.length === 0) {
            cartEmpty.style.display = 'block';
            cartItemsContainer.style.display = 'none';
            cartTotal.textContent = '$0.00';
            return;
        }
        
        cartEmpty.style.display = 'none';
        cartItemsContainer.style.display = 'block';
        
        // Calculate total
        const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cartTotal.textContent = `$${total.toFixed(2)}`;
        
        // Render cart items
        cartItemsContainer.innerHTML = this.cart.map((item, index) => `
            <div class="cart-item">
                <div class="cart-item-image">
                    <img src="${item.image}" alt="${item.name}">
                </div>
                <div class="cart-item-details">
                    <div class="cart-item-header">
                        <h4>${item.name}</h4>
                        <button class="remove-item" data-index="${index}">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <p class="cart-item-brand">${item.brand}</p>
                    <div class="cart-item-price">
                        <span class="current">$${item.price.toFixed(2)}</span>
                        ${item.originalPrice ? `<span class="original">$${item.originalPrice.toFixed(2)}</span>` : ''}
                    </div>
                    <div class="cart-item-quantity">
                        <button class="qty-decrease" data-index="${index}">-</button>
                        <span>${item.quantity}</span>
                        <button class="qty-increase" data-index="${index}">+</button>
                    </div>
                    <div class="cart-item-total">
                        Total: <strong>$${(item.price * item.quantity).toFixed(2)}</strong>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Add event listeners to cart items
        cartItemsContainer.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.closest('.remove-item').dataset.index);
                this.removeItem(index);
            });
        });
        
        cartItemsContainer.querySelectorAll('.qty-decrease').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.closest('.qty-decrease').dataset.index);
                this.updateQuantity(index, -1);
            });
        });
        
        cartItemsContainer.querySelectorAll('.qty-increase').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.closest('.qty-increase').dataset.index);
                this.updateQuantity(index, 1);
            });
        });
    }
    
    // Handle add to cart
    handleAddToCart(e) {
        e.preventDefault();
        
        // Get product data from clicked button
        const button = e.target.closest('.add-to-cart-btn, .btn-add-to-cart');
        const productId = button?.dataset.id || 'prod_001';
        
        // Get product details from page
        const product = this.getProductDetails();
        
        // Add to cart
        this.addItem(product);
        
        // Show notification
        this.showNotification(`${product.name} added to cart!`);
    }
    
    // Get current product details
    getProductDetails() {
        return {
            id: 'prod_001',
            name: document.querySelector('.product-title')?.textContent || 'Smartphone Pro X',
            brand: document.querySelector('.brand-name')?.textContent || 'TechBrand',
            price: parseFloat(document.querySelector('.current-price')?.textContent || '749.99'),
            originalPrice: parseFloat(document.querySelector('.mrp')?.textContent || '999.99'),
            image: document.getElementById('mainProductImage')?.src || 'https://via.placeholder.com/300',
            color: document.querySelector('.selected-color')?.textContent || 'Phantom Black',
            storage: document.querySelector('.storage-option.active')?.dataset.storage || '256GB',
            quantity: parseInt(document.getElementById('quantity')?.value || 1)
        };
    }
    
    // Add item to cart
    addItem(product) {
        // Check if item already exists in cart
        const existingIndex = this.cart.findIndex(item => 
            item.id === product.id && 
            item.color === product.color && 
            item.storage === product.storage
        );
        
        if (existingIndex > -1) {
            // Update quantity if item exists
            this.cart[existingIndex].quantity += product.quantity;
        } else {
            // Add new item to cart
            this.cart.push({
                ...product,
                addedAt: new Date().toISOString()
            });
        }
        
        // Save cart and update UI
        this.saveCart();
        this.updateCartCount();
        this.renderCart();
    }
    
    // Remove item from cart
    removeItem(index) {
        const item = this.cart[index];
        this.cart.splice(index, 1);
        this.saveCart();
        this.updateCartCount();
        this.renderCart();
        this.showNotification(`${item.name} removed from cart`);
    }
    
    // Update item quantity
    updateQuantity(index, change) {
        this.cart[index].quantity += change;
        
        if (this.cart[index].quantity < 1) {
            this.removeItem(index);
            return;
        }
        
        this.saveCart();
        this.updateCartCount();
        this.renderCart();
    }
    
    // Add bundle to cart
    addBundleToCart() {
        const bundleProducts = [
            {
                id: 'prod_001',
                name: 'Smartphone Pro X 256GB',
                price: 749.99,
                image: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=300&auto=format&fit=crop'
            },
            {
                id: 'prod_002',
                name: 'Wireless Earbuds Pro',
                price: 199.99,
                image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&auto=format&fit=crop'
            }
        ];
        
        bundleProducts.forEach(product => {
            this.addItem({
                ...product,
                quantity: 1,
                brand: 'TechBrand'
            });
        });
        
        this.showNotification('Bundle added to cart!');
    }
    
    // Proceed to checkout
    proceedToCheckout() {
        if (this.cart.length === 0) {
            this.showNotification('Your cart is empty!', 'error');
            return;
        }
        
        // In a real app, this would redirect to checkout page
        this.showNotification('Redirecting to checkout...');
        this.closeCart();
        
        // Simulate checkout redirect
        setTimeout(() => {
            console.log('Checkout process started with items:', this.cart);
            // window.location.href = '/checkout.html';
        }, 1000);
    }
    
    // Show notification
    showNotification(message, type = 'success') {
        // Remove existing notification
        const existing = document.querySelector('.notification');
        if (existing) {
            existing.remove();
        }
        
        // Create notification
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        
        // Add styles if not already added
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: white;
                    color: #333;
                    padding: 15px 20px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    z-index: 10000;
                    transform: translateX(120%);
                    transition: transform 0.3s ease;
                    max-width: 300px;
                }
                .notification.show {
                    transform: translateX(0);
                }
                .notification.success {
                    border-left: 4px solid #4CAF50;
                }
                .notification.error {
                    border-left: 4px solid #f44336;
                }
                .notification i {
                    font-size: 20px;
                }
                .notification.success i {
                    color: #4CAF50;
                }
                .notification.error i {
                    color: #f44336;
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Auto remove
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    // Get cart total
    getCartTotal() {
        return this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }
    
    // Clear cart
    clearCart() {
        this.cart = [];
        this.saveCart();
        this.updateCartCount();
        this.renderCart();
    }
}

// Initialize cart system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.cartSystem = new CartSystem();
});

// Export cart functions for global use
window.addToCart = function(product) {
    if (window.cartSystem) {
        window.cartSystem.addItem(product);
    }
};

window.removeFromCart = function(index) {
    if (window.cartSystem) {
        window.cartSystem.removeItem(index);
    }
};

window.openCart = function() {
    if (window.cartSystem) {
        window.cartSystem.openCart();
    }
};

window.closeCart = function() {
    if (window.cartSystem) {
        window.cartSystem.closeCart();
    }
};



// ===== WISHLIST MANAGEMENT SYSTEM =====
class WishlistSystem {
    constructor() {
        this.wishlist = this.loadWishlist();
        this.updateWishlistCount();
        this.initWishlist();
    }
    
    // Load wishlist from localStorage
    loadWishlist() {
        try {
            const savedWishlist = localStorage.getItem('aabhira_wishlist');
            return savedWishlist ? JSON.parse(savedWishlist) : [];
        } catch (e) {
            console.error('Error loading wishlist:', e);
            return [];
        }
    }
    
    // Save wishlist to localStorage
    saveWishlist() {
        try {
            localStorage.setItem('aabhira_wishlist', JSON.stringify(this.wishlist));
        } catch (e) {
            console.error('Error saving wishlist:', e);
        }
    }
    
    // Initialize wishlist functionality
    initWishlist() {
        this.setupEventListeners();
        this.updateWishlistIcon();
    }
    
    // Setup event listeners
    setupEventListeners() {
        // Wishlist button
        document.getElementById('addToWishlist')?.addEventListener('click', () => this.toggleCurrentProduct());
        document.getElementById('wishlistIcon')?.addEventListener('click', () => this.showWishlist());
        
        // Close wishlist modal
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('wishlist-overlay') || 
                e.target.classList.contains('close-wishlist')) {
                this.hideWishlist();
            }
        });
    }
    
    // Update wishlist count in header
    updateWishlistCount() {
        const wishlistCount = document.getElementById('wishlistCount');
        if (wishlistCount) {
            wishlistCount.textContent = this.wishlist.length;
            wishlistCount.style.display = this.wishlist.length > 0 ? 'flex' : 'none';
        }
    }
    
    // Update wishlist icon on product page
    updateWishlistIcon() {
        const wishlistBtn = document.getElementById('addToWishlist');
        if (!wishlistBtn) return;
        
        const product = this.getCurrentProduct();
        const isInWishlist = this.isInWishlist(product.id);
        const icon = wishlistBtn.querySelector('i');
        const text = wishlistBtn.querySelector('span');
        
        if (isInWishlist) {
            icon.className = 'fas fa-heart';
            icon.style.color = '#ff3f8e';
            text.textContent = 'Remove from Wishlist';
        } else {
            icon.className = 'far fa-heart';
            icon.style.color = '';
            text.textContent = 'Add to Wishlist';
        }
    }
    
    // Get current product details
    getCurrentProduct() {
        return {
            id: 'prod_001',
            name: document.querySelector('.product-title')?.textContent || 'Smartphone Pro X',
            brand: document.querySelector('.brand-name')?.textContent || 'TechBrand',
            price: parseFloat(document.querySelector('.current-price')?.textContent || '749.99'),
            image: document.getElementById('mainProductImage')?.src || 'https://via.placeholder.com/300',
            color: document.querySelector('.selected-color')?.textContent || 'Phantom Black',
            addedAt: new Date().toISOString()
        };
    }
    
    // Check if product is in wishlist
    isInWishlist(productId) {
        return this.wishlist.some(item => item.id === productId);
    }
    
    // Toggle current product in wishlist
    toggleCurrentProduct() {
        const product = this.getCurrentProduct();
        
        if (this.isInWishlist(product.id)) {
            this.removeItem(product.id);
            this.showNotification('Removed from wishlist');
        } else {
            this.addItem(product);
            this.showNotification('Added to wishlist!');
        }
        
        this.updateWishlistIcon();
    }
    
    // Add item to wishlist
    addItem(product) {
        if (!this.isInWishlist(product.id)) {
            this.wishlist.push({
                ...product,
                addedAt: new Date().toISOString()
            });
            this.saveWishlist();
            this.updateWishlistCount();
        }
    }
    
    // Remove item from wishlist
    removeItem(productId) {
        const index = this.wishlist.findIndex(item => item.id === productId);
        if (index > -1) {
            this.wishlist.splice(index, 1);
            this.saveWishlist();
            this.updateWishlistCount();
        }
    }
    
    // Show wishlist modal
    showWishlist() {
        this.createWishlistModal();
        this.renderWishlistItems();
    }
    
    // Hide wishlist modal
    hideWishlist() {
        const modal = document.getElementById('wishlistModal');
        const overlay = document.getElementById('wishlistOverlay');
        
        if (modal) modal.remove();
        if (overlay) overlay.remove();
    }
    
    // Create wishlist modal
    createWishlistModal() {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.id = 'wishlistOverlay';
        overlay.className = 'wishlist-overlay';
        
        // Create modal
        const modal = document.createElement('div');
        modal.id = 'wishlistModal';
        modal.className = 'wishlist-modal';
        modal.innerHTML = `
            <div class="wishlist-header">
                <h3>My Wishlist</h3>
                <button class="close-wishlist"><i class="fas fa-times"></i></button>
            </div>
            <div class="wishlist-body" id="wishlistBody">
                <div class="wishlist-empty" id="wishlistEmpty">
                    <i class="far fa-heart"></i>
                    <p>Your wishlist is empty</p>
                    <p>Add products you love to your wishlist</p>
                </div>
                <div class="wishlist-items" id="wishlistItems"></div>
            </div>
            <div class="wishlist-footer">
                <button class="btn btn-primary" id="wishlistCheckout">Move All to Cart</button>
            </div>
        `;
        
        // Add styles
        if (!document.getElementById('wishlist-styles')) {
            const style = document.createElement('style');
            style.id = 'wishlist-styles';
            style.textContent = `
                .wishlist-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.5);
                    z-index: 1000;
                }
                .wishlist-modal {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: white;
                    width: 90%;
                    max-width: 600px;
                    max-height: 80vh;
                    border-radius: 12px;
                    z-index: 1001;
                    display: flex;
                    flex-direction: column;
                }
                .wishlist-header {
                    padding: 20px;
                    border-bottom: 1px solid #e0e0e0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .wishlist-header h3 {
                    margin: 0;
                }
                .close-wishlist {
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    color: #666;
                }
                .wishlist-body {
                    flex: 1;
                    overflow-y: auto;
                    padding: 20px;
                }
                .wishlist-empty {
                    text-align: center;
                    padding: 40px 20px;
                    color: #666;
                }
                .wishlist-empty i {
                    font-size: 48px;
                    margin-bottom: 20px;
                }
                .wishlist-item {
                    display: flex;
                    gap: 15px;
                    padding: 15px;
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    margin-bottom: 10px;
                }
                .wishlist-item-image {
                    width: 80px;
                    height: 80px;
                    border-radius: 8px;
                    overflow: hidden;
                }
                .wishlist-item-image img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .wishlist-item-details {
                    flex: 1;
                }
                .wishlist-item-header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 5px;
                }
                .wishlist-item-header h4 {
                    margin: 0;
                    font-size: 16px;
                }
                .remove-wishlist {
                    background: none;
                    border: none;
                    color: #f44336;
                    cursor: pointer;
                    padding: 5px;
                }
                .wishlist-item-price {
                    font-weight: 600;
                    color: #ff3f8e;
                    margin-bottom: 10px;
                }
                .wishlist-item-actions {
                    display: flex;
                    gap: 10px;
                }
                .wishlist-footer {
                    padding: 20px;
                    border-top: 1px solid #e0e0e0;
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(overlay);
        document.body.appendChild(modal);
        
        // Add event listeners
        modal.querySelector('.close-wishlist').addEventListener('click', () => this.hideWishlist());
        modal.querySelector('#wishlistCheckout').addEventListener('click', () => this.moveAllToCart());
    }
    
    // Render wishlist items
    renderWishlistItems() {
        const wishlistItems = document.getElementById('wishlistItems');
        const wishlistEmpty = document.getElementById('wishlistEmpty');
        
        if (this.wishlist.length === 0) {
            wishlistEmpty.style.display = 'block';
            wishlistItems.style.display = 'none';
            return;
        }
        
        wishlistEmpty.style.display = 'none';
        wishlistItems.style.display = 'block';
        
        wishlistItems.innerHTML = this.wishlist.map((item, index) => `
            <div class="wishlist-item">
                <div class="wishlist-item-image">
                    <img src="${item.image}" alt="${item.name}">
                </div>
                <div class="wishlist-item-details">
                    <div class="wishlist-item-header">
                        <h4>${item.name}</h4>
                        <button class="remove-wishlist" data-index="${index}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    <p class="wishlist-item-brand">${item.brand}</p>
                    <div class="wishlist-item-price">$${item.price.toFixed(2)}</div>
                    <div class="wishlist-item-actions">
                        <button class="btn btn-primary btn-sm move-to-cart" data-index="${index}">
                            <i class="fas fa-cart-plus"></i> Add to Cart
                        </button>
                        <button class="btn btn-outline btn-sm view-product" data-id="${item.id}">
                            <i class="fas fa-eye"></i> View
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Add event listeners
        wishlistItems.querySelectorAll('.remove-wishlist').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.closest('.remove-wishlist').dataset.index);
                this.removeWishlistItem(index);
            });
        });
        
        wishlistItems.querySelectorAll('.move-to-cart').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.closest('.move-to-cart').dataset.index);
                this.moveToCart(index);
            });
        });
        
        wishlistItems.querySelectorAll('.view-product').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.target.closest('.view-product').dataset.id;
                this.viewProduct(productId);
            });
        });
    }
    
    // Remove item from wishlist
    removeWishlistItem(index) {
        const item = this.wishlist[index];
        this.wishlist.splice(index, 1);
        this.saveWishlist();
        this.updateWishlistCount();
        this.renderWishlistItems();
        this.showNotification(`${item.name} removed from wishlist`);
    }
    
    // Move item to cart
    moveToCart(index) {
        const item = this.wishlist[index];
        
        // Add to cart
        if (window.cartSystem) {
            window.cartSystem.addItem({
                ...item,
                quantity: 1
            });
        }
        
        // Remove from wishlist
        this.removeWishlistItem(index);
        this.showNotification(`${item.name} moved to cart`);
    }
    
    // Move all items to cart
    moveAllToCart() {
        if (this.wishlist.length === 0) {
            this.showNotification('Wishlist is empty!', 'error');
            return;
        }
        
        this.wishlist.forEach(item => {
            if (window.cartSystem) {
                window.cartSystem.addItem({
                    ...item,
                    quantity: 1
                });
            }
        });
        
        this.wishlist = [];
        this.saveWishlist();
        this.updateWishlistCount();
        this.renderWishlistItems();
        this.showNotification('All items moved to cart');
    }
    
    // View product
    viewProduct(productId) {
        // In a real app, this would navigate to product page
        console.log('Viewing product:', productId);
        this.hideWishlist();
        // window.location.href = `/product/${productId}`;
    }
    
    // Show notification
    showNotification(message, type = 'success') {
        // Reuse cart notification system or create new one
        if (window.cartSystem) {
            window.cartSystem.showNotification(message, type);
        }
    }
    
    // Clear wishlist
    clearWishlist() {
        this.wishlist = [];
        this.saveWishlist();
        this.updateWishlistCount();
        if (document.getElementById('wishlistItems')) {
            this.renderWishlistItems();
        }
    }
}

// Initialize wishlist system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.wishlistSystem = new WishlistSystem();
});

// Export wishlist functions for global use
window.toggleWishlist = function() {
    if (window.wishlistSystem) {
        window.wishlistSystem.toggleCurrentProduct();
    }
};

window.showWishlist = function() {
    if (window.wishlistSystem) {
        window.wishlistSystem.showWishlist();
    }
};

window.addToWishlist = function(product) {
    if (window.wishlistSystem) {
        window.wishlistSystem.addItem(product);
    }
};



// ===== MAIN PRODUCT PAGE FUNCTIONALITY =====
document.addEventListener('DOMContentLoaded', function() {
    initProductPage();
});

function initProductPage() {
    console.log('Initializing product page...');
    
    // Initialize all product functionalities
    initImageGallery();
    initVariantSelectors();
    initQuantitySelector();
    initTabs();
    initProductActions();
    initRelatedProducts();
    initFAQ();
    initBackToTop();
    initLiveChat();
    initProductAlerts();
    initDeliveryInfo();
    initShareFunctionality();
}

// ===== IMAGE GALLERY =====
function initImageGallery() {
    const mainImage = document.getElementById('mainProductImage');
    const thumbs = document.querySelectorAll('.thumb');
    const prevBtn = document.querySelector('.thumbnail-nav.prev');
    const nextBtn = document.querySelector('.thumbnail-nav.next');
    
    if (!mainImage || thumbs.length === 0) return;
    
    // Thumbnail click event
    thumbs.forEach(thumb => {
        thumb.addEventListener('click', function() {
            // Remove active class from all thumbs
            thumbs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked thumb
            this.classList.add('active');
            
            // Get image source
            const img = this.querySelector('img');
            if (img) {
                mainImage.src = img.src;
                
                // Add fade effect
                mainImage.style.opacity = '0';
                setTimeout(() => {
                    mainImage.style.opacity = '1';
                }, 200);
            }
        });
    });
    
    // Navigation buttons
    prevBtn?.addEventListener('click', function() {
        const activeThumb = document.querySelector('.thumb.active');
        const prevThumb = activeThumb?.previousElementSibling;
        
        if (prevThumb && prevThumb.classList.contains('thumb')) {
            prevThumb.click();
        }
    });
    
    nextBtn?.addEventListener('click', function() {
        const activeThumb = document.querySelector('.thumb.active');
        const nextThumb = activeThumb?.nextElementSibling;
        
        if (nextThumb && nextThumb.classList.contains('thumb')) {
            nextThumb.click();
        }
    });
    
    // Image zoom functionality
    initImageZoom();
}

function initImageZoom() {
    const mainImage = document.getElementById('mainProductImage');
    const imageContainer = mainImage?.parentElement;
    
    if (!mainImage || !imageContainer) return;
    
    // Create zoom lens
    const lens = document.createElement('div');
    lens.className = 'zoom-lens';
    imageContainer.appendChild(lens);
    
    // Create zoom result
    const zoomResult = document.createElement('div');
    zoomResult.className = 'zoom-result';
    document.body.appendChild(zoomResult);
    
    // Add styles for zoom
    const style = document.createElement('style');
    style.textContent = `
        .zoom-lens {
            position: absolute;
            border: 2px solid #ff3f8e;
            background: rgba(255, 63, 142, 0.1);
            cursor: none;
            display: none;
            z-index: 10;
        }
        .zoom-result {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        }
        .zoom-result img {
            max-width: 90%;
            max-height: 90%;
            transform: scale(2);
        }
    `;
    document.head.appendChild(style);
    
    // Mouse move event for zoom
    imageContainer.addEventListener('mousemove', function(e) {
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Calculate lens position
        const lensSize = 100;
        const lensX = Math.max(0, Math.min(x - lensSize/2, rect.width - lensSize));
        const lensY = Math.max(0, Math.min(y - lensSize/2, rect.height - lensSize));
        
        // Position lens
        lens.style.left = lensX + 'px';
        lens.style.top = lensY + 'px';
        lens.style.width = lensSize + 'px';
        lens.style.height = lensSize + 'px';
        
        // Calculate zoom
        const zoomX = (lensX / rect.width) * 100;
        const zoomY = (lensY / rect.height) * 100;
        
        zoomResult.innerHTML = `<img src="${mainImage.src}" style="transform-origin: ${zoomX}% ${zoomY}%;">`;
    });
    
    // Show/hide zoom
    imageContainer.addEventListener('mouseenter', function() {
        lens.style.display = 'block';
    });
    
    imageContainer.addEventListener('mouseleave', function() {
        lens.style.display = 'none';
        zoomResult.style.display = 'none';
    });
    
    imageContainer.addEventListener('click', function() {
        zoomResult.style.display = 'flex';
    });
    
    // Close zoom on click
    zoomResult.addEventListener('click', function() {
        this.style.display = 'none';
    });
}

// ===== VARIANT SELECTORS =====
function initVariantSelectors() {
    // Color selection
    const colorOptions = document.querySelectorAll('.color-option');
    colorOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove active class from all color options
            colorOptions.forEach(o => o.classList.remove('active'));
            
            // Add active class to clicked option
            this.classList.add('active');
            
            // Update selected color text
            const colorName = this.querySelector('.color-name').textContent;
            document.querySelector('.selected-color').textContent = colorName;
            
            // Get image index from data attribute
            const imageIndex = this.dataset.image;
            updateProductImage(imageIndex);
        });
    });
    
    // Storage selection
    const storageOptions = document.querySelectorAll('.storage-option');
    storageOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove active class from all storage options
            storageOptions.forEach(o => o.classList.remove('active'));
            
            // Add active class to clicked option
            this.classList.add('active');
            
            // Update price if available
            const storagePrice = this.querySelector('.storage-price').textContent;
            const priceElement = document.querySelector('.current-price');
            if (priceElement && storagePrice !== priceElement.textContent) {
                priceElement.textContent = storagePrice;
                updateTotalPrice();
            }
        });
    });
}

function updateProductImage(imageIndex) {
    const mainImage = document.getElementById('mainProductImage');
    const thumbnails = document.querySelectorAll('.thumb img');
    
    if (mainImage && thumbnails[imageIndex - 1]) {
        mainImage.src = thumbnails[imageIndex - 1].src;
    }
}

// ===== QUANTITY SELECTOR =====
function initQuantitySelector() {
    const minusBtn = document.querySelector('.qty-btn.minus');
    const plusBtn = document.querySelector('.qty-btn.plus');
    const quantityInput = document.getElementById('quantity');
    
    if (!minusBtn || !plusBtn || !quantityInput) return;
    
    minusBtn.addEventListener('click', function() {
        let value = parseInt(quantityInput.value);
        if (value > 1) {
            quantityInput.value = value - 1;
            updateTotalPrice();
        }
    });
    
    plusBtn.addEventListener('click', function() {
        let value = parseInt(quantityInput.value);
        if (value < 10) {
            quantityInput.value = value + 1;
            updateTotalPrice();
        }
    });
    
    quantityInput.addEventListener('change', function() {
        let value = parseInt(this.value);
        if (value < 1) this.value = 1;
        if (value > 10) this.value = 10;
        updateTotalPrice();
    });
}

function updateTotalPrice() {
    const priceElement = document.querySelector('.current-price');
    const quantityInput = document.getElementById('quantity');
    const totalPriceElement = document.querySelector('.total-amount');
    
    if (priceElement && quantityInput && totalPriceElement) {
        const price = parseFloat(priceElement.textContent.replace('$', ''));
        const quantity = parseInt(quantityInput.value);
        const total = price * quantity;
        totalPriceElement.textContent = `$${total.toFixed(2)}`;
    }
}

// ===== TABS =====
function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            
            // Remove active class from all tabs
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            document.getElementById(tabId)?.classList.add('active');
            
            // Smooth scroll to tab content
            document.querySelector('.product-tabs').scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
}

// ===== PRODUCT ACTIONS =====
function initProductActions() {
    // Compare button
    const compareBtn = document.querySelector('.btn-compare');
    compareBtn?.addEventListener('click', function() {
        const select = document.querySelector('.compare-select');
        const selectedProduct = select.value;
        
        if (selectedProduct && selectedProduct !== 'Select product to compare') {
            // In a real app, this would open comparison modal
            console.log('Comparing with:', selectedProduct);
            alert(`Comparing current product with ${selectedProduct}`);
        }
    });
    
    // Write review button
    const writeReviewBtn = document.querySelector('.write-review-btn');
    writeReviewBtn?.addEventListener('click', function() {
        openReviewModal();
    });
    
    // Load more reviews
    const loadMoreBtn = document.querySelector('.load-more-reviews');
    loadMoreBtn?.addEventListener('click', function() {
        loadMoreReviews();
    });
}

// ===== RELATED PRODUCTS =====
function initRelatedProducts() {
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    const slider = document.querySelector('.products-slider');
    
    if (!prevBtn || !nextBtn || !slider) return;
    
    let scrollPosition = 0;
    const scrollAmount = 300;
    
    prevBtn.addEventListener('click', function() {
        scrollPosition = Math.max(0, scrollPosition - scrollAmount);
        slider.scrollTo({
            left: scrollPosition,
            behavior: 'smooth'
        });
    });
    
    nextBtn.addEventListener('click', function() {
        const maxScroll = slider.scrollWidth - slider.clientWidth;
        scrollPosition = Math.min(maxScroll, scrollPosition + scrollAmount);
        slider.scrollTo({
            left: scrollPosition,
            behavior: 'smooth'
        });
    });
    
    // Add to cart from related products
    document.querySelectorAll('.btn-add-to-cart').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const productId = this.dataset.id;
            addRelatedProductToCart(productId);
        });
    });
    
    // Quick view
    document.querySelectorAll('.quick-view-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const productId = this.dataset.id;
            openQuickView(productId);
        });
    });
}

function addRelatedProductToCart(productId) {
    // Get product data based on ID
    const product = getRelatedProductData(productId);
    
    if (product && window.cartSystem) {
        window.cartSystem.addItem(product);
    }
}

function getRelatedProductData(productId) {
    const products = {
        '2': {
            id: 'prod_002',
            name: 'Wireless Earbuds Pro',
            brand: 'AudioTech',
            price: 199.99,
            image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&auto=format&fit=crop'
        },
        '3': {
            id: 'prod_003',
            name: 'Smart Watch Series 8',
            brand: 'TechBrand',
            price: 399.99,
            image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&auto=format&fit=crop'
        },
        '4': {
            id: 'prod_004',
            name: 'Tablet Pro 12.9"',
            brand: 'TechBrand',
            price: 1099.99,
            image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=300&auto=format&fit=crop'
        },
        '5': {
            id: 'prod_005',
            name: 'Laptop UltraBook',
            brand: 'Computex',
            price: 1299.99,
            image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=300&auto=format&fit=crop'
        }
    };
    
    return products[productId];
}

function openQuickView(productId) {
    // In a real app, this would open a quick view modal
    console.log('Quick view for product:', productId);
}

// ===== FAQ =====
function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', function() {
            // Toggle active class
            item.classList.toggle('active');
            
            // Rotate chevron icon
            const icon = this.querySelector('i');
            icon.style.transform = item.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0)';
        });
    });
}

// ===== BACK TO TOP =====
function initBackToTop() {
    const backToTopBtn = document.getElementById('backToTop');
    
    if (!backToTopBtn) return;
    
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            backToTopBtn.style.display = 'flex';
        } else {
            backToTopBtn.style.display = 'none';
        }
    });
    
    backToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// ===== LIVE CHAT =====
function initLiveChat() {
    const chatBtn = document.getElementById('liveChatBtn');
    
    chatBtn?.addEventListener('click', function() {
        // In a real app, this would open live chat
        console.log('Opening live chat...');
        alert('Live chat feature coming soon!');
    });
}

// ===== PRODUCT ALERTS =====
function initProductAlerts() {
    const closeAlertBtn = document.querySelector('.close-alert');
    
    closeAlertBtn?.addEventListener('click', function() {
        const alert = this.closest('.product-alert');
        if (alert) {
            alert.style.display = 'none';
        }
    });
}

// ===== DELIVERY INFO =====
function initDeliveryInfo() {
    const changeLocationBtn = document.querySelector('.change-location');
    
    changeLocationBtn?.addEventListener('click', function(e) {
        e.preventDefault();
        // In a real app, this would open location modal
        console.log('Changing delivery location...');
        alert('Location change feature coming soon!');
    });
}

// ===== SHARE FUNCTIONALITY =====
function initShareFunctionality() {
    const shareBtns = document.querySelectorAll('.share-btn, .social-share a');
    
    shareBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (this.classList.contains('link-copy')) {
                copyProductLink();
                return;
            }
            
            const platform = this.classList.contains('facebook') ? 'facebook' :
                           this.classList.contains('twitter') ? 'twitter' :
                           this.classList.contains('pinterest') ? 'pinterest' :
                           this.classList.contains('whatsapp') ? 'whatsapp' : 'share';
            
            shareProduct(platform);
        });
    });
}

function copyProductLink() {
    const url = window.location.href;
    
    navigator.clipboard.writeText(url).then(() => {
        // Show success message
        if (window.cartSystem) {
            window.cartSystem.showNotification('Link copied to clipboard!');
        }
    }).catch(err => {
        console.error('Failed to copy link:', err);
    });
}

function shareProduct(platform) {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title);
    const text = encodeURIComponent('Check out this amazing product!');
    
    const shareUrls = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
        twitter: `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
        pinterest: `https://pinterest.com/pin/create/button/?url=${url}&description=${title}`,
        whatsapp: `https://wa.me/?text=${title}%20${url}`
    };
    
    if (shareUrls[platform]) {
        window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    } else if (navigator.share) {
        // Use Web Share API if available
        navigator.share({
            title: document.title,
            text: 'Check out this product',
            url: window.location.href
        });
    }
}

// ===== REVIEW MODAL =====
function openReviewModal() {
    // Create review modal
    const modal = document.createElement('div');
    modal.className = 'review-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Write a Review</h3>
                <button class="close-modal"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
                <div class="rating-input">
                    <label>Your Rating:</label>
                    <div class="rating-stars-input">
                        <i class="far fa-star" data-rating="1"></i>
                        <i class="far fa-star" data-rating="2"></i>
                        <i class="far fa-star" data-rating="3"></i>
                        <i class="far fa-star" data-rating="4"></i>
                        <i class="far fa-star" data-rating="5"></i>
                    </div>
                    <span class="rating-text">Click to rate</span>
                </div>
                <div class="form-group">
                    <label>Review Title</label>
                    <input type="text" id="reviewTitle" placeholder="Summarize your experience">
                </div>
                <div class="form-group">
                    <label>Your Review</label>
                    <textarea id="reviewContent" rows="5" placeholder="Share details of your experience with this product"></textarea>
                </div>
                <div class="form-group">
                    <label>Upload Photos (Optional)</label>
                    <div class="image-upload">
                        <input type="file" id="reviewImages" multiple accept="image/*" style="display: none;">
                        <button class="btn-upload">
                            <i class="fas fa-camera"></i> Add Photos
                        </button>
                        <div class="image-preview"></div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-outline cancel-review">Cancel</button>
                <button class="btn btn-primary submit-review">Submit Review</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .review-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        }
        .review-modal .modal-content {
            background: white;
            border-radius: 12px;
            width: 90%;
            max-width: 500px;
            max-height: 90vh;
            overflow-y: auto;
        }
        .modal-header {
            padding: 20px;
            border-bottom: 1px solid #e0e0e0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .close-modal {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #666;
        }
        .modal-body {
            padding: 20px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
        }
        .form-group input,
        .form-group textarea {
            width: 100%;
            padding: 10px;
            border: 1px solid #e0e0e0;
            border-radius: 6px;
        }
        .rating-stars-input {
            display: flex;
            gap: 5px;
            font-size: 24px;
            color: #ffc107;
            cursor: pointer;
        }
        .rating-stars-input i.active {
            color: #ffc107;
        }
        .modal-footer {
            padding: 20px;
            border-top: 1px solid #e0e0e0;
            display: flex;
            gap: 10px;
            justify-content: flex-end;
        }
    `;
    document.head.appendChild(style);
    
    // Add event listeners
    modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());
    modal.querySelector('.cancel-review').addEventListener('click', () => modal.remove());
    
    // Star rating
    const stars = modal.querySelectorAll('.rating-stars-input i');
    let selectedRating = 0;
    
    stars.forEach(star => {
        star.addEventListener('mouseenter', function() {
            const rating = parseInt(this.dataset.rating);
            stars.forEach((s, index) => {
                s.className = index < rating ? 'fas fa-star' : 'far fa-star';
            });
        });
        
        star.addEventListener('mouseleave', function() {
            stars.forEach((s, index) => {
                s.className = index < selectedRating ? 'fas fa-star' : 'far fa-star';
            });
        });
        
        star.addEventListener('click', function() {
            selectedRating = parseInt(this.dataset.rating);
            stars.forEach((s, index) => {
                s.className = index < selectedRating ? 'fas fa-star' : 'far fa-star';
            });
        });
    });
    
    // Image upload
    const uploadBtn = modal.querySelector('.btn-upload');
    const fileInput = modal.querySelector('#reviewImages');
    const previewContainer = modal.querySelector('.image-preview');
    
    uploadBtn.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', function(e) {
        const files = Array.from(e.target.files);
        previewContainer.innerHTML = '';
        
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.style.width = '80px';
                img.style.height = '80px';
                img.style.objectFit = 'cover';
                img.style.margin = '5px';
                img.style.borderRadius = '6px';
                previewContainer.appendChild(img);
            };
            reader.readAsDataURL(file);
        });
    });
    
    // Submit review
    modal.querySelector('.submit-review').addEventListener('click', function() {
        const title = modal.querySelector('#reviewTitle').value.trim();
        const content = modal.querySelector('#reviewContent').value.trim();
        
        if (selectedRating === 0) {
            alert('Please select a rating');
            return;
        }
        
        if (!content) {
            alert('Please write your review');
            return;
        }
        
        // Submit review (in real app, this would send to backend)
        console.log('Review submitted:', { rating: selectedRating, title, content });
        
        if (window.cartSystem) {
            window.cartSystem.showNotification('Review submitted successfully!');
        }
        
        modal.remove();
    });
}

// ===== LOAD MORE REVIEWS =====
function loadMoreReviews() {
    // In a real app, this would load more reviews from server
    console.log('Loading more reviews...');
    
    // Simulate loading
    const loadMoreBtn = document.querySelector('.load-more-reviews');
    loadMoreBtn.textContent = 'Loading...';
    loadMoreBtn.disabled = true;
    
    setTimeout(() => {
        // Add more review cards
        const reviewCards = document.querySelector('.review-cards');
        if (reviewCards) {
            const newReview = document.createElement('div');
            newReview.className = 'review-card';
            newReview.innerHTML = `
                <div class="review-header">
                    <div class="reviewer-info">
                        <img src="https://i.pravatar.cc/40?img=3" alt="John Doe" class="reviewer-avatar">
                        <div>
                            <div class="reviewer-name">John Doe</div>
                            <div class="review-verified"><i class="fas fa-check-circle"></i> Verified Purchase</div>
                        </div>
                    </div>
                    <div class="review-meta">
                        <div class="review-stars">
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                        </div>
                        <div class="review-date">Today</div>
                    </div>
                </div>
                <h4 class="review-title">Amazing Product!</h4>
                <p class="review-content">This is an additional review loaded dynamically. The phone is fantastic!</p>
            `;
            reviewCards.appendChild(newReview);
        }
        
        loadMoreBtn.textContent = 'Load More Reviews';
        loadMoreBtn.disabled = false;
    }, 1000);
}

