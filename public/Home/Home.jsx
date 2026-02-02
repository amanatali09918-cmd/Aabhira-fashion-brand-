// ===== CONFIGURATION =====
const CONFIG = {
    SLIDE_INTERVAL: 5000,
    NOTIFICATION_TIMEOUT: 3000,
    CART_KEY: 'aabhira_cart',
    WISHLIST_KEY: 'aabhira_wishlist'
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

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('AABHIRA FASHION - Homepage Loaded');
    
    initHeroSlider();
    initCart();
    initChat();
    initWishlist();
    initCategoryCards();
    initAccountDropdown();
    initSearch();
    
    // Load saved data
    loadCartFromStorage();
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

function nextSlide() {
    const slides = document.querySelectorAll('.hero-slide');
    if (!slides.length) return;
    
    slides[currentSlide].classList.remove('active');
    currentSlide = (currentSlide + 1) % slides.length;
    slides[currentSlide].classList.add('active');
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

function saveCartToStorage() {
    try {
        localStorage.setItem(CONFIG.CART_KEY, JSON.stringify(cart));
    } catch (e) {
        console.error('Error saving cart:', e);
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

function addToCart(product) {
    const existingIndex = cart.findIndex(item => 
        item.id === product.id && item.size === product.size
    );
    
    if (existingIndex > -1) {
        cart[existingIndex].quantity += product.quantity;
    } else {
        cart.push({...product});
    }
    
    saveCartToStorage();
    updateCartUI();
    showNotification(`${product.name} added to cart!`);
    
    if (!isCartOpen) {
        openCart();
    }
}

function removeFromCart(index) {
    const item = cart[index];
    cart.splice(index, 1);
    saveCartToStorage();
    updateCartUI();
    showNotification(`${item.name} removed from cart`);
}

function updateQuantity(index, change) {
    cart[index].quantity += change;
    
    if (cart[index].quantity < 1) {
        removeFromCart(index);
        return;
    }
    
    saveCartToStorage();
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

// ===== UTILITY FUNCTIONS =====
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

// ===== GLOBAL FUNCTIONS =====
window.nextSlide = nextSlide;
window.openCart = openCart;
window.closeCart = closeCart;
window.toggleChat = toggleChat;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateQuantity = updateQuantity;
window.showNotification = showNotification;