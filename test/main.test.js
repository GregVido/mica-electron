'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { EventEmitter } = require('node:events');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8');

function load({ platform = 'win32', release = '10.0.22621', version = '33.2.1', native = true } = {}) {
    const calls = [];
    const timers = new Map();
    let nextTimer = 0;
    class BrowserWindow extends EventEmitter {
        constructor(options) {
            super();
            this.options = options;
            this.visible = options.show !== false;
            this.destroyed = false;
            this.minimized = false;
            this.messages = new Map();
        }
        getNativeWindowHandle() {
            assert.equal(this.destroyed, false, 'must not access a destroyed HWND');
            const handle = Buffer.alloc(8);
            handle.writeUInt32LE(0xf1234567);
            return handle;
        }
        getBounds() { return { x: -500, y: 100, width: 800, height: 600 }; }
        isDestroyed() { return this.destroyed; }
        isMinimized() { return this.minimized; }
        isVisible() { return this.visible; }
        setBackgroundMaterial(value) { calls.push(['material', value]); }
        hookWindowMessage(message, callback) { this.messages.set(message, callback); }
        show() { this.visible = true; this.emit('show'); }
        hide() { this.visible = false; calls.push(['hide']); }
        destroy() { this.destroyed = true; this.emit('closed'); }
    }
    const electron = {
        BrowserWindow,
        app: { commandLine: { appendSwitch: value => calls.push(['switch', value]) } },
        nativeTheme: {},
        screen: { dipToScreenRect: (win, bounds) => Object.fromEntries(
            Object.entries(bounds).map(([key, value]) => [key, value * 1.5])) }
    };
    const addon = Object.fromEntries(['executeDwm', 'executeUser32', 'redraw'].map(name =>
        [name, (...args) => calls.push([name, ...args])]));
    const addTimer = (callback, delay, interval) => {
        const id = ++nextTimer;
        timers.set(id, { callback, delay, interval });
        return id;
    };
    const context = {
        module: { exports: {} }, __dirname: path.resolve(__dirname, '..'),
        process: { platform, arch: 'x64', versions: { electron: version } },
        console: { log() {} },
        require(name) {
            if (name === 'electron') return electron;
            if (name === 'os') return { release: () => release };
            if (name === 'fs') return { existsSync: () => native };
            if (name === 'path') return path;
            return addon;
        },
        setTimeout: (cb, delay) => addTimer(cb, delay, false),
        setInterval: (cb, delay) => addTimer(cb, delay, true),
        clearTimeout: id => timers.delete(id),
        clearInterval: id => timers.delete(id)
    };
    vm.runInNewContext(source, context);
    return { ...context.module.exports, electron, calls, timers,
        tick() {
            for (const [id, timer] of [...timers]) {
                if (!timer.interval) timers.delete(id);
                timer.callback();
            }
        }
    };
}

test('preserves frozen options and webPreferences, including experimentalFeatures (#43)', () => {
    const env = load();
    const webPreferences = Object.freeze({ experimentalFeatures: true, preload: 'preload.js', sandbox: false });
    const options = Object.freeze({ width: 900, frame: false, show: false, webPreferences });
    const win = new env.MicaBrowserWindow(options);
    assert.equal(win.options.webPreferences, webPreferences);
    assert.equal(win.options.width, 900);
    assert.equal(win.options.transparent, undefined);
    assert.equal(options.backgroundColor, undefined);
    assert.doesNotThrow(() => new env.MicaBrowserWindow());
});

test('detects Windows 11 numerically and excludes other platforms', () => {
    for (const [platform, release, expected] of [
        ['win32', '10.0.22000', true], ['win32', '10.0.19045', false],
        ['win32', '6.1.7601', false], ['linux', '6.8.99999', false],
        ['darwin', '24.0.0', false]
    ]) assert.equal(load({ platform, release }).IS_WINDOWS_11, expected);
});

test('uses native materials across Electron 28, 40 and later without forced transparency (#29, #36, #37)', () => {
    for (const version of ['28.0.0', '33.2.1', '40.1.0', '41.0.0', '100.0.0']) {
        const env = load({ version });
        const win = new env.MicaBrowserWindow({ frame: false });
        win.setMicaEffect();
        win.setMicaTabbedEffect();
        win.setMicaAcrylicEffect();
        assert.deepEqual(env.calls.filter(call => call[0] === 'material').map(call => call[1]),
            ['mica', 'tabbed', 'acrylic']);
        assert.equal(win.options.transparent, undefined);
        assert.equal(env.timers.size, 0);
        assert.equal(env.calls.some(call => call[0] === 'redraw' || call[2] === env.PARAMS.FRAME), false);
    }
});

test('show, maximize and restore do not hide or resize a modern window (#39, #25)', () => {
    const env = load();
    const win = new env.MicaBrowserWindow({ show: false });
    win.setMicaEffect();
    win.show();
    win.emit('maximize');
    win.emit('restore');
    assert.equal(env.calls.some(call => ['hide', 'redraw'].includes(call[0])), false);
    assert.equal(env.timers.size, 0);
    assert.equal(win.effect, env.PARAMS.BACKGROUND.MICA);
});

test('legacy frame refresh converts DIP coordinates and initializes once (#25)', () => {
    const env = load({ version: '27.0.0' });
    const win = new env.MicaBrowserWindow({ show: false, frame: false });
    win.show();
    win.emit('restore');
    const redraws = env.calls.filter(call => call[0] === 'redraw');
    assert.deepEqual(redraws, [['redraw', 0xf1234567, -750, 150, 1200, 900]]);
    assert.equal(env.calls.filter(call => call[0] === 'executeDwm' && call[2] === env.PARAMS.FRAME && call[3] === 2).length, 1);
    assert.equal(env.calls.some(call => call[0] === 'hide'), false);
});

test('legacy workaround does not force resize/maximize on fixed windows', () => {
    const env = load({ version: '27.0.0' });
    new env.MicaBrowserWindow({ resizable: false, maximizable: false });
    assert.equal(env.calls.some(call => call[0] === 'executeDwm' && call[2] === env.PARAMS.FRAME && call[3] === 1), false);
});

test('Windows 10 themes and unsupported Windows 11 effects never invoke Windows 11 attributes (#38, #40)', () => {
    const env = load({ release: '10.0.19045' });
    const win = new env.MicaBrowserWindow({ show: false });
    win.setAcrylic();
    win.setAutoTheme(); win.setDarkTheme(); win.setLightTheme();
    win.setRoundedCorner(); win.setBorderColor(null);
    win.setMicaEffect(); win.setMicaTabbedEffect(); win.setMicaAcrylicEffect();
    win.enableMargin();
    win.show();
    assert.equal(win.theme, env.VALUE.THEME.LIGHT);
    assert.equal(env.calls.filter(call => call[0] === 'executeDwm').every(call => call[2] === env.PARAMS.FRAME), true);
    assert.equal(env.timers.size, 0);
});

test('Windows 10 acrylic switches to blur only during sizing and restores tint (#28)', () => {
    const env = load({ release: '10.0.19045' });
    const win = new env.MicaBrowserWindow({ show: false });
    win.setCustomEffect(env.WIN10.ACRYLIC, '#123456', 0.5);
    win.messages.get(0x0231)();
    win.messages.get(0x0232)();
    const calls = env.calls.filter(call => call[0] === 'executeUser32');
    assert.deepEqual(calls.map(call => call[2]), [4, 3, 4]);
    assert.equal(calls[0][3], calls[1][3]);
    assert.equal(calls[0][3], calls[2][3]);
    win.messages.get(0x0231)();
    win.setTransparent();
    win.messages.get(0x0232)();
    assert.equal(env.calls.at(-1)[2], env.WIN10.TRANSPARENT);
});

test('resize refresh is debounced; destruction clears all timers but canceled close does not', () => {
    const env = load({ version: '27.0.0' });
    const win = new env.MicaBrowserWindow({ show: false, frame: false });
    win.setMicaEffect(); win.alwaysFocused(true);
    for (let i = 0; i < 100; i++) win.emit('resize');
    assert.equal(env.timers.size, 2);
    win.emit('close', { preventDefault() {} });
    assert.equal(env.timers.size, 2);
    win.destroy();
    assert.equal(env.timers.size, 0);
    assert.doesNotThrow(() => { env.tick(); win.setMicaEffect(); win.emit('restore'); });
});

test('focus timer is throttled and skips hidden/minimized windows', () => {
    const env = load();
    const win = new env.MicaBrowserWindow({ show: false });
    win.setMicaEffect(); win.alwaysFocused(true);
    assert.equal([...env.timers.values()][0].delay, 16);
    env.calls.length = 0;
    env.tick();
    assert.equal(env.calls.length, 0);
    win.show();
    env.calls.length = 0;
    win.minimized = true;
    env.tick();
    assert.equal(env.calls.length, 0);
    win.alwaysFocused(false);
    assert.equal(env.timers.size, 0);
});

test('non-Windows windows preserve appearance and do not load or call native code', () => {
    const env = load({ platform: 'linux', release: '6.8.99999' });
    const win = new env.MicaBrowserWindow({ backgroundColor: '#123456', transparent: true });
    win.setMicaEffect(); win.setAcrylic(); win.setDarkTheme(); win.alwaysFocused(true);
    assert.equal(win.options.backgroundColor, '#123456');
    assert.equal(win.options.transparent, true);
    assert.equal(env.calls.length, 0);
    assert.equal(env.timers.size, 0);
});

test('missing native binary still permits Electron native materials without timers', () => {
    const env = load({ native: false });
    const win = new env.MicaBrowserWindow({ frame: false });
    win.setMicaEffect(); win.alwaysFocused(true);
    assert.deepEqual(env.calls, [['material', 'mica']]);
    assert.equal(env.timers.size, 0);
});

test('color resets and supported formats produce correct COLORREF values', () => {
    const env = load();
    const win = new env.MicaBrowserWindow({ show: false });
    for (const color of ['#123', '#112233', 'rgb(17, 34, 51)', 'RGB(17, 34, 51)', '112233ff']) {
        win.setBorderColor(color);
        assert.equal(env.calls.at(-1)[3], 0x332211);
    }
    for (const method of ['setBorderColor', 'setCaptionColor', 'setTitleTextColor']) {
        win[method](null);
        assert.equal(env.calls.at(-1)[3], 0xffffffff);
    }
    for (const color of ['#zzzzzz', 'rgb(256, 0, 0)', 'rgb(1,2)', 123])
        assert.throws(() => win.setCaptionColor(color));
    assert.throws(() => win.setCustomEffect(4, '#fff', NaN));
    assert.throws(() => win.setCustomEffect(99, '#fff', 0.5));
});

test('changing theme preserves a material supplied in constructor options', () => {
    const env = load();
    const win = new env.MicaBrowserWindow({ backgroundMaterial: 'mica', show: false });
    win.setLightTheme();
    win.show();
    assert.equal(win.effect, env.PARAMS.BACKGROUND.MICA);
    assert.equal(win.useDWM, true);
    assert.equal(env.calls.filter(call => call[0] === 'material').every(call => call[1] === 'mica'), true);
});
