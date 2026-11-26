/**
 * Цветочная Клумба: Векторные спрайты цветов, камней, кристаллов льда и садовых бабочек
 * Высококонтрастные, сочные, с четкими контурами для светлой весенней клумбы
 */

const FLOWER_TYPES = [
    { id: 0, name: 'Бархатцы', color: '#ff9800' },
    { id: 1, name: 'Ромашка', color: '#ffd54f' },
    { id: 2, name: 'Тюльпан', color: '#e53935' },
    { id: 3, name: 'Пион', color: '#ec407a' },
    { id: 4, name: 'Василёк', color: '#1e88e5' }
];

class FlowerSprites {
    constructor() {
        this.cache = new Map();
        this.dpr = Math.min(window.devicePixelRatio || 2, 2.5);
    }

    init() {
        FLOWER_TYPES.forEach(t => {
            const size = Math.ceil(64 * this.dpr);
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            ctx.scale(this.dpr, this.dpr);

            this.drawFlower(ctx, t.id, 32, 32, 25);
            this.cache.set(t.id, canvas);
        });

        // СПРАЙТ КАМНЯ / СОРНЯКА (Obstacle ID 98)
        const stoneSize = Math.ceil(64 * this.dpr);
        const stoneCanvas = document.createElement('canvas');
        stoneCanvas.width = stoneSize;
        stoneCanvas.height = stoneSize;
        const sCtx = stoneCanvas.getContext('2d');
        sCtx.scale(this.dpr, this.dpr);
        this.drawStone(sCtx, 32, 32, 25);
        this.cache.set(98, stoneCanvas);

        // СПРАЙТ СОЛНЕЧНОГО ЛОТОСА (Powerup ID 99)
        const sunCanvas = document.createElement('canvas');
        sunCanvas.width = stoneSize;
        sunCanvas.height = stoneSize;
        const sunCtx = sunCanvas.getContext('2d');
        sunCtx.scale(this.dpr, this.dpr);
        this.drawSunLotus(sunCtx, 32, 32, 25);
        this.cache.set(99, sunCanvas);
    }

    get(id) {
        return this.cache.get(id);
    }

    drawFlower(ctx, id, cx, cy, r) {
        ctx.save();
        ctx.translate(cx, cy);

        // Мягкая тень под цветком
        ctx.beginPath();
        ctx.arc(0, r * 0.14, r * 0.88, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(40, 65, 15, 0.25)';
        ctx.fill();

        switch (id) {
            case 0: this.drawMarigold(ctx, r); break;
            case 1: this.drawDaisy(ctx, r); break;
            case 2: this.drawTulip(ctx, r); break;
            case 3: this.drawPeony(ctx, r); break;
            case 4: this.drawCornflower(ctx, r); break;
        }

        ctx.restore();
    }

    // 0. БАРХАТЦЫ
    drawMarigold(ctx, r) {
        const layers = [
            { count: 12, rad: r * 0.95, col: '#d84315', stroke: '#8d2606' },
            { count: 10, rad: r * 0.75, col: '#fb8c00', stroke: '#e65100' },
            { count: 8, rad: r * 0.55, col: '#fbc02d', stroke: '#f57f17' },
            { count: 6, rad: r * 0.32, col: '#fff59d', stroke: '#fbc02d' }
        ];

        layers.forEach(l => {
            ctx.fillStyle = l.col;
            ctx.strokeStyle = l.stroke;
            ctx.lineWidth = 1.8;
            for (let i = 0; i < l.count; i++) {
                const a = (i / l.count) * Math.PI * 2;
                ctx.beginPath();
                ctx.arc(Math.cos(a) * l.rad * 0.62, Math.sin(a) * l.rad * 0.62, l.rad * 0.42, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }
        });

        ctx.beginPath();
        ctx.arc(0, 0, r * 0.22, 0, Math.PI * 2);
        ctx.fillStyle = '#ffeb3b';
        ctx.fill();
    }

    // 1. РОМАШКА
    drawDaisy(ctx, r) {
        const petals = 12;
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#78909c';
        ctx.lineWidth = 1.8;

        for (let i = 0; i < petals; i++) {
            const a = (i / petals) * Math.PI * 2;
            ctx.save();
            ctx.rotate(a);
            ctx.beginPath();
            ctx.ellipse(0, -r * 0.58, r * 0.18, r * 0.45, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.beginPath();
            ctx.ellipse(-r * 0.04, -r * 0.62, r * 0.06, r * 0.25, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.restore();
        }

        ctx.beginPath();
        ctx.arc(0, 0, r * 0.38, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(-r * 0.1, -r * 0.1, r * 0.05, 0, 0, r * 0.38);
        grad.addColorStop(0, '#fff59d');
        grad.addColorStop(0.6, '#fbc02d');
        grad.addColorStop(1, '#f57f17');
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#d84315';
        ctx.stroke();
    }

    // 2. ТЮЛЬПАН
    drawTulip(ctx, r) {
        ctx.beginPath();
        ctx.ellipse(r * 0.48, r * 0.4, r * 0.22, r * 0.44, 0.4, 0, Math.PI * 2);
        ctx.fillStyle = '#43a047';
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#1b5e20';
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-r * 0.65, -r * 0.2);
        ctx.quadraticCurveTo(-r * 0.8, r * 0.65, 0, r * 0.85);
        ctx.quadraticCurveTo(r * 0.8, r * 0.65, r * 0.65, -r * 0.2);
        ctx.quadraticCurveTo(r * 0.35, -r * 0.65, 0, -r * 0.35);
        ctx.quadraticCurveTo(-r * 0.35, -r * 0.65, -r * 0.65, -r * 0.2);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, -r * 0.6, 0, r * 0.8);
        grad.addColorStop(0, '#ff5252');
        grad.addColorStop(0.5, '#e53935');
        grad.addColorStop(1, '#b71c1c');
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.lineWidth = 2.2;
        ctx.strokeStyle = '#7f0000';
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(-r * 0.25, 0, r * 0.12, r * 0.38, -0.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.48)';
        ctx.fill();
    }

    // 3. ПИОН
    drawPeony(ctx, r) {
        const colors = ['#f48fb1', '#ec407a', '#d81b60', '#ad1457'];
        for (let ring = 3; ring >= 0; ring--) {
            ctx.fillStyle = colors[ring];
            ctx.strokeStyle = '#880e4f';
            ctx.lineWidth = 1.8;
            const count = 7 + ring * 3;
            const radius = r * (0.35 + ring * 0.2);
            for (let i = 0; i < count; i++) {
                const a = (i / count) * Math.PI * 2;
                ctx.beginPath();
                ctx.arc(Math.cos(a) * radius * 0.65, Math.sin(a) * radius * 0.65, radius * 0.45, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }
        }
    }

    // 4. ВАСИЛЁК
    drawCornflower(ctx, r) {
        const petals = 8;
        ctx.fillStyle = '#1e88e5';
        ctx.strokeStyle = '#0d47a1';
        ctx.lineWidth = 2;

        for (let i = 0; i < petals; i++) {
            const a = (i / petals) * Math.PI * 2;
            ctx.save();
            ctx.rotate(a);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-r * 0.25, -r * 0.65);
            ctx.lineTo(-r * 0.15, -r * 0.95);
            ctx.lineTo(0, -r * 0.78);
            ctx.lineTo(r * 0.15, -r * 0.95);
            ctx.lineTo(r * 0.25, -r * 0.65);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }

        ctx.beginPath();
        ctx.arc(0, 0, r * 0.28, 0, Math.PI * 2);
        ctx.fillStyle = '#4a148c';
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#e1bee7';
        ctx.stroke();
    }

    // 5. ПЫШНЫЙ СОРНЯК / РЕПЕЙНИК (вместо камня)
    drawStone(ctx, cx, cy, r) {
        ctx.save();
        ctx.translate(cx, cy);

        // Тень
        ctx.beginPath();
        ctx.ellipse(0, r * 0.65, r * 0.85, r * 0.28, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(20, 40, 10, 0.35)';
        ctx.fill();

        // Острые зубчатые листья сорняка
        const leafAngles = [-2.4, -1.6, -0.7, 0.2, 1.0, 2.1, 2.8];
        leafAngles.forEach((ang, idx) => {
            ctx.save();
            ctx.rotate(ang);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(r * 0.38, -r * 0.4, r * 0.92, 0);
            ctx.quadraticCurveTo(r * 0.38, r * 0.4, 0, 0);
            ctx.fillStyle = idx % 2 === 0 ? '#33691e' : '#558b2f';
            ctx.fill();
            ctx.lineWidth = 1.6;
            ctx.strokeStyle = '#1b5e20';
            ctx.stroke();
            ctx.restore();
        });

        // Колючая фиолетовая головка репейника в центре
        ctx.beginPath();
        ctx.arc(0, -r * 0.06, r * 0.36, 0, Math.PI * 2);
        const burGrad = ctx.createRadialGradient(-r * 0.1, -r * 0.15, 2, 0, 0, r * 0.38);
        burGrad.addColorStop(0, '#ba68c8');
        burGrad.addColorStop(0.6, '#7b1fa2');
        burGrad.addColorStop(1, '#4a148c');
        ctx.fillStyle = burGrad;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#2e003e';
        ctx.stroke();

        // Колючки на репейнике
        ctx.strokeStyle = '#e1bee7';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(Math.cos(a) * r * 0.28, -r * 0.06 + Math.sin(a) * r * 0.28);
            ctx.lineTo(Math.cos(a) * r * 0.48, -r * 0.06 + Math.sin(a) * r * 0.48);
            ctx.stroke();
        }

        ctx.restore();
    }

    // 6. САДОВЫЙ ЖУЧОК НА ЦВЕТКЕ (вместо заморозки - нужно прогнать!)
    drawIce(ctx, cx, cy, size, bugLevel = 2) {
        ctx.save();
        ctx.translate(cx, cy);

        // Легкая тень паутинки/жучка поверх цветка
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.44, 0, Math.PI * 2);
        ctx.fillStyle = bugLevel >= 2 ? 'rgba(62, 39, 35, 0.25)' : 'rgba(62, 39, 35, 0.12)';
        ctx.strokeStyle = bugLevel >= 2 ? '#e65100' : '#ff9800';
        ctx.lineWidth = 2.2;
        ctx.setLineDash([5, 4]);
        ctx.fill();
        ctx.stroke();
        ctx.setLineDash([]);

        // Рисуем 1 или 2 смешных садовых жучков (при 2 слоях — полосатый жук с панцирем)
        const count = bugLevel >= 2 ? 2 : 1;
        const tWiggle = performance.now() * 0.006;
        for (let b = 0; b < count; b++) {
            const bx = count === 2 ? (b === 0 ? -size * 0.16 : size * 0.16) : 0;
            const by = count === 2 ? (b === 0 ? -size * 0.1 : size * 0.12) : 0;
            const rot = (b === 0 ? -0.45 : 0.55) + Math.sin(tWiggle + b * 2.4) * 0.14;
            const r = size * (bugLevel >= 2 ? 0.19 : 0.23);

            ctx.save();
            ctx.translate(bx, by);
            ctx.rotate(rot);

            // Лапки жука
            ctx.strokeStyle = '#3e2723';
            ctx.lineWidth = 1.8;
            [-1, 1].forEach(side => {
                [-0.45, 0, 0.45].forEach(ly => {
                    ctx.beginPath();
                    ctx.moveTo(side * r * 0.6, ly * r);
                    ctx.lineTo(side * r * 1.25, ly * r - r * 0.2);
                    ctx.stroke();
                });
            });

            // Спинка жука (красно-оранжевая с темными точками/полосками)
            ctx.beginPath();
            ctx.ellipse(0, 0, r * 0.85, r * 1.05, 0, 0, Math.PI * 2);
            ctx.fillStyle = bugLevel >= 2 ? '#ff6f00' : '#e53935';
            ctx.fill();
            ctx.lineWidth = 1.8;
            ctx.strokeStyle = '#212121';
            ctx.stroke();

            // Разделительная линия крылышек
            ctx.beginPath();
            ctx.moveTo(0, -r * 0.55);
            ctx.lineTo(0, r * 1.0);
            ctx.stroke();

            // Пятнышки (божья коровка / колорадский жук)
            ctx.fillStyle = '#212121';
            [[-0.35, -0.1], [0.35, -0.1], [-0.32, 0.45], [0.32, 0.45]].forEach(([px, py]) => {
                ctx.beginPath();
                ctx.arc(px * r, py * r, r * 0.18, 0, Math.PI * 2);
                ctx.fill();
            });

            // Голова и усики
            ctx.beginPath();
            ctx.arc(0, -r * 0.82, r * 0.48, 0, Math.PI * 2);
            ctx.fillStyle = '#212121';
            ctx.fill();

            // Глазки
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(-r * 0.18, -r * 0.92, r * 0.12, 0, Math.PI * 2);
            ctx.arc(r * 0.18, -r * 0.92, r * 0.12, 0, Math.PI * 2);
            ctx.fill();

            // Усики
            ctx.strokeStyle = '#212121';
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.moveTo(-r * 0.15, -r * 1.2);
            ctx.quadraticCurveTo(-r * 0.45, -r * 1.55, -r * 0.65, -r * 1.4);
            ctx.moveTo(r * 0.15, -r * 1.2);
            ctx.quadraticCurveTo(r * 0.45, -r * 1.55, r * 0.65, -r * 1.4);
            ctx.stroke();

            ctx.restore();
        }

        ctx.restore();
    }

    // ВЕКТОРНАЯ ДЕКОРАТИВНАЯ БАБОЧКА ДЛЯ САДА
    drawButterfly(ctx, x, y, angle, flapPhase, wingMain = '#ffb300', wingAccent = '#ff6f00') {
        const wingScaleX = 0.35 + Math.abs(Math.cos(flapPhase)) * 0.65;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.scale(wingScaleX, 1);

        // Левое и правое крылья
        [-1, 1].forEach(side => {
            ctx.fillStyle = wingMain;
            ctx.strokeStyle = '#4e342e';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.ellipse(side * 6, -3, 7, 5, side * -0.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = wingAccent;
            ctx.beginPath();
            ctx.ellipse(side * 5, 4, 5, 4, side * 0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        });

        // Тельце
        ctx.fillStyle = '#3e2723';
        ctx.beginPath();
        ctx.ellipse(0, 0, 1.8, 6.5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    // 99. СОЛНЕЧНЫЙ ЛОТОС (Match-5 супер-цветок)
    drawSunLotus(ctx, cx, cy, r) {
        ctx.save();
        ctx.translate(cx, cy);

        // Тень
        ctx.beginPath();
        ctx.arc(0, r * 0.12, r * 0.92, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(40, 65, 15, 0.28)';
        ctx.fill();

        // Внешние радужные лепестки
        const petalColors = ['#ff7043', '#ffca28', '#66bb6a', '#29b6f6', '#ab47bc', '#ec407a', '#ffa726', '#ffee58'];
        for (let i = 0; i < 8; i++) {
            ctx.save();
            ctx.rotate((i / 8) * Math.PI * 2);
            ctx.fillStyle = petalColors[i];
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.ellipse(0, -r * 0.56, r * 0.27, r * 0.44, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }

        // Внутренний венец и сияющий солнечный центр
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.44, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(-r * 0.1, -r * 0.1, 2, 0, 0, r * 0.44);
        grad.addColorStop(0, '#fffde7');
        grad.addColorStop(0.55, '#ffd54f');
        grad.addColorStop(1, '#f57c00');
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#fff';
        ctx.stroke();

        ctx.restore();
    }

    // НАЛОЖЕНИЕ ЗНАЧКА БОНУСА (строка / столбец / букет-бомба / солнечный лотос)
    drawPowerAura(ctx, power, cellSize, nowSec) {
        const r = cellSize * 0.43;
        ctx.save();
        const pulse = 1 + Math.sin(nowSec * 6) * 0.06;

        if (power === 'sun') {
            ctx.rotate(nowSec * 1.4);
            ctx.strokeStyle = 'rgba(255, 238, 88, 0.85)';
            ctx.lineWidth = 2.4;
            ctx.setLineDash([5, 4]);
            ctx.beginPath();
            ctx.arc(0, 0, r * 1.03, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
            return;
        }

        if (power === 'bomb') {
            ctx.scale(pulse, pulse);
            ctx.strokeStyle = '#ff6f00';
            ctx.fillStyle = 'rgba(255, 224, 130, 0.36)';
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            for (let i = 0; i < 16; i++) {
                const rad = i % 2 === 0 ? r * 1.05 : r * 0.80;
                const a = (i / 16) * Math.PI * 2;
                const px = Math.cos(a) * rad;
                const py = Math.sin(a) * rad;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
            return;
        }

        // 'row' или 'col': золотой ободок и чёткие стрелки направления
        ctx.beginPath();
        ctx.arc(0, 0, r * pulse, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffd54f';
        ctx.lineWidth = 2.6;
        ctx.stroke();

        ctx.fillStyle = '#fffde7';
        ctx.strokeStyle = '#e65100';
        ctx.lineWidth = 1.6;
        const drawTip = (tx, ty, angle) => {
            ctx.save();
            ctx.translate(tx, ty);
            ctx.rotate(angle);
            ctx.beginPath();
            ctx.moveTo(6, 0);
            ctx.lineTo(-4, -5);
            ctx.lineTo(-4, 5);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        };

        if (power === 'row') {
            drawTip(-r * 0.94, 0, Math.PI);
            drawTip(r * 0.94, 0, 0);
        } else if (power === 'col') {
            drawTip(0, -r * 0.94, -Math.PI / 2);
            drawTip(0, r * 0.94, Math.PI / 2);
        }
        ctx.restore();
    }
}

window.flowerSprites = new FlowerSprites();
