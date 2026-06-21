// ===== Main Entry Point =====

document.addEventListener('DOMContentLoaded', () => {
    // Create and initialize game
    try {
        window.game = new Game();
        window.game.initialize();
    } catch (e) {
        console.error('Game initialization failed:', e);
        localStorage.removeItem('guildSimulatorSave');
        try {
            window.game = new Game();
            window.game.startNewGame();
            window.game.ui.initialize();
            window.game.ui.updateResources();
            window.game.ui.renderCurrentTab();
            window.game.isRunning = true;
        } catch (e2) {
            console.error('Fallback init also failed:', e2);
        }
    }

    // Show error banner if init failed
    if (!window.game || !window.game.guild) {
        const errDiv = document.createElement('div');
        errDiv.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#f44336;color:#fff;padding:15px;z-index:99999;font-size:16px;text-align:center;';
        errDiv.textContent = 'Game failed to load - check browser console (F12) for errors';
        document.body.appendChild(errDiv);
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            if (window.game) {
                window.game.saveGame();
                window.game.ui.showNotification('Game saved!', 'success');
            }
        }

        if (!e.ctrlKey && !e.altKey && !e.shiftKey) {
            switch (e.key) {
                case '1': if (window.game) window.game.ui.switchTab('guild'); break;
                case '2': if (window.game) window.game.ui.switchTab('adventurers'); break;
                case '3': if (window.game) window.game.ui.switchTab('quests'); break;
                case '4': if (window.game) window.game.ui.switchTab('inventory'); break;
                case '5': if (window.game) window.game.ui.switchTab('shop'); break;
                case 'Enter':
                case ' ':
                    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                        e.preventDefault();
                        if (window.game) window.game.nextDay();
                    }
                    break;
            }
        }
    });

    // Wire up header buttons
    document.getElementById('next-day-btn')?.addEventListener('click', () => { try { window.game.nextDay(); } catch(e) { console.error(e); } });
    document.getElementById('save-btn')?.addEventListener('click', () => { try { window.game.saveGame(); window.game.ui.showNotification('Game saved!', 'success'); } catch(e) { console.error(e); } });
    document.getElementById('load-btn')?.addEventListener('click', () => { try { window.game.loadGame(); } catch(e) { console.error(e); } });
    document.getElementById('reset-btn')?.addEventListener('click', () => { try { window.game.resetGame(); } catch(e) { console.error(e); } });
});
