'use client';

// Web Audio API celebration sound — no external files needed
export const playCelebrationSound = () => {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();

        const now = ctx.currentTime;

        // --- Pop burst (noise) ---
        const popDuration = 0.15;
        const bufferSize = ctx.sampleRate * popDuration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
        }
        const popSrc = ctx.createBufferSource();
        popSrc.buffer = buffer;
        const popGain = ctx.createGain();
        popGain.gain.setValueAtTime(0.3, now);
        popGain.gain.exponentialRampToValueAtTime(0.01, now + popDuration);
        popSrc.connect(popGain);
        popGain.connect(ctx.destination);
        popSrc.start(now);

        // --- Bell chime 1 ---
        const playBell = (freq, delay, vol = 0.15) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + delay);
            gain.gain.setValueAtTime(vol, now + delay);
            gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 1.2);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + delay);
            osc.stop(now + delay + 1.2);
        };

        // --- Sparkle chime 2 (higher, slightly later) ---
        const playSparkle = (freq, delay, vol = 0.1) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + delay);
            gain.gain.setValueAtTime(vol, now + delay);
            gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.8);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + delay);
            osc.stop(now + delay + 0.8);
        };

        playBell(523.25, 0.05, 0.18);    // C5
        playBell(659.25, 0.15, 0.15);   // E5
        playBell(783.99, 0.25, 0.12);    // G5
        playSparkle(1046.50, 0.35, 0.1); // C6 sparkle
        playSparkle(1318.51, 0.45, 0.08); // E6 sparkle

        // Auto-close context after sound finishes
        setTimeout(() => {
            if (ctx.state !== 'closed') ctx.close();
        }, 2000);

    } catch (e) {
        // Silently fail if audio is blocked
    }
};
