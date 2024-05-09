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

#include "winstyle.h"

HINSTANCE user32;

pSetWindowCompositionAttribute SetWindowCompositionAttributeUser32;

bool user32Enabled = false;

void enableUser32()
{
    user32 = LoadLibrary(TEXT("user32.dll"));
    SetWindowCompositionAttributeUser32 = (pSetWindowCompositionAttribute)GetProcAddress(user32, "SetWindowCompositionAttribute");
    user32Enabled = true;
}

void disableUser32()
{
    FreeLibrary(user32);
    user32Enabled = false;
}

void resetBorderApp(HWND hwnd)
{
    SetWindowLongA(hwnd, -16, 0x004F0000L);
}

void enableMaximizeBox(HWND hwnd)
{
    LONG_PTR style = GetWindowLongA(hwnd, GWL_STYLE);

    style |= WS_SIZEBOX;
    style |= WS_THICKFRAME;
    style |= WS_MAXIMIZEBOX;

    SetWindowLongA(hwnd, GWL_STYLE, style);
}

void interceptMessage(HWND hwnd)
{
    originalWndProc = (WNDPROC)GetWindowLongPtr(hwnd, GWLP_WNDPROC);
    SetWindowLongPtr(hwnd, GWLP_WNDPROC, (LONG_PTR)WindowProc);
}

void disableCaption(HWND hwnd)
{
    LONG_PTR style = GetWindowLongA(hwnd, GWL_STYLE);
    style &= ~WS_CAPTION;
    SetWindowLongA(hwnd, GWL_STYLE, style);
}

void enableCaption(HWND hwnd)
{
    LONG_PTR style = GetWindowLongA(hwnd, GWL_STYLE);
    style |= WS_CAPTION;
    SetWindowLongA(hwnd, GWL_STYLE, style);
}

void applyWindows10Effect(int nAccentState, int nColor, HWND hwnd)
{
    if (user32Enabled)
    {
        ACCENTPOLICY policy;
        policy.nAccentState = nAccentState;
        policy.nFlags = 2;
        policy.nColor = nColor;
        policy.nAnimationId = 0;

        WINCOMATTRPDATA data;
        data.nAttribute = 19;
        data.pData = &policy;
        data.ulDataSize = sizeof(policy);

        SetWindowCompositionAttributeUser32(hwnd, &data);
    }
}