import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, throwError } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';

// Variable para controlar si se está renovando el token
let isRefreshing = false;
let refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  const authService = inject(AuthService);
  
  if (isPlatformBrowser(platformId)) {
    const token = getCookie('authToken');
    
    if (token) {
      const cloned = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      
      return next(cloned).pipe(
        catchError(error => {
          
          // Si es 401 y no es una petición de login/refresh, intentar renovar token
          if (error.status === 401 && !req.url.includes('/login') && !req.url.includes('/refresh')) {
            
            if (!isRefreshing) {
              isRefreshing = true;
              refreshTokenSubject.next(null);
              
              return authService.refreshToken().pipe(
                switchMap((newToken) => {
                  isRefreshing = false;
                  refreshTokenSubject.next(newToken.token);
                  
                  // Reintentar la petición original con el nuevo token
                  const newCloned = req.clone({
                    setHeaders: {
                      Authorization: `Bearer ${newToken.token}`
                    }
                  });
                  return next(newCloned);
                }),
                catchError(refreshError => {
                  isRefreshing = false;
                  refreshTokenSubject.next(null);
                  return throwError(() => refreshError);
                })
              );
            } else {
              // Si ya se está renovando, esperar a que termine
              return refreshTokenSubject.pipe(
                filter(token => token != null),
                take(1),
                switchMap(token => {
                  const newCloned = req.clone({
                    setHeaders: {
                      Authorization: `Bearer ${token}`
                    }
                  });
                  return next(newCloned);
                })
              );
            }
          }
          
          return throwError(() => error);
        })
      );
    } else {
    }
  }
  
  return next(req);
};

// Helper para leer cookies
function getCookie(name: string): string | null {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
  }
  return null;
}
