import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService, User } from '../../core/auth/index';
import { SharedDrawerComponent } from '../shared-drawer/shared-drawer.component';

interface OnboardingSection {
  icon: string;
  title: string;
  description: string;
}

interface RoleQuickLink {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-welcome-onboarding',
  standalone: true,
  imports: [CommonModule, RouterLink, SharedDrawerComponent],
  template: `
    <app-shared-drawer
      [(visible)]="visible"
      mode="modal"
      size="lg"
      [showCloseButton]="true"
      [closeOnOverlayClick]="false"
      [showFooter]="false"
      (close)="dismiss()"
      (cancel)="dismiss()">

      <div drawer-title>
        <span>¡Bienvenido a AMMI Online!</span>
      </div>

      <div class="wo-container">
        <div class="wo-hero">
          <div class="wo-hero-icon">
            <i class="pi pi-graduation-cap"></i>
          </div>
          <h2 class="wo-hero-title">¡Bienvenido, {{ userName }}!</h2>
          <p class="wo-hero-sub">Sistema de Gestión Educativa — {{ roleLabel }}</p>
        </div>

        <div class="wo-sections">
          @for (section of sections; track section.title) {
            <div class="wo-section">
              <div class="wo-section-icon">
                <i [class]="section.icon"></i>
              </div>
              <div class="wo-section-body">
                <h4>{{ section.title }}</h4>
                <p>{{ section.description }}</p>
              </div>
            </div>
          }
        </div>

        @if (quickLinks.length > 0) {
          <div class="wo-links">
            <h4 class="wo-links-title">Accesos directos</h4>
            <div class="wo-links-grid">
              @for (link of quickLinks; track link.route) {
                <a [routerLink]="link.route" class="wo-link" (click)="dismiss()">
                  <i [class]="link.icon"></i>
                  <span>{{ link.label }}</span>
                </a>
              }
            </div>
          </div>
        }

        <div class="wo-footer">
          <button class="wo-btn-primary" (click)="dismiss()">
            <i class="pi pi-check"></i>
            ¡Entendido, comenzar!
          </button>
        </div>
      </div>
    </app-shared-drawer>
  `,
  styles: [`
    .wo-container { font-family: 'Poppins', sans-serif; padding: 0 0.5rem; }
    .wo-hero {
      text-align: center; padding: 1.5rem 1rem;
      background: linear-gradient(135deg, rgba(233,185,2,0.08) 0%, rgba(233,185,2,0.02) 100%);
      border-radius: 12px; margin-bottom: 1.5rem;
    }
    .wo-hero-icon {
      width: 56px; height: 56px; margin: 0 auto 0.75rem;
      background: var(--brand-yellow-dark); border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
    }
    .wo-hero-icon i { font-size: 1.5rem; color: var(--brand-black); }
    .wo-hero-title { margin: 0 0 0.25rem; font-size: 1.25rem; font-weight: 700; color: var(--text-color); }
    .wo-hero-sub { margin: 0; font-size: 0.8rem; color: var(--text-color-secondary); }
    .wo-sections { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.5rem; }
    .wo-section {
      display: flex; gap: 0.75rem; padding: 0.75rem 1rem;
      background: var(--surface-section); border: 1px solid var(--surface-border);
      border-radius: 10px; transition: border-color 0.2s;
    }
    .wo-section:hover { border-color: var(--brand-yellow-dark); }
    .wo-section-icon {
      width: 36px; height: 36px; flex-shrink: 0;
      background: rgba(233,185,2,0.1); border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
    }
    .wo-section-icon i { font-size: 1rem; color: var(--brand-yellow-dark); }
    .wo-section-body h4 { margin: 0 0 0.2rem; font-size: 0.85rem; font-weight: 600; color: var(--text-color); }
    .wo-section-body p { margin: 0; font-size: 0.78rem; color: var(--text-color-secondary); line-height: 1.4; }
    .wo-links { margin-bottom: 1.5rem; }
    .wo-links-title { margin: 0 0 0.75rem; font-size: 0.85rem; font-weight: 600; color: var(--text-color); }
    .wo-links-grid { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .wo-link {
      display: inline-flex; align-items: center; gap: 0.5rem;
      padding: 0.5rem 1rem; border-radius: 8px;
      background: var(--surface-section); border: 1px solid var(--surface-border);
      color: var(--text-color); text-decoration: none; font-size: 0.8rem; font-weight: 500;
      transition: all 0.2s ease;
    }
    .wo-link:hover {
      background: var(--brand-yellow-dark); border-color: var(--brand-yellow-dark);
      color: var(--brand-black); transform: translateY(-1px);
    }
    .wo-link i { font-size: 0.9rem; }
    .wo-footer { text-align: center; padding-top: 0.5rem; border-top: 1px solid var(--surface-border); }
    .wo-btn-primary {
      display: inline-flex; align-items: center; gap: 0.5rem;
      padding: 0.75rem 2rem; border: none; border-radius: 10px;
      background: var(--brand-yellow-dark); color: var(--brand-black);
      font-size: 0.9rem; font-weight: 700; font-family: inherit;
      cursor: pointer; transition: all 0.2s ease;
    }
    .wo-btn-primary:hover { background: var(--brand-yellow); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(233,185,2,0.3); }
    @media (max-width: 480px) {
      .wo-hero { padding: 1rem; }
      .wo-sections { gap: 0.5rem; }
      .wo-section { padding: 0.6rem 0.75rem; }
    }
  `]
})
export class WelcomeOnboardingComponent implements OnInit {
  visible = false;
  userName = '';
  roleLabel = '';
  sections: OnboardingSection[] = [];
  quickLinks: RoleQuickLink[] = [];

  private authService = inject(AuthService);

  private readonly STORAGE_KEY = 'ammi_onboarding_seen';

  ngOnInit(): void {
    // Desactivado a petición del usuario para no mostrar el mensaje de bienvenida de primera vez
    return;
  }

  dismiss(): void {
    this.visible = false;
    localStorage.setItem(this.STORAGE_KEY, 'true');
  }

  private buildContent(user: User): void {
    if (user.roles.some(r => r.nombre === 'ADMINISTRADOR')) {
      this.buildAdminContent();
    } else if (user.roles.some(r => r.nombre === 'ALUMNO')) {
      this.buildAlumnoContent();
    } else if (user.roles.some(r => r.nombre === 'PROFESOR')) {
      this.buildProfesorContent();
    } else if (user.roles.some(r => r.nombre === 'POSTULANTE')) {
      this.buildPostulanteContent();
    } else if (user.roles.some(r => r.nombre === 'MASTER-CONTABILIDAD')) {
      this.buildContabilidadContent();
    } else {
      this.buildDefaultContent();
    }
  }

  private buildAdminContent(): void {
    this.roleLabel = 'Administrador';
    this.sections = [
      { icon: 'pi pi-id-card', title: 'Gestión de Postulaciones', description: 'Revisa, aprueba o rechaza postulaciones de nuevos estudiantes. Gestiona cursos disponibles por ciclo.' },
      { icon: 'pi pi-book', title: 'Administración de Matrículas', description: 'Visualiza y gestiona las matrículas activas. Cambia paralelos, estados y accede al panel del estudiante.' },
      { icon: 'pi pi-users', title: 'Distributivo Docente', description: 'Asigna docentes a materias y cursos para cada ciclo lectivo.' },
      { icon: 'pi pi-credit-card', title: 'Módulo de Pagos', description: 'Gestiona pagos, valida transacciones y consulta el historial financiero de los estudiantes.' },
      { icon: 'pi pi-cog', title: 'Configuraciones del Sistema', description: 'Administra usuarios, roles, permisos, ciclos, especies, mallas curriculares y parámetros del sistema.' },
      { icon: 'pi pi-chart-bar', title: 'Reportes y Estadísticas', description: 'Accede a reportes operativos y financieros para la toma de decisiones.' },
    ];
    this.quickLinks = [
      { label: 'Postulaciones', route: '/dashboard/postulaciones/manage-postulations', icon: 'pi pi-id-card' },
      { label: 'Matrículas', route: '/dashboard/matriculas', icon: 'pi pi-book' },
      { label: 'Pagos', route: '/dashboard/pagos', icon: 'pi pi-credit-card' },
      { label: 'Configurar Cursos', route: '/dashboard/configurar-cursos-postulacion', icon: 'pi pi-sitemap' },
    ];
  }

  private buildAlumnoContent(): void {
    this.roleLabel = 'Alumno';
    this.sections = [
      { icon: 'pi pi-book', title: 'Mis Matrículas', description: 'Consulta tus matrículas activas, paralelos y estado académico actual.' },
      { icon: 'pi pi-credit-card', title: 'Mis Pagos', description: 'Revisa tus pagos registrados, descarga comprobantes y verifica tu estado financiero.' },
      { icon: 'pi pi-chart-bar', title: 'Calificaciones', description: 'Accede a tus notas y calificaciones por materia y ciclo lectivo.' },
    ];
    this.quickLinks = [
      { label: 'Mis Matrículas', route: '/dashboard/mis-materias', icon: 'pi pi-book' },
      { label: 'Mis Pagos', route: '/dashboard/mis-pagos', icon: 'pi pi-credit-card' },
      { label: 'Calificaciones', route: '/dashboard/mis-calificaciones', icon: 'pi pi-chart-bar' },
    ];
  }

  private buildProfesorContent(): void {
    this.roleLabel = 'Docente';
    this.sections = [
      { icon: 'pi pi-users', title: 'Distributivo', description: 'Consulta tu asignación de materias y cursos para el ciclo lectivo actual.' },
      { icon: 'pi pi-chart-bar', title: 'Calificaciones', description: 'Registra y gestiona las calificaciones de tus estudiantes por materia.' },
    ];
    this.quickLinks = [
      { label: 'Distributivo', route: '/dashboard/distributivo-docente', icon: 'pi pi-users' },
      { label: 'Calificaciones', route: '/dashboard/calificaciones', icon: 'pi pi-chart-bar' },
    ];
  }

  private buildPostulanteContent(): void {
    this.roleLabel = 'Postulante';
    this.sections = [
      { icon: 'pi pi-file', title: 'Mi Postulación', description: 'Consulta el estado de tu postulación y completa los requisitos pendientes.' },
      { icon: 'pi pi-upload', title: 'Subir Documentos', description: 'Adjunta los documentos requeridos para completar tu proceso de postulación.' },
    ];
    this.quickLinks = [
      { label: 'Mi Postulación', route: '/dashboard/mi-postulacion', icon: 'pi pi-file' },
      { label: 'Subir Documentos', route: '/dashboard/upload-requisitos', icon: 'pi pi-upload' },
    ];
  }

  private buildContabilidadContent(): void {
    this.roleLabel = 'Contabilidad';
    this.sections = [
      { icon: 'pi pi-credit-card', title: 'Gestión de Pagos', description: 'Administra y valida los pagos realizados por los estudiantes.' },
      { icon: 'pi pi-chart-bar', title: 'Reportes Financieros', description: 'Accede a reportes de recaudación, ingresos por período y estado de cuentas.' },
    ];
    this.quickLinks = [
      { label: 'Pagos', route: '/dashboard/pagos', icon: 'pi pi-credit-card' },
    ];
  }

  private buildDefaultContent(): void {
    this.roleLabel = 'Usuario';
    this.sections = [
      { icon: 'pi pi-info-circle', title: 'Bienvenido al Sistema', description: 'Explora las diferentes secciones del sistema usando el menú de navegación lateral.' },
      { icon: 'pi pi-user', title: 'Tu Perfil', description: 'Accede a la configuración de tu perfil desde el botón de ajustes en la esquina superior derecha.' },
    ];
    this.quickLinks = [];
  }
}
