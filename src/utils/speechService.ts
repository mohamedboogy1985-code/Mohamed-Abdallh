/**
 * Real-time Speech-to-Speech service for Nexus-OS
 * Integrates Web Speech API (speech recognition & speech synthesis)
 * with Gemini 3.8 Flash Lite TTS endpoint and Web Audio frequency analysis.
 */

// Define SpeechRecognition interface for browser compatibility
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

import { PrebuiltVoiceName, AgentType } from '../types/nexus';

export interface SpeechOptions {
  voiceName?: PrebuiltVoiceName;
  pitch?: number;
  speed?: number;
  agentType?: AgentType;
  enableChime?: boolean;
  beaconFreq?: number;
}

export class SpeechService {
  private recognition: any = null;
  private isListening = false;
  private currentAudio: HTMLAudioElement | null = null;
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private isSpeaking = false;
  private onTranscriptCallback: ((text: string, isFinal: boolean) => void) | null = null;
  private onListeningStateCallback: ((isListening: boolean) => void) | null = null;
  private onSpeakingStateCallback: ((isSpeaking: boolean) => void) | null = null;

  constructor() {
    this.initRecognition();
  }

  private initRecognition() {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onstart = () => {
          this.isListening = true;
          this.onListeningStateCallback?.(true);
        };

        this.recognition.onend = () => {
          this.isListening = false;
          this.onListeningStateCallback?.(false);
        };

        this.recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
          if (e.error !== 'no-speech') {
            console.warn('Speech recognition warning:', e.error);
          }
          this.isListening = false;
          this.onListeningStateCallback?.(false);
        };

        this.recognition.onresult = (event: SpeechRecognitionEvent) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          if (finalTranscript) {
            this.onTranscriptCallback?.(finalTranscript.trim(), true);
          } else if (interimTranscript) {
            this.onTranscriptCallback?.(interimTranscript.trim(), false);
          }
        };
      } catch (err) {
        console.warn('SpeechRecognition initialization error:', err);
      }
    }
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  public setCallbacks(callbacks: {
    onTranscript?: (text: string, isFinal: boolean) => void;
    onListeningChange?: (isListening: boolean) => void;
    onSpeakingChange?: (isSpeaking: boolean) => void;
  }) {
    if (callbacks.onTranscript) this.onTranscriptCallback = callbacks.onTranscript;
    if (callbacks.onListeningChange) this.onListeningStateCallback = callbacks.onListeningChange;
    if (callbacks.onSpeakingChange) this.onSpeakingStateCallback = callbacks.onSpeakingChange;
  }

  public startListening(): boolean {
    if (!this.recognition) {
      this.initRecognition();
    }
    if (!this.recognition) return false;

    // Interrupt any active speech before listening
    this.stopSpeaking();

    try {
      this.recognition.start();
      return true;
    } catch (err) {
      console.warn('Failed to start speech recognition:', err);
      return false;
    }
  }

  public stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (err) {
        // ignore
      }
    }
    this.isListening = false;
    this.onListeningStateCallback?.(false);
  }

  /**
   * Play an auditory cue/beacon chime unique to each specialized sub-agent
   */
  public playChime(frequency: number = 440, durationMs: number = 90): void {
    try {
      if (typeof window === 'undefined') return;
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;
      if (!this.audioCtx) {
        this.audioCtx = new AudioCtxClass();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + durationMs / 1000);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + durationMs / 1000);
    } catch {
      // ignore
    }
  }

  /**
   * Speak output using Gemini Flash Lite TTS or Browser Web Speech fallback with customizable voice, pitch, and speed
   */
  public async speak(text: string, options?: SpeechOptions): Promise<void> {
    this.stopSpeaking();

    if (!text.trim()) return;

    // Play agent acoustic identifier beacon if enabled
    if (options?.enableChime) {
      this.playChime(options.beaconFreq || 440);
      await new Promise((r) => setTimeout(r, 60));
    }

    this.isSpeaking = true;
    this.onSpeakingStateCallback?.(true);

    const targetVoice = options?.voiceName || 'Zephyr';
    const targetSpeed = options?.speed ?? 1.0;
    const targetPitch = options?.pitch ?? 1.0;

    try {
      // 1. Try server-side Gemini 3.8 Flash Lite TTS with selected voice
      const res = await fetch('/api/nexus/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceName: targetVoice }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          await this.playBase64Audio(data.audioBase64, targetSpeed);
          this.isSpeaking = false;
          this.onSpeakingStateCallback?.(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Server TTS unavailable, using browser speech synthesis:', err);
    }

    // 2. Fallback to native browser SpeechSynthesis with customized pitch, speed, and voice
    await this.speakWithBrowserSynth(text, {
      voiceName: targetVoice,
      pitch: targetPitch,
      speed: targetSpeed,
    });
    this.isSpeaking = false;
    this.onSpeakingStateCallback?.(false);
  }

  private playBase64Audio(base64: string, speed: number = 1.0): Promise<void> {
    return new Promise((resolve) => {
      try {
        const audio = new Audio(`data:audio/wav;base64,${base64}`);
        this.currentAudio = audio;
        audio.playbackRate = Math.max(0.5, Math.min(2.0, speed));

        audio.onended = () => {
          this.currentAudio = null;
          resolve();
        };

        audio.onerror = () => {
          this.currentAudio = null;
          resolve();
        };

        audio.play().catch(() => {
          // Autoplay policy fallback
          resolve();
        });
      } catch (e) {
        resolve();
      }
    });
  }

  private speakWithBrowserSynth(
    text: string,
    options?: { voiceName?: string; pitch?: number; speed?: number }
  ): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        resolve();
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = Math.max(0.6, Math.min(1.8, options?.speed ?? 1.0));
      utterance.pitch = Math.max(0.5, Math.min(1.6, options?.pitch ?? 1.0));

      // Select matching English voice according to persona style
      const voices = window.speechSynthesis.getVoices();
      let preferred: SpeechSynthesisVoice | undefined;

      if (options?.voiceName === 'Fenrir') {
        // Deep / lower register
        preferred = voices.find(
          (v) => (v.name.includes('David') || v.name.includes('Male') || v.name.includes('George') || v.name.includes('Mark')) && v.lang.startsWith('en')
        );
      } else if (options?.voiceName === 'Puck') {
        // Energetic / higher pitch
        preferred = voices.find(
          (v) => (v.name.includes('Natural') || v.name.includes('Fast') || v.name.includes('Microsoft')) && v.lang.startsWith('en')
        );
      } else if (options?.voiceName === 'Kore') {
        // Calm / female / clear
        preferred = voices.find(
          (v) => (v.name.includes('Zira') || v.name.includes('Samantha') || v.name.includes('Female') || v.name.includes('Victoria')) && v.lang.startsWith('en')
        );
      } else if (options?.voiceName === 'Charon') {
        // Low resonance
        preferred = voices.find(
          (v) => (v.name.includes('David') || v.name.includes('Male')) && v.lang.startsWith('en')
        );
      }

      if (!preferred) {
        preferred =
          voices.find(
            (v) =>
              (v.name.includes('Natural') ||
                v.name.includes('Google') ||
                v.name.includes('Samantha') ||
                v.name.includes('David')) &&
              v.lang.startsWith('en')
          ) || voices.find((v) => v.lang.startsWith('en'));
      }

      if (preferred) {
        utterance.voice = preferred;
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      window.speechSynthesis.speak(utterance);
    });
  }

  public stopSpeaking() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
    this.onSpeakingStateCallback?.(false);
  }

  public getIsListening(): boolean {
    return this.isListening;
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }
}

export const speechService = new SpeechService();
