const { ipcRenderer } = require('electron');

const darkTheme = document.createElement('link');
darkTheme.rel = 'stylesheet';
darkTheme.href = 'css/dark.css';

function setTheme(theme) {
    ipcRenderer.send('theme', theme);

    if (theme == 1)
        document.head.appendChild(darkTheme);

    else
        document.head.removeChild(darkTheme);
}

function setEffect(effect) {
    ipcRenderer.send('effect', effect);
}

function setParams(params, value) {
    ipcRenderer.send('params', params, value);
}

function htmlToColor(color) {
    let r = color.slice(0, 2);
    let g = color.slice(2, 4);
    let b = color.slice(4, 6);

    return parseInt("0x" + b + g + r);
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
    document.head[event.matches ? 'appendChild' : 'removeChild'](darkTheme);
});

window.onload = () => {
    const colorBorder = document.getElementById('colorBorder');
    const colorCaption = document.getElementById('colorCaption');
    const colorTitle = document.getElementById('colorTitle');

    colorBorder.addEventListener('input', () => {
        let color = htmlToColor(colorBorder.value.slice(1));

        setParams(6, color);
    });

    colorCaption.addEventListener('input', () => {
        let color = htmlToColor(colorCaption.value.slice(1));

        setParams(7, color);
    });

    colorTitle.addEventListener('input', () => {
        let color = htmlToColor(colorTitle.value.slice(1));

        setParams(8, color);
    });
}