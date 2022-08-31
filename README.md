<h1>Mica Electron</h1>

<img src="exemple/img.png">

<b>Mica Electron</b> is a tool to add mica effect on electron app.<br>
This is created by <a href="https://www.youtube.com/gregvido">GregVido</a>.

<h2>How use ?</h2>
To use <b>Mica Electron</b>, you must execute the file <a href="dwm_exec.exe">dwm_exec.exe</a> with two arguments :<br>

- HWND : the window to apply effect
- EFFECT : the type of transparency

The HWND can be recover with this ligne :
```js
const HWND = win.getNativeWindowHandle()["readInt32LE"]();
```

The effect is a number, you can has an object to help you:
```js
const TRANSPARENT = {
    DWMSBT_AUTO: 0,
	DWMSBT_NONE: 1,
	DWMSBT_MAINWINDOW: 2,		// mica
	DWMSBT_TRANSIENTWINDOW: 3, // acrylic
	DWMSBT_TABBEDWINDOW: 4		// mica tabbed
}
```

You can execute the file with this code :
```js
const execFile = require("child_process").execFileSync;

execFile('dwm_exec.exe', [HWND, TRANSPARENT.DWMSBT_MAINWINDOW]);
```