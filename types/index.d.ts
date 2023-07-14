import "electron";

declare module "mica-electron" {
    // TODO: rework CSS colors
    // type HexColor = `#${string}`;
    // type RGBColor = `rgb(${number}, ${number}, ${number})`;
    // type CSSColor = string;

    export class MicaBrowserWindow extends Electron.BrowserWindow {
        /**
         * Current theme value, represented by an integer
         */
        public theme: number;
        /**
         * Current effect value, represented by an integer
         */
        public effect: number;
        /**
         * Shows whether this window is using DWM or User32
         */
        public useDWM: boolean;
        /**
         * Shows whether this window is frameless
         */
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
         * Apply the Mica effect (Windows 11 only)
         */
        public setMicaEffect(): void;

        /**
         * Apply the Tabbed Mica effect (Windows 11 only)
         */
        public setMicaTabbedEffect(): void
        /**
         * Apply the Acrylic effect (Windows 11 only)
         */
        public setMicaAcrylicEffect(): void;

        /**
         * Change theme to dark
         */
        public setDarkTheme(): void;

        /**
         * Change theme to light
         */
        public setLightTheme(): void;

        /**
        * Make theme automatically adapt to the system
        */
        public setAutoTheme(): void;

        /**
        * Set corner radius to normal (Windows 11 only)
        */
        public setRoundedCorner(): void;

        /**
        * Set corner radius to small (Windows 11 only)
        */
        public setSmallRoundedCorner(): void;

        /**
        * Set corner radius to 0 (Windows 11 only)
        */
        public setSquareCorner(): void;

        /**
        * Change window's border color
        */
        public setBorderColor(color: string): void;

        /**
        * Change window's titlebar color
        */
        public setCaptionColor(color: string): void;

        /**
        * Change window's title text color
        */
        public setTitleTextColor(color: string): void;

        /**
        * Apply the Transparent Effect (Windows 7+)
        */
        public setTransparent(): void;

        /**
        * Apply the Blur Effect (Windows 7+)
        */
        public setBlur(): void;

        /**
        * Apply the Acrylic Effect (Windows 7+)
        */
        public setAcrylic(): void;

        /**
         * Apply a custom effect of SetWindowCompositionAttribute (Windows 7+)
         */
        public setCustomEffect(nAccentState: number, color: string, alpha: number): void;

        /**
        * Disables support for Windows 10 effects (Acrylic and Blur)
        */
        public disableUser32(): void;

        /**
        * Disables support for Windows 11 effects (Mica and Acrylic)
        */
        public disableDWM(): void;

        /**
         * Executes the `DwmSetWindowAttribute` function from `dwmapi.dll`
         */
        public executeDwm(params: number, value: number): void;

        /**
         * Executes the `SetWindowCompositionAttribute` function from `user32.dll`
         */
        public executeUser32(params: number, value: number): void;
    }

    /**
     * Shows if the machine is running Windows 11
     */
    export const IS_WINDOWS_11: boolean;
    /**
     * Values specifying several window properties
     */
    export const PARAMS: {
        /**
         * Effects configuration
         */
        BACKGROUND: {
            AUTO: 0,
            NONE: 1,
            /**
             * Acrylic Effect
             */
            ACRYLIC: 3,
            /**
             * Mica Effect
             */
            MICA: 2,
            /**
             * Mica Tabbed Effect
             */
            TABBED_MICA: 4
        },
        /**
         * Corner radius configuration
         */
        CORNER: 5,
        /**
         * Border color configuration
         */
        BORDER_COLOR: 6,
        /**
         * Titlebar color configuration
         */
        CAPTION_COLOR: 7,
        /**
         * Text color configuration
         */
        TEXT_COLOR: 8,
        FRAME: 9,
        MARGIN: 10
    };
    /**
     * Values which can be used in several effects
     */
    export const VALUE: {
        /**
         * Theme values
         */
        THEME: {
            /**
             * Automatic theme
             */
            AUTO: 5,
            /**
             * Dark theme
             */
            DARK: 1,
            /**
             * Light theme
             */
            LIGHT: 2,
        },
        /**
         * Corner radius values
         */
        CORNER: {
            /**
             * Default corners
             */
            DEFAULT: 0,
            /**
             * Square corners
             */
            DONOTROUND: 1,
            /**
             * Rounded corners
             */
            ROUND: 2,
            /**
             * Small rounded corners
             */
            ROUNDSMALL: 3
        },
        /**
         * Color values
         */
        COLOR: {
            RED: 0x000000FF,
            GREEN: 0x0000FF00,
            BLUE: 0x00FF0000,
            BLACK: 0x00000000,
            WHITE: 0x00FFFFFF,
            /**
             * Convert red, green and blue values into a single hex color
             */
            FROM_RGB: (red: number, green: number, blue: number) => number
        },
        /**
         * Falsely value
         */
        FALSE: 0,
        /**
         * Truthful value
         */
        TRUE: 1
    };
    /**
     * Windows 10 effects
     */
    export const WIN10: {
        /**
         * Transparent Effect
         */
        TRANSPARENT: 2,
        /**
         * Blur Effect
         */
        BLURBEHIND: 3,
        /**
         * Acrylic Effect
         */
        ACRYLIC: 4
    }
}
