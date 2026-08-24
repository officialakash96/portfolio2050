/**
 * Cyber-Resume Admin Portal & Restricted Zone Controller
 * Manages Google Sign-In, Role Clearances ('admin' vs 'guest'),
 * Resume Upload & AI Parser preview, Live Site Data Deployment, and Inquiries Inbox.
 */

class AdminPortal {
    constructor() {
        this.extractedData = null;
        this.activeTab = 'tab-resume';
        this.currentMessages = [];
        this.currentUsers = [];
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
        const hudLogoutBtn = document.getElementById('hud-logout-btn');
        const adminPortalLogoutBtn = document.getElementById('admin-portal-logout-btn');
        const closeEditMsgBtn = document.getElementById('close-edit-message-modal');
        const editMsgForm = document.getElementById('edit-message-form');
        const editMsgModal = document.getElementById('edit-message-modal');

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

        // Logout Buttons (Admin, Guest, HUD, and Admin Portal Header)
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
        if (guestLogoutBtn) {
            guestLogoutBtn.addEventListener('click', () => this.handleLogout());
        }
        if (hudLogoutBtn) {
            hudLogoutBtn.addEventListener('click', () => this.handleLogout());
        }
        if (adminPortalLogoutBtn) {
            adminPortalLogoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Edit Message Modal Events
        if (closeEditMsgBtn) {
            closeEditMsgBtn.addEventListener('click', () => this.closeEditMessageModal());
        }
        if (editMsgForm) {
            editMsgForm.addEventListener('submit', (e) => this.handleSaveEditedMessage(e));
        }
        if (editMsgModal) {
            editMsgModal.addEventListener('click', (e) => {
                if (e.target === editMsgModal) this.closeEditMessageModal();
            });
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
        const hudLogoutBtn = document.getElementById('hud-logout-btn');

        if (sessionData && sessionData.user) {
            const role = sessionData.role;
            const email = sessionData.user.email;

            if (hudLogoutBtn) hudLogoutBtn.classList.remove('hidden');

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
            if (hudLogoutBtn) hudLogoutBtn.classList.add('hidden');
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
            this.loadUsersList();
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
        this.closeEditMessageModal();
        this.checkAuthStatus();
        alert('You have disconnected and logged out.');
    }

    switchTab(tabId) {
        this.activeTab = tabId;
        document.querySelectorAll('.admin-nav-tab').forEach(t => {
            const isActive = t.getAttribute('data-tab') === tabId;
            t.classList.toggle('active', isActive);
            if (isActive) {
                try {
                    t.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                } catch (e) {}
            }
        });
        document.querySelectorAll('.admin-tab-content').forEach(c => {
            c.classList.toggle('active', c.id === tabId);
        });

        if (tabId === 'tab-inbox') {
            this.loadInboxMessages();
        } else if (tabId === 'tab-users') {
            this.loadUsersList();
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
                        <input type="text" id="edit-hero-name" value="${data.hero?.name || ''}">
                    </div>
                    <div class="admin-input-group">
                        <label>Role / Title</label>
                        <input type="text" id="edit-hero-role" value="${data.hero?.role || ''}">
                    </div>
                </div>
                <div class="form-row-3">
                    <div class="admin-input-group">
                        <label>Location</label>
                        <input type="text" id="edit-hero-loc" value="${data.hero?.location || ''}">
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

    // --- INBOX & TRANSMISSIONS CONTROLLER ---
    async loadInboxMessages() {
        const tbody = document.getElementById('inbox-messages-tbody');
        const cardsContainer = document.getElementById('inbox-cards-container');
        const emptyMsg = document.getElementById('inbox-empty-msg');
        if (!tbody && !cardsContainer) return;

        if (tbody) tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 2rem;"><i class="fas fa-spinner fa-spin"></i> FETCHING TELEMETRY...</td></tr>`;
        if (cardsContainer) cardsContainer.innerHTML = `<div style="text-align:center; padding: 2rem; color: var(--accent-cyan); font-family: var(--font-header); font-size: 0.8rem;"><i class="fas fa-spinner fa-spin"></i> FETCHING TELEMETRY...</div>`;

        const messages = await window.cyberSupabase.fetchContactMessages();
        this.currentMessages = messages || [];

        if (!this.currentMessages || this.currentMessages.length === 0) {
            if (tbody) tbody.innerHTML = '';
            if (cardsContainer) cardsContainer.innerHTML = '';
            if (emptyMsg) emptyMsg.classList.remove('hidden');
            return;
        }

        if (emptyMsg) emptyMsg.classList.add('hidden');

        // Desktop Table Rows
        if (tbody) {
            tbody.innerHTML = this.currentMessages.map(msg => `
                <tr>
                    <td>${new Date(msg.created_at).toLocaleString()}</td>
                    <td><strong>${this.escapeHtml(msg.name)}</strong></td>
                    <td><a href="mailto:${this.escapeHtml(msg.email)}?subject=Re: Inquiry on Akash Singh Portfolio" class="cyber-link">${this.escapeHtml(msg.email)}</a></td>
                    <td class="msg-query-cell">${this.escapeHtml(msg.query)}</td>
                    <td>
                        <div class="action-buttons-cell">
                            <a href="mailto:${this.escapeHtml(msg.email)}?subject=Re: Inquiry on Akash Singh Portfolio" class="cyber-btn-xs" title="Reply via Email"><i class="fas fa-reply"></i></a>
                            <button class="cyber-btn-xs btn-edit-msg" onclick="window.cyberAdmin.openEditMessageModal('${msg.id}')" title="Edit Transmission"><i class="fas fa-pen-to-square"></i></button>
                            <button class="cyber-btn-xs btn-delete-msg" onclick="window.cyberAdmin.handleDeleteMessage('${msg.id}')" title="Delete & Move to 30-Day Archive"><i class="fas fa-trash-can"></i></button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }

        // Mobile Cyber Cards
        if (cardsContainer) {
            cardsContainer.innerHTML = this.currentMessages.map(msg => `
                <div class="inbox-card-item">
                    <div class="inbox-card-header">
                        <span class="inbox-card-name"><i class="fas fa-user-astronaut"></i> ${this.escapeHtml(msg.name)}</span>
                        <span class="inbox-card-time">${new Date(msg.created_at).toLocaleDateString()} ${new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div class="inbox-card-email">
                        <i class="fas fa-envelope"></i> <a href="mailto:${this.escapeHtml(msg.email)}?subject=Re: Inquiry on Akash Singh Portfolio" class="cyber-link">${this.escapeHtml(msg.email)}</a>
                    </div>
                    <div class="inbox-card-query">
                        ${this.escapeHtml(msg.query)}
                    </div>
                    <div class="inbox-card-actions">
                        <a href="mailto:${this.escapeHtml(msg.email)}?subject=Re: Inquiry on Akash Singh Portfolio" class="cyber-btn-xs">
                            <i class="fas fa-reply"></i> REPLY
                        </a>
                        <button class="cyber-btn-xs btn-edit-msg" onclick="window.cyberAdmin.openEditMessageModal('${msg.id}')">
                            <i class="fas fa-pen-to-square"></i> EDIT
                        </button>
                        <button class="cyber-btn-xs btn-delete-msg" onclick="window.cyberAdmin.handleDeleteMessage('${msg.id}')">
                            <i class="fas fa-trash-can"></i> DELETE
                        </button>
                    </div>
                </div>
            `).join('');
        }
    }

    openEditMessageModal(id) {
        const msg = this.currentMessages.find(m => m.id === id);
        if (!msg) {
            alert('Transmission record not found.');
            return;
        }

        const modal = document.getElementById('edit-message-modal');
        const idInput = document.getElementById('edit-message-id');
        const nameInput = document.getElementById('edit-message-name');
        const emailInput = document.getElementById('edit-message-email');
        const queryInput = document.getElementById('edit-message-query');
        const statusBox = document.getElementById('edit-message-status-box');

        if (idInput) idInput.value = msg.id;
        if (nameInput) nameInput.value = msg.name || '';
        if (emailInput) emailInput.value = msg.email || '';
        if (queryInput) queryInput.value = msg.query || '';
        if (statusBox) statusBox.style.display = 'none';

        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('active');
            if (window.audioEngine && window.audioEngine.playBlip) window.audioEngine.playBlip();
        }
    }

    closeEditMessageModal() {
        const modal = document.getElementById('edit-message-modal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => modal.classList.add('hidden'), 200);
        }
    }

    async handleSaveEditedMessage(e) {
        e.preventDefault();
        const id = document.getElementById('edit-message-id')?.value;
        const name = document.getElementById('edit-message-name')?.value?.trim();
        const email = document.getElementById('edit-message-email')?.value?.trim();
        const query = document.getElementById('edit-message-query')?.value?.trim();
        const statusBox = document.getElementById('edit-message-status-box');
        const saveBtn = document.getElementById('btn-save-edit-message');

        if (!id || !name || !email || !query) {
            alert('All fields are required.');
            return;
        }

        try {
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> SAVING_CHANGES...`;
            }

            await window.cyberSupabase.updateContactMessage(id, { name, email, query });

            if (statusBox) {
                statusBox.className = 'contact-status-box success';
                statusBox.textContent = '✓ TRANSMISSION PACKET UPDATED SUCCESSFULLY';
                statusBox.style.display = 'block';
            }

            setTimeout(() => {
                this.closeEditMessageModal();
                this.loadInboxMessages();
            }, 600);

        } catch (err) {
            console.error('Error saving message edit:', err);
            if (statusBox) {
                statusBox.className = 'contact-status-box error';
                statusBox.textContent = 'ERROR SAVING CHANGES: ' + err.message;
                statusBox.style.display = 'block';
            }
        } finally {
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = `<i class="fas fa-floppy-disk"></i> SAVE TRANSMISSION CHANGES`;
            }
        }
    }

    async handleDeleteMessage(id) {
        if (!confirm('ARCHIVE & DELETE TRANSMISSION?\n\nThis packet will be moved to the 30-Day Archive (which automatically purges records older than 30 days).')) {
            return;
        }

        try {
            await window.cyberSupabase.deleteContactMessage(id);
            alert('✓ Transmission moved to 30-day archive and removed from active inbox.');
            this.loadInboxMessages();
            this.loadUsersList();
        } catch (err) {
            console.error('Delete message error:', err);
            alert('Error deleting transmission: ' + err.message);
        }
    }

    // --- USERS & CLEARANCE CONTROLLER ---
    async loadUsersList() {
        const tbody = document.getElementById('users-table-tbody');
        const cardsContainer = document.getElementById('users-cards-container');
        const emptyMsg = document.getElementById('users-empty-msg');
        const totalUsersEl = document.getElementById('metric-total-users');
        const totalAdminsEl = document.getElementById('metric-total-admins');
        const totalGuestsEl = document.getElementById('metric-total-guests');
        const totalArchivedEl = document.getElementById('metric-total-archived');

        if (!tbody && !cardsContainer) return;

        if (tbody) tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 2rem;"><i class="fas fa-spinner fa-spin"></i> RETRIEVING REGISTERED AGENTS...</td></tr>`;

        const [users, archivedCount] = await Promise.all([
            window.cyberSupabase.fetchUsers(),
            window.cyberSupabase.fetchArchivedMessagesCount()
        ]);

        this.currentUsers = users || [];

        // Update metrics
        const totalUsers = this.currentUsers.length;
        const totalAdmins = this.currentUsers.filter(u => u.role === 'admin').length;
        const totalGuests = totalUsers - totalAdmins;

        if (totalUsersEl) totalUsersEl.textContent = totalUsers.toString();
        if (totalAdminsEl) totalAdminsEl.textContent = totalAdmins.toString();
        if (totalGuestsEl) totalGuestsEl.textContent = totalGuests.toString();
        if (totalArchivedEl) totalArchivedEl.textContent = archivedCount.toString();

        if (this.currentUsers.length === 0) {
            if (tbody) tbody.innerHTML = '';
            if (cardsContainer) cardsContainer.innerHTML = '';
            if (emptyMsg) emptyMsg.classList.remove('hidden');
            return;
        }

        if (emptyMsg) emptyMsg.classList.add('hidden');

        // Desktop Table Rows
        if (tbody) {
            tbody.innerHTML = this.currentUsers.map(user => {
                const isAdmin = user.role === 'admin';
                return `
                    <tr>
                        <td>${user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</td>
                        <td>
                            <strong>${this.escapeHtml(user.email)}</strong>
                        </td>
                        <td>
                            <span class="user-role-badge ${isAdmin ? 'admin' : 'guest'}">
                                <i class="fas ${isAdmin ? 'fa-shield-check' : 'fa-user-shield'}"></i> ${isAdmin ? 'LEVEL 5 // ADMIN' : 'LEVEL 1 // GUEST'}
                            </span>
                        </td>
                        <td><span class="glow-green"><i class="fas fa-circle" style="font-size: 8px;"></i> VERIFIED</span></td>
                        <td>
                            <button class="cyber-btn-xs btn-role-toggle" onclick="window.cyberAdmin.handleToggleUserRole('${user.id}', '${user.role}')" title="Switch Clearance Level">
                                <i class="fas fa-arrows-rotate"></i> ${isAdmin ? 'SET GUEST' : 'SET ADMIN'}
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        // Mobile Cards List
        if (cardsContainer) {
            cardsContainer.innerHTML = this.currentUsers.map(user => {
                const isAdmin = user.role === 'admin';
                return `
                    <div class="inbox-card-item">
                        <div class="inbox-card-header">
                            <span class="inbox-card-name"><i class="fas fa-user-astronaut"></i> ${this.escapeHtml(user.email.split('@')[0])}</span>
                            <span class="inbox-card-time">${user.created_at ? new Date(user.created_at).toLocaleDateString() : ''}</span>
                        </div>
                        <div class="inbox-card-email">
                            <i class="fas fa-envelope"></i> ${this.escapeHtml(user.email)}
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.2rem;">
                            <span class="user-role-badge ${isAdmin ? 'admin' : 'guest'}">
                                <i class="fas ${isAdmin ? 'fa-shield-check' : 'fa-user-shield'}"></i> ${isAdmin ? 'ADMIN' : 'GUEST'}
                            </span>
                            <button class="cyber-btn-xs btn-role-toggle" onclick="window.cyberAdmin.handleToggleUserRole('${user.id}', '${user.role}')">
                                <i class="fas fa-arrows-rotate"></i> ${isAdmin ? 'MAKE GUEST' : 'MAKE ADMIN'}
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    async handleToggleUserRole(userId, currentRole) {
        const newRole = currentRole === 'admin' ? 'guest' : 'admin';
        if (!confirm(`Change clearance level for this user to '${newRole.toUpperCase()}'?`)) {
            return;
        }

        try {
            await window.cyberSupabase.updateUserRole(userId, newRole);
            alert(`✓ User clearance successfully updated to ${newRole.toUpperCase()}.`);
            this.loadUsersList();
        } catch (err) {
            console.error('Update role error:', err);
            alert('Error updating clearance: ' + err.message);
        }
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

