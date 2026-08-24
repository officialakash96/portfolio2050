/**
 * Cyber-Resume Contact Module & Transmission Engine
 * Handles contact modal interactions, validation, sending via EmailJS / Outlook,
 * and logging messages to the Supabase database.
 */

class ContactModule {
    constructor() {
        this.EMAILJS_SERVICE_KEY = 'cyber_emailjs_service_id';
        this.EMAILJS_TEMPLATE_KEY = 'cyber_emailjs_template_id';
        this.EMAILJS_PUBLIC_KEY = 'cyber_emailjs_public_key';

        this.serviceId = localStorage.getItem(this.EMAILJS_SERVICE_KEY) || 'service_cyber_contact';
        this.templateId = localStorage.getItem(this.EMAILJS_TEMPLATE_KEY) || 'template_contact';
        this.publicKey = localStorage.getItem(this.EMAILJS_PUBLIC_KEY) || 'YOUR_EMAILJS_PUBLIC_KEY';

        this.init();
    }

    init() {
        // Initialize EmailJS if public key is available
        if (window.emailjs && this.publicKey && this.publicKey !== 'YOUR_EMAILJS_PUBLIC_KEY') {
            try {
                window.emailjs.init(this.publicKey);
            } catch (e) {
                console.warn('[ContactModule] EmailJS init failed:', e);
            }
        }

        this.bindEvents();
    }

    bindEvents() {
        const contactBtn = document.getElementById('init-contact-btn');
        const contactModal = document.getElementById('contact-modal');
        const closeBtn = document.getElementById('close-contact-modal');
        const form = document.getElementById('contact-form');

        if (contactBtn && contactModal) {
            contactBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.openModal();
            });
        }

        if (closeBtn && contactModal) {
            closeBtn.addEventListener('click', () => {
                this.closeModal();
            });
        }

        if (contactModal) {
            contactModal.addEventListener('click', (e) => {
                if (e.target === contactModal) {
                    this.closeModal();
                }
            });
        }

        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && contactModal && !contactModal.classList.contains('hidden')) {
                this.closeModal();
            }
        });
    }

    openModal() {
        const modal = document.getElementById('contact-modal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('active');
            const nameInput = document.getElementById('contact-name');
            if (nameInput) setTimeout(() => nameInput.focus(), 100);
            if (window.audioEngine && window.audioEngine.playBlip) {
                window.audioEngine.playBlip();
            }
        }
    }

    closeModal() {
        const modal = document.getElementById('contact-modal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => modal.classList.add('hidden'), 250);
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        const form = document.getElementById('contact-form');
        const submitBtn = document.getElementById('contact-submit-btn');
        const statusBox = document.getElementById('contact-status-box');

        const name = (document.getElementById('contact-name')?.value || '').trim();
        const email = (document.getElementById('contact-email')?.value || '').trim();
        const query = (document.getElementById('contact-query')?.value || '').trim();

        if (!name || !email || !query) {
            this.showStatus('ERROR: ALL TELEMETRY FIELDS REQUIRED', 'error');
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            this.showStatus('ERROR: INVALID SENDER FREQUENCY (EMAIL FORMAT)', 'error');
            return;
        }

        // Set transmitting state
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<i class="fas fa-satellite-dish fa-spin"></i> TRANSMITTING_PACKET...`;
        }
        this.showStatus('ENCRYPTING & ROUTING TO AKASH.SINGH_96@OUTLOOK.COM...', 'info');

        let emailSent = false;

        // 1. Try sending via EmailJS
        if (window.emailjs && this.publicKey && this.publicKey !== 'YOUR_EMAILJS_PUBLIC_KEY') {
            try {
                const recipient = window.cyberSupabase ? window.cyberSupabase.recipientEmail : 'akash.singh_96@outlook.com';
                await window.emailjs.send(this.serviceId, this.templateId, {
                    from_name: name,
                    from_email: email,
                    message: query,
                    to_email: recipient,
                    timestamp: new Date().toLocaleString()
                });
                emailSent = true;
            } catch (err) {
                console.warn('[ContactModule] EmailJS dispatch failed:', err);
            }
        }

        // 2. Save into Supabase Database
        if (window.cyberSupabase) {
            try {
                await window.cyberSupabase.saveContactMessage(name, email, query);
            } catch (err) {
                console.warn('[ContactModule] Supabase log failed:', err);
            }
        }

        // Reset submit button
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<i class="fas fa-paper-plane"></i> TRANSMIT_PACKET.EXE`;
        }

        // Play confirmation sound
        if (window.audioEngine && window.audioEngine.playPoint) {
            window.audioEngine.playPoint();
        }

        this.showStatus('✓ SIGNAL CONFIRMED! INQUIRY RECEIVED BY AKASH SINGH.', 'success');
        form.reset();

        setTimeout(() => {
            this.closeModal();
            if (statusBox) statusBox.innerHTML = '';
        }, 3000);
    }

    showStatus(msg, type) {
        const box = document.getElementById('contact-status-box');
        if (box) {
            box.className = `contact-status-box ${type}`;
            box.innerHTML = msg;
        }
    }
}

window.cyberContact = new ContactModule();
