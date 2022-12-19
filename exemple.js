const { executeDwm, redraw } = require('./build/Release/micaElectron');

// Object of different params
const PARAMS = {
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
    TEXT_COLOR: 8,
    FRAME: 9
}

// Object of different values
const VALUE = {
    THEME: {
        AUTO: 0,	// select theme by the windows theme
        DARK: 1,	// select the dark theme
        LIGHT: 2,	// select the white theme
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
    },
    FALSE: 0,
    TRUE: 1
}

// functtion to remove the frame of window
function removeFrame(window) {
    const HWND = window.getNativeWindowHandle()["readInt32LE"]();

    const bounds = window.getBounds();

    window.hide();

    redraw(HWND, bounds.x, bounds.y, bounds.width, bounds.height, 0x0020);

    window.show();
}

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// Enable transparent
app.commandLine.appendSwitch("enable-transparent-visuals");

app.on('ready', () => {

    let hasFrame = false; // false to remvoe the window titlebar

    // Create a browserwindow
    const win = new BrowserWindow({
        width: 600,
        height: 360,
        show: false,
        autoHideMenuBar: true,
        backgroundColor: '#000000ff', // Transparent background
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        frame: hasFrame
    });

    // Get the HWND
    const HWND = win.getNativeWindowHandle()["readInt32LE"]();

    let params = PARAMS.BACKGROUND.TABBED_MICA;
    let value = VALUE.THEME.AUTO;

    // Load file
    win.loadFile(path.join(__dirname, 'files', 'index.html'));

    // show window when file loaded
    win.webContents.once('dom-ready', () => {
        win.show();
    });

    let frameRemoved = false;

    win.on('show', () => {
        executeDwm(HWND, params, value);

        if (!frameRemoved) {
            frameRemoved = true;

            if(!hasFrame)
                removeFrame(win); // remove the frame when window is shown
            
        }
    });

    win.on('resize', () => {
        if(!hasFrame)
            setTimeout(() => executeDwm(HWND, params, value), 60); // refresh effect
    });

    // Change theme
    ipcMain.on('theme', (evt, newValue) => {
        value = newValue;
        executeDwm(HWND, params, value);
    });

    // Change effect
    ipcMain.on('effect', (evt, newParams) => {
        params = newParams;
        executeDwm(HWND, params, value);
    });

    // apply effect (corner, background-color, ...)
    ipcMain.on('params', (evt, params, value) => {
        executeDwm(HWND, params, value);
    });
});