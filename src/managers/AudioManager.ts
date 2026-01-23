import { Howl } from 'howler';

/**
 * Manages all game audio using Howler.js
 */
export class AudioManager {
    private static instance: AudioManager;

    private sounds: Map<string, Howl> = new Map();
    private bgm: Howl | null = null;
    private config: {
        bgmEnabled: boolean;
        sfxEnabled: boolean;
        bgmVolume: number;
        sfxVolume: number;
    };

    private constructor() {
        this.config = {
            bgmEnabled: true,
            sfxEnabled: true,
            bgmVolume: 0.4,
            sfxVolume: 0.6
        };
        this.loadSounds();
    }

    static getInstance(): AudioManager {
        if (!AudioManager.instance) {
            AudioManager.instance = new AudioManager();
        }
        return AudioManager.instance;
    }

    private loadSounds(): void {
        const soundFiles = [
            { id: 'jump', file: 'jump.wav' },
            { id: 'score', file: 'score.wav' },
            { id: 'hit', file: 'hit.wav' },
            { id: 'die', file: 'die.wav' },
            { id: 'coin', file: 'coin.wav' },
            { id: 'dash', file: 'dash.wav' },
            { id: 'click', file: 'click.wav' }
        ];

        soundFiles.forEach(s => {
            this.sounds.set(s.id, new Howl({
                src: [`/audio/${s.file}`],
                volume: this.config.sfxVolume,
                onloaderror: () => console.warn(`Audio file not found: /audio/${s.file}`)
            }));
        });
    }

    play(id: string): void {
        if (!this.config.sfxEnabled) return;
        const sound = this.sounds.get(id);
        if (sound) {
            sound.volume(this.config.sfxVolume);
            sound.play();
        }
    }

    playBGM(file: string = 'bgm_city.mp3'): void {
        if (this.bgm) this.bgm.stop();

        this.bgm = new Howl({
            src: [`/audio/${file}`],
            loop: true,
            volume: this.config.bgmVolume,
            onloaderror: () => console.warn(`BGM file not found: /audio/${file}`)
        });

        if (this.config.bgmEnabled) {
            this.bgm.play();
        }
    }

    setBGMVolume(val: number): void {
        this.config.bgmVolume = val;
        if (this.bgm) this.bgm.volume(val);
    }

    setSFXVolume(val: number): void {
        this.config.sfxVolume = val;
    }

    setBGMEnabled(enabled: boolean): void {
        this.config.bgmEnabled = enabled;
        if (enabled) {
            if (this.bgm && !this.bgm.playing()) this.bgm.play();
        } else {
            if (this.bgm) this.bgm.stop();
        }
    }

    setSFXEnabled(enabled: boolean): void {
        this.config.sfxEnabled = enabled;
    }

    getSettings() {
        return { ...this.config };
    }
}
