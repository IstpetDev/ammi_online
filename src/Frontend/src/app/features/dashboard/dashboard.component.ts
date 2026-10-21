import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, HostListener } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService, User } from '../../core/auth/index';
import { API_BASE_URL } from '../../core/constants/app.constants';
import { FotoPerfilService } from '../../core/services/postulaciones/foto-perfil.service';
import { ThemeService } from '../../core/services/theme.service';
import { ThemeToggleComponent } from '../../shared/theme/theme-toggle.component';
import { SettingsPanelComponent } from './settings-panel/settings-panel.component';
import { BreadcrumbsComponent } from '../../shared/breadcrumbs/breadcrumbs.component';

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
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, ThemeToggleComponent, SettingsPanelComponent, BreadcrumbsComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  user: User | null = null;
  sidebarCollapsed = true;

  // Variables for floating draggable toggle button
  buttonPosition = { x: 16, y: 150 };
  isDragging = false;
  sidebarPosition: 'left' | 'right' = 'left';
  private dragStart = { x: 0, y: 0 };
  private buttonStart = { x: 0, y: 0 };

  // Hover states
  isHoveringButton = false;
  isHoveringSidebar = false;
  private hoverTimeout?: any;
  menuItems: MenuItem[] = [];
  fotoPerfilUrl: string | null = null;
  safeFotoPerfilUrl: SafeResourceUrl | null = null;
  isPdf: boolean = false;
  showLargeProfile: boolean = false;
  showSettingsPanel = false;
  mobileMenuOpen = false;
  private authSubscription?: Subscription;
  private authService = inject(AuthService);
  private fotoPerfilService = inject(FotoPerfilService);
  private sanitizer = inject(DomSanitizer);
  private themeService = inject(ThemeService);

  logoSrc = computed(() => this.themeService.layoutConfig().darkTheme ? 'assets/shared/Logo-sin-fondo-oscuro.png' : 'assets/shared/Logo-sin-fondo.png');

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
    { label: 'Mis Materias', icon: 'pi-tags', route: '/dashboard/mis-materias', roles: ['ALUMNO'] },

    // ACADEMIA/ADMIN - restringido por PERMISOS
    { label: 'Distributivo', icon: 'pi-users', route: '/dashboard/distributivo', permisos: ['DISTRIBUTIBOS.LEER'] },
    { label: 'Parametrización', icon: 'pi-building', route: '/dashboard/parametrizacion', permisos: ['INFRAESTRUCTURA.LEER'] },

    // ADMIN - restringido por ROL
    { label: 'Re-matriculación', icon: 'pi-sync', route: '/dashboard/re-matriculacion', permisos: ['POSTULACION.LEER'] },
    { label: 'Configuraciones', icon: 'pi-cog', route: '/dashboard/configuraciones', roles: ['ADMIN', 'ADMINISTRADOR'] },
    { label: 'Reportes', icon: 'pi-chart-line', route: '/dashboard/reportes', permisos: ['REPORTES.LEER'] },

    // MASTER CONTABILIDAD & SECRETARIA GENERAL & ADMIN - restringido por ROL
    { label: 'Historial de Pagos', icon: 'pi-history', route: '/dashboard/historial-pagos', roles: ['MASTER-CONTABILIDAD', 'SECRETARIA-GENERAL', 'ADMIN', 'ADMINISTRADOR'] },
    { label: 'Historial por Alumno', icon: 'pi-users', route: '/dashboard/historial-por-alumno', roles: ['MASTER-CONTABILIDAD'] },
  ];

  ngOnInit(): void {
    // Cargar usuario inicial
    this.user = this.authService.getCurrentUser();
    if (this.user) {
      this.menuItems = this.getMenuItemsByPermissions(this.user.permisos);
      this.loadFotoPerfil(this.user.id);
    }

    // Suscribirse a cambios en el estado de autenticación
    this.authSubscription = this.authService.currentUser$.subscribe(user => {
      this.user = user;
      if (this.user) {
        // Filtrar menú según los permisos del usuario
        this.menuItems = this.getMenuItemsByPermissions(this.user.permisos);
        this.loadFotoPerfil(this.user.id);
      } else {
        this.fotoPerfilUrl = null;
      }
      // No redirigir aquí - el guard ya se encarga de eso
    });

  }

  ngOnDestroy(): void {
    // Limpiar las suscripciones
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  toggleSidebar(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    // Only toggle if we were not dragging
    if (this.isDragging) return;

    // Check if the button actually moved from its starting position during drag
    const deltaX = Math.abs(this.buttonPosition.x - this.buttonStart.x);
    const deltaY = Math.abs(this.buttonPosition.y - this.buttonStart.y);
    if (deltaX > 5 || deltaY > 5) {
      return; // It was a drag operation
    }

    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  // Dynamic button positioning helpers
  getButtonLeft(): string | null {
    if (this.isDragging) {
      return `${this.buttonPosition.x}px`;
    }
    if (this.sidebarPosition === 'left') {
      return this.sidebarCollapsed ? '0px' : '260px';
    }
    return null;
  }

  getButtonRight(): string | null {
    if (this.isDragging) {
      return null;
    }
    if (this.sidebarPosition === 'right') {
      return this.sidebarCollapsed ? '0px' : '260px';
    }
    return null;
  }

  // Dragging event handlers
  startDrag(event: MouseEvent | TouchEvent): void {
    this.isDragging = true;
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;

    this.dragStart = { x: clientX, y: clientY };

    // Set initial button start coordinates dynamically based on screen side
    if (typeof window !== 'undefined') {
      let currentX = 0;
      const width = 32; // button width
      if (this.sidebarPosition === 'left') {
        currentX = this.sidebarCollapsed ? 0 : 260;
      } else {
        currentX = window.innerWidth - width - (this.sidebarCollapsed ? 0 : 260);
      }
      this.buttonStart = { x: currentX, y: this.buttonPosition.y };
      this.buttonPosition.x = currentX;
    }
  }

  onDrag(event: MouseEvent | TouchEvent): void {
    if (!this.isDragging) return;

    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;

    const deltaX = clientX - this.dragStart.x;
    const deltaY = clientY - this.dragStart.y;

    this.buttonPosition.x = this.buttonStart.x + deltaX;
    this.buttonPosition.y = this.buttonStart.y + deltaY;

    // Constrain within screen boundaries
    if (typeof window !== 'undefined') {
      const btnWidth = 32;
      const btnHeight = 96;
      this.buttonPosition.x = Math.max(0, Math.min(window.innerWidth - btnWidth, this.buttonPosition.x));
      this.buttonPosition.y = Math.max(0, Math.min(window.innerHeight - btnHeight, this.buttonPosition.y));
    }
  }

  endDrag(): void {
    if (!this.isDragging) return;
    this.isDragging = false;

    // Snap to nearest edge
    if (typeof window !== 'undefined') {
      const btnWidth = 32;
      const midPoint = window.innerWidth / 2;
      const isLeftSide = (this.buttonPosition.x + btnWidth / 2) < midPoint;

      if (isLeftSide) {
        this.sidebarPosition = 'left';
      } else {
        this.sidebarPosition = 'right';
      }
    }
  }

  @HostListener('document:mousemove', ['$event'])
  onDocumentMouseMove(event: MouseEvent): void {
    this.onDrag(event);
  }

  @HostListener('document:mouseup')
  onDocumentMouseUp(): void {
    this.endDrag();
  }

  @HostListener('document:touchmove', ['$event'])
  onDocumentTouchMove(event: TouchEvent): void {
    this.onDrag(event);
  }

  @HostListener('document:touchend')
  onDocumentTouchEnd(): void {
    this.endDrag();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (typeof window !== 'undefined') {
      const btnSize = 56;
      if (this.sidebarPosition === 'right') {
        this.buttonPosition.x = window.innerWidth - btnSize - 16;
      }
      this.buttonPosition.y = Math.max(0, Math.min(window.innerHeight - btnSize, this.buttonPosition.y));
    }
  }

  // Hover detection handlers
  setHoverButton(hover: boolean): void {
    this.isHoveringButton = hover;
    this.checkHoverState();
  }

  setHoverSidebar(hover: boolean): void {
    this.isHoveringSidebar = hover;
    this.checkHoverState();
  }

  private checkHoverState(): void {
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
    }

    if (this.isHoveringButton || this.isHoveringSidebar) {
      this.sidebarCollapsed = false;
    } else {
      // Small delay to allow moving mouse from button/edge zone to sidebar
      this.hoverTimeout = setTimeout(() => {
        if (!this.isHoveringButton && !this.isHoveringSidebar) {
          this.sidebarCollapsed = true;
        }
      }, 300);
    }
  }

  getMenuItemsByPermissions(userPermisos: { idModulo: number; nombreModulo: string; idOperacion: number; nombreOperacion: string }[]): MenuItem[] {
    const userRoles = this.user?.roles.map(r => r.nombre) || [];
    const isAlumno = userRoles.includes('ALUMNO');
    const isPostulante = userRoles.includes('POSTULANTE');
    const isProfesor = userRoles.includes('PROFESOR');
    const isSecretaria = userRoles.includes('SECRETARIA-GENERAL') || userRoles.includes('SECRETARIA');

    let filteredItems = this.allMenuItems.filter(item => {
      // Si es secretaria, permitir acceso directo a Pagos, Postulaciones y Matrículas
      if (isSecretaria && (item.route === '/dashboard/pagos' || item.route === '/dashboard/postulaciones' || item.route === '/dashboard/matriculas' || item.route === '/dashboard/historial-pagos')) {
        return true;
      }

      // Si es secretaria, excluir Reportes y Re-matriculación (mantiene Pagos e Historial de Pagos)
      if (isSecretaria && (item.route === '/dashboard/reportes' || item.route === '/dashboard/re-matriculacion')) {
        return false;
      }

      // Si es alumno, excluir las opciones genéricas de Pagos y Calificaciones
      if (isAlumno && (item.route === '/dashboard/pagos' || item.route === '/dashboard/calificaciones')) {
        return false;
      }

      // Si es postulante, excluir las opciones administrativas de Postulaciones, Pagos, Matrículas y Re-matriculación
      if (isPostulante && (item.route === '/dashboard/postulaciones' || item.route === '/dashboard/pagos' || item.route === '/dashboard/matriculas' || item.route === '/dashboard/re-matriculacion')) {
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



  logout(): void {
    this.authService.logout();
  }

  loadFotoPerfil(idPersona: number): void {
    this.fotoPerfilService.getByPersonaId(idPersona).subscribe({
      next: (response) => {
        if (response.isSuccess && response.data && response.data.pathFoto) {
          const rawUrl = `${API_BASE_URL}/${response.data.pathFoto}`;
          // Agregar un timestamp para evitar caché si la imagen cambia
          this.fotoPerfilUrl = rawUrl + '?t=' + new Date().getTime();
          this.isPdf = this.fotoPerfilUrl.toLowerCase().includes('.pdf');
          this.safeFotoPerfilUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.fotoPerfilUrl);
        } else {
          this.fotoPerfilUrl = null;
          this.safeFotoPerfilUrl = null;
          this.isPdf = false;
        }
      },
      error: (err) => {
        console.error('Error cargando foto de perfil', err);
        this.fotoPerfilUrl = null;
        this.safeFotoPerfilUrl = null;
        this.isPdf = false;
      }
    });
  }
}
