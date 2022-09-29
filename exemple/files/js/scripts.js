const { ipcRenderer } = require('electron');

const darkTheme = document.createElement('link');
darkTheme.rel = 'stylesheet';
darkTheme.href = 'css/dark.css';

function setTheme(theme) {
    ipcRenderer.send('theme', theme);

    if(theme == 'dark')
        document.head.appendChild(darkTheme);

    else
        document.head.removeChild(darkTheme);
}

function setEffect(effect) {
    ipcRenderer.send('effect', effect);
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
    document.head[event.matches ? 'appendChild' : 'removeChild'](darkTheme);
});