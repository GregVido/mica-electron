const { app, BrowserWindow, ipcMain } = require('electron');
const execFile = require("child_process").execFileSync;
const path = require('path');

// Object of different effects
const TRANSPARENT = {
    AUTO: 0,
    NONE: 1,
    ACRYLIC: 3,     // Acrylic
    MICA: 2,        // Mica
    TABBED_MICA: 4  // Mica tabbed
}

// Object of different theme
const THEME = {
    AUTO: 'auto',
    DARK: 'dark',
    LIGHT: 'light',
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

    let effect = TRANSPARENT.MICA;
    let theme = THEME.AUTO;

    // execute effect
    executeDwm(HWND, effect, theme);

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

});
