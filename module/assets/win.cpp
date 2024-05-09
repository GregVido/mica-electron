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

#include <dwmapi.h>

#include <vector>
#include <string>
#include <stdexcept>

WNDPROC originalWndProc;

LRESULT CALLBACK WindowProc(HWND hwnd, UINT uMsg, WPARAM wParam, LPARAM lParam)
{

  switch (uMsg)
  {
    case WM_SYSCOMMAND:
    case WM_SIZE:
      return DefWindowProc(hwnd, uMsg, wParam, lParam);

    default:
      return CallWindowProc(originalWndProc, hwnd, uMsg, wParam, lParam);
  }
}

DWORD getBuild()
{
  DWORD dwVersion = 0;
  DWORD dwMajorVersion = 0;
  DWORD dwMinorVersion = 0;
  DWORD dwBuild = 0;

  dwVersion = GetVersion();

  dwMajorVersion = (DWORD)(LOBYTE(LOWORD(dwVersion)));
  dwMinorVersion = (DWORD)(HIBYTE(LOWORD(dwVersion)));

  if (dwVersion < 0x80000000)
    dwBuild = (DWORD)(HIWORD(dwVersion));

  return dwBuild;
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
  // based on https://stackoverflow.com/questions/51334674/how-to-detect-windows-10-light-dark-mode-in-win32-application

  // The value is expected to be a REG_DWORD, which is a signed 32-bit little-endian
  auto buffer = std::vector<char>(4);
  auto cbData = static_cast<DWORD>(buffer.size() * sizeof(char));
  auto res = RegGetValueW(
      HKEY_CURRENT_USER,
      L"Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize",
      L"AppsUseLightTheme",
      RRF_RT_REG_DWORD, // expected value type
      nullptr,
      buffer.data(),
      &cbData);

  if (res != ERROR_SUCCESS)
  {
    throw std::runtime_error("Error: error_code=" + std::to_string(res));
  }

  // convert bytes written to our buffer to an int, assuming little-endian
  auto i = int(buffer[3] << 24 |
               buffer[2] << 16 |
               buffer[1] << 8 |
               buffer[0]);

  return i == 1;
}