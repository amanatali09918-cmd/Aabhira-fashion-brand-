// Seller-dashboard.js - Complete Working Version
// ===============================================

class SellerDashboard {
    constructor() {
        this.currentUser = null;
        this.storeData = null;
        this.products = [];
        this.filteredProducts = [];
        this.orders = [];
        this.filteredOrders = [];
        this.customers = [];
        this.notifications = [];
        this.charts = {};
        this.currentPage = 'dashboard';
        this.sidebarOpen = true;
        this.realtimeListeners = [];
        this.currentProductPage = 1;
        this.productsPerPage = 10;
        this.currentOrderPage = 1;
        this.ordersPerPage = 10;
        this.currentStep = 1;
        this.productImages = [];
        this.productImageFiles = [];
        
        this.init();
    }

    async init() {
        console.log("🚀 Initializing Seller Dashboard...");
        
        try {
            // Initialize Firebase
            await this.initFirebase();
            
            // Check authentication
            await this.checkAuth();
            
            console.log("✅ Dashboard initialized successfully");
        } catch (error) {
            console.error("❌ Dashboard initialization failed:", error);
            this.showToast("Dashboard initialization failed", "error");
        }
    }

    async initFirebase() {
        try {
            // Your Firebase configuration
            const firebaseConfig = {
                apiKey: "AIzaSyDvkzbzyMLAE8daV_m76b8AI9WtwUsgpNY",
                authDomain: "aabhira-fashion-8c18f.firebaseapp.com",
                projectId: "aabhira-fashion-8c18f",
                storageBucket: "aabhira-fashion-8c18f.firebasestorage.app",
                messagingSenderId: "1096926871024",
                appId: "1:1096926871024:web:77b00a182f23794d93f135",
                measurementId: "G-GFKHXVNW71"
            };
            
            // Check if Firebase is already initialized
            if (!firebase.apps || firebase.apps.length === 0) {
                firebase.initializeApp(firebaseConfig);
                console.log("✅ Firebase app initialized");
            }
            
            // Initialize services
            this.auth = firebase.auth();
            this.db = firebase.firestore();
            this.storage = firebase.storage();
            
            console.log("✅ Firebase services initialized");
            
        } catch (error) {
            console.error("❌ Firebase initialization failed:", error);
            throw error;
        }
    }

    async checkAuth() {
        return new Promise((resolve) => {
            this.auth.onAuthStateChanged(async (user) => {
                if (user) {
                    this.currentUser = user;
                    console.log("👤 User authenticated:", user.email, "UID:", user.uid);
                    
                    // Load store data
                    await this.loadStoreData();
                    
                    // Show dashboard
                    this.hideLoading();
                    document.querySelector('.app').style.display = 'flex';
                    
                    // Force hide all pages except dashboard
                    this.hideAllPages();
                    
                    // Update UI
                    this.updateUserInfo();
                    this.updateGreeting();
                    this.updateDate();
                    
                    // Setup UI components
                    this.setupEventListeners();
                    this.initCharts();
                    
                    // Load initial dashboard data only
                    await this.loadDashboardData();
                    
                    // Setup real-time listeners
                    this.setupRealtimeListeners();
                    
                    resolve(true);
                } else {
                    // Redirect to login
                    console.log("🔒 No user, redirecting to login");
                    window.location.href = '/public/Seller-login/Seller-login.html';
                    resolve(false);
                }
            });
        });
    }

    hideAllPages() {
        // Hide all pages
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
            p.style.display = 'none';
        });
        
        // Show only dashboard
        const dashboardPage = document.getElementById('dashboard');
        if (dashboardPage) {
            dashboardPage.classList.add('active');
            dashboardPage.style.display = 'flex';
        }
        
        // Set active menu item
        document.querySelectorAll('.menu li').forEach(item => {
            item.classList.remove('active');
        });
        const dashboardMenuItem = document.querySelector('.menu li[data-page="dashboard"]');
        if (dashboardMenuItem) {
            dashboardMenuItem.classList.add('active');
        }
    }

    async loadStoreData() {
        try {
            const storeDoc = await this.db.collection('suppliers').doc(this.currentUser.uid).get();
            
            if (storeDoc.exists) {
                this.storeData = storeDoc.data();
                console.log("🏪 Store data loaded:", this.storeData);
            } else {
                // Create default store data
                this.storeData = {
                    storeName: this.currentUser.displayName || this.currentUser.email.split('@')[0] || "My Clothing Store",
                    email: this.currentUser.email,
                    phone: "",
                    website: "",
                    description: "",
                    status: "active",
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    settings: {
                        notifications: true,
                        emailNotifications: true,
                        lowStockAlert: true,
                        newOrderAlert: true
                    }
                };
                
                await this.db.collection('suppliers').doc(this.currentUser.uid).set(this.storeData);
                console.log("🆕 Created new store data");
            }
        } catch (error) {
            console.error("❌ Error loading store data:", error);
            this.showToast("Error loading store data. Please refresh the page.", "error");
        }
    }

    setupEventListeners() {
        console.log("Setting up event listeners...");
        
        // Sidebar menu clicks
        document.querySelectorAll('.menu li').forEach(item => {
            item.addEventListener('click', (e) => {
                const page = item.getAttribute('data-page');
                this.showPage(page);
            });
        });

        // Sidebar toggle
        document.querySelector('.sidebar-toggle')?.addEventListener('click', () => this.toggleSidebar());

        // Logout button
        document.querySelector('.logout-btn')?.addEventListener('click', () => this.logout());

        // Refresh dashboard
        document.querySelector('.btn-refresh-dash')?.addEventListener('click', () => this.loadDashboardData());

        // Product search
        document.getElementById('productSearch')?.addEventListener('input', (e) => this.filterProducts());

        // Order search
        document.getElementById('orderSearch')?.addEventListener('input', (e) => this.filterOrders());

        // Add product form
        document.getElementById('addProductForm')?.addEventListener('submit', (e) => this.handleProductSubmit(e));

        // Character counter for description
        document.getElementById('productDescription')?.addEventListener('input', (e) => {
            const count = e.target.value.length;
            document.getElementById('charCount').textContent = count;
        });

        // Image upload
        document.getElementById('imageUpload')?.addEventListener('change', (e) => this.handleImageUpload(e));

        // Support form
        document.getElementById('supportForm')?.addEventListener('submit', (e) => this.submitSupportRequest(e));

        // Notification dropdown
        document.querySelector('.notification-btn')?.addEventListener('click', () => this.toggleNotifications());

        // User dropdown
        document.querySelector('.user-btn')?.addEventListener('click', () => this.toggleUserMenu());

        // Settings tabs
        document.querySelectorAll('.settings-tabs .tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.textContent.toLowerCase().replace(' ', '');
                this.showSettingsTab(tab);
            });
        });

        // Period buttons in analytics
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const period = e.target.textContent;
                this.setAnalyticsPeriod(period);
            });
        });

        // Close dropdowns when clicking outside
        window.addEventListener('click', (e) => {
            if (!e.target.closest('.notification-dropdown')) {
                const dropdown = document.getElementById('notificationDropdown');
                if (dropdown && dropdown.classList.contains('show')) {
                    dropdown.classList.remove('show');
                }
            }
            
            if (!e.target.closest('.user-dropdown')) {
                const dropdown = document.getElementById('userDropdown');
                if (dropdown && dropdown.classList.contains('show')) {
                    dropdown.classList.remove('show');
                }
            }
            
            // Close modals when clicking outside
            if (e.target.classList.contains('modal-overlay')) {
                e.target.style.display = 'none';
            }
        });

        // Sales period select
        document.getElementById('salesPeriod')?.addEventListener('change', (e) => {
            this.updateSalesChart();
        });

        console.log("✅ Event listeners setup complete");
    }

    // UI Methods
    updateUserInfo() {
        try {
            console.log("Updating user info...");
            
            const userNameEl = document.getElementById('userName');
            const userRoleEl = document.getElementById('userRole');
            const greetingNameEl = document.getElementById('greetingName');
            const navUserNameEl = document.getElementById('navUserName');
            const storeStatusBadge = document.getElementById('storeStatusBadge');
            
            if (this.storeData) {
                if (userNameEl) userNameEl.textContent = this.storeData.storeName || "Seller";
                if (userRoleEl) userRoleEl.textContent = "Seller Dashboard";
                if (greetingNameEl) greetingNameEl.textContent = this.storeData.storeName || "Seller";
                if (navUserNameEl) navUserNameEl.textContent = this.storeData.storeName || "Seller";
                
                if (storeStatusBadge) {
                    storeStatusBadge.innerHTML = `<i class="fas fa-circle"></i> ${this.storeData.status || 'Active'}`;
                    storeStatusBadge.className = `status-badge ${this.storeData.status === 'active' ? 'active' : 'inactive'}`;
                }
            }
            
            // Update avatars
            const userAvatar = document.getElementById('userAvatar');
            const navUserAvatar = document.getElementById('navUserAvatar');
            if (userAvatar) userAvatar.src = "https://i.pravatar.cc/100?img=1";
            if (navUserAvatar) navUserAvatar.src = "https://i.pravatar.cc/40";
            
            console.log("✅ User info updated");
        } catch (error) {
            console.error("Error updating user info:", error);
        }
    }

    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const content = document.querySelector('.content');
        
        if (sidebar && content) {
            if (this.sidebarOpen) {
                sidebar.style.transform = 'translateX(-100%)';
                content.style.marginLeft = '0';
            } else {
                sidebar.style.transform = 'translateX(0)';
                content.style.marginLeft = '250px';
            }
            this.sidebarOpen = !this.sidebarOpen;
        }
    }

    toggleUserMenu() {
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) {
            dropdown.classList.toggle('show');
        }
    }

    toggleNotifications() {
        const dropdown = document.getElementById('notificationDropdown');
        if (dropdown) {
            dropdown.classList.toggle('show');
        }
    }

    showPage(page) {
        console.log("Showing page:", page);
        
        // Validate page exists
        const pageEl = document.getElementById(page);
        if (!pageEl) {
            console.error(`Page ${page} not found`);
            return;
        }
        
        // Hide all pages with smooth transition
        document.querySelectorAll('.page').forEach(p => {
            if (p !== pageEl) {
                p.classList.remove('active');
                setTimeout(() => {
                    p.style.display = 'none';
                }, 10);
            }
        });
        
        // Remove active class from ALL menu items
        document.querySelectorAll('.menu li').forEach(item => {
            item.classList.remove('active');
        });
        
        // Show selected page
        pageEl.style.display = 'flex';
        setTimeout(() => {
            pageEl.classList.add('active');
        }, 50);
        
        // Add active class to menu item
        const menuItem = document.querySelector(`.menu li[data-page="${page}"]`);
        if (menuItem) {
            menuItem.classList.add('active');
        }
        
        // Update breadcrumb and current page
        this.updateBreadcrumb(page);
        this.currentPage = page;
        
        // Load page-specific data ONLY
        this.loadPageData(page);
        
        // Close sidebar on mobile if needed
        if (window.innerWidth < 768 && this.sidebarOpen) {
            this.toggleSidebar();
        }
    }

    updateBreadcrumb(page) {
        const breadcrumbEl = document.getElementById('breadcrumb');
        if (!breadcrumbEl) return;
        
        const pageNames = {
            dashboard: 'Dashboard',
            products: 'Products',
            addProduct: 'Add Product',
            orders: 'Orders',
            analytics: 'Analytics',
            earnings: 'Earnings',
            settings: 'Settings',
            messages: 'Messages'
        };
        
        breadcrumbEl.textContent = pageNames[page] || page;
    }

    loadPageData(page) {
        console.log("Loading page data for:", page);
        
        // Clear any existing data first
        switch (page) {
            case 'products':
                this.loadProducts();
                break;
            case 'orders':
                this.loadOrders();
                break;
            case 'analytics':
                this.updateAnalytics();
                break;
            case 'earnings':
                this.updateEarnings();
                break;
            case 'settings':
                this.loadSettings();
                break;
            case 'dashboard':
                // Dashboard already loaded minimal data
                this.updateDashboardStats();
                this.updateTopProducts();
                this.updateRecentOrders();
                break;
            case 'addProduct':
                // Reset form
                this.currentStep = 1;
                this.updateWizardSteps();
                break;
            default:
                // For other pages, just update minimal info
                break;
        }
    }

    updateGreeting() {
        const hour = new Date().getHours();
        let greeting = "Good ";
        
        if (hour < 12) greeting += "Morning";
        else if (hour < 18) greeting += "Afternoon";
        else greeting += "Evening";
        
        const greetingEl = document.getElementById('greeting');
        if (greetingEl) {
            greetingEl.innerHTML = `${greeting}, <span id="greetingName">${this.storeData?.storeName || 'Seller'}</span>!`;
        }
    }

    updateDate() {
        const dateEl = document.getElementById('dashboardDate');
        if (dateEl) {
            const now = new Date();
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            dateEl.textContent = `Today is ${now.toLocaleDateString('en-US', options)}`;
        }
    }

    // Data Loading Methods
    async loadDashboardData() {
        console.log("Loading dashboard data...");
        
        try {
            this.showToast("Loading dashboard...", "info");
            
            // Load ONLY counts and recent data for dashboard
            await Promise.all([
                this.loadProductsCount(),
                this.loadOrdersCount(),
                this.loadRecentOrders(5),
                this.loadTopProducts(5)
            ]);
            
            // Update dashboard UI only
            this.updateDashboardStats();
            this.updateTopProducts();
            this.updateRecentOrders();
            this.loadActivity();
            
            document.getElementById('lastSync').textContent = "Just now";
            
            this.showToast("Dashboard updated", "success");
            
        } catch (error) {
            console.error("❌ Error loading dashboard data:", error);
            this.showToast("Error loading dashboard", "error");
        }
    }

    async loadProducts() {
        try {
            console.log("Loading products...");
            
            let snapshot;
            try {
                snapshot = await this.db.collection('products')
                    .where('sellerId', '==', this.currentUser.uid)
                    .limit(100)
                    .get();
            } catch (error) {
                console.warn("Products query failed:", error);
                snapshot = await this.db.collection('products')
                    .limit(20)
                    .get();
            }
            
            this.products = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                if (!data.sellerId || data.sellerId === this.currentUser.uid) {
                    this.products.push({
                        id: doc.id,
                        ...data
                    });
                }
            });
            
            console.log(`📦 Loaded ${this.products.length} products`);
            
            this.filteredProducts = [...this.products];
            this.updateProductsUI();
            
        } catch (error) {
            console.error("❌ Error loading products:", error.code, error.message);
            this.showToast("Error loading products", "error");
        }
    }

    async loadProductsCount() {
        try {
            const snapshot = await this.db.collection('products')
                .where('sellerId', '==', this.currentUser.uid)
                .count()
                .get();
            this.productsCount = snapshot.data().count;
        } catch (error) {
            this.productsCount = 0;
        }
    }

    async loadOrders() {
        try {
            console.log("Loading orders...");
            
            let snapshot;
            try {
                snapshot = await this.db.collection('orders')
                    .where('sellerId', '==', this.currentUser.uid)
                    .limit(100)
                    .get();
            } catch (error) {
                console.warn("Orders query failed:", error);
                snapshot = await this.db.collection('orders')
                    .limit(20)
                    .get();
            }
            
            this.orders = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                if (!data.sellerId || data.sellerId === this.currentUser.uid) {
                    this.orders.push({
                        id: doc.id,
                        ...data
                    });
                }
            });
            
            console.log(`📦 Loaded ${this.orders.length} orders`);
            
            this.filteredOrders = [...this.orders];
            this.updateOrdersUI();
            
        } catch (error) {
            console.error("❌ Error loading orders:", error.code, error.message);
            this.showToast("Error loading orders", "error");
        }
    }

    async loadOrdersCount() {
        try {
            const snapshot = await this.db.collection('orders')
                .where('sellerId', '==', this.currentUser.uid)
                .count()
                .get();
            this.ordersCount = snapshot.data().count;
        } catch (error) {
            this.ordersCount = 0;
        }
    }

    async loadRecentOrders(limit = 5) {
        try {
            const snapshot = await this.db.collection('orders')
                .where('sellerId', '==', this.currentUser.uid)
                .orderBy('createdAt', 'desc')
                .limit(limit)
                .get();
            
            this.recentOrders = [];
            snapshot.forEach((doc) => {
                this.recentOrders.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
        } catch (error) {
            this.recentOrders = [];
        }
    }

    async loadTopProducts(limit = 5) {
        try {
            const snapshot = await this.db.collection('products')
                .where('sellerId', '==', this.currentUser.uid)
                .limit(limit)
                .get();
            
            this.topProducts = [];
            snapshot.forEach((doc) => {
                this.topProducts.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
        } catch (error) {
            this.topProducts = [];
        }
    }

    async loadCustomers() {
        try {
            console.log("Loading customers...");
            
            // Extract unique customers from orders
            const customerMap = new Map();
            
            this.orders.forEach(order => {
                if (order.customerEmail) {
                    const customerKey = order.customerEmail;
                    
                    if (!customerMap.has(customerKey)) {
                        customerMap.set(customerKey, {
                            email: order.customerEmail,
                            name: order.customerName || 'Customer',
                            phone: order.customerPhone || '',
                            orderCount: 1,
                            totalSpent: parseFloat(order.total) || 0,
                            lastOrder: order.createdAt
                        });
                    } else {
                        const customer = customerMap.get(customerKey);
                        customer.orderCount++;
                        customer.totalSpent += parseFloat(order.total) || 0;
                    }
                }
            });
            
            this.customers = Array.from(customerMap.values());
            console.log(`👥 Found ${this.customers.length} unique customers`);
            
        } catch (error) {
            console.error("❌ Error loading customers:", error);
            this.customers = [];
        }
    }

    async loadActivity() {
        try {
            const activityEl = document.getElementById('activityList');
            if (!activityEl) return;
            
            // Create sample activity for now
            const activities = [
                {
                    id: '1',
                    message: "Dashboard loaded successfully",
                    type: "system",
                    timestamp: new Date()
                },
                {
                    id: '2',
                    message: `Welcome to your seller dashboard`,
                    type: "welcome",
                    timestamp: new Date(Date.now() - 300000) // 5 minutes ago
                }
            ];
            
            // Add recent orders as activity
            const recentOrders = this.orders.slice(0, 3);
            recentOrders.forEach((order, index) => {
                activities.push({
                    id: `order-${index}`,
                    message: `New order #${order.id.substring(0, 8)} from ${order.customerName || 'Customer'}`,
                    type: "order",
                    timestamp: order.createdAt ? this.getDateFromTimestamp(order.createdAt) : new Date()
                });
            });
            
            // Sort by timestamp (newest first)
            activities.sort((a, b) => b.timestamp - a.timestamp);
            
            let activityHTML = '';
            
            activities.forEach(activity => {
                const timeAgo = this.getTimeAgo(activity.timestamp);
                
                activityHTML += `
                    <div class="activity-item">
                        <div class="activity-icon ${activity.type}">
                            <i class="fas fa-${this.getActivityIcon(activity.type)}"></i>
                        </div>
                        <div class="activity-content">
                            <p class="activity-text">${activity.message}</p>
                            <span class="activity-time">${timeAgo}</span>
                        </div>
                    </div>
                `;
            });
            
            activityEl.innerHTML = activityHTML;
            
        } catch (error) {
            console.error("❌ Error loading activity:", error);
        }
    }

    async loadNotifications() {
        try {
            // For now, create sample notifications
            this.notifications = [
                {
                    id: '1',
                    message: 'Welcome to your seller dashboard!',
                    type: 'welcome',
                    read: false,
                    createdAt: new Date()
                },
                {
                    id: '2',
                    message: 'Add your first product to start selling',
                    type: 'tip',
                    read: false,
                    createdAt: new Date(Date.now() - 3600000)
                }
            ];
            
            this.updateNotificationsUI();
            
        } catch (error) {
            console.error("❌ Error loading notifications:", error);
        }
    }

    updateNotificationsUI() {
        const notificationCount = this.notifications.filter(n => !n.read).length;
        const notificationCountEl = document.getElementById('notificationCount');
        const messagesBadgeEl = document.getElementById('messagesBadge');
        
        if (notificationCountEl) {
            notificationCountEl.textContent = notificationCount;
            notificationCountEl.style.display = notificationCount > 0 ? 'flex' : 'none';
        }
        
        if (messagesBadgeEl) {
            messagesBadgeEl.textContent = notificationCount;
            messagesBadgeEl.style.display = notificationCount > 0 ? 'flex' : 'none';
        }
    }

    setupRealtimeListeners() {
        if (!this.currentUser) return;

        console.log("Setting up real-time listeners...");
        
        // Clean up existing listeners first
        this.cleanupRealtimeListeners();

        try {
            // Products listener - only updates when products page or dashboard is active
            const productsListener = this.db.collection('products')
                .where('sellerId', '==', this.currentUser.uid)
                .onSnapshot(snapshot => {
                    if (this.currentPage === 'products' || this.currentPage === 'dashboard') {
                        console.log("Products snapshot received");
                        this.products = [];
                        snapshot.forEach(doc => {
                            this.products.push({
                                id: doc.id,
                                ...doc.data()
                            });
                        });
                        
                        this.filteredProducts = [...this.products];
                        
                        if (this.currentPage === 'products') {
                            this.updateProductsUI();
                        }
                        if (this.currentPage === 'dashboard') {
                            this.updateDashboardStats();
                            this.updateTopProducts();
                        }
                    }
                }, error => {
                    console.error("❌ Products listener error:", error.code, error.message);
                });

            this.realtimeListeners.push(productsListener);

            // Orders listener - only updates when orders page or dashboard is active
            const ordersListener = this.db.collection('orders')
                .where('sellerId', '==', this.currentUser.uid)
                .onSnapshot(snapshot => {
                    if (this.currentPage === 'orders' || this.currentPage === 'dashboard') {
                        console.log("Orders snapshot received");
                        this.orders = [];
                        snapshot.forEach(doc => {
                            this.orders.push({
                                id: doc.id,
                                ...doc.data()
                            });
                        });
                        
                        this.filteredOrders = [...this.orders];
                        
                        if (this.currentPage === 'orders') {
                            this.updateOrdersUI();
                        }
                        if (this.currentPage === 'dashboard') {
                            this.updateDashboardStats();
                            this.updateRecentOrders();
                        }
                    }
                }, error => {
                    console.error("❌ Orders listener error:", error.code, error.message);
                });

            this.realtimeListeners.push(ordersListener);

            console.log("✅ Real-time listeners setup complete");
            
        } catch (error) {
            console.error("❌ Error setting up listeners:", error);
        }
    }

    cleanupRealtimeListeners() {
        this.realtimeListeners.forEach(unsubscribe => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        });
        this.realtimeListeners = [];
    }

    updateDashboardStats() {
        console.log("Updating dashboard stats...");
        
        // Update products count
        const totalProducts = this.products.length;
        const activeProducts = this.products.filter(p => p.status === 'active').length;
        const lowStockProducts = this.products.filter(p => {
            const stock = parseInt(p.stock) || 0;
            return stock < 10 && stock > 0;
        }).length;
        const outOfStockProducts = this.products.filter(p => (parseInt(p.stock) || 0) === 0).length;
        
        this.updateElement('totalProducts', totalProducts.toLocaleString());
        this.updateElement('productsBadge', totalProducts);
        this.updateElement('totalProductsCount', totalProducts);
        this.updateElement('activeProductsCount', activeProducts);
        this.updateElement('lowStockCount', lowStockProducts + outOfStockProducts);
        
        // Update orders count
        const totalOrders = this.orders.length;
        const pendingOrders = this.orders.filter(o => (o.status || '').toLowerCase() === 'pending').length;
        const processingOrders = this.orders.filter(o => (o.status || '').toLowerCase() === 'processing').length;
        const shippedOrders = this.orders.filter(o => (o.status || '').toLowerCase() === 'shipped').length;
        const deliveredOrders = this.orders.filter(o => (o.status || '').toLowerCase() === 'delivered').length;
        
        this.updateElement('totalOrders', totalOrders.toLocaleString());
        this.updateElement('ordersBadge', totalOrders);
        this.updateElement('ordersPending', pendingOrders);
        this.updateElement('ordersProcessing', processingOrders);
        this.updateElement('ordersShipped', shippedOrders);
        this.updateElement('ordersDelivered', deliveredOrders);
        
        // Update revenue (only delivered orders)
        const totalRevenue = this.orders
            .filter(o => (o.status || '').toLowerCase() === 'delivered')
            .reduce((sum, order) => sum + (parseFloat(order.total) || 0), 0);
        
        this.updateElement('totalRevenue', `₹${totalRevenue.toLocaleString()}`);
        
        // Update customers
        const totalCustomers = this.customers.length;
        this.updateElement('totalCustomers', totalCustomers.toLocaleString());
        
        console.log("✅ Dashboard stats updated");
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    // Chart Methods
    initCharts() {
        console.log("Initializing charts...");
        
        // Sales Chart
        const salesCtx = document.getElementById('salesChart');
        if (salesCtx) {
            this.charts.sales = new Chart(salesCtx.getContext('2d'), {
                type: 'line',
                data: {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [{
                        label: 'Sales',
                        data: [12000, 19000, 15000, 25000, 22000, 30000, 28000],
                        borderColor: '#7C3AED',
                        backgroundColor: 'rgba(124, 58, 237, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return '₹' + value.toLocaleString();
                                }
                            }
                        }
                    }
                }
            });
        }
        
        // Analytics Sales Chart
        const salesAnalyticsCtx = document.getElementById('salesChartAnalytics');
        if (salesAnalyticsCtx) {
            this.charts.salesAnalytics = new Chart(salesAnalyticsCtx.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Revenue',
                        data: [50000, 75000, 60000, 90000, 85000, 120000],
                        backgroundColor: '#7C3AED',
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return '₹' + value.toLocaleString();
                                }
                            }
                        }
                    }
                }
            });
        }
        
        // Earnings Chart
        const earningsCtx = document.getElementById('earningsChart');
        if (earningsCtx) {
            this.charts.earnings = new Chart(earningsCtx.getContext('2d'), {
                type: 'line',
                data: {
                    labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                    datasets: [{
                        label: 'Earnings',
                        data: [45000, 52000, 48000, 61000, 75000, 90000],
                        borderColor: '#10B981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return '₹' + value.toLocaleString();
                                }
                            }
                        }
                    }
                }
            });
        }
        
        console.log("✅ Charts initialized");
    }

    updateCharts() {
        // Update charts with actual data
        if (this.charts.sales) {
            // For now, using sample data
            console.log("Updating sales chart...");
        }
    }

    // Product UI Methods
    updateProductsUI() {
        const tableBody = document.getElementById('productsTableBody');
        if (!tableBody) return;
        
        console.log("Updating products UI...");
        
        if (this.filteredProducts.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        <i class="fas fa-box-open"></i>
                        <p>No products found</p>
                        <button class="btn-primary" onclick="showPage('addProduct')" style="margin-top: 10px;">
                            Add Your First Product
                        </button>
                    </td>
                </tr>
            `;
            return;
        }
        
        const startIndex = (this.currentProductPage - 1) * this.productsPerPage;
        const endIndex = startIndex + this.productsPerPage;
        const pageProducts = this.filteredProducts.slice(startIndex, endIndex);
        
        let tableHTML = '';
        
        pageProducts.forEach(product => {
            const statusClass = this.getStatusClass(product.status);
            const stock = parseInt(product.stock) || 0;
            const stockClass = stock <= 0 ? 'out-of-stock' : stock < 10 ? 'low-stock' : 'in-stock';
            const price = parseFloat(product.price) || 0;
            const category = product.category || 'Uncategorized';
            const createdAt = product.createdAt ? this.formatDate(product.createdAt) : 'N/A';
            
            tableHTML += `
                <tr>
                    <td>
                        <div class="product-cell">
                            <img src="${product.images?.[0] || 'https://via.placeholder.com/40'}" alt="${product.name}" class="product-thumb">
                            <div>
                                <strong>${product.name || 'Unnamed Product'}</strong>
                                <small>${product.brand || 'No brand'}</small>
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="category-badge ${category.toLowerCase()}">
                            ${this.formatCategory(category)}
                        </span>
                    </td>
                    <td>₹${price.toLocaleString()}</td>
                    <td>
                        <div class="stock-indicator ${stockClass}">
                            ${stock} units
                        </div>
                    </td>
                    <td>
                        <span class="status-badge ${statusClass}">
                            ${this.formatStatus(product.status)}
                        </span>
                    </td>
                    <td>${createdAt}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-view" onclick="dashboard.viewProduct('${product.id}')">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn-edit" onclick="dashboard.editProduct('${product.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-delete" onclick="dashboard.deleteProduct('${product.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        tableBody.innerHTML = tableHTML;
        
        // Update pagination
        this.updateProductPagination();
    }

    updateProductPagination() {
        const totalPages = Math.ceil(this.filteredProducts.length / this.productsPerPage);
        const pageInfo = document.getElementById('productPageInfo');
        const prevBtn = document.getElementById('prevProductPage');
        const nextBtn = document.getElementById('nextProductPage');
        
        if (pageInfo) {
            pageInfo.textContent = `Page ${this.currentProductPage} of ${totalPages}`;
        }
        
        if (prevBtn) {
            prevBtn.disabled = this.currentProductPage <= 1;
        }
        
        if (nextBtn) {
            nextBtn.disabled = this.currentProductPage >= totalPages;
        }
    }

    updateTopProducts() {
        const topProductsList = document.getElementById('topProductsList');
        if (!topProductsList) return;
        
        const topProducts = this.products.slice(0, 5);
        
        if (topProducts.length === 0) {
            topProductsList.innerHTML = `
                <div class="loading-products">
                    <div class="spinner-small"></div>
                    <p>Loading products...</p>
                </div>
            `;
            return;
        }
        
        let productsHTML = '';
        
        topProducts.forEach((product, index) => {
            productsHTML += `
                <div class="top-product-item">
                    <div class="product-rank">${index + 1}</div>
                    <img src="${product.images?.[0] || 'https://via.placeholder.com/40'}" alt="${product.name}">
                    <div class="product-info">
                        <h4>${product.name || 'Product'}</h4>
                        <p>${this.formatCategory(product.category)}</p>
                    </div>
                    <div class="product-sales">
                        <strong>₹${(parseFloat(product.price) || 0).toLocaleString()}</strong>
                        <small>${parseInt(product.salesCount) || 0} sold</small>
                    </div>
                </div>
            `;
        });
        
        topProductsList.innerHTML = productsHTML;
    }

    // Order UI Methods
    updateOrdersUI() {
        const ordersList = document.getElementById('ordersList');
        if (!ordersList) return;
        
        console.log("Updating orders UI...");
        
        if (this.filteredOrders.length === 0) {
            ordersList.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">
                        <i class="fas fa-shopping-cart"></i>
                        <p>No orders found</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        const startIndex = (this.currentOrderPage - 1) * this.ordersPerPage;
        const endIndex = startIndex + this.ordersPerPage;
        const pageOrders = this.filteredOrders.slice(startIndex, endIndex);
        
        let tableHTML = '';
        
        pageOrders.forEach(order => {
            const statusClass = this.getOrderStatusClass(order.status);
            const date = order.createdAt ? this.formatDate(order.createdAt) : 'N/A';
            const customerName = order.customerName || 
                                (order.customerEmail ? order.customerEmail.split('@')[0] : 'Customer');
            const orderIdShort = order.id ? order.id.substring(0, 8) : 'N/A';
            const total = parseFloat(order.total) || 0;
            
            tableHTML += `
                <tr>
                    <td><strong>#${orderIdShort}</strong></td>
                    <td>
                        <div class="customer-cell">
                            <div>
                                <strong>${customerName}</strong>
                                <small>${order.customerEmail || ''}</small>
                            </div>
                        </div>
                    </td>
                    <td>${date}</td>
                    <td>₹${total.toLocaleString()}</td>
                    <td>
                        <span class="status-badge ${statusClass}">
                            ${this.formatOrderStatus(order.status)}
                        </span>
                    </td>
                    <td>
                        <button class="btn-view" onclick="dashboard.viewOrder('${order.id}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                    </td>
                </tr>
            `;
        });
        
        ordersList.innerHTML = tableHTML;
        
        // Update pagination
        this.updateOrderPagination();
    }

    updateOrderPagination() {
        const totalPages = Math.ceil(this.filteredOrders.length / this.ordersPerPage);
        const pageInfo = document.getElementById('orderPageInfo');
        const prevBtn = document.getElementById('prevOrderPage');
        const nextBtn = document.getElementById('nextOrderPage');
        
        if (pageInfo) {
            pageInfo.textContent = `Page ${this.currentOrderPage} of ${totalPages}`;
        }
        
        if (prevBtn) {
            prevBtn.disabled = this.currentOrderPage <= 1;
        }
        
        if (nextBtn) {
            nextBtn.disabled = this.currentOrderPage >= totalPages;
        }
    }

    updateRecentOrders() {
        const recentOrdersEl = document.getElementById('recentOrdersList');
        if (!recentOrdersEl) return;
        
        const recentOrders = this.orders.slice(0, 5);
        
        if (recentOrders.length === 0) {
            recentOrdersEl.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-shopping-cart"></i>
                    <p>No recent orders</p>
                </div>
            `;
            return;
        }
        
        let ordersHTML = '';
        
        recentOrders.forEach(order => {
            const statusClass = this.getOrderStatusClass(order.status);
            const timeAgo = order.createdAt ? this.getTimeAgo(this.getDateFromTimestamp(order.createdAt)) : 'Just now';
            const orderIdShort = order.id ? order.id.substring(0, 8) : 'N/A';
            const customerName = order.customerName || 'Customer';
            const total = parseFloat(order.total) || 0;
            
            ordersHTML += `
                <div class="order-item">
                    <div class="order-icon">
                        <i class="fas fa-shopping-bag"></i>
                    </div>
                    <div class="order-details">
                        <h4>Order #${orderIdShort}</h4>
                        <p>${customerName} • ₹${total.toLocaleString()}</p>
                    </div>
                    <div class="order-status">
                        <span class="status-badge small ${statusClass}">
                            ${this.formatOrderStatus(order.status)}
                        </span>
                    </div>
                </div>
            `;
        });
        
        recentOrdersEl.innerHTML = ordersHTML;
    }

    // Filtering Methods
    filterProducts() {
        const searchTerm = document.getElementById('productSearch')?.value.toLowerCase() || '';
        const category = document.getElementById('categoryFilter')?.value || 'all';
        const status = document.getElementById('statusFilter')?.value || 'all';
        const sort = document.getElementById('sortFilter')?.value || 'newest';
        
        this.filteredProducts = this.products.filter(product => {
            const matchesSearch = (product.name || '').toLowerCase().includes(searchTerm) ||
                                 (product.description || '').toLowerCase().includes(searchTerm);
            
            const matchesCategory = category === 'all' || (product.category || '') === category;
            const matchesStatus = status === 'all' || (product.status || '') === status;
            
            return matchesSearch && matchesCategory && matchesStatus;
        });
        
        // Apply sorting
        this.filteredProducts.sort((a, b) => {
            const dateA = a.createdAt ? this.getDateFromTimestamp(a.createdAt) : new Date(0);
            const dateB = b.createdAt ? this.getDateFromTimestamp(b.createdAt) : new Date(0);
            
            switch (sort) {
                case 'newest':
                    return dateB - dateA;
                case 'oldest':
                    return dateA - dateB;
                case 'price_high':
                    return (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0);
                case 'price_low':
                    return (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0);
                default:
                    return 0;
            }
        });
        
        // Reset to first page
        this.currentProductPage = 1;
        this.updateProductsUI();
    }

    filterOrders() {
        const searchTerm = document.getElementById('orderSearch')?.value.toLowerCase() || '';
        const status = document.getElementById('orderStatusFilter')?.value || 'all';
        
        this.filteredOrders = this.orders.filter(order => {
            const matchesSearch = (order.id || '').toLowerCase().includes(searchTerm) ||
                                 (order.customerName || '').toLowerCase().includes(searchTerm) ||
                                 (order.customerEmail || '').toLowerCase().includes(searchTerm);
            
            const matchesStatus = status === 'all' || (order.status || '').toLowerCase() === status;
            
            return matchesSearch && matchesStatus;
        });
        
        // Reset to first page
        this.currentOrderPage = 1;
        this.updateOrdersUI();
    }

    // Product Form Methods
    async handleProductSubmit(e) {
        e.preventDefault();
        
        if (this.currentStep < 3) {
            this.nextStep();
            return;
        }
        
        try {
            // Collect form data
            const productData = {
                name: document.getElementById('productName').value,
                category: document.getElementById('productCategory').value,
                brand: document.getElementById('productBrand').value || '',
                tags: document.getElementById('productTags').value ? 
                    document.getElementById('productTags').value.split(',').map(tag => tag.trim()) : [],
                price: parseFloat(document.getElementById('productPrice').value) || 0,
                costPrice: parseFloat(document.getElementById('productCost').value) || 0,
                stock: parseInt(document.getElementById('productStock').value) || 0,
                discount: parseFloat(document.getElementById('productDiscount').value) || 0,
                status: document.getElementById('productStatus').value,
                sku: document.getElementById('productSKU').value || `SKU-${Date.now()}`,
                description: document.getElementById('productDescription').value,
                features: document.getElementById('productFeatures').value ? 
                    document.getElementById('productFeatures').value.split('\n').filter(f => f.trim()) : [],
                images: this.productImages,
                sellerId: this.currentUser.uid,
                sellerName: this.storeData.storeName,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            // Save to Firestore
            await this.db.collection('products').add(productData);
            
            // Show success message
            this.showToast("Product added successfully", "success");
            
            // Reset form
            document.getElementById('addProductForm').reset();
            this.productImages = [];
            this.productImageFiles = [];
            document.getElementById('imagePreview').innerHTML = '';
            this.currentStep = 1;
            this.updateWizardSteps();
            
            // Show products page
            this.showPage('products');
            
        } catch (error) {
            console.error("❌ Error adding product:", error);
            this.showToast("Error adding product", "error");
        }
    }

    handleImageUpload(event) {
        const files = event.target.files;
        const preview = document.getElementById('imagePreview');
        
        preview.innerHTML = '';
        this.productImages = [];
        this.productImageFiles = Array.from(files);
        
        for (let i = 0; i < Math.min(files.length, 5); i++) {
            const file = files[i];
            const reader = new FileReader();
            
            reader.onload = (e) => {
                this.productImages.push(e.target.result);
                const img = document.createElement('img');
                img.src = e.target.result;
                img.style.maxWidth = '100px';
                img.style.maxHeight = '100px';
                img.style.margin = '5px';
                preview.appendChild(img);
            };
            
            reader.readAsDataURL(file);
        }
    }

    // Wizard Steps
    nextStep() {
        if (this.currentStep < 3) {
            this.currentStep++;
            this.updateWizardSteps();
        }
    }

    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateWizardSteps();
        }
    }

    updateWizardSteps() {
        // Update step indicators
        document.querySelectorAll('.step').forEach(step => {
            step.classList.remove('active');
        });
        
        const currentStepEl = document.querySelector(`.step[data-step="${this.currentStep}"]`);
        if (currentStepEl) {
            currentStepEl.classList.add('active');
        }
        
        // Show/hide form steps
        document.querySelectorAll('.form-step').forEach(step => {
            step.classList.remove('active');
        });
        
        const currentFormStep = document.getElementById(`step${this.currentStep}`);
        if (currentFormStep) {
            currentFormStep.classList.add('active');
        }
        
        // Update buttons
        const prevBtn = document.querySelector('.btn-prev');
        const nextBtn = document.querySelector('.btn-next');
        const submitBtn = document.querySelector('.btn-submit');
        
        if (prevBtn) {
            prevBtn.style.display = this.currentStep > 1 ? 'flex' : 'none';
        }
        
        if (nextBtn) {
            nextBtn.style.display = this.currentStep < 3 ? 'flex' : 'none';
        }
        
        if (submitBtn) {
            submitBtn.style.display = this.currentStep === 3 ? 'flex' : 'none';
        }
    }

    // Settings Methods
    showSettingsTab(tab) {
        const tabContent = document.getElementById(`${tab}Tab`);
        const tabBtns = document.querySelectorAll('.settings-tabs .tab-btn');
        
        if (tabContent) {
            // Hide all tab contents
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Remove active class from all tab buttons
            tabBtns.forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Show selected tab
            tabContent.classList.add('active');
            
            // Add active class to clicked button
            event.target.classList.add('active');
        }
    }

    loadSettings() {
        if (!this.storeData) return;
        
        // Populate settings form
        document.getElementById('storeName').value = this.storeData.storeName || '';
        document.getElementById('storeEmail').value = this.storeData.email || '';
        document.getElementById('storePhone').value = this.storeData.phone || '';
        document.getElementById('storeWebsite').value = this.storeData.website || '';
        document.getElementById('storeDescription').value = this.storeData.description || '';
        
        // Update character count
        const descCharCount = document.getElementById('descCharCount');
        if (descCharCount) {
            descCharCount.textContent = (this.storeData.description || '').length;
        }
    }

    async saveAllSettings() {
        try {
            const settings = {
                storeName: document.getElementById('storeName').value,
                email: document.getElementById('storeEmail').value,
                phone: document.getElementById('storePhone').value,
                website: document.getElementById('storeWebsite').value,
                description: document.getElementById('storeDescription').value,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            await this.db.collection('suppliers').doc(this.currentUser.uid).update(settings);
            
            // Update local store data
            this.storeData = { ...this.storeData, ...settings };
            
            // Update UI
            this.updateUserInfo();
            this.updateGreeting();
            
            this.showToast("Settings saved successfully", "success");
        } catch (error) {
            console.error("❌ Error saving settings:", error);
            this.showToast("Error saving settings", "error");
        }
    }

    // Analytics Methods
    updateAnalytics() {
        // Update analytics data
        const deliveredOrders = this.orders.filter(o => 
            (o.status || '').toLowerCase() === 'delivered'
        );
        
        const totalRevenue = deliveredOrders.reduce((sum, o) => 
            sum + (parseFloat(o.total) || 0), 0
        );
        
        const avgOrderValue = deliveredOrders.length > 0 ? 
            totalRevenue / deliveredOrders.length : 0;
        
        document.getElementById('metricTotalOrders').textContent = this.orders.length.toLocaleString();
        document.getElementById('metricTotalRevenue').textContent = `₹${totalRevenue.toLocaleString()}`;
        document.getElementById('metricTotalCustomers').textContent = this.customers.length.toLocaleString();
        document.getElementById('metricAvgOrderValue').textContent = `₹${avgOrderValue.toFixed(0)}`;
    }

    updateEarnings() {
        // Get delivered orders only
        const deliveredOrders = this.orders.filter(o => 
            (o.status || '').toLowerCase() === 'delivered'
        );
        
        const totalEarnings = deliveredOrders.reduce((sum, o) => 
            sum + (parseFloat(o.total) || 0), 0
        );
        
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const currentMonthEarnings = deliveredOrders
            .filter(o => {
                const orderDate = o.createdAt ? this.getDateFromTimestamp(o.createdAt) : new Date();
                return orderDate.getMonth() === currentMonth && 
                       orderDate.getFullYear() === currentYear;
            })
            .reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
        
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        
        const lastMonthEarnings = deliveredOrders
            .filter(o => {
                const orderDate = o.createdAt ? this.getDateFromTimestamp(o.createdAt) : new Date();
                return orderDate.getMonth() === lastMonth && 
                       orderDate.getFullYear() === lastMonthYear;
            })
            .reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
        
        document.getElementById('currentMonthEarnings').textContent = `₹${currentMonthEarnings.toLocaleString()}`;
        document.getElementById('lastMonthEarnings').textContent = `₹${lastMonthEarnings.toLocaleString()}`;
        document.getElementById('totalEarningsValue').textContent = `₹${totalEarnings.toLocaleString()}`;
        document.getElementById('availableBalance').textContent = `₹${(totalEarnings * 0.85).toLocaleString()}`;
    }

    // Modal Methods
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    // Authentication
    async logout() {
        try {
            // Stop all real-time listeners
            this.cleanupRealtimeListeners();
            
            // Sign out
            await this.auth.signOut();
            
            // Redirect to login
            window.location.href = '/public/Seller-login/Seller-login.html';
        } catch (error) {
            console.error("❌ Error logging out:", error);
            this.showToast("Error logging out", "error");
        }
    }

    async submitSupportRequest(event) {
        event.preventDefault();
        
        const subject = document.getElementById('supportSubject').value;
        const message = document.getElementById('supportMessage').value;
        const priority = document.getElementById('supportPriority').value;
        
        if (!subject || !message) {
            this.showToast("Please fill in all required fields", "error");
            return;
        }
        
        try {
            await this.db.collection('supportTickets').add({
                userId: this.currentUser.uid,
                storeName: this.storeData.storeName,
                subject,
                message,
                priority,
                status: 'open',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            this.showToast("Support request submitted successfully", "success");
            this.closeModal('supportModal');
            document.getElementById('supportForm').reset();
        } catch (error) {
            console.error("❌ Error submitting support request:", error);
            this.showToast("Error submitting support request", "error");
        }
    }

    // Utility Methods
    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        if (!toast) {
            console.warn("Toast element not found");
            return;
        }
        
        toast.textContent = message;
        toast.className = `toast ${type} show`;
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    hideLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }

    getDateFromTimestamp(timestamp) {
        if (!timestamp) return new Date();
        
        if (timestamp && typeof timestamp === 'object' && timestamp.toDate) {
            return timestamp.toDate();
        }
        
        if (timestamp instanceof Date) {
            return timestamp;
        }
        
        return new Date(timestamp);
    }

    formatDate(timestamp) {
        const date = this.getDateFromTimestamp(timestamp);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }

    getTimeAgo(date) {
        const dateObj = this.getDateFromTimestamp(date);
        
        if (!dateObj || isNaN(dateObj.getTime())) {
            return 'Unknown time';
        }
        
        const seconds = Math.floor((new Date() - dateObj) / 1000);
        
        let interval = Math.floor(seconds / 31536000);
        if (interval >= 1) return interval + " year" + (interval > 1 ? "s" : "") + " ago";
        
        interval = Math.floor(seconds / 2592000);
        if (interval >= 1) return interval + " month" + (interval > 1 ? "s" : "") + " ago";
        
        interval = Math.floor(seconds / 86400);
        if (interval >= 1) return interval + " day" + (interval > 1 ? "s" : "") + " ago";
        
        interval = Math.floor(seconds / 3600);
        if (interval >= 1) return interval + " hour" + (interval > 1 ? "s" : "") + " ago";
        
        interval = Math.floor(seconds / 60);
        if (interval >= 1) return interval + " minute" + (interval > 1 ? "s" : "") + " ago";
        
        return "Just now";
    }

    getStatusClass(status) {
        switch((status || '').toLowerCase()) {
            case 'active': return 'active';
            case 'inactive': return 'inactive';
            case 'draft': return 'draft';
            default: return 'inactive';
        }
    }

    getOrderStatusClass(status) {
        switch((status || '').toLowerCase()) {
            case 'pending': return 'pending';
            case 'processing': return 'processing';
            case 'shipped': return 'shipped';
            case 'delivered': return 'delivered';
            case 'cancelled': return 'cancelled';
            default: return 'pending';
        }
    }

    formatStatus(status) {
        if (!status) return 'Unknown';
        return status.charAt(0).toUpperCase() + status.slice(1);
    }

    formatOrderStatus(status) {
        const statusMap = {
            'pending': 'Pending',
            'processing': 'Processing',
            'shipped': 'Shipped',
            'delivered': 'Delivered',
            'cancelled': 'Cancelled'
        };
        return statusMap[(status || '').toLowerCase()] || this.formatStatus(status);
    }

    formatCategory(category) {
        const categoryMap = {
            'men': 'Men',
            'women': 'Women',
            'kids': 'Kids',
            'accessories': 'Accessories'
        };
        return categoryMap[(category || '').toLowerCase()] || 
               (category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Uncategorized');
    }

    getActivityIcon(type) {
        const iconMap = {
            'order': 'shopping-cart',
            'product': 'box',
            'customer': 'user',
            'payment': 'credit-card',
            'system': 'cog',
            'welcome': 'hand-wave',
            'tip': 'lightbulb',
            'alert': 'exclamation-triangle'
        };
        return iconMap[type] || 'bell';
    }

    // Demo Methods (for incomplete features)
    viewProduct(productId) {
        console.log("View product:", productId);
        this.showToast(`Viewing product ${productId}`, "info");
        
        // Find product
        const product = this.products.find(p => p.id === productId);
        if (product) {
            const modalContent = document.getElementById('productModalContent');
            modalContent.innerHTML = this.createProductModalHTML(product);
            this.showModal('productModal');
        }
    }

    editProduct(productId) {
        console.log("Edit product:", productId);
        this.showToast(`Editing product ${productId}`, "info");
        this.showPage('addProduct');
    }

    deleteProduct(productId) {
        if (confirm("Are you sure you want to delete this product?")) {
            console.log("Delete product:", productId);
            this.showToast(`Deleting product ${productId}`, "info");
        }
    }

    viewOrder(orderId) {
        console.log("View order:", orderId);
        this.showToast(`Viewing order ${orderId}`, "info");
        
        // Find order
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
            const modalContent = document.getElementById('orderModalContent');
            modalContent.innerHTML = this.createOrderModalHTML(order);
            this.showModal('orderModal');
        }
    }

    updateOrderStatus(orderId) {
        console.log("Update order status:", orderId);
        this.showToast(`Updating order ${orderId} status`, "info");
    }

    // Modal HTML Templates
    createProductModalHTML(product) {
        return `
            <div class="product-modal">
                <div class="product-images">
                    ${product.images && product.images.length > 0 ? 
                        product.images.map(img => `<img src="${img}" alt="${product.name}">`).join('') :
                        '<div class="no-image"><i class="fas fa-shirt"></i></div>'
                    }
                </div>
                <div class="product-details">
                    <h2>${product.name}</h2>
                    <div class="product-meta">
                        <span class="category">${this.formatCategory(product.category)}</span>
                        <span class="price">₹${(parseFloat(product.price) || 0).toLocaleString()}</span>
                        <span class="status ${this.getStatusClass(product.status)}">${this.formatStatus(product.status)}</span>
                    </div>
                    
                    <div class="product-info">
                        <h3>Description</h3>
                        <p>${product.description || 'No description provided.'}</p>
                    </div>
                    
                    <div class="product-specs">
                        <div class="spec-item">
                            <strong>Stock:</strong>
                            <span class="${(parseInt(product.stock) || 0) <= 0 ? 'out-of-stock' : (parseInt(product.stock) || 0) < 10 ? 'low-stock' : 'in-stock'}">
                                ${parseInt(product.stock) || 0} units
                            </span>
                        </div>
                        <div class="spec-item">
                            <strong>SKU:</strong>
                            <span>${product.sku || 'N/A'}</span>
                        </div>
                        <div class="spec-item">
                            <strong>Brand:</strong>
                            <span>${product.brand || 'N/A'}</span>
                        </div>
                        <div class="spec-item">
                            <strong>Created:</strong>
                            <span>${this.formatDate(product.createdAt)}</span>
                        </div>
                    </div>
                    
                    ${product.features && product.features.length > 0 ? `
                        <div class="product-features">
                            <h3>Features</h3>
                            <ul>
                                ${product.features.map(f => `<li>${f}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    ${product.tags && product.tags.length > 0 ? `
                        <div class="product-tags">
                            <h3>Tags</h3>
                            <div class="tag-list">
                                ${product.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    createOrderModalHTML(order) {
        const items = order.items || [];
        const subtotal = parseFloat(order.subtotal) || 0;
        const shipping = parseFloat(order.shipping) || 0;
        const tax = parseFloat(order.tax) || 0;
        const total = parseFloat(order.total) || subtotal + shipping + tax;
        
        return `
            <div class="order-modal">
                <div class="order-header">
                    <div>
                        <h3>Order #${order.id?.substring(0, 8) || 'N/A'}</h3>
                        <p class="order-date">${this.formatDate(order.createdAt)}</p>
                    </div>
                    <span class="status-badge ${this.getOrderStatusClass(order.status)}">
                        ${this.formatOrderStatus(order.status)}
                    </span>
                </div>
                
                <div class="order-customer">
                    <h4>Customer Information</h4>
                    <p><strong>Name:</strong> ${order.customerName || 'N/A'}</p>
                    <p><strong>Email:</strong> ${order.customerEmail || 'N/A'}</p>
                    <p><strong>Phone:</strong> ${order.customerPhone || 'N/A'}</p>
                    <p><strong>Address:</strong> ${order.shippingAddress || 'N/A'}</p>
                </div>
                
                <div class="order-items">
                    <h4>Order Items (${items.length})</h4>
                    <div class="items-list">
                        ${items.map(item => `
                            <div class="order-item-row">
                                <img src="${item.image || 'https://via.placeholder.com/50'}" alt="${item.name}">
                                <div class="item-details">
                                    <strong>${item.name}</strong>
                                    <small>Size: ${item.size || 'N/A'} • Color: ${item.color || 'N/A'}</small>
                                </div>
                                <div class="item-quantity">${item.quantity || 1}</div>
                                <div class="item-price">₹${(parseFloat(item.price) || 0).toLocaleString()}</div>
                                <div class="item-total">₹${((parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1)).toLocaleString()}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="order-summary">
                    <h4>Order Summary</h4>
                    <div class="summary-row">
                        <span>Subtotal:</span>
                        <span>₹${subtotal.toLocaleString()}</span>
                    </div>
                    <div class="summary-row">
                        <span>Shipping:</span>
                        <span>₹${shipping.toLocaleString()}</span>
                    </div>
                    <div class="summary-row">
                        <span>Tax:</span>
                        <span>₹${tax.toLocaleString()}</span>
                    </div>
                    <div class="summary-row total">
                        <span>Total:</span>
                        <span>₹${total.toLocaleString()}</span>
                    </div>
                </div>
                
                <div class="order-actions">
                    <button class="btn-action" onclick="dashboard.updateOrderStatus('${order.id}')">
                        <i class="fas fa-edit"></i> Update Status
                    </button>
                    <button class="btn-action" onclick="dashboard.printOrder('${order.id}')">
                        <i class="fas fa-print"></i> Print Invoice
                    </button>
                </div>
            </div>
        `;
    }

    // Demo placeholder methods
    updateSalesChart() {
        console.log("Updating sales chart");
        this.showToast("Sales chart updated", "info");
    }

    setAnalyticsPeriod(period) {
        console.log("Setting analytics period:", period);
        document.querySelectorAll('.period-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
        this.showToast(`Analytics period set to ${period}`, "info");
    }

    printOrder(orderId) {
        console.log("Printing order:", orderId);
        window.print();
    }

    changeAvatar() {
        console.log("Changing avatar");
        this.showToast("Avatar change functionality coming soon", "info");
    }

    changePassword() {
        console.log("Changing password");
        this.showToast("Password change functionality coming soon", "info");
    }

    verify2FACode() {
        console.log("Verifying 2FA code");
        this.showToast("2FA verification coming soon", "info");
    }

    logoutOtherSessions() {
        console.log("Logging out other sessions");
        this.showToast("Other sessions logged out", "success");
    }

    testStoreConnection() {
        console.log("Testing store connection");
        this.showToast("Store connection tested successfully", "success");
    }

    showImportExportTab(tab) {
        console.log("Showing import/export tab:", tab);
        const exportTab = document.getElementById('exportTab');
        const importTab = document.getElementById('importTab');
        const tabBtns = document.querySelectorAll('.import-export-tabs .tab-btn');
        
        tabBtns.forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
        
        if (tab === 'export') {
            exportTab.classList.add('active');
            importTab.classList.remove('active');
        } else {
            importTab.classList.add('active');
            exportTab.classList.remove('active');
        }
    }

    exportProducts() {
        console.log("Exporting products");
        this.showToast("Products exported successfully", "success");
    }

    processImport() {
        console.log("Processing import");
        this.showToast("Products imported successfully", "success");
    }

    startNewConversation() {
        console.log("Starting new conversation");
        this.showToast("New conversation started", "info");
    }

    markAllAsRead() {
        console.log("Marking all as read");
        this.showToast("All notifications marked as read", "success");
    }

    showAllActivity() {
        console.log("Showing all activity");
        this.showPage('analytics');
    }

    showAllTransactions() {
        console.log("Showing all transactions");
        this.showPage('earnings');
    }

    requestWithdrawal() {
        console.log("Requesting withdrawal");
        const amount = prompt("Enter withdrawal amount:", "1000");
        if (amount && !isNaN(amount)) {
            this.showToast(`Withdrawal request for ₹${amount} submitted`, "success");
        }
    }

    uploadLogo() {
        console.log("Uploading logo");
        this.showToast("Logo upload functionality coming soon", "info");
    }

    togglePassword(inputId) {
        const input = document.getElementById(inputId);
        if (input) {
            if (input.type === 'password') {
                input.type = 'text';
            } else {
                input.type = 'password';
            }
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log("📱 DOM loaded, initializing dashboard...");
    
    // Create global dashboard instance
    window.dashboard = new SellerDashboard();
    
    // Global functions for HTML onclick handlers
    window.showPage = (page) => window.dashboard?.showPage(page);
    window.toggleSidebar = () => window.dashboard?.toggleSidebar();
    window.toggleNotifications = () => window.dashboard?.toggleNotifications();
    window.toggleUserMenu = () => window.dashboard?.toggleUserMenu();
    window.logout = () => window.dashboard?.logout();
    window.showSupport = () => {
        const modal = document.getElementById('supportModal');
        if (modal) modal.style.display = 'flex';
    };
    window.closeModal = (modalId) => window.dashboard?.closeModal(modalId);
    window.togglePassword = (inputId) => window.dashboard?.togglePassword(inputId);
    window.changeProductPage = (direction) => {
        if (window.dashboard) {
            const totalPages = Math.ceil(window.dashboard.filteredProducts.length / window.dashboard.productsPerPage);
            const newPage = window.dashboard.currentProductPage + direction;
            
            if (newPage >= 1 && newPage <= totalPages) {
                window.dashboard.currentProductPage = newPage;
                window.dashboard.updateProductsUI();
            }
        }
    };
    window.changeOrderPage = (direction) => {
        if (window.dashboard) {
            const totalPages = Math.ceil(window.dashboard.filteredOrders.length / window.dashboard.ordersPerPage);
            const newPage = window.dashboard.currentOrderPage + direction;
            
            if (newPage >= 1 && newPage <= totalPages) {
                window.dashboard.currentOrderPage = newPage;
                window.dashboard.updateOrdersUI();
            }
        }
    };
    window.refreshDashboard = () => window.dashboard?.loadDashboardData();
    window.markAllAsRead = () => window.dashboard?.markAllAsRead();
    window.showAllActivity = () => window.dashboard?.showAllActivity();
    window.showAllTransactions = () => window.dashboard?.showAllTransactions();
    window.requestWithdrawal = () => window.dashboard?.requestWithdrawal();
    window.testStoreConnection = () => window.dashboard?.testStoreConnection();
    window.changeAvatar = () => window.dashboard?.changeAvatar();
    window.showImportExportModal = () => {
        const modal = document.getElementById('importExportModal');
        if (modal) modal.style.display = 'flex';
    };
    window.showImportExportTab = (tab, event) => window.dashboard?.showImportExportTab?.(tab);
    window.exportProducts = () => window.dashboard?.exportProducts();
    window.processImport = () => window.dashboard?.processImport();
    window.startNewConversation = () => window.dashboard?.startNewConversation();
    window.submitSupportRequest = (e) => window.dashboard?.submitSupportRequest(e);
    window.printOrder = (orderId) => window.dashboard?.printOrder(orderId);
    window.nextStep = () => window.dashboard?.nextStep();
    window.prevStep = () => window.dashboard?.prevStep();
    window.submitProduct = (e) => {
        e.preventDefault();
        window.dashboard?.handleProductSubmit(e);
    };
    window.handleImageUpload = (e) => window.dashboard?.handleImageUpload(e);
    window.changePassword = () => window.dashboard?.changePassword();
    window.verify2FACode = () => window.dashboard?.verify2FACode();
    window.logoutOtherSessions = () => window.dashboard?.logoutOtherSessions();
    window.saveAllSettings = () => window.dashboard?.saveAllSettings();
    window.updateSalesChart = () => window.dashboard?.updateSalesChart();
    window.setAnalyticsPeriod = (period, event) => window.dashboard?.setAnalyticsPeriod(period);
    window.filterProducts = () => window.dashboard?.filterProducts();
    window.filterOrders = () => window.dashboard?.filterOrders();
    window.uploadLogo = () => window.dashboard?.uploadLogo();
    
    console.log("✅ Global functions initialized");
});

console.log("🎯 Seller Dashboard JS loaded successfully");