// ==================== SUPABASE CONFIGURATION ====================
// Credentials loaded from config.js (not committed to git)

// Initialize Supabase client
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==================== ALERT HELPER FUNCTIONS ====================
function showAlert(message, type = 'error') {
    const successMsg = document.getElementById('successMessage');
    const errorMsg = document.getElementById('errorMessage');
    
    // Hide both first
    successMsg.style.display = 'none';
    errorMsg.style.display = 'none';

    if (type === 'success') {
        successMsg.textContent = '✅ ' + message;
        successMsg.style.display = 'block';
    } else {
        errorMsg.textContent = '❌ ' + message;
        errorMsg.style.display = 'block';
    }

    // Auto-hide after 5 seconds
    setTimeout(() => {
        if (type === 'success') {
            successMsg.style.display = 'none';
        } else {
            errorMsg.style.display = 'none';
        }
    }, 5000);
}

// ==================== EMAIL/PASSWORD SIGNUP ====================
const form = document.getElementById('signupForm');
const submitBtn = document.getElementById('submitBtn');

form.addEventListener('submit', async function(e) {
    e.preventDefault();

    const fullname = document.getElementById('fullname').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const termsChecked = document.getElementById('terms').checked;

    // Client-side validation
    if (!fullname.trim()) {
        showAlert('Please enter your full name');
        return;
    }

    if (!email.trim()) {
        showAlert('Please enter your email address');
        return;
    }

    if (!email.includes('@')) {
        showAlert('Please enter a valid email address');
        return;
    }

    if (password.length < 8) {
        showAlert('Password must be at least 8 characters long');
        return;
    }

    if (password !== confirmPassword) {
        showAlert('Passwords do not match');
        return;
    }

    if (!termsChecked) {
        showAlert('Please agree to the Terms & Conditions');
        return;
    }

    // Disable button during submission
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating Account...';

    try {
        console.log('🚀 Starting signup for:', email);
        
        // Sign up with Supabase Auth
        const { data: authData, error: authError } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: fullname
                }
            }
        });

        console.log('Auth result:', { authData, authError });

        if (authError) {
            console.error('❌ Auth error:', authError);
            // Handle specific auth errors
            if (authError.message.includes('already registered')) {
                showAlert('This email is already registered. Please sign in instead.');
            } else if (authError.message.includes('password')) {
                showAlert('Password does not meet requirements: ' + authError.message);
            } else {
                showAlert(authError.message);
            }
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create Account';
            return;
        }

        console.log('✅ Auth signup successful, user ID:', authData.user?.id);

        // Create user profile in public.users table
        if (authData.user) {
            console.log('📝 Inserting profile into users table...');
            const { data: userData, error: userError } = await supabaseClient
                .from('users')
                .insert([
                    {
                        id: authData.user.id,
                        email: email,
                        full_name: fullname
                    }
                ])
                .select();

            console.log('Database insert result:', { userData, userError });

            if (userError) {
                console.error('❌ Database error:', userError);
                console.error('Error details:', {
                    message: userError.message,
                    code: userError.code,
                    details: userError.details
                });
                // Show error but don't fail completely
                showAlert('Account created but profile not saved. Contact support.');
            } else {
                console.log('✅ Profile saved successfully');
            }
        }

        // Success!
        console.log('✅ Profile saved successfully! Showing success message and redirecting...');
        showAlert('Account created successfully!', 'success');
        form.reset();

        // Redirect after 2 seconds to home page
        setTimeout(() => {
            window.location.href = 'home.html';
        }, 2000);

    } catch (error) {
        console.error('Unexpected error:', error);
        showAlert('An unexpected error occurred. Please try again.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account';
    }
});

// ==================== GOOGLE SIGN-IN ====================
function handleGoogleSignIn() {
    supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${window.location.origin}/html/dashboard.html`
        }
    });
}

// ==================== GITHUB SIGN-IN ====================
function handleGitHubSignIn() {
    supabaseClient.auth.signInWithOAuth({
        provider: 'github',
        options: {
            redirectTo: `${window.location.origin}/html/dashboard.html`
        }
    });
}

// ==================== HANDLE OAUTH CALLBACK & AUTH STATE ====================
window.addEventListener('DOMContentLoaded', async function() {
    // Only check for OAuth callback (when URL has access_token or code)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const urlParams = new URLSearchParams(window.location.search);
    
    // Only process if this is an OAuth callback
    if (hashParams.has('access_token') || urlParams.has('code')) {
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (session) {
            console.log('OAuth callback - User signed in:', session.user.email);
            showAlert('✅ Signed in successfully!', 'success');
            
            // Create/update user profile
            const { error } = await supabaseClient
                .from('users')
                .upsert({
                    id: session.user.id,
                    email: session.user.email,
                    full_name: session.user.user_metadata?.full_name || 'User'
                })
                .select();

            setTimeout(() => {
                window.location.href = 'home.html';
            }, 1500);
        }
    }
});

// Listen for auth changes (only log, don't redirect)
supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
        console.log('Auth state: User signed in:', session?.user?.email);
    } else if (event === 'SIGNED_OUT') {
        console.log('Auth state: User signed out');
    }
});