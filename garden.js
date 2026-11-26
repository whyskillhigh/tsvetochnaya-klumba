/**
 * Цветочная Клумба: «Мой Сад» (мета-игра обустройства дачной усадьбы v7.0)
 * - 8 пошаговых этапов расчистки, стройки и посадки цветов за заработанные монеты
 * - Выбор стиля/сорта (3 варианта) для готовых объектов + бесконечное удобрение грядок
 * - Пассивный урожай монет с усадьбы и ежедневный подарок садовода
 * - Синхронизация через SocialBridge (VK Storage / OK Storage / localStorage)
 */

(function () {
    'use strict';

    const GARDEN_STAGES = [
        {
            id: 0,
            title: 'Расчистить старый бурьян',
            desc: 'Убери сорняки и камни, чтобы разбить свежий весенний газон.',
            cost: 80,
            income: 6,
            choices: null
        },
        {
            id: 1,
            title: 'Поставить новый забор и калитку',
            desc: 'Замени покосившиеся доски на крепкий забор с калиткой.',
            cost: 140,
            income: 10,
            choices: ['Тёплый дуб', 'Белый прованс', 'Садовый зелёный']
        },
        {
            id: 2,
            title: 'Выложить садовую дорожку',
            desc: 'Проложи удобную тропинку от калитки до крыльца дома.',
            cost: 200,
            income: 14,
            choices: ['Природный камень', 'Красный кирпичик', 'Мозаика галькой']
        },
        {
            id: 3,
            title: 'Посадить клумбу у крыльца',
            desc: 'Выбери любимые цветы, которые украсят фасад дачи!',
            cost: 260,
            income: 20,
            choices: ['Бархатцы', 'Ромашки', 'Пионы']
        },
        {
            id: 4,
            title: 'Поставить скамейку и фонарь',
            desc: 'Уютное место для отдыха вечером под тёплым огоньком.',
            cost: 340,
            income: 26,
            choices: ['Уютный дуб', 'Кованая бронза', 'Лазурная скамья']
        },
        {
            id: 5,
            title: 'Выкопать пруд с кувшинками',
            desc: 'Живой пруд с чистой водой, лилиями и золотыми рыбками!',
            cost: 440,
            income: 34,
            choices: ['Кувшинки и карпы', 'Каменный грот', 'Деревянный мостик']
        },
        {
            id: 6,
            title: 'Посадить цветочную арку и аллею',
            desc: 'Ароматная арка над дорожкой и двойная аллея ярких цветов.',
            cost: 580,
            income: 44,
            choices: ['Розовые пионы', 'Синие васильки', 'Алые тюльпаны']
        },
        {
            id: 7,
            title: 'Построить Беседку и Пасеку',
            desc: 'Ажурная беседка для чаепитий и улей с золотыми пчёлками!',
            cost: 760,
            income: 60,
            choices: ['Золотой павильон', 'Резной теремок', 'Белая ротонда']
        }
    ];

    const DAILY_INTERVAL_MS = 24 * 60 * 60 * 1000;
    const HARVEST_TICK_MS = 3000;

    let api = null;
    let canvas = null;
    let ctx = null;
    let isOpen = false;

    let state = {
        stage: 0,
        choices: {},
        fertilizer: 0,
        lastHarvestAt: Date.now(),
        lastDailyAt: 0
    };

    let particles = [];
    let popups = [];
    let animPhase = 0;

    function loadState() {
        if (!api) return;
        const bridge = api.getBridge();
        const saved = bridge.loadCloudProgress('garden', null);
        applyLoadedState(saved);
    }

    function applyLoadedState(saved) {
        if (!saved || typeof saved !== 'object') return;
        state.stage = Math.max(0, Math.min(GARDEN_STAGES.length, parseInt(saved.stage, 10) || 0));
        state.choices = (saved.choices && typeof saved.choices === 'object') ? saved.choices : {};
        state.fertilizer = Math.max(0, parseInt(saved.fertilizer, 10) || 0);
        state.lastHarvestAt = typeof saved.lastHarvestAt === 'number' ? saved.lastHarvestAt : Date.now();
        state.lastDailyAt = typeof saved.lastDailyAt === 'number' ? saved.lastDailyAt : 0;
    }

    function saveState() {
        if (!api) return;
        api.getBridge().saveCloudProgress('garden', state);
        renderUI();
        syncBadge();
    }

    function getPendingHarvest() {
        if (state.stage <= 0) return 0;
        let ratePerHour = 25 + state.fertilizer * 30;
        for (let i = 0; i < state.stage; i++) {
            ratePerHour += GARDEN_STAGES[i].income;
        }
        const elapsedMs = Math.max(0, Date.now() - state.lastHarvestAt);
        const cap = 60 + state.stage * 35 + state.fertilizer * 45;
        // Минимум +1 монетка каждые ~18 секунд на 1 этапе и быстрее далее, чтобы отдача ощущалась сразу
        const earned = Math.floor((elapsedMs / 3600000) * (ratePerHour * 4));
        return Math.min(cap, Math.max(0, earned));
    }

    function isDailyReady() {
        return (Date.now() - (state.lastDailyAt || 0)) >= DAILY_INTERVAL_MS;
    }

    function formatDailyCooldown() {
        const left = Math.max(0, DAILY_INTERVAL_MS - (Date.now() - state.lastDailyAt));
        const hrs = Math.floor(left / 3600000);
        const mins = Math.floor((left % 3600000) / 60000);
        return `${hrs}ч ${mins}м`;
    }

    function spawnGardenFx(x, y, text, color = '#ffd54f') {
        for (let i = 0; i < 16; i++) {
            const a = Math.random() * Math.PI * 2;
            const sp = 1.2 + Math.random() * 3.8;
            particles.push({
                x, y,
                vx: Math.cos(a) * sp,
                vy: Math.sin(a) * sp - 1.2,
                color: i % 2 === 0 ? color : '#ffffff',
                r: 2.2 + Math.random() * 3,
                alpha: 1.0
            });
        }
        if (text) {
            popups.push({ x, y, text, color, alpha: 1.0, vy: -1.1 });
        }
    }

    function renderUI() {
        const coinsEl = document.getElementById('gardenCoinsVal');
        const stageTitleEl = document.getElementById('gardenTaskTitle');
        const stageDescEl = document.getElementById('gardenTaskDesc');
        const upgradeBtn = document.getElementById('gardenUpgradeBtn');
        const upgradeTxt = document.getElementById('gardenUpgradeBtnText');
        const choicesWrap = document.getElementById('gardenChoicesWrap');
        const harvestBtn = document.getElementById('gardenHarvestBtn');
        const harvestTxt = document.getElementById('gardenHarvestText');
        const dailyBtn = document.getElementById('gardenDailyBtn');
        const dailyTxt = document.getElementById('gardenDailyText');
        const progressEl = document.getElementById('gardenStagePill');

        if (!coinsEl || !api) return;

        const coins = api.getCoins();
        coinsEl.textContent = coins;
        if (progressEl) {
            progressEl.textContent = `Усадьба: ${state.stage}/${GARDEN_STAGES.length}`;
        }

        const pending = getPendingHarvest();
        if (harvestBtn && harvestTxt) {
            harvestTxt.textContent = state.stage <= 0
                ? 'Урожай с 1 этапа'
                : (pending > 0 ? `Собрать +${pending} 🪙` : 'Растёт урожай...');
            harvestBtn.disabled = state.stage <= 0 || pending <= 0;
        }

        if (dailyBtn && dailyTxt) {
            const ready = isDailyReady();
            dailyBtn.disabled = !ready;
            dailyTxt.textContent = ready ? 'Подарок дня!' : `Через ${formatDailyCooldown()}`;
            dailyBtn.classList.toggle('ready', ready);
        }

        if (state.stage < GARDEN_STAGES.length) {
            const cur = GARDEN_STAGES[state.stage];
            stageTitleEl.textContent = `Шаг ${state.stage + 1}/${GARDEN_STAGES.length}: ${cur.title}`;
            stageDescEl.textContent = cur.desc;
            upgradeTxt.textContent = `УЛУЧШИТЬ — ${cur.cost} МОНЕТ`;
            upgradeBtn.classList.toggle('affordable', coins >= cur.cost);
        } else {
            const fertCost = 150 + state.fertilizer * 50;
            stageTitleEl.textContent = `Усадьба расцвела! (Удобрение ур. ${state.fertilizer})`;
            stageDescEl.textContent = 'Все постройки готовы! Меняй стили выше или удобряй грядки для большего дохода.';
            upgradeTxt.textContent = `УДОБРИТЬ САД — ${fertCost} МОНЕТ`;
            upgradeBtn.classList.toggle('affordable', coins >= fertCost);
        }

        // Кнопки выбора стиля для последнего улучшенного объекта (или этапа 3/7 с цветами)
        if (choicesWrap) {
            choicesWrap.innerHTML = '';
            const styleableDone = GARDEN_STAGES.filter(s => s.id < state.stage && Array.isArray(s.choices));
            if (styleableDone.length > 0) {
                const activeEdit = styleableDone[styleableDone.length - 1];
                const curChoice = state.choices[String(activeEdit.id)] || 0;
                const label = document.createElement('span');
                label.className = 'garden-style-label';
                label.textContent = 'Стиль:';
                choicesWrap.appendChild(label);

                activeEdit.choices.forEach((cName, cIdx) => {
                    const chip = document.createElement('button');
                    chip.type = 'button';
                    chip.className = `garden-style-chip ${curChoice === cIdx ? 'active' : ''}`;
                    chip.textContent = cName;
                    chip.addEventListener('click', () => {
                        state.choices[String(activeEdit.id)] = cIdx;
                        if (api.getAudio()) api.getAudio().playSelect();
                        spawnGardenFx(200, 175, cName, '#aed581');
                        saveState();
                    });
                    choicesWrap.appendChild(chip);
                });
            }
        }
    }

    function syncBadge() {
        const dot = document.getElementById('gardenBadgeDot');
        if (!dot || !api) return;
        const coins = api.getCoins();
        const nextCost = state.stage < GARDEN_STAGES.length
            ? GARDEN_STAGES[state.stage].cost
            : (150 + state.fertilizer * 50);
        const show = isDailyReady() || coins >= nextCost || getPendingHarvest() >= 15;
        dot.classList.toggle('hidden', !show);
    }

    function drawGardenScene() {
        if (!ctx) return;
        const W = canvas.width;
        const H = canvas.height;
        const t = animPhase;

        ctx.clearRect(0, 0, W, H);

        // 1. Солнечное небо и облака
        const sky = ctx.createLinearGradient(0, 0, 0, 145);
        sky.addColorStop(0, '#74ccf4');
        sky.addColorStop(1, '#dcf3ff');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, W, 150);

        // Солнце
        ctx.save();
        const sunG = ctx.createRadialGradient(54, 42, 6, 54, 42, 42);
        sunG.addColorStop(0, '#fff9c4');
        sunG.addColorStop(0.55, '#ffd54f');
        sunG.addColorStop(1, 'rgba(255, 213, 79, 0)');
        ctx.fillStyle = sunG;
        ctx.beginPath();
        ctx.arc(54, 42, 42, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Облака
        ctx.fillStyle = 'rgba(255,255,255,0.88)';
        const cloudOff = (t * 10) % (W + 140);
        [[cloudOff - 70, 36], [(cloudOff + 190) % (W + 140) - 70, 52]].forEach(([cx, cy]) => {
            ctx.beginPath();
            ctx.arc(cx, cy, 16, 0, Math.PI * 2);
            ctx.arc(cx + 18, cy - 5, 20, 0, Math.PI * 2);
            ctx.arc(cx + 38, cy, 15, 0, Math.PI * 2);
            ctx.fill();
        });

        // Дальние зелёные холмы
        ctx.fillStyle = '#8bc34a';
        ctx.beginPath();
        ctx.moveTo(0, 130);
        ctx.quadraticCurveTo(100, 95, 210, 124);
        ctx.quadraticCurveTo(320, 146, W, 114);
        ctx.lineTo(W, 170);
        ctx.lineTo(0, 170);
        ctx.closePath();
        ctx.fill();

        // Газон: неухоженный пустырь (stage 0) или сочная трава (stage >= 1)
        const lawnGrad = ctx.createLinearGradient(0, 125, 0, H);
        if (state.stage === 0) {
            lawnGrad.addColorStop(0, '#9e9d68');
            lawnGrad.addColorStop(1, '#6f7344');
        } else {
            lawnGrad.addColorStop(0, '#7cb342');
            lawnGrad.addColorStop(1, '#4b8332');
        }
        ctx.fillStyle = lawnGrad;
        ctx.fillRect(0, 125, W, H - 125);

        // Старые доски забора до починки (stage < 2)
        if (state.stage < 2) {
            ctx.fillStyle = '#6d4c41';
            for (let x = 8; x < W; x += 26) {
                ctx.save();
                ctx.translate(x, 120);
                ctx.rotate(((x % 3) - 1) * 0.08);
                ctx.fillRect(0, -18, 12, 32);
                ctx.restore();
            }
        } else {
            // Новый покрашенный забор (Этап 2)
            const c2 = state.choices['1'] || 0;
            const fenceCol = c2 === 1 ? '#f5f5f5' : (c2 === 2 ? '#a5d6a7' : '#d7a86e');
            const fenceStroke = c2 === 1 ? '#b0bec5' : (c2 === 2 ? '#2e7d32' : '#795548');
            ctx.fillStyle = fenceCol;
            ctx.strokeStyle = fenceStroke;
            ctx.lineWidth = 1.5;
            ctx.fillRect(0, 122, W, 7);
            ctx.strokeRect(0, 122, W, 7);
            for (let x = 8; x < W; x += 20) {
                if (x > 168 && x < 232) continue;
                ctx.beginPath();
                ctx.moveTo(x, 102);
                ctx.lineTo(x + 7, 94);
                ctx.lineTo(x + 14, 102);
                ctx.lineTo(x + 14, 134);
                ctx.lineTo(x, 134);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            }
        }

        // Уютный дачный домик справа-сзади
        ctx.save();
        // Стены
        ctx.fillStyle = '#ffe0b2';
        ctx.strokeStyle = '#6d4c41';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(248, 72, 126, 74, 4);
        ctx.fill();
        ctx.stroke();
        // Дымоход и дымок
        ctx.fillStyle = '#8d6e63';
        ctx.fillRect(340, 34, 14, 24);
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        for (let i = 0; i < 3; i++) {
            const dy = ((t * 18 + i * 12) % 34);
            ctx.beginPath();
            ctx.arc(347 + Math.sin(t * 2 + i) * 5, 30 - dy, 5 + dy * 0.12, 0, Math.PI * 2);
            ctx.fill();
        }
        // Крыша
        ctx.fillStyle = '#d84315';
        ctx.beginPath();
        ctx.moveTo(234, 76);
        ctx.lineTo(311, 34);
        ctx.lineTo(388, 76);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Дверь и окно
        ctx.fillStyle = '#6d4c41';
        ctx.fillRect(268, 102, 26, 44);
        ctx.fillStyle = '#ffe082';
        ctx.fillRect(312, 92, 42, 32);
        ctx.strokeRect(312, 92, 42, 32);
        ctx.restore();

        // Сорняки/кочки при stage 0
        if (state.stage === 0) {
            for (let i = 0; i < 6; i++) {
                const wx = 45 + (i * 64) % 320;
                const wy = 165 + (i % 3) * 35;
                window.flowerSprites.drawStone && window.flowerSprites.drawStone(ctx, wx, wy, 17);
            }
        }

        // Этап 3: Садовая дорожка
        if (state.stage >= 3) {
            const c3 = state.choices['2'] || 0;
            const stonesCol = c3 === 1 ? '#e57373' : (c3 === 2 ? '#cfd8dc' : '#bcaaa4');
            const stoneStroke = c3 === 1 ? '#b71c1c' : '#5d4037';
            const pathPts = [
                [200, 144, 18], [216, 166, 19], [234, 188, 20], [255, 208, 21], [276, 154, 15]
            ];
            pathPts.forEach(([px, py, rad]) => {
                ctx.fillStyle = stonesCol;
                ctx.strokeStyle = stoneStroke;
                ctx.lineWidth = 1.6;
                ctx.beginPath();
                ctx.ellipse(px, py, rad, rad * 0.56, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            });
        }

        // Этап 6: Живой Пруд с кувшинками и рыбками
        if (state.stage >= 6) {
            const c6 = state.choices['5'] || 0;
            ctx.save();
            ctx.fillStyle = '#6d4c41';
            ctx.beginPath();
            ctx.ellipse(98, 214, 72, 40, -0.06, 0, Math.PI * 2);
            ctx.fill();

            const waterG = ctx.createRadialGradient(92, 210, 6, 98, 214, 68);
            waterG.addColorStop(0, '#4fc3f7');
            waterG.addColorStop(1, '#0277bd');
            ctx.fillStyle = waterG;
            ctx.beginPath();
            ctx.ellipse(98, 214, 66, 35, -0.06, 0, Math.PI * 2);
            ctx.fill();

            // Рябь и кувшинка
            ctx.strokeStyle = 'rgba(255,255,255,0.45)';
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.ellipse(98, 214, 24 + Math.sin(t * 2.5) * 4, 10 + Math.sin(t * 2.5) * 2, 0, 0, Math.PI * 2);
            ctx.stroke();

            // Рыбки
            const fx = 98 + Math.cos(t * 1.4) * 32;
            const fy = 214 + Math.sin(t * 1.4) * 14;
            ctx.fillStyle = '#ff8f00';
            ctx.beginPath();
            ctx.ellipse(fx, fy, 6, 3, t * 1.4 + Math.PI / 2, 0, Math.PI * 2);
            ctx.fill();

            // Лилия
            ctx.fillStyle = '#43a047';
            ctx.beginPath();
            ctx.arc(68, 206, 10, 0.3, Math.PI * 2);
            ctx.lineTo(68, 206);
            ctx.fill();
            ctx.fillStyle = '#f48fb1';
            ctx.beginPath();
            ctx.arc(68, 204, 4.5, 0, Math.PI * 2);
            ctx.fill();

            if (c6 === 2) {
                ctx.fillStyle = '#8d6e63';
                ctx.fillRect(82, 184, 34, 58);
                ctx.strokeStyle = '#5d4037';
                ctx.strokeRect(82, 184, 34, 58);
            }
            ctx.restore();
        }

        // Этап 5: Скамейка и светящийся фонарь
        if (state.stage >= 5) {
            const c5 = state.choices['4'] || 0;
            const benchCol = c5 === 1 ? '#546e7a' : (c5 === 2 ? '#26c6da' : '#8d6e63');
            // Фонарь
            ctx.fillStyle = '#37474f';
            ctx.fillRect(184, 96, 5, 58);
            const lampG = ctx.createRadialGradient(186.5, 92, 2, 186.5, 92, 24);
            lampG.addColorStop(0, '#fff59d');
            lampG.addColorStop(1, 'rgba(255, 245, 157, 0)');
            ctx.fillStyle = lampG;
            ctx.beginPath();
            ctx.arc(186.5, 92, 24, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffd54f';
            ctx.beginPath();
            ctx.arc(186.5, 92, 6, 0, Math.PI * 2);
            ctx.fill();

            // Скамейка
            ctx.fillStyle = benchCol;
            ctx.strokeStyle = '#3e2723';
            ctx.lineWidth = 1.5;
            ctx.fillRect(118, 128, 52, 11);
            ctx.strokeRect(118, 128, 52, 11);
            ctx.fillRect(116, 139, 56, 8);
            ctx.fillRect(122, 147, 5, 11);
            ctx.fillRect(161, 147, 5, 11);
        }

        // Этап 4: Клумба у крыльца с живыми спрайтами цветов
        if (state.stage >= 4) {
            const c4 = state.choices['3'] || 0;
            const fId = c4 === 1 ? 1 : (c4 === 2 ? 3 : 0);
            ctx.fillStyle = '#5d4037';
            ctx.beginPath();
            ctx.roundRect(272, 158, 112, 34, 14);
            ctx.fill();
            [292, 326, 360].forEach((fx, i) => {
                window.flowerSprites.drawFlower(ctx, fId, fx, 170 + (i % 2) * 4, 16);
            });
        }

        // Этап 7: Цветочная арка и аллея
        if (state.stage >= 7) {
            const c7 = state.choices['6'] || 0;
            const archFlower = c7 === 1 ? 4 : (c7 === 2 ? 2 : 3);
            ctx.save();
            ctx.strokeStyle = '#4e342e';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.arc(200, 128, 36, Math.PI, 0);
            ctx.moveTo(164, 128);
            ctx.lineTo(164, 152);
            ctx.moveTo(236, 128);
            ctx.lineTo(236, 152);
            ctx.stroke();

            for (let a = 0; a <= 4; a++) {
                const ang = Math.PI + (a / 4) * Math.PI;
                window.flowerSprites.drawFlower(
                    ctx,
                    archFlower,
                    200 + Math.cos(ang) * 36,
                    128 + Math.sin(ang) * 36,
                    11
                );
            }
            window.flowerSprites.drawFlower(ctx, archFlower, 290, 232, 15);
            window.flowerSprites.drawFlower(ctx, 1, 336, 240, 15);
            ctx.restore();
        }

        // Этап 8: Беседка мечты и Пасека с пчёлками
        if (state.stage >= 8) {
            const c8 = state.choices['7'] || 0;
            const roofCol = c8 === 1 ? '#ef6c00' : (c8 === 2 ? '#e0f2f1' : '#ffb300');
            ctx.save();
            // Беседка слева-сзади
            ctx.fillStyle = '#fff8e1';
            ctx.strokeStyle = '#6d4c41';
            ctx.lineWidth = 1.8;
            ctx.fillRect(38, 108, 4, 48);
            ctx.fillRect(88, 108, 4, 48);
            ctx.fillStyle = roofCol;
            ctx.beginPath();
            ctx.moveTo(26, 110);
            ctx.lineTo(65, 78);
            ctx.lineTo(104, 110);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Улей-пасека справа
            ctx.fillStyle = '#fbc02d';
            ctx.strokeStyle = '#8d6e63';
            ctx.beginPath();
            ctx.roundRect(352, 200, 28, 32, 6);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#3e2723';
            ctx.beginPath();
            ctx.arc(366, 220, 4, 0, Math.PI * 2);
            ctx.fill();

            // Анимированные пчёлки
            for (let b = 0; b < 3; b++) {
                const bx = 356 + Math.cos(t * 3 + b * 2.1) * 18;
                const by = 192 + Math.sin(t * 4 + b * 2.1) * 9;
                ctx.fillStyle = '#ffeb3b';
                ctx.beginPath();
                ctx.arc(bx, by, 3, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        // Декоративные бабочки в саду (от stage >= 1)
        if (state.stage >= 1) {
            window.flowerSprites.drawButterfly(
                ctx,
                160 + Math.sin(t * 1.1) * 75,
                165 + Math.cos(t * 1.5) * 28,
                Math.cos(t * 1.1) * 0.5,
                t * 12,
                '#ffd54f',
                '#ff6f00'
            );
            if (state.stage >= 4) {
                window.flowerSprites.drawButterfly(
                    ctx,
                    290 + Math.cos(t * 0.9) * 55,
                    185 + Math.sin(t * 1.3) * 24,
                    Math.sin(t * 0.9) * 0.5,
                    t * 14 + 2,
                    '#ff80ab',
                    '#f50057'
                );
            }
        }

        // Частицы и всплывающие тексты
        particles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.alpha);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
        popups.forEach(pop => {
            ctx.save();
            ctx.globalAlpha = Math.max(0, pop.alpha);
            ctx.font = '800 16px Rubik, Nunito, sans-serif';
            ctx.textAlign = 'center';
            ctx.strokeStyle = '#1b4212';
            ctx.lineWidth = 3.5;
            ctx.strokeText(pop.text, pop.x, pop.y);
            ctx.fillStyle = pop.color;
            ctx.fillText(pop.text, pop.x, pop.y);
            ctx.restore();
        });
    }

    function tick(dt) {
        animPhase += dt;
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1;
            p.alpha -= dt * 1.4;
            if (p.alpha <= 0) particles.splice(i, 1);
        }
        for (let i = popups.length - 1; i >= 0; i--) {
            const pop = popups[i];
            pop.y += pop.vy;
            pop.alpha -= dt * 0.85;
            if (pop.alpha <= 0) popups.splice(i, 1);
        }
    }

    window.flowerGarden = {
        init(klumbaApi) {
            api = klumbaApi;
            canvas = document.getElementById('gardenCanvas');
            ctx = canvas ? canvas.getContext('2d') : null;
            loadState();

            const openBtn = document.getElementById('openGardenBtn');
            const backBtn = document.getElementById('gardenBackBtn');
            const upgradeBtn = document.getElementById('gardenUpgradeBtn');
            const harvestBtn = document.getElementById('gardenHarvestBtn');
            const dailyBtn = document.getElementById('gardenDailyBtn');

            if (openBtn) openBtn.addEventListener('click', () => this.open());
            if (backBtn) backBtn.addEventListener('click', () => this.close());

            if (upgradeBtn) {
                upgradeBtn.addEventListener('click', () => {
                    if (!api) return;
                    if (state.stage < GARDEN_STAGES.length) {
                        const cur = GARDEN_STAGES[state.stage];
                        if (api.spendCoins(cur.title, cur.cost)) {
                            state.stage++;
                            if (state.stage === 1) state.lastHarvestAt = Date.now();
                            if (api.getAudio()) api.getAudio().playFanfare();
                            spawnGardenFx(200, 155, 'ГОТОВО!', '#ffd54f');
                            saveState();
                        }
                    } else {
                        const fertCost = 150 + state.fertilizer * 50;
                        if (api.spendCoins('Удобрение усадьбы', fertCost)) {
                            state.fertilizer++;
                            if (api.getAudio()) api.getAudio().playMatchChime(3);
                            spawnGardenFx(200, 155, `УРОЖАЙ +${state.fertilizer}!`, '#69f0ae');
                            saveState();
                        }
                    }
                });
            }

            if (harvestBtn) {
                harvestBtn.addEventListener('click', () => {
                    const amount = getPendingHarvest();
                    if (amount <= 0) return;
                    state.lastHarvestAt = Date.now();
                    api.addCoins(amount);
                    if (api.getAudio()) api.getAudio().playWaterDrop(1.3);
                    spawnGardenFx(200, 175, `+${amount} 🪙`, '#ffd54f');
                    saveState();
                });
            }

            if (dailyBtn) {
                dailyBtn.addEventListener('click', () => {
                    if (!isDailyReady()) return;
                    state.lastDailyAt = Date.now();
                    api.addCoins(120, true);
                    api.addCan(1);
                    api.getBridge().showToast('Подарок дня: +120 монет и +1 лейка!');
                    if (api.getAudio()) api.getAudio().playFanfare();
                    spawnGardenFx(200, 140, '+120 🪙 +1 Лейка!', '#ffd54f');
                    saveState();
                });
            }

            if (canvas) {
                canvas.addEventListener('pointerdown', (e) => {
                    const rect = canvas.getBoundingClientRect();
                    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
                    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
                    if (api && api.getAudio()) api.getAudio().playWaterDrop(1.1);
                    spawnGardenFx(x, y, null, '#80deea');
                });
            }

            setInterval(() => {
                syncBadge();
                if (isOpen) renderUI();
            }, HARVEST_TICK_MS);

            let prev = performance.now();
            const frame = (now) => {
                const dt = Math.min(0.1, (now - prev) / 1000);
                prev = now;
                if (isOpen && ctx) {
                    tick(dt);
                    drawGardenScene();
                }
                requestAnimationFrame(frame);
            };
            requestAnimationFrame(frame);
            syncBadge();
        },

        onCloudHydrated(remoteGarden) {
            if (!remoteGarden || typeof remoteGarden !== 'object') return;
            if ((remoteGarden.stage || 0) > state.stage || (remoteGarden.fertilizer || 0) > state.fertilizer) {
                applyLoadedState(remoteGarden);
                renderUI();
                syncBadge();
            }
        },

        syncBadge,

        open() {
            isOpen = true;
            const matchScreen = document.getElementById('match3Screen');
            const gardenScreen = document.getElementById('gardenScreen');
            if (matchScreen) matchScreen.classList.add('hidden');
            if (gardenScreen) gardenScreen.classList.remove('hidden');
            renderUI();
            drawGardenScene();
        },

        close() {
            isOpen = false;
            const matchScreen = document.getElementById('match3Screen');
            const gardenScreen = document.getElementById('gardenScreen');
            if (gardenScreen) gardenScreen.classList.add('hidden');
            if (matchScreen) matchScreen.classList.remove('hidden');
            syncBadge();
        }
    };
})();
