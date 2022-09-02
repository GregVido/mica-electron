const { app, BrowserWindow } = require('electron');
const execFile = require("child_process").execFileSync;
const path = require('path');

// Object of different effects
const TRANSPARENT = {
    DWMSBT_AUTO: 0,
    DWMSBT_NONE: 1,
    DWMSBT_MAINWINDOW: 2,		// Mica
    DWMSBT_TRANSIENTWINDOW: 3,  // Acrylic
    DWMSBT_TABBEDWINDOW: 4		// Mica tabbed
}

// Object of different theme
const THEME = {
    AUTO: 'auto',
    DARK: 'dark',
    WHITE: 'white',
}

// Enable transparent
app.commandLine.appendSwitch("enable-transparent-visuals");

app.on('ready', () => {
    // Create a browserwindow
    const win = new BrowserWindow({
        width: 600,
        height: 180,
        transparent: true, // Enable transparent
        show: false,
        autoHideMenuBar: true
    });

    // Get the HWND
    const HWND = win.getNativeWindowHandle()["readInt32LE"]();
    // Execute dwm_exec.exe to apply effect
    execFile(path.join(__dirname, '..', 'dwm_exec.exe'), [HWND, TRANSPARENT.DWMSBT_MAINWINDOW, THEME.AUTO]);

    // Load an exemple file
    win.loadFile(path.join(__dirname, 'files', 'index.html'));

    // When win loaded, show it
    win.webContents.once('dom-ready', () => {
        win.show();
    });

});
