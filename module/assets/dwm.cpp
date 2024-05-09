/*
Copyright 2024 GregVido

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

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