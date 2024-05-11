<h1 align=center>Mica Electron</h1>
<div align=center>
<img src="https://micadiscord.com/img/preview/title.png" name="exemple">

<b>Mica Electron</b> is a tool to add mica effect on electron app.<br>
This is created by <a href="https://www.youtube.com/gregvido">GregVido</a>.<br>
<b>Mica electron is now compatible with windows 10</b>
</div>

<details>
  <summary>Exemple of effects</summary>
  <div align=center>
	<img src="https://micadiscord.com/img/preview/demo-1.png" name="demo 0" width="30%">
	<img src="https://micadiscord.com/img/preview/demo-2.png" name="demo 1" width="30%">
	<img src="https://micadiscord.com/img/preview/demo-3.png" name="demo 2" width="30%"> 

  
  <a href='https://micadiscord.com/img/mica-electron-preview.gif'>Click here to see the animation preview.</a>
  </div> 
</details><br> 

## Quickstart
```bash
$ npm install mica-electron
```
```js
const electron = require('electron');
const { PARAMS, VALUE,  MicaBrowserWindow, IS_WINDOWS_11, WIN10 } = require('mica-electron');
const path = require('path');

electron.app.on('ready', () => {
    const win = new MicaBrowserWindow({
        width: 800,
        height: 600,
        autoHideMenuBar: true,
        show: false,
        // frame: false // -> now work, you can remove the frame properly !!
    });

    win.setDarkTheme();
    win.setMicaEffect();

    // win.alwaysFocused(true); // -> allows you to keep the mica effects even if the window is no focus (decrease performance)

    win.loadFile(path.join(__dirname, 'files', 'index.html'));

    win.webContents.once('dom-ready', () => {
        win.show();
    });
});
```

<details>
  <summary>Apply effect for windows 11</summary>
    You can apply different mica effect :

```js
win.setMicaEffect();        // Mica Effect
win.setMicaTabbedEffect();  // Mica Tabbed
win.setMicaAcrylicEffect(); // Acrylic for windows 11
```
<div align=center>
<img src="https://micadiscord.com/img/preview/demo-1.png" name="corner 0" width="20%">
<img src="https://micadiscord.com/img/preview/demo-2.png" name="corner 1" width="20%">
<img src="https://micadiscord.com/img/preview/demo-3.png" name="corner 2" width="20%"> 
</div>
</details>

<details>
  <summary>Change theme for windows 11</summary>
  You can change theme :

```js
win.setAutoTheme();   // Same theme as computer
win.setLightTheme();  // Force light theme
win.setDarkTheme();   // Force dark theme
```
</details>

<details>
  <summary>Apply effect for windows 10</summary>
  You can apply different blur effect :

```js
win.setTransparent(); // Transparent window
win.setBlur();        // Blurred window
win.setAcrylic();     // Acrylic window
```
</details>

<details>
  <summary>Change radius</summary>
    You can change corner radius :

```js
win.setRoundedCorner();	      // Rounded
win.setSmallRoundedCorner();  // Small rounded
win.setSquareCorner();	      // Square
```
<div align=center>
<img src="https://micadiscord.com/img/preview/corner-1.png" name="corner 0" width="10%">
<img src="https://micadiscord.com/img/preview/corner-2.png" name="corner 1" width="10%">
<img src="https://micadiscord.com/img/preview/corner-3.png" name="corner 2" width="10%"> 
</div>
</details>

<details>
  <summary>Change window colors</summary>
    You can change window colors :

```js
win.setBorderColor('#f40b0b');  // Border color
win.setBorderColor(null); // -> disable effect

win.setCaptionColor('#262626'); // Background titlebar color
win.setCaptionColor(null); // -> disable effect

win.setTitleTextColor('#fff');  // Title text color
win.setTitleTextColor(null); // -> disable effect
```
<div align=center>
<img src="https://micadiscord.com/img/preview/border.png" name="border" width="50%">
</div>
</details>

<details>
  <summary>Change custom transparent effect for windows 10 <b>NEW!</b></summary>
    You can change window colors :

```js
win.setCustomEffect(WIN10.TRANSPARENT, '#34ebc0', 0.5); // Transparent
win.setCustomEffect(WIN10.ACRYLIC, '#34ebc0', 0.4); // Acrylic
```
<div align=center>
<img src="https://micadiscord.com/img/mica-electron-custom-exemple.png" name="border" width="40%">
<img src="https://micadiscord.com/img/mica-electron-custom-blur-exemple.png" name="border" width="40%">
</div>
</details>

<br>


## Source Install / Manual Compilation
To compile from source it's easiest to use
[`node-gyp`](https://github.com/TooTallNate/node-gyp):

``` bash
$ npm install -g node-gyp
```

Now you can compile `mica-electron`:

``` bash
$ cd .\node_modules\mica-electron\
$ ./build.bat
```
## Objects details
<details>
  <summary>PARAMS Object</summary>
  The params is a number, you can has an object to help you:

```js
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
```
</details>

<details>
  <summary>VALUE Object</summary>
The value is a number, you can has an object to help you:

```js
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
```
</details>

<details>
  <summary>IS_WINDOWS_11</summary>
IS_WINDOWS_11 is a boolean constant to detect the OS version. If it is true then it's a windows 11 computer, otherwise it is another version (10, 8, 7 ...)
</details>

<details>
  <summary>WIN10 Object</summary>
The value is a number, you can has an object to help you:

```js
const WIN10 = {
    TRANSPARENT: 2,
    BLURBEHIND: 3, // didn't work on windows 11
    ACRYLIC: 4
}
```
</details><br>

## FAQ
<details>
  <summary>Error: '...\micaElectron.node' was compiled against a different Node.js version using ...</summary>
  If you are an error of nodejs version, use electron-packager to rebuild the project with the good version.

  ```bash
  $ npm install electron
  $ npm install electron-rebuild
  $ .\node_modules\.bin\electron-rebuild
  ```
</details>
<details>
  <summary>Build for 32 bits ?</summary>

  If you want use `mica-electron` with 32 bits electron app, rebuild C++ script

``` bash
$ cd .\node_modules\mica-electron\
$ node-gyp rebuild --arch=ia32
$ cd ..\..\
$ .\node_modules\.bin\electron-rebuild --arch=ia32
```
</details>
<br>

## Awesome applications using Mica-Electron

- [MicaDiscord](https://www.micadiscord.com/) by GregVido and Arbitro
- [Cider](https://github.com/ciderapp/Cider) by [Cider Collective](https://github.com/ciderapp)
- [Fluent Browser](https://github.com/ThePiGuy3141/fluent-browser) by <a href="https://github.com/ThePiGuy3141">ThePiGuy3141</a>
- [Mica-Snap](https://github.com/GregVido/Mica-Snap) by GregVido
- [SysMocap](https://github.com/xianfei/SysMocap) by [xianfei](https://github.com/xianfei)