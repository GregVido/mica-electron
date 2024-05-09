#include "dwm.h"
#include "winstyle.h"
#include <dwmapi.h>

HINSTANCE dwmapi;
pDwmSetWindowAttribute SetWindowAttribute;
pDwmExtendFrameIntoClientArea ExtendFrameIntoClientArea;

bool dwmEnabled = false;

void enableDWM()
{
    dwmapi = LoadLibrary(TEXT("dwmapi.dll"));
    SetWindowAttribute = (pDwmSetWindowAttribute)GetProcAddress(dwmapi, "DwmSetWindowAttribute");
    ExtendFrameIntoClientArea = (pDwmExtendFrameIntoClientArea)GetProcAddress(dwmapi, "DwmExtendFrameIntoClientArea");

    dwmEnabled = true;
}

void disableDWM()
{
    FreeLibrary(dwmapi);
    dwmEnabled = false;
}

void setAppTheme(int value, HWND hwnd)
{
    if (dwmEnabled)
    {
        int useDarkTheme = 0x00;

        // if dark mod, apply dark effect
        if (value == 1 /* DARK */ || (value == 5 /* AUTO */ && !is_light_theme()))
            useDarkTheme = 0x01;

        SetWindowAttribute(hwnd, DWMWA_USE_IMMERSIVE_DARK_MODE, &useDarkTheme, sizeof(int));
    }
}

bool applyMicaEffect(int type, HWND hwnd)
{
    if(dwmEnabled) {
        bool insider = isInsider();

        if (insider)
            SetWindowAttribute(hwnd, DWMWA_SYSTEMBACKDROP_TYPE, &type, sizeof(int));

        else if (type > 2)
            return false;
        
        else
        {
            int micaEnable = 0x00;

            if (type == 1)
                micaEnable = 0x02;

            else if (type == 2)
                micaEnable = 0x01;

            SetWindowAttribute(hwnd, DWMWA_MICA_EFFECT, &micaEnable, sizeof(int));
        }
    }

    return true;
}

void setCorner(int type, HWND hwnd) {
    if(dwmEnabled)
        SetWindowAttribute(hwnd, DWMWA_WINDOW_CORNER_PREFERENCE, &type, sizeof(int));
}

void setBorderColor(int type, HWND hwnd) {
    if(dwmEnabled)
        SetWindowAttribute(hwnd, DWMWA_BORDER_COLOR, &type, sizeof(int));
}

void setCaptionColor(int type, HWND hwnd) {
    if(dwmEnabled)
        SetWindowAttribute(hwnd, DWMWA_CAPTION_COLOR, &type, sizeof(int));
}

void setTextColor(int type, HWND hwnd) {
    if(dwmEnabled)
        SetWindowAttribute(hwnd, DWMWA_TEXT_COLOR, &type, sizeof(int));
}

void setMargin(int type, HWND hwnd) {
    if(dwmEnabled) {
        MARGINS margins;
        if(type == 0)
            margins = {-1};

        else 
             margins = {};
        
        ExtendFrameIntoClientArea(hwnd, &margins);
    }
}