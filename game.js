/**
 * Цветочная Клумба: Узоры Сада (v8.0 — Главное меню + Match-3 с насекомыми и цветами)
 * - Главное меню с 3 вкладками: «Клумба» (50+ уровней + серия подарков), «Арсенал» (3 бустера), «Лига» (зачёт монет и достижения)
 * - Бонус-фишки с уникальными модельками: Золотой Шмель (4 в ряд), Пушистый Одуванчик (Т/Г 3x3), Солнечный Лотос (5 в ряд)
 * - Бустеры: Лейка (3x3), Садовый совок (1 клетка), Свежий ветерок (перемешивание)
 */

(function () {
    'use strict';

    const GRID_SIZE = 7;
    const CANVAS_SIZE = 400;
    const CELL_SIZE = CANVAS_SIZE / GRID_SIZE; // ~57.14px

    const SVG_MUSIC_ON = '<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>';
    const SVG_MUSIC_OFF = '<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/><line x1="3" y1="3" x2="21" y2="21" stroke="#ffccbc" stroke-width="2.6"/></svg>';
    const SVG_SOUND_ON = '<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>';
    const SVG_SOUND_OFF = '<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15" stroke="#ffccbc"/><line x1="17" y1="9" x2="23" y2="15" stroke="#ffccbc"/></svg>';

    function buildStarSVG(filled) {
        const fillColor = filled ? '#ffd54f' : '#2f5222';
        const strokeColor = filled ? '#fff8e1' : '#558b2f';
        return `<svg width="44" height="44" viewBox="0 0 24 24" style="filter:drop-shadow(0 3px 5px rgba(0,0,0,0.45));"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="${fillColor}" stroke="${strokeColor}" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
    }

    // 10 разнообразных садовых уровней (маски 7x7: 1 = клумба, 0 = трава)
    const GARDEN_LEVELS = [
        {
            level: 1,
            name: 'Палисадник',
            mask: [
                [1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1]
            ],
            stones: [],
            frozen: [],
            goalType: 'flower',
            targetFlowerId: 1, // Ромашка
            targetCount: 18,
            moves: 25,
            reward: 120
        },
        {
            level: 2,
            name: 'Ромашка',
            mask: [
                [0,0,1,1,1,0,0],
                [0,1,1,1,1,1,0],
                [1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1],
                [0,1,1,1,1,1,0],
                [0,0,1,1,1,0,0]
            ],
            stones: [],
            frozen: [{ r: 2, c: 3 }, { r: 3, c: 2 }, { r: 3, c: 4 }, { r: 4, c: 3 }],
            goalType: 'unfreeze_and_flower',
            targetFlowerId: 2, // Тюльпан
            targetCount: 12,
            targetFrozen: 4,
            moves: 24,
            reward: 150
        },
        {
            level: 3,
            name: 'Крест',
            mask: [
                [0,0,1,1,1,0,0],
                [0,0,1,1,1,0,0],
                [1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1],
                [0,0,1,1,1,0,0],
                [0,0,1,1,1,0,0]
            ],
            stones: [{ r: 2, c: 2 }, { r: 2, c: 4 }, { r: 4, c: 2 }, { r: 4, c: 4 }],
            frozen: [],
            goalType: 'stones_and_flower',
            targetFlowerId: 0, // Бархатцы
            targetCount: 20,
            targetStones: 4,
            moves: 26,
            reward: 180
        },
        {
            level: 4,
            name: 'Дачное Сердце',
            mask: [
                [0,1,1,0,1,1,0],
                [1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1],
                [0,1,1,1,1,1,0],
                [0,0,1,1,1,0,0],
                [0,0,0,1,0,0,0]
            ],
            stones: [],
            frozen: [{ r: 1, c: 2 }, { r: 1, c: 4 }, { r: 2, c: 2 }, { r: 2, c: 3 }, { r: 2, c: 4 }],
            goalType: 'unfreeze',
            targetFrozen: 5,
            moves: 25,
            reward: 200
        },
        {
            level: 5,
            name: 'Бабочка',
            mask: [
                [1,1,1,0,1,1,1],
                [1,1,1,1,1,1,1],
                [0,1,1,1,1,1,0],
                [0,0,1,1,1,0,0],
                [0,1,1,1,1,1,0],
                [1,1,1,1,1,1,1],
                [1,1,1,0,1,1,1]
            ],
            stones: [{ r: 1, c: 1 }, { r: 1, c: 5 }, { r: 5, c: 1 }, { r: 5, c: 5 }],
            frozen: [],
            goalType: 'stones_and_flower',
            targetFlowerId: 4, // Василёк
            targetCount: 24,
            targetStones: 4,
            moves: 28,
            reward: 230
        },
        {
            level: 6,
            name: 'Цветочное Кольцо',
            mask: [
                [1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1],
                [1,1,0,0,0,1,1],
                [1,1,0,0,0,1,1],
                [1,1,0,0,0,1,1],
                [1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1]
            ],
            stones: [],
            frozen: [{ r: 0, c: 3 }, { r: 3, c: 0 }, { r: 3, c: 6 }, { r: 6, c: 3 }, { r: 1, c: 1 }, { r: 5, c: 5 }],
            goalType: 'unfreeze_and_flower',
            targetFlowerId: 3, // Пион
            targetCount: 18,
            targetFrozen: 6,
            moves: 28,
            reward: 260
        },
        {
            level: 7,
            name: 'Восьмёрка',
            mask: [
                [0,1,1,1,1,1,0],
                [1,1,1,1,1,1,1],
                [1,1,0,0,0,1,1],
                [0,1,1,1,1,1,0],
                [1,1,0,0,0,1,1],
                [1,1,1,1,1,1,1],
                [0,1,1,1,1,1,0]
            ],
            stones: [{ r: 1, c: 2 }, { r: 1, c: 4 }, { r: 5, c: 2 }, { r: 5, c: 4 }],
            frozen: [],
            goalType: 'stones_and_flower',
            targetFlowerId: 1, // Ромашка
            targetCount: 25,
            targetStones: 4,
            moves: 28,
            reward: 290
        },
        {
            level: 8,
            name: 'Дачный Замок',
            mask: [
                [1,0,1,1,1,0,1],
                [1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1],
                [1,1,1,0,1,1,1],
                [1,1,1,0,1,1,1],
                [1,1,1,1,1,1,1]
            ],
            stones: [{ r: 2, c: 1 }, { r: 2, c: 5 }, { r: 4, c: 2 }, { r: 4, c: 4 }],
            frozen: [{ r: 1, c: 3 }, { r: 2, c: 3 }, { r: 3, c: 2 }, { r: 3, c: 4 }],
            goalType: 'stones_frozen_flower',
            targetFlowerId: 2, // Тюльпан
            targetCount: 18,
            targetStones: 4,
            targetFrozen: 4,
            moves: 30,
            reward: 320
        },
        {
            level: 9,
            name: 'Четырёхлистник',
            mask: [
                [0,1,1,0,1,1,0],
                [1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1],
                [0,1,1,1,1,1,0],
                [1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1],
                [0,1,1,0,1,1,0]
            ],
            stones: [],
            frozen: [{ r: 1, c: 1 }, { r: 1, c: 5 }, { r: 3, c: 3 }, { r: 5, c: 1 }, { r: 5, c: 5 }, { r: 2, c: 3 }],
            goalType: 'unfreeze_and_flower',
            targetFlowerId: 0, // Бархатцы
            targetCount: 25,
            targetFrozen: 6,
            moves: 30,
            reward: 350
        },
        {
            level: 10,
            name: 'Царская Клумба',
            mask: [
                [1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1]
            ],
            stones: [{ r: 1, c: 1 }, { r: 1, c: 5 }, { r: 5, c: 1 }, { r: 5, c: 5 }],
            frozen: [{ r: 2, c: 3 }, { r: 3, c: 2 }, { r: 3, c: 3 }, { r: 3, c: 4 }, { r: 4, c: 3 }],
            goalType: 'stones_frozen_flower',
            targetFlowerId: 3, // Пион
            targetCount: 24,
            targetStones: 4,
            targetFrozen: 5,
            moves: 34,
            reward: 450
        },
        {
            level: 11,
            name: 'Солнечный Ручей',
            mask: [
                [1,1,1,1,1,0,0],
                [1,1,1,1,1,1,0],
                [1,1,1,1,1,1,1],
                [0,1,1,1,1,1,0],
                [1,1,1,1,1,1,1],
                [0,1,1,1,1,1,1],
                [0,0,1,1,1,1,1]
            ],
            stones: [],
            frozen: [{ r: 0, c: 1 }, { r: 2, c: 3 }, { r: 4, c: 3 }, { r: 6, c: 5 }],
            goalType: 'unfreeze_and_flower',
            targetFlowerId: 4, // Василёк
            targetCount: 24,
            targetFrozen: 4,
            moves: 28,
            reward: 320
        },
        {
            level: 12,
            name: 'Каменный Грот',
            mask: [
                [0,1,1,1,1,1,0],
                [1,1,1,1,1,1,1],
                [1,1,1,0,1,1,1],
                [1,1,1,1,1,1,1],
                [1,1,1,0,1,1,1],
                [1,1,1,1,1,1,1],
                [0,1,1,1,1,1,0]
            ],
            stones: [{ r: 1, c: 3 }, { r: 3, c: 1 }, { r: 3, c: 5 }, { r: 5, c: 3 }],
            frozen: [],
            goalType: 'stones_and_flower',
            targetFlowerId: 3, // Пион
            targetCount: 26,
            targetStones: 4,
            moves: 28,
            reward: 340
        },
        {
            level: 13,
            name: 'Сердце Сада',
            mask: [
                [0,1,1,0,1,1,0],
                [1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1],
                [0,1,1,1,1,1,0],
                [0,0,1,1,1,0,0],
                [0,0,0,1,0,0,0]
            ],
            stones: [],
            frozen: [{ r: 1, c: 1 }, { r: 1, c: 5 }, { r: 2, c: 3 }, { r: 3, c: 2 }, { r: 3, c: 4 }],
            goalType: 'unfreeze',
            targetFrozen: 5,
            moves: 26,
            reward: 360
        },
        {
            level: 14,
            name: 'Терраса у Пруда',
            mask: [
                [1,1,1,0,1,1,1],
                [1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1],
                [1,1,1,0,1,1,1]
            ],
            stones: [{ r: 2, c: 2 }, { r: 2, c: 4 }, { r: 4, c: 2 }, { r: 4, c: 4 }],
            frozen: [{ r: 1, c: 3 }, { r: 5, c: 3 }],
            goalType: 'stones_frozen_flower',
            targetFlowerId: 1, // Ромашка
            targetCount: 28,
            targetStones: 4,
            targetFrozen: 2,
            moves: 30,
            reward: 380
        },
        {
            level: 15,
            name: 'Летний Ливень',
            mask: [
                [1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1]
            ],
            stones: [],
            frozen: [{ r: 1, c: 2 }, { r: 1, c: 4 }, { r: 3, c: 1 }, { r: 3, c: 3 }, { r: 3, c: 5 }, { r: 5, c: 2 }, { r: 5, c: 4 }],
            goalType: 'unfreeze_and_flower',
            targetFlowerId: 2, // Тюльпан
            targetCount: 30,
            targetFrozen: 7,
            moves: 30,
            reward: 400
        },
        {
            level: 16,
            name: 'Ромашковый Луг',
            mask: [
                [0,0,1,1,1,0,0],
                [0,1,1,1,1,1,0],
                [1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1],
                [0,1,1,1,1,1,0],
                [0,0,1,1,1,0,0]
            ],
            stones: [{ r: 2, c: 3 }, { r: 3, c: 2 }, { r: 3, c: 4 }, { r: 4, c: 3 }],
            frozen: [{ r: 1, c: 3 }, { r: 5, c: 3 }],
            goalType: 'stones_frozen_flower',
            targetFlowerId: 1, // Ромашка
            targetCount: 32,
            targetStones: 4,
            targetFrozen: 2,
            moves: 28,
            reward: 420
        },
        {
            level: 17,
            name: 'Веер Тюльпанов',
            mask: [
                [1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1],
                [0,1,1,1,1,1,0],
                [0,1,1,1,1,1,0],
                [1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1],
                [1,1,1,0,1,1,1]
            ],
            stones: [{ r: 0, c: 3 }, { r: 4, c: 1 }, { r: 4, c: 5 }],
            frozen: [{ r: 2, c: 2 }, { r: 2, c: 4 }, { r: 3, c: 3 }, { r: 5, c: 3 }],
            goalType: 'stones_frozen_flower',
            targetFlowerId: 2, // Тюльпан
            targetCount: 30,
            targetStones: 3,
            targetFrozen: 4,
            moves: 30,
            reward: 440
        },
        {
            level: 18,
            name: 'Золотая Беседка',
            mask: [
                [1,1,1,1,1,1,1],
                [1,0,1,1,1,0,1],
                [1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1],
                [1,0,1,1,1,0,1],
                [1,1,1,1,1,1,1]
            ],
            stones: [{ r: 2, c: 3 }, { r: 4, c: 3 }],
            frozen: [{ r: 3, c: 1 }, { r: 3, c: 2 }, { r: 3, c: 4 }, { r: 3, c: 5 }, { r: 0, c: 3 }, { r: 6, c: 3 }],
            goalType: 'unfreeze_and_flower',
            targetFlowerId: 0, // Бархатцы
            targetCount: 34,
            targetFrozen: 6,
            moves: 32,
            reward: 470
        },
        {
            level: 19,
            name: 'Цветочный Карнавал',
            mask: [
                [0,1,1,1,1,1,0],
                [1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1],
                [0,1,1,1,1,1,0]
            ],
            stones: [{ r: 1, c: 2 }, { r: 1, c: 4 }, { r: 5, c: 2 }, { r: 5, c: 4 }, { r: 3, c: 3 }],
            frozen: [{ r: 2, c: 1 }, { r: 2, c: 5 }, { r: 4, c: 1 }, { r: 4, c: 5 }],
            goalType: 'stones_frozen_flower',
            targetFlowerId: 4, // Василёк
            targetCount: 32,
            targetStones: 5,
            targetFrozen: 4,
            moves: 32,
            reward: 500
        },
        {
            level: 20,
            name: 'Королевский Версаль',
            mask: [
                [1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1]
            ],
            stones: [{ r: 1, c: 1 }, { r: 1, c: 5 }, { r: 3, c: 3 }, { r: 5, c: 1 }, { r: 5, c: 5 }],
            frozen: [{ r: 2, c: 2 }, { r: 2, c: 4 }, { r: 3, c: 1 }, { r: 3, c: 5 }, { r: 4, c: 2 }, { r: 4, c: 4 }],
            goalType: 'stones_frozen_flower',
            targetFlowerId: 3, // Пион
            targetCount: 36,
            targetStones: 5,
            targetFrozen: 6,
            moves: 36,
            reward: 750
        }
    ];

    const CAMPAIGN_LEVEL_COUNT = 50;

    const EXTRA_MASKS = [
        [[0,1,1,1,1,1,0],[1,1,1,1,1,1,1],[1,1,1,1,1,1,1],[1,1,1,1,1,1,1],[1,1,1,1,1,1,1],[1,1,1,1,1,1,1],[0,1,1,1,1,1,0]],
        [[1,1,0,1,0,1,1],[1,1,1,1,1,1,1],[1,1,1,1,1,1,1],[0,1,1,1,1,1,0],[1,1,1,1,1,1,1],[1,1,1,1,1,1,1],[1,1,0,1,0,1,1]],
        [[0,0,1,1,1,0,0],[0,1,1,1,1,1,0],[1,1,1,1,1,1,1],[1,1,1,0,1,1,1],[1,1,1,1,1,1,1],[0,1,1,1,1,1,0],[0,0,1,1,1,0,0]],
        [[1,1,1,1,1,1,1],[1,1,1,0,1,1,1],[1,1,1,1,1,1,1],[1,0,1,1,1,0,1],[1,1,1,1,1,1,1],[1,1,1,0,1,1,1],[1,1,1,1,1,1,1]],
        [[1,1,1,0,1,1,1],[1,1,1,1,1,1,1],[1,1,1,1,1,1,1],[0,1,1,1,1,1,0],[1,1,1,1,1,1,1],[1,1,1,1,1,1,1],[1,1,1,0,1,1,1]],
        [[0,1,1,1,1,1,0],[0,1,1,1,1,1,0],[1,1,1,1,1,1,1],[1,1,1,1,1,1,1],[1,1,1,1,1,1,1],[0,1,1,1,1,1,0],[0,1,1,1,1,1,0]],
        [[1,1,1,1,1,1,1],[1,1,1,1,1,1,1],[0,1,1,1,1,1,0],[0,0,1,1,1,0,0],[0,1,1,1,1,1,0],[1,1,1,1,1,1,1],[1,1,1,1,1,1,1]],
        [[1,1,1,1,1,0,0],[1,1,1,1,1,1,0],[1,1,1,1,1,1,1],[1,1,1,1,1,1,1],[1,1,1,1,1,1,1],[0,1,1,1,1,1,1],[0,0,1,1,1,1,1]],
        [[0,1,1,0,1,1,0],[1,1,1,1,1,1,1],[1,1,1,1,1,1,1],[1,1,1,1,1,1,1],[1,1,1,1,1,1,1],[0,1,1,1,1,1,0],[0,0,1,1,1,0,0]],
        [[1,1,1,1,1,1,1],[1,1,1,1,1,1,1],[1,1,1,1,1,1,1],[1,1,1,1,1,1,1],[1,1,1,1,1,1,1],[1,1,1,1,1,1,1],[1,1,1,1,1,1,1]]
    ];

    const EXTRA_LEVEL_NAMES = [
        'Клеверная Поляна', 'Корона Лета', 'Песочные Часы', 'Сиреневый Дворик', 'Медовая Аллея',
        'Яблоневый Цвет', 'Ландышевый Склон', 'Звёздная Беседка', 'Утренняя Роса', 'Палитра Садовода',
        'Васильковый Ручей', 'Вишнёвая Ветка', 'Тенистая Галерея', 'Золотой Павильон', 'Радужный Бордюр',
        'Пионовый Остров', 'Серебряный Пруд', 'Шмель и Клевер', 'Тёплый Флигель', 'Изумрудный Венец',
        'Цветение Тюльпанов', 'Ромашковый Холм', 'Жемчужный Мостик', 'Осенние Бархатцы', 'Солнечный Террас',
        'Аромат Сирени', 'Бабочкин Вальс', 'Оранжерея Мечты', 'Триумф Сада', 'Гранд-Клумба'
    ];

    const GENERATED_CACHE = new Map();

    function getLevelConfig(idx) {
        if (idx < GARDEN_LEVELS.length) return GARDEN_LEVELS[idx];
        if (GENERATED_CACHE.has(idx)) return GENERATED_CACHE.get(idx);

        // Детерминированный генератор для уровней 21-50 и Бесконечного Сада (51+)
        let seed = ((idx + 1) * 2654435761) >>> 0;
        const nextRand = () => {
            seed = (seed * 1664525 + 1013904223) >>> 0;
            return seed / 4294967296;
        };

        const mask = EXTRA_MASKS[idx % EXTRA_MASKS.length];
        const validCells = [];
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (mask[r][c] === 1) validCells.push({ r, c });
            }
        }

        // Перемешиваем клетки детерминированно
        for (let i = validCells.length - 1; i > 0; i--) {
            const j = Math.floor(nextRand() * (i + 1));
            const tmp = validCells[i];
            validCells[i] = validCells[j];
            validCells[j] = tmp;
        }

        const tier = Math.min(35, idx - GARDEN_LEVELS.length);
        const stonesWanted = idx % 3 === 1 ? 0 : Math.min(6, 2 + Math.floor((tier % 9) / 2));
        const frozenWanted = idx % 4 === 2 ? 0 : Math.min(8, 3 + Math.floor((tier % 10) / 2));

        const stones = [];
        const frozen = [];
        const occupied = new Set();

        for (let i = 0; i < validCells.length && stones.length < stonesWanted; i++) {
            const cell = validCells[i];
            // Не ставим сорняки в верхний крайний ряд, чтобы поток не стопорился
            if (cell.r === 0) continue;
            stones.push(cell);
            occupied.add(`${cell.r},${cell.c}`);
        }
        for (let i = 0; i < validCells.length && frozen.length < frozenWanted; i++) {
            const cell = validCells[i];
            const k = `${cell.r},${cell.c}`;
            if (!occupied.has(k)) {
                frozen.push(cell);
                occupied.add(k);
            }
        }

        let goalType = 'flower';
        if (stones.length > 0 && frozen.length > 0) goalType = 'stones_frozen_flower';
        else if (stones.length > 0) goalType = 'stones_and_flower';
        else if (frozen.length > 0) goalType = 'unfreeze_and_flower';

        const targetFlowerId = idx % 5;
        const targetCount = 24 + Math.min(20, Math.floor(tier * 0.55));
        const moves = Math.min(38, 28 + Math.floor((stones.length + frozen.length) * 0.65));
        const reward = Math.min(1200, 460 + (idx - GARDEN_LEVELS.length + 1) * 18);
        const nameIdx = idx - GARDEN_LEVELS.length;
        const name = nameIdx < EXTRA_LEVEL_NAMES.length
            ? EXTRA_LEVEL_NAMES[nameIdx]
            : `Бесконечный Сад #${idx + 1}`;

        const cfg = {
            level: idx + 1,
            name,
            mask,
            stones,
            frozen,
            goalType,
            targetFlowerId,
            targetCount,
            targetStones: stones.length,
            targetFrozen: frozen.length,
            moves,
            reward
        };
        GENERATED_CACHE.set(idx, cfg);
        return cfg;
    }

    let canvas, ctx;
    let grid = [];
    let selectedCell = null;
    let dragStart = null;
    let currentLevelIdx = 0;
    let maxLevel = 0;
    let levelStars = {};
    let score = 0;
    let coins = 100;
    let movesLeft = 25;
    let canBoosterCount = 3;
    let trowelCount = 2;
    let shuffleCount = 2;
    let activeTool = null; // null | 'can' | 'trowel'
    let shopTargetTool = 'can';
    let dailyStreak = 0;
    let dailyLastClaimAt = 0;
    let claimedAchs = [];
    let userName = 'Вы (Садовод)';
    let activeTab = 'tabKlumba';
    let stats = { totalCoinsEarned: 100, matchesCleared: 0, powerupsCreated: 0, bugsCleared: 0, weedsCleared: 0 };

    const TOOLS_CFG = {
        can: {
            title: 'Волшебная лейка',
            desc: 'Поливает квадрат 3×3: вырывает сорняки, смывает жучков и запускает бонусы.',
            cost: 150,
            adAmount: 2
        },
        trowel: {
            title: 'Садовый совок',
            desc: 'Точечно убирает 1 любую клетку (цветок, сорняк или жучка) без траты хода.',
            cost: 90,
            adAmount: 2
        },
        shuffle: {
            title: 'Свежий ветерок',
            desc: 'Перемешивает все цветы на клумбе и открывает новые комбинации без траты хода.',
            cost: 110,
            adAmount: 2
        }
    };

    const DAILY_REWARDS = [
        { day: 1, coins: 100, tool: null, label: '100' },
        { day: 2, coins: 130, tool: null, label: '130' },
        { day: 3, coins: 150, tool: 'trowel', label: '150+' },
        { day: 4, coins: 180, tool: null, label: '180' },
        { day: 5, coins: 220, tool: 'can', label: '220+' },
        { day: 6, coins: 260, tool: null, label: '260' },
        { day: 7, coins: 350, tool: 'can', label: '350+' }
    ];

    const RANKS = [
        { score: 0, title: 'Росток' },
        { score: 250, title: 'Дачник' },
        { score: 700, title: 'Садовник' },
        { score: 1500, title: 'Знаток Клумб' },
        { score: 3000, title: 'Мастер Букетов' },
        { score: 6000, title: 'Король Сада' }
    ];

    const NEIGHBORS = [
        { name: 'Тётя Зина (уч. №4)', score: 420 },
        { name: 'Дядя Миша (уч. №12)', score: 890 },
        { name: 'Марина Петровна', score: 1650 },
        { name: 'Баба Люба (розы)', score: 2900 },
        { name: 'Агроном Семёныч', score: 4800 }
    ];

    const ACHIEVEMENTS = [
        { id: 'match50', title: 'Первый букет (50 цветов)', reward: 60, target: 50, read: () => stats.matchesCleared },
        { id: 'bugs10', title: 'Гроза жучков (10 жучков)', reward: 100, target: 10, read: () => stats.bugsCleared },
        { id: 'weeds10', title: 'Чистая грядка (10 сорняков)', reward: 100, target: 10, read: () => stats.weedsCleared },
        { id: 'power10', title: 'Друг шмелей (10 бонусов)', reward: 120, target: 10, read: () => stats.powerupsCreated },
        { id: 'coins1000', title: 'Богатый урожай (1000 🪙)', reward: 180, target: 1000, read: () => stats.totalCoinsEarned },
        { id: 'lvl15', title: 'Знаток сада (15 клумб)', reward: 240, target: 15, read: () => maxLevel + 1 }
    ];

    let isCanMode = false;
    let isProcessingMatches = false;
    let isGameOver = false;
    let isWon = false;

    let goalProgress = { flowers: 0, frozenMelted: 0, stonesBroken: 0 };

    let bridge;
    let particles = [];
    let beams = [];
    let shockwaves = [];
    let popups = [];
    let butterflies = [];
    let swapAnim = null;
    let lastSwap = null;
    let comboCount = 0;
    let idleTime = 0;
    let hintPair = null;
    let levelToken = 0;
    let trauma = 0;

    function init() {
        canvas = document.getElementById('match3Canvas');
        ctx = canvas.getContext('2d');

        bridge = new window.SocialBridge('flowers', { audio: window.flowerAudio });
        window.flowerAudio.init();
        window.flowerSprites.init();

        currentLevelIdx = Math.max(0, parseInt(bridge.loadCloudProgress('level', 0), 10) || 0);
        maxLevel = Math.max(currentLevelIdx, parseInt(bridge.loadCloudProgress('maxLevel', currentLevelIdx), 10) || 0);
        const savedStars = bridge.loadCloudProgress('levelStars', {});
        levelStars = (savedStars && typeof savedStars === 'object') ? savedStars : {};

        coins = bridge.loadCloudProgress('coins', 100);
        bridge.setCoins(coins);
        canBoosterCount = bridge.loadCloudProgress('cans', 3);
        trowelCount = bridge.loadCloudProgress('trowels', 2);
        shuffleCount = bridge.loadCloudProgress('shuffles', 2);
        dailyStreak = parseInt(bridge.loadCloudProgress('dailyStreak', 0), 10) || 0;
        dailyLastClaimAt = parseInt(bridge.loadCloudProgress('dailyLast', 0), 10) || 0;
        const savedAchs = bridge.loadCloudProgress('achs', []);
        claimedAchs = Array.isArray(savedAchs) ? savedAchs : [];
        const savedStats = bridge.loadCloudProgress('stats', null);
        if (savedStats && typeof savedStats === 'object') {
            stats = Object.assign(stats, savedStats);
        }
        stats.totalCoinsEarned = Math.max(stats.totalCoinsEarned || 0, coins);

        initButterflies();
        syncAudioButtons();
        resetLevel(currentLevelIdx);
        setupEvents();
        openHub('tabKlumba');

        if (typeof bridge.getUserProfile === 'function') {
            bridge.getUserProfile().then((prof) => {
                if (prof && prof.name) {
                    userName = prof.name;
                    renderHub();
                }
            });
        }

        bridge.hydrateCloudProgress(['level', 'maxLevel', 'levelStars', 'coins', 'cans', 'trowels', 'shuffles', 'dailyStreak', 'dailyLast', 'achs', 'stats'], (hydrated) => {
            if (!hydrated || typeof hydrated !== 'object') return;
            let changed = false;
            if (typeof hydrated.coins === 'number' && !Number.isNaN(hydrated.coins)) {
                coins = hydrated.coins;
                bridge.coins = coins;
                changed = true;
            }
            if (typeof hydrated.cans === 'number' && !Number.isNaN(hydrated.cans)) {
                canBoosterCount = hydrated.cans;
                changed = true;
            }
            if (typeof hydrated.trowels === 'number' && !Number.isNaN(hydrated.trowels)) {
                trowelCount = hydrated.trowels;
                changed = true;
            }
            if (typeof hydrated.shuffles === 'number' && !Number.isNaN(hydrated.shuffles)) {
                shuffleCount = hydrated.shuffles;
                changed = true;
            }
            if (typeof hydrated.dailyStreak === 'number') {
                dailyStreak = Math.max(dailyStreak, hydrated.dailyStreak);
                changed = true;
            }
            if (typeof hydrated.dailyLast === 'number') {
                dailyLastClaimAt = Math.max(dailyLastClaimAt, hydrated.dailyLast);
                changed = true;
            }
            if (Array.isArray(hydrated.achs)) {
                claimedAchs = Array.from(new Set(claimedAchs.concat(hydrated.achs)));
                changed = true;
            }
            if (hydrated.stats && typeof hydrated.stats === 'object') {
                Object.keys(stats).forEach(k => {
                    stats[k] = Math.max(stats[k] || 0, hydrated.stats[k] || 0);
                });
                changed = true;
            }
            if (typeof hydrated.maxLevel === 'number' && !Number.isNaN(hydrated.maxLevel)) {
                maxLevel = Math.max(maxLevel, hydrated.maxLevel);
                changed = true;
            }
            if (hydrated.levelStars && typeof hydrated.levelStars === 'object') {
                Object.keys(hydrated.levelStars).forEach((k) => {
                    levelStars[k] = Math.max(levelStars[k] || 0, hydrated.levelStars[k] || 0);
                });
                changed = true;
            }
            if (typeof hydrated.level === 'number' && hydrated.level >= 0) {
                maxLevel = Math.max(maxLevel, hydrated.level);
                currentLevelIdx = hydrated.level;
                changed = true;
            }
            if (changed) {
                updateUI();
                renderHub();
            }
        });

        let lastTime = performance.now();
        function loop(now) {
            const dt = Math.min((now - lastTime) / 1000, 0.1);
            lastTime = now;
            update(dt);
            render();
            requestAnimationFrame(loop);
        }
        requestAnimationFrame(loop);
    }

    function initButterflies() {
        const palettes = [
            ['#ffd54f', '#ff8f00'],
            ['#ff80ab', '#f50057'],
            ['#80deea', '#00acc1'],
            ['#ce93d8', '#ab47bc']
        ];
        butterflies = palettes.map((pal, i) => ({
            x: 60 + i * 90,
            y: 45 + (i % 2) * 290,
            angle: Math.random() * Math.PI * 2,
            speed: 22 + Math.random() * 14,
            turnTimer: Math.random() * 2,
            turnDir: Math.random() > 0.5 ? 1 : -1,
            flapPhase: Math.random() * 6,
            colors: pal
        }));
    }

    function syncAudioButtons() {
        const musicMuted = window.flowerAudio.isMusicMuted();
        ['musicBtn', 'hubMusicBtn'].forEach(id => {
            const btn = document.getElementById(id);
            const iconWrap = document.getElementById(id === 'musicBtn' ? 'musicIconWrap' : 'hubMusicIconWrap');
            if (btn && iconWrap) {
                iconWrap.innerHTML = musicMuted ? SVG_MUSIC_OFF : SVG_MUSIC_ON;
                btn.classList.toggle('muted', musicMuted);
            }
        });

        const soundMuted = window.flowerAudio.isMuted();
        ['soundBtn', 'hubSoundBtn'].forEach(id => {
            const btn = document.getElementById(id);
            const iconWrap = document.getElementById(id === 'soundBtn' ? 'soundIconWrap' : 'hubSoundIconWrap');
            if (btn && iconWrap) {
                iconWrap.innerHTML = soundMuted ? SVG_SOUND_OFF : SVG_SOUND_ON;
                btn.classList.toggle('muted', soundMuted);
            }
        });
    }

    function saveStats() {
        bridge.saveCloudProgress('stats', stats);
    }

    function getTotalStarsCount() {
        return Object.values(levelStars).reduce((acc, v) => acc + (parseInt(v, 10) || 0), 0);
    }

    function getGardenerRank(scoreVal) {
        let cur = RANKS[0].title;
        for (const r of RANKS) {
            if (scoreVal >= r.score) cur = r.title;
        }
        return cur;
    }

    function isDailyAvailable() {
        return (Date.now() - dailyLastClaimAt) >= 20 * 3600 * 1000;
    }

    function switchHubTab(tabId) {
        activeTab = tabId;
        ['tabKlumba', 'tabArsenal', 'tabLeague'].forEach(id => {
            const pane = document.getElementById(id);
            if (pane) pane.classList.toggle('hidden', id !== tabId);
        });
        document.querySelectorAll('.hub-nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });
        renderHub();
    }

    function openHub(tabId = 'tabKlumba') {
        levelToken++;
        isProcessingMatches = false;
        isWon = false;
        isGameOver = false;
        activeTool = null;
        isCanMode = false;
        swapAnim = null;

        ['gameOverModal', 'victoryModal', 'levelsModal', 'boosterShopModal'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add('hidden');
        });
        document.getElementById('match3Screen').classList.add('hidden');
        document.getElementById('hubScreen').classList.remove('hidden');
        switchHubTab(tabId);
    }

    function startLevel(lvlIdx) {
        document.getElementById('hubScreen').classList.add('hidden');
        document.getElementById('match3Screen').classList.remove('hidden');
        resetLevel(lvlIdx);
    }

    function renderHub() {
        const totalStars = getTotalStarsCount();
        const myLeagueScore = (stats.totalCoinsEarned || 0) + totalStars * 20;
        const rank = getGardenerRank(myLeagueScore);

        const rankEl = document.getElementById('hubRankText');
        const hubCoinsEl = document.getElementById('hubCoinsVal');
        if (rankEl) rankEl.textContent = `Узоры Сада • ${rank}`;
        if (hubCoinsEl) hubCoinsEl.textContent = coins;

        const playIdx = maxLevel;
        const curLvl = getLevelConfig(playIdx);
        const curNameEl = document.getElementById('hubCurrentLevelName');
        const playBtnTxt = document.getElementById('hubPlayBtnText');
        const starsEl = document.getElementById('hubTotalStars');
        if (curNameEl) curNameEl.textContent = `${curLvl.level}. ${curLvl.name}`;
        if (playBtnTxt) playBtnTxt.textContent = `ИГРАТЬ — УРОВЕНЬ ${curLvl.level}`;
        if (starsEl) starsEl.textContent = totalStars;

        // Ежедневная серия
        const dailyAvail = isDailyAvailable();
        const curDayIdx = dailyStreak % DAILY_REWARDS.length;
        const dailyDaysEl = document.getElementById('hubDailyDays');
        const dailyStatusEl = document.getElementById('hubDailyStatus');
        const dailyBtn = document.getElementById('hubDailyClaimBtn');
        if (dailyStatusEl) dailyStatusEl.textContent = `Серия: день ${curDayIdx + 1}`;
        if (dailyBtn) {
            dailyBtn.disabled = !dailyAvail;
            dailyBtn.textContent = dailyAvail
                ? `ЗАБРАТЬ +${DAILY_REWARDS[curDayIdx].coins} МОНЕТ`
                : 'ПОДАРОК СЕГОДНЯ ПОЛУЧЕН';
        }
        if (dailyDaysEl) {
            dailyDaysEl.innerHTML = '';
            DAILY_REWARDS.forEach((d, idx) => {
                const div = document.createElement('div');
                const isDone = idx < curDayIdx || (!dailyAvail && idx === curDayIdx);
                const isToday = dailyAvail && idx === curDayIdx;
                div.className = `daily-day ${isDone ? 'done' : ''} ${isToday ? 'today' : ''}`;
                div.innerHTML = `<div>Д${d.day}</div><b>${d.label}</b>`;
                dailyDaysEl.appendChild(div);
            });
        }

        // Карта уровней в меню
        const hubGrid = document.getElementById('hubLevelsGrid');
        const mapSub = document.getElementById('hubMapSummary');
        const displayCount = Math.max(CAMPAIGN_LEVEL_COUNT, maxLevel + 5);
        if (mapSub) mapSub.textContent = `Открыто: ${maxLevel + 1} из ${displayCount}`;
        if (hubGrid) {
            hubGrid.innerHTML = '';
            for (let idx = 0; idx < displayCount; idx++) {
                const lvl = getLevelConfig(idx);
                const unlocked = idx <= maxLevel;
                const stars = levelStars[String(idx)] || 0;
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = `level-tile ${unlocked ? 'unlocked' : 'locked'} ${idx === playIdx ? 'current' : ''}`;
                btn.title = `${lvl.level}. ${lvl.name}`;
                btn.disabled = !unlocked;
                let starsHtml = '';
                if (unlocked) {
                    for (let s = 1; s <= 3; s++) {
                        const col = s <= stars ? '#ffd54f' : 'rgba(255,255,255,0.22)';
                        starsHtml += `<svg width="10" height="10" viewBox="0 0 24 24" fill="${col}"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
                    }
                } else {
                    starsHtml = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';
                }
                btn.innerHTML = `<span class="level-tile-num">${lvl.level}</span><span class="level-tile-stars">${starsHtml}</span>`;
                if (unlocked) {
                    btn.addEventListener('click', () => startLevel(idx));
                }
                hubGrid.appendChild(btn);
            }
        }

        // Арсенал
        const cEl = document.getElementById('shopCanStock');
        const tEl = document.getElementById('shopTrowelStock');
        const sEl = document.getElementById('shopShuffleStock');
        if (cEl) cEl.textContent = `${canBoosterCount} шт.`;
        if (tEl) tEl.textContent = `${trowelCount} шт.`;
        if (sEl) sEl.textContent = `${shuffleCount} шт.`;

        // Лига и Достижения
        const profName = document.getElementById('hubProfileName');
        const profStats = document.getElementById('hubProfileStats');
        if (profName) profName.textContent = `${userName} • ${rank}`;
        if (profStats) profStats.textContent = `Собрано всего: ${stats.totalCoinsEarned} 🪙 • Звёзд: ${totalStars} ★`;

        const lbList = document.getElementById('hubLeaderboardList');
        if (lbList) {
            const entries = NEIGHBORS.map(n => ({ name: n.name, score: n.score, isMe: false }));
            entries.push({ name: userName, score: myLeagueScore, isMe: true });
            entries.sort((a, b) => b.score - a.score);
            lbList.innerHTML = '';
            entries.forEach((entry, idx) => {
                const row = document.createElement('div');
                row.className = `lb-row ${entry.isMe ? 'me' : ''}`;
                row.innerHTML = `<span class="lb-pos">${idx + 1}.</span><span class="lb-name">${entry.name}</span><span class="lb-score">${entry.score} очк.</span>`;
                lbList.appendChild(row);
            });
        }

        const achList = document.getElementById('hubAchievementsList');
        let anyAchClaimable = false;
        if (achList) {
            achList.innerHTML = '';
            ACHIEVEMENTS.forEach(a => {
                const curVal = Math.min(a.target, a.read());
                const claimed = claimedAchs.includes(a.id);
                const ready = !claimed && curVal >= a.target;
                if (ready) anyAchClaimable = true;
                const row = document.createElement('div');
                row.className = 'ach-row';
                const btnText = claimed ? 'Получено' : (ready ? `+${a.reward} 🪙` : `${curVal}/${a.target}`);
                const btnCls = claimed ? 'claimed' : (ready ? '' : 'locked');
                row.innerHTML = `<div class="ach-info"><div class="ach-title">${a.title}</div><div class="ach-prog">Прогресс: ${curVal} / ${a.target}</div></div>`;
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = `ach-btn ${btnCls}`;
                btn.textContent = btnText;
                btn.disabled = !ready;
                if (ready) {
                    btn.addEventListener('click', () => {
                        if (claimedAchs.includes(a.id)) return;
                        claimedAchs.push(a.id);
                        coins += a.reward;
                        stats.totalCoinsEarned += a.reward;
                        bridge.setCoins(coins);
                        bridge.saveCloudProgress('achs', claimedAchs);
                        saveStats();
                        window.flowerAudio.playFanfare();
                        bridge.showToast(`Достижение! +${a.reward} монет`);
                        updateUI();
                        renderHub();
                    });
                }
                row.appendChild(btn);
                achList.appendChild(row);
            });
        }

        const dotK = document.getElementById('dotKlumba');
        const dotL = document.getElementById('dotLeague');
        if (dotK) dotK.classList.toggle('hidden', !dailyAvail);
        if (dotL) dotL.classList.toggle('hidden', !anyAchClaimable);
    }

    function openBoosterShop(toolKey) {
        shopTargetTool = TOOLS_CFG[toolKey] ? toolKey : 'can';
        const cfg = TOOLS_CFG[shopTargetTool];
        document.getElementById('boosterModalTitle').textContent = cfg.title;
        document.getElementById('boosterModalDesc').textContent = cfg.desc;
        document.getElementById('buyBoosterCoinsText').textContent = `КУПИТЬ (${cfg.cost} МОНЕТ)`;
        document.getElementById('getBoosterAdText').textContent = `+${cfg.adAmount} ЗА ВИДЕО`;
        document.getElementById('boosterShopModal').classList.remove('hidden');
    }

    function grantTool(toolKey, amount) {
        if (toolKey === 'can') {
            canBoosterCount += amount;
            bridge.saveCloudProgress('cans', canBoosterCount);
        } else if (toolKey === 'trowel') {
            trowelCount += amount;
            bridge.saveCloudProgress('trowels', trowelCount);
        } else if (toolKey === 'shuffle') {
            shuffleCount += amount;
            bridge.saveCloudProgress('shuffles', shuffleCount);
        }
        updateUI();
        renderHub();
    }

    function resetLevel(lvlIdx) {
        levelToken++;
        currentLevelIdx = lvlIdx;
        if (currentLevelIdx > maxLevel) {
            maxLevel = currentLevelIdx;
            bridge.saveCloudProgress('maxLevel', maxLevel);
        }
        bridge.saveCloudProgress('level', currentLevelIdx);
        const lvl = getLevelConfig(currentLevelIdx);

        score = 0;
        movesLeft = lvl.moves;
        isGameOver = false;
        isWon = false;
        selectedCell = null;
        dragStart = null;
        swapAnim = null;
        lastSwap = null;
        comboCount = 0;
        idleTime = 0;
        hintPair = null;
        beams = [];
        shockwaves = [];
        isCanMode = false;
        activeTool = null;
        isProcessingMatches = false;
        document.getElementById('canBtn').classList.remove('active');
        const trBtn = document.getElementById('trowelBtn');
        if (trBtn) trBtn.classList.remove('active');
        goalProgress = { flowers: 0, frozenMelted: 0, stonesBroken: 0 };

        grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));

        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (lvl.mask[r][c] === 1) {
                    let typeId;
                    let guard = 0;
                    do {
                        typeId = Math.floor(Math.random() * 5);
                        guard++;
                    } while (
                        guard < 25 && (
                            (c >= 2 && grid[r][c - 1] && grid[r][c - 1].id === typeId && grid[r][c - 2] && grid[r][c - 2].id === typeId) ||
                            (r >= 2 && grid[r - 1][c] && grid[r - 1][c].id === typeId && grid[r - 2][c] && grid[r - 2][c].id === typeId)
                        )
                    );

                    grid[r][c] = {
                        id: typeId,
                        power: null,
                        isStone: false,
                        frostLevel: 0,
                        scaleX: 1,
                        scaleY: 1,
                        squashVel: 0,
                        animOffsetX: 0,
                        animOffsetY: 0,
                        popScale: 1,
                        popping: false,
                        popT: 0
                    };
                }
            }
        }

        if (lvl.stones) {
            lvl.stones.forEach(st => {
                if (grid[st.r] && grid[st.r][st.c]) {
                    grid[st.r][st.c].isStone = true;
                    grid[st.r][st.c].id = 98;
                }
            });
        }

        if (lvl.frozen) {
            lvl.frozen.forEach(fr => {
                if (grid[fr.r] && grid[fr.r][fr.c] && !grid[fr.r][fr.c].isStone) {
                    grid[fr.r][fr.c].frostLevel = 2;
                }
            });
        }

        ensurePlayableBoard(false);

        particles = [];
        popups = [];
        updateUI();

        const bsModal = document.getElementById('boosterShopModal');
        if (bsModal) bsModal.classList.add('hidden');
        document.getElementById('gameOverModal').classList.add('hidden');
        document.getElementById('victoryModal').classList.add('hidden');
        const levelsModal = document.getElementById('levelsModal');
        if (levelsModal) levelsModal.classList.add('hidden');
    }

    function openLevelsModal() {
        const gridEl = document.getElementById('levelsGrid');
        const summaryEl = document.getElementById('levelsSummaryText');
        if (!gridEl) return;

        let totalStars = 0;
        const displayCount = Math.max(CAMPAIGN_LEVEL_COUNT, maxLevel + 5);
        const maxStars = displayCount * 3;
        gridEl.innerHTML = '';

        for (let idx = 0; idx < displayCount; idx++) {
            const lvl = getLevelConfig(idx);
            const unlocked = idx <= maxLevel;
            const stars = levelStars[String(idx)] || 0;
            if (unlocked) totalStars += stars;

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `level-tile ${unlocked ? 'unlocked' : 'locked'} ${idx === currentLevelIdx ? 'current' : ''}`;
            btn.title = `${lvl.level}. ${lvl.name}`;
            btn.disabled = !unlocked;

            let starsHtml = '';
            if (unlocked) {
                for (let s = 1; s <= 3; s++) {
                    const col = s <= stars ? '#ffd54f' : 'rgba(255,255,255,0.22)';
                    starsHtml += `<svg width="11" height="11" viewBox="0 0 24 24" fill="${col}"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
                }
            } else {
                starsHtml = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';
            }

            btn.innerHTML = `<span class="level-tile-num">${lvl.level}</span><span class="level-tile-stars">${starsHtml}</span>`;
            if (unlocked) {
                btn.addEventListener('click', () => {
                    document.getElementById('levelsModal').classList.add('hidden');
                    if (idx !== currentLevelIdx) {
                        resetLevel(idx);
                    }
                });
            }
            gridEl.appendChild(btn);
        }

        if (summaryEl) {
            summaryEl.textContent = `Открыто клумб: ${maxLevel + 1} из ${displayCount} • Звёзд: ${totalStars}/${maxStars}`;
        }
        document.getElementById('levelsModal').classList.remove('hidden');
    }

    function setupEvents() {
        const startAudioOnce = () => {
            window.flowerAudio.init();
            window.flowerAudio.startAmbientMusic();
        };
        window.addEventListener('pointerdown', startAudioOnce, { once: true });

        canvas.style.touchAction = 'none';

        canvas.addEventListener('pointerdown', (e) => {
            if (isProcessingMatches || isGameOver || isWon) return;
            idleTime = 0;
            hintPair = null;
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) * (CANVAS_SIZE / rect.width);
            const y = (e.clientY - rect.top) * (CANVAS_SIZE / rect.height);
            const c = Math.floor(x / CELL_SIZE);
            const r = Math.floor(y / CELL_SIZE);
            if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) return;

            const cell = grid[r][c];
            if (!cell) return;

            if (activeTool === 'can') {
                useWateringCan(r, c);
                return;
            }
            if (activeTool === 'trowel') {
                useTrowel(r, c);
                return;
            }

            if (cell.isStone || cell.frostLevel > 0) {
                window.flowerAudio.playDrop();
                trauma = Math.min(1.0, trauma + 0.12);
                spawnPopup((c + 0.5) * CELL_SIZE, (r + 0.5) * CELL_SIZE, cell.isStone ? 'СОРНЯК!' : 'ЖУКИ!', '#e65100');
                return;
            }

            try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
            dragStart = {
                r,
                c,
                clientX: e.clientX,
                clientY: e.clientY,
                handledSwap: false
            };
        });

        canvas.addEventListener('pointermove', (e) => {
            if (!dragStart || dragStart.handledSwap || isProcessingMatches || isGameOver || isWon) return;
            const dx = e.clientX - dragStart.clientX;
            const dy = e.clientY - dragStart.clientY;
            if (Math.hypot(dx, dy) < 14) return;

            dragStart.handledSwap = true;
            selectedCell = null;

            let dr = 0, dc = 0;
            if (Math.abs(dx) >= Math.abs(dy)) {
                dc = dx > 0 ? 1 : -1;
            } else {
                dr = dy > 0 ? 1 : -1;
            }

            const nr = dragStart.r + dr;
            const nc = dragStart.c + dc;
            if (nr < 0 || nr >= GRID_SIZE || nc < 0 || nc >= GRID_SIZE) return;
            const target = grid[nr][nc];
            if (!target) return;

            if (target.isStone || target.frostLevel > 0) {
                window.flowerAudio.playDrop();
                trauma = Math.min(1.0, trauma + 0.12);
                spawnPopup((nc + 0.5) * CELL_SIZE, (nr + 0.5) * CELL_SIZE, target.isStone ? 'СОРНЯК!' : 'ЖУКИ!', '#e65100');
                return;
            }

            trySwap({ r: dragStart.r, c: dragStart.c }, { r: nr, c: nc });
        });

        canvas.addEventListener('pointerup', (e) => {
            try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
            if (dragStart && !dragStart.handledSwap) {
                handleCellTap(dragStart.r, dragStart.c);
            }
            dragStart = null;
        });

        canvas.addEventListener('pointercancel', (e) => {
            try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
            dragStart = null;
        });

        document.getElementById('musicBtn').addEventListener('click', () => {
            window.flowerAudio.toggleMusic();
            syncAudioButtons();
        });
        document.getElementById('hubMusicBtn').addEventListener('click', () => {
            window.flowerAudio.toggleMusic();
            syncAudioButtons();
        });

        document.getElementById('soundBtn').addEventListener('click', () => {
            window.flowerAudio.toggleMute();
            syncAudioButtons();
        });
        document.getElementById('hubSoundBtn').addEventListener('click', () => {
            window.flowerAudio.toggleMute();
            syncAudioButtons();
        });

        document.getElementById('menuBackBtn').addEventListener('click', () => openHub('tabKlumba'));
        document.getElementById('goMenuBtn').addEventListener('click', () => openHub('tabKlumba'));
        document.getElementById('victoryMenuBtn').addEventListener('click', () => openHub('tabKlumba'));

        document.getElementById('hubPlayBtn').addEventListener('click', () => {
            startLevel(maxLevel);
        });

        document.querySelectorAll('.hub-nav-btn').forEach(btn => {
            btn.addEventListener('click', () => switchHubTab(btn.dataset.tab));
        });

        document.getElementById('hubDailyClaimBtn').addEventListener('click', () => {
            if (!isDailyAvailable()) return;
            const d = DAILY_REWARDS[dailyStreak % DAILY_REWARDS.length];
            dailyStreak++;
            dailyLastClaimAt = Date.now();
            coins += d.coins;
            stats.totalCoinsEarned += d.coins;
            bridge.setCoins(coins);
            bridge.saveCloudProgress('dailyStreak', dailyStreak);
            bridge.saveCloudProgress('dailyLast', dailyLastClaimAt);
            saveStats();
            if (d.tool) grantTool(d.tool, 1);
            window.flowerAudio.playFanfare();
            bridge.showToast(`День ${d.day}: +${d.coins} монет!`);
            updateUI();
            renderHub();
        });

        document.getElementById('hubShareBtn').addEventListener('click', () => {
            const msg = `Я играю в «Цветочную Клумбу — Узоры Сада»: пройдено клумб — ${maxLevel + 1}, собрано ${stats.totalCoinsEarned} монет и ${getTotalStarsCount()} звёзд!`;
            bridge.sharePost(msg).then((ok) => {
                if (!ok) {
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(msg).catch(() => {});
                    }
                    bridge.showToast('Текст результата готов — можно делиться с друзьями!');
                }
            });
        });

        document.querySelectorAll('[data-buy-tool]').forEach(btn => {
            btn.addEventListener('click', () => {
                const key = btn.dataset.buyTool;
                const cfg = TOOLS_CFG[key];
                if (!cfg) return;
                bridge.coins = coins;
                bridge.makePurchase(cfg.title, cfg.cost, () => {
                    coins = bridge.getCoins();
                    grantTool(key, 1);
                });
            });
        });

        document.querySelectorAll('[data-ad-tool]').forEach(btn => {
            btn.addEventListener('click', () => {
                const key = btn.dataset.adTool;
                const cfg = TOOLS_CFG[key];
                if (!cfg) return;
                bridge.showRewardVideo(() => {
                    grantTool(key, cfg.adAmount);
                });
            });
        });

        document.getElementById('restartBtn').addEventListener('click', () => {
            bridge.showInterstitialAd(() => resetLevel(currentLevelIdx));
        });
        document.getElementById('goRestartBtn').addEventListener('click', () => {
            bridge.showInterstitialAd(() => resetLevel(currentLevelIdx));
        });

        const setActiveTool = (tool) => {
            activeTool = activeTool === tool ? null : tool;
            isCanMode = activeTool === 'can';
            document.getElementById('canBtn').classList.toggle('active', activeTool === 'can');
            document.getElementById('trowelBtn').classList.toggle('active', activeTool === 'trowel');
            window.flowerAudio.playSelect();
        };

        document.getElementById('canBtn').addEventListener('click', () => {
            if (canBoosterCount <= 0) { openBoosterShop('can'); return; }
            setActiveTool('can');
        });

        document.getElementById('trowelBtn').addEventListener('click', () => {
            if (trowelCount <= 0) { openBoosterShop('trowel'); return; }
            setActiveTool('trowel');
        });

        document.getElementById('shuffleBtn').addEventListener('click', () => {
            if (isProcessingMatches || isGameOver || isWon) return;
            if (shuffleCount <= 0) { openBoosterShop('shuffle'); return; }
            useShuffle();
        });

        document.getElementById('levelBadge').addEventListener('click', openLevelsModal);
        document.getElementById('closeLevelsModalBtn').addEventListener('click', () => {
            document.getElementById('levelsModal').classList.add('hidden');
        });

        document.getElementById('closeBoosterModalBtn').addEventListener('click', () => {
            document.getElementById('boosterShopModal').classList.add('hidden');
        });

        document.getElementById('buyBoosterCoinsBtn').addEventListener('click', () => {
            const cfg = TOOLS_CFG[shopTargetTool] || TOOLS_CFG.can;
            bridge.coins = coins;
            bridge.makePurchase(cfg.title, cfg.cost, () => {
                coins = bridge.getCoins();
                grantTool(shopTargetTool, 1);
                document.getElementById('boosterShopModal').classList.add('hidden');
                spawnPopup(200, 200, '+1 ИНСТРУМЕНТ!', '#ffd54f');
            });
        });

        document.getElementById('getBoosterAdBtn').addEventListener('click', () => {
            const cfg = TOOLS_CFG[shopTargetTool] || TOOLS_CFG.can;
            bridge.showRewardVideo(() => {
                grantTool(shopTargetTool, cfg.adAmount);
                document.getElementById('boosterShopModal').classList.add('hidden');
                spawnPopup(200, 200, `+${cfg.adAmount} ПОЛУЧЕНО!`, '#00838f');
            });
        });

        document.getElementById('buyMovesCoinsBtn').addEventListener('click', () => {
            bridge.coins = coins;
            bridge.makePurchase('+5 ходов', 200, () => {
                coins = bridge.getCoins();
                movesLeft += 5;
                isGameOver = false;
                document.getElementById('gameOverModal').classList.add('hidden');
                updateUI();
                spawnPopup(200, 200, '+5 ХОДОВ!', '#ffd54f');
            });
        });

        document.getElementById('adReviveBtn').addEventListener('click', () => {
            bridge.showRewardVideo(() => {
                movesLeft += 5;
                isGameOver = false;
                document.getElementById('gameOverModal').classList.add('hidden');
                updateUI();
                spawnPopup(200, 200, '+5 ХОДОВ!', '#ffb300');
            });
        });

        document.getElementById('nextLevelBtn').addEventListener('click', () => {
            if (bridge.isAdShowing) return;
            currentLevelIdx = currentLevelIdx + 1;
            bridge.saveCloudProgress('level', currentLevelIdx);
            bridge.showInterstitialAd(() => resetLevel(currentLevelIdx));
        });
    }

    function handleCellTap(r, c) {
        if (isProcessingMatches || isGameOver || isWon) return;
        const cell = grid[r][c];
        if (!cell || cell.isStone || cell.frostLevel > 0) return;

        if (!selectedCell) {
            selectedCell = { r, c };
            cell.scaleY = 0.78;
            cell.squashVel = 2.0;
            window.flowerAudio.playSelect();
        } else {
            const dr = Math.abs(selectedCell.r - r);
            const dc = Math.abs(selectedCell.c - c);

            if (selectedCell.r === r && selectedCell.c === c) {
                if (cell.power) {
                    selectedCell = null;
                    movesLeft = Math.max(0, movesLeft - 1);
                    updateUI();
                    triggerManualBlast([{ r, c, reason: cell.power === 'sun' ? 'sun' : 'power' }]);
                    return;
                }
                selectedCell = null;
                return;
            }

            if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
                trySwap(selectedCell, { r, c });
                selectedCell = null;
            } else {
                selectedCell = { r, c };
                cell.scaleY = 0.78;
                cell.squashVel = 2.0;
                window.flowerAudio.playSelect();
            }
        }
    }

    function useWateringCan(centerR, centerC) {
        canBoosterCount--;
        bridge.saveCloudProgress('cans', canBoosterCount);
        isCanMode = false;
        activeTool = null;
        idleTime = 0;
        hintPair = null;
        document.getElementById('canBtn').classList.remove('active');

        window.flowerAudio.playSplash();
        trauma = 0.48;

        const powerSeeds = [];
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const nr = centerR + dr;
                const nc = centerC + dc;
                if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
                    const c = grid[nr][nc];
                    if (c) {
                        if (c.isStone) {
                            c.isStone = false;
                            c.power = null;
                            c.id = Math.floor(Math.random() * 5);
                            goalProgress.stonesBroken++;
                        }
                        if (c.frostLevel > 0) {
                            c.frostLevel = 0;
                            goalProgress.frozenMelted++;
                        }
                        if (c.power) {
                            powerSeeds.push({ r: nr, c: nc, reason: 'power' });
                        }
                        c.scaleY = 0.72;
                        c.squashVel = 2.2;
                        spawnBurst(nc * CELL_SIZE + CELL_SIZE / 2, nr * CELL_SIZE + CELL_SIZE / 2, '#26c6da', 12);
                    }
                }
            }
        }

        spawnPopup(centerC * CELL_SIZE + CELL_SIZE / 2, centerR * CELL_SIZE + CELL_SIZE / 2, 'ПОЛИТО!', '#00838f');
        updateUI();
        comboCount = 0;
        if (powerSeeds.length > 0) {
            triggerManualBlast(powerSeeds);
        } else {
            processMatchesCascade(0, null);
        }
    }

    function useTrowel(r, c) {
        const cell = grid[r][c];
        if (!cell) return;
        trowelCount--;
        bridge.saveCloudProgress('trowels', trowelCount);
        activeTool = null;
        idleTime = 0;
        hintPair = null;
        document.getElementById('trowelBtn').classList.remove('active');
        window.flowerAudio.playDrop();
        trauma = 0.3;

        if (cell.isStone) {
            cell.isStone = false;
            cell.power = null;
            cell.id = Math.floor(Math.random() * 5);
            goalProgress.stonesBroken++;
            stats.weedsCleared++;
            saveStats();
            spawnBurst(c * CELL_SIZE + CELL_SIZE / 2, r * CELL_SIZE + CELL_SIZE / 2, '#8bc34a', 14);
            spawnPopup(c * CELL_SIZE + CELL_SIZE / 2, r * CELL_SIZE + CELL_SIZE / 2, 'ВЫКОПАНО!', '#ffd54f');
            updateUI();
            processMatchesCascade(0, null);
            return;
        }
        if (cell.frostLevel > 0) {
            cell.frostLevel = 0;
            goalProgress.frozenMelted++;
            stats.bugsCleared++;
            saveStats();
            spawnBurst(c * CELL_SIZE + CELL_SIZE / 2, r * CELL_SIZE + CELL_SIZE / 2, '#ffb300', 14);
            spawnPopup(c * CELL_SIZE + CELL_SIZE / 2, r * CELL_SIZE + CELL_SIZE / 2, 'УБРАН ЖУК!', '#ff6f00');
            updateUI();
            processMatchesCascade(0, null);
            return;
        }
        spawnPopup(c * CELL_SIZE + CELL_SIZE / 2, r * CELL_SIZE + CELL_SIZE / 2, 'СОВКОМ!', '#ffd54f');
        updateUI();
        triggerManualBlast([{ r, c, reason: cell.power === 'sun' ? 'sun' : 'power' }]);
    }

    function useShuffle() {
        shuffleCount--;
        bridge.saveCloudProgress('shuffles', shuffleCount);
        activeTool = null;
        idleTime = 0;
        hintPair = null;
        document.getElementById('canBtn').classList.remove('active');
        document.getElementById('trowelBtn').classList.remove('active');
        window.flowerAudio.playRustle();

        const movable = [];
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                const cell = grid[r][c];
                if (cell && !cell.isStone && cell.frostLevel === 0 && cell.power !== 'sun' && !cell.power) {
                    movable.push(cell);
                }
            }
        }
        for (let attempt = 0; attempt < 25; attempt++) {
            const ids = movable.map(() => Math.floor(Math.random() * 5));
            movable.forEach((cell, i) => {
                cell.id = ids[i];
                cell.scaleY = 0.78;
                cell.squashVel = 2.0;
            });
            if (findMatches().length === 0 && hasPossibleMove()) break;
        }
        spawnBurst(CANVAS_SIZE / 2, CANVAS_SIZE / 2, '#c5e1a5', 22);
        spawnPopup(CANVAS_SIZE / 2, CANVAS_SIZE / 2, 'СВЕЖИЙ ВЕТЕРОК!', '#2e7d32');
        updateUI();
    }

    function trySwap(p1, p2) {
        if (isProcessingMatches || swapAnim) return;
        const c1 = grid[p1.r][p1.c];
        const c2 = grid[p2.r][p2.c];
        if (!c1 || !c2 || c1.isStone || c2.isStone || c1.frostLevel > 0 || c2.frostLevel > 0) return;

        isProcessingMatches = true;
        idleTime = 0;
        hintPair = null;
        lastSwap = { p1: { r: p1.r, c: p1.c }, p2: { r: p2.r, c: p2.c } };
        grid[p1.r][p1.c] = c2;
        grid[p2.r][p2.c] = c1;

        const dx = (p2.c - p1.c) * CELL_SIZE;
        const dy = (p2.r - p1.r) * CELL_SIZE;
        c1.animOffsetX = -dx;
        c1.animOffsetY = -dy;
        c2.animOffsetX = dx;
        c2.animOffsetY = dy;

        window.flowerAudio.playRustle();
        swapAnim = {
            p1, p2, c1, c2,
            dx, dy,
            t: 0,
            duration: 0.16,
            reversing: false
        };
    }

    function isMatchableFlower(cell) {
        return !!(cell && !cell.popping && !cell.isStone && cell.frostLevel === 0 && cell.id >= 0 && cell.id < 5);
    }

    function analyzeMatches(swapHint = null) {
        const hRuns = [];
        const vRuns = [];

        for (let r = 0; r < GRID_SIZE; r++) {
            let run = [];
            for (let c = 0; c < GRID_SIZE; c++) {
                const curr = grid[r][c];
                const prev = run.length ? grid[run[0].r][run[0].c] : null;
                if (isMatchableFlower(curr) && (!prev || prev.id === curr.id)) {
                    run.push({ r, c });
                } else {
                    if (run.length >= 3) hRuns.push(run);
                    run = isMatchableFlower(curr) ? [{ r, c }] : [];
                }
            }
            if (run.length >= 3) hRuns.push(run);
        }

        for (let c = 0; c < GRID_SIZE; c++) {
            let run = [];
            for (let r = 0; r < GRID_SIZE; r++) {
                const curr = grid[r][c];
                const prev = run.length ? grid[run[0].r][run[0].c] : null;
                if (isMatchableFlower(curr) && (!prev || prev.id === curr.id)) {
                    run.push({ r, c });
                } else {
                    if (run.length >= 3) vRuns.push(run);
                    run = isMatchableFlower(curr) ? [{ r, c }] : [];
                }
            }
            if (run.length >= 3) vRuns.push(run);
        }

        const matchedMap = new Map();
        hRuns.forEach(run => run.forEach(p => matchedMap.set(`${p.r},${p.c}`, p)));
        vRuns.forEach(run => run.forEach(p => matchedMap.set(`${p.r},${p.c}`, p)));

        const pickAnchor = (coords) => {
            if (swapHint) {
                const s2 = coords.find(p => p.r === swapHint.p2.r && p.c === swapHint.p2.c);
                if (s2) return s2;
                const s1 = coords.find(p => p.r === swapHint.p1.r && p.c === swapHint.p1.c);
                if (s1) return s1;
            }
            return coords[Math.floor(coords.length / 2)];
        };

        const spawns = [];
        const usedH = new Set();
        const usedV = new Set();

        hRuns.forEach((hRun, hi) => {
            vRuns.forEach((vRun, vi) => {
                if (usedH.has(hi) || usedV.has(vi)) return;
                const hId = grid[hRun[0].r][hRun[0].c].id;
                const vId = grid[vRun[0].r][vRun[0].c].id;
                if (hId !== vId) return;
                const inter = hRun.find(hp => vRun.some(vp => vp.r === hp.r && vp.c === hp.c));
                if (inter) {
                    usedH.add(hi);
                    usedV.add(vi);
                    const power = (hRun.length >= 5 || vRun.length >= 5) ? 'sun' : 'bomb';
                    spawns.push({ r: inter.r, c: inter.c, power, flowerId: hId });
                }
            });
        });

        hRuns.forEach((run, hi) => {
            if (usedH.has(hi) || run.length < 4) return;
            const anchor = pickAnchor(run);
            const flowerId = grid[run[0].r][run[0].c].id;
            spawns.push({ r: anchor.r, c: anchor.c, power: run.length >= 5 ? 'sun' : 'row', flowerId });
        });

        vRuns.forEach((run, vi) => {
            if (usedV.has(vi) || run.length < 4) return;
            const anchor = pickAnchor(run);
            const flowerId = grid[run[0].r][run[0].c].id;
            spawns.push({ r: anchor.r, c: anchor.c, power: run.length >= 5 ? 'sun' : 'col', flowerId });
        });

        return {
            matched: Array.from(matchedMap.values()),
            spawns
        };
    }

    function findMatches() {
        return analyzeMatches(null).matched;
    }

    function findFirstPossibleMove() {
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                const cur = grid[r][c];
                if (!cur || cur.isStone || cur.frostLevel > 0) continue;

                const neighbors = [[0, 1], [1, 0]];
                for (const [dr, dc] of neighbors) {
                    const nr = r + dr, nc = c + dc;
                    if (nr < GRID_SIZE && nc < GRID_SIZE) {
                        const nxt = grid[nr][nc];
                        if (!nxt || nxt.isStone || nxt.frostLevel > 0) continue;
                        if (cur.power === 'sun' || nxt.power === 'sun' || (cur.power && nxt.power)) {
                            return [{ r, c }, { r: nr, c: nc }];
                        }
                        grid[r][c] = nxt;
                        grid[nr][nc] = cur;
                        const found = findMatches().length > 0;
                        grid[r][c] = cur;
                        grid[nr][nc] = nxt;
                        if (found) return [{ r, c }, { r: nr, c: nc }];
                    }
                }
            }
        }
        return null;
    }

    function hasPossibleMove() {
        return findFirstPossibleMove() !== null;
    }

    function ensurePlayableBoard(showPopupNotice = true) {
        if (hasPossibleMove()) return;
        const movable = [];
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                const cell = grid[r][c];
                if (cell && !cell.isStone && cell.frostLevel === 0 && cell.power !== 'sun') {
                    movable.push(cell);
                }
            }
        }
        if (movable.length < 3) return;

        for (let attempt = 0; attempt < 25; attempt++) {
            const ids = movable.map(() => Math.floor(Math.random() * 5));
            let k = 0;
            for (let r = 0; r < GRID_SIZE; r++) {
                for (let c = 0; c < GRID_SIZE; c++) {
                    const cell = grid[r][c];
                    if (cell && !cell.isStone && cell.frostLevel === 0 && cell.power !== 'sun') {
                        cell.id = ids[k++];
                    }
                }
            }
            if (findMatches().length === 0 && hasPossibleMove()) break;
        }
        if (showPopupNotice) {
            spawnPopup(CANVAS_SIZE / 2, CANVAS_SIZE / 2, 'САД ОБНОВЛЁН!', '#2e7d32');
        }
    }

    function pickDominantFlowerId() {
        const counts = [0, 0, 0, 0, 0];
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                const cell = grid[r][c];
                if (cell && !cell.isStone && cell.id >= 0 && cell.id < 5) counts[cell.id]++;
            }
        }
        let best = 0;
        for (let i = 1; i < 5; i++) {
            if (counts[i] > counts[best]) best = i;
        }
        return best;
    }

    function expandPowerups(seedTargets, sunTargetId = null) {
        const destroyMap = new Map();
        const queue = [];
        const triggeredPowers = new Set();

        const enqueue = (r, c, reason) => {
            if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) return;
            const cell = grid[r][c];
            if (!cell || cell.popping) return;
            const key = `${r},${c}`;
            const existing = destroyMap.get(key);
            if (!existing || (existing.reason === 'match' && reason !== 'match')) {
                destroyMap.set(key, { r, c, reason });
            }
            if (cell.power && !triggeredPowers.has(key)) {
                queue.push({ r, c, key });
            }
        };

        seedTargets.forEach(t => enqueue(t.r, t.c, t.reason || 'match'));

        while (queue.length > 0) {
            const item = queue.shift();
            if (triggeredPowers.has(item.key)) continue;
            const cell = grid[item.r][item.c];
            if (!cell || !cell.power) continue;
            triggeredPowers.add(item.key);

            if (cell.power === 'row') {
                spawnPopup(CANVAS_SIZE / 2, (item.r + 0.5) * CELL_SIZE, 'РЯД!', '#ffd54f');
                beams.push({ kind: 'row', r: item.r, life: 1.0 });
                for (let cc = 0; cc < GRID_SIZE; cc++) enqueue(item.r, cc, 'power');
            } else if (cell.power === 'col') {
                spawnPopup((item.c + 0.5) * CELL_SIZE, CANVAS_SIZE / 2, 'СТОЛБЕЦ!', '#ffd54f');
                beams.push({ kind: 'col', c: item.c, life: 1.0 });
                for (let rr = 0; rr < GRID_SIZE; rr++) enqueue(rr, item.c, 'power');
            } else if (cell.power === 'bomb') {
                spawnPopup((item.c + 0.5) * CELL_SIZE, (item.r + 0.5) * CELL_SIZE, 'БУКЕТ-БУМ!', '#ff6f00');
                shockwaves.push({
                    x: (item.c + 0.5) * CELL_SIZE,
                    y: (item.r + 0.5) * CELL_SIZE,
                    maxR: CELL_SIZE * 2.2,
                    color: '#ffb300',
                    life: 1.0
                });
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) enqueue(item.r + dr, item.c + dc, 'power');
                }
            } else if (cell.power === 'sun') {
                const targetId = (sunTargetId === 'ALL' || (typeof sunTargetId === 'number' && sunTargetId >= 0 && sunTargetId < 5))
                    ? sunTargetId
                    : pickDominantFlowerId();
                spawnPopup(CANVAS_SIZE / 2, CANVAS_SIZE / 2, targetId === 'ALL' ? 'СОЛНЕЧНЫЙ ВЗРЫВ!' : 'СОЛНЕЧНЫЙ ЛОТОС!', '#ffd54f');
                const sx = (item.c + 0.5) * CELL_SIZE;
                const sy = (item.r + 0.5) * CELL_SIZE;
                shockwaves.push({ x: sx, y: sy, maxR: CELL_SIZE * 3.4, color: '#ffee58', life: 1.0 });
                for (let rr = 0; rr < GRID_SIZE; rr++) {
                    for (let cc = 0; cc < GRID_SIZE; cc++) {
                        const targetCell = grid[rr][cc];
                        if (!targetCell) continue;
                        if (targetId === 'ALL' || targetCell.id === targetId) {
                            beams.push({
                                kind: 'ray',
                                x1: sx,
                                y1: sy,
                                x2: (cc + 0.5) * CELL_SIZE,
                                y2: (rr + 0.5) * CELL_SIZE,
                                life: 1.0
                            });
                            enqueue(rr, cc, 'sun');
                        }
                    }
                }
            }
        }

        return Array.from(destroyMap.values());
    }

    function executeClearStep(matchCoords, blastTargets, spawns, comboLabel) {
        const token = levelToken;
        const lvl = getLevelConfig(currentLevelIdx);

        const spawnMap = new Map();
        spawns.forEach(sp => spawnMap.set(`${sp.r},${sp.c}`, sp));

        const adjacentCells = new Set();
        matchCoords.forEach(({ r, c }) => {
            [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dr, dc]) => {
                const nr = r + dr;
                const nc = c + dc;
                if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
                    adjacentCells.add(`${nr},${nc}`);
                }
            });
        });

        adjacentCells.forEach(coord => {
            const [ar, ac] = coord.split(',').map(Number);
            const adj = grid[ar][ac];
            if (adj && !adj.popping) {
                if (adj.isStone) {
                    adj.isStone = false;
                    adj.power = null;
                    adj.id = Math.floor(Math.random() * 5);
                    adj.scaleY = 0.68;
                    adj.squashVel = 2.6;
                    goalProgress.stonesBroken++;
                    stats.weedsCleared++;
                    spawnBurst(ac * CELL_SIZE + CELL_SIZE / 2, ar * CELL_SIZE + CELL_SIZE / 2, '#8bc34a', 14);
                    spawnPopup(ac * CELL_SIZE + CELL_SIZE / 2, ar * CELL_SIZE + CELL_SIZE / 2, 'СОРНЯК ВЫРВАН!', '#ffeb3b');
                } else if (adj.frostLevel > 0) {
                    adj.frostLevel--;
                    adj.scaleY = 0.72;
                    adj.squashVel = 2.4;
                    if (adj.frostLevel === 0) {
                        goalProgress.frozenMelted++;
                        stats.bugsCleared++;
                    }
                    spawnBurst(ac * CELL_SIZE + CELL_SIZE / 2, ar * CELL_SIZE + CELL_SIZE / 2, '#ffb300', 12);
                    spawnPopup(ac * CELL_SIZE + CELL_SIZE / 2, ar * CELL_SIZE + CELL_SIZE / 2, adj.frostLevel === 0 ? 'ЖУК УЛЕТЕЛ!' : 'СПУГНУЛИ!', '#ff6f00');
                }
            }
        });

        let clearedCount = 0;
        blastTargets.forEach(({ r, c, reason }) => {
            const key = `${r},${c}`;
            const cell = grid[r][c];
            if (!cell || cell.popping) return;

            if (spawnMap.has(key) && !cell.power) return;

            if (cell.isStone) {
                if (reason === 'power' || reason === 'sun') {
                    cell.isStone = false;
                    cell.power = null;
                    cell.id = Math.floor(Math.random() * 5);
                    cell.scaleY = 0.68;
                    cell.squashVel = 2.6;
                    goalProgress.stonesBroken++;
                    stats.weedsCleared++;
                    spawnBurst(c * CELL_SIZE + CELL_SIZE / 2, r * CELL_SIZE + CELL_SIZE / 2, '#8bc34a', 12);
                }
                return;
            }

            if (cell.frostLevel > 0) {
                if (reason === 'power' || reason === 'sun') {
                    cell.frostLevel--;
                    cell.scaleY = 0.72;
                    cell.squashVel = 2.4;
                    if (cell.frostLevel === 0) {
                        goalProgress.frozenMelted++;
                        stats.bugsCleared++;
                    }
                    spawnBurst(c * CELL_SIZE + CELL_SIZE / 2, r * CELL_SIZE + CELL_SIZE / 2, '#ffb300', 10);
                }
                return;
            }

            if (lvl.targetFlowerId !== undefined && cell.id === lvl.targetFlowerId) {
                goalProgress.flowers++;
            }
            cell.popping = true;
            cell.popT = 0;
            cell.popScale = 1;
            clearedCount++;
            const color = FLOWER_TYPES[cell.id] ? FLOWER_TYPES[cell.id].color : '#ffd54f';
            spawnBurst(c * CELL_SIZE + CELL_SIZE / 2, r * CELL_SIZE + CELL_SIZE / 2, color, 8);
        });

        spawns.forEach(sp => {
            const cell = grid[sp.r][sp.c];
            if (!cell) return;
            cell.popping = false;
            cell.popT = 0;
            cell.popScale = 1.15;
            cell.scaleY = 0.74;
            cell.squashVel = 2.5;
            cell.power = sp.power;
            cell.id = sp.power === 'sun' ? 99 : sp.flowerId;
            const px = sp.c * CELL_SIZE + CELL_SIZE / 2;
            const py = sp.r * CELL_SIZE + CELL_SIZE / 2;
            const label = sp.power === 'sun' ? 'ЛОТОС!' : (sp.power === 'bomb' ? 'ОДУВАНЧИК!' : 'ШМЕЛЬ!');
            spawnBurst(px, py, '#ffd54f', 16);
            spawnPopup(px, py - 10, label, '#ffe082');
        });

        stats.matchesCleared += clearedCount;
        stats.powerupsCreated += spawns.length;
        saveStats();

        const mult = Math.min(4, Math.max(1, comboLabel));
        const points = Math.max(30, clearedCount * 15 * mult);
        score += points;
        window.flowerAudio.playMatchChime(mult);
        trauma = Math.min(1.0, trauma + 0.25 + mult * 0.08);

        if (blastTargets.length > 0) {
            const mid = blastTargets[Math.floor(blastTargets.length / 2)];
            const msg = mult > 1 ? `Комбо x${mult}! +${points}` : `+${points}`;
            spawnPopup(mid.c * CELL_SIZE + CELL_SIZE / 2, mid.r * CELL_SIZE + CELL_SIZE / 2, msg, mult > 1 ? '#ffd54f' : '#ff8f00');
        }

        updateUI();

        setTimeout(() => {
            if (token !== levelToken || isGameOver || isWon) return;
            for (let r = 0; r < GRID_SIZE; r++) {
                for (let c = 0; c < GRID_SIZE; c++) {
                    const cell = grid[r][c];
                    if (cell && cell.popping) {
                        const color = FLOWER_TYPES[cell.id] ? FLOWER_TYPES[cell.id].color : '#ffd54f';
                        spawnBurst(c * CELL_SIZE + CELL_SIZE / 2, r * CELL_SIZE + CELL_SIZE / 2, color, 9);
                        grid[r][c] = null;
                    }
                }
            }
            applyGravityAndRefill();
            waitUntilSettled(token, () => {
                setTimeout(() => {
                    if (token !== levelToken) return;
                    processMatchesCascade(comboLabel + 1, null);
                }, 70);
            });
        }, 190);
    }

    function triggerManualBlast(seedTargets, sunTargetId = null) {
        isProcessingMatches = true;
        comboCount++;
        const blastTargets = expandPowerups(seedTargets, sunTargetId);
        executeClearStep([], blastTargets, [], comboCount);
    }

    function processMatchesCascade(comboStep = 1, swapHint = null) {
        isProcessingMatches = true;
        const analysis = analyzeMatches(swapHint);
        if (analysis.matched.length === 0) {
            ensurePlayableBoard(true);
            isProcessingMatches = false;
            comboCount = 0;
            lastSwap = null;
            checkLevelStatus();
            return;
        }

        comboCount = comboStep;
        const seeds = analysis.matched.map(p => ({ r: p.r, c: p.c, reason: 'match' }));
        const blastTargets = expandPowerups(seeds);
        executeClearStep(analysis.matched, blastTargets, analysis.spawns, comboStep);
    }

    function waitUntilSettled(token, callback) {
        function check() {
            if (token !== levelToken || isGameOver || isWon) return;
            for (let r = 0; r < GRID_SIZE; r++) {
                for (let c = 0; c < GRID_SIZE; c++) {
                    const cell = grid[r][c];
                    if (cell && (Math.abs(cell.animOffsetY || 0) > 1.5 || Math.abs(cell.animOffsetX || 0) > 1.5)) {
                        requestAnimationFrame(check);
                        return;
                    }
                }
            }
            callback();
        }
        requestAnimationFrame(check);
    }

    function applyGravityAndRefill() {
        const lvl = getLevelConfig(currentLevelIdx);

        for (let c = 0; c < GRID_SIZE; c++) {
            let spawnCount = 0;
            for (let r = GRID_SIZE - 1; r >= 0; r--) {
                if (lvl.mask[r][c] === 1 && grid[r][c] === null) {
                    let foundR = -1;
                    for (let aboveR = r - 1; aboveR >= 0; aboveR--) {
                        if (lvl.mask[aboveR][c] === 0) break;
                        const aboveCell = grid[aboveR][c];
                        if (aboveCell) {
                            if (aboveCell.isStone || aboveCell.frostLevel > 0) break;
                            foundR = aboveR;
                            break;
                        }
                    }

                    if (foundR !== -1) {
                        grid[r][c] = grid[foundR][c];
                        grid[foundR][c] = null;
                        grid[r][c].animOffsetX = 0;
                        grid[r][c].animOffsetY = -(r - foundR) * CELL_SIZE;
                    } else {
                        grid[r][c] = {
                            id: Math.floor(Math.random() * 5),
                            power: null,
                            isStone: false,
                            frostLevel: 0,
                            scaleX: 1,
                            scaleY: 1,
                            squashVel: 0,
                            animOffsetX: 0,
                            animOffsetY: -CELL_SIZE * (1.2 + spawnCount * 0.75),
                            popScale: 1,
                            popping: false,
                            popT: 0
                        };
                        spawnCount++;
                    }
                }
            }
        }
    }

    function checkLevelStatus() {
        if (isWon || isGameOver) return;

        const lvl = getLevelConfig(currentLevelIdx);
        let won = false;

        if (lvl.goalType === 'flower') {
            won = goalProgress.flowers >= lvl.targetCount;
        } else if (lvl.goalType === 'unfreeze_and_flower') {
            won = goalProgress.frozenMelted >= lvl.targetFrozen && goalProgress.flowers >= lvl.targetCount;
        } else if (lvl.goalType === 'stones_and_flower') {
            won = goalProgress.stonesBroken >= lvl.targetStones && goalProgress.flowers >= lvl.targetCount;
        } else if (lvl.goalType === 'unfreeze') {
            won = goalProgress.frozenMelted >= lvl.targetFrozen;
        } else if (lvl.goalType === 'stones_frozen_flower') {
            won = goalProgress.stonesBroken >= lvl.targetStones &&
                  goalProgress.frozenMelted >= lvl.targetFrozen &&
                  goalProgress.flowers >= lvl.targetCount;
        }

        if (won) {
            isWon = true;
            window.flowerAudio.playFanfare();
            trauma = 0.5;

            let starCount = 3;
            if (movesLeft < 4) starCount = 1;
            else if (movesLeft < 10) starCount = 2;

            const moveBonusScore = movesLeft * 25;
            const moveBonusCoins = movesLeft * 2;
            score += moveBonusScore;
            const totalReward = lvl.reward + moveBonusCoins;
            coins += totalReward;
            stats.totalCoinsEarned += totalReward;
            bridge.setCoins(coins);
            saveStats();

            const key = String(currentLevelIdx);
            levelStars[key] = Math.max(levelStars[key] || 0, starCount);
            bridge.saveCloudProgress('levelStars', levelStars);
            if (currentLevelIdx + 1 > maxLevel) {
                maxLevel = currentLevelIdx + 1;
                bridge.saveCloudProgress('maxLevel', maxLevel);
            }

            const isCampaignEnd = currentLevelIdx === CAMPAIGN_LEVEL_COUNT - 1;
            document.getElementById('victoryTitle').textContent = isCampaignEnd
                ? 'Все 50 клумб пройдены!'
                : 'Клумба расцвела!';
            document.getElementById('nextLevelBtnText').textContent = isCampaignEnd
                ? 'В БЕСКОНЕЧНЫЙ САД'
                : 'СЛЕДУЮЩАЯ КЛУМБА';
            document.getElementById('victoryStars').innerHTML =
                buildStarSVG(starCount >= 1) +
                buildStarSVG(starCount >= 2) +
                buildStarSVG(starCount >= 3);
            document.getElementById('victoryRewardText').textContent = moveBonusCoins > 0
                ? `+${totalReward} (бонус +${moveBonusCoins})`
                : `+${totalReward}`;
            document.getElementById('victoryModal').classList.remove('hidden');
            updateUI();
            return;
        }

        if (movesLeft <= 0) {
            isGameOver = true;
            document.getElementById('gameOverModal').classList.remove('hidden');
        }
    }

    function updateUI() {
        const lvl = getLevelConfig(currentLevelIdx);
        document.getElementById('levelBadgeText').textContent = currentLevelIdx < CAMPAIGN_LEVEL_COUNT
            ? `Ур. ${lvl.level}/${CAMPAIGN_LEVEL_COUNT}: ${lvl.name}`
            : `Ур. ${lvl.level}: ${lvl.name}`;
        document.getElementById('scoreVal').textContent = score;
        document.getElementById('coinsVal').textContent = coins;
        document.getElementById('movesText').textContent = `${movesLeft} ходов`;
        document.getElementById('canCountVal').textContent = canBoosterCount;
        const trEl = document.getElementById('trowelCountVal');
        const shEl = document.getElementById('shuffleCountVal');
        const hcEl = document.getElementById('hubCoinsVal');
        if (trEl) trEl.textContent = trowelCount;
        if (shEl) shEl.textContent = shuffleCount;
        if (hcEl) hcEl.textContent = coins;

        let curVal = 0, maxVal = 1;
        if (lvl.goalType === 'flower') {
            curVal = Math.min(goalProgress.flowers, lvl.targetCount);
            maxVal = lvl.targetCount;
            document.getElementById('goalTitle').textContent = `Собери: ${FLOWER_TYPES[lvl.targetFlowerId].name} (${curVal}/${maxVal})`;
        } else if (lvl.goalType === 'unfreeze_and_flower') {
            const f1 = Math.min(goalProgress.frozenMelted, lvl.targetFrozen);
            const f2 = Math.min(goalProgress.flowers, lvl.targetCount);
            curVal = f1 + f2;
            maxVal = lvl.targetFrozen + lvl.targetCount;
            document.getElementById('goalTitle').textContent = `Жуки: ${f1}/${lvl.targetFrozen} | ${FLOWER_TYPES[lvl.targetFlowerId].name}: ${f2}/${lvl.targetCount}`;
        } else if (lvl.goalType === 'stones_and_flower') {
            const s1 = Math.min(goalProgress.stonesBroken, lvl.targetStones);
            const f2 = Math.min(goalProgress.flowers, lvl.targetCount);
            curVal = s1 + f2;
            maxVal = lvl.targetStones + lvl.targetCount;
            document.getElementById('goalTitle').textContent = `Сорняки: ${s1}/${lvl.targetStones} | ${FLOWER_TYPES[lvl.targetFlowerId].name}: ${f2}/${lvl.targetCount}`;
        } else if (lvl.goalType === 'unfreeze') {
            curVal = Math.min(goalProgress.frozenMelted, lvl.targetFrozen);
            maxVal = lvl.targetFrozen;
            document.getElementById('goalTitle').textContent = `Прогони жуков с сердца: ${curVal}/${maxVal}`;
        } else if (lvl.goalType === 'stones_frozen_flower') {
            const s1 = Math.min(goalProgress.stonesBroken, lvl.targetStones);
            const i2 = Math.min(goalProgress.frozenMelted, lvl.targetFrozen);
            const f3 = Math.min(goalProgress.flowers, lvl.targetCount);
            curVal = s1 + i2 + f3;
            maxVal = lvl.targetStones + lvl.targetFrozen + lvl.targetCount;
            document.getElementById('goalTitle').textContent = `Сорняки ${s1}/${lvl.targetStones}, Жуки ${i2}/${lvl.targetFrozen}, ${FLOWER_TYPES[lvl.targetFlowerId].name} ${f3}/${lvl.targetCount}`;
        }

        const pct = Math.min(100, Math.round((curVal / maxVal) * 100));
        document.getElementById('goalProgressBar').style.width = `${pct}%`;
        document.getElementById('goalProgressText').textContent = `${curVal} / ${maxVal}`;
    }

    function spawnBurst(x, y, color, count = 14) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1.5 + Math.random() * 4.5;
            particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1.2,
                color,
                radius: 2.5 + Math.random() * 3.5,
                alpha: 1.0,
                decay: 0.03 + Math.random() * 0.03
            });
        }
    }

    function spawnPopup(x, y, text, color = '#ff8f00') {
        popups.push({
            x, y,
            text,
            color,
            alpha: 1.0,
            scale: 0.5,
            vy: -1.6
        });
    }

    function update(dt) {
        if (trauma > 0) {
            trauma = Math.max(0, trauma - 1.6 * dt);
        }

        // Анимация плавного обмена (Swap & Reverse-Swap при неудачном ходе)
        if (swapAnim) {
            swapAnim.t += dt / swapAnim.duration;
            const p = Math.min(1, swapAnim.t);
            const ease = 1 - Math.pow(1 - p, 3);

            if (!swapAnim.reversing) {
                swapAnim.c1.animOffsetX = -swapAnim.dx * (1 - ease);
                swapAnim.c1.animOffsetY = -swapAnim.dy * (1 - ease);
                swapAnim.c2.animOffsetX = swapAnim.dx * (1 - ease);
                swapAnim.c2.animOffsetY = swapAnim.dy * (1 - ease);

                if (p >= 1) {
                    swapAnim.c1.animOffsetX = 0;
                    swapAnim.c1.animOffsetY = 0;
                    swapAnim.c2.animOffsetX = 0;
                    swapAnim.c2.animOffsetY = 0;

                    const s1 = swapAnim.c1;
                    const s2 = swapAnim.c2;
                    const p1 = swapAnim.p1;
                    const p2 = swapAnim.p2;

                    // Особые обмены: Шмель, Одуванчик или Солнечный Лотос взрываются при любом обмене!
                    if (s1.power || s2.power) {
                        movesLeft = Math.max(0, movesLeft - 1);
                        swapAnim = null;
                        updateUI();
                        if (s1.power === 'sun' || s2.power === 'sun') {
                            const sunPos = s1.power === 'sun' ? p2 : p1;
                            const partner = s1.power === 'sun' ? s2 : s1;
                            const sunTarget = (s1.power === 'sun' && s2.power === 'sun') ? 'ALL' : partner.id;
                            triggerManualBlast([{ r: sunPos.r, c: sunPos.c, reason: 'sun' }], sunTarget);
                        } else {
                            const seeds = [];
                            if (s1.power) seeds.push({ r: p2.r, c: p2.c, reason: 'power' });
                            if (s2.power) seeds.push({ r: p1.r, c: p1.c, reason: 'power' });
                            triggerManualBlast(seeds);
                        }
                        return;
                    }

                    const matches = findMatches();
                    if (matches.length > 0) {
                        movesLeft = Math.max(0, movesLeft - 1);
                        s1.scaleY = 0.86; s1.squashVel = 1.6;
                        s2.scaleY = 0.86; s2.squashVel = 1.6;
                        swapAnim = null;
                        updateUI();
                        processMatchesCascade(1, lastSwap);
                    } else {
                        grid[p1.r][p1.c] = s1;
                        grid[p2.r][p2.c] = s2;
                        swapAnim.reversing = true;
                        swapAnim.t = 0;
                        swapAnim.duration = 0.16;
                        window.flowerAudio.playDrop();
                        trauma = Math.min(1.0, trauma + 0.1);
                    }
                }
            } else {
                swapAnim.c1.animOffsetX = swapAnim.dx * (1 - ease);
                swapAnim.c1.animOffsetY = swapAnim.dy * (1 - ease);
                swapAnim.c2.animOffsetX = -swapAnim.dx * (1 - ease);
                swapAnim.c2.animOffsetY = -swapAnim.dy * (1 - ease);

                if (p >= 1) {
                    swapAnim.c1.animOffsetX = 0;
                    swapAnim.c1.animOffsetY = 0;
                    swapAnim.c2.animOffsetX = 0;
                    swapAnim.c2.animOffsetY = 0;
                    swapAnim = null;
                    isProcessingMatches = false;
                }
            }
        }

        const k = 180, d = 14;
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                const cell = grid[r][c];
                if (!cell) continue;

                const inSwap = swapAnim && (cell === swapAnim.c1 || cell === swapAnim.c2);

                if (!inSwap) {
                    if (cell.animOffsetY < 0) {
                        cell.animOffsetY = Math.min(0, cell.animOffsetY + dt * 920);
                        if (cell.animOffsetY === 0) {
                            cell.scaleY = 0.85;
                            cell.squashVel = 1.8;
                        }
                    } else if (cell.animOffsetY > 0) {
                        cell.animOffsetY = Math.max(0, cell.animOffsetY - dt * 920);
                    }
                    if (cell.animOffsetX !== 0) {
                        const sign = Math.sign(cell.animOffsetX);
                        cell.animOffsetX = Math.abs(cell.animOffsetX) <= dt * 920 ? 0 : cell.animOffsetX - sign * dt * 920;
                    }
                }

                // Анимация плавного вспучивания и схлопывания совпавших цветов
                if (cell.popping) {
                    cell.popT = Math.min(1, (cell.popT || 0) + dt / 0.19);
                    if (cell.popT < 0.35) {
                        const kp = cell.popT / 0.35;
                        cell.popScale = 1 + 0.28 * Math.sin(kp * Math.PI * 0.5);
                    } else {
                        const ks = (cell.popT - 0.35) / 0.65;
                        cell.popScale = Math.max(0, 1.28 * (1 - ks * ks));
                    }
                }

                const forceY = -k * (cell.scaleY - 1.0) - d * (cell.squashVel || 0);
                cell.squashVel = (cell.squashVel || 0) + forceY * dt;
                cell.scaleY += cell.squashVel * dt;
                cell.scaleX = 1.0 / Math.max(0.3, cell.scaleY);
                if (Math.abs(cell.scaleY - 1.0) < 0.01 && Math.abs(cell.squashVel) < 0.02) {
                    cell.scaleX = 1.0;
                    cell.scaleY = 1.0;
                    cell.squashVel = 0;
                }
            }
        }

        // Обновляем бабочек в саду
        butterflies.forEach(b => {
            b.turnTimer -= dt;
            if (b.turnTimer <= 0) {
                b.turnTimer = 1.2 + Math.random() * 2.0;
                b.turnDir = Math.random() > 0.5 ? 1 : -1;
            }
            b.angle += b.turnDir * dt * 0.8;
            b.x += Math.cos(b.angle) * b.speed * dt;
            b.y += Math.sin(b.angle) * b.speed * dt;
            b.flapPhase += dt * 14;

            if (b.x < 16 || b.x > CANVAS_SIZE - 16) b.angle = Math.PI - b.angle;
            if (b.y < 16 || b.y > CANVAS_SIZE - 16) b.angle = -b.angle;
            b.x = Math.max(14, Math.min(CANVAS_SIZE - 14, b.x));
            b.y = Math.max(14, Math.min(CANVAS_SIZE - 14, b.y));
        });

        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.14;
            p.vx *= 0.96;
            p.alpha -= p.decay;
            if (p.alpha <= 0) particles.splice(i, 1);
        }

        for (let i = popups.length - 1; i >= 0; i--) {
            const pop = popups[i];
            pop.y += pop.vy;
            pop.scale = Math.min(1.15, pop.scale + dt * 4);
            pop.alpha -= dt * 0.9;
            if (pop.alpha <= 0) popups.splice(i, 1);
        }

        for (let i = beams.length - 1; i >= 0; i--) {
            beams[i].life -= dt * 3.1;
            if (beams[i].life <= 0) beams.splice(i, 1);
        }

        for (let i = shockwaves.length - 1; i >= 0; i--) {
            shockwaves[i].life -= dt * 2.8;
            if (shockwaves[i].life <= 0) shockwaves.splice(i, 1);
        }

        if (!isProcessingMatches && !swapAnim && !isGameOver && !isWon && !isCanMode) {
            idleTime += dt;
            if (idleTime >= 4.8 && !hintPair) {
                hintPair = findFirstPossibleMove();
            }
        } else {
            idleTime = 0;
        }
    }

    function render() {
        ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        ctx.save();
        if (trauma > 0) {
            const shake = trauma * trauma;
            const ox = (Math.random() * 2 - 1) * 8 * shake;
            const oy = (Math.random() * 2 - 1) * 8 * shake;
            ctx.translate(ox, oy);
        }

        drawBoardBackground();
        drawFlowers();

        beams.forEach(b => {
            ctx.save();
            ctx.globalAlpha = Math.max(0, b.life);
            if (b.kind === 'row') {
                const cy = (b.r + 0.5) * CELL_SIZE;
                const grad = ctx.createLinearGradient(0, cy - 22, 0, cy + 22);
                grad.addColorStop(0, 'rgba(255, 235, 59, 0)');
                grad.addColorStop(0.5, 'rgba(255, 241, 118, 0.85)');
                grad.addColorStop(1, 'rgba(255, 235, 59, 0)');
                ctx.fillStyle = grad;
                ctx.fillRect(0, cy - 22, CANVAS_SIZE, 44);
            } else if (b.kind === 'col') {
                const cx = (b.c + 0.5) * CELL_SIZE;
                const grad = ctx.createLinearGradient(cx - 22, 0, cx + 22, 0);
                grad.addColorStop(0, 'rgba(255, 235, 59, 0)');
                grad.addColorStop(0.5, 'rgba(255, 241, 118, 0.85)');
                grad.addColorStop(1, 'rgba(255, 235, 59, 0)');
                ctx.fillStyle = grad;
                ctx.fillRect(cx - 22, 0, 44, CANVAS_SIZE);
            } else if (b.kind === 'ray') {
                ctx.strokeStyle = '#ffee58';
                ctx.lineWidth = 4 * b.life;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(b.x1, b.y1);
                ctx.lineTo(b.x2, b.y2);
                ctx.stroke();
            }
            ctx.restore();
        });

        shockwaves.forEach(s => {
            ctx.save();
            const progress = 1 - Math.max(0, s.life);
            const r = Math.max(6, s.maxR * progress);
            ctx.globalAlpha = Math.max(0, s.life * 0.85);
            ctx.strokeStyle = s.color;
            ctx.lineWidth = 6 * s.life;
            ctx.beginPath();
            ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        });

        // Порхающие садовые бабочки поверх цветочных краёв
        butterflies.forEach(b => {
            window.flowerSprites.drawButterfly(
                ctx,
                b.x,
                b.y,
                b.angle + Math.PI / 2,
                b.flapPhase,
                b.colors[0],
                b.colors[1]
            );
        });

        particles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.alpha);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        popups.forEach(pop => {
            ctx.save();
            ctx.globalAlpha = Math.max(0, pop.alpha);
            ctx.font = `900 ${Math.round(18 * pop.scale)}px Rubik, Nunito, sans-serif`;
            ctx.textAlign = 'center';
            ctx.lineWidth = 4;
            ctx.strokeStyle = '#ffffff';
            ctx.strokeText(pop.text, pop.x, pop.y);
            ctx.fillStyle = pop.color;
            ctx.fillText(pop.text, pop.x, pop.y);
            ctx.restore();
        });

        ctx.restore();
    }

    function drawBoardBackground() {
        const lvl = getLevelConfig(currentLevelIdx);

        // Светлый солнечный газон за пределами фигурной клумбы
        const lawnGrad = ctx.createLinearGradient(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        lawnGrad.addColorStop(0, '#dcf3c2');
        lawnGrad.addColorStop(1, '#aed581');
        ctx.fillStyle = lawnGrad;
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        // Резной деревянный контур-окантовка вокруг фигурной клумбы
        ctx.fillStyle = '#8d6e63';
        ctx.strokeStyle = '#5d4037';
        ctx.lineWidth = 2;
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (lvl.mask[r][c] === 1) {
                    const x = c * CELL_SIZE;
                    const y = r * CELL_SIZE;
                    ctx.beginPath();
                    ctx.roundRect(x - 3, y - 3, CELL_SIZE + 6, CELL_SIZE + 6, 10);
                    ctx.fill();
                }
            }
        }

        // Светлые ячейки клумбы
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                const x = c * CELL_SIZE;
                const y = r * CELL_SIZE;

                if (lvl.mask[r][c] === 1) {
                    const isEven = (r + c) % 2 === 0;
                    ctx.fillStyle = isEven ? '#f6fbe7' : '#e6f3c8';
                    ctx.beginPath();
                    ctx.roundRect(x + 1.5, y + 1.5, CELL_SIZE - 3, CELL_SIZE - 3, 8);
                    ctx.fill();

                    ctx.strokeStyle = '#aed581';
                    ctx.lineWidth = 1.2;
                    ctx.stroke();
                }
            }
        }

        // Солнечные блики на траве
        ctx.save();
        const sunRay = ctx.createRadialGradient(50, 40, 10, 100, 100, 260);
        sunRay.addColorStop(0, 'rgba(255, 253, 210, 0.35)');
        sunRay.addColorStop(1, 'rgba(255, 253, 210, 0)');
        ctx.fillStyle = sunRay;
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        ctx.restore();
    }

    function drawFlowers() {
        const nowSec = performance.now() * 0.001;
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                const cell = grid[r][c];
                if (!cell) continue;

                const cx = c * CELL_SIZE + CELL_SIZE / 2 + (cell.animOffsetX || 0);
                const cy = r * CELL_SIZE + CELL_SIZE / 2 + (cell.animOffsetY || 0);
                const pop = cell.popScale ?? 1;

                ctx.save();
                ctx.translate(cx, cy);
                if (cell.popping) {
                    ctx.globalAlpha = Math.max(0, Math.min(1, pop * 1.05));
                }

                const isHinted = hintPair && !isProcessingMatches &&
                    ((hintPair[0].r === r && hintPair[0].c === c) || (hintPair[1].r === r && hintPair[1].c === c));
                if (isHinted) {
                    const pulse = 0.5 + 0.5 * Math.sin(nowSec * 7);
                    ctx.beginPath();
                    ctx.arc(0, 0, CELL_SIZE * (0.43 + pulse * 0.04), 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(255, 235, 59, ${0.45 + pulse * 0.5})`;
                    ctx.lineWidth = 3;
                    ctx.stroke();
                }

                if (selectedCell && selectedCell.r === r && selectedCell.c === c) {
                    ctx.beginPath();
                    ctx.arc(0, 0, CELL_SIZE * 0.45, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(255, 213, 79, 0.52)';
                    ctx.fill();
                    ctx.lineWidth = 2.8;
                    ctx.strokeStyle = '#ff8f00';
                    ctx.stroke();

                    const bob = Math.sin(performance.now() * 0.008) * 2.5;
                    ctx.translate(0, bob);
                }

                ctx.scale((cell.scaleX || 1) * pop, (cell.scaleY || 1) * pop);

                if (cell.isStone) {
                    const stoneSprite = window.flowerSprites.get(98);
                    if (stoneSprite) {
                        ctx.drawImage(stoneSprite, -CELL_SIZE * 0.45, -CELL_SIZE * 0.45, CELL_SIZE * 0.9, CELL_SIZE * 0.9);
                    }
                } else {
                    const spriteId = cell.power === 'row' ? 95
                        : cell.power === 'col' ? 96
                        : cell.power === 'bomb' ? 97
                        : cell.power === 'sun' ? 99
                        : cell.id;
                    const sprite = window.flowerSprites.get(spriteId);
                    if (sprite) {
                        ctx.drawImage(sprite, -CELL_SIZE * 0.45, -CELL_SIZE * 0.45, CELL_SIZE * 0.9, CELL_SIZE * 0.9);
                    }
                    if (cell.power && cell.frostLevel === 0) {
                        window.flowerSprites.drawPowerAura(ctx, cell.power, CELL_SIZE, nowSec);
                    }
                    if (cell.frostLevel > 0) {
                        window.flowerSprites.drawIce(ctx, 0, 0, CELL_SIZE, cell.frostLevel);
                    }
                }

                ctx.restore();
            }
        }
    }

    window.addEventListener('DOMContentLoaded', init);
})();
