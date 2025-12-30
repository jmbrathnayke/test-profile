 // Credentials loaded from config.js (not committed to git)

        // Initialize Supabase client
        const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        // ==================== CHECK AUTHENTICATION ====================
        async function checkAuth() {
            const loading = document.getElementById('loading');
            const errorContainer = document.getElementById('errorContainer');
            const dashboardContent = document.getElementById('dashboardContent');

            loading.style.display = 'block';
            console.log('Checking authentication...');

            try {
                const { data: { session }, error } = await supabaseClient.auth.getSession();

                console.log('Session check result:', { session, error });

                if (error) {
                    console.error('Auth error:', error);
                    throw error;
                }

                if (!session) {
                    console.log('No session found - user not logged in');
                    loading.style.display = 'none';
                    errorContainer.style.display = 'block';
                    return;
                }

                console.log('Session found, loading user data...');
                // User is logged in - load their data
                await loadUserData(session.user);

                loading.style.display = 'none';
                dashboardContent.style.display = 'block';

            } catch (error) {
                console.error('Auth check error:', error);
                loading.style.display = 'none';
                errorContainer.style.display = 'block';
                document.getElementById('errorContainer').innerHTML = `
                    <div class="error-message">
                        ❌ Error Loading Dashboard<br><br>
                        ${error.message || 'Unable to load your profile'}<br><br>
                        <a href="signup.html" style="color: white; text-decoration: underline;">Go to Sign Up</a>
                    </div>
                `;
            }
        }

        // ==================== LOAD USER DATA ====================
        async function loadUserData(user) {
            // Basic user info
            document.getElementById('userEmail').textContent = user.email;
            document.getElementById('emailDisplay').textContent = user.email;
            document.getElementById('userId').textContent = user.id;

            // Full name from metadata
            const fullName = user.user_metadata?.full_name || 'Not set';
            document.getElementById('fullName').textContent = fullName;
            document.getElementById('welcomeMessage').textContent = 
                `Hello, ${fullName}! Here's your account dashboard.`;

            // Email confirmed status
            const emailConfirmed = user.email_confirmed_at ? 'Yes ✅' : 'Pending ⏳';
            document.getElementById('emailConfirmed').textContent = emailConfirmed;

            // Member since
            const createdAt = new Date(user.created_at);
            document.getElementById('memberSince').textContent = createdAt.toLocaleDateString();

            // Last sign in
            const lastSignIn = user.last_sign_in_at ? 
                new Date(user.last_sign_in_at).toLocaleString() : 
                'Now';
            document.getElementById('lastSignIn').textContent = lastSignIn;

            // Try to load profile data from users table
            try {
                const { data, error } = await supabaseClient
                    .from('users')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (data && !error) {
                    document.getElementById('fullName').textContent = data.full_name || fullName;
                }
            } catch (err) {
                console.log('Could not load profile data from table:', err);
            }
        }

        // ==================== LOGOUT ====================
        async function logout() {
            const { error } = await supabaseClient.auth.signOut();
            
            if (error) {
                alert('Error signing out: ' + error.message);
                return;
            }

            // Redirect to home
            window.location.href = 'home.html';
        }

        // ==================== INITIALIZE ====================
        checkAuth();

        // Listen for auth state changes
        supabaseClient.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT') {
                window.location.href = 'signup.html';
            }
        });