const { app, ipcMain } = require('electron');
const { PARAMS, VALUE, MicaBrowserWindow, IS_WINDOWS_11 } = require('./main.js');
const path = require('path');

app.on('ready', () => {
    const win = new MicaBrowserWindow({
        width: 800,
        height: 600,
        autoHideMenuBar: true,
        show: false,
        // frame: false, // -> now work, you can remove the frame properly !!
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    win.loadFile(path.join(__dirname, 'files', 'index.html'));

    win.webContents.once('dom-ready', () => {
        win.show();
    });

    // Change theme
    ipcMain.on('theme', (evt, newValue) => {
        switch (newValue) {
            case VALUE.THEME.AUTO:
                win.setAutoTheme();
                break

            case VALUE.THEME.LIGHT:
                win.setLightTheme();
                break

            case VALUE.THEME.DARK:
                win.setDarkTheme();
                break
        }
    });

    // Change effect
    ipcMain.on('effect', (evt, newParams) => {
        switch (newParams) {
            case PARAMS.BACKGROUND.MICA:
                win.setMicaEffect();
                break

            case PARAMS.BACKGROUND.TABBED_MICA:
                win.setMicaTabbedEffect();
                break

            case PARAMS.BACKGROUND.ACRYLIC:
                win.setMicaAcrylicEffect();
                break

        }
    });

    // apply effect (corner, background-color, ...)
    ipcMain.on('params', (evt, params, value) => {
        switch (params) {
            case PARAMS.CORNER:
                switch (value) {
                    case VALUE.CORNER.ROUND:
                        win.setRoundedCorner();
                        break

                    case VALUE.CORNER.ROUNDSMALL:
                        win.setSmallRoundedCorner();
                        break

                    case VALUE.CORNER.DONOTROUND:
                        win.setSquareCorner();
                        break
                }
                break

            case PARAMS.BORDER_COLOR:
                win.setBorderColor(value);
                break

            case PARAMS.CAPTION_COLOR:
                win.setCaptionColor(value);
                break

            case PARAMS.TEXT_COLOR:
                win.setTitleTextColor(value);
                break

            case 10:
                switch (value) {
                    case 0:
                        win.setTransparent();
                        break

                    case 1:
                        win.setBlur();
                        break

                    case 2:
                        win.setAcrylic();
                        break
                }
                break

        }
    });
});