<h1>Mica Electron</h1>

<img src="exemple/files/img/img.png" name="exemple">
<details>
  <summary>Exemple of effects</summary>
  <center>
	<img src="exemple/files/img/demo-1.png" name="demo 0" width="30%">
	<img src="exemple/files/img/demo-2.png" name="demo 1" width="30%">
	<img src="exemple/files/img/demo-3.png" name="demo 2" width="30%"> 
  </center> 
</details><br> 

<b>Mica Electron</b> is a tool to add mica effect on electron app.<br>
This is created by <a href="https://www.youtube.com/gregvido">GregVido</a>.
If you want use npm, click <a href="https://www.npmjs.com/package/mica-electron">here</a>.

<h2>How use ?</h2>
To use <b>Mica Electron</b>, you must execute the file <a href="dwm_exec.exe">dwm_exec.exe</a> with threes arguments :<br>

- HWND : the window to apply effect
- EFFECT : the type of transparency
- THEME : the color of effect

The HWND can be recover with this ligne :
```js
const HWND = win.getNativeWindowHandle()["readInt32LE"]();
```

The effect is a number, you can has an object to help you:
```js
const EFFECT = {
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
```

The params is a string, you can has an object to help you:
```js
const PARAMS = {
    THEME: {
        AUTO: 'auto',	// select theme by the windows theme
        DARK: 'dark',	// select the dark theme
        LIGHT: 'light',	// select the white theme
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
    }
}
```

You can execute the file with this code :
```js
const execFile = require("child_process").execFileSync;

execFile('dwm_exec.exe', [HWND, EFFECT.BACKGROUND.MICA, PARAMS.THEME.AUTO]);
```

You can change corner radius :
```js
executeDwm(HWND, EFFECT.CORNER, PARAMS.CORNER.ROUND);		// Rounded
executeDwm(HWND, EFFECT.CORNER, PARAMS.CORNER.ROUNDSMALL);	// Small rounded
executeDwm(HWND, EFFECT.CORNER, PARAMS.CORNER.DONOTROUND);	// Square
```

You can change window colors :
```js
executeDwm(HWND, EFFECT.BORDER_COLOR, PARAMS.COLOR.FROM_RGB(112, 4, 4));	// Border color
executeDwm(HWND, EFFECT.CAPTION_COLOR, PARAMS.COLOR.FROM_RGB(112, 4, 4));	// Background titlebar color
executeDwm(HWND, EFFECT.TEXT_COLOR, PARAMS.COLOR.WHITE);					// Title text color
```

<h3>How to remove the frame ?</h3>

You can use ffi to remove the frame with this code:

```js
const ffi = require('ffi-napi');

const user32 = new ffi.Library('user32', {
    'SetWindowPos': ['bool', ['long', 'long', 'int', 'int', 'int', 'int', 'uint']],
    'SetWindowLongA': ['long', ['long', 'int', 'long']]
});

function removeFrame(window) {
    const HWND = window.getNativeWindowHandle()["readInt32LE"]();

    const bounds = window.getBounds();

    user32.SetWindowLongA(HWND, -16, 0x00fff00); 
    user32.SetWindowPos(HWND, 0, bounds.x, bounds.y, bounds.width, bounds.height, 0x0020); 
}

const win = new BrowserWindow({
    width: 600,
    height: 360,
    backgroundColor: '#000000ff', // Transparent background
    ...
});

removeFrame(win);
```

<h2>Update 1.0.7</h2>

- Add corner option to edit it.
- Add window colors options to edit them:
	- Change border color
	- Change caption color
	- Change title color

<h2>Update 1.0.7</h2>

- Add script to remove frame
- Add typescript exemple

<h2>Update 1.0.6</h2>

- Fix exemple

<h2>Update 1.0.5</h2>

- Fix frameless (you can now resize the window)

<h2>Update 1.0.4</h2>

- Fix dll missing
- Fix windows 11 old version

<h2>Update 1.0.3</h2>

- Add theme in arguments

<h2>Update 1.0.2</h2>

- Enable auto dark mod
- Detect if operating system is windows 11

## Awesome applications using Mica-Electron

- [MicaDiscord](https://www.micadiscord.com/) by GregVido and Arbitro