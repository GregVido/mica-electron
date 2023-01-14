/*
Copyright 2022 GregVido

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

#include <node.h>
#include "dwmExec.h"

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

#define DWMWA_MICA_EFFECT DWORD(1029)
#define DWMWA_SYSTEMBACKDROP_TYPE DWORD(38)
#define DWMWA_USE_IMMERSIVE_DARK_MODE DWORD(20)
#define DWMWA_WINDOW_CORNER_PREFERENCE DWORD(33)
#define DWMWA_BORDER_COLOR DWORD(34)
#define DWMWA_CAPTION_COLOR DWORD(35)
#define DWMWA_TEXT_COLOR DWORD(36)

namespace demo
{

  using v8::Exception;
  using v8::FunctionCallbackInfo;
  using v8::Isolate;
  using v8::Local;
  using v8::Number;
  using v8::Object;
  using v8::String;
  using v8::Value;

  void executeDwm(const FunctionCallbackInfo<Value> &args)
  {
    Isolate *isolate = args.GetIsolate();

    if (!isWin11())
    {
      isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, "Mica-Electron work only on Windows 11.").ToLocalChecked()));
      return;
    }

    if (args.Length() < 1)
    {
      isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, "HWND argument missing.").ToLocalChecked()));
      return;
    }
    else if (args.Length() < 2)
    {
      isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, "PARAMS argument missing.").ToLocalChecked()));
      return;
    }
    else if (args.Length() < 3)
    {
      isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, "VALUE argument missing.").ToLocalChecked()));
      return;
    }
    else if (!args[0]->IsNumber())
    {
      isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, "HWND argument must be an integer.").ToLocalChecked()));
      return;
    }
    else if (!args[1]->IsNumber())
    {
      isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, "PARAMS argument must be an integer.").ToLocalChecked()));
      return;
    }
    else if (!args[2]->IsNumber())
    {
      isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, "VALUE argument must be an integer.").ToLocalChecked()));
      return;
    }

    const HINSTANCE user32 = LoadLibrary(TEXT("user32.dll"));
    const pSetWindowLongA SetWindowLongA = (pSetWindowLongA)GetProcAddress(user32, "SetWindowLongA");

    const HINSTANCE dwmapi = LoadLibrary(TEXT("dwmapi.dll"));
    const pDwmSetWindowAttribute DwmSetWindowAttribute = (pDwmSetWindowAttribute)GetProcAddress(dwmapi, "DwmSetWindowAttribute");
    const pDwmExtendFrameIntoClientArea DwmExtendFrameIntoClientArea = (pDwmExtendFrameIntoClientArea)GetProcAddress(dwmapi, "DwmExtendFrameIntoClientArea");

    HWND hwnd = (HWND)(long)args[0].As<Number>()->Value();
    int params = (int)args[1].As<Number>()->Value();
    int value = (int)args[2].As<Number>()->Value();

    if (params < 5)
    {
      bool insider = isInsider();

      if(params != 1) { // if isn't DWMSBT_NONE
          MARGINS margins = {-1};
          DwmExtendFrameIntoClientArea(hwnd, &margins); // enable transparent
      }
      else {
          MARGINS margins = {};
          DwmExtendFrameIntoClientArea(hwnd, &margins); // disable transparent
      }

      int enable = 0x00;
      // if dark mod, apply dark effect
      if (value == 1 /* DARK */ || (value == 5 /* AUTO */ && !is_light_theme()))
        enable = 0x01;

      DwmSetWindowAttribute(hwnd, DWMWA_USE_IMMERSIVE_DARK_MODE, &enable, sizeof(int));

      if (insider)
        DwmSetWindowAttribute(hwnd, DWMWA_SYSTEMBACKDROP_TYPE, &params, sizeof(int));

      else if (params > 2)
      {
        isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, "You use old version of windows 11, you have don't have ACRYLIC and MICA_TABBED.").ToLocalChecked()));
        return;
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

    FreeLibrary(dwmapi);
    FreeLibrary(user32);
    args.GetReturnValue().Set(1);
  }

  void executeUser32(const FunctionCallbackInfo<Value> &args)
  {
    Isolate *isolate = args.GetIsolate();

    if (args.Length() < 1)
    {
      isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, "HWND argument missing.").ToLocalChecked()));
      return;
    }
    else if (args.Length() < 2)
    {
      isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, "PARAMS argument missing.").ToLocalChecked()));
      return;
    }
    else if (args.Length() < 3)
    {
      isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, "VALUE argument missing.").ToLocalChecked()));
      return;
    }
    else if (!args[0]->IsNumber())
    {
      isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, "HWND argument must be an integer.").ToLocalChecked()));
      return;
    }
    else if (!args[1]->IsNumber())
    {
      isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, "PARAMS argument must be an integer.").ToLocalChecked()));
      return;
    }
    else if (!args[2]->IsNumber())
    {
      isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, "VALUE argument must be an integer.").ToLocalChecked()));
      return;
    }

    const HINSTANCE user32 = LoadLibrary(TEXT("user32.dll"));
    const pSetWindowCompositionAttribute SetWindowCompositionAttribute = (pSetWindowCompositionAttribute)GetProcAddress(user32, "SetWindowCompositionAttribute");

    HWND hwnd = (HWND)(long)args[0].As<Number>()->Value();
    int params = (int)args[1].As<Number>()->Value();
    int value = (int)args[2].As<Number>()->Value();

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
    args.GetReturnValue().Set(1);
  }

  void refreshWindow(const FunctionCallbackInfo<Value> &args)
  {
    Isolate *isolate = args.GetIsolate();

    if (args.Length() < 1)
    {
      isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, "HWND argument missing.").ToLocalChecked()));
      return;
    }
    else if (args.Length() < 2)
    {
      isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, "X argument missing.").ToLocalChecked()));
      return;
    }
    else if (args.Length() < 3)
    {
      isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, "Y argument missing.").ToLocalChecked()));
      return;
    }
    else if (args.Length() < 4)
    {
      isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, "WIDTH argument missing.").ToLocalChecked()));
      return;
    }
    else if (args.Length() < 5)
    {
      isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, "HEIGHT argument missing.").ToLocalChecked()));
      return;
    }
    else if (!args[0]->IsNumber())
    {
      isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, "HWND argument must be an integer.").ToLocalChecked()));
      return;
    }
    else if (!args[1]->IsNumber())
    {
      isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, "X argument must be an integer.").ToLocalChecked()));
      return;
    }
    else if (!args[2]->IsNumber())
    {
      isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, "Y argument must be a string.").ToLocalChecked()));
      return;
    }
    else if (!args[3]->IsNumber())
    {
      isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, "WIDTH argument must be a string.").ToLocalChecked()));
      return;
    }
    else if (!args[4]->IsNumber())
    {
      isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, "HEIGHT argument must be a string.").ToLocalChecked()));
      return;
    }

    const HINSTANCE user32 = LoadLibrary(TEXT("user32.dll"));
    const pSetWindowPos SetWindowPos = (pSetWindowPos)GetProcAddress(user32, "SetWindowPos");

    HWND hwnd = (HWND)(long)args[0].As<Number>()->Value();
    int x = (int)args[1].As<Number>()->Value();
    int y = (int)args[2].As<Number>()->Value();
    int width = (int)args[3].As<Number>()->Value();
    int height = (int)args[4].As<Number>()->Value();

    SetWindowPos(hwnd, 0, x, y, width, height, 0x0020);

    FreeLibrary(user32);
    args.GetReturnValue().Set(1);
  }

  void Initialize(Local<Object> exports)
  {
    NODE_SET_METHOD(exports, "executeDwm", executeDwm);
    NODE_SET_METHOD(exports, "redraw", refreshWindow);
    NODE_SET_METHOD(exports, "executeUser32", executeUser32);
  }

  NODE_MODULE(NODE_GYP_MODULE_NAME, Initialize)
}