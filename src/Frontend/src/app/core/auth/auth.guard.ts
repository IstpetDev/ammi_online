import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivate, Router, UrlTree, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);
  private authService = inject(AuthService);

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    // SSR Check
    if (!isPlatformBrowser(this.platformId)) {
      return true;
    }

    if (this.authService.isAuthenticated()) {
      this.authService.ensureUserLoaded();

      const user = this.authService.getCurrentUser();
      if (user?.requiereCambioContrasenia) {
        if (!state.url.includes('/cambiar-contrasenia')) {
          console.warn('⚠️ Se requiere cambio de contraseña. Redirigiendo...');
          return this.router.createUrlTree(['/cambiar-contrasenia']);
        }
      } else {
        if (state.url.includes('/cambiar-contrasenia')) {
          return this.router.createUrlTree(['/dashboard']);
        }
      }

      return true;
    }

    console.warn('❌ Sesión no válida o expirada. Redirigiendo a Login...');
    return this.router.createUrlTree(['/login']);
  }
}
