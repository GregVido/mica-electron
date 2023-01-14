#include <dwmapi.h>
#include <iostream>

struct ACCENTPOLICY
{
	int nAccentState;
	int nFlags;
	int nColor;
	int nAnimationId;
};

struct WINCOMATTRPDATA
{
	int nAttribute;
	PVOID pData;
	ULONG ulDataSize;
};

typedef BOOL(WINAPI *pSetWindowCompositionAttribute)(HWND, WINCOMATTRPDATA *);
typedef BOOL(WINAPI *pDwmSetWindowAttribute)(HWND, DWORD, int *, int);

typedef BOOL(WINAPI *pSetLayeredWindowAttributes)(HWND, int, byte, int);
typedef BOOL(WINAPI *pDwmExtendFrameIntoClientArea)(HWND, MARGINS *);

typedef BOOL(WINAPI *pSetWindowPos)(HWND, HWND, int, int, int, int, int);
typedef HWND(WINAPI *pSetWindowLongA)(HWND, int, long);