/**
 * Web Audio API synthesized alerts for focus timers and study reminders.
 * Runs completely locally without external audio assets.
 */

class AcademicAudioAlerts {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Chime when starting a focus session (motivating upward chime)
  playStartChime() {
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;

      const freqs = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);

        gain.gain.setValueAtTime(0, now + idx * 0.1);
        gain.gain.linearRampToValueAtTime(0.15, now + idx * 0.1 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.1 + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.45);
      });
    } catch (e) {
      console.warn('AudioContext alert not supported or user has not interacted yet', e);
    }
  }

  // Bell alert when timer completes (clear, elegant school/academic bell)
  playAlarmBell() {
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;

      // 3 resonant bell rings
      for (let ring = 0; ring < 3; ring++) {
        const startTime = now + ring * 0.7;

        // Fundamental tone + harmonics
        const harmonics = [587.33, 880, 1174.66]; // D5, A5, D6
        harmonics.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = i === 0 ? 'triangle' : 'sine';
          osc.frequency.setValueAtTime(freq, startTime);

          const volume = 0.18 / (i + 1);
          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(volume, startTime + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.65);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(startTime);
          osc.stop(startTime + 0.7);
        });
      }
    } catch (e) {
      console.warn('AudioContext alert error:', e);
    }
  }

  // Gentle reminder tone for breaks
  playBreakTone() {
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;

      const freqs = [659.25, 523.25]; // E5, C5
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.18);

        gain.gain.setValueAtTime(0, now + idx * 0.18);
        gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.18 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.18 + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.18);
        osc.stop(now + idx * 0.18 + 0.55);
      });
    } catch (e) {
      console.warn('AudioContext alert error:', e);
    }
  }
}

export const academicAudio = new AcademicAudioAlerts();
