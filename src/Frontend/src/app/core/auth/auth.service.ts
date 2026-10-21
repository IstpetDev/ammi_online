import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { map, catchError } from 'rxjs/operators';
import { STORAGE_KEYS, API_ENDPOINTS } from '../constants/app.constants';

export enum UserRole {
  ADMINISTRADOR = 'ADMINISTRADOR',
  POSTULANTE = 'POSTULANTE',
  SUPERVISOR = 'SUPERVISOR',
  PROFESOR = 'PROFESOR',
  ALUMNO = 'ALUMNO',
  ACADEMIA = 'ACADEMIA',
  ADMIN = 'ADMIN',
  SECRETARIA_GENERAL = 'SECRETARIA-GENERAL'
}

export interface User {
  id: number;
  username: string;
  token?: string;
  tokenExpiration?: string;
  refreshToken?: string;
  roles: { idRol: number; nombre: string }[];
  permisos: { idModulo: number; nombreModulo: string; idOperacion: number; nombreOperacion: string }[];
  requiereCambioContrasenia?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private isBrowser: boolean;

  private readonly httpOptions = { withCredentials: true };

  constructor(
    private router: Router,
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.loadUserFromStorage();
  }

  // Helpers para cookies
  private setCookie(name: string, value: string, days = 7) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = name + '=' + encodeURIComponent(value) + '; expires=' + expires + '; path=/';
  }
  private getCookie(name: string): string | null {
    return document.cookie.split('; ').reduce((r, v) => {
      const parts = v.split('=');
      return parts[0] === name ? decodeURIComponent(parts[1]) : r;
    }, null as string | null);
  }
  private deleteCookie(name: string) {
    document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  }

  private clearAuthStorage(): void {
    if (!this.isBrowser) return;

    this.deleteCookie(STORAGE_KEYS.currentUser);
    this.deleteCookie(STORAGE_KEYS.token);
    this.deleteCookie(STORAGE_KEYS.refreshToken);
    localStorage.removeItem('user');
    localStorage.removeItem(STORAGE_KEYS.currentUser);
    sessionStorage.removeItem(STORAGE_KEYS.currentUser);
  }

  private decodeJwtPayload(token: string): any | null {
    try {
      const payloadPart = token.split('.')[1];
      if (!payloadPart) return null;

      const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
      const paddedBase64 = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
      return JSON.parse(atob(paddedBase64));
    } catch {
      return null;
    }
  }

  private isUserSessionValid(user: User | null): boolean {
    if (!user?.token) return false;

    if (user.tokenExpiration) {
      const expirationMs = new Date(user.tokenExpiration).getTime();
      if (!Number.isNaN(expirationMs)) {
        return Date.now() < expirationMs;
      }
    }

    const payload = this.decodeJwtPayload(user.token);
    if (payload?.exp && typeof payload.exp === 'number') {
      return Date.now() < payload.exp * 1000;
    }

    return true;
  }

  private loadUserFromStorage(): void {
    if (!this.isBrowser) return;
    try {
      // Eliminar cookie pesada para evitar 400 Bad Request (Header Too Large)
      this.deleteCookie(STORAGE_KEYS.currentUser);

      // Restaurar desde localStorage
      const userLS = localStorage.getItem('user') || localStorage.getItem(STORAGE_KEYS.currentUser);
      if (userLS) {
        const user = JSON.parse(userLS);
        if (user && user.token) {
          if (!this.isUserSessionValid(user)) {
            this.currentUserSubject.next(null);
            this.clearAuthStorage();
            return;
          }
          this.currentUserSubject.next(user);
          // Mantener cookies livianas solo para token y refreshToken
          this.setCookie(STORAGE_KEYS.token, user.token || '');
          if (user.refreshToken) {
            this.setCookie(STORAGE_KEYS.refreshToken, user.refreshToken || '');
          }
        }
      }
    } catch (error) {
      localStorage.removeItem('user');
      localStorage.removeItem(STORAGE_KEYS.currentUser);
    }
  }

  public ensureUserLoaded(): void {
    if (this.currentUserSubject.value === null) {
      this.loadUserFromStorage();
    }
  }

  public getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  public hasRefreshToken(): boolean {
    if (!this.isBrowser) return false;

    const currentUser = this.currentUserSubject.value;
    if (currentUser?.refreshToken && currentUser.refreshToken.trim().length > 0) {
      return true;
    }

    const refreshTokenCookie = this.getCookie(STORAGE_KEYS.refreshToken);
    if (refreshTokenCookie && refreshTokenCookie.trim().length > 0) {
      return true;
    }

    try {
      const userLS = localStorage.getItem('user');
      if (!userLS) return false;

      const user = JSON.parse(userLS);
      return !!(user?.refreshToken && String(user.refreshToken).trim().length > 0);
    } catch {
      return false;
    }
  }

  login(username: string, password: string): Observable<User> {
    return this.http.post<any>(API_ENDPOINTS.auth.login, { username, password }, this.httpOptions).pipe(
      map(response => {
        if (response.isSuccess) {
          const user: User = {
            id: response.data.idPersona,
            username: response.data.username,
            token: response.data.token,
            tokenExpiration: response.data.tokenExpiration,
            refreshToken: response.data.refreshToken,
            requiereCambioContrasenia: response.data.requiereCambioContrasenia,
            roles: response.data.roles,
            permisos: response.data.permisos
          };
          this.currentUserSubject.next(user);
          if (this.isBrowser) {
            this.deleteCookie(STORAGE_KEYS.currentUser);
            this.setCookie(STORAGE_KEYS.token, user.token || '');
            this.setCookie(STORAGE_KEYS.refreshToken, user.refreshToken || '');
            // Guardar solo el objeto user en localStorage
            localStorage.setItem('user', JSON.stringify(user));
          }
          return user;
        } else {
          throw new Error(response.message || 'Login failed');
        }
      }),
      catchError((error: HttpErrorResponse) => {
        return throwError(() => new Error(error.error?.message || 'Login failed'));
      })
    );
  }

  register(userData: any): Observable<User> {
    return this.http.post<any>(API_ENDPOINTS.auth.register, userData, this.httpOptions).pipe(
      map(response => {
        if (response.isSuccess) {
          const user: User = {
            id: response.data.idPersona,
            username: response.data.username,
            token: response.data.token,
            tokenExpiration: response.data.tokenExpiration,
            refreshToken: response.data.refreshToken,
            requiereCambioContrasenia: response.data.requiereCambioContrasenia,
            roles: response.data.roles,
            permisos: response.data.permisos
          };
          this.currentUserSubject.next(user);
          if (this.isBrowser) {
            this.deleteCookie(STORAGE_KEYS.currentUser);
            this.setCookie(STORAGE_KEYS.token, user.token || '');
            this.setCookie(STORAGE_KEYS.refreshToken, user.refreshToken || '');
            localStorage.setItem('user', JSON.stringify(user));
          }
          return user;
        } else {
          throw new Error(response.message || 'Registration failed');
        }
      }),
      catchError((error: HttpErrorResponse) => {
        return throwError(() => new Error(error.error?.message || 'Registration failed'));
      })
    );
  }

  changePassword(data: any): Observable<any> {
    return this.http.post<any>(API_ENDPOINTS.auth.changePassword, data, this.httpOptions).pipe(
      map(res => {
        // Si el backend dice que NO fue exitoso aunque el HTTP sea 200
        if (!res.isSuccess) {
          throw new Error(res.message || 'Error al cambiar contraseña');
        }
        return res;
      }),
      catchError((error) => {
        // Errores de red o errores lanzados por el map de arriba
        const errorMsg = error instanceof Error ? error.message : (error.error?.message || 'Error de conexión');
        return throwError(() => new Error(errorMsg));
      })
    );
  }
  refreshToken(): Observable<User | any> {
    return this.http.post<any>(API_ENDPOINTS.auth.refresh || '/api/Auth/refresh', {}, this.httpOptions).pipe(
      map(response => {
        if (response.isSuccess) {
          const user: User = {
            id: response.data.idPersona,
            username: response.data.username,
            token: response.data.token,
            tokenExpiration: response.data.tokenExpiration,
            refreshToken: response.data.refreshToken,
            requiereCambioContrasenia: response.data.requiereCambioContrasenia,
            roles: response.data.roles,
            permisos: response.data.permisos
          };
          this.currentUserSubject.next(user);
          if (this.isBrowser) {
            this.deleteCookie(STORAGE_KEYS.currentUser);
            this.setCookie(STORAGE_KEYS.token, user.token || '');
            this.setCookie(STORAGE_KEYS.refreshToken, user.refreshToken || '');
            localStorage.setItem('user', JSON.stringify(user));
          }
          return user;
        } else {
          throw new Error(response.message || 'Token refresh failed');
        }
      }),
      catchError((error: HttpErrorResponse) => {
        this.logout();
        return throwError(() => new Error(error.error?.message || 'Token refresh failed'));
      })
    );
  }

  logout(): void {
    this.currentUserSubject.next(null);
    this.clearAuthStorage();
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    if (!this.isBrowser) return false;
    this.ensureUserLoaded();

    const user = this.currentUserSubject.value;
    if (!user?.token) {
      return false;
    }

    if (!this.isUserSessionValid(user)) {
      this.currentUserSubject.next(null);
      this.clearAuthStorage();
      return false;
    }

    return true;
  }

  hasRole(role: string): boolean {
    return this.currentUserSubject.value?.roles.some(r => r.nombre === role) || false;
  }

  hasAnyRole(roles: string[]): boolean {
    const currentRoles = this.currentUserSubject.value?.roles.map(r => r.nombre) || [];
    return roles.some(role => currentRoles.includes(role));
  }

  forgotPassword(username: string): Observable<any> {
    return this.http.post<any>(API_ENDPOINTS.auth.forgotPassword, { username });
  }

  resetPassword(data: any): Observable<any> {
    return this.http.post<any>(API_ENDPOINTS.auth.resetPassword, data);
  }

  cambiarContraseniaPrimerIngreso(nuevaContrasenia: string, confirmarNuevaContrasenia: string): Observable<any> {
    const data = { nuevaContrasenia, confirmarNuevaContrasenia };
    return this.http.post<any>(API_ENDPOINTS.auth.cambiarContraseniaPrimerIngreso, data, this.httpOptions).pipe(
      map((response: any) => {
        if (response.isSuccess) {
          const user = this.currentUserSubject.value;
          if (user) {
            user.requiereCambioContrasenia = false;
            this.currentUserSubject.next(user);
            if (this.isBrowser) {
              sessionStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(user));
              localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(user));
            }
          }
          return response;
        } else {
          throw new Error(response.message || 'Error al cambiar contraseña');
        }
      }),
      catchError((error: HttpErrorResponse) => {
        return throwError(() => new Error(error.error?.message || 'Error al cambiar contraseña'));
      })
    );
  }
}
