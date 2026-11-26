/**
 * Цветочная Клумба: Аудио-модуль
 * Стандарт casual-game-audio:
 * - Уютная фоновая музыка (Cozy Background Music Generator: Cmaj7 - Am7 - Fmaj7 - G6 через lowpass 750 Гц)
 * - Хрустальные капли воды (Crystal Water Drops)
 * - Шелест цветочных лепестков (Petal Rustle)
 * - Пентатонический перезвон комбо (Pentatonic Bloom Chimes)
 * - Всплеск волшебной лейки и победная фанфара
 */

class FlowerAudio {
    constructor() {
        this.ctx = null;
        this.muted = localStorage.getItem('klumba_muted') === 'true';
        this.musicMuted = localStorage.getItem('klumba_music_muted') === 'true';
        this.masterVolume = 0.8;
        this.musicPlaying = false;
        this.musicInterval = null;
        this._adPaused = false;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) this.ctx = new AudioContext();
        }
        if (this.ctx && this.ctx.state === 'suspended' && !this._adPaused) {
            this.ctx.resume().catch(() => {});
        }
    }

    pauseForAd() {
        this._adPaused = true;
        if (this.ctx && this.ctx.state === 'running' && typeof this.ctx.suspend === 'function') {
            this.ctx.suspend().catch(() => {});
        }
    }

    resumeAfterAd() {
        this._adPaused = false;
        if (this.ctx && this.ctx.state === 'suspended' && typeof this.ctx.resume === 'function') {
            this.ctx.resume().catch(() => {});
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        localStorage.setItem('klumba_muted', this.muted);
        if (!this.muted) this.playWaterDrop();
        return this.muted;
    }

    toggleMusic() {
        this.musicMuted = !this.musicMuted;
        localStorage.setItem('klumba_music_muted', this.musicMuted);
        if (this.musicMuted) {
            this.stopAmbientMusic();
        } else {
            this.startAmbientMusic();
        }
        return this.musicMuted;
    }

    isMuted() {
        return this.muted;
    }

    isMusicMuted() {
        return this.musicMuted;
    }

    stopAmbientMusic() {
        this.musicPlaying = false;
        if (this.musicInterval) {
            clearInterval(this.musicInterval);
            this.musicInterval = null;
        }
        if (this.musicMasterGain && this.ctx) {
            const cleanup = this.musicCleanup;
            try {
                const now = this.ctx.currentTime;
                this.musicMasterGain.gain.cancelScheduledValues(now);
                this.musicMasterGain.gain.setValueAtTime(Math.max(0.0001, this.musicMasterGain.gain.value || 0.001), now);
                this.musicMasterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
            } catch (_) {}
            if (cleanup) setTimeout(cleanup, 220);
            this.musicCleanup = null;
            this.musicMasterGain = null;
            this.musicBus = null;
        }
    }

    /**
     * ОРКЕСТР САДА: «Весенний Вальс Сада» (G major, 3/4, 16-тактовая эволюция A -> A' -> Припев -> Мостик)
     * Голоса: тёплые струнные (detuned strings pad), небесная челеста, солирующая флейта с вибрато, глубокий бас.
     */
    startAmbientMusic() {
        if (this.musicPlaying || this.musicMuted || this._adPaused) return;
        this.init();
        if (!this.ctx) return;
        this.musicPlaying = true;

        const m2f = (m) => 440 * Math.pow(2, (m - 69) / 12);

        const master = this.ctx.createGain();
        master.gain.setValueAtTime(0.58 * this.masterVolume, this.ctx.currentTime);
        const comp = this.ctx.createDynamicsCompressor();
        comp.threshold.value = -16;
        comp.ratio.value = 3;

        const dry = this.ctx.createGain();
        dry.gain.value = 0.85;

        const delay = this.ctx.createDelay(1.0);
        delay.delayTime.value = 0.28;
        const feedback = this.ctx.createGain();
        feedback.gain.value = 0.26;
        const wetFilter = this.ctx.createBiquadFilter();
        wetFilter.type = 'lowpass';
        wetFilter.frequency.value = 1550;
        const wetGain = this.ctx.createGain();
        wetGain.gain.value = 0.28;

        const bus = this.ctx.createBiquadFilter();
        bus.type = 'lowpass';
        bus.frequency.value = 2600;

        bus.connect(dry);
        dry.connect(comp);
        bus.connect(delay);
        delay.connect(wetFilter);
        wetFilter.connect(feedback);
        feedback.connect(delay);
        wetFilter.connect(wetGain);
        wetGain.connect(comp);
        comp.connect(master);
        master.connect(this.ctx.destination);

        this.musicMasterGain = master;
        this.musicBus = bus;
        this.musicCleanup = () => {
            try {
                bus.disconnect();
                delay.disconnect();
                feedback.disconnect();
                comp.disconnect();
                master.disconnect();
            } catch (_) {}
        };

        const bars = [
            // Bars 0-3: Куплет A (нежное вступление челесты и флейты)
            { bass: 43, chord: [59, 62, 66, 67], mel: [79, 0, 78, 74, 0, 71], section: 'A' },
            { bass: 42, chord: [57, 62, 66, 69], mel: [74, 0, 76, 74, 71, 69], section: 'A' },
            { bass: 40, chord: [59, 62, 64, 67], mel: [71, 0, 72, 74, 0, 76], section: 'A' },
            { bass: 47, chord: [59, 62, 66, 69], mel: [74, 0, 71, 69, 0, 0], section: 'A' },
            // Bars 4-7: Куплет A' (вступают струнные)
            { bass: 48, chord: [60, 64, 67, 71], mel: [76, 0, 79, 81, 0, 79], section: 'Ap' },
            { bass: 47, chord: [59, 62, 67, 71], mel: [78, 0, 74, 71, 0, 74], section: 'Ap' },
            { bass: 45, chord: [60, 64, 67, 72], mel: [72, 74, 76, 79, 0, 76], section: 'Ap' },
            { bass: 50, chord: [60, 62, 66, 69], mel: [78, 0, 0, 74, 76, 78], section: 'Ap' },
            // Bars 8-11: ПРИПЕВ B (аниме-подъём! богатые струнные + звонкая октавная флейта)
            { bass: 48, chord: [64, 67, 71, 72], mel: [84, 0, 83, 79, 0, 76], section: 'B' },
            { bass: 50, chord: [62, 66, 69, 72], mel: [81, 0, 83, 81, 0, 78], section: 'B' },
            { bass: 47, chord: [62, 66, 69, 71], mel: [79, 0, 81, 83, 0, 86], section: 'B' },
            { bass: 40, chord: [59, 64, 67, 74], mel: [83, 0, 79, 76, 0, 74], section: 'B' },
            // Bars 12-15: Финал припева и мягкий возврат
            { bass: 45, chord: [60, 64, 67, 72], mel: [76, 79, 81, 84, 0, 83], section: 'C' },
            { bass: 50, chord: [60, 62, 66, 69], mel: [81, 0, 78, 74, 0, 78], section: 'C' },
            { bass: 43, chord: [59, 62, 66, 71], mel: [79, 0, 0, 74, 0, 71], section: 'C' },
            { bass: 50, chord: [60, 62, 67, 69], mel: [69, 0, 74, 0, 76, 0], section: 'C' }
        ];

        const playStrings = (notes, now, dur, peakVol) => {
            notes.forEach((m, idx) => {
                [-5, 5].forEach(detune => {
                    const osc = this.ctx.createOscillator();
                    const g = this.ctx.createGain();
                    const f = this.ctx.createBiquadFilter();
                    osc.type = idx % 2 === 0 ? 'sawtooth' : 'triangle';
                    osc.frequency.setValueAtTime(m2f(m), now);
                    osc.detune.setValueAtTime(detune, now);
                    f.type = 'lowpass';
                    f.frequency.setValueAtTime(420, now);
                    f.frequency.linearRampToValueAtTime(980, now + dur * 0.45);
                    f.frequency.linearRampToValueAtTime(520, now + dur);

                    g.gain.setValueAtTime(0.0005, now);
                    g.gain.linearRampToValueAtTime(peakVol, now + 0.35);
                    g.gain.exponentialRampToValueAtTime(0.0005, now + dur);

                    osc.connect(f);
                    f.connect(g);
                    g.connect(bus);
                    osc.start(now);
                    osc.stop(now + dur + 0.05);
                });
            });
        };

        const playCelesta = (midi, now, vol, dur = 0.75) => {
            const osc = this.ctx.createOscillator();
            const over = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            const f = m2f(midi);
            osc.type = 'sine';
            over.type = 'triangle';
            osc.frequency.setValueAtTime(f, now);
            over.frequency.setValueAtTime(f * 2, now);

            const overG = this.ctx.createGain();
            overG.gain.setValueAtTime(0.22, now);
            overG.gain.exponentialRampToValueAtTime(0.001, now + dur * 0.45);

            g.gain.setValueAtTime(0.0005, now);
            g.gain.linearRampToValueAtTime(vol, now + 0.012);
            g.gain.exponentialRampToValueAtTime(0.0005, now + dur);

            osc.connect(g);
            over.connect(overG);
            overG.connect(g);
            g.connect(bus);
            osc.start(now);
            over.start(now);
            osc.stop(now + dur + 0.05);
            over.stop(now + dur + 0.05);
        };

        const playFlute = (midi, now, dur, vol) => {
            const osc = this.ctx.createOscillator();
            const vib = this.ctx.createOscillator();
            const vibG = this.ctx.createGain();
            const g = this.ctx.createGain();
            const filt = this.ctx.createBiquadFilter();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(m2f(midi), now);
            vib.type = 'sine';
            vib.frequency.setValueAtTime(5.2, now);
            vibG.gain.setValueAtTime(0, now);
            vibG.gain.linearRampToValueAtTime(7, now + 0.14);

            filt.type = 'lowpass';
            filt.frequency.setValueAtTime(1650, now);

            g.gain.setValueAtTime(0.0005, now);
            g.gain.linearRampToValueAtTime(vol, now + 0.065);
            g.gain.setValueAtTime(vol * 0.85, now + dur * 0.65);
            g.gain.exponentialRampToValueAtTime(0.0005, now + dur);

            vib.connect(vibG);
            vibG.connect(osc.detune);
            osc.connect(filt);
            filt.connect(g);
            g.connect(bus);

            osc.start(now);
            vib.start(now);
            osc.stop(now + dur + 0.05);
            vib.stop(now + dur + 0.05);
        };

        const playBass = (midi, now, dur, vol) => {
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            const f = this.ctx.createBiquadFilter();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(m2f(midi), now);
            f.type = 'lowpass';
            f.frequency.setValueAtTime(340, now);

            g.gain.setValueAtTime(0.0005, now);
            g.gain.linearRampToValueAtTime(vol, now + 0.03);
            g.gain.exponentialRampToValueAtTime(0.0005, now + dur);

            osc.connect(f);
            f.connect(g);
            g.connect(bus);
            osc.start(now);
            osc.stop(now + dur + 0.05);
        };

        let step = 0;
        const stepSec = 0.265;
        const arpOrder = [0, 1, 2, 3, 2, 1];

        this.musicInterval = setInterval(() => {
            if (this.musicMuted || !this.musicPlaying || document.hidden || this._adPaused) return;
            if (!this.ctx || this.ctx.state === 'suspended' || !this.musicBus) return;

            const now = this.ctx.currentTime;
            const barIdx = Math.floor(step / 6) % bars.length;
            const beatStep = step % 6;
            const bar = bars[barIdx];

            // 1. Вальсовый бас на сильную долю и мягкий ответ
            if (beatStep === 0) {
                playBass(bar.bass, now, 1.1, bar.section === 'B' ? 0.14 : 0.10);
            } else if (beatStep === 2 || beatStep === 4) {
                playCelesta(bar.chord[0] - 12, now, 0.038, 0.45);
            }

            // 2. Челеста-арпеджио (во втором куплете и припеве выше на октаву при кульминации)
            const arpNote = bar.chord[arpOrder[beatStep]] + (bar.section === 'B' && beatStep >= 3 ? 12 : 0);
            playCelesta(arpNote, now, bar.section === 'B' ? 0.065 : 0.052, 0.72);

            // 3. Оркестровые струнные (вступают с 5-го такта и цветут на Припеве)
            if (beatStep === 0 && bar.section !== 'A') {
                const strVol = bar.section === 'B' ? 0.022 : 0.014;
                playStrings(bar.chord.slice(0, 3), now, 1.7, strVol);
            }

            // 4. Солирующая мелодия (Флейта + в Припеве добавляется искристая скрипка/колокольчик)
            const melMidi = bar.mel[beatStep];
            if (melMidi > 0) {
                const isNextRest = (bar.mel[(beatStep + 1) % 6] === 0);
                const melDur = isNextRest ? stepSec * 1.9 : stepSec * 0.95;
                playFlute(melMidi, now, melDur, bar.section === 'B' ? 0.088 : 0.068);
                if (bar.section === 'B') {
                    playCelesta(melMidi + 12, now, 0.042, 0.55);
                }
            }

            step++;
        }, 265);
    }

    /**
     * 1. ХРУСТАЛЬНАЯ КАПЛЯ ВОДЫ (Crystal Water Drop)
     */
    playWaterDrop(pitchMod = 1.0) {
        if (this.muted || this._adPaused) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const freq = 1200 * pitchMod;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * 0.7, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.8, now + 0.05);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.4 * this.masterVolume, now + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.13);
    }

    /**
     * 2. ШЕЛЕСТ ЛЕПЕСТКОВ ПРИ СВАПЕ (Petal Rustle)
     */
    playRustle() {
        if (this.muted || this._adPaused) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.06);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(2400, now);
        filter.frequency.exponentialRampToValueAtTime(800, now + 0.05);
        filter.Q.value = 3.0;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.35 * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start(now);
    }

    /**
     * 3. ЦВЕТОЧНОЕ СЛИЯНИЕ MATCH-3 (Pentatonic Bloom Chime)
     */
    playMatchChime(combo = 1) {
        if (this.muted || this._adPaused) return;
        this.init();
        if (!this.ctx) return;

        this.playWaterDrop(1.0 + combo * 0.12);
        this.playRustle();

        const notes = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1318.51];
        const freq = notes[(combo - 1) % notes.length];
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + 0.02);

        gain.gain.setValueAtTime(0.001, now + 0.02);
        gain.gain.linearRampToValueAtTime(0.35 * this.masterVolume, now + 0.026);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + 0.02);
        osc.stop(now + 0.38);
    }

    /**
     * 4. СУПЕР-ЛЕЙКА (Watering Can Splash)
     */
    playWateringCan() {
        if (this.muted || this._adPaused) return;
        this.init();
        if (!this.ctx) return;

        for (let i = 0; i < 4; i++) {
            setTimeout(() => {
                this.playWaterDrop(0.8 + i * 0.25);
            }, i * 70);
        }
    }

    playSelect() {
        this.playWaterDrop(1.1);
    }

    playDrop() {
        this.playRustle();
    }

    playMatch(count = 3) {
        const combo = Math.max(1, count - 2);
        this.playMatchChime(combo);
    }

    playSplash() {
        this.playWateringCan();
    }

    playFanfare() {
        if (this.muted || this._adPaused) return;
        this.init();
        if (!this.ctx) return;

        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
        notes.forEach((f, idx) => {
            setTimeout(() => {
                if (this.muted || this._adPaused || !this.ctx) return;
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(f, now);
                gain.gain.setValueAtTime(0.001, now);
                gain.gain.linearRampToValueAtTime(0.32 * this.masterVolume, now + 0.01);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.48);
            }, idx * 80);
        });
    }
}

window.flowerAudio = new FlowerAudio();
