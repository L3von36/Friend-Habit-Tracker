/**
 * Premium Synthetic Audio Utility 
 * Generates beautiful UI sound effects using Web Audio API
 * No external assets required.
 */

class AudioService {
    private context: AudioContext | null = null;
    private isMuted = false;

    private getContext() {
        if (!this.context) {
            this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        return this.context;
    }

    private createOscillator(freq: number, type: OscillatorType = 'sine', startTime: number): { osc: OscillatorNode; gain: GainNode } {
        const ctx = this.getContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, startTime);

        osc.connect(gain);
        gain.connect(ctx.destination);

        return { osc, gain };
    }

    /**
     * Play a subtle "pop" click sound
     */
    public playClick() {
        if (this.isMuted) return;
        const ctx = this.getContext();
        if (ctx.state === 'suspended') ctx.resume();

        const start = ctx.currentTime;
        const { osc, gain } = this.createOscillator(600, 'sine', start);

        // Subtle pitch drop
        osc.frequency.exponentialRampToValueAtTime(300, start + 0.1);

        // Soft envelope
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.2, start + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, start + 0.15);

        osc.start(start);
        osc.stop(start + 0.15);
    }

    /**
     * Play a light "tap" or success sound
     */
    public playSuccess() {
        if (this.isMuted) return;
        const ctx = this.getContext();
        if (ctx.state === 'suspended') ctx.resume();

        const start = ctx.currentTime;

        // First note
        const n1 = this.createOscillator(880, 'sine', start);
        n1.gain.gain.setValueAtTime(0, start);
        n1.gain.gain.linearRampToValueAtTime(0.15, start + 0.05);
        n1.gain.gain.exponentialRampToValueAtTime(0.01, start + 0.2);
        n1.osc.start(start);
        n1.osc.stop(start + 0.2);

        // Second note (major third)
        const n2 = this.createOscillator(1108.73, 'sine', start + 0.05);
        n2.gain.gain.setValueAtTime(0, start + 0.05);
        n2.gain.gain.linearRampToValueAtTime(0.1, start + 0.1);
        n2.gain.gain.exponentialRampToValueAtTime(0.01, start + 0.3);
        n2.osc.start(start + 0.05);
        n2.osc.stop(start + 0.3);
    }

    /**
     * Play a subtle "thud" for deletions or negative actions
     */
    public playDelete() {
        if (this.isMuted) return;
        const ctx = this.getContext();
        if (ctx.state === 'suspended') ctx.resume();

        const start = ctx.currentTime;
        const { osc, gain } = this.createOscillator(200, 'sine', start);

        osc.frequency.exponentialRampToValueAtTime(50, start + 0.1);

        gain.gain.setValueAtTime(0.3, start);
        gain.gain.exponentialRampToValueAtTime(0.01, start + 0.1);

        osc.start(start);
        osc.stop(start + 0.1);
    }

    /**
     * Play a short, high-pitched data "blip"
     */
    public playDataStream() {
        if (this.isMuted) return;
        const ctx = this.getContext();
        if (ctx.state === 'suspended') ctx.resume();

        const start = ctx.currentTime;
        const { osc, gain } = this.createOscillator(1200 + Math.random() * 400, 'square', start);

        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.05, start + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.05);

        osc.start(start);
        osc.stop(start + 0.05);
    }

    /**
     * Play a cinematic "system chirp" for confirmations
     */
    public playSystemChirp() {
        if (this.isMuted) return;
        const ctx = this.getContext();
        if (ctx.state === 'suspended') ctx.resume();

        const start = ctx.currentTime;
        [1500, 1800, 2100].forEach((freq, i) => {
            const { osc, gain } = this.createOscillator(freq, 'sine', start + (i * 0.03));
            gain.gain.setValueAtTime(0, start + (i * 0.03));
            gain.gain.linearRampToValueAtTime(0.1, start + (i * 0.03) + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.01, start + (i * 0.03) + 0.08);
            osc.start(start + (i * 0.03));
            osc.stop(start + (i * 0.03) + 0.08);
        });
    }

    public toggleMute() {
        this.isMuted = !this.isMuted;
        return this.isMuted;
    }
}

export const audioService = new AudioService();
