<h1>Mica Electron</h1>

<img src="exemple/files/img.png">

<b>Mica Electron</b> is a tool to add mica effect on electron app.<br>
This is created by <a href="https://www.youtube.com/gregvido">GregVido</a>.

<h2>How use ?</h2>
To use <b>Mica Electron</b>, you must execute the file <a href="dwm_exec.exe">dwm_exec.exe</a> with two arguments :<br>

- HWND : the window to apply effect
- EFFECT : the type of transparency
- THEME : the color of effect

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
	DWMSBT_TRANSIENTWINDOW: 3,	// acrylic
	DWMSBT_TABBEDWINDOW: 4		// mica tabbed
}
```

The theme is a string, you can has an object to help you:
```js
const THEME = {
    AUTO: 'auto',	// select theme by the windows theme
    DARK: 'dark',	// select the dark theme
    WHITE: 'white',	// select the white theme
}
```

You can execute the file with this code :
```js
const execFile = require("child_process").execFileSync;

execFile('dwm_exec.exe', [HWND, TRANSPARENT.DWMSBT_MAINWINDOW, THEME.AUTO]);
```

<h2>Update 1.0.3</h2>

- Add theme in arguments

<h2>Update 1.0.2</h2>

- Enable auto dark mod
- Detect if operating system is windows 11