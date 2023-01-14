/*
Copyright 2022 GregVido

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
const { executeDwm, redraw, executeUser32 } = require('./build/Release/micaElectron');
const os = require('os');

electron.app.commandLine.appendSwitch("enable-transparent-visuals");

function isWin11() {
    const version = os.release().split('.');
    if (version.length == 3)
        return version[2] >= '22000';
    return false;
}

/**
 * Remove a frame from a window
 * @param  {BrowserWindow} window Target to remove frame
 */
function removeFrame(window) {
    const HWND = window.getNativeWindowHandle()["readInt32LE"]();

    const bounds = window.getBounds();

    // executeDwm(HWND, PARAMS.FRAME, VALUE.FALSE);
    redraw(HWND, bounds.x, bounds.y, bounds.width, bounds.height);
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
    FRAME: 9
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

/**
 * Convert HTML color to windows color
 * @param  {Number} str HTML color
 * @return {Number}     windows color (int, 24 bits)
 */
let getColorByString = (str) => {
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

        return VALUE.COLOR.FROM_RGB(r, g, b);
    }
}

class BrowserWindow extends electron.BrowserWindow {

    effect = PARAMS.BACKGROUND.AUTO;
    theme = VALUE.THEME.AUTO;

    useDWM = false;

    constructor(...args) {
        if (args.length > 0) {
            args[0].transparent = false;
            args[0].backgroundColor = '#00ffffff';
        } else
            args.push({
                backgroundColor: '#00ffffff'
            });

        super(...args);

        const needDeleteframe = args[0].frame === false || args[0].titleBarStyle == 'hidden';

        let applyEffect = () => {
            if (args.length > 0 && this.useDWM) {
                this.executeDwm(this.effect, this.theme);
            }
        }

        let frameRemoved = true;

        this.on('show', () => {
            applyEffect();

            if (frameRemoved) {
                frameRemoved = false;

                if (needDeleteframe) {
                    this.hide();
                    removeFrame(this);
                    this.show();
                }
            }
        });

        this.on('resize', () => {
            if (needDeleteframe)
                setTimeout(applyEffect, 60); // refresh effect
        });
    }

    /**
     * Apply MicaEffect (only windows 11)
     */
    setMicaEffect() {
        this.disableUser32();
        this.executeDwm(PARAMS.BACKGROUND.MICA, this.theme);
    }

    /**
     * Apply MicaTabbed Effect (only windows 11)
     */
    setMicaTabbedEffect() {
        this.disableUser32();
        this.executeDwm(PARAMS.BACKGROUND.TABBED_MICA, this.theme);
    }

    /**
     * Apply Acrylic Effect (only windows 11)
     */
    setMicaAcrylicEffect() {
        this.disableUser32();
        this.executeDwm(PARAMS.BACKGROUND.ACRYLIC, this.theme);
    }

    /**
     * Apply dark theme to the electron app
     */
    setDarkTheme() {
        this.executeDwm(this.effect, VALUE.THEME.DARK);
    }

    /**
     * Apply light theme to the electron app
     */
    setLightTheme() {
        this.executeDwm(this.effect, VALUE.THEME.LIGHT);
    }

    /**
    * Apply auto detection theme to the electron app
    */
    setAutoTheme() {
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
    * @param  {Number} color HTML color (#RRGGBB, #RGB, ou rgb(r, g, b))
    */
    setBorderColor(color) {
        color = getColorByString(color);
        this.executeDwm(PARAMS.BORDER_COLOR, color);
    }

    /**
    * Set caption color to the electron app
    * @param  {Number} color HTML color (#RRGGBB, #RGB, ou rgb(r, g, b))
    */
    setCaptionColor(color) {
        color = getColorByString(color);
        this.executeDwm(PARAMS.CAPTION_COLOR, color);
    }

    /**
    * Set title text color to the electron app
    * @param  {Number} color HTML color (#RRGGBB, #RGB, ou rgb(r, g, b))
    */
    setTitleTextColor(color) {
        color = getColorByString(color);
        this.executeDwm(PARAMS.TEXT_COLOR, color);
    }

    /**
    * Apply transparent Effect (windows 7+)
    */
    setTransparent() {
        this.disableDWM();
        this.executeUser32(2, 0x00ffffff);
    }

    /**
    * Apply blur Effect (windows 7+)
    */
    setBlur() {
        this.disableDWM();
        this.executeUser32(3, 0x00ffffff);
    }

    /**
    * Apply Acrylic Effect (windows 7+)
    */
    setAcrylic() {
        this.disableDWM();
        this.executeUser32(4, 0x00909090);
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
        this.useDWM = false;
    }

    /**
     * Execute function 'DwmSetWindowAttribute' from dwmapi.dll
     * @param  {Number} params ID of the dwAttribute
     * @param  {Number} value New value for the params
     */
    executeDwm(params, value) {
        const HWND = this.getNativeWindowHandle()["readInt32LE"]();
        executeDwm(HWND, params, value);

        if (params >= 0 && params <= 4) {
            this.effect = params;
            this.theme = value;
        }
    }

    /**
     * Execute function 'SetWindowCompositionAttribute' from user32.dll
     * @param  {Number} params ID of the dwAttribute
     * @param  {Number} value New value for the params
     */
    executeUser32(params, value) {
        const HWND = this.getNativeWindowHandle()["readInt32LE"]();
        executeUser32(HWND, params, value);
    }

}

module.exports = {
    PARAMS: PARAMS,
    VALUE: VALUE,
    MicaBrowserWindow: BrowserWindow,
    IS_WINDOWS_11: isWin11()
};