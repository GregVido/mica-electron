'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const validArgs = ['--include-arm64', '--arch=x64', '--arch=ia32', '--arch=arm64'];
if (process.platform !== 'win32' || args.some(arg => !validArgs.includes(arg))) {
    console.error('Usage (Windows): build.bat [--include-arm64 | --arch=x64 | --arch=ia32 | --arch=arm64]');
    process.exit(1);
}
const selected = args.filter(arg => arg.startsWith('--arch=')).map(arg => arg.slice(7));
const architectures = [...new Set(selected.length ? selected :
    (args.includes('--include-arm64') ? ['x64', 'ia32', 'arm64'] : ['x64', 'ia32']))];
const binding = path.join(root, 'binding.gyp');
const generatedBinding = !fs.existsSync(binding);
const staged = path.join(root, '.native-build');

try {
    if (generatedBinding) fs.copyFileSync(path.join(root, 'data'), binding);
    fs.mkdirSync(staged, { recursive: true });
    for (const arch of architectures) {
        console.log(`Building ${arch}...`);
        const result = spawnSync('node-gyp.cmd', ['rebuild', `--arch=${arch}`, '--loglevel=warn'], {
            cwd: root, stdio: 'inherit', shell: true
        });
        if (result.error) throw result.error;
        if (result.status !== 0) throw new Error(`node-gyp failed for ${arch} (exit ${result.status}).`);
        fs.copyFileSync(path.join(root, 'build', 'Release', 'micaElectron.node'),
            path.join(staged, `micaElectron_${arch}.node`));
    }
    // Keep shipped binaries intact if any compilation fails.
    fs.mkdirSync(path.join(root, 'src'), { recursive: true });
    for (const arch of architectures) {
        fs.copyFileSync(path.join(staged, `micaElectron_${arch}.node`),
            path.join(root, 'src', `micaElectron_${arch}.node`));
    }
    console.log(`Build completed: ${architectures.join(', ')}.`);
} catch (error) {
    console.error(error.message);
    process.exitCode = 1;
} finally {
    if (generatedBinding && fs.existsSync(binding)) fs.unlinkSync(binding);
}
