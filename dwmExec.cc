/*
Copyright 2023 GregVido

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

#pragma warning(disable : 4996) // GetVersion() was declared deprecated
#pragma warning(disable : 4312) // long -> HWND size >

#include <node_api.h>
#include "dwmExec.h"
#include <vector>
#include <string>

#define DWMWA_MICA_EFFECT DWORD(1029)
#define DWMWA_SYSTEMBACKDROP_TYPE DWORD(38)
#define DWMWA_USE_IMMERSIVE_DARK_MODE DWORD(20)
#define DWMWA_WINDOW_CORNER_PREFERENCE DWORD(33)
#define DWMWA_BORDER_COLOR DWORD(34)
#define DWMWA_CAPTION_COLOR DWORD(35)
#define DWMWA_TEXT_COLOR DWORD(36)

WNDPROC originalWndProc;

LRESULT CALLBACK WindowProc(HWND hwnd, UINT uMsg, WPARAM wParam, LPARAM lParam)
{
  switch (uMsg)
  {
  case WM_SYSCOMMAND:
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

namespace micaElectron
{

  napi_value executeDwm(napi_env env, napi_callback_info args)
  {
    size_t argc;
    napi_get_cb_info(env, args, &argc, nullptr, nullptr, nullptr);

    napi_value *argv = new napi_value[argc];
    napi_get_cb_info(env, args, &argc, argv, nullptr, nullptr);

    if (!isWin11())
      napi_throw_error(env, nullptr, "Mica-Electron work only on Windows 11.");

    else if (argc < 1)
      napi_throw_error(env, nullptr, "HWND argument missing.");

    else if (argc < 2)
      napi_throw_error(env, nullptr, "PARAMS argument missing.");

    else if (argc < 3)
      napi_throw_error(env, nullptr, "VALUE argument missing.");

    else
    {
      napi_valuetype HWNDType;
      napi_valuetype ParamsType;
      napi_valuetype ValueType;

      napi_typeof(env, argv[0], &HWNDType);
      napi_typeof(env, argv[1], &ParamsType);
      napi_typeof(env, argv[2], &ValueType);

      bool isHWNDNumber = HWNDType == napi_number;
      bool isParamsNumber = ParamsType == napi_number;
      bool isValueNumber = ValueType == napi_number;

      if (!isHWNDNumber)
        napi_throw_error(env, nullptr, "HWND argument must be an integer.");

      else if (!isParamsNumber)
        napi_throw_error(env, nullptr, "PARAMS argument must be an integer.");

      else if (!isValueNumber)
        napi_throw_error(env, nullptr, "VALUE argument must be an integer.");

      else
      {
        const HINSTANCE user32 = LoadLibrary(TEXT("user32.dll"));
        const pSetWindowLongA SetWindowLongA = (pSetWindowLongA)GetProcAddress(user32, "SetWindowLongA");
        const pGetWindowLongA GetWindowLongA = (pGetWindowLongA)GetProcAddress(user32, "GetWindowLongA");

        const HINSTANCE dwmapi = LoadLibrary(TEXT("dwmapi.dll"));
        const pDwmSetWindowAttribute DwmSetWindowAttribute = (pDwmSetWindowAttribute)GetProcAddress(dwmapi, "DwmSetWindowAttribute");
        const pDwmExtendFrameIntoClientArea DwmExtendFrameIntoClientArea = (pDwmExtendFrameIntoClientArea)GetProcAddress(dwmapi, "DwmExtendFrameIntoClientArea");

        int64_t hwnd64;
        int32_t params32;
        int32_t value32;

        napi_get_value_int64(env, argv[0], &hwnd64);
        napi_get_value_int32(env, argv[1], &params32);
        napi_get_value_int32(env, argv[2], &value32);

        HWND hwnd = (HWND)hwnd64;

        int params = (int)params32;
        int value = (int)value32;

        if (params < 5)
        {
          bool insider = isInsider();

          int enable = 0x00;

          // if dark mod, apply dark effect
          if (value == 1 /* DARK */ || (value == 5 /* AUTO */ && !is_light_theme()))
            enable = 0x01;

          DwmSetWindowAttribute(hwnd, DWMWA_USE_IMMERSIVE_DARK_MODE, &enable, sizeof(int));

          if (insider)
            DwmSetWindowAttribute(hwnd, DWMWA_SYSTEMBACKDROP_TYPE, &params, sizeof(int));

          else if (params > 2)
          {
            napi_throw_error(env, nullptr, "You use old version of windows 11, you have don't have ACRYLIC and MICA_TABBED.");
            return nullptr;
          }
          else
          {
            int micaEnable = 0x00;

            if (params == 1)
              micaEnable = 0x02;

            else if (params == 2)
              micaEnable = 0x01;

            DwmSetWindowAttribute(hwnd, DWMWA_MICA_EFFECT, &micaEnable, sizeof(int));
          }
        }

        else if (params == 5)
          DwmSetWindowAttribute(hwnd, DWMWA_WINDOW_CORNER_PREFERENCE, &value, sizeof(int));

        else if (params == 6)
          DwmSetWindowAttribute(hwnd, DWMWA_BORDER_COLOR, &value, sizeof(int));

        else if (params == 7)
          DwmSetWindowAttribute(hwnd, DWMWA_CAPTION_COLOR, &value, sizeof(int));

        else if (params == 8)
          DwmSetWindowAttribute(hwnd, DWMWA_TEXT_COLOR, &value, sizeof(int));

        else if (params == 9 && value == 0)
          SetWindowLongA(hwnd, -16, 0x004F0000L);

        else if (params == 9 && value == 1)
        {

          LONG_PTR style = GetWindowLongA(hwnd, GWL_STYLE);

          style |= WS_SIZEBOX;
          style |= WS_THICKFRAME;
          style |= WS_MAXIMIZEBOX;

          SetWindowLongA(hwnd, GWL_STYLE, style);
        }

        else if (params == 9 && value == 2)
        {
          originalWndProc = (WNDPROC)GetWindowLongPtr(hwnd, GWLP_WNDPROC);
          SetWindowLongPtr(hwnd, GWLP_WNDPROC, (LONG_PTR)WindowProc);
        }

        else if (params == 10 && value == 0)
        {
          MARGINS margins = {-1};
          DwmExtendFrameIntoClientArea(hwnd, &margins);
        }

        else if (params == 10 && value == 1)
        {
          MARGINS margins = {};
          DwmExtendFrameIntoClientArea(hwnd, &margins);
        }

        FreeLibrary(dwmapi);
        FreeLibrary(user32);
      }
    }

    return nullptr;
  }

  napi_value executeUser32(napi_env env, napi_callback_info args)
  {
    size_t argc;
    napi_get_cb_info(env, args, &argc, nullptr, nullptr, nullptr);

    napi_value *argv = new napi_value[argc];
    napi_get_cb_info(env, args, &argc, argv, nullptr, nullptr);

    if (argc < 1)
      napi_throw_error(env, nullptr, "HWND argument missing.");

    else if (argc < 2)
      napi_throw_error(env, nullptr, "PARAMS argument missing.");

    else if (argc < 3)
      napi_throw_error(env, nullptr, "VALUE argument missing.");

    else
    {
      napi_valuetype HWNDType;
      napi_valuetype ParamsType;
      napi_valuetype ValueType;

      napi_typeof(env, argv[0], &HWNDType);
      napi_typeof(env, argv[1], &ParamsType);
      napi_typeof(env, argv[2], &ValueType);

      bool isHWNDNumber = HWNDType == napi_number;
      bool isParamsNumber = ParamsType == napi_number;
      bool isValueNumber = ValueType == napi_number;

      if (!isHWNDNumber)
        napi_throw_error(env, nullptr, "HWND argument must be an integer.");

      else if (!isParamsNumber)
        napi_throw_error(env, nullptr, "PARAMS argument must be an integer.");

      else if (!isValueNumber)
        napi_throw_error(env, nullptr, "VALUE argument must be an integer.");

      else
      {
        const HINSTANCE user32 = LoadLibrary(TEXT("user32.dll"));
        const pSetWindowCompositionAttribute SetWindowCompositionAttribute = (pSetWindowCompositionAttribute)GetProcAddress(user32, "SetWindowCompositionAttribute");

        int64_t hwnd64;
        int32_t params32;
        int32_t value32;

        napi_get_value_int64(env, argv[0], &hwnd64);
        napi_get_value_int32(env, argv[1], &params32);
        napi_get_value_int32(env, argv[2], &value32);

        HWND hwnd = (HWND)hwnd64;
        int params = (int)params32;
        int value = (int)value32;

        ACCENTPOLICY policy;
        policy.nAccentState = params;
        policy.nFlags = 2;
        policy.nColor = value;
        policy.nAnimationId = 0;

        WINCOMATTRPDATA data;
        data.nAttribute = 19;
        data.pData = &policy;
        data.ulDataSize = sizeof(policy);

        SetWindowCompositionAttribute(hwnd, &data);

        FreeLibrary(user32);
      }
    }

    return nullptr;
  }

  napi_value redraw(napi_env env, napi_callback_info args)
  {
    size_t argc;
    napi_get_cb_info(env, args, &argc, nullptr, nullptr, nullptr);

    napi_value *argv = new napi_value[argc];
    napi_get_cb_info(env, args, &argc, argv, nullptr, nullptr);

    if (argc < 1)
      napi_throw_error(env, nullptr, "HWND argument missing.");

    else if (argc < 2)
      napi_throw_error(env, nullptr, "X argument missing.");

    else if (argc < 3)
      napi_throw_error(env, nullptr, "Y argument missing.");

    else if (argc < 4)
      napi_throw_error(env, nullptr, "WIDTH argument missing.");

    else if (argc < 5)
      napi_throw_error(env, nullptr, "HEIGHT argument missing.");

    else
    {
      napi_valuetype HWNDType;
      napi_valuetype XType;
      napi_valuetype YType;
      napi_valuetype WidthType;
      napi_valuetype HeightType;

      napi_typeof(env, argv[0], &HWNDType);
      napi_typeof(env, argv[1], &XType);
      napi_typeof(env, argv[2], &YType);
      napi_typeof(env, argv[3], &WidthType);
      napi_typeof(env, argv[4], &HeightType);

      bool isHWNDNumber = HWNDType == napi_number;
      bool isXNumber = XType == napi_number;
      bool isYNumber = YType == napi_number;
      bool isWidthNumber = WidthType == napi_number;
      bool isHeightNumber = HeightType == napi_number;

      if (!isHWNDNumber)
        napi_throw_error(env, nullptr, "HWND argument must be an integer.");

      else if (!isXNumber)
        napi_throw_error(env, nullptr, "X argument must be an integer.");

      else if (!isYNumber)
        napi_throw_error(env, nullptr, "Y argument must be an integer.");

      else if (!isWidthNumber)
        napi_throw_error(env, nullptr, "WIDTH argument must be an integer.");

      else if (!isHeightNumber)
        napi_throw_error(env, nullptr, "HEIGHT argument must be an integer.");

      else
      {
        const HINSTANCE user32 = LoadLibrary(TEXT("user32.dll"));
        const pSetWindowCompositionAttribute SetWindowCompositionAttribute = (pSetWindowCompositionAttribute)GetProcAddress(user32, "SetWindowCompositionAttribute");

        int64_t hwnd64;
        int32_t x32;
        int32_t y32;
        int32_t width32;
        int32_t height32;

        napi_get_value_int64(env, argv[0], &hwnd64);
        napi_get_value_int32(env, argv[1], &x32);
        napi_get_value_int32(env, argv[2], &y32);
        napi_get_value_int32(env, argv[3], &width32);
        napi_get_value_int32(env, argv[4], &height32);

        HWND hwnd = (HWND)hwnd64;
        int x = (int)x32;
        int y = (int)y32;
        int width = (int)width32;
        int height = (int)height32;

        SetWindowPos(hwnd, 0, x, y, width, height, 0x0020);
        FreeLibrary(user32);
      }
    }

    return nullptr;
  }

  napi_value init(napi_env env, napi_value exports)
  {
    napi_status status;
    napi_value fn1;
    napi_value fn2;
    napi_value fn3;

    status = napi_create_function(env, nullptr, 0, executeDwm, nullptr, &fn1);
    if (status != napi_ok)
      return nullptr;

    status = napi_set_named_property(env, exports, "executeDwm", fn1);
    if (status != napi_ok)
      return nullptr;

    status = napi_create_function(env, nullptr, 0, executeUser32, nullptr, &fn2);
    if (status != napi_ok)
      return nullptr;

    status = napi_set_named_property(env, exports, "executeUser32", fn2);
    if (status != napi_ok)
      return nullptr;

    status = napi_create_function(env, nullptr, 0, redraw, nullptr, &fn3);
    if (status != napi_ok)
      return nullptr;

    status = napi_set_named_property(env, exports, "redraw", fn3);
    if (status != napi_ok)
      return nullptr;

    return exports;
  }

  NAPI_MODULE(NODE_GYP_MODULE_NAME, init)
}
