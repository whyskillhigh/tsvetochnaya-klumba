/**
 * SocialBridge v5.0 — Унифицированный мост для платформ VK Games и Одноклассники
 * - Безопасная инициализация vkBridge (VKWebAppInit + предзагрузка VKWebAppCheckNativeAds)
 * - Нативная реклама VK Bridge: VKWebAppShowNativeAds ('reward' и 'interstitial')
 * - Строгий кулдаун 90 000 мс (90с) для межэкранной рекламы на переходах между раундами
 * - Анти-мок защита для модерации: в среде ВК/ОК НИКОГДА не показывается _showMockAd
 * - Автоматическая пауза/возобновление игрового аудио на время показа рекламы
 * - Облачное сохранение прогресса через VKWebAppStorageSet / VKWebAppStorageGet + localStorage
 */

(function () {
    'use strict';

    const INTERSTITIAL_COOLDOWN_MS = 90000;

    class SocialBridge {
        constructor(gamePrefix = 'game', options = {}) {
            this.prefix = gamePrefix;
            this._audioRef = options.audio || null;
            this.platform = this._detectPlatform();
            this.isSocialEnv = this._isSocialEnvironment();
            this.isAdShowing = false;
            this.lastInterstitialAt = 0;
            this.interstitialCooldownMs = INTERSTITIAL_COOLDOWN_MS;
            this._rewardPreloaded = false;
            this._interstitialPreloaded = false;
            this._lifecycleBound = false;
            this.coins = parseInt(this.loadCloudProgress('coins', 100), 10) || 0;

            this._applyPlatformBodyClasses();
            this._bindLifecycleEvents();
            this._initUI();
            this._initVKBridge();
        }

        _applyPlatformBodyClasses() {
            if (!document.body) return;
            try {
                const urlParams = new URLSearchParams(window.location.search || '');
                const vkPlatform = urlParams.get('vk_platform') || '';
                const s = this._getSocialSignals();
                if (this.isSocialEnv) {
                    document.body.classList.add('vk-env');
                    if (['mobile_ios', 'mobile_android', 'mobile_iphone', 'mobile_ipad'].includes(vkPlatform) || s.isWebView) {
                        document.body.classList.add('vk-mobile-app');
                    }
                }
            } catch (_) {}
        }

        _bindLifecycleEvents() {
            if (this._lifecycleBound) return;
            this._lifecycleBound = true;
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    this._pauseGameAudio();
                } else if (!this.isAdShowing) {
                    this._resumeGameAudio();
                }
            });
            try {
                if (window.vkBridge && typeof window.vkBridge.subscribe === 'function') {
                    window.vkBridge.subscribe((event) => {
                        const detail = event && event.detail;
                        if (!detail) return;
                        if (detail.type === 'VKWebAppUpdateConfig' && detail.data && detail.data.insets) {
                            const insets = detail.data.insets;
                            document.documentElement.style.setProperty('--vk-inset-top', `${insets.top || 0}px`);
                            document.documentElement.style.setProperty('--vk-inset-bottom', `${insets.bottom || 0}px`);
                        } else if (detail.type === 'VKWebAppViewHide') {
                            this._pauseGameAudio();
                        } else if (detail.type === 'VKWebAppViewRestore') {
                            if (!this.isAdShowing) this._resumeGameAudio();
                        }
                    });
                }
            } catch (_) {}
        }

        _getSocialSignals() {
            let search = '';
            try {
                search = window.location.search || '';
            } catch (_) {}
            const urlParams = new URLSearchParams(search);

            const vkKeys = [
                'vk_app_id',
                'vk_user_id',
                'api_id',
                'vk_platform',
                'vk_is_app_user',
                'vk_access_token_settings'
            ];
            const okKeys = [
                'odr_enabled',
                'logged_user_id',
                'application_key',
                'apiconnection',
                'session_key'
            ];

            const hasVkParams = vkKeys.some((k) => urlParams.has(k));
            const hasOkParams = okKeys.some((k) => urlParams.has(k));

            let isEmbedded = false;
            try {
                if (window.vkBridge && typeof window.vkBridge.isEmbedded === 'function' && window.vkBridge.isEmbedded()) {
                    isEmbedded = true;
                } else if (window.self !== window.top) {
                    isEmbedded = true;
                }
            } catch (_) {
                isEmbedded = true;
            }

            let isWebView = false;
            try {
                if (window.vkBridge && typeof window.vkBridge.isWebView === 'function' && window.vkBridge.isWebView()) {
                    isWebView = true;
                }
            } catch (_) {}

            let ref = '';
            try {
                ref = (document.referrer || '').toLowerCase();
            } catch (_) {}

            const hasOkRef = /(^|[/.])(ok\.ru|odnoklassniki\.ru|ok\.mail\.ru)/.test(ref);
            const hasVkRef = /(^|[/.])(vk\.com|vk\.ru|vk-apps\.com|mvk\.com)/.test(ref);
            const hasFapi = !!(window.FAPI && (window.FAPI.UI || window.FAPI.Client));

            return { hasVkParams, hasOkParams, isEmbedded, isWebView, hasVkRef, hasOkRef, hasFapi };
        }

        _detectPlatform() {
            const s = this._getSocialSignals();
            if (s.hasOkParams || s.hasOkRef || s.hasFapi) return 'ok';
            if (s.hasVkParams || s.hasVkRef || s.isWebView || s.isEmbedded) return 'vk';
            return 'standalone';
        }

        _isSocialEnvironment() {
            const s = this._getSocialSignals();
            return (
                s.hasVkParams ||
                s.hasOkParams ||
                s.isEmbedded ||
                s.isWebView ||
                s.hasVkRef ||
                s.hasOkRef ||
                s.hasFapi ||
                this.platform === 'vk' ||
                this.platform === 'ok'
            );
        }

        _isLocalDebugMockAllowed() {
            if (this._isSocialEnvironment()) return false;
            let host = '';
            let proto = '';
            try {
                host = (window.location.hostname || '').toLowerCase();
                proto = (window.location.protocol || '').toLowerCase();
            } catch (_) {}
            return host === 'localhost' || host === '127.0.0.1' || host === '::1' || proto === 'file:';
        }

        _canUseVkBridge() {
            try {
                return !!(window.vkBridge && typeof window.vkBridge.send === 'function');
            } catch (_) {
                return false;
            }
        }

        _canUseVkStorage() {
            return (this.platform === 'vk' || this.platform === 'ok') && this._canUseVkBridge();
        }

        _storageKey(key) {
            return this.platform === 'ok' ? `${this.prefix}_ok_${key}` : `${this.prefix}_${key}`;
        }

        _isActivelyHostedInContainer() {
            try {
                if (window.self !== window.top) return true;
                if (window.vkBridge) {
                    if (typeof window.vkBridge.isEmbedded === 'function' && window.vkBridge.isEmbedded()) return true;
                    if (typeof window.vkBridge.isWebView === 'function' && window.vkBridge.isWebView()) return true;
                }
                if (window.FAPI && (window.FAPI.UI || window.FAPI.Client)) return true;
            } catch (_) {
                return true;
            }
            return false;
        }

        _sendVkBridgeWithTimeout(method, params, hostedTimeoutMs = 60000, unhostedTimeoutMs = 1000) {
            const timeoutMs = this._isActivelyHostedInContainer() ? hostedTimeoutMs : unhostedTimeoutMs;
            return new Promise((resolve, reject) => {
                let settled = false;
                const timer = setTimeout(() => {
                    if (settled) return;
                    settled = true;
                    reject(new Error(`VK Bridge timeout: ${method}`));
                }, timeoutMs);

                try {
                    Promise.resolve(window.vkBridge.send(method, params))
                        .then((res) => {
                            if (settled) return;
                            settled = true;
                            clearTimeout(timer);
                            resolve(res);
                        })
                        .catch((err) => {
                            if (settled) return;
                            settled = true;
                            clearTimeout(timer);
                            reject(err);
                        });
                } catch (err) {
                    if (settled) return;
                    settled = true;
                    clearTimeout(timer);
                    reject(err);
                }
            });
        }

        _initVKBridge() {
            if (!this._canUseVkBridge()) return;
            try {
                window.vkBridge.send('VKWebAppInit')
                    .then(() => {
                        window.vkBridge.send('VKWebAppSetViewSettings', {
                            status_bar_style: 'light',
                            action_bar_color: '#4b8332',
                            navigation_bar_color: '#214515'
                        }).catch(() => {});
                        this._preloadNativeAds();
                    })
                    .catch(() => {
                        // В десктопном веб-просмотре или вне контейнера ВК игнорируем отклонение init
                    });

                // Предварительная проверка наличия рекламы, если контейнер активен
                if (this.isSocialEnv) {
                    this._preloadNativeAds();
                }
            } catch (_) {}
        }

        _preloadNativeAds() {
            if (!this._canUseVkBridge()) return;
            try {
                window.vkBridge.send('VKWebAppCheckNativeAds', { ad_format: 'reward' })
                    .then((res) => {
                        this._rewardPreloaded = !!(res && res.result);
                    })
                    .catch(() => {});

                window.vkBridge.send('VKWebAppCheckNativeAds', { ad_format: 'interstitial' })
                    .then((res) => {
                        this._interstitialPreloaded = !!(res && res.result);
                    })
                    .catch(() => {});
            } catch (_) {}
        }

        _getAudioController() {
            if (this._audioRef) return this._audioRef;
            return window.soundEffects || window.flowerAudio || window.mushroomAudio || window.teaAudio || null;
        }

        _pauseGameAudio() {
            try {
                const audio = this._getAudioController();
                if (audio && typeof audio.pauseForAd === 'function') {
                    audio.pauseForAd();
                }
            } catch (_) {}
        }

        _resumeGameAudio() {
            try {
                const audio = this._getAudioController();
                if (audio && typeof audio.resumeAfterAd === 'function') {
                    audio.resumeAfterAd();
                }
            } catch (_) {}
        }

        _initUI() {
            if (!document.getElementById('socialBridgeContainer')) {
                const container = document.createElement('div');
                container.id = 'socialBridgeContainer';
                container.innerHTML = `
                    <div id="sbToast" class="sb-toast hidden"></div>
                    <div id="sbAdOverlay" class="sb-ad-overlay hidden">
                        <div class="sb-ad-box">
                            <div class="sb-ad-header">
                                <span class="sb-ad-badge">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="vertical-align:-2px;margin-right:4px;"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                                    ТЕСТ РЕКЛАМЫ (LOCAL)
                                </span>
                                <span id="sbAdTimer" class="sb-ad-timer">3с</span>
                            </div>
                            <div class="sb-ad-content">
                                <div class="sb-ad-icon">
                                    <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#ffd54f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <rect x="3" y="8" width="18" height="4" rx="1" fill="#ffb300" fill-opacity="0.25"/>
                                        <path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/>
                                        <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/>
                                    </svg>
                                </div>
                                <div class="sb-ad-title">Локальная отладка рекламы</div>
                                <div class="sb-ad-desc">В среде VK Games / Одноклассники здесь воспроизводится реальный нативный ролик площадки.</div>
                                <div class="sb-ad-progress"><div id="sbAdProgressBar" class="sb-ad-bar"></div></div>
                            </div>
                            <div class="sb-ad-footer">
                                <button id="sbAdCloseBtn" class="sb-ad-btn disabled" disabled>Осталось: 3с</button>
                            </div>
                        </div>
                    </div>
                `;
                document.body.appendChild(container);

                const style = document.createElement('style');
                style.textContent = `
                    .sb-toast {
                        position: fixed;
                        top: 22px; left: 50%; transform: translateX(-50%);
                        background: #2e7d32; color: #ffffff;
                        font-family: "Rubik", "Nunito", -apple-system, sans-serif;
                        font-size: 15px; font-weight: 800;
                        padding: 10px 18px; border-radius: 14px;
                        box-shadow: 0 6px 20px rgba(0,0,0,0.48);
                        z-index: 99999; pointer-events: none;
                        transition: opacity 0.25s, transform 0.25s;
                        text-align: center; border: 2px solid #9be49d; max-width: 90vw;
                    }
                    .sb-toast.error {
                        background: #b71c1c;
                        border-color: #ef9a9a;
                    }
                    .sb-toast.hidden { opacity: 0; transform: translate(-50%, -18px); }
                    .sb-ad-overlay {
                        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                        background: rgba(0, 0, 0, 0.85);
                        display: flex; justify-content: center; align-items: center;
                        z-index: 99998; backdrop-filter: blur(4px);
                    }
                    .sb-ad-overlay.hidden { display: none; }
                    .sb-ad-box {
                        background: linear-gradient(180deg, #4b2814 0%, #2b1509 100%);
                        border: 3px solid #ffb300; border-radius: 20px;
                        width: 330px; max-width: 92vw; padding: 20px; color: #fff;
                        text-align: center; box-shadow: 0 12px 32px rgba(0,0,0,0.72);
                        font-family: "Rubik", "Nunito", -apple-system, sans-serif;
                    }
                    .sb-ad-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
                    .sb-ad-badge { background: #ef6c00; color: #fff; font-size: 12px; font-weight: 800; padding: 4px 10px; border-radius: 8px; display: inline-flex; align-items: center; }
                    .sb-ad-timer { font-size: 17px; font-weight: 900; color: #ffeb3b; }
                    .sb-ad-icon { margin: 10px 0; animation: sbBounce 0.8s infinite alternate; display: flex; justify-content: center; }
                    @keyframes sbBounce { from { transform: scale(0.95); } to { transform: scale(1.08); } }
                    .sb-ad-title { font-size: 19px; font-weight: 800; color: #fff9c4; margin-bottom: 6px; }
                    .sb-ad-desc { font-size: 13.5px; color: #e7d8cc; margin-bottom: 16px; line-height: 1.4; font-weight: 700; }
                    .sb-ad-progress { width: 100%; height: 8px; background: rgba(255,255,255,0.15); border-radius: 4px; overflow: hidden; margin-bottom: 16px; }
                    .sb-ad-bar { width: 0%; height: 100%; background: #4caf50; transition: width 0.1s linear; }
                    .sb-ad-btn { width: 100%; padding: 12px; font-size: 16px; font-weight: 800; border-radius: 12px; border: none; cursor: pointer; background: #43a047; color: #fff; font-family: inherit; box-shadow: 0 3px 0 #1b5e20; }
                    .sb-ad-btn.disabled { background: #5d4037; color: #a1887f; cursor: not-allowed; box-shadow: none; }
                `;
                document.head.appendChild(style);
            }
        }

        showToast(message, isError = false) {
            const toast = document.getElementById('sbToast');
            if (!toast) return;
            toast.textContent = message;
            toast.classList.toggle('error', !!isError);
            toast.classList.remove('hidden');
            clearTimeout(this._toastTimer);
            this._toastTimer = setTimeout(() => {
                toast.classList.add('hidden');
            }, 2800);
        }

        showRewardVideo(onRewarded, onError) {
            return this.showRewardedAd(onRewarded, onError);
        }

        showRewardedAd(onRewarded, onError) {
            if (this.isAdShowing) return;

            const isSocial = this._isSocialEnvironment();

            // 1. Среда VK Games / Одноклассники: только официальный вызов VK Bridge и НИКАКОЙ фейковой заглушки
            if (isSocial) {
                if (!this._canUseVkBridge()) {
                    this.showToast('Реклама сейчас недоступна, попробуйте чуть позже', true);
                    if (onError) onError();
                    return;
                }

                this.isAdShowing = true;
                this._pauseGameAudio();

                try {
                    this._sendVkBridgeWithTimeout('VKWebAppShowNativeAds', { ad_format: 'reward' }, 60000, 1000)
                        .then((data) => {
                            this.isAdShowing = false;
                            this._resumeGameAudio();
                            try {
                                window.vkBridge.send('VKWebAppCheckNativeAds', { ad_format: 'reward' }).catch(() => {});
                            } catch (_) {}

                            if (data && data.result) {
                                this.showToast('Награда начислена!');
                                if (onRewarded) onRewarded();
                            } else {
                                this.showToast('Реклама сейчас недоступна, попробуйте чуть позже', true);
                                if (onError) onError();
                            }
                        })
                        .catch(() => {
                            this.isAdShowing = false;
                            this._resumeGameAudio();
                            this.showToast('Реклама сейчас недоступна, попробуйте чуть позже', true);
                            if (onError) onError();
                        });
                } catch (_) {
                    this.isAdShowing = false;
                    this._resumeGameAudio();
                    this.showToast('Реклама сейчас недоступна, попробуйте чуть позже', true);
                    if (onError) onError();
                }
                return;
            }

            // 2. Локальная отладка (localhost / 127.0.0.1 без параметров соцсети)
            if (this._isLocalDebugMockAllowed()) {
                this.isAdShowing = true;
                this._pauseGameAudio();
                this._showMockAd(onRewarded);
                return;
            }

            // 3. Автономный веб вне локалхоста без рекламного моста
            this.showToast('Реклама сейчас недоступна, попробуйте чуть позже', true);
            if (onError) onError();
        }

        showInterstitialAd(onDone) {
            let called = false;
            const finish = () => {
                if (called) return;
                called = true;
                if (onDone) onDone();
            };

            if (this.isAdShowing) {
                finish();
                return;
            }

            const now = Date.now();
            if (now - this.lastInterstitialAt < this.interstitialCooldownMs) {
                finish();
                return;
            }

            // Показываем реальную межэкранную рекламу только внутри VK/OK при активном мосте
            if (!this._isSocialEnvironment() || !this._canUseVkBridge()) {
                finish();
                return;
            }

            this.isAdShowing = true;
            this._pauseGameAudio();

            try {
                this._sendVkBridgeWithTimeout('VKWebAppShowNativeAds', { ad_format: 'interstitial' }, 45000, 1000)
                    .then((data) => {
                        this.isAdShowing = false;
                        this._resumeGameAudio();
                        if (data && data.result) {
                            this.lastInterstitialAt = Date.now();
                        }
                        try {
                            window.vkBridge.send('VKWebAppCheckNativeAds', { ad_format: 'interstitial' }).catch(() => {});
                        } catch (_) {}
                        finish();
                    })
                    .catch(() => {
                        this.isAdShowing = false;
                        this._resumeGameAudio();
                        finish();
                    });
            } catch (_) {
                this.isAdShowing = false;
                this._resumeGameAudio();
                finish();
            }
        }

        _showMockAd(onRewarded) {
            const overlay = document.getElementById('sbAdOverlay');
            const timerEl = document.getElementById('sbAdTimer');
            const barEl = document.getElementById('sbAdProgressBar');
            const btn = document.getElementById('sbAdCloseBtn');

            if (!overlay || !timerEl || !barEl || !btn) {
                this.isAdShowing = false;
                this._resumeGameAudio();
                if (onRewarded) onRewarded();
                return;
            }

            overlay.classList.remove('hidden');
            btn.classList.add('disabled');
            btn.disabled = true;
            btn.onclick = null;

            let timeLeft = 3;
            timerEl.textContent = `${timeLeft}с`;
            btn.textContent = `Осталось: ${timeLeft}с`;
            barEl.style.width = '0%';

            const interval = setInterval(() => {
                timeLeft--;
                barEl.style.width = `${((3 - Math.max(0, timeLeft)) / 3) * 100}%`;

                if (timeLeft > 0) {
                    timerEl.textContent = `${timeLeft}с`;
                    btn.textContent = `Осталось: ${timeLeft}с`;
                } else {
                    clearInterval(interval);
                    timerEl.textContent = 'Готово!';
                    btn.classList.remove('disabled');
                    btn.disabled = false;
                    btn.textContent = 'ПОЛУЧИТЬ НАГРАДУ!';
                    btn.onclick = () => {
                        clearInterval(interval);
                        overlay.classList.add('hidden');
                        this.isAdShowing = false;
                        this._resumeGameAudio();
                        this.showToast('Награда начислена!');
                        if (onRewarded) onRewarded();
                    };
                }
            }, 800);
        }

        makePurchase(itemName, priceCoins, onPurchased, onError) {
            if (this.coins >= priceCoins) {
                this.coins -= priceCoins;
                this.saveCloudProgress('coins', this.coins);
                this.showToast(`Куплено: ${itemName}`);
                if (onPurchased) onPurchased();
                return true;
            } else {
                this.showToast(`Не хватает ${priceCoins - this.coins} монет! Посмотрите видео.`, true);
                if (onError) onError();
                return false;
            }
        }

        addCoins(amount) {
            this.coins += amount;
            this.saveCloudProgress('coins', this.coins);
            this.showToast(`+${amount} монет в копилку!`);
            return this.coins;
        }

        setCoins(amount) {
            this.coins = Math.max(0, parseInt(amount, 10) || 0);
            this.saveCloudProgress('coins', this.coins);
            return this.coins;
        }

        getCoins() {
            return this.coins;
        }

        saveCloudProgress(key, data) {
            const fullKey = this._storageKey(key);
            const serialized = JSON.stringify(data);
            try {
                localStorage.setItem(fullKey, serialized);
            } catch (e) {
                console.warn('Storage save error:', e);
            }

            if (this._canUseVkStorage()) {
                try {
                    window.vkBridge.send('VKWebAppStorageSet', {
                        key: fullKey,
                        value: serialized
                    }).catch(() => {});
                } catch (_) {}
            }
        }

        loadCloudProgress(key, defaultVal) {
            const fullKey = this._storageKey(key);
            try {
                const raw = localStorage.getItem(fullKey);
                return raw !== null ? JSON.parse(raw) : defaultVal;
            } catch (e) {
                return defaultVal;
            }
        }

        loadCloudProgressAsync(key, defaultVal) {
            return this.hydrateCloudProgress([key]).then((map) => {
                if (Object.prototype.hasOwnProperty.call(map, key)) {
                    return map[key];
                }
                return this.loadCloudProgress(key, defaultVal);
            });
        }

        hydrateCloudProgress(keys = [], onHydrated) {
            const list = Array.isArray(keys) ? keys : [];
            if (!list.length || !this._canUseVkStorage()) {
                return Promise.resolve({});
            }

            const keyPrefix = this.platform === 'ok' ? `${this.prefix}_ok_` : `${this.prefix}_`;
            const fullKeys = list.map((k) => this._storageKey(k));
            try {
                return this._sendVkBridgeWithTimeout('VKWebAppStorageGet', { keys: fullKeys }, 5000, 800)
                    .then((res) => {
                        const result = {};
                        const items = (res && Array.isArray(res.keys)) ? res.keys : [];
                        items.forEach((entry) => {
                            if (!entry || typeof entry.key !== 'string' || !entry.value) return;
                            const shortKey = entry.key.startsWith(keyPrefix)
                                ? entry.key.slice(keyPrefix.length)
                                : entry.key;
                            try {
                                const parsed = JSON.parse(entry.value);
                                result[shortKey] = parsed;
                                if (localStorage.getItem(entry.key) === null) {
                                    localStorage.setItem(entry.key, JSON.stringify(parsed));
                                    if (shortKey === 'coins' && typeof parsed === 'number' && !Number.isNaN(parsed)) {
                                        this.coins = parsed;
                                    }
                                }
                            } catch (_) {}
                        });
                        if (onHydrated) onHydrated(result);
                        return result;
                    })
                    .catch(() => ({}));
            } catch (_) {
                return Promise.resolve({});
            }
        }

        async sharePost(message) {
            if (!this.isSocialEnv || !this._canUseVkBridge()) return false;
            try {
                await this._sendVkBridgeWithTimeout('VKWebAppShowWallPostBox', { message }, 30000, 1000);
                return true;
            } catch (_) {
                return false;
            }
        }
    }

    window.SocialBridge = SocialBridge;
    window.SocialBridge.INTERSTITIAL_COOLDOWN_MS = INTERSTITIAL_COOLDOWN_MS;
})();
