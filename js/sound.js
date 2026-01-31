// Neon Defense - Sound Manager

class SoundManager {
  constructor() {
    this.audioContext = null;
    this.bgmGain = null;
    this.sfxGain = null;
    this.bgmPlaying = false;
    this.bgmEnabled = true;
    this.sfxEnabled = true;
    this.bgmVolume = 0.3;
    this.sfxVolume = 0.5;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return true;
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      this.bgmGain = this.audioContext.createGain();
      this.bgmGain.gain.value = this.bgmVolume;
      this.bgmGain.connect(this.audioContext.destination);
      
      this.sfxGain = this.audioContext.createGain();
      this.sfxGain.gain.value = this.sfxVolume;
      this.sfxGain.connect(this.audioContext.destination);
      
      this.initialized = true;
      return true;
    } catch (e) {
      console.warn('Audio not supported:', e);
      return false;
    }
  }

  playBGM() {
    if (!this.bgmEnabled || this.bgmPlaying) return;
    if (!this.init()) return;
    this.bgmPlaying = true;

    const ctx = this.audioContext;
    
    const bassNotes = [65.41, 82.41, 73.42, 87.31];
    const bassSequence = () => {
      if (!this.bgmPlaying || !this.bgmEnabled) return;
      
      try {
        const loopStart = ctx.currentTime;
        bassNotes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'sawtooth';
          osc.frequency.value = freq;
          
          const startTime = loopStart + i * 0.5;
          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.45);
          
          osc.connect(gain);
          gain.connect(this.bgmGain);
          
          osc.start(startTime);
          osc.stop(startTime + 0.5);
        });
        
        const arpNotes = [523.25, 659.25, 783.99, 659.25];
        arpNotes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'triangle';
          osc.frequency.value = freq;
          
          const startTime = loopStart + i * 0.25;
          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(0.1, startTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);
          
          osc.connect(gain);
          gain.connect(this.bgmGain);
          
          osc.start(startTime);
          osc.stop(startTime + 0.25);
        });
      } catch (e) {
        console.warn('BGM error:', e);
      }
      
      setTimeout(() => bassSequence(), 2000);
    };
    
    bassSequence();
  }

  stopBGM() {
    this.bgmPlaying = false;
  }

  toggleBGM() {
    this.bgmEnabled = !this.bgmEnabled;
    if (this.bgmEnabled) {
      this.playBGM();
    } else {
      this.stopBGM();
    }
    return this.bgmEnabled;
  }

  toggleSFX() {
    this.sfxEnabled = !this.sfxEnabled;
    return this.sfxEnabled;
  }

  playShoot(element = 0) {
    if (!this.sfxEnabled) return;
    if (!this.init()) return;
    
    try {
      const ctx = this.audioContext;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      const freqs = [880, 440, 1760, 660, 330, 1100];
      osc.type = element === 2 ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(freqs[element] || 880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime((freqs[element] || 880) * 0.5, ctx.currentTime + 0.1);
      
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      
      osc.connect(gain);
      gain.connect(this.sfxGain);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {}
  }

  playHit() {
    if (!this.sfxEnabled) return;
    if (!this.init()) return;
    
    try {
      const ctx = this.audioContext;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);
      
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      
      osc.connect(gain);
      gain.connect(this.sfxGain);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {}
  }

  playKill(isBoss = false) {
    if (!this.sfxEnabled) return;
    if (!this.init()) return;
    
    try {
      const ctx = this.audioContext;
      
      if (isBoss) {
        for (let i = 0; i < 3; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(150 - i * 30, ctx.currentTime + i * 0.1);
          osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + i * 0.1 + 0.3);
          
          gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.3);
          
          osc.connect(gain);
          gain.connect(this.sfxGain);
          
          osc.start(ctx.currentTime + i * 0.1);
          osc.stop(ctx.currentTime + i * 0.1 + 0.3);
        }
      } else {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.15);
        
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      }
    } catch (e) {}
  }

  playDraw() {
    if (!this.sfxEnabled) return;
    if (!this.init()) return;
    
    try {
      const ctx = this.audioContext;
      const notes = [523.25, 659.25, 783.99];
      
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = freq;
        
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.05);
        gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + i * 0.05 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.05 + 0.3);
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        
        osc.start(ctx.currentTime + i * 0.05);
        osc.stop(ctx.currentTime + i * 0.05 + 0.3);
      });
    } catch (e) {}
  }

  playCombine() {
    if (!this.sfxEnabled) return;
    if (!this.init()) return;
    
    try {
      const ctx = this.audioContext;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.2);
      
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      
      osc.connect(gain);
      gain.connect(this.sfxGain);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {}
  }

  playWaveStart() {
    if (!this.sfxEnabled) return;
    if (!this.init()) return;
    
    try {
      const ctx = this.audioContext;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(400, ctx.currentTime + 0.3);
      
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      
      osc.connect(gain);
      gain.connect(this.sfxGain);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {}
  }

  playLifeLost() {
    if (!this.sfxEnabled) return;
    if (!this.init()) return;
    
    try {
      const ctx = this.audioContext;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.3);
      
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      
      osc.connect(gain);
      gain.connect(this.sfxGain);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {}
  }

  playGameOver() {
    if (!this.sfxEnabled) return;
    if (!this.init()) return;
    
    try {
      const ctx = this.audioContext;
      const notes = [392, 349.23, 329.63, 293.66];
      
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.value = freq;
        
        gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.2);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.2 + 0.3);
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        
        osc.start(ctx.currentTime + i * 0.2);
        osc.stop(ctx.currentTime + i * 0.2 + 0.3);
      });
    } catch (e) {}
  }
}

const soundManager = new SoundManager();
