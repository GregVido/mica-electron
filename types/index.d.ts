declare module "mica-electron" {
    import { BrowserWindow } from "electron";

    // type HexColor = `#${string}`;
    // type RGBColor = `rgb(${number}, ${number}, ${number})`;
    type CSSColor = string;

    export class MicaBrowserWindow extends BrowserWindow {
        public theme: number;
        public effect: number;
        public useDWM: boolean;
        public hasFrameless: boolean;


        /**
         * Disable transparent for mica effect
         */
        public disableMargin(): void;

        /**
         * Enable transparent for mica effect
         */
        public enableMargin(): void;

        /**
         * Apply MicaEffect (only windows 11)
         */
        public setMicaEffect(): void;

        /**
         * Apply MicaTabbed Effect (only windows 11)
         */
        public setMicaTabbedEffect(): void
        /**
         * Apply Acrylic Effect (only windows 11)
         */
        public setMicaAcrylicEffect(): void;

        /**
         * Apply dark theme to the electron app
         */
        public setDarkTheme(): void;

        /**
         * Apply light theme to the electron app
         */
        public setLightTheme(): void;

        /**
        * Apply auto detection theme to the electron app
        */
        public setAutoTheme(): void;

        /**
        * Apply rounded corner to the electron app
        */
        public setRoundedCorner(): void;

        /**
        * Apply rounded corner to the electron app
        */
        public setSmallRoundedCorner(): void;

        /**
        * Apply square corner to the electron app
        */
        public setSquareCorner(): void;

        /**
        * Set border color to the electron app
        */
        public setBorderColor(color: CSSColor): void;

        /**
        * Set caption color to the electron app
        */
        public setCaptionColor(color: CSSColor): void;

        /**
        * Set title text color to the electron app
        */
        public setTitleTextColor(color: CSSColor): void;

        /**
        * Apply transparent Effect (windows 7+)
        */
        public setTransparent(): void;

        /**
        * Apply blur Effect (windows 7+)
        */
        public setBlur(): void;

        /**
        * Apply Acrylic Effect (windows 7+)
        */
        public setAcrylic(): void;

        /**
         * Apply custom effect of SetWindowCompositionAttribute (windows 7+)
         */
        public setCustomEffect(nAccentState: number, color: CSSColor, alpha: number): void;

        /**
        * Disable windows 10 effect
        */
        public disableUser32(): void;

        /**
        * Disable windows 11 effect
        */
        public disableDWM(): void;

        /**
         * Execute function 'DwmSetWindowAttribute' from dwmapi.dll
         */
        public executeDwm(params: number, value: number): void;

        /**
         * Execute function 'SetWindowCompositionAttribute' from user32.dll
         */
        public executeUser32(params: number, value: number): void;
    }

    export const IS_WINDOWS_11: boolean;
    export const PARAMS: {
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
    };
    export const VALUE: {
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
            FROM_RGB: (r: number, g: number, b: number) => number
        },
        FALSE: 0,
        TRUE: 1
    };
    export const WIN10: {
        TRANSPARENT: 2,
        BLURBEHIND: 3,
        ACRYLIC: 4
    }
}