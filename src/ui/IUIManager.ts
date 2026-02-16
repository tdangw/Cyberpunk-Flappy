import type { Game } from '../core/Game';
import type { SaveManager } from '../managers/SaveManager';
import type { SkinManager } from '../managers/SkinManager';
import type { AudioManager } from '../managers/AudioManager';

export interface IUIManager {
    game: Game;
    saveManager: SaveManager;
    skinManager: SkinManager;
    audioManager: AudioManager;

    playClick(): void;
    showConfirm(title: string, msg: string, callback: (qty?: number) => void, showQty?: boolean): void;
    showTooltip(text: string, x: number, y: number): void;
    hideTooltip(): void;
    showCentralNotification(msg: string, type?: 'success' | 'error'): void;
    showError(msg: string): void;
    updateAllUI(): void;
    closeActiveModals(onFinalComplete?: () => void): void;
    destroy(): void;
}
