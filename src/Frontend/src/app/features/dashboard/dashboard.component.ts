import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, User } from '../../core/auth/index';
import { ThemeToggleComponent } from '../../shared/theme/theme-toggle.component';
import { Subscription, filter } from 'rxjs';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  permisos?: string[]; // formato: "MODULO.OPERACION"
  roles?: string[]; // roles específicos requeridos
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, ThemeToggleComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  user: User | null = null;
  sidebarCollapsed = false;
  notificationCount = 3;
  pageTitle = 'Inicio';
  menuItems: MenuItem[] = [];
  private authSubscription?: Subscription;
  private routerSubscription?: Subscription;
  
  private router = inject(Router);
  private authService = inject(AuthService);

  // Definición del menú completo
  private allMenuItems: MenuItem[] = [
    { label: 'Inicio', icon: 'pi-home', route: '/dashboard' }, // Siempre visible
    
    // POSTULANTE - restringido por ROL
    { label: 'Mi Postulación', icon: 'pi-file-edit', route: '/dashboard/mi-postulacion', roles: ['POSTULANTE'] },
    
    // SUPERVISOR/ADMIN - restringido por PERMISOS
    { label: 'Postulaciones', icon: 'pi-file', route: '/dashboard/postulaciones', permisos: ['POSTULACION.LEER'] },
    { label: 'Pagos', icon: 'pi-credit-card', route: '/dashboard/pagos', permisos: ['PAGOS.LEER'] },
    { label: 'Matrículas', icon: 'pi-book', route: '/dashboard/matriculas', permisos: ['POSTULACION.LEER'] },
    
    // PROFESOR/ADMIN - restringido por PERMISOS
    { label: 'Distributivo Docente', icon: 'pi-users', route: '/dashboard/distributivo-docente', permisos: ['DISTRIBUTIBOS.LEER'], roles: ['PROFESOR'] },
    { label: 'Calificaciones', icon: 'pi-chart-bar', route: '/dashboard/calificaciones', permisos: ['CALIFICACIONES.LEER'] },
    
    // ALUMNO - restringido por ROL
    { label: 'Mis Pagos', icon: 'pi-wallet', route: '/dashboard/mis-pagos', roles: ['ALUMNO'] },
    { label: 'Mis Calificaciones', icon: 'pi-star', route: '/dashboard/mis-calificaciones', roles: ['ALUMNO'] },
    
    // ACADEMIA/ADMIN - restringido por PERMISOS
    { label: 'Distributivo', icon: 'pi-users', route: '/dashboard/distributivo', permisos: ['DISTRIBUTIBOS.LEER'] },
    { label: 'Infraestructura', icon: 'pi-building', route: '/dashboard/infraestructura', permisos: ['INFRAESTRUCTURA.LEER'] },
    
    // ADMIN - restringido por ROL
    { label: 'Configuraciones', icon: 'pi-cog', route: '/dashboard/configuraciones', roles: ['ADMIN', 'ADMINISTRADOR'] },
  ];

  ngOnInit(): void {
    // Cargar usuario inicial
    this.user = this.authService.getCurrentUser();
    if (this.user) {
      this.menuItems = this.getMenuItemsByPermissions(this.user.permisos);
    }

    // Suscribirse a cambios en el estado de autenticación
    this.authSubscription = this.authService.currentUser$.subscribe(user => {
      this.user = user;
      if (this.user) {
        // Filtrar menú según los permisos del usuario
        this.menuItems = this.getMenuItemsByPermissions(this.user.permisos);
      }
      // No redirigir aquí - el guard ya se encarga de eso
    });

    // Suscribirse a cambios de ruta para actualizar el título de la página
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updatePageTitle();
      });

    this.updatePageTitle();
  }

  ngOnDestroy(): void {
    // Limpiar las suscripciones
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  getMenuItemsByPermissions(userPermisos: { idModulo: number; nombreModulo: string; idOperacion: number; nombreOperacion: string }[]): MenuItem[] {
    const userRoles = this.user?.roles.map(r => r.nombre) || [];
    const isAlumno = userRoles.includes('ALUMNO');
    const isPostulante = userRoles.includes('POSTULANTE');
    const isProfesor = userRoles.includes('PROFESOR');
    
    let filteredItems = this.allMenuItems.filter(item => {
      // Si es alumno, excluir las opciones genéricas de Pagos y Calificaciones
      if (isAlumno && (item.route === '/dashboard/pagos' || item.route === '/dashboard/calificaciones')) {
        return false;
      }
      
      // Si es postulante, excluir las opciones administrativas de Postulaciones, Pagos y Matrículas
      if (isPostulante && (item.route === '/dashboard/postulaciones' || item.route === '/dashboard/pagos' || item.route === '/dashboard/matriculas')) {
        return false;
      }
      
      // Si es profesor, excluir el distributivo general
      if (isProfesor && item.route === '/dashboard/distributivo') {
        return false;
      }
      
      // Si no requiere ni permisos ni roles, mostrar siempre
      if (!item.permisos && !item.roles) return true;
      
      // Verificar roles si están especificados
      if (item.roles && item.roles.length > 0) {
        return item.roles.some(role => userRoles.includes(role));
      }
      
      // Verificar permisos si están especificados
      if (item.permisos && item.permisos.length > 0) {
        return item.permisos.some(permiso => {
          const [modulo, operacion] = permiso.split('.');
          return userPermisos.some(up => up.nombreModulo === modulo && up.nombreOperacion === operacion);
        });
      }
      
      return false;
    });

    // Si el usuario es profesor, cambiar la ruta del distributivo
    if (isProfesor) {
      filteredItems = filteredItems.map(item => {
        if (item.route === '/dashboard/distributivo') {
          return { ...item, route: '/dashboard/distributivo-docente' };
        }
        return item;
      });
    }

    return filteredItems;
  }

  getRoleLabel(roles: { idRol: number; nombre: string }[]): string {
    if (roles.length === 0) return 'Sin Rol';
    // Mostrar el primer rol o concatenar si hay múltiples
    return roles.map(r => r.nombre).join(', ');
  }

  updatePageTitle(): void {
    const url = this.router.url;
    if (url === '/dashboard' || url === '/dashboard/') {
      this.pageTitle = 'Inicio';
    } else if (url.includes('mi-postulacion')) {
      this.pageTitle = 'Mi Postulación';
    } else if (url.includes('postulaciones') && !url.includes('create') && !url.includes('manage')) {
      this.pageTitle = 'Postulaciones'; 
    } else if (url.includes('upload-requisitos')) {
      this.pageTitle = 'Subir Requisitos';
    } else if (url.includes('create-postulation')) {
      this.pageTitle = 'Crear Postulación';
    } else if (url.includes('manage-postulations')) {
      this.pageTitle = 'Gestionar Postulaciones';
    } else if (url.includes('postulaciones') && !url.includes('create') && !url.includes('manage')) {
      this.pageTitle = 'Postulaciones';
    } else if (url.includes('matriculas')) {
      this.pageTitle = 'Matrículas';
    } else if (url.includes('calificaciones') && url.includes('mis')) {
      this.pageTitle = 'Mis Calificaciones';
    } else if (url.includes('calificaciones')) {
      this.pageTitle = 'Calificaciones';
    } else if (url.includes('mis-pagos')) {
      this.pageTitle = 'Mis Pagos';
    } else if (url.includes('pagos')) {
      this.pageTitle = 'Gestionar Pagos';
    } else if (url.includes('distributivo-docente')) {
      this.pageTitle = 'Distributivo Docente';
    } else if (url.includes('distributivo')) {
      this.pageTitle = 'Distributivo';
    } else if (url.includes('infraestructura')) {
      this.pageTitle = 'Infraestructura';
    } else if (url.includes('configuraciones')) {
      this.pageTitle = 'Configuraciones Generales';
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
