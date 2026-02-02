// Firebase Configuration and Initialization
const firebaseConfig = {
    apiKey: "AIzaSyDvkzbzyMLAE8daV_m76b8AI9WtwUsgpNY",
    authDomain: "aabhira-fashion-8c18f.firebaseapp.com",
    projectId: "aabhira-fashion-8c18f",
    storageBucket: "aabhira-fashion-8c18f.firebasestorage.app",
    messagingSenderId: "1096926871024",
    appId: "1:1096926871024:web:77b00a182f23794d93f135",
    measurementId: "G-GFKHXVNW71"
};

// Firebase variables (will be initialized after SDK loads)
let auth = null;
let googleProvider = null;

// Check if Firebase is already loaded
if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
    initializeFirebase();
} else {
    // Load Firebase SDK dynamically
    const firebaseScript = document.createElement('script');
    firebaseScript.src = "https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js";
    firebaseScript.onload = () => {
        const authScript = document.createElement('script');
        authScript.src = "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js";
        authScript.onload = initializeFirebase;
        document.head.appendChild(authScript);
    };
    document.head.appendChild(firebaseScript);
}

function initializeFirebase() {
    try {
        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        googleProvider = new firebase.auth.GoogleAuthProvider();
        
        console.log("Firebase initialized successfully");
        
        // Set up auth state listener
        auth.onAuthStateChanged((user) => {
            if (user) {
                console.log("User logged in:", user.email || user.phoneNumber);
                // You can redirect here if needed
            } else {
                console.log("User logged out");
            }
        });
        
    } catch (error) {
        console.error("Firebase initialization error:", error);
    }
}

// AuthUI Class - Main Authentication Controller
class AuthUI {
    constructor() {
        // DOM Elements
        this.loginForm = document.getElementById('loginForm');
        this.signupForm = document.getElementById('signupForm');
        this.phoneForm = document.getElementById('phoneForm');
        this.forgotForm = document.getElementById('forgotForm');
        
        this.tabButtons = document.querySelectorAll('.tab-btn');
        this.authForms = document.querySelectorAll('.auth-form');
        this.otpSection = document.getElementById('otpSection');
        
        // Buttons
        this.loginBtn = document.getElementById('loginBtn');
        this.signupBtn = document.getElementById('signupBtn');
        this.sendOTPBtn = document.getElementById('sendOTPBtn');
        this.verifyOTPBtn = document.getElementById('verifyOTPBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.googleLoginBtn = document.getElementById('googleLoginBtn');
        
        // Inputs
        this.loginEmail = document.getElementById('loginEmail');
        this.loginPassword = document.getElementById('loginPassword');
        this.signupEmail = document.getElementById('signupEmail');
        this.signupPassword = document.getElementById('signupPassword');
        this.confirmPassword = document.getElementById('confirmPassword');
        this.phoneNumber = document.getElementById('phoneNumber');
        this.countryCode = document.getElementById('countryCode');
        this.otpInputs = document.querySelectorAll('.otp-input');
        this.forgotEmail = document.getElementById('forgotEmail');
        
        // Toggle Password buttons
        this.toggleLoginPassword = document.getElementById('toggleLoginPassword');
        this.toggleSignupPassword = document.getElementById('toggleSignupPassword');
        this.toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
        
        // Message display
        this.authMessage = document.getElementById('authMessage');
        
        // OTP variables
        this.confirmationResult = null;
        this.otpTimer = null;
        this.otpTimeLeft = 30;
        this.recaptchaVerifier = null;
        
        // Initialize
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializePasswordToggles();
        this.initializeOTPInputs();
        this.initializePasswordStrength();
        this.checkRememberMe();
        
        console.log('AuthUI initialized successfully');
    }

    setupEventListeners() {
        // Tab switching
        this.tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchTab(tab);
            });
        });

        // Form submissions
        this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        this.signupForm.addEventListener('submit', (e) => this.handleSignup(e));
        this.phoneForm.addEventListener('submit', (e) => this.handlePhoneSubmit(e));
        this.forgotForm.addEventListener('submit', (e) => this.handleForgotPassword(e));
        
        // Button click handlers
        this.verifyOTPBtn.addEventListener('click', () => this.handleVerifyOTP());
        this.googleLoginBtn.addEventListener('click', () => this.handleGoogleLogin());
        
        // Forgot password link
        document.getElementById('forgotPasswordLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.showForgotPassword();
        });
        
        // Back to login
        document.getElementById('backToLogin').addEventListener('click', (e) => {
            e.preventDefault();
            this.switchTab('login');
        });
        
        // Resend OTP
        document.getElementById('resendOTP').addEventListener('click', (e) => {
            e.preventDefault();
            this.handleResendOTP();
        });
        
        // Password strength monitoring
        this.signupPassword.addEventListener('input', () => this.updatePasswordStrength());
    }

    initializePasswordToggles() {
        const togglePassword = (inputId, toggleBtn) => {
            toggleBtn.addEventListener('click', () => {
                const input = document.getElementById(inputId);
                const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
                input.setAttribute('type', type);
                toggleBtn.querySelector('i').classList.toggle('fa-eye');
                toggleBtn.querySelector('i').classList.toggle('fa-eye-slash');
            });
        };

        togglePassword('loginPassword', this.toggleLoginPassword);
        togglePassword('signupPassword', this.toggleSignupPassword);
        togglePassword('confirmPassword', this.toggleConfirmPassword);
    }

    initializeOTPInputs() {
        this.otpInputs.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                // Move to next input if current is filled
                if (e.target.value && index < this.otpInputs.length - 1) {
                    this.otpInputs[index + 1].focus();
                }
                
                // Validate input is number
                e.target.value = e.target.value.replace(/\D/g, '');
            });
            
            input.addEventListener('keydown', (e) => {
                // Handle backspace
                if (e.key === 'Backspace' && !e.target.value && index > 0) {
                    this.otpInputs[index - 1].focus();
                }
                
                // Move to previous input on left arrow
                if (e.key === 'ArrowLeft' && index > 0) {
                    this.otpInputs[index - 1].focus();
                }
                
                // Move to next input on right arrow
                if (e.key === 'ArrowRight' && index < this.otpInputs.length - 1) {
                    this.otpInputs[index + 1].focus();
                }
            });
        });
    }

    initializePasswordStrength() {
        this.passwordStrengthBar = document.getElementById('passwordStrengthBar');
        this.passwordStrengthText = document.getElementById('passwordStrengthText');
    }

    checkRememberMe() {
        const rememberedEmail = localStorage.getItem('rememberedEmail');
        if (rememberedEmail) {
            this.loginEmail.value = rememberedEmail;
            document.getElementById('rememberMe').checked = true;
        }
    }

    // Tab Management
    switchTab(tabName) {
        // Update active tab button
        this.tabButtons.forEach(button => {
            button.classList.toggle('active', button.dataset.tab === tabName);
        });

        // Show selected form
        this.authForms.forEach(form => {
            form.classList.toggle('active', form.id === `${tabName}Form`);
        });

        // Reset messages
        this.hideMessage();

        // Initialize recaptcha for phone tab
        if (tabName === 'phone') {
            setTimeout(() => this.initializeRecaptcha(), 100);
        }

        // Reset phone form if switching away
        if (tabName !== 'phone') {
            this.resetPhoneForm();
        }
    }

    showForgotPassword() {
        this.authForms.forEach(form => form.classList.remove('active'));
        this.forgotForm.classList.add('active');
        this.tabButtons.forEach(btn => btn.classList.remove('active'));
        this.hideMessage();
    }

    // Message Display
    showMessage(message, type = 'error') {
        this.authMessage.textContent = message;
        this.authMessage.className = `auth-message ${type}`;
        this.authMessage.style.display = 'block';
        
        if (type === 'success') {
            setTimeout(() => {
                this.hideMessage();
            }, 5000);
        }
    }

    hideMessage() {
        this.authMessage.style.display = 'none';
    }

    // Fixed showLoading method that works with all buttons
    showLoading(button) {
        if (!button) return;
        
        // Check if button has the spinner structure
        const buttonText = button.querySelector('.button-text');
        const spinner = button.querySelector('.spinner');
        
        if (buttonText && spinner) {
            buttonText.style.opacity = '0.5';
            button.disabled = true;
            spinner.style.display = 'block';
        } else {
            // For buttons without spinner structure (like Google button)
            button.disabled = true;
            button.style.opacity = '0.7';
            const originalText = button.innerHTML;
            button.innerHTML = `<div class="spinner-small"></div> Loading...`;
            button.setAttribute('data-original-text', originalText);
        }
    }

    hideLoading(button) {
        if (!button) return;
        
        const buttonText = button.querySelector('.button-text');
        const spinner = button.querySelector('.spinner');
        
        if (buttonText && spinner) {
            buttonText.style.opacity = '1';
            button.disabled = false;
            spinner.style.display = 'none';
        } else {
            // For buttons without spinner structure
            button.disabled = false;
            button.style.opacity = '1';
            const originalText = button.getAttribute('data-original-text');
            if (originalText) {
                button.innerHTML = originalText;
            }
        }
    }

    // Validation Functions
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    validatePassword(password) {
        return password.length >= 6;
    }

    validatePhoneNumber(phone) {
        // Remove all non-digit characters
        const cleanPhone = phone.replace(/\D/g, '');
        return cleanPhone.length >= 10;
    }

    updatePasswordStrength() {
        const password = this.signupPassword.value;
        let strength = 0;
        let text = 'Password strength';
        
        if (password.length >= 6) strength += 25;
        if (/[A-Z]/.test(password)) strength += 25;
        if (/[0-9]/.test(password)) strength += 25;
        if (/[^A-Za-z0-9]/.test(password)) strength += 25;
        
        // Update bar
        if (this.passwordStrengthBar) {
            this.passwordStrengthBar.style.width = `${strength}%`;
            
            // Update text and color
            if (strength < 50) {
                this.passwordStrengthBar.style.backgroundColor = '#e74c3c';
                text = 'Weak';
            } else if (strength < 75) {
                this.passwordStrengthBar.style.backgroundColor = '#f39c12';
                text = 'Fair';
            } else {
                this.passwordStrengthBar.style.backgroundColor = '#2ecc71';
                text = 'Strong';
            }
        }
        
        if (this.passwordStrengthText) {
            this.passwordStrengthText.textContent = text;
        }
    }

    // Login Handler with Firebase
    async handleLogin(e) {
        e.preventDefault();
        
        const email = this.loginEmail.value.trim();
        const password = this.loginPassword.value;
        const rememberMe = document.getElementById('rememberMe').checked;
        
        // Validation
        if (!email || !this.validateEmail(email)) {
            this.showMessage('Please enter a valid email address', 'error');
            return;
        }
        
        if (!password) {
            this.showMessage('Please enter your password', 'error');
            return;
        }
        
        this.showLoading(this.loginBtn);
        
        try {
            // Save remembered email
            if (rememberMe) {
                localStorage.setItem('rememberedEmail', email);
            } else {
                localStorage.removeItem('rememberedEmail');
            }
            
            // Firebase login
            if (!auth) {
                throw new Error('Authentication service not ready. Please try again.');
            }
            
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            this.showMessage(`Welcome back, ${user.email}! Redirecting...`, 'success');
            
            // Redirect after delay
            setTimeout(() => {
                window.location.href = '/public/Product-reviews/Product-reviews.html';
            }, 1500);
            
        } catch (error) {
            let errorMessage = 'Login failed. Please check your credentials.';
            if (error.code === 'auth/user-not-found') {
                errorMessage = 'No account found with this email.';
            } else if (error.code === 'auth/wrong-password') {
                errorMessage = 'Incorrect password. Please try again.';
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = 'Too many failed attempts. Please try again later.';
            }
            this.showMessage(errorMessage, 'error');
        } finally {
            this.hideLoading(this.loginBtn);
        }
    }

    // Signup Handler with Firebase
    async handleSignup(e) {
        e.preventDefault();
        
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const email = this.signupEmail.value.trim();
        const phone = document.getElementById('signupPhone').value.trim();
        const password = this.signupPassword.value;
        const confirmPassword = this.confirmPassword.value;
        const termsAccepted = document.getElementById('terms').checked;
        
        // Validation
        if (!firstName || !lastName) {
            this.showMessage('Please enter your full name', 'error');
            return;
        }
        
        if (!email || !this.validateEmail(email)) {
            this.showMessage('Please enter a valid email address', 'error');
            return;
        }
        
        if (!this.validatePassword(password)) {
            this.showMessage('Password must be at least 6 characters long', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            this.showMessage('Passwords do not match', 'error');
            return;
        }
        
        if (!termsAccepted) {
            this.showMessage('Please accept the terms and conditions', 'error');
            return;
        }
        
        this.showLoading(this.signupBtn);
        
        try {
            // Firebase signup
            if (!auth) {
                throw new Error('Authentication service not ready. Please try again.');
            }
            
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Update user profile with name
            await user.updateProfile({
                displayName: `${firstName} ${lastName}`
            });
            
            this.showMessage(`Welcome ${firstName}! Account created successfully.`, 'success');
            
            // Clear form
            this.signupForm.reset();
            if (this.passwordStrengthBar) {
                this.passwordStrengthBar.style.width = '0%';
            }
            if (this.passwordStrengthText) {
                this.passwordStrengthText.textContent = 'Password strength';
            }
            
            // Switch to login tab after delay
            setTimeout(() => {
                this.switchTab('login');
            }, 2000);
            
        } catch (error) {
            let errorMessage = 'Signup failed. Please try again.';
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'Email already registered. Please login instead.';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Password is too weak. Please use a stronger password.';
            }
            this.showMessage(errorMessage, 'error');
        } finally {
            this.hideLoading(this.signupBtn);
        }
    }

    // Phone Login Handler
    async handlePhoneSubmit(e) {
        e.preventDefault();
        
        const countryCode = this.countryCode.value;
        const phoneNumber = this.phoneNumber.value.trim();
        const fullPhoneNumber = countryCode + phoneNumber.replace(/\D/g, '');
        
        // Validation
        if (!this.validatePhoneNumber(phoneNumber)) {
            this.showMessage('Please enter a valid phone number (minimum 10 digits)', 'error');
            return;
        }
        
        this.showLoading(this.sendOTPBtn);
        
        try {
            // Check if test number (for development)
            if (this.isTestNumber(fullPhoneNumber)) {
                // Use test verification (no SMS sent)
                await this.handleTestOTP(fullPhoneNumber);
            } else {
                // Actual Firebase phone auth
                await this.sendOTP(fullPhoneNumber);
            }
            
        } catch (error) {
            this.showMessage(error.message || 'Failed to send OTP. Please try again.', 'error');
            this.hideLoading(this.sendOTPBtn);
        }
    }

    async handleTestOTP(phoneNumber) {
        // For test numbers, show OTP section immediately
        this.showMessage(`Test OTP for ${phoneNumber}: Use any 6-digit code`, 'info');
        
        // Show OTP section
        this.otpSection.style.display = 'block';
        this.sendOTPBtn.style.display = 'none';
        document.getElementById('phoneDisplay').textContent = phoneNumber;
        
        // Start OTP timer
        this.startOTPTimer();
        
        this.hideLoading(this.sendOTPBtn);
    }

    async sendOTP(phoneNumber) {
        if (!auth) {
            this.showMessage('Authentication service not ready. Please try again.', 'error');
            this.hideLoading(this.sendOTPBtn);
            return;
        }
        
        try {
            // Initialize recaptcha if not already done
            if (!this.recaptchaVerifier) {
                this.initializeRecaptcha();
                // Wait for recaptcha to render
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            // Send OTP via Firebase
            this.confirmationResult = await firebase.auth().signInWithPhoneNumber(
                phoneNumber, 
                this.recaptchaVerifier
            );
            
            // Show OTP section
            this.otpSection.style.display = 'block';
            this.sendOTPBtn.style.display = 'none';
            document.getElementById('phoneDisplay').textContent = phoneNumber;
            
            // Start OTP timer
            this.startOTPTimer();
            
            this.showMessage(`OTP sent to ${phoneNumber}`, 'success');
            this.hideLoading(this.sendOTPBtn);
            
        } catch (error) {
            console.error('OTP sending error:', error);
            let errorMessage = 'Failed to send OTP. Please try again.';
            if (error.code === 'auth/invalid-phone-number') {
                errorMessage = 'Invalid phone number format.';
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = 'Too many attempts. Please try again later.';
            }
            this.showMessage(errorMessage, 'error');
            this.hideLoading(this.sendOTPBtn);
        }
    }

    // Initialize Recaptcha
    initializeRecaptcha() {
        // Clear existing container
        const container = document.getElementById('recaptcha-container');
        if (container) {
            container.innerHTML = '';
        }
        
        // Clear existing recaptcha
        if (this.recaptchaVerifier) {
            try {
                this.recaptchaVerifier.clear();
            } catch (e) {
                console.log('Clearing old recaptcha:', e);
            }
        }
        
        if (!auth) {
            console.error('Firebase auth not initialized');
            return;
        }
        
        try {
            this.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
                'size': 'normal',
                'callback': (response) => {
                    console.log('reCAPTCHA solved');
                },
                'expired-callback': () => {
                    this.showMessage('reCAPTCHA expired. Please try again.', 'error');
                }
            });
            
            this.recaptchaVerifier.render().then((widgetId) => {
                console.log('reCAPTCHA widget rendered:', widgetId);
            });
            
        } catch (error) {
            console.error('Recaptcha initialization error:', error);
            this.showMessage('Could not initialize security check. Please refresh the page.', 'error');
        }
    }

    // Verify OTP Handler
    async handleVerifyOTP() {
        // Get OTP from inputs
        let otp = '';
        this.otpInputs.forEach(input => {
            otp += input.value;
        });
        
        // Validation
        if (otp.length !== 6) {
            this.showMessage('Please enter the complete 6-digit OTP', 'error');
            return;
        }
        
        this.showLoading(this.verifyOTPBtn);
        
        try {
            if (this.confirmationResult) {
                // Actual Firebase verification
                const userCredential = await this.confirmationResult.confirm(otp);
                const user = userCredential.user;
                
                this.showMessage(`Welcome! Phone verification successful.`, 'success');
                
                // Redirect after delay
                setTimeout(() => {
                    window.location.href = '/public/Product-reviews/Product-reviews.html';
                }, 1500);
                
            } else {
                // Test verification (any OTP works for test numbers)
                this.showMessage('Test verification successful! Redirecting...', 'success');
                
                // Redirect after delay
                setTimeout(() => {
                    window.location.href = '/dashboard.html';
                }, 1500);
            }
            
        } catch (error) {
            console.error('OTP verification error:', error);
            this.showMessage('Invalid OTP. Please try again.', 'error');
            // Clear OTP inputs on error
            this.otpInputs.forEach(input => input.value = '');
            if (this.otpInputs[0]) {
                this.otpInputs[0].focus();
            }
        } finally {
            this.hideLoading(this.verifyOTPBtn);
        }
    }

    // Resend OTP Handler
    async handleResendOTP() {
        if (this.otpTimeLeft > 0) return;
        
        const phoneDisplay = document.getElementById('phoneDisplay').textContent;
        const resendLink = document.getElementById('resendOTP');
        
        this.showLoading(resendLink);
        
        try {
            // For test numbers
            if (this.isTestNumber(phoneDisplay)) {
                this.showMessage('Test OTP resent. Use any 6-digit code.', 'info');
                this.startOTPTimer();
                this.hideLoading(resendLink);
                return;
            }
            
            // For real numbers, need to reinitialize recaptcha
            this.initializeRecaptcha();
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Resend OTP
            this.confirmationResult = await firebase.auth().signInWithPhoneNumber(
                phoneDisplay, 
                this.recaptchaVerifier
            );
            
            this.showMessage('OTP resent successfully', 'success');
            this.startOTPTimer();
            
        } catch (error) {
            this.showMessage('Failed to resend OTP. Please try again.', 'error');
        } finally {
            this.hideLoading(resendLink);
        }
    }

    // Forgot Password Handler
    async handleForgotPassword(e) {
        e.preventDefault();
        
        const email = this.forgotEmail.value.trim();
        
        // Validation
        if (!email || !this.validateEmail(email)) {
            this.showMessage('Please enter a valid email address', 'error');
            return;
        }
        
        this.showLoading(this.resetBtn);
        
        try {
            if (!auth) {
                throw new Error('Authentication service not ready.');
            }
            
            // Firebase password reset
            await auth.sendPasswordResetEmail(email);
            
            this.showMessage(`Password reset link sent to ${email}. Please check your email.`, 'success');
            
            // Clear form
            this.forgotEmail.value = '';
            
            // Switch back to login after delay
            setTimeout(() => {
                this.switchTab('login');
            }, 3000);
            
        } catch (error) {
            let errorMessage = 'Failed to send reset email. Please try again.';
            if (error.code === 'auth/user-not-found') {
                errorMessage = 'No account found with this email.';
            }
            this.showMessage(errorMessage, 'error');
        } finally {
            this.hideLoading(this.resetBtn);
        }
    }

    // Google Login Handler
    async handleGoogleLogin() {
        if (!auth || !googleProvider) {
            this.showMessage('Google login not available. Please try email login.', 'error');
            return;
        }
        
        // Fix for Google button loading state
        const originalHTML = this.googleLoginBtn.innerHTML;
        this.googleLoginBtn.disabled = true;
        this.googleLoginBtn.innerHTML = '<div class="spinner-small"></div> Connecting...';
        
        try {
            const result = await auth.signInWithPopup(googleProvider);
            const user = result.user;
            
            this.showMessage(`Welcome ${user.displayName}! Redirecting...`, 'success');
            
            // Redirect after delay
            setTimeout(() => {
                window.location.href = '/public/Product-reviews/Product-reviews.html';
            }, 1500);
            
        } catch (error) {
            console.error('Google login error:', error);
            let errorMessage = 'Google login failed. Please try again.';
            if (error.code === 'auth/popup-closed-by-user') {
                errorMessage = 'Login popup was closed. Please try again.';
            } else if (error.code === 'auth/account-exists-with-different-credential') {
                errorMessage = 'An account already exists with this email. Please use email login.';
            }
            this.showMessage(errorMessage, 'error');
        } finally {
            // Restore button
            this.googleLoginBtn.disabled = false;
            this.googleLoginBtn.innerHTML = originalHTML;
        }
    }

    // Helper Methods
    startOTPTimer() {
        this.otpTimeLeft = 30;
        const timerElement = document.getElementById('otpTimer');
        const resendLink = document.getElementById('resendOTP');
        
        if (!timerElement || !resendLink) return;
        
        timerElement.textContent = this.otpTimeLeft;
        resendLink.style.pointerEvents = 'none';
        resendLink.style.opacity = '0.5';
        
        clearInterval(this.otpTimer);
        
        this.otpTimer = setInterval(() => {
            this.otpTimeLeft--;
            timerElement.textContent = this.otpTimeLeft;
            
            if (this.otpTimeLeft <= 0) {
                clearInterval(this.otpTimer);
                resendLink.style.pointerEvents = 'auto';
                resendLink.style.opacity = '1';
            }
        }, 1000);
    }

    resetPhoneForm() {
        if (this.otpSection) {
            this.otpSection.style.display = 'none';
        }
        if (this.sendOTPBtn) {
            this.sendOTPBtn.style.display = 'block';
        }
        if (this.phoneNumber) {
            this.phoneNumber.value = '';
        }
        this.otpInputs.forEach(input => {
            if (input) input.value = '';
        });
        
        // Clear recaptcha if exists
        if (this.recaptchaVerifier) {
            try {
                this.recaptchaVerifier.clear();
            } catch (e) {
                console.log('Error clearing recaptcha:', e);
            }
            this.recaptchaVerifier = null;
        }
        
        clearInterval(this.otpTimer);
        this.otpTimeLeft = 30;
        const timerElement = document.getElementById('otpTimer');
        if (timerElement) {
            timerElement.textContent = '30';
        }
    }

    isTestNumber(phoneNumber) {
        const testNumbers = [
            '+16505551234', // US test number
            '+16505551235', // Another US test number
            '+919999999999', // India test number
            '+919999999998'  // Another India test number
        ];
        
        return testNumbers.includes(phoneNumber);
    }
}

// Initialize AuthUI when DOM is loaded
window.AuthUI = AuthUI;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.authApp) {
            window.authApp = new AuthUI();
        }
    });
} else {
    if (!window.authApp) {
        window.authApp = new AuthUI();
    }
}