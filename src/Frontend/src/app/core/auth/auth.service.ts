import { Injectable, PLATFORM_ID, inject, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { Observable, of, throwError, BehaviorSubject } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { map, catchError } from 'rxjs/operators';
import { STORAGE_KEYS, API_ENDPOINTS } from '../constants/app.constants';

export enum UserRole {
  ADMINISTRADOR = 'ADMINISTRADOR',
  POSTULANTE = 'POSTULANTE',
  SUPERVISOR = 'SUPERVISOR',
  PROFESOR = 'PROFESOR',
  ALUMNO = 'ALUMNO',
  ACADEMIA = 'ACADEMIA'
}

export interface User {
  id: number;
  username: string;
  token: string;
  tokenExpiration: string;
  refreshToken: string;
  roles: { idRol: number; nombre: string }[];
  permisos: { idModulo: number; nombreModulo: string; idOperacion: number; nombreOperacion: string }[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private isBrowser: boolean;

  constructor(
    private router: Router,
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.loadUserFromStorage();
  }

  // ============ COOKIE HELPERS ============
  private setCookie(name: string, value: string, days: number = 7): void {
    if (!this.isBrowser) return;
    
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
  }

  private getCookie(name: string): string | null {
    if (!this.isBrowser) return null;
    
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

  private deleteCookie(name: string): void {
    if (!this.isBrowser) return;
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  }
  // ========================================

  private loadUserFromStorage(): void {
    // Cargar usuario de sessionStorage y token de cookies (solo en browser)
    if (!this.isBrowser) return;
    
    try {
      const userData = sessionStorage.getItem(STORAGE_KEYS.currentUser);
      const token = this.getCookie(STORAGE_KEYS.token);
      
      if (userData && token) {
        const user = JSON.parse(userData);
        this.currentUserSubject.next(user);
      } else {
        console.log('⚠️ No hay usuario en sessionStorage o token en cookies');
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      if (this.isBrowser) {
        sessionStorage.removeItem(STORAGE_KEYS.currentUser);
        this.deleteCookie(STORAGE_KEYS.token);
      }
    }
  }

  // Método público para forzar la carga del usuario
  public ensureUserLoaded(): void {
    if (this.currentUserSubject.value === null) {
      this.loadUserFromStorage();
    }
  }

  login(username: string, password: string): Observable<User> {
    return this.http.post<any>(API_ENDPOINTS.auth.login, { username, password }).pipe(
      map(response => {
        if (response.isSuccess) {
          const user: User = {
            id: response.data.idPersona,
            username: response.data.username,
            token: response.data.token,
            tokenExpiration: response.data.tokenExpiration,
            refreshToken: response.data.refreshToken,
            roles: response.data.roles,
            permisos: response.data.permisos
          };
          this.currentUserSubject.next(user);
          if (this.isBrowser) {
            // Guardar usuario en sessionStorage (sin límite de tamaño)
            sessionStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(user));
            // Guardar tokens en cookies (más seguro)
            this.setCookie(STORAGE_KEYS.token, user.token, 7);
            this.setCookie(STORAGE_KEYS.refreshToken, user.refreshToken, 7);
            console.log('✅ LOGIN: Usuario guardado en sessionStorage y tokens en cookies', {
              username: user.username,
              token: user.token.substring(0, 20) + '...',
              hasToken: !!this.getCookie(STORAGE_KEYS.token),
              hasUser: !!sessionStorage.getItem(STORAGE_KEYS.currentUser)
            });
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

  register(userData: { username: string; password: string; email: string; nombre: string; apellido: string }): Observable<User> {
    return this.http.post<any>(API_ENDPOINTS.auth.register, userData).pipe(
      map(response => {
        if (response.isSuccess) {
          const user: User = {
            id: response.data.idPersona,
            username: response.data.username,
            token: response.data.token,
            tokenExpiration: response.data.tokenExpiration,
            refreshToken: response.data.refreshToken,
            roles: response.data.roles,
            permisos: response.data.permisos
          };
          this.currentUserSubject.next(user);
          if (this.isBrowser) {
            sessionStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(user));
            this.setCookie(STORAGE_KEYS.token, user.token, 7);
            this.setCookie(STORAGE_KEYS.refreshToken, user.refreshToken, 7);
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

  changePassword(data: { currentPassword: string; newPassword: string }): Observable<any> {
    return this.http.post<any>(API_ENDPOINTS.auth.changePassword, data).pipe(
      map(response => {
        if (response.isSuccess) {
          return response;
        } else {
          throw new Error(response.message || 'Change password failed');
        }
      }),
      catchError((error: HttpErrorResponse) => {
        return throwError(() => new Error(error.error?.message || 'Change password failed'));
      })
    );
  }

  refreshToken(): Observable<User> {
    const refreshToken = this.getCookie(STORAGE_KEYS.refreshToken);
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<any>(API_ENDPOINTS.auth.refresh, { refreshToken }).pipe(
      map(response => {
        if (response.isSuccess) {
          const user: User = {
            id: response.data.idPersona,
            username: response.data.username,
            token: response.data.token,
            tokenExpiration: response.data.tokenExpiration,
            refreshToken: response.data.refreshToken,
            roles: response.data.roles,
            permisos: response.data.permisos
          };
          this.currentUserSubject.next(user);
          if (this.isBrowser) {
            sessionStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(user));
            this.setCookie(STORAGE_KEYS.token, user.token, 7);
            this.setCookie(STORAGE_KEYS.refreshToken, user.refreshToken, 7);
          }
          console.log('✅ Token renovado exitosamente');
          return user;
        } else {
          throw new Error(response.message || 'Token refresh failed');
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Error al renovar token:', error);
        // Si el refresh token también falló, hacer logout
        this.logout();
        return throwError(() => new Error(error.error?.message || 'Token refresh failed'));
      })
    );
  }

  logout(): void {
    this.currentUserSubject.next(null);
    if (this.isBrowser) {
      sessionStorage.removeItem(STORAGE_KEYS.currentUser);
      this.deleteCookie(STORAGE_KEYS.token);
      this.deleteCookie(STORAGE_KEYS.refreshToken);
    }
    this.router.navigate(['/login']);
  }

  getCurrentUser(): User | null {
    // Si no hay usuario en memoria, intentar cargar
    if (this.currentUserSubject.value === null) {
      this.ensureUserLoaded();
    }
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    if (!this.isBrowser) return false;
    
    // Verificar token en cookies y usuario en sessionStorage
    const token = this.getCookie(STORAGE_KEYS.token);
    const userData = sessionStorage.getItem(STORAGE_KEYS.currentUser);
    
    return !!(token && userData);
  }

  hasRole(role: string): boolean {
    return this.currentUserSubject.value?.roles.some(r => r.nombre === role) || false;
  }

  hasAnyRole(roles: string[]): boolean {
    const currentRoles = this.currentUserSubject.value?.roles.map(r => r.nombre) || [];
    return roles.some(role => currentRoles.includes(role));
  }

  // Método para futura integración con API
  // loginFromAPI(email: string, password: string): Observable<User> {
  //   return this.http.post<User>('/api/auth/login', { email, password });
  // }

  // getUsersFromAPI(): Observable<User[]> {
  //   return this.http.get<User[]>('/api/users');
  // }
}
