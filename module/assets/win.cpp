/*
Copyright 2026 GregVido

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

#include <dwmapi.h>

#include <commctrl.h>
#pragma comment(lib, "comctl32.lib")

LRESULT CALLBACK WindowProc(HWND hwnd, UINT uMsg, WPARAM wParam, LPARAM lParam,
                            UINT_PTR subclassId, DWORD_PTR)
{
  if (uMsg == WM_NCDESTROY)
    RemoveWindowSubclass(hwnd, WindowProc, subclassId);
  // Keep Electron's own handling of minimize/maximize and renderer resizing.
  return DefSubclassProc(hwnd, uMsg, wParam, lParam);
}

DWORD getBuild()
{
  // GetVersion depends on the host application's compatibility manifest.
  static const DWORD build = []() -> DWORD {
    using RtlGetVersionFn = LONG(WINAPI *)(OSVERSIONINFOW *);
    HMODULE ntdll = GetModuleHandleW(L"ntdll.dll");
    auto rtlGetVersion = ntdll ? reinterpret_cast<RtlGetVersionFn>(
      GetProcAddress(ntdll, "RtlGetVersion")) : nullptr;
    OSVERSIONINFOW version = {};
    version.dwOSVersionInfoSize = sizeof(version);
    return rtlGetVersion && rtlGetVersion(&version) == 0 ? version.dwBuildNumber : 0;
  }();
  return build;
}

bool isInsider()
{
  return getBuild() >= 22621;
}

bool isWin11()
{
  return getBuild() >= 22000;
}

bool is_light_theme()
{
  DWORD lightTheme = 1;
  DWORD cbData = sizeof(lightTheme);
  auto res = RegGetValueW(
      HKEY_CURRENT_USER,
      L"Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize",
      L"AppsUseLightTheme",
      RRF_RT_REG_DWORD, // expected value type
      nullptr,
      &lightTheme,
      &cbData);

  // A missing personalization key must not throw through the N-API boundary.
  return res != ERROR_SUCCESS || lightTheme != 0;
}
