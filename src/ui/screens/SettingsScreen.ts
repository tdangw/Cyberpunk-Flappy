import type { IUIManager } from '../IUIManager';
import { DEFAULT_CONFIG } from '../../config/constants';

export class SettingsScreen {
    private ui: IUIManager;

    constructor(ui: IUIManager) {
        this.ui = ui;
        this.setupSettingsControls();
        this.setupAudioControls();
    }

    show(): void {
        this.ui.game.pause();
        this.ui.updateAllUI(); // Ensure controls reflect state
        document.getElementById('settings-panel')?.classList.add('modal-active');
    }

    private setupSettingsControls(): void {
        const config = this.ui.game.getConfig();
        const setupSlider = (id: string, valId: string, initial: number, updateFn: (v: number) => void) => {
            const range = document.getElementById(id) as HTMLInputElement;
            const val = document.getElementById(valId);
            if (range && val) {
                range.value = initial.toString();
                val.textContent = initial.toString();
                range.addEventListener('input', () => {
                    val.textContent = range.value;
                    updateFn(parseFloat(range.value));
                }, { signal: this.ui.getSignal() });
            }
        };

        setupSlider('speedRange', 'val-speed', config.speed, (v) => this.ui.game.updateConfig({ speed: v }));
        setupSlider('gravityRange', 'val-gravity', config.gravity, (v) => this.ui.game.updateConfig({ gravity: v }));
        setupSlider('liftRange', 'val-lift', config.jump, (v) => this.ui.game.updateConfig({ jump: v }));
        setupSlider('gapRange', 'val-gap', config.pipeGap, (v) => this.ui.game.updateConfig({ pipeGap: v }));
        setupSlider('spacingRange', 'val-spacing', config.pipeSpacing, (v) => this.ui.game.updateConfig({ pipeSpacing: v }));

        document.getElementById('applySettingsBtn')?.addEventListener('click', () => {
            this.ui.playClick();
            this.ui.closeActiveModals(() => {
                this.ui.game.restart();
                // We need to access HUD via UIManager if public, or trigger event.
                // Assuming UIManager handles splash screen show via a method we can call?
                // showSplashScreen is private in original. We should expose it in IUIManager or handle via event.
                // Let's assume UI updates happen automatically or we call restart.
                // Actually original code called this.showSplashScreen().
                // I will add showSplashScreen to ScreenManager interface? No, it belongs to HUD or Start/Splash.
                // I will make UIManager expose showSplashScreen.
                (this.ui as any).hud.showSplashScreen();
            });
        }, { signal: this.ui.getSignal() });

        document.getElementById('resetDefaultsBtn')?.addEventListener('click', () => {
            this.ui.playClick();
            this.resetSettings();
        }, { signal: this.ui.getSignal() });
    }

    private setupAudioControls(): void {
        const settings = this.ui.audioManager.getSettings();
        const bgmRange = document.getElementById('bgmVolumeRange') as HTMLInputElement;
        const sfxRange = document.getElementById('sfxVolumeRange') as HTMLInputElement;

        if (bgmRange) {
            bgmRange.value = settings.bgmVolume.toString();
            bgmRange.addEventListener('input', () => this.ui.audioManager.setBGMVolume(parseFloat(bgmRange.value)), { signal: this.ui.getSignal() });
        }
        if (sfxRange) {
            sfxRange.value = settings.sfxVolume.toString();
            sfxRange.addEventListener('input', () => this.ui.audioManager.setSFXVolume(parseFloat(sfxRange.value)), { signal: this.ui.getSignal() });
        }

        document.getElementById('toggle-bgm')?.addEventListener('click', () => {
            this.ui.playClick();
            this.ui.audioManager.setBGMEnabled(!this.ui.audioManager.getSettings().bgmEnabled);
            this.updateAudioUI();
        }, { signal: this.ui.getSignal() });
        document.getElementById('toggle-sfx')?.addEventListener('click', () => {
            this.ui.playClick();
            this.ui.audioManager.setSFXEnabled(!this.ui.audioManager.getSettings().sfxEnabled);
            this.updateAudioUI();
        }, { signal: this.ui.getSignal() });

        // Dash Control Selectors
        document.getElementById('mode-touch')?.addEventListener('click', () => {
            this.ui.playClick();
            this.ui.game.updateConfig({ dashControl: 'touch' });
            this.ui.updateAllUI();
        }, { signal: this.ui.getSignal() });
        document.getElementById('mode-left')?.addEventListener('click', () => {
            this.ui.playClick();
            this.ui.game.updateConfig({ dashControl: 'button_left' });
            this.ui.updateAllUI();
        }, { signal: this.ui.getSignal() });
        document.getElementById('mode-right')?.addEventListener('click', () => {
            this.ui.playClick();
            this.ui.game.updateConfig({ dashControl: 'button_right' });
            this.ui.updateAllUI();
        }, { signal: this.ui.getSignal() });
        document.getElementById('mode-fps')?.addEventListener('click', () => {
            this.ui.playClick();
            const current = this.ui.game.getConfig().showFPS;
            this.ui.game.updateConfig({ showFPS: !current });
            this.ui.updateAllUI();
        }, { signal: this.ui.getSignal() });
        document.getElementById('toggle-bg-details')?.addEventListener('click', () => {
            this.ui.playClick();
            const current = this.ui.game.getConfig().showBackgroundDetails;
            this.ui.game.updateConfig({ showBackgroundDetails: !current });
            this.ui.updateAllUI();
        }, { signal: this.ui.getSignal() });
        document.getElementById('toggle-ground-details')?.addEventListener('click', () => {
            this.ui.playClick();
            const current = this.ui.game.getConfig().showGroundDetails;
            this.ui.game.updateConfig({ showGroundDetails: !current });
            this.ui.updateAllUI();
        }, { signal: this.ui.getSignal() });
    }

    updateAudioUI(): void {
        const settings = this.ui.audioManager.getSettings();
        const btnBGM = document.getElementById('toggle-bgm');
        const btnSFX = document.getElementById('toggle-sfx');
        if (btnBGM) {
            btnBGM.textContent = settings.bgmEnabled ? 'ON' : 'OFF';
            btnBGM.className = `btn-toggle ${settings.bgmEnabled ? 'on' : 'off'}`;
        }
        if (btnSFX) {
            btnSFX.textContent = settings.sfxEnabled ? 'ON' : 'OFF';
            btnSFX.className = `btn-toggle ${settings.sfxEnabled ? 'on' : 'off'}`;
        }
    }

    private resetSettings(): void {
        this.ui.game.updateConfig(DEFAULT_CONFIG);
        const config = this.ui.game.getConfig();
        const set = (id: string, valId: string, v: number) => {
            const r = document.getElementById(id) as HTMLInputElement;
            if (r) r.value = v.toString();
            const t = document.getElementById(valId);
            if (t) t.textContent = v.toString();
        };
        set('speedRange', 'val-speed', config.speed);
        set('gravityRange', 'val-gravity', config.gravity);
        set('liftRange', 'val-lift', config.jump);
        set('gapRange', 'val-gap', config.pipeGap);
        set('spacingRange', 'val-spacing', config.pipeSpacing);
    }
}
