/**
 * Cyber-Resume Supabase & Service Manager
 * Handles Supabase Client initialization, Google OAuth authentication,
 * Role-Based Access Control ('admin' vs 'guest'), Dynamic Site Data Sync,
 * and Contact Messages database records.
 */

class SupabaseService {
    constructor() {
        this.STORAGE_URL_KEY = 'cyber_supabase_url';
        this.STORAGE_KEY_KEY = 'cyber_supabase_anon_key';
        this.STORAGE_RECIPIENT_EMAIL = 'cyber_recipient_email';

        // Default Supabase project configuration (can be updated dynamically in Admin Portal)
        this.supabaseUrl = localStorage.getItem(this.STORAGE_URL_KEY) || 'https://agtjzhvwvephestqnpaf.supabase.co';
        this.supabaseAnonKey = localStorage.getItem(this.STORAGE_KEY_KEY) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFndGp6aHZ3dmVwaGVzdHFucGFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NjY5OTIsImV4cCI6MjEwMzE0Mjk5Mn0.STxm_b_ipCZhkVGv089M41yCWWxgENhXjDxNV4wXAxk';
        this.recipientEmail = localStorage.getItem(this.STORAGE_RECIPIENT_EMAIL) || 'akash.singh_96@outlook.com';

        this.client = null;
        this.currentUser = null;
        this.currentRole = 'guest'; // 'admin' | 'guest'
        this.isInitialized = false;

        this.init();
    }

    init() {
        try {
            if (window.supabase && window.supabase.createClient && this.supabaseUrl && this.supabaseAnonKey && this.supabaseAnonKey.length > 20) {
                this.client = window.supabase.createClient(this.supabaseUrl, this.supabaseAnonKey, {
                    auth: {
                        persistSession: true,
                        autoRefreshToken: true,
                        detectSessionInUrl: true
                    }
                });
                this.isInitialized = true;
            }
        } catch (err) {
            console.warn('[SupabaseService] Initialisation in offline/standby mode:', err);
            this.client = null;
            this.isInitialized = false;
        }
    }

    updateCredentials(url, key) {
        this.supabaseUrl = (url || '').trim();
        this.supabaseAnonKey = (key || '').trim();
        localStorage.setItem(this.STORAGE_URL_KEY, this.supabaseUrl);
        localStorage.setItem(this.STORAGE_KEY_KEY, this.supabaseAnonKey);
        this.init();
    }

    async signInWithGoogle() {
        if (!this.client) {
            throw new Error('Supabase client not initialized. Please verify Project URL & Anon Key in settings.');
        }

        const redirectTo = window.location.origin + window.location.pathname;
        const { data, error } = await this.client.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: redirectTo,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent'
                }
            }
        });

        if (error) throw error;
        return data;
    }

    async signOut() {
        if (this.client) {
            await this.client.auth.signOut();
        }
        this.currentUser = null;
        this.currentRole = 'guest';
        sessionStorage.removeItem('cyber_admin_verified');
    }

    async getCurrentSession() {
        if (!this.client) return null;
        try {
            const { data: { session }, error } = await this.client.auth.getSession();
            if (error || !session) return null;
            this.currentUser = session.user;
            await this.resolveUserRole();
            return {
                user: this.currentUser,
                role: this.currentRole
            };
        } catch (err) {
            console.error('[SupabaseService] Error retrieving session:', err);
            return null;
        }
    }

    /**
     * Role Determination Logic:
     * 1. Query 'profiles' table for user's row.
     * 2. If 'profiles' is empty or user is first user, grant 'admin'.
     * 3. Otherwise return assigned role ('admin' or 'guest').
     */
    async resolveUserRole() {
        if (!this.currentUser || !this.client) {
            this.currentRole = 'guest';
            return this.currentRole;
        }

        try {
            // Check if profile exists
            const { data: profile, error } = await this.client
                .from('profiles')
                .select('*')
                .eq('id', this.currentUser.id)
                .single();

            if (profile && profile.role) {
                this.currentRole = profile.role;
            } else {
                // Check if any admin exists in the system
                const { count } = await this.client
                    .from('profiles')
                    .select('*', { count: 'exact', head: true })
                    .eq('role', 'admin');

                const newRole = (count === 0) ? 'admin' : 'guest';

                // Insert profile record
                await this.client
                    .from('profiles')
                    .upsert({
                        id: this.currentUser.id,
                        email: this.currentUser.email,
                        role: newRole
                    });

                this.currentRole = newRole;
            }
        } catch (err) {
            console.warn('[SupabaseService] Error resolving role, defaulting to guest:', err);
            this.currentRole = 'guest';
        }

        if (this.currentRole === 'admin') {
            sessionStorage.setItem('cyber_admin_verified', 'true');
        } else {
            sessionStorage.removeItem('cyber_admin_verified');
        }

        return this.currentRole;
    }

    // --- Dynamic Site Content API ---
    async fetchSiteContent() {
        // Try local storage cache first for instant render
        const cached = localStorage.getItem('cyber_cached_site_content');
        let initialData = cached ? JSON.parse(cached) : null;

        if (!this.client) return initialData;

        try {
            const { data, error } = await this.client
                .from('site_content')
                .select('*')
                .eq('id', 'primary_resume')
                .single();

            if (error || !data) {
                return initialData;
            }

            if (data.recipient_email) {
                this.recipientEmail = data.recipient_email;
                localStorage.setItem(this.STORAGE_RECIPIENT_EMAIL, data.recipient_email);
            }

            if (data.content) {
                localStorage.setItem('cyber_cached_site_content', JSON.stringify(data.content));
                return data.content;
            }
        } catch (err) {
            console.warn('[SupabaseService] Fetching dynamic site content failed, using fallback:', err);
        }

        return initialData;
    }

    async saveSiteContent(contentJson) {
        if (!this.client || this.currentRole !== 'admin') {
            throw new Error('Unauthorized: Admin clearance required to update site content.');
        }

        const { data, error } = await this.client
            .from('site_content')
            .upsert({
                id: 'primary_resume',
                content: contentJson,
                recipient_email: this.recipientEmail,
                updated_at: new Date().toISOString()
            });

        if (error) throw error;
        localStorage.setItem('cyber_cached_site_content', JSON.stringify(contentJson));
        return data;
    }

    // --- Contact Messages & Recipient API ---
    async saveContactMessage(name, email, query) {
        const payload = {
            name: name.trim(),
            email: email.trim(),
            query: query.trim(),
            status: 'unread',
            created_at: new Date().toISOString()
        };

        if (this.client) {
            try {
                const { error } = await this.client
                    .from('contact_messages')
                    .insert([payload]);
                if (error) console.warn('[SupabaseService] Error logging contact message to DB:', error);
            } catch (e) {
                console.warn('[SupabaseService] DB insert skipped/failed:', e);
            }
        }

        // Also store locally for offline recovery
        try {
            const localMsgs = JSON.parse(localStorage.getItem('cyber_local_contact_inbox') || '[]');
            localMsgs.unshift({ ...payload, id: 'loc_' + Date.now() });
            localStorage.setItem('cyber_local_contact_inbox', JSON.stringify(localMsgs.slice(0, 50)));
        } catch (e) { }

        return true;
    }

    async fetchContactMessages() {
        if (!this.client || this.currentRole !== 'admin') {
            const local = localStorage.getItem('cyber_local_contact_inbox');
            return local ? JSON.parse(local) : [];
        }

        try {
            const { data, error } = await this.client
                .from('contact_messages')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (err) {
            console.warn('[SupabaseService] Fetch messages error, using local fallback:', err);
            const local = localStorage.getItem('cyber_local_contact_inbox');
            return local ? JSON.parse(local) : [];
        }
    }

    async updateRecipientEmail(newEmail) {
        this.recipientEmail = (newEmail || '').trim();
        localStorage.setItem(this.STORAGE_RECIPIENT_EMAIL, this.recipientEmail);

        if (this.client && this.currentRole === 'admin') {
            try {
                await this.client
                    .from('site_content')
                    .update({ recipient_email: this.recipientEmail })
                    .eq('id', 'primary_resume');
            } catch (err) {
                console.warn('[SupabaseService] Error updating recipient email in DB:', err);
            }
        }
        return this.recipientEmail;
    }
}

// Global Singleton
window.cyberSupabase = new SupabaseService();
