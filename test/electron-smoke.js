'use strict';

const assert = require('node:assert/strict');
const { app } = require('electron');
const { MicaBrowserWindow, IS_WINDOWS_11, WIN10 } = require('../main');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const watchdog = setTimeout(() => { console.error('Electron smoke test timed out.'); app.exit(1); }, 30000);

async function transition(win, event, action) {
    await new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            win.removeListener(event, onEvent);
            reject(new Error(`Window did not emit ${event}.`));
        }, 5000);
        const onEvent = () => { clearTimeout(timer); resolve(); };
        win.once(event, onEvent);
        action();
    });
    await delay(100);
}

async function assertRenderer(win) {
    assert.equal(await win.webContents.executeJavaScript('document.body.textContent'), 'Mica regression test');
    const image = await win.webContents.capturePage();
    assert.equal(image.isEmpty(), false, 'renderer must still paint after restore');
    const { width, height } = image.getSize();
    const bitmap = image.toBitmap();
    const offset = (Math.floor(height / 2) * width + Math.floor(width / 2)) * 4;
    // NativeImage bitmap is BGRA. The page has an opaque red background.
    assert.ok(bitmap[offset + 2] > 200 && bitmap[offset + 1] < 60 && bitmap[offset] < 60,
        'captured page must contain the rendered background, not a blank surface');
}

app.whenReady().then(async () => {
    const windows = [];
    try {
        for (const decoration of [{ frame: true }, { frame: false }, { titleBarStyle: 'hidden' }]) {
            const win = new MicaBrowserWindow({
                width: 800, height: 600, show: false, ...decoration,
                webPreferences: { experimentalFeatures: true }
            });
            windows.push(win);
            win.setDarkTheme();
            if (IS_WINDOWS_11) win.setMicaEffect();
            else win.setCustomEffect(WIN10.ACRYLIC, '#123456', 0.5);
            assert.equal(win.webContents.getLastWebPreferences().experimentalFeatures, true);
            assert.deepEqual(win.getSize(), [800, 600]);
            await win.loadURL('data:text/html,' + encodeURIComponent(
                '<style>html,body{margin:0;width:100%;height:100%;background:rgb(240,20,20)}</style><body>Mica regression test</body>'));
            win.showInactive();
            await delay(150);
            assert.deepEqual(win.getSize(), [800, 600], 'show must preserve DIP dimensions');
            await assertRenderer(win);
            await transition(win, 'maximize', () => win.maximize());
            await transition(win, 'minimize', () => win.minimize());
            await transition(win, 'restore', () => win.restore());
            await assertRenderer(win);
            if (win.isMaximized()) await transition(win, 'unmaximize', () => win.unmaximize());
            win.setBorderColor(null); win.setCaptionColor(null); win.setTitleTextColor(null);
            win.alwaysFocused(true);
            win.destroy();
            await delay(100);
        }
        // The legacy frame subclass must be idempotent and safe across windows.
        if (process.platform === 'win32') {
            const first = new MicaBrowserWindow({ show: false });
            const second = new MicaBrowserWindow({ show: false });
            windows.push(first, second);
            first.interceptMessage(); first.interceptMessage(); second.interceptMessage();
            first.destroy(); second.destroy();
        }
        console.log(`Electron ${process.versions.electron}: native loading, preferences, DIP size, three frame styles, minimize/restore painting and cleanup passed.`);
        clearTimeout(watchdog);
        app.exit(0);
    } catch (error) {
        console.error(error);
        for (const win of windows) if (!win.isDestroyed()) win.destroy();
        clearTimeout(watchdog);
        app.exit(1);
    }
});

// Explicit app.exit above controls the test result, even between windows.
app.on('window-all-closed', () => {});
