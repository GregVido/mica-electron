#include <dwmapi.h>
#include <iostream>

typedef BOOL(WINAPI *pDwmSetWindowAttribute)(HWND, DWORD, int *, int);

typedef BOOL(WINAPI *pSetLayeredWindowAttributes)(HWND, int, byte, int);
typedef BOOL(WINAPI *pDwmExtendFrameIntoClientArea)(HWND, MARGINS *);

typedef BOOL(WINAPI *pSetWindowPos)(HWND, HWND, int, int, int, int, int);
typedef HWND(WINAPI *pSetWindowLongA)(HWND, int, long);