const { app, BrowserWindow } = require('electron');
const execFile = require("child_process").execFileSync;

const TRANSPARENT = {
    DWMSBT_AUTO: 0,
	DWMSBT_NONE: 1,
	DWMSBT_MAINWINDOW: 2,		// mica
	DWMSBT_TRANSIENTWINDOW: 3, // acrylic
	DWMSBT_TABBEDWINDOW: 4		// mica tabbed
}

app.commandLine.appendSwitch("enable-transparent-visuals");
app.on('ready', () => {
    const win = new BrowserWindow({
        width: 600,
        height: 180,
        transparent: true,
        show: false,
        autoHideMenuBar: true
    });

    const HWND = win.getNativeWindowHandle()["readInt32LE"]();
    execFile('dwm_exec.exe', [HWND, TRANSPARENT.DWMSBT_MAINWINDOW]);

    win.loadFile('exemple/index.html');

    win.webContents.once('dom-ready', () => {
        win.show();
    });

});
