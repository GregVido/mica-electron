import { BrowserWindow } from "electron";

const { app, ipcMain } = require('electron');
const execFile = require("child_process").execFileSync;
const path = require('path');

// ffi is for remove frame
const ffi = require('ffi-napi');

const user32 = new ffi.Library('user32', {
    'SetWindowPos': ['bool', ['long', 'long', 'int', 'int', 'int', 'int', 'uint']],
    'SetWindowLongA': ['long', ['long', 'int', 'long']]
});

// Object of different effects

const EFFECT: { 
    BACKGROUND: { 
        AUTO: number,
        NONE: number, 
        ACRYLIC: number, 
        MICA: number, 
        TABBED_MICA: number 
    }, 
    CORNER : number, 
    BORDER_COLOR: number, 
    CAPTION_COLOR: number, 
    TEXT_COLOR: number 
} = {
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
const PARAMS : {
    THEME: {
        AUTO: string,
        DARK: string,
        LIGHT: string,
    },
    CORNER: {
        DEFAULT: number,
        DONOTROUND: number,
        ROUND: number,
        ROUNDSMALL: number
    },
    COLOR: {
        RED: number,
        GREEN: number,
        BLUE: number,
        BLACK: number,
        WHITE: number,
        FROM_RGB: (r: number, g: number, b: number) => number
    }
} = {
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
        FROM_RGB:  (r: number, g: number, b: number) => {
            return r + (g << 8) + (b << 16);
        }
    }
}

// Enable transparent
app.commandLine.appendSwitch("enable-transparent-visuals");

// function to apply effect
function executeDwm(hwnd: number, effect: number, theme: string): void {
    // Execute dwm_exec.exe to apply effect
    execFile(path.join(__dirname, '..', 'dwm_exec.exe'), [hwnd, effect, theme]);
}

// functtion to remove the frame of window
function removeFrame(window: BrowserWindow): void {
    const HWND = window.getNativeWindowHandle()["readInt32LE"]();

    const bounds = window.getBounds();

    user32.SetWindowLongA(HWND, -16, 0x00fff00); 
    user32.SetWindowPos(HWND, 0, bounds.x, bounds.y, bounds.width, bounds.height, 0x0020); 
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
        },

    });

    // Get the HWND
    const HWND = win.getNativeWindowHandle()["readInt32LE"]();

    let effect = EFFECT.BACKGROUND.MICA;
    let theme = PARAMS.THEME.AUTO;

    // removeFrame(win); // -> remove frame

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
    ipcMain.on('theme', (evt: any, newTheme: string) => {
        theme = newTheme;
        executeDwm(HWND, effect, theme);
    });

    // Change effect
    ipcMain.on('effect', (evt: any, newEffect: number) => {
        effect = newEffect;
        executeDwm(HWND, effect, theme);
    });

    ipcMain.on('params', (evt: any, params: number, value: string) => {
        executeDwm(HWND, params, value);
    });

});
