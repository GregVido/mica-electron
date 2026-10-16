import { MicaBrowserWindow, PARAMS, VALUE, WIN10, IS_WINDOWS_11 } from '..';

const win = new MicaBrowserWindow({
    show: false,
    webPreferences: { experimentalFeatures: true }
});
win.alwaysFocused(true);
win.setBorderColor(null);
win.setCaptionColor('#123');
win.setTitleTextColor(null);
win.executeDwm(PARAMS.CORNER, VALUE.CORNER.ROUND);
if (IS_WINDOWS_11) win.setMicaEffect();
else win.setCustomEffect(WIN10.ACRYLIC, '#123456', 0.5);
