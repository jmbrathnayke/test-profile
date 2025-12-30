 // Credentials loaded from config.js (not committed to git)

        const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        // ==================== ALERT HELPER ====================
        function showAlert(message, type = 'error') {
            const successMsg = document.getElementById('successMessage');
            const errorMsg = document.getElementById('errorMessage');
            
            successMsg.style.display = 'none';
            errorMsg.style.display = 'none';

            if (type === 'success') {
                successMsg.textContent = '✅ ' + message;
                successMsg.style.display = 'block';
            } else {
                errorMsg.textContent = '❌ ' + message;
                errorMsg.style.display = 'block';
            }

            setTimeout(() => {
                successMsg.style.display = 'none';
                errorMsg.style.display = 'none';
            }, 5000);
        }

        // ==================== EMAIL/PASSWORD LOGIN ====================
        const form = document.getElementById('loginForm');
        const submitBtn = document.getElementById('submitBtn');

        form.addEventListener('submit', async function(e) {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const remember = document.getElementById('remember').checked;

            if (!email || !password) {
                showAlert('Please fill in all fields');
                return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = 'Signing In...';

            try {
                const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
                    email: email,
                    password: password
                });

                if (authError) {
                    if (authError.message.includes('Invalid login credentials')) {
                        showAlert('Invalid email or password');
                    } else {
                        showAlert(authError.message);
                    }
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Sign In';
                    return;
                }

                // Success!
                showAlert('✅ Signed in successfully!', 'success');
                
                // Store remember me preference
                if (remember) {
                    localStorage.setItem('rememberEmail', email);
                }

                // Redirect to home
                setTimeout(() => {
                    window.location.href = 'home.html';
                }, 1500);

            } catch (error) {
                console.error('Error:', error);
                showAlert('An unexpected error occurred');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Sign In';
            }
        });

        // ==================== GOOGLE SIGN-IN ====================
        function handleGoogleSignIn() {
            supabaseClient.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/html/home.html`
                }
            });
        }

        // ==================== GITHUB SIGN-IN ====================
        function handleGitHubSignIn() {
            supabaseClient.auth.signInWithOAuth({
                provider: 'github',
                options: {
                    redirectTo: `${window.location.origin}/html/home.html`
                }
            });
        }

        // ==================== RESTORE REMEMBERED EMAIL ====================
        window.addEventListener('DOMContentLoaded', function() {
            const rememberedEmail = localStorage.getItem('rememberEmail');
            if (rememberedEmail) {
                document.getElementById('email').value = rememberedEmail;
                document.getElementById('remember').checked = true;
            }

            
        });

        // Listen for OAuth callback only (not initial session)
        let isInitialLoad = true;
        supabaseClient.auth.onAuthStateChange((event, session) => {
            // Skip initial session check
            if (isInitialLoad) {
                isInitialLoad = false;
                return;
            }
            
            // Only redirect on actual new sign-in
            if (event === 'SIGNED_IN' && session) {
                showAlert('✅ Signed in successfully!', 'success');
                setTimeout(() => {
                    window.location.href = 'home.html';
                }, 1500);
            }
        });
   