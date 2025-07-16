import { signIn, signInWithGoogle } from '../firebase.js';

document.addEventListener("DOMContentLoaded", function() {
    const loginForm = document.getElementById("loginForm");
    const loginMessage = document.getElementById("loginMessage");
    const googleSignInBtn = document.getElementById("googleSignInBtn");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const submitButton = loginForm.querySelector('button[type="submit"]');

    // Form validation
    emailInput.addEventListener('input', validateForm);
    passwordInput.addEventListener('input', validateForm);

    function validateForm() {
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!email || !emailRegex.test(email)) {
            emailInput.classList.add('border-red-500');
        } else {
            emailInput.classList.remove('border-red-500');
        }
        
        if (!password || password.length < 6) {
            passwordInput.classList.add('border-red-500');
        } else {
            passwordInput.classList.remove('border-red-500');
        }

        submitButton.disabled = !email || !emailRegex.test(email) || !password || password.length < 6;
        submitButton.classList.toggle('opacity-50', submitButton.disabled);
    }

    // Handle email/password login
    loginForm.addEventListener("submit", async function(e) {
        e.preventDefault();
        loginMessage.classList.remove("hidden");

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        // Disable form during submission
        setLoading(true);

        try {
            const user = await signIn(email, password);
            showSuccessMessage(user);
        } catch (error) {
            showErrorMessage(error);
        } finally {
            setLoading(false);
        }
    });

    // Handle Google Sign In
    googleSignInBtn.addEventListener("click", async function() {
        loginMessage.classList.remove("hidden");
        setLoading(true);
        
        try {
            const user = await signInWithGoogle();
            showSuccessMessage(user);
        } catch (error) {
            showErrorMessage(error);
        } finally {
            setLoading(false);
        }
    });

    function setLoading(isLoading) {
        // Disable form elements during loading
        submitButton.disabled = isLoading;
        googleSignInBtn.disabled = isLoading;
        emailInput.disabled = isLoading;
        passwordInput.disabled = isLoading;

        // Update button text and style
        if (isLoading) {
            submitButton.innerHTML = '<span class="inline-block animate-spin mr-2">↻</span>Logging in...';
            googleSignInBtn.innerHTML = '<span class="inline-block animate-spin mr-2">↻</span>Connecting...';
        } else {
            submitButton.textContent = 'Login';
            googleSignInBtn.innerHTML = '<img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google Logo" class="w-5 h-5" /><span>Continue with Google</span>';
        }
    }

    function showSuccessMessage(user) {
        loginMessage.textContent = "Login successful! Welcome, " + user.email;
        loginMessage.style.color = "#4ade80"; // lime-400
        loginMessage.classList.add('animate-pulse');
        
        // Store the user's authentication state
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userEmail', user.email);
        
        // Redirect to main extension page after successful login
        setTimeout(() => {
            window.location.href = '../extension/popup.html';
        }, 1500);
    }

    function showErrorMessage(error) {
        console.error("Login error:", error);
        loginMessage.classList.remove('animate-pulse');
        
        // Handle specific Firebase auth errors
        switch (error.code) {
            case 'auth/user-not-found':
                loginMessage.textContent = "No account found with this email. Please check your email or sign up.";
                break;
            case 'auth/wrong-password':
                loginMessage.textContent = "Incorrect password. Please try again.";
                passwordInput.value = ''; // Clear password field
                break;
            case 'auth/invalid-email':
                loginMessage.textContent = "Please enter a valid email address.";
                break;
            case 'auth/too-many-requests':
                loginMessage.textContent = "Too many failed attempts. Please try again later or reset your password.";
                break;
            case 'auth/popup-closed-by-user':
                loginMessage.textContent = "Google sign-in was cancelled. Please try again.";
                break;
            case 'auth/network-request-failed':
                loginMessage.textContent = "Network error. Please check your internet connection.";
                break;
            default:
                loginMessage.textContent = error.message || "Login failed. Please try again.";
        }
        loginMessage.style.color = "#ef233c";
    }
});

