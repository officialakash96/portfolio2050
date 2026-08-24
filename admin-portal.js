/**
 * Cyber-Resume Admin Portal & Restricted Zone Controller
 * Manages Google Sign-In, Role Clearances ('admin' vs 'guest'),
 * Resume Upload & AI Parser preview, Live Site Data Deployment, and Inquiries Inbox.
 */

class AdminPortal {
    constructor() {
        this.extractedData = null;
        this.activeTab = 'tab-resume';
        this.init();
    }

    async init() {
        this.bindGlobalEvents();
        await this.checkAuthStatus();
    }

    bindGlobalEvents() {
        const restrictedBtn = document.getElementById('restricted-zone-btn');
        const authModal = document.getElementById('auth-modal');
        const adminModal = document.getElementById('admin-portal-modal');
        const closeAuthBtn = document.getElementById('close-auth-modal');
        const closeAdminBtn = document.getElementById('close-admin-modal');
        const googleLoginBtn = document.getElementById('google-signin-btn');
        const logoutBtn = document.getElementById('admin-logout-btn');
        const guestLogoutBtn = document.getElementById('guest-logout-btn');

        // Restricted Zone Click
        if (restrictedBtn) {
            restrictedBtn.addEventListener('click', () => {
                if (window.cyberSupabase && window.cyberSupabase.currentRole === 'admin') {
                    this.openAdminPortal();
                } else {
                    this.openAuthModal();
                }
            });
        }

        // Close Auth Modal
        if (closeAuthBtn) {
            closeAuthBtn.addEventListener('click', () => this.closeAuthModal());
        }

        // Close Admin Modal
        if (closeAdminBtn) {
            closeAdminBtn.addEventListener('click', () => this.closeAdminPortal());
        }

        // Google Sign In Button
        if (googleLoginBtn) {
            googleLoginBtn.addEventListener('click', async () => {
                try {
                    googleLoginBtn.disabled = true;
                    googleLoginBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> INITIALIZING_OAUTH...`;
                    await window.cyberSupabase.signInWithGoogle();
                } catch (err) {
                    alert('Google Authentication error: ' + err.message);
                    googleLoginBtn.disabled = false;
                    googleLoginBtn.innerHTML = `<i class="fab fa-google"></i> SIGN IN WITH GOOGLE`;
                }
            });
        }

        // Logout Buttons
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
        if (guestLogoutBtn) {
            guestLogoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Admin Portal Navigation Tabs
        const navTabs = document.querySelectorAll('.admin-nav-tab');
        navTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.getAttribute('data-tab');
                this.switchTab(target);
            });
        });

        // Resume File Upload & Parsing
        const resumeFileInput = document.getElementById('admin-resume-file');
        const resumeDropzone = document.getElementById('resume-dropzone');
        const parseBtn = document.getElementById('btn-parse-resume');
        const deployBtn = document.getElementById('btn-deploy-site');

        if (resumeDropzone && resumeFileInput) {
            resumeDropzone.addEventListener('click', () => resumeFileInput.click());
            resumeDropzone.addEventListener('dragover', (e) => {
                e.preventDefault();
                resumeDropzone.classList.add('dragover');
            });
            resumeDropzone.addEventListener('dragleave', () => resumeDropzone.classList.remove('dragover'));
            resumeDropzone.addEventListener('drop', (e) => {
                e.preventDefault();
                resumeDropzone.classList.remove('dragover');
                if (e.dataTransfer.files.length > 0) {
                    resumeFileInput.files = e.dataTransfer.files;
                    this.handleFileSelected(e.dataTransfer.files[0]);
                }
            });

            resumeFileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.handleFileSelected(e.target.files[0]);
                }
            });
        }

        if (parseBtn) {
            parseBtn.addEventListener('click', () => this.handleParseResume());
        }

        if (deployBtn) {
            deployBtn.addEventListener('click', () => this.handleDeploySite());
        }

        // Recipient Email Save
        const saveRecipientBtn = document.getElementById('btn-save-recipient');
        if (saveRecipientBtn) {
            saveRecipientBtn.addEventListener('click', () => this.handleSaveRecipient());
        }

        // Cloud Settings Save
        const saveSettingsBtn = document.getElementById('btn-save-settings');
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', () => this.handleSaveSettings());
        }

        // Quick Editor Save
        const saveQuickBtn = document.getElementById('btn-save-quick-edit');
        if (saveQuickBtn) {
            saveQuickBtn.addEventListener('click', () => this.handleSaveQuickEdit());
        }
    }

    async checkAuthStatus() {
        if (!window.cyberSupabase) return;

        const sessionData = await window.cyberSupabase.getCurrentSession();
        const restrictedBtn = document.getElementById('restricted-zone-btn');

        if (sessionData && sessionData.user) {
            const role = sessionData.role;
            const email = sessionData.user.email;

            if (role === 'admin') {
                if (restrictedBtn) {
                    restrictedBtn.className = 'hud-btn hud-btn-restricted admin-active';
                    restrictedBtn.innerHTML = `<i class="fas fa-shield-check"></i> <span>ADMIN ACCESS</span>`;
                    restrictedBtn.title = `Admin Authenticated: ${email}`;
                }
                this.updateAuthModalView('admin', email);
            } else {
                if (restrictedBtn) {
                    restrictedBtn.className = 'hud-btn hud-btn-restricted guest-active';
                    restrictedBtn.innerHTML = `<i class="fas fa-user-shield"></i> <span>GUEST: ${email.split('@')[0]}</span>`;
                    restrictedBtn.title = `Guest User: ${email}`;
                }
                this.updateAuthModalView('guest', email);
            }
        } else {
            if (restrictedBtn) {
                restrictedBtn.className = 'hud-btn hud-btn-restricted';
                restrictedBtn.innerHTML = `<i class="fas fa-shield-halved"></i> <span>RESTRICTED ZONE</span>`;
            }
            this.updateAuthModalView('unauth', null);
        }
    }

    updateAuthModalView(state, email) {
        const unauthBox = document.getElementById('auth-unauth-box');
        const adminBox = document.getElementById('auth-admin-box');
        const guestBox = document.getElementById('auth-guest-box');
        const adminEmailDisplay = document.getElementById('admin-email-display');
        const guestEmailDisplay = document.getElementById('guest-email-display');

        if (unauthBox) unauthBox.classList.toggle('hidden', state !== 'unauth');
        if (adminBox) adminBox.classList.toggle('hidden', state !== 'admin');
        if (guestBox) guestBox.classList.toggle('hidden', state !== 'guest');

        if (state === 'admin' && adminEmailDisplay) adminEmailDisplay.textContent = email;
        if (state === 'guest' && guestEmailDisplay) guestEmailDisplay.textContent = email;
    }

    openAuthModal() {
        const modal = document.getElementById('auth-modal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('active');
            if (window.audioEngine && window.audioEngine.playBlip) window.audioEngine.playBlip();
        }
    }

    closeAuthModal() {
        const modal = document.getElementById('auth-modal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => modal.classList.add('hidden'), 200);
        }
    }

    openAdminPortal() {
        this.closeAuthModal();
        const modal = document.getElementById('admin-portal-modal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('active');
            this.populateSettingsFields();
            this.loadInboxMessages();
            this.populateQuickEditFields();
            if (window.audioEngine && window.audioEngine.playPoint) window.audioEngine.playPoint();
        }
    }

    closeAdminPortal() {
        const modal = document.getElementById('admin-portal-modal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => modal.classList.add('hidden'), 200);
        }
    }

    async handleLogout() {
        if (window.cyberSupabase) {
            await window.cyberSupabase.signOut();
        }
        this.closeAdminPortal();
        this.closeAuthModal();
        this.checkAuthStatus();
        alert('You have logged out.');
    }

    switchTab(tabId) {
        this.activeTab = tabId;
        document.querySelectorAll('.admin-nav-tab').forEach(t => {
            t.classList.toggle('active', t.getAttribute('data-tab') === tabId);
        });
        document.querySelectorAll('.admin-tab-content').forEach(c => {
            c.classList.toggle('active', c.id === tabId);
        });

        if (tabId === 'tab-inbox') {
            this.loadInboxMessages();
        }
    }

    handleFileSelected(file) {
        const nameDisplay = document.getElementById('resume-file-name');
        const parseBtn = document.getElementById('btn-parse-resume');
        if (nameDisplay) {
            nameDisplay.textContent = `SELECTED: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
        }
        if (parseBtn) parseBtn.disabled = false;
    }

    async handleParseResume() {
        const fileInput = document.getElementById('admin-resume-file');
        const parseBtn = document.getElementById('btn-parse-resume');
        const statusDisplay = document.getElementById('parse-status-msg');
        const previewContainer = document.getElementById('resume-json-preview-container');

        if (!fileInput.files || fileInput.files.length === 0) {
            alert('Please select a PDF resume file first.');
            return;
        }

        const file = fileInput.files[0];

        try {
            parseBtn.disabled = true;
            parseBtn.innerHTML = `<i class="fas fa-microchip fa-spin"></i> ANALYZING_DOCUMENT...`;
            if (statusDisplay) statusDisplay.innerHTML = `<span class="glow-cyan"><i class="fas fa-spinner fa-spin"></i> EXTRACTING TEXT LAYERS...</span>`;

            // 1. Extract raw text
            const rawText = await window.cyberResumeParser.extractTextFromPDF(file);

            if (statusDisplay) statusDisplay.innerHTML = `<span class="glow-cyan"><i class="fas fa-brain fa-spin"></i> PARSING STRUCTURED FIELDS...</span>`;

            // 2. Parse text with heuristic/Gemini engine
            this.extractedData = await window.cyberResumeParser.parseResumeText(rawText);

            if (statusDisplay) statusDisplay.innerHTML = `<span class="glow-green"><i class="fas fa-check"></i> RESUME ANALYZED SUCCESSFULLY! REVIEW BELOW.</span>`;

            // 3. Render structured preview
            this.renderParsedPreview(this.extractedData);
            if (previewContainer) previewContainer.classList.remove('hidden');

            const deployBtn = document.getElementById('btn-deploy-site');
            if (deployBtn) deployBtn.disabled = false;

        } catch (err) {
            console.error('Parse error:', err);
            if (statusDisplay) statusDisplay.innerHTML = `<span class="glow-red"><i class="fas fa-triangle-exclamation"></i> PARSE ERROR: ${err.message}</span>`;
        } finally {
            parseBtn.disabled = false;
            parseBtn.innerHTML = `<i class="fas fa-wand-magic-sparkles"></i> ANALYZE & EXTRACT DATA`;
        }
    }

    renderParsedPreview(data) {
        const editor = document.getElementById('parsed-data-editor');
        if (!editor || !data) return;

        editor.innerHTML = `
            <div class="editor-section">
                <h4><i class="fas fa-user-astronaut"></i> HERO & CONTACT</h4>
                <div class="form-row-2">
                    <div class="admin-input-group">
                        <label>Candidate Name</label>
                        <input type="text" id="edit-hero-name" value="${data.hero?.name || 'AKASH SINGH'}">
                    </div>
                    <div class="admin-input-group">
                        <label>Role / Title</label>
                        <input type="text" id="edit-hero-role" value="${data.hero?.role || ''}">
                    </div>
                </div>
                <div class="form-row-3">
                    <div class="admin-input-group">
                        <label>Location</label>
                        <input type="text" id="edit-hero-loc" value="${data.hero?.location || 'Bengaluru, Karnataka'}">
                    </div>
                    <div class="admin-input-group">
                        <label>LinkedIn URL</label>
                        <input type="text" id="edit-hero-linkedin" value="${data.hero?.linkedin || ''}">
                    </div>
                    <div class="admin-input-group">
                        <label>GitHub URL</label>
                        <input type="text" id="edit-hero-github" value="${data.hero?.github || ''}">
                    </div>
                </div>
            </div>

            <div class="editor-section">
                <h4><i class="fas fa-list-check"></i> SYSTEM SUMMARY BULLETS</h4>
                <div class="admin-input-group">
                    <textarea id="edit-summary-bullets" rows="4">${(data.summary || []).join('\n')}</textarea>
                    <small class="hint">1 bullet point per line</small>
                </div>
            </div>

            <div class="editor-section">
                <h4><i class="fas fa-briefcase"></i> WORK HISTORY (JSON STRUCTURE)</h4>
                <div class="admin-input-group">
                    <textarea id="edit-experience-json" rows="6">${JSON.stringify(data.experience || [], null, 2)}</textarea>
                </div>
            </div>

            <div class="editor-section">
                <h4><i class="fas fa-graduation-cap"></i> EDUCATION & SKILLS</h4>
                <div class="form-row-2">
                    <div class="admin-input-group">
                        <label>Education (JSON)</label>
                        <textarea id="edit-education-json" rows="5">${JSON.stringify(data.education || [], null, 2)}</textarea>
                    </div>
                    <div class="admin-input-group">
                        <label>Skills (JSON)</label>
                        <textarea id="edit-skills-json" rows="5">${JSON.stringify(data.skills || {}, null, 2)}</textarea>
                    </div>
                </div>
            </div>
        `;
    }

    async handleDeploySite() {
        const deployBtn = document.getElementById('btn-deploy-site');
        const statusDisplay = document.getElementById('parse-status-msg');

        try {
            deployBtn.disabled = true;
            deployBtn.innerHTML = `<i class="fas fa-satellite-dish fa-spin"></i> SYNCING_TO_DATABASE...`;

            // Collect modified data from preview fields
            const payload = {
                hero: {
                    name: document.getElementById('edit-hero-name')?.value || 'AKASH SINGH',
                    role: document.getElementById('edit-hero-role')?.value || '',
                    location: document.getElementById('edit-hero-loc')?.value || 'Bengaluru, Karnataka',
                    linkedin: document.getElementById('edit-hero-linkedin')?.value || '',
                    github: document.getElementById('edit-hero-github')?.value || '',
                    resumeUrl: 'static/Resume_AkashSingh.pdf'
                },
                summary: (document.getElementById('edit-summary-bullets')?.value || '')
                    .split('\n')
                    .map(b => b.trim())
                    .filter(b => b.length > 0),
                experience: JSON.parse(document.getElementById('edit-experience-json')?.value || '[]'),
                education: JSON.parse(document.getElementById('edit-education-json')?.value || '[]'),
                skills: JSON.parse(document.getElementById('edit-skills-json')?.value || '{}')
            };

            await window.cyberSupabase.saveSiteContent(payload);

            // Hydrate the live DOM immediately
            if (window.cyberHydrateSite) {
                window.cyberHydrateSite(payload);
            }

            if (statusDisplay) statusDisplay.innerHTML = `<span class="glow-green"><i class="fas fa-circle-check"></i> LIVE SITE SYNCHRONIZED SUCCESSFULLY!</span>`;
            alert('✓ Success! Your website has been dynamically updated with the new resume data.');

        } catch (err) {
            console.error('Deploy error:', err);
            alert('Deploy failed: ' + err.message);
        } finally {
            deployBtn.disabled = false;
            deployBtn.innerHTML = `<i class="fas fa-cloud-arrow-up"></i> DEPLOY TO LIVE SITE`;
        }
    }

    async loadInboxMessages() {
        const tbody = document.getElementById('inbox-messages-tbody');
        const emptyMsg = document.getElementById('inbox-empty-msg');
        if (!tbody) return;

        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 2rem;"><i class="fas fa-spinner fa-spin"></i> FETCHING TELEMETRY...</td></tr>`;

        const messages = await window.cyberSupabase.fetchContactMessages();

        if (!messages || messages.length === 0) {
            tbody.innerHTML = '';
            if (emptyMsg) emptyMsg.classList.remove('hidden');
            return;
        }

        if (emptyMsg) emptyMsg.classList.add('hidden');
        tbody.innerHTML = messages.map(msg => `
            <tr>
                <td>${new Date(msg.created_at).toLocaleString()}</td>
                <td><strong>${this.escapeHtml(msg.name)}</strong></td>
                <td><a href="mailto:${this.escapeHtml(msg.email)}?subject=Re: Inquiry on Akash Singh Portfolio" class="cyber-link">${this.escapeHtml(msg.email)}</a></td>
                <td class="msg-query-cell">${this.escapeHtml(msg.query)}</td>
                <td>
                    <a href="mailto:${this.escapeHtml(msg.email)}" class="cyber-btn-xs" title="Reply via Email"><i class="fas fa-reply"></i></a>
                </td>
            </tr>
        `).join('');
    }

    populateSettingsFields() {
        const supabaseUrlInput = document.getElementById('setting-supabase-url');
        const supabaseKeyInput = document.getElementById('setting-supabase-key');
        const recipientInput = document.getElementById('setting-recipient-email');
        const geminiKeyInput = document.getElementById('setting-gemini-key');

        if (supabaseUrlInput) supabaseUrlInput.value = window.cyberSupabase.supabaseUrl || '';
        if (supabaseKeyInput) supabaseKeyInput.value = window.cyberSupabase.supabaseAnonKey || '';
        if (recipientInput) recipientInput.value = window.cyberSupabase.recipientEmail || 'akash.singh_96@outlook.com';
        if (geminiKeyInput) geminiKeyInput.value = localStorage.getItem('cyber_gemini_api_key') || '';
    }

    async handleSaveRecipient() {
        const recipientInput = document.getElementById('setting-recipient-email');
        if (recipientInput) {
            const email = recipientInput.value.trim();
            await window.cyberSupabase.updateRecipientEmail(email);
            alert(`Recipient email updated to: ${email}`);
        }
    }

    handleSaveSettings() {
        const url = document.getElementById('setting-supabase-url')?.value || '';
        const key = document.getElementById('setting-supabase-key')?.value || '';
        const gemini = document.getElementById('setting-gemini-key')?.value || '';

        window.cyberSupabase.updateCredentials(url, key);
        localStorage.setItem('cyber_gemini_api_key', gemini.trim());
        if (window.cyberResumeParser) window.cyberResumeParser.geminiApiKey = gemini.trim();

        alert('Cloud and API credentials saved successfully!');
    }

    populateQuickEditFields() {
        const cached = localStorage.getItem('cyber_cached_site_content');
        if (!cached) return;
        try {
            const data = JSON.parse(cached);
            const nameEl = document.getElementById('quick-name');
            const roleEl = document.getElementById('quick-role');
            const locEl = document.getElementById('quick-loc');

            if (nameEl && data.hero?.name) nameEl.value = data.hero.name;
            if (roleEl && data.hero?.role) roleEl.value = data.hero.role;
            if (locEl && data.hero?.location) locEl.value = data.hero.location;
        } catch (e) {}
    }

    async handleSaveQuickEdit() {
        const name = document.getElementById('quick-name')?.value;
        const role = document.getElementById('quick-role')?.value;
        const loc = document.getElementById('quick-loc')?.value;

        const cached = localStorage.getItem('cyber_cached_site_content');
        let current = cached ? JSON.parse(cached) : {};
        if (!current.hero) current.hero = {};

        if (name) current.hero.name = name;
        if (role) current.hero.role = role;
        if (loc) current.hero.location = loc;

        await window.cyberSupabase.saveSiteContent(current);
        if (window.cyberHydrateSite) window.cyberHydrateSite(current);
        alert('Quick updates deployed live!');
    }

    escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>'"]/g, tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag));
    }
}

window.cyberAdmin = new AdminPortal();
