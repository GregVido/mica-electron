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

#pragma warning(disable : 4996) // GetVersion() was declared deprecated
#pragma warning(disable : 4312) // long -> HWND size >

#include <node_api.h>

#include "assets/win.cpp"
#include "assets/winstyle.h"
#include "assets/dwm.cpp"
#include "assets/user32.cpp"

#include "assets/types.h"

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
        int64_t hwnd64;
        int32_t params32;
        int32_t value32;

        napi_get_value_int64(env, argv[0], &hwnd64);
        napi_get_value_int32(env, argv[1], &params32);
        napi_get_value_int32(env, argv[2], &value32);

        HWND hwnd = (HWND)hwnd64;

        int params = (int)params32;
        int value = (int)value32;

        enableDWM();

        if (params <= MICA_EFFECT)
        {
          setAppTheme(value, hwnd);
          bool success = applyMicaEffect(params, hwnd);

          if (!success)
          {
            napi_throw_error(env, nullptr, "You use old version of windows 11, you have don't have ACRYLIC and MICA_TABBED.");
            return nullptr;
          }
        }

        else
        {
          switch (params)
          {

          case CORNER_TYPE:
            setCorner(value, hwnd);
            break;

          case BORDER_COLOR:
            setBorderColor(value, hwnd);
            break;

          case CAPTION_COLOR:
            setCaptionColor(value, hwnd);
            break;

          case TEXT_COLOR:
            setTextColor(value, hwnd);
            break;

          case WINDOW_EDIT:
            if (value == RESET_BORDER)
              resetBorderApp(hwnd);

            else if (value == ENABLE_MAXIMIZE)
              enableMaximizeBox(hwnd);

            else if (value == INTERCEPT_MSG)
              interceptMessage(hwnd);

            else if (value == ENABLE_CAPTION)
              disableCaption(hwnd);

            else if (value == DISABLE_CAPTION)
              enableCaption(hwnd);

            else if (value == FOCUS_WINDOW)
              SetFocus(hwnd);

            break;

          case MARGIN_TYPE:
            setMargin(value, hwnd);
            break;

          default:
            break;
          }
        }

        disableDWM();
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

        int64_t hwnd64;
        int32_t params32;
        int32_t value32;

        napi_get_value_int64(env, argv[0], &hwnd64);
        napi_get_value_int32(env, argv[1], &params32);
        napi_get_value_int32(env, argv[2], &value32);

        enableUser32();

        HWND hwnd = (HWND)hwnd64;
        int params = (int)params32;
        int value = (int)value32;

        applyWindows10Effect(params, value, hwnd);
        disableUser32();
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
