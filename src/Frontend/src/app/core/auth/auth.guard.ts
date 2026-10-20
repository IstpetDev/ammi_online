import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './index';
import { STORAGE_KEYS } from '../constants/app.constants';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);
  private authService = inject(AuthService);

  canActivate(): boolean {
    // En SSR, permitir el acceso para que se verifique en el cliente
    if (!isPlatformBrowser(this.platformId)) {
      return true;
    }

    // Verificar token en cookies y usuario en sessionStorage
    const token = this.getCookie(STORAGE_KEYS.token);
    const currentUser = sessionStorage.getItem(STORAGE_KEYS.currentUser);

    if (token && currentUser) {
      // Asegurarse de que el servicio tenga el usuario cargado
      this.authService.ensureUserLoaded();
      return true;
    } else {
      console.log('❌ No hay sesión válida, redirigiendo a login');
      this.router.navigate(['/login']);
      return false;
    }
  }

  private getCookie(name: string): string | null {
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
}
