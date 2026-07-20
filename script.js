/* ==========================================================================
   CYBER CHAT - ADVANCED LIVE CHAT ENGINE (SANDBOX & GITHUB COMPATIBLE)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // --- Safe Storage & Sandbox Helpers ---
    function safeSetStorage(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            if (!window._memoryStorage) window._memoryStorage = {};
            window._memoryStorage[key] = value;
        }
    }

    function safeGetStorage(key) {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            if (!window._memoryStorage) window._memoryStorage = {};
            return window._memoryStorage[key] || null;
        }
    }

    function safeRemoveStorage(key) {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            if (window._memoryStorage && window._memoryStorage[key]) {
                delete window._memoryStorage[key];
            }
        }
    }

    function getSafeBroadcastChannel(channelName) {
        try {
            if ('BroadcastChannel' in window) {
                return new BroadcastChannel(channelName);
            }
        } catch (e) {
            console.log('BroadcastChannel restricted in sandbox mode, using memory fallback');
        }
        return null;
    }

    // --- Global Application State ---
    const appState = {
        currentUser: null,
        activeTargetUser: null,
        users: new Map(),
        messages: new Map(),
        unreadCounts: new Map(),
        soundEnabled: true,
        themes: ['theme-cyberpunk', 'theme-matrix', 'theme-sunset', 'theme-gold'],
        currentThemeIdx: 0,
        broadcastChannel: null,
        peer: null,
        peerConnection: null,
        botsEnabled: true
    };

    // --- DOM Elements ---
    const loginScreen = document.getElementById('login-screen');
    const chatScreen = document.getElementById('chat-screen');
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username-input');
    const statusInput = document.getElementById('status-input');
    const avatarOptions = document.querySelectorAll('.avatar-option');
    const includeBotsCheck = document.getElementById('include-bots-check');

    const headerMyAvatar = document.getElementById('header-my-avatar');
    const headerMyName = document.getElementById('header-my-name');
    const onlineCountNumber = document.getElementById('online-count-number');
    const sidebarUserCount = document.getElementById('sidebar-user-count');
    const usersListEl = document.getElementById('users-list');
    const userSearchInput = document.getElementById('user-search-input');

    const noUserSelectedEl = document.getElementById('no-user-selected');
    const activeChatContainer = document.getElementById('active-chat-container');
    const targetUserAvatarEl = document.getElementById('target-user-avatar');
    const targetUserNameEl = document.getElementById('target-user-name');
    const targetUserStatusEl = document.getElementById('target-user-status');
    const messagesListEl = document.getElementById('messages-list');
    const typingIndicatorEl = document.getElementById('typing-indicator');
    const typingUsernameEl = document.getElementById('typing-username');
    const messageForm = document.getElementById('message-form');
    const messageInput = document.getElementById('message-input');
    const emojiPickerPanel = document.getElementById('emoji-picker-panel');
    const emojiGridEl = document.getElementById('emoji-grid');

    const btnTheme = document.getElementById('btn-theme');
    const btnSound = document.getElementById('btn-sound');
    const btnGuide = document.getElementById('btn-guide');
    const btnLogout = document.getElementById('btn-logout');
    const btnP2pShare = document.getElementById('btn-p2p-share');
    const btnEmojiToggle = document.getElementById('btn-emoji-toggle');
    const btnQuickEffect = document.getElementById('btn-quick-effect');
    const btnTriggerConfetti = document.getElementById('btn-trigger-confetti');
    const btnClearChat = document.getElementById('btn-clear-chat');
    const btnOpenNewTab = document.getElementById('btn-open-new-tab');

    const modalGuide = document.getElementById('modal-guide');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const modalTabBtns = document.querySelectorAll('.modal-tab-btn');
    const modalTabContents = document.querySelectorAll('.modal-tab-content');

    // =========================================================================
    // 1. WEB AUDIO API SYNTHESIZED SOUND EFFECTS
    // =========================================================================
    let audioCtx = null;
    function initAudio() {
        try {
            if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
        } catch (e) {}
    }

    function playSound(type) {
        if (!appState.soundEnabled) return;
        try {
            initAudio();
            if (!audioCtx) return;
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            const now = audioCtx.currentTime;

            if (type === 'click') {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(600, now);
                osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.linearRampToValueAtTime(0.01, now + 0.05);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(now);
                osc.stop(now + 0.05);
            }
            else if (type === 'login') {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.exponentialRampToValueAtTime(880, now + 0.3);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.linearRampToValueAtTime(0.01, now + 0.35);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(now);
                osc.stop(now + 0.35);
            }
            else if (type === 'send') {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(450, now);
                osc.frequency.exponentialRampToValueAtTime(900, now + 0.12);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.linearRampToValueAtTime(0.01, now + 0.12);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(now);
                osc.stop(now + 0.12);
            }
            else if (type === 'receive') {
                const osc1 = audioCtx.createOscillator();
                const gain1 = audioCtx.createGain();
                osc1.type = 'sine';
                osc1.frequency.setValueAtTime(660, now);
                gain1.gain.setValueAtTime(0.2, now);
                gain1.gain.linearRampToValueAtTime(0.01, now + 0.1);
                osc1.connect(gain1);
                gain1.connect(audioCtx.destination);
                osc1.start(now);
                osc1.stop(now + 0.1);

                const osc2 = audioCtx.createOscillator();
                const gain2 = audioCtx.createGain();
                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(880, now + 0.12);
                gain2.gain.setValueAtTime(0.25, now + 0.12);
                gain2.gain.linearRampToValueAtTime(0.01, now + 0.28);
                osc2.connect(gain2);
                gain2.connect(audioCtx.destination);
                osc2.start(now + 0.12);
                osc2.stop(now + 0.28);
            }
            else if (type === 'fx') {
                [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
                    const osc = audioCtx.createOscillator();
                    const gain = audioCtx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, now + idx * 0.06);
                    gain.gain.setValueAtTime(0.15, now + idx * 0.06);
                    gain.gain.linearRampToValueAtTime(0.01, now + idx * 0.06 + 0.3);
                    osc.connect(gain);
                    gain.connect(audioCtx.destination);
                    osc.start(now + idx * 0.06);
                    osc.stop(now + idx * 0.06 + 0.3);
                });
            }
        } catch (e) {}
    }

    // =========================================================================
    // 2. CANVAS PARTICLE ENGINE
    // =========================================================================
    const canvas = document.getElementById('particle-canvas');
    const ctx = canvas.getContext('2d');
    let particles = [];
    let mouse = { x: null, y: null };

    function resizeCanvas() {
        if (!canvas) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });
    window.addEventListener('mouseout', () => {
        mouse.x = null;
        mouse.y = null;
    });

    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2.2 + 1;
            this.speedX = (Math.random() - 0.5) * 1.2;
            this.speedY = (Math.random() - 0.5) * 1.2;
            this.color = Math.random() > 0.5 ? '#00f3ff' : '#b026ff';
        }
        update() {
            this.x += this.speedX;
            this.y += this.speedY;

            if (this.x < 0 || this.x > canvas.width) this.speedX = -this.speedX;
            if (this.y < 0 || this.y > canvas.height) this.speedY = -this.speedY;

            if (mouse.x && mouse.y) {
                const dx = mouse.x - this.x;
                const dy = mouse.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 100) {
                    this.x -= dx * 0.02;
                    this.y -= dy * 0.02;
                }
            }
        }
        draw() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function initParticles() {
        particles = [];
        const count = Math.min(Math.floor(window.innerWidth / 15), 70);
        for (let i = 0; i < count; i++) {
            particles.push(new Particle());
        }
    }
    initParticles();

    function animateParticles() {
        if (!ctx || !canvas) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();

            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 130) {
                    ctx.strokeStyle = `rgba(0, 243, 255, ${1 - dist / 130})`;
                    ctx.lineWidth = 0.6;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(animateParticles);
    }
    animateParticles();

    // =========================================================================
    // 3. SPECIAL VISUAL EFFECTS
    // =========================================================================
    const fxContainer = document.getElementById('fx-container');

    function triggerConfettiBurst(x = window.innerWidth / 2, y = window.innerHeight / 2, emojis = ['🎉', '✨', '⚡', '🔥', '❤️', '💎', '🚀']) {
        playSound('fx');
        if (!fxContainer) return;
        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('span');
            particle.className = 'fx-particle';
            particle.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            particle.style.left = `${x}px`;
            particle.style.top = `${y}px`;
            particle.style.fontSize = `${Math.random() * 1.5 + 1}rem`;

            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 220 + 80;
            const dx = Math.cos(angle) * distance;
            const dy = Math.sin(angle) * distance;
            const rot = (Math.random() - 0.5) * 720;

            particle.style.setProperty('--dx', `${dx}px`);
            particle.style.setProperty('--dy', `${dy}px`);
            particle.style.setProperty('--rot', `${rot}deg`);

            fxContainer.appendChild(particle);
            setTimeout(() => particle.remove(), 1200);
        }
    }

    // =========================================================================
    // 4. PRELOAD INTERACTIVE BOTS
    // =========================================================================
    const PRELOADED_BOTS = [
        {
            id: 'bot-aria',
            name: 'آریا (دستیار هوشمند) 🤖',
            avatar: '🤖',
            status: 'پاسخ‌گوی سوالات و راهنمای چت',
            isBot: true,
            responses: [
                "سلام دوست من! خیلی خوش اومدی به سایبر چت ✨ من آریا هستم، دستیار هوشمند سایت.",
                "این سایت با معماری کاملاً کلاینت-ساید و قابلیت همگام‌سازی بین تب‌ها ساخته شده و بدون نیاز به سرور مرکزی کار می‌کنه!",
                "افکت‌های نئونی و گلس‌مورفیسم رو چطور می‌بینی؟ اگه روی دکمه انفجار شادی بالای چت بزنی، افکت ویژه می‌بینی 🎉",
                "برای اینکه این سایت رو روی گیت‌هاب ران کنی، فقط کافیه فایل‌های همین پوشه رو آپلود کنی و از بخش Settings > Pages فعالش کنی! راهنمای کامل رو هم از دکمه راهنما بالای صفحه بخون.",
                "هر سوالی یا پیامی داری بهم بگو، من آنلاینم! 🔥⚡"
            ]
        },
        {
            id: 'bot-sara',
            name: 'سارا (طراح دیزاین) 🎨',
            avatar: '😎',
            status: 'عاشق افکت‌های سایبرپانک و نئون!',
            isBot: true,
            responses: [
                "سلام! دیزاین سایبرپانک سایت فوق‌العاده‌ست، مگه نه؟ 😍",
                "رنگ‌های فیروزه‌ای (#00f3ff) و بنفش نئونی ترکیب شگفت‌انگیزی می‌سازن! اگه دوست داری می‌تونی با دکمه جرقه ✨ بالای صفحه تم رنگی رو هم عوض کنی!",
                "اموجی‌ها رو هم تست کن! روی دکمه خندان کنار کادر متن کلیک کن یا دکمه آتش 🔥 رو بزن!",
                "مرسی که این پلتفرم رو تست می‌کنی ❤️"
            ]
        },
        {
            id: 'bot-sina',
            name: 'سینا (برنامه‌نویس) 💻',
            avatar: '🚀',
            status: 'در حال توسعه ارتباط WebRTC P2P...',
            isBot: true,
            responses: [
                "درود! اگه می‌خوای با دوستت که روی یه کامپیوتر دیگه هست چت کنی، حتماً بخش «اتصال راه دور P2P» بالای صفحه رو چک کن!",
                "با استفاده از WebRTC می‌تونید به صورت مستقیم و بدون نیاز به سرور مرکزی، با همدیگه گفتگوی زنده داشته باشید.",
                "همچنین می‌تونی دکمه «شبیه‌سازی کاربر جدید» رو در پایین لیست سمت راست بزنی تا سایت در یه تب جدید باز بشه و ببینی چطور دو تب با هم چت می‌کنن!",
                "کدنویسی تمیز و بهینه‌سازی عالی ⚡🚀"
            ]
        }
    ];

    // =========================================================================
    // 5. NETWORK ENGINE
    // =========================================================================
    function initNetworkEngine() {
        appState.broadcastChannel = getSafeBroadcastChannel('cyberchat_network_v1');
        if (appState.broadcastChannel) {
            appState.broadcastChannel.onmessage = (event) => {
                handleNetworkMessage(event.data);
            };
        }

        window.addEventListener('storage', (e) => {
            if (e.key === 'cyberchat_broadcast_event' && e.newValue) {
                try {
                    const data = JSON.parse(e.newValue);
                    handleNetworkMessage(data);
                } catch (err) {}
            }
        });

        setInterval(sendHeartbeat, 2500);
        sendHeartbeat();
        setInterval(checkOfflineUsers, 5000);
    }

    function broadcast(action, payload) {
        const messagePacket = {
            senderId: appState.currentUser ? appState.currentUser.id : null,
            action,
            payload,
            timestamp: Date.now()
        };

        if (appState.broadcastChannel) {
            try {
                appState.broadcastChannel.postMessage(messagePacket);
            } catch (e) {}
        }
        safeSetStorage('cyberchat_broadcast_event', JSON.stringify(messagePacket));
    }

    function sendHeartbeat() {
        if (!appState.currentUser) return;
        broadcast('HEARTBEAT', { user: appState.currentUser });
        try {
            const raw = safeGetStorage('cyberchat_users_registry') || '{}';
            const registry = JSON.parse(raw);
            registry[appState.currentUser.id] = {
                user: appState.currentUser,
                lastSeen: Date.now()
            };
            safeSetStorage('cyberchat_users_registry', JSON.stringify(registry));
        } catch (e) {}
    }

    function checkOfflineUsers() {
        try {
            const raw = safeGetStorage('cyberchat_users_registry') || '{}';
            const registry = JSON.parse(raw);
            const now = Date.now();
            let changed = false;

            Object.keys(registry).forEach(uid => {
                if (uid === (appState.currentUser ? appState.currentUser.id : '')) return;
                const record = registry[uid];
                if (now - record.lastSeen < 8000) {
                    if (!appState.users.has(uid)) {
                        appState.users.set(uid, record.user);
                        changed = true;
                    }
                } else {
                    if (appState.users.has(uid) && !record.user.isBot) {
                        appState.users.delete(uid);
                        changed = true;
                    }
                }
            });

            if (changed) {
                renderUsersSidebar();
            }
        } catch (e) {}
    }

    function handleNetworkMessage(packet) {
        if (!packet || !appState.currentUser) return;
        if (packet.senderId === appState.currentUser.id) return;

        const { action, payload } = packet;

        if (action === 'HEARTBEAT' && payload.user) {
            const u = payload.user;
            if (!appState.users.has(u.id)) {
                appState.users.set(u.id, u);
                renderUsersSidebar();
                playSound('login');
            } else {
                const existing = appState.users.get(u.id);
                if (existing.name !== u.name || existing.status !== u.status) {
                    appState.users.set(u.id, u);
                    renderUsersSidebar();
                }
            }
        }
        else if (action === 'USER_LOGOUT' && payload.userId) {
            if (appState.users.has(payload.userId)) {
                appState.users.delete(payload.userId);
                if (appState.activeTargetUser && appState.activeTargetUser.id === payload.userId) {
                    closeActiveChat();
                }
                renderUsersSidebar();
            }
        }
        else if (action === 'DIRECT_MESSAGE' && payload.targetUserId === appState.currentUser.id) {
            receiveMessage(payload.senderId, payload.message);
        }
    }

    // =========================================================================
    // 6. MESSAGING & BOTS LOGIC
    // =========================================================================
    function receiveMessage(senderId, messageObj) {
        if (!appState.messages.has(senderId)) {
            appState.messages.set(senderId, []);
        }
        appState.messages.get(senderId).push(messageObj);
        playSound('receive');

        if (appState.activeTargetUser && appState.activeTargetUser.id === senderId) {
            appendMessageToDOM(messageObj);
            scrollToBottom();
        } else {
            const currentUnread = appState.unreadCounts.get(senderId) || 0;
            appState.unreadCounts.set(senderId, currentUnread + 1);
            renderUsersSidebar();
        }
    }

    function sendMessage(text) {
        if (!text.trim() || !appState.activeTargetUser) return;

        const targetId = appState.activeTargetUser.id;
        const msgObj = {
            id: 'msg_' + Math.random().toString(36).substr(2, 9),
            senderId: appState.currentUser.id,
            text: text.trim(),
            timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
        };

        if (!appState.messages.has(targetId)) {
            appState.messages.set(targetId, []);
        }
        appState.messages.get(targetId).push(msgObj);

        appendMessageToDOM(msgObj);
        scrollToBottom();
        playSound('send');
        messageInput.value = '';

        if (text.includes('🎉') || text.includes('❤️') || text.includes('🔥') || text.includes('✨') || text.includes('⚡')) {
            triggerConfettiBurst();
        }

        if (!appState.activeTargetUser.isBot) {
            broadcast('DIRECT_MESSAGE', {
                targetUserId: targetId,
                senderId: appState.currentUser.id,
                message: msgObj
            });

            if (appState.peerConnection && appState.peerConnection.open) {
                appState.peerConnection.send({
                    type: 'P2P_MESSAGE',
                    senderId: appState.currentUser.id,
                    message: msgObj
                });
            }
        } else {
            triggerBotAIResponse(appState.activeTargetUser, text.trim());
        }
    }

    function triggerBotAIResponse(botUser, userText) {
        setTimeout(() => {
            if (appState.activeTargetUser && appState.activeTargetUser.id === botUser.id) {
                typingUsernameEl.textContent = botUser.name;
                typingIndicatorEl.classList.remove('hidden');
            }
        }, 600);

        const delay = Math.random() * 1200 + 1800;
        setTimeout(() => {
            if (appState.activeTargetUser && appState.activeTargetUser.id === botUser.id) {
                typingIndicatorEl.classList.add('hidden');
            }

            let replyText = "";
            if (userText.includes('سلام') || userText.includes('درود') || userText.includes('خوبی')) {
                replyText = `سلام عزیز دل! 🌹 خیلی خوشحالم که در سایبر چت باهات صحبت می‌کنم. چه کمکی از دستم برمیاد؟`;
            } else if (userText.includes('گیت') || userText.includes('github') || userText.includes('ران') || userText.includes('آپلود')) {
                replyText = `برای آپلود روی گیت‌هاب: ۱) یه مخزن جدید بساز ۲) هر ۳ فایل (index.html, style.css, script.js) رو آپلود کن ۳) از Settings > Pages گزینه branch main رو انتخاب کن و Save رو بزن! 🚀`;
            } else if (userText.includes('افکت') || userText.includes('خفن') || userText.includes('تم')) {
                replyText = `افکت‌های سایت شامل ذرات معلق پس‌زمینه، گلس‌مورفیسم، ۴ تم رنگی متنوع و اصوات سینت‌سایزر Web Audio هست! دکمه انفجار شادی رو کلیک کن تا افکت ویژه رو ببینی ✨🎉`;
            } else if (userText.includes('❤️') || userText.includes('🔥') || userText.includes('😎')) {
                replyText = `اوووه چه انرژی بالایی! 🔥❤️ منم برات کلی آرزوی موفقیت و شادی دارم! ✨🎉`;
            } else {
                const responses = botUser.responses;
                replyText = responses[Math.floor(Math.random() * responses.length)];
            }

            const replyObj = {
                id: 'msg_' + Math.random().toString(36).substr(2, 9),
                senderId: botUser.id,
                text: replyText,
                timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
            };

            receiveMessage(botUser.id, replyObj);
        }, delay);
    }

    function appendMessageToDOM(msgObj) {
        const isSent = msgObj.senderId === appState.currentUser.id;
        const bubble = document.createElement('div');
        bubble.className = `message-bubble ${isSent ? 'sent' : 'received'}`;
        bubble.innerHTML = `
            <div class="msg-content">${msgObj.text}</div>
            <div class="msg-meta">
                <span>${msgObj.timestamp}</span>
                ${isSent ? '<span>✔✔</span>' : ''}
            </div>
        `;
        messagesListEl.appendChild(bubble);
    }

    function scrollToBottom() {
        setTimeout(() => {
            if (messagesListEl) messagesListEl.scrollTop = messagesListEl.scrollHeight;
        }, 50);
    }

    function selectTargetUser(user) {
        playSound('click');
        appState.activeTargetUser = user;
        appState.unreadCounts.delete(user.id);

        noUserSelectedEl.classList.remove('active');
        activeChatContainer.classList.add('active');

        targetUserAvatarEl.textContent = user.avatar;
        targetUserNameEl.textContent = user.name;
        targetUserStatusEl.textContent = user.status || 'آنلاین';

        messagesListEl.innerHTML = '';
        const history = appState.messages.get(user.id) || [];
        history.forEach(msg => appendMessageToDOM(msg));
        scrollToBottom();
        renderUsersSidebar();
    }

    function closeActiveChat() {
        appState.activeTargetUser = null;
        activeChatContainer.classList.remove('active');
        noUserSelectedEl.classList.add('active');
        renderUsersSidebar();
    }

    function renderUsersSidebar() {
        if (!usersListEl) return;
        const searchQuery = (userSearchInput ? userSearchInput.value : '').trim().toLowerCase();
        usersListEl.innerHTML = '';

        let usersArray = Array.from(appState.users.values());
        if (searchQuery) {
            usersArray = usersArray.filter(u => u.name.toLowerCase().includes(searchQuery));
        }

        usersArray.sort((a, b) => {
            if (a.isBot === b.isBot) return a.name.localeCompare(b.name);
            return a.isBot ? 1 : -1;
        });

        if (onlineCountNumber) onlineCountNumber.textContent = appState.users.size + 1;
        if (sidebarUserCount) sidebarUserCount.textContent = appState.users.size;

        if (usersArray.length === 0) {
            usersListEl.innerHTML = `
                <div style="text-align:center;padding:25px;color:var(--text-muted);font-size:0.88rem;">
                    <p>کاربری یافت نشد...</p>
                </div>
            `;
            return;
        }

        usersArray.forEach(user => {
            const item = document.createElement('div');
            const isActive = appState.activeTargetUser && appState.activeTargetUser.id === user.id;
            const unread = appState.unreadCounts.get(user.id) || 0;

            item.className = `user-item ${isActive ? 'active' : ''}`;
            item.innerHTML = `
                <div class="user-item-left">
                    <div class="user-avatar-box">
                        <span>${user.avatar}</span>
                        <span class="status-dot ${user.isBot ? 'bot' : ''}"></span>
                    </div>
                    <div class="user-meta">
                        <h5>
                            <span>${user.name}</span>
                            ${user.isBot ? '<span class="bot-tag">ربات</span>' : ''}
                        </h5>
                        <p>${user.status || 'آنلاین و آماده گفتگو...'}</p>
                    </div>
                </div>
                ${unread > 0 ? `<div class="unread-badge">${unread}</div>` : ''}
            `;
            item.addEventListener('click', () => selectTargetUser(user));
            usersListEl.appendChild(item);
        });
    }

    if (userSearchInput) userSearchInput.addEventListener('input', renderUsersSidebar);

    // =========================================================================
    // 7. EMOJI & CONTROLS
    // =========================================================================
    const EMOJIS_LIST = [
        '😀', '😁', '😂', '😎', '😍', '🥳', '🤩', '😇', '❤️', '🔥',
        '⚡', '✨', '🎉', '🚀', '👑', '💎', '💡', '🌟', '💥', '💯',
        '👍', '👏', '🙌', '🤝', '🙌', '🤖', '🦊', '🐼', '🐱', '🐶',
        '🌈', '🍕', '🍔', '🍦', '☕', '🎸', '🎮', '💻', '🔮', '🏆'
    ];

    function initEmojiPicker() {
        if (!emojiGridEl) return;
        emojiGridEl.innerHTML = '';
        EMOJIS_LIST.forEach(em => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'emoji-btn';
            btn.textContent = em;
            btn.addEventListener('click', () => {
                if (messageInput) {
                    messageInput.value += em;
                    messageInput.focus();
                }
            });
            emojiGridEl.appendChild(btn);
        });
    }
    initEmojiPicker();

    if (btnEmojiToggle) btnEmojiToggle.addEventListener('click', () => {
        playSound('click');
        if (emojiPickerPanel) emojiPickerPanel.classList.toggle('hidden');
    });

    if (btnQuickEffect) btnQuickEffect.addEventListener('click', () => {
        playSound('fx');
        triggerConfettiBurst(window.innerWidth / 2, window.innerHeight - 100);
        if (appState.activeTargetUser) {
            sendMessage('🔥❤️⚡✨🎉');
        }
    });

    if (btnTriggerConfetti) btnTriggerConfetti.addEventListener('click', () => triggerConfettiBurst());

    if (btnClearChat) btnClearChat.addEventListener('click', () => {
        if (!appState.activeTargetUser) return;
        playSound('click');
        appState.messages.set(appState.activeTargetUser.id, []);
        if (messagesListEl) messagesListEl.innerHTML = '';
    });

    if (btnTheme) btnTheme.addEventListener('click', () => {
        playSound('click');
        const oldTheme = appState.themes[appState.currentThemeIdx];
        appState.currentThemeIdx = (appState.currentThemeIdx + 1) % appState.themes.length;
        const newTheme = appState.themes[appState.currentThemeIdx];
        document.body.classList.remove(oldTheme);
        document.body.classList.add(newTheme);
        triggerConfettiBurst(btnTheme.getBoundingClientRect().left, btnTheme.getBoundingClientRect().top, ['✨', '🎨', '🌟']);
    });

    if (btnSound) btnSound.addEventListener('click', () => {
        appState.soundEnabled = !appState.soundEnabled;
        if (appState.soundEnabled) {
            btnSound.textContent = '🔊';
            btnSound.classList.add('active');
            playSound('click');
        } else {
            btnSound.textContent = '🔇';
            btnSound.classList.remove('active');
        }
    });

    // =========================================================================
    // 8. LOGIN / ENTER CHAT HANDLERS
    // =========================================================================
    if (avatarOptions) {
        avatarOptions.forEach(opt => {
            opt.addEventListener('click', () => {
                playSound('click');
                avatarOptions.forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
            });
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = (usernameInput ? usernameInput.value : '').trim();
            if (!username) {
                if (usernameInput) usernameInput.focus();
                return;
            }

            const selectedAvatarEl = document.querySelector('.avatar-option.selected') || (avatarOptions && avatarOptions[0]);
            const avatar = selectedAvatarEl ? selectedAvatarEl.getAttribute('data-avatar') : '😎';
            const status = (statusInput && statusInput.value.trim()) || 'آماده برای گفتگو! ✨';

            appState.currentUser = {
                id: 'user_' + Math.random().toString(36).substr(2, 9),
                name: username,
                avatar: avatar,
                status: status,
                isBot: false
            };

            appState.botsEnabled = includeBotsCheck ? includeBotsCheck.checked : true;
            if (appState.botsEnabled) {
                PRELOADED_BOTS.forEach(bot => appState.users.set(bot.id, bot));
            }

            if (headerMyAvatar) headerMyAvatar.textContent = avatar;
            if (headerMyName) headerMyName.textContent = username;

            if (loginScreen) loginScreen.classList.remove('active');
            if (chatScreen) chatScreen.classList.add('active');

            initNetworkEngine();
            renderUsersSidebar();
            playSound('login');
            triggerConfettiBurst();
            checkOfflineUsers();
        });
    }

    if (btnLogout) btnLogout.addEventListener('click', () => {
        playSound('click');
        if (appState.currentUser) {
            broadcast('USER_LOGOUT', { userId: appState.currentUser.id });
            try {
                const raw = safeGetStorage('cyberchat_users_registry') || '{}';
                const registry = JSON.parse(raw);
                delete registry[appState.currentUser.id];
                safeSetStorage('cyberchat_users_registry', JSON.stringify(registry));
            } catch (e) {}
        }

        appState.currentUser = null;
        appState.activeTargetUser = null;
        appState.users.clear();

        if (chatScreen) chatScreen.classList.remove('active');
        if (loginScreen) loginScreen.classList.add('active');
    });

    if (messageForm) messageForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (messageInput) sendMessage(messageInput.value);
    });

    if (btnOpenNewTab) btnOpenNewTab.addEventListener('click', () => {
        playSound('click');
        window.open(window.location.href, '_blank');
    });

    if (btnGuide) btnGuide.addEventListener('click', () => {
        playSound('click');
        if (modalGuide) modalGuide.classList.remove('hidden');
    });

    if (btnP2pShare) btnP2pShare.addEventListener('click', () => {
        playSound('click');
        if (modalGuide) modalGuide.classList.remove('hidden');
        if (modalTabBtns) modalTabBtns.forEach(b => b.classList.remove('active'));
        if (modalTabContents) modalTabContents.forEach(c => c.classList.add('hidden'));
        const p2pTabBtn = document.querySelector('[data-target="tab-p2p"]');
        const p2pTabContent = document.getElementById('tab-p2p');
        if (p2pTabBtn) p2pTabBtn.classList.add('active');
        if (p2pTabContent) p2pTabContent.classList.remove('hidden');
        initPeerJS();
    });

    if (btnCloseModal) btnCloseModal.addEventListener('click', () => {
        playSound('click');
        if (modalGuide) modalGuide.classList.add('hidden');
    });

    if (modalTabBtns) {
        modalTabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                playSound('click');
                modalTabBtns.forEach(b => b.classList.remove('active'));
                modalTabContents.forEach(c => c.classList.add('hidden'));

                btn.classList.add('active');
                const targetId = btn.getAttribute('data-target');
                const targetContent = document.getElementById(targetId);
                if (targetContent) targetContent.classList.remove('hidden');

                if (targetId === 'tab-p2p') {
                    initPeerJS();
                }
            });
        });
    }

    function initPeerJS() {
        if (appState.peer) return;
        const myPeerIdEl = document.getElementById('my-peer-id');
        const p2pStatusEl = document.getElementById('p2p-status-text');
        if (p2pStatusEl) p2pStatusEl.textContent = 'در حال اتصال به سرور سیگنالینگ WebRTC...';

        try {
            if (typeof Peer === 'undefined') {
                if (p2pStatusEl) p2pStatusEl.textContent = 'برای قابلیت P2P نیاز به اتصال به اینترنت جهت بارگذاری PeerJS است.';
                return;
            }
            appState.peer = new Peer();
            appState.peer.on('open', (id) => {
                if (myPeerIdEl) myPeerIdEl.value = id;
                if (p2pStatusEl) p2pStatusEl.textContent = 'آماده اتصال! کد خود را برای دوستتان بفرستید.';
            });
            appState.peer.on('connection', (conn) => setupP2PConnection(conn, p2pStatusEl));
        } catch (e) {
            if (p2pStatusEl) p2pStatusEl.textContent = 'خطا در بارگذاری PeerJS';
        }
    }

    function setupP2PConnection(conn, statusEl) {
        appState.peerConnection = conn;
        conn.on('open', () => {
            if (statusEl) statusEl.textContent = `متصل شدید به: ${conn.peer} 🟢`;
            playSound('login');
            triggerConfettiBurst();
            if (appState.currentUser) conn.send({ type: 'P2P_PROFILE', user: appState.currentUser });
        });
        conn.on('data', (data) => {
            if (data.type === 'P2P_PROFILE' && data.user) {
                const pUser = data.user;
                pUser.status = `🌐 متصل از راه دور (WebRTC)`;
                appState.users.set(pUser.id, pUser);
                renderUsersSidebar();
                playSound('receive');
            }
            else if (data.type === 'P2P_MESSAGE') {
                receiveMessage(data.senderId, data.message);
            }
        });
        conn.on('close', () => {
            if (statusEl) statusEl.textContent = 'اتصال P2P قطع شد 🔴';
        });
    }

    const btnCopyPeer = document.getElementById('btn-copy-peer');
    if (btnCopyPeer) btnCopyPeer.addEventListener('click', () => {
        const myPeerIdEl = document.getElementById('my-peer-id');
        if (!myPeerIdEl || !myPeerIdEl.value || myPeerIdEl.value.includes('در حال')) return;
        navigator.clipboard.writeText(myPeerIdEl.value);
        playSound('click');
        alert('کد اتصال در کلیپ‌بورد کپی شد!');
    });

    const btnConnectFriend = document.getElementById('btn-connect-friend');
    if (btnConnectFriend) btnConnectFriend.addEventListener('click', () => {
        const friendEl = document.getElementById('friend-peer-id');
        const friendId = friendEl ? friendEl.value.trim() : '';
        const p2pStatusEl = document.getElementById('p2p-status-text');
        if (!friendId || !appState.peer) return;

        if (p2pStatusEl) p2pStatusEl.textContent = 'در حال برقراری ارتباط با دوست...';
        const conn = appState.peer.connect(friendId);
        setupP2PConnection(conn, p2pStatusEl);
    });

    if (modalGuide) modalGuide.addEventListener('click', (e) => {
        if (e.target === modalGuide) modalGuide.classList.add('hidden');
    });

    if (usernameInput) usernameInput.focus();
});
