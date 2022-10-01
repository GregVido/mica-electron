const { app, BrowserWindow, ipcMain } = require('electron');
const execFile = require("child_process").execFileSync;
const path = require('path');

// Object of different effects
const EFFECT = {
    BACKGROUND: {
        AUTO: 0,
        NONE: 1,
        ACRYLIC: 3,         // Acrylic
        MICA: 2,            // Mica
        TABBED_MICA: 4      // Mica tabbed
    },
    CORNER: 5,
    BORDER_COLOR: 6,
    CAPTION_COLOR: 7,
    TEXT_COLOR: 8
}

// Object of different params
const PARAMS = {
    THEME: {
        AUTO: 'auto',
        DARK: 'dark',
        LIGHT: 'light',
    },
    CORNER: {
        DEFAULT: 0,
        DONOTROUND: 1,
        ROUND: 2,
        ROUNDSMALL: 3
    },
    COLOR: {
        RED: 0x000000FF,
        GREEN: 0x0000FF00,
        BLUE: 0x00FF0000,
        BLACK: 0x00000000,
        WHITE: 0x00FFFFFF,
        FROM_RGB: (r, g, b) => {
            return r + (g << 8) + (b << 16);
        }
    }
}

// Enable transparent
app.commandLine.appendSwitch("enable-transparent-visuals");

// function to apply effect
function executeDwm(hwnd, effect, theme) {
    // Execute dwm_exec.exe to apply effect
    execFile(path.join(__dirname, '..', 'dwm_exec.exe'), [hwnd, effect, theme]);
}

app.on('ready', () => {
    // Create a browserwindow
    const win = new BrowserWindow({
        width: 600,
        height: 360,
        show: false,
        autoHideMenuBar: true,
        backgroundColor: '#00000000', // Transparent background
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    // Get the HWND
    const HWND = win.getNativeWindowHandle()["readInt32LE"]();

    let effect = EFFECT.BACKGROUND.MICA;
    let theme = PARAMS.THEME.AUTO;

    // execute effects
    executeDwm(HWND, effect, theme);

    /*
        executeDwm(HWND, EFFECT.CORNER, PARAMS.CORNER.ROUNDSMALL); // -> Small corner rounded
        executeDwm(HWND, EFFECT.BORDER_COLOR, PARAMS.COLOR.FROM_RGB(112, 4, 4)); // -> Border color
        executeDwm(HWND, EFFECT.CAPTION_COLOR, PARAMS.COLOR.FROM_RGB(112, 4, 4)); // -> Background titlebar color
        executeDwm(HWND, EFFECT.TEXT_COLOR, PARAMS.COLOR.WHITE); // -> Title text color
    */

    // Load an exemple file
    win.loadFile(path.join(__dirname, 'files', 'index.html'));

    // When win loaded, show it
    win.webContents.once('dom-ready', () => {
        win.show();
    });

    // Change theme
    ipcMain.on('theme', (evt, newTheme) => {
        theme = newTheme;
        executeDwm(HWND, effect, theme);
    });

    // Change effect
    ipcMain.on('effect', (evt, newEffect) => {
        effect = newEffect;
        executeDwm(HWND, effect, theme);
    });

    ipcMain.on('params', (evt, params, value) => {
        executeDwm(HWND, params, value);
    });

});
