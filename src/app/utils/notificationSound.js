'use client';

// Web Audio API notification pop — no external files needed
let isAudioUnlocked = false;

export const unlockNotificationAudio = () => {
    if (isAudioUnlocked) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.value = 0.001;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.01);
    ctx.close().catch(() => {});
    isAudioUnlocked = true;
};

export const playNotificationSound = () => {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const now = ctx.currentTime;

        // Short pleasant pop (two quick notes)
        const playNote = (freq, delay, vol, duration) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + delay);
            gain.gain.setValueAtTime(vol, now + delay);
            gain.gain.exponentialRampToValueAtTime(0.001, now + delay + duration);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + delay);
            osc.stop(now + delay + duration);
        };

        playNote(880, 0, 0.12, 0.12);   // A5
        playNote(1108.73, 0.08, 0.08, 0.1); // C#6

        setTimeout(() => {
            if (ctx.state !== 'closed') ctx.close();
        }, 500);
    } catch (e) {
        // Silently fail
    }
};
