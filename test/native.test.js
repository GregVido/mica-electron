'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const binary = path.join(__dirname, '..', 'src', `micaElectron_${process.arch}.node`);

test('native exports reject missing or nonnumeric arguments without crashing', {
    skip: process.platform !== 'win32' || !fs.existsSync(binary)
}, () => {
    const native = require(binary);
    for (const name of ['executeDwm', 'executeUser32', 'redraw']) {
        const count = name === 'redraw' ? 5 : 3;
        const args = new Array(count).fill(0);
        for (let length = 0; length < count; length++)
            assert.throws(() => native[name](...args.slice(0, length)), /argument missing/);
        for (let index = 0; index < count; index++) {
            const invalid = args.slice();
            invalid[index] = 'invalid';
            assert.throws(() => native[name](...invalid), /must be an integer/);
        }
    }
});
