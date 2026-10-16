/*
Copyright 2026 GregVido

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

const electron = require('electron');
const os = require('os');
const fs = require('fs');
const path = require('path');

const ELECTRON_MAJOR = Number.parseInt(process.versions.electron, 10);
const IS_WINDOWS = process.platform === 'win32';
const WINDOWS_BUILD = IS_WINDOWS ? Number(os.release().split('.')[2]) : 0;
const HAS_NATIVE_MATERIAL = WINDOWS_BUILD >= 22621 && ELECTRON_MAJOR >= 28 &&
    typeof electron.BrowserWindow.prototype.setBackgroundMaterial === 'function';
const NEEDS_TRANSPARENT_WORKAROUND = IS_WINDOWS && ELECTRON_MAJOR >= 27 && !HAS_NATIVE_MATERIAL;

const filepath = path.join(__dirname, 'src', '/micaElectron_' + process.arch);

let executeDwm, redraw, executeUser32;

if (fs.existsSync(filepath + '.node')) {
    /* If mica-electron is running on windows */
    if (process.platform == 'win32') {
        const micaBuild = require(filepath);

        executeDwm = micaBuild.executeDwm;
        redraw = micaBuild.redraw;
        executeUser32 = micaBuild.executeUser32;
    }
    else {
        console.log('Mica-Electron only works on Windows!');
        console.log('Mica-Electron: Disabled');
    }
}

else {
    console.log('./src/micaElectron_' + process.arch + '.node does not exist!');
    console.log('Mica-Electron: Disabled');
}

if (NEEDS_TRANSPARENT_WORKAROUND)
    electron.app.commandLine.appendSwitch('enable-transparent-visuals');

/**
 * Detect if OS is windows 11
 * @returns {Boolean} True if windows 11
 */
function isWin11() {
    return IS_WINDOWS && WINDOWS_BUILD >= 22000;
}

const WINDOWS_11 = isWin11();

/**
 * Remove a frame from a window
 * @param  {BrowserWindow} window Target to remove frame
 */
function redrawFrame(window) {
    if (redraw && !window.isDestroyed()) {
        const HWND = window.getNativeWindowHandle().readUInt32LE();
        // Electron uses DIP; the Win32 API expects physical screen coordinates.
        const bounds = electron.screen.dipToScreenRect(window, window.getBounds());
        redraw(HWND, bounds.x, bounds.y, bounds.width, bounds.height);
    }
}

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
    FRAME: 9,
    MARGIN: 10
}

const VALUE = {
    THEME: {
        AUTO: 5,	// select theme by the windows theme
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

const WIN10 = {
    TRANSPARENT: 2,
    BLURBEHIND: 3,
    ACRYLIC: 4
}

/**
 * Convert HTML color to windows color
 * @param  {String} str HTML color
 * @return {Number}     windows color (int, 24 bits)
 */
let getColorByString = (str) => {
    if (typeof str !== 'string' || !/^(#[\da-f]{3}|#[\da-f]{6}|[\da-f]{8}|rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\))$/i.test(str))
        throw new TypeError('Expected #RGB, #RRGGBB, rgb(r, g, b), or an Electron accent color.');
    str = str.toLowerCase();
    if (str.startsWith('#')) {
        const hexs = str.slice(1);
        if (hexs.length == 3) {
            const r = parseInt(hexs[0] + hexs[0], 16);
            const g = parseInt(hexs[1] + hexs[1], 16);
            const b = parseInt(hexs[2] + hexs[2], 16);

            return VALUE.COLOR.FROM_RGB(r, g, b);
        }
        else if (hexs.length == 6) {
            const r = parseInt(hexs.slice(0, 2), 16);
            const g = parseInt(hexs.slice(2, 4), 16);
            const b = parseInt(hexs.slice(4, 6), 16);

            return VALUE.COLOR.FROM_RGB(r, g, b);
        }
    }
    else if (str.startsWith('rgb(')) {
        const data = str.slice(4).split(')')[0].split(',');

        const r = parseInt(data[0]);
        const g = parseInt(data[1]);
        const b = parseInt(data[2]);

        if ([r, g, b].some(channel => channel > 255))
            throw new RangeError('RGB channels must be between 0 and 255.');

        return VALUE.COLOR.FROM_RGB(r, g, b);
    }
    else if (str.length == 8) { // color from getAccentColor()
        const r = parseInt(str.slice(0, 2), 16);
        const g = parseInt(str.slice(2, 4), 16);
        const b = parseInt(str.slice(4, 6), 16);

        return VALUE.COLOR.FROM_RGB(r, g, b);
    }
}

class BrowserWindow extends electron.BrowserWindow {

    /** @type {Number} */
    effect = PARAMS.BACKGROUND.AUTO;
    /** @type {Number} */
    theme = VALUE.THEME.AUTO;

    /** @type {Boolean} */
    useDWM = false;

    /** @type {Boolean} */
    hasFrameless = false;

    /** @type {Boolean} */
    forceFocus = false;

    /** @type {Boolean} */
    hasMargin = false;

    /**
     * Create electron BrowserWindow with mica effect features
     * @param {Electron.BrowserWindowConstructorOptions} options
     */
    constructor(options = {}) {
        const windowOptions = { ...options };
        if (IS_WINDOWS) {
            windowOptions.backgroundColor ??= '#00ffffff';
            if (NEEDS_TRANSPARENT_WORKAROUND)
                windowOptions.transparent = true;
        }
        super(windowOptions);

        this.hasFrameless = options.frame === false || options.titleBarStyle === 'hidden';
        this._legacyFrameInitialized = false;
        this._user32Effect = null;
        this._inSizeMove = false;
        if (HAS_NATIVE_MATERIAL && typeof options.backgroundMaterial === 'string') {
            const effect = ['auto', 'none', 'mica', 'acrylic', 'tabbed'].indexOf(options.backgroundMaterial);
            if (effect !== -1) {
                this.effect = effect;
                this.useDWM = effect !== PARAMS.BACKGROUND.NONE;
                this.hasMargin = this.useDWM;
            }
        }

        const applyEffect = () => {
            if (this.isDestroyed() || this.isMinimized()) return;
            if (this.useDWM) {
                this.executeDwm(this.effect, this.theme);
            }
            if (this.hasMargin) this.enableMargin();
        };

        const onWindowShow = () => {
            if (this.isDestroyed()) return;
            if (NEEDS_TRANSPARENT_WORKAROUND && executeDwm && !this._legacyFrameInitialized) {
                this._legacyFrameInitialized = true;
                this.interceptMessage();
                if (options.resizable !== false && options.maximizable !== false)
                    this.applyStyle();
                if (this.hasFrameless) this.removeCaption();
                redrawFrame(this);
            }
            applyEffect();
        };

        this.on('show', onWindowShow);
        this.on('restore', onWindowShow);

        this.on('maximize', applyEffect);
        this.on('unmaximize', applyEffect);
        this.on('closed', () => {
            clearInterval(this.marginTimer);
            clearTimeout(this._resizeTimer);
            this.marginTimer = null;
            this._resizeTimer = null;
        });

        this.on('resize', () => {
            if (this.hasFrameless && !HAS_NATIVE_MATERIAL) {
                clearTimeout(this._resizeTimer);
                this._resizeTimer = setTimeout(applyEffect, 60);
            }
        });

        // Acrylic is expensive during the Win32 move/resize modal loop (#28).
        if (IS_WINDOWS && !WINDOWS_11 && executeUser32) {
            this.hookWindowMessage(0x0231, () => { // WM_ENTERSIZEMOVE
                this._inSizeMove = true;
                if (this._user32Effect?.params === WIN10.ACRYLIC)
                    this._applyUser32(WIN10.BLURBEHIND, this._user32Effect.value);
            });
            this.hookWindowMessage(0x0232, () => { // WM_EXITSIZEMOVE
                this._inSizeMove = false;
                if (this._user32Effect)
                    this._applyUser32(this._user32Effect.params, this._user32Effect.value);
            });
        }
        if (this.isVisible()) onWindowShow();
    }

    /**
     * Enable resize/maximize for the window 
     */
    applyStyle() {
        this.executeDwm(PARAMS.FRAME, 1);
    }

    /**
     * Restore the full screen action
     */
    interceptMessage() {
        this.executeDwm(PARAMS.FRAME, 2);
    }

    /**
     * Remove Window Caption
     */
    removeCaption() {
        this.executeDwm(PARAMS.FRAME, 4);
    }

    /**
     * Disable transparent for mica effect
     */
    disableMargin() {
        if (this.marginTimer) {
            clearInterval(this.marginTimer);
            this.marginTimer = null;
        }
        if (this.useDWM)
            this.executeDwm(PARAMS.MARGIN, 1);

        this.hasMargin = false;
    }

    /**
     * Enable transparent for mica effect
     */
    enableMargin() {
        if (this.marginTimer)
            clearInterval(this.marginTimer);
        this.marginTimer = null;
        if (!WINDOWS_11 || this.isDestroyed()) return;
        this.hasMargin = true;
        if (HAS_NATIVE_MATERIAL && !this.forceFocus) return;
        if (!executeDwm) return;
        if (!HAS_NATIVE_MATERIAL)
            this.executeDwm(PARAMS.MARGIN, 0);
        if ((!HAS_NATIVE_MATERIAL && this.hasFrameless) || this.forceFocus)
            this.marginTimer = setInterval(() => {
                if (this.isDestroyed() || !this.isVisible() || this.isMinimized()) return;
                try {
                    if (!HAS_NATIVE_MATERIAL && this.hasFrameless)
                        this.executeDwm(PARAMS.MARGIN, 0);

                    if (this.forceFocus)
                        this.executeDwm(PARAMS.FRAME, 5);
                } catch (e) {
                    clearInterval(this.marginTimer);
                    this.marginTimer = null;
                }
            }, 16);
    }

    /**
     * Focus on the window all the time so as not to lose the mica effect (decrease performance)
     * @param {Boolean} enable 
     */
    alwaysFocused(enable) {
        this.forceFocus = enable;

        if (this.hasMargin)
            this.enableMargin();
    }

    /**
     * Apply MicaEffect (only windows 11)
     */
    setMicaEffect() {
        if (!WINDOWS_11) return;
        this.disableUser32();
        this.enableMargin();
        this.executeDwm(PARAMS.BACKGROUND.MICA, this.theme);
    }

    /**
     * Apply MicaTabbed Effect (only windows 11)
     */
    setMicaTabbedEffect() {
        if (!WINDOWS_11) return;
        this.disableUser32();
        this.enableMargin();
        this.executeDwm(PARAMS.BACKGROUND.TABBED_MICA, this.theme);
    }

    /**
     * Apply Acrylic Effect (only windows 11)
     */
    setMicaAcrylicEffect() {
        if (!WINDOWS_11) return;
        this.disableUser32();
        this.enableMargin();
        this.executeDwm(PARAMS.BACKGROUND.ACRYLIC, this.theme);
    }

    /**
     * Apply dark theme to the electron app
     */
    setDarkTheme() {
        this.theme = VALUE.THEME.DARK;
        electron.nativeTheme.themeSource = 'dark';
        if (WINDOWS_11)
            this.executeDwm(this.effect, VALUE.THEME.DARK);
    }

    /**
     * Apply light theme to the electron app
     */
    setLightTheme() {
        this.theme = VALUE.THEME.LIGHT;
        electron.nativeTheme.themeSource = 'light';
        if (WINDOWS_11)
            this.executeDwm(this.effect, VALUE.THEME.LIGHT);
    }

    /**
    * Apply auto detection theme to the electron app
    */
    setAutoTheme() {
        this.theme = VALUE.THEME.AUTO;
        electron.nativeTheme.themeSource = 'system';
        if (WINDOWS_11)
            this.executeDwm(this.effect, VALUE.THEME.AUTO);
    }

    /**
    * Apply rounded corner to the electron app
    */
    setRoundedCorner() {
        this.executeDwm(PARAMS.CORNER, VALUE.CORNER.ROUND);
    }

    /**
    * Apply rounded corner to the electron app
    */
    setSmallRoundedCorner() {
        this.executeDwm(PARAMS.CORNER, VALUE.CORNER.ROUNDSMALL);
    }

    /**
    * Apply square corner to the electron app
    */
    setSquareCorner() {
        this.executeDwm(PARAMS.CORNER, VALUE.CORNER.DONOTROUND);
    }

    /**
    * Set border color to the electron app
    * @param  {String} color HTML color (#RRGGBB, #RGB, or rgb(r, g, b))
    */
    setBorderColor(color) {
        if (color != null) {
            color = getColorByString(color);
            this.executeDwm(PARAMS.BORDER_COLOR, color);
        }
        else
            this.executeDwm(PARAMS.BORDER_COLOR, 0xFFFFFFFF);
    }

    /**
    * Set caption color to the electron app
    * @param  {String} color HTML color (#RRGGBB, #RGB, or rgb(r, g, b))
    */
    setCaptionColor(color) {
        if (color != null) {
            color = getColorByString(color);
            this.executeDwm(PARAMS.CAPTION_COLOR, color);
        }
        else
            this.executeDwm(PARAMS.CAPTION_COLOR, 0xFFFFFFFF);
    }

    /**
    * Set title text color to the electron app
    * @param  {String} color HTML color (#RRGGBB, #RGB, or rgb(r, g, b))
    */
    setTitleTextColor(color) {
        if (color != null) {
            color = getColorByString(color);
            this.executeDwm(PARAMS.TEXT_COLOR, color);
        }
        else
            this.executeDwm(PARAMS.TEXT_COLOR, 0xFFFFFFFF);
    }

    /**
    * Apply transparent Effect (windows 7+)
    */
    setTransparent() {
        if (WINDOWS_11)
            this.disableDWM();
        this.executeUser32(WIN10.TRANSPARENT, 0x00ffffff);
    }

    /**
    * Apply blur Effect (windows 7+)
    */
    setBlur() {
        if (WINDOWS_11)
            this.disableDWM();
        this.executeUser32(WIN10.BLURBEHIND, 0x00ffffff);
    }

    /**
    * Apply Acrylic Effect (windows 7+)
    */
    setAcrylic() {
        if (WINDOWS_11)
            this.disableDWM();
        this.executeUser32(WIN10.ACRYLIC, 0x00909090);
    }

    /**
     * Apply custom effect of SetWindowCompositionAttribute (windows 7+)
     * @param {Number} nAccentState 
     * @param {String} color HTML color
     * @param {Number} a Alpha intensity (0 < a < 1)
     */
    setCustomEffect(nAccentState, color, a) {
        if (!Object.values(WIN10).includes(nAccentState))
            throw new RangeError('Unknown Windows 10 effect.');
        if (!Number.isFinite(a))
            throw new TypeError('Alpha must be a finite number.');
        const colorToInt = getColorByString(color);
        if (WINDOWS_11)
            this.disableDWM();

        a = Math.min(Math.max(Math.round(a * 255), 0), 255);
        this.executeUser32(nAccentState, (a << 24) + colorToInt);
    }

    /**
    * Disable windows 10 effect
    */
    disableUser32() {
        if (!this.useDWM)
            this.executeUser32(0, 0xffffffff);
        this.useDWM = true;
    }

    /**
    * Disable windows 11 effect
    */
    disableDWM() {
        if (this.useDWM)
            this.executeDwm(PARAMS.BACKGROUND.NONE, this.theme);
        this.disableMargin();
        this.useDWM = false;
    }

    /**
     * Execute function 'DwmSetWindowAttribute' from dwmapi.dll
     * @param  {Number} params ID of the dwAttribute
     * @param  {Number} value New value for the params
     */
    executeDwm(params, value) {
        if (!IS_WINDOWS || this.isDestroyed()) return;
        if (!WINDOWS_11 && params !== PARAMS.FRAME) return;
        if (params >= 0 && params <= 4 && HAS_NATIVE_MATERIAL) {
            this.setBackgroundMaterial(['auto', 'none', 'mica', 'acrylic', 'tabbed'][params]);
            // Preserve the low-level API's explicit theme argument as well.
            if (executeDwm)
                executeDwm(this.getNativeWindowHandle().readUInt32LE(), params, value);
            this.effect = params;
            this.theme = value;
            return;
        }
        if (executeDwm) {
            const HWND = this.getNativeWindowHandle().readUInt32LE();
            executeDwm(HWND, params, value);

            if (params >= 0 && params <= 4) {
                this.effect = params;
                this.theme = value;
            }
        }
    }

    /**
     * Execute function 'SetWindowCompositionAttribute' from user32.dll
     * @param  {Number} params ID of the dwAttribute
     * @param  {Number} value New value for the params
     */
    executeUser32(params, value) {
        this._user32Effect = { params, value };
        this._applyUser32(this._inSizeMove && params === WIN10.ACRYLIC ? WIN10.BLURBEHIND : params, value);
    }

    _applyUser32(params, value) {
        if (executeUser32 && !this.isDestroyed()) {
            const HWND = this.getNativeWindowHandle().readUInt32LE();
            executeUser32(HWND, params, value);
        }
    }

}

module.exports = {
    PARAMS: PARAMS,
    VALUE: VALUE,
    MicaBrowserWindow: BrowserWindow,
    IS_WINDOWS_11: WINDOWS_11,
    WIN10: WIN10
};
