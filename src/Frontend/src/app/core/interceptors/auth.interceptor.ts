import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, throwError, Observable } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { AuthService, User } from '../auth/auth.service';
import { STORAGE_KEYS } from '../constants/app.constants';
import { environment } from '../../environments/environment';

// Helper para leer cookie
function getCookie(name: string): string | null {
  return document.cookie.split('; ').reduce((r, v) => {
    const parts = v.split('=');
    return parts[0] === name ? decodeURIComponent(parts[1]) : r;
  }, null as string | null);
}

let isRefreshing = false;
let refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

// Endpoints públicos: no inyectar Bearer ni manejar 401 con logout
const PUBLIC_ENDPOINTS = ['/login', '/refresh', '/forgot-password', '/reset-password', '/register'];

function isPublicEndpoint(url: string): boolean {
  return PUBLIC_ENDPOINTS.some(path => url.includes(path));
}

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const platformId = inject(PLATFORM_ID);
  const authService = inject(AuthService);

  // Asegurar que la URL del backend tenga el prefijo /api/ si no lo tiene
  const baseUrl = environment.apiUrl;
  let requestToForward = req;

  if (req.url.startsWith(baseUrl)) {
    const path = req.url.substring(baseUrl.length);
    if (path && !path.startsWith('/api/') && path !== '/api') {
      const cleanPath = path.startsWith('/') ? path : '/' + path;
      requestToForward = req.clone({
        url: `${baseUrl}/api${cleanPath}`
      });
    }
  }

  if (!isPlatformBrowser(platformId)) {
    return next(requestToForward);
  }

  // Leer token desde sesión activa, cookie y localStorage (en ese orden)
  let token = authService.getCurrentUser()?.token || null;

  if (!token) {
    token = getCookie(STORAGE_KEYS.token);
  }

  if (!token) {
    try {
      const userLS = localStorage.getItem(STORAGE_KEYS.currentUser) || localStorage.getItem('user');
      if (userLS) {
        const user = JSON.parse(userLS);
        token = user?.token || null;
      }
    } catch {
      // ignorar errores de parseo
    }
  }

  const hasValidToken = !!(token && token.trim().length > 0);
  const canRefresh = authService.hasRefreshToken();
  const authReq = hasValidToken
    ? requestToForward.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : requestToForward;

  return next(authReq).pipe(
    catchError(error => {
      if (error.status === 401) {
        if (isPublicEndpoint(requestToForward.url) || !canRefresh) {
          return throwError(() => error);
        }

        if (!isRefreshing) {
          isRefreshing = true;
          refreshTokenSubject.next(null);

          return authService.refreshToken().pipe(
            switchMap((newUser: User) => {
              isRefreshing = false;
              const newToken = newUser.token || '';
              refreshTokenSubject.next(newToken);
              return next(requestToForward.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } }));
            }),
            catchError(refreshError => {
              isRefreshing = false;
              refreshTokenSubject.next(null);
              authService.logout();
              return throwError(() => refreshError);
            })
          );
        } else {
          return refreshTokenSubject.pipe(
            filter(token => token !== null),
            take(1),
            switchMap(token => next(requestToForward.clone({ setHeaders: { Authorization: `Bearer ${token}` } })))
          );
        }
      }

      return throwError(() => error);
    })
  );
};
