// Seller-login.js - Complete Supplier Authentication System
// ========================================================

class SupplierAuthSystem {
    constructor() {
        this.currentUser = null;
        this.isProcessing = false;
        this.init();
    }

    async init() {
        console.log('Supplier Auth System Initializing...');
        
        // Wait for Firebase to load
        await this.waitForFirebase();
        
        // Initialize Firebase if not already initialized
        this.initFirebase();
        
        // Setup UI event listeners
        this.setupEventListeners();
        
        // Check existing auth state
        this.checkAuthState();
        
        // Start animations
        this.startAnimations();
        
        console.log('Supplier Auth System Ready!');
    }

    waitForFirebase() {
        return new Promise((resolve) => {
            const checkFirebase = () => {
                if (typeof firebase !== 'undefined' && 
                    typeof firebase.initializeApp === 'function') {
                    resolve();
                } else {
                    setTimeout(checkFirebase, 100);
                }
            };
            checkFirebase();
        });
    }

    initFirebase() {
        try {
            // Check if Firebase is already initialized
            if (!firebase.apps.length) {
                const firebaseConfig = {
                    apiKey: "AIzaSyDvkzbzyMLAE8daV_m76b8AI9WtwUsgpNY",
                    authDomain: "aabhira-fashion-8c18f.firebaseapp.com",
                    databaseURL: "https://aabhira-fashion-8c18f-default-rtdb.asia-southeast1.firebasedatabase.app",
                    projectId: "aabhira-fashion-8c18f",
                    storageBucket: "aabhira-fashion-8c18f.firebasestorage.app",
                    messagingSenderId: "1096926871024",
                    appId: "1:1096926871024:web:77b00a182f23794d93f135",
                    measurementId: "G-GFKHXVNW71"
                };
                
                firebase.initializeApp(firebaseConfig);
                console.log('✅ Firebase initialized successfully');
            } else {
                console.log('✅ Firebase already initialized');
            }

            // Initialize services
            this.auth = firebase.auth();
            this.db = firebase.firestore();
            this.storage = firebase.storage();

            // Enable Firestore persistence
            this.db.enablePersistence()
                .then(() => console.log('📁 Firestore persistence enabled'))
                .catch(err => console.warn('⚠️ Persistence error:', err));

        } catch (error) {
            console.error('❌ Firebase initialization failed:', error);
            this.showMessage('Firebase initialization failed. Please refresh.', 'error');
        }
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.supplier-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTab(e));
        });

        // Form submissions
        document.getElementById('supplierLoginForm')?.addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('supplierRegisterForm')?.addEventListener('submit', (e) => this.handleRegister(e));
        document.getElementById('supplierForgotForm')?.addEventListener('submit', (e) => this.handleForgotPassword(e));

        // Password toggle buttons
        this.setupPasswordToggles();

        // Show form links
        document.getElementById('showRegisterForm')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.switchToTab('register');
        });

        document.getElementById('showLoginForm')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.switchToTab('login');
        });

        document.getElementById('showForgotPassword')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.switchToTab('forgot');
        });

        document.getElementById('backToSupplierLogin')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.switchToTab('login');
        });

        // Company size selector
        this.setupCompanySizeSelector();

        // Document upload
        this.setupDocumentUpload();

        // Password strength checker
        this.setupPasswordStrengthChecker();

        // Google login
        document.getElementById('supplierGoogleLoginBtn')?.addEventListener('click', (e) => this.handleGoogleLogin(e));
    }

    setupPasswordToggles() {
        const toggleButtons = {
            'toggleSupplierLoginPassword': 'supplierLoginPassword',
            'toggleSupplierPassword': 'supplierPassword',
            'toggleSupplierConfirmPassword': 'supplierConfirmPassword'
        };

        for (const [toggleId, inputId] of Object.entries(toggleButtons)) {
            const toggleBtn = document.getElementById(toggleId);
            const passwordInput = document.getElementById(inputId);
            
            if (toggleBtn && passwordInput) {
                toggleBtn.addEventListener('click', () => {
                    const type = passwordInput.type === 'password' ? 'text' : 'password';
                    passwordInput.type = type;
                    toggleBtn.innerHTML = `<i class="fas fa-eye${type === 'text' ? '-slash' : ''}"></i>`;
                });
            }
        }
    }

    setupCompanySizeSelector() {
        const sizeOptions = document.querySelectorAll('.size-option');
        const sizeInput = document.getElementById('companySize');
        
        sizeOptions.forEach(option => {
            option.addEventListener('click', () => {
                // Remove active class from all
                sizeOptions.forEach(opt => opt.classList.remove('active'));
                
                // Add active class to clicked
                option.classList.add('active');
                
                // Update hidden input
                sizeInput.value = option.dataset.size;
            });
        });
    }

    setupDocumentUpload() {
        const uploadArea = document.getElementById('documentUpload');
        const fileInput = document.getElementById('documentFile');
        const previewArea = document.getElementById('documentPreview');

        if (uploadArea && fileInput) {
            uploadArea.addEventListener('click', () => fileInput.click());
            
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.previewDocument(file, previewArea);
                }
            });
        }
    }

    previewDocument(file, previewArea) {
        if (!file.type.match('image.*') && file.type !== 'application/pdf') {
            this.showMessage('Please upload PDF or image files only', 'error');
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            this.showMessage('File size should be less than 5MB', 'error');
            return;
        }

        const reader = new FileReader();
        
        reader.onload = function(e) {
            let previewHTML = '';
            
            if (file.type.match('image.*')) {
                previewHTML = `
                    <div class="document-preview">
                        <img src="${e.target.result}" alt="Document Preview">
                        <div class="document-info">
                            <span>${file.name}</span>
                            <button type="button" class="remove-document" onclick="this.parentElement.parentElement.remove()">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                `;
            } else if (file.type === 'application/pdf') {
                previewHTML = `
                    <div class="document-preview pdf">
                        <i class="fas fa-file-pdf"></i>
                        <div class="document-info">
                            <span>${file.name}</span>
                            <button type="button" class="remove-document" onclick="this.parentElement.parentElement.remove()">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                `;
            }
            
            previewArea.innerHTML = previewHTML;
        };
        
        reader.readAsDataURL(file);
    }

    setupPasswordStrengthChecker() {
        const passwordInput = document.getElementById('supplierPassword');
        const strengthBar = document.getElementById('supplierPasswordStrength');
        const strengthText = document.getElementById('supplierStrengthText');

        if (passwordInput && strengthBar && strengthText) {
            passwordInput.addEventListener('input', (e) => {
                const password = e.target.value;
                const strength = this.calculatePasswordStrength(password);
                
                strengthBar.style.width = strength.percentage + '%';
                strengthBar.style.backgroundColor = strength.color;
                strengthText.textContent = strength.text;
                strengthText.style.color = strength.color;
            });
        }
    }

    calculatePasswordStrength(password) {
        let score = 0;
        
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        
        if (score <= 1) return { percentage: 20, color: '#ef4444', text: 'Weak' };
        if (score <= 3) return { percentage: 60, color: '#f59e0b', text: 'Medium' };
        return { percentage: 100, color: '#10b981', text: 'Strong' };
    }

    switchTab(e) {
        e.preventDefault();
        const tab = e.currentTarget.dataset.tab;
        this.switchToTab(tab);
    }

    switchToTab(tabName) {
        // Update active tab
        document.querySelectorAll('.supplier-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Update active form
        document.querySelectorAll('.supplier-form').forEach(form => {
            form.classList.toggle('active', form.dataset.form === tabName);
            
            // Add animation
            if (form.dataset.form === tabName) {
                form.classList.add('form-slide-enter');
                setTimeout(() => form.classList.remove('form-slide-enter'), 300);
            }
        });

        // Clear messages
        this.clearMessage();
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('supplierLoginEmail').value.trim();
        const password = document.getElementById('supplierLoginPassword').value;
        const rememberMe = document.getElementById('rememberSupplier').checked;
        
        // Validation
        if (!this.validateEmail(email)) {
            this.showMessage('Please enter a valid business email', 'error');
            return;
        }
        
        if (!password) {
            this.showMessage('Please enter your password', 'error');
            return;
        }
        
        this.setLoading(true, 'supplierLoginBtn');
        
        try {
            // Set persistence based on remember me
            await this.auth.setPersistence(
                rememberMe ? firebase.auth.Auth.Persistence.LOCAL : firebase.auth.Auth.Persistence.SESSION
            );
            
            // Sign in with email and password
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            
            // Check if user is a supplier
            const userDoc = await this.db.collection('suppliers').doc(userCredential.user.uid).get();
            
            if (!userDoc.exists) {
                await this.auth.signOut();
                throw new Error('Account not found. Please register as a supplier.');
            }
            
            // Update last login
            await this.db.collection('suppliers').doc(userCredential.user.uid).update({
                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'active'
            });
            
            this.showMessage('Login successful! Redirecting...', 'success');
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = '/public/Seller-dashboard/Seller-dashboard.html';
            }, 1500);
            
        } catch (error) {
            console.error('Login error:', error);
            
            let errorMessage = 'Login failed. ';
            switch (error.code) {
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                    errorMessage += 'Invalid email or password.';
                    break;
                case 'auth/too-many-requests':
                    errorMessage += 'Too many failed attempts. Please try again later.';
                    break;
                case 'auth/user-disabled':
                    errorMessage += 'Account has been disabled. Contact support.';
                    break;
                default:
                    errorMessage += error.message;
            }
            
            this.showMessage(errorMessage, 'error');
        } finally {
            this.setLoading(false, 'supplierLoginBtn');
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        
        // Collect form data
        const formData = {
            companyName: document.getElementById('companyName').value.trim(),
            businessType: document.getElementById('businessType').value,
            contactPerson: document.getElementById('contactPerson').value.trim(),
            designation: document.getElementById('designation').value.trim(),
            email: document.getElementById('supplierEmail').value.trim(),
            phone: document.getElementById('supplierPhone').value.trim(),
            gstNumber: document.getElementById('gstNumber').value.trim(),
            companySize: document.getElementById('companySize').value,
            address: document.getElementById('businessAddress').value.trim(),
            productCategories: Array.from(document.getElementById('productCategories').selectedOptions).map(opt => opt.value),
            password: document.getElementById('supplierPassword').value,
            confirmPassword: document.getElementById('supplierConfirmPassword').value,
            terms: document.getElementById('supplierTerms').checked,
            newsletter: document.getElementById('supplierNewsletter').checked
        };

        // Validate form
        const validation = this.validateRegistration(formData);
        if (!validation.valid) {
            this.showMessage(validation.message, 'error');
            return;
        }

        this.setLoading(true, 'supplierRegisterBtn');

        try {
            // 1. Create auth user
            const userCredential = await this.auth.createUserWithEmailAndPassword(
                formData.email, 
                formData.password
            );

            const userId = userCredential.user.uid;

            // 2. Upload document if exists
            let documentUrl = '';
            const fileInput = document.getElementById('documentFile');
            if (fileInput.files.length > 0) {
                documentUrl = await this.uploadDocument(userId, fileInput.files[0]);
            }

            // 3. Create supplier document in Firestore
            const supplierData = {
                uid: userId,
                companyName: formData.companyName,
                businessType: formData.businessType,
                contactPerson: formData.contactPerson,
                designation: formData.designation,
                email: formData.email,
                phone: formData.phone,
                gstNumber: formData.gstNumber,
                companySize: formData.companySize,
                address: formData.address,
                productCategories: formData.productCategories,
                documentUrl: documentUrl,
                status: 'pending', // pending, approved, rejected
                newsletter: formData.newsletter,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: null,
                isVerified: false
            };

            await this.db.collection('suppliers').doc(userId).set(supplierData);

            // 4. Send verification email
            await userCredential.user.sendEmailVerification({
                url: window.location.origin + '/public/Seller-dashboard/Seller-dashboard.html'
            });

            // 5. Send welcome email (optional - you can implement this later)
            // await this.sendWelcomeEmail(formData.email, formData.companyName);

            this.showMessage(
                'Registration successful! Please check your email for verification. You can login after verification.',
                'success'
            );

            // Clear form
            document.getElementById('supplierRegisterForm').reset();
            document.getElementById('documentPreview').innerHTML = '';
            
            // Switch to login tab after 3 seconds
            setTimeout(() => {
                this.switchToTab('login');
            }, 3000);

        } catch (error) {
            console.error('Registration error:', error);
            
            let errorMessage = 'Registration failed. ';
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage += 'Email already registered. Please login or use different email.';
                    break;
                case 'auth/invalid-email':
                    errorMessage += 'Invalid email address.';
                    break;
                case 'auth/weak-password':
                    errorMessage += 'Password is too weak.';
                    break;
                case 'permission-denied':
                    errorMessage += 'Permission denied. Please contact support.';
                    break;
                default:
                    errorMessage += error.message;
            }
            
            this.showMessage(errorMessage, 'error');
            
            // Clean up created user if registration failed after auth creation
            if (this.auth.currentUser) {
                await this.auth.currentUser.delete();
            }
        } finally {
            this.setLoading(false, 'supplierRegisterBtn');
        }
    }

    async uploadDocument(userId, file) {
        try {
            const storageRef = this.storage.ref();
            const fileRef = storageRef.child(`suppliers/${userId}/documents/${Date.now()}_${file.name}`);
            
            // Upload file
            const snapshot = await fileRef.put(file);
            
            // Get download URL
            const downloadUrl = await snapshot.ref.getDownloadURL();
            
            return downloadUrl;
        } catch (error) {
            console.error('Document upload error:', error);
            throw new Error('Failed to upload document. Please try again.');
        }
    }

    validateRegistration(data) {
        // Required fields check
        const requiredFields = [
            'companyName', 'businessType', 'contactPerson', 'designation',
            'email', 'phone', 'gstNumber', 'companySize', 'address',
            'password', 'confirmPassword'
        ];
        
        for (const field of requiredFields) {
            if (!data[field]) {
                return { valid: false, message: `Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}` };
            }
        }
        
        // Email validation
        if (!this.validateEmail(data.email)) {
            return { valid: false, message: 'Please enter a valid business email' };
        }
        
        // Phone validation (Indian format)
        if (!this.validatePhone(data.phone)) {
            return { valid: false, message: 'Please enter a valid Indian phone number (+91 XXXXX XXXXX)' };
        }
        
        // GST validation (basic pattern check)
        const gstPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        if (!gstPattern.test(data.gstNumber.toUpperCase())) {
            return { valid: false, message: 'Please enter a valid GST number (27ABCDE1234F1Z5 format)' };
        }
        
        // Password validation
        if (data.password.length < 8) {
            return { valid: false, message: 'Password must be at least 8 characters' };
        }
        
        if (data.password !== data.confirmPassword) {
            return { valid: false, message: 'Passwords do not match' };
        }
        
        // Terms acceptance
        if (!data.terms) {
            return { valid: false, message: 'Please accept the terms and conditions' };
        }
        
        // Product categories
        if (data.productCategories.length === 0) {
            return { valid: false, message: 'Please select at least one product category' };
        }
        
        return { valid: true, message: 'Validation successful' };
    }

    async handleForgotPassword(e) {
        e.preventDefault();
        
        const email = document.getElementById('supplierForgotEmail').value.trim();
        
        if (!this.validateEmail(email)) {
            this.showMessage('Please enter a valid business email', 'error');
            return;
        }
        
        this.setLoading(true, 'supplierResetBtn');
        
        try {
            // Check if email exists in suppliers collection
            const suppliersSnapshot = await this.db.collection('suppliers')
                .where('email', '==', email)
                .limit(1)
                .get();
            
            if (suppliersSnapshot.empty) {
                throw new Error('No supplier account found with this email');
            }
            
            // Send password reset email
            await this.auth.sendPasswordResetEmail(email, {
                url: window.location.origin + '/public/Seller-login/Seller-login.html',
                handleCodeInApp: false
            });
            
            this.showMessage('Password reset link sent to your email. Please check your inbox.', 'success');
            
            // Clear form
            document.getElementById('supplierForgotForm').reset();
            
            // Switch back to login after 3 seconds
            setTimeout(() => {
                this.switchToTab('login');
            }, 3000);
            
        } catch (error) {
            console.error('Password reset error:', error);
            
            let errorMessage = 'Password reset failed. ';
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = 'No supplier account found with this email.';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'Too many attempts. Please try again later.';
                    break;
                default:
                    errorMessage += error.message;
            }
            
            this.showMessage(errorMessage, 'error');
        } finally {
            this.setLoading(false, 'supplierResetBtn');
        }
    }

    async handleGoogleLogin(e) {
        e.preventDefault();
        
        this.setLoading(true, 'supplierGoogleLoginBtn');
        
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            
            // Set custom parameters
            provider.setCustomParameters({
                prompt: 'select_account',
                login_hint: ''
            });
            
            // Sign in with Google
            const result = await this.auth.signInWithPopup(provider);
            const user = result.user;
            
            // Check if supplier exists
            const supplierDoc = await this.db.collection('suppliers').doc(user.uid).get();
            
            if (!supplierDoc.exists) {
                // Create new supplier from Google account
                const supplierData = {
                    uid: user.uid,
                    companyName: user.displayName || 'Google User',
                    email: user.email,
                    contactPerson: user.displayName || '',
                    isVerified: user.emailVerified,
                    provider: 'google',
                    status: 'pending',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                };
                
                await this.db.collection('suppliers').doc(user.uid).set(supplierData);
                
                this.showMessage(
                    'Google login successful! Please complete your supplier profile.',
                    'success'
                );
                
                // Redirect to profile completion page
                setTimeout(() => {
                    window.location.href = '/public/Seller-dashboard/Seller-dashboard.html?setup=profile';
                }, 2000);
                
            } else {
                // Existing supplier - update last login
                await this.db.collection('suppliers').doc(user.uid).update({
                    lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                    status: 'active'
                });
                
                this.showMessage('Google login successful! Redirecting...', 'success');
                
                // Redirect to dashboard
                setTimeout(() => {
                    window.location.href = '/public/Seller-dashboard/Seller-dashboard.html';
                }, 1500);
            }
            
        } catch (error) {
            console.error('Google login error:', error);
            
            let errorMessage = 'Google login failed. ';
            switch (error.code) {
                case 'auth/popup-blocked':
                    errorMessage = 'Popup blocked. Please allow popups for this site.';
                    break;
                case 'auth/popup-closed-by-user':
                    errorMessage = 'Login popup was closed. Please try again.';
                    break;
                case 'auth/cancelled-popup-request':
                    errorMessage = 'Login cancelled.';
                    break;
                default:
                    errorMessage += error.message;
            }
            
            this.showMessage(errorMessage, 'error');
        } finally {
            this.setLoading(false, 'supplierGoogleLoginBtn');
        }
    }

    checkAuthState() {
        this.auth.onAuthStateChanged(async (user) => {
            this.currentUser = user;
            
            if (user) {
                console.log('User is logged in:', user.email);
                
                // Check if user is a verified supplier
                const supplierDoc = await this.db.collection('suppliers').doc(user.uid).get();
                
                if (supplierDoc.exists) {
                    const supplierData = supplierDoc.data();
                    
                    // If supplier is approved, redirect to dashboard
                    if (supplierData.status === 'approved' && window.location.pathname.includes('Seller-login')) {
                        this.showMessage('You are already logged in. Redirecting to dashboard...', 'info');
                        
                        setTimeout(() => {
                            window.location.href = '/public/Seller-dashboard/Seller-dashboard.html';
                        }, 2000);
                    }
                }
            }
        });
    }

    // Utility Methods
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    validatePhone(phone) {
        // Basic Indian phone validation
        const re = /^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/;
        return re.test(phone.replace(/\s+/g, ''));
    }

    setLoading(isLoading, buttonId) {
        this.isProcessing = isLoading;
        const button = document.getElementById(buttonId);
        
        if (button) {
            button.disabled = isLoading;
            const spinner = button.querySelector('.supplier-spinner');
            const span = button.querySelector('span');
            
            if (spinner) {
                spinner.style.display = isLoading ? 'block' : 'none';
            }
            
            if (span) {
                span.style.opacity = isLoading ? '0.5' : '1';
            }
        }
    }

    showMessage(message, type = 'info') {
        const messageDiv = document.getElementById('supplierMessage');
        
        if (messageDiv) {
            messageDiv.textContent = message;
            messageDiv.className = `supplier-message ${type}`;
            messageDiv.style.display = 'block';
            
            // Auto-hide success/info messages after 5 seconds
            if (type !== 'error') {
                setTimeout(() => {
                    if (messageDiv.textContent === message) {
                        this.clearMessage();
                    }
                }, 5000);
            }
        }
        
        // Also log to console
        console.log(`${type.toUpperCase()}: ${message}`);
    }

    clearMessage() {
        const messageDiv = document.getElementById('supplierMessage');
        if (messageDiv) {
            messageDiv.textContent = '';
            messageDiv.style.display = 'none';
        }
    }

    startAnimations() {
        // Fade in main container
        const mainContainer = document.getElementById('mainContainer');
        if (mainContainer) {
            setTimeout(() => {
                mainContainer.style.opacity = '1';
                mainContainer.style.transition = 'opacity 0.5s ease';
            }, 100);
        }
        
        // Animate stats numbers
        this.animateStats();
        
        // Add hover effects
        this.setupHoverEffects();
    }

    animateStats() {
        const statNumbers = document.querySelectorAll('.stat-number[data-target]');
        
        statNumbers.forEach(stat => {
            const target = parseInt(stat.getAttribute('data-target'));
            const suffix = stat.textContent.includes('%') ? '%' : '';
            
            let current = 0;
            const increment = target / 100;
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    current = target;
                    clearInterval(timer);
                }
                stat.textContent = suffix ? `${Math.round(current)}${suffix}` : Math.round(current);
            }, 20);
        });
    }

    setupHoverEffects() {
        // Add ripple effect to buttons
        document.querySelectorAll('.supplier-btn, .supplier-tab').forEach(button => {
            button.addEventListener('click', function(e) {
                const ripple = document.createElement('span');
                const rect = this.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;
                
                ripple.style.cssText = `
                    position: absolute;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.7);
                    transform: scale(0);
                    animation: ripple 0.6s linear;
                    width: ${size}px;
                    height: ${size}px;
                    top: ${y}px;
                    left: ${x}px;
                    pointer-events: none;
                `;
                
                this.appendChild(ripple);
                setTimeout(() => ripple.remove(), 600);
            });
        });
    }
}

// Initialize the system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add CSS for animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
        
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        @keyframes scaleIn {
            from {
                opacity: 0;
                transform: scale(0.9);
            }
            to {
                opacity: 1;
                transform: scale(1);
            }
        }
        
        @keyframes fadeIn {
            from {
                opacity: 0;
            }
            to {
                opacity: 1;
            }
        }
        
        .animate-fade-in {
            animation: fadeIn 0.8s ease forwards;
        }
        
        .animate-slide-up {
            animation: slideUp 0.6s ease forwards;
        }
        
        .animate-scale-in {
            animation: scaleIn 0.5s ease forwards;
        }
        
        .hover-scale {
            transition: transform 0.3s ease;
        }
        
        .hover-scale:hover {
            transform: scale(1.05);
        }
        
        .hover-lift {
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .hover-lift:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }
        
        .glow {
            animation: glow 2s ease-in-out infinite alternate;
        }
        
        @keyframes glow {
            from {
                box-shadow: 0 0 10px rgba(124, 58, 237, 0.5);
            }
            to {
                box-shadow: 0 0 20px rgba(124, 58, 237, 0.8), 0 0 30px rgba(124, 58, 237, 0.4);
            }
        }
        
        .form-slide-enter {
            animation: slideUp 0.4s ease;
        }
        
        .document-preview {
            margin-top: 10px;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            display: flex;
            align-items: center;
            gap: 10px;
            background: #f9f9f9;
        }
        
        .document-preview img {
            width: 50px;
            height: 50px;
            object-fit: cover;
            border-radius: 3px;
        }
        
        .document-preview.pdf {
            background: #fff5f5;
            border-color: #fecaca;
        }
        
        .document-preview.pdf i {
            color: #ef4444;
            font-size: 30px;
        }
        
        .document-info {
            flex: 1;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .remove-document {
            background: none;
            border: none;
            color: #ef4444;
            cursor: pointer;
            padding: 5px;
        }
        
        .size-option {
            display: inline-block;
            text-align: center;
            padding: 15px;
            border: 2px solid #ddd;
            border-radius: 8px;
            margin: 0 5px 10px 0;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .size-option:hover {
            border-color: #7C3AED;
        }
        
        .size-option.active {
            border-color: #7C3AED;
            background: rgba(124, 58, 237, 0.1);
        }
        
        .size-option i {
            font-size: 24px;
            margin-bottom: 5px;
            color: #666;
        }
        
        .size-option.active i {
            color: #7C3AED;
        }
        
        .supplier-message {
            padding: 12px 20px;
            margin: 15px 0;
            border-radius: 8px;
            font-weight: 500;
            display: none;
        }
        
        .supplier-message.success {
            background: #dcfce7;
            color: #166534;
            border: 1px solid #86efac;
        }
        
        .supplier-message.error {
            background: #fee2e2;
            color: #991b1b;
            border: 1px solid #fca5a5;
        }
        
        .supplier-message.info {
            background: #dbeafe;
            color: #1e40af;
            border: 1px solid #93c5fd;
        }
        
        .supplier-spinner {
            display: none;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top-color: white;
            animation: spin 1s linear infinite;
            position: absolute;
            right: 20px;
            top: 50%;
            transform: translateY(-50%);
        }
        
        @keyframes spin {
            to {
                transform: translateY(-50%) rotate(360deg);
            }
        }
    `;
    document.head.appendChild(style);
    
    // Create and initialize the auth system
    window.supplierAuth = new SupplierAuthSystem();
});

// Global functions for HTML access
window.switchToTab = (tabName) => {
    if (window.supplierAuth) {
        window.supplierAuth.switchToTab(tabName);
    }
};

window.showSupplierMessage = (message, type) => {
    if (window.supplierAuth) {
        window.supplierAuth.showMessage(message, type);
    }
};

console.log('Seller-login.js loaded successfully');