import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthService, User } from '../../../core/auth/index';
import { PostulacionService } from '../../../core/services/postulaciones/postulacion.service';
import { PersonaService } from '../../../core/services/postulaciones/persona.service';
import { AlumnoHomeComponent } from '../alumno/alumno-home.component';
import { ProfesorHomeComponent } from '../profesor/profesor-home.component';
import { PostulanteHomeComponent } from '../postulante/postulante-home.component';
import { MasterContabilidadHomeComponent } from '../master-contabilidad/master-contabilidad-home.component';
import { SecretariaGeneralHomeComponent } from '../secretaria-general/secretaria-general-home/secretaria-general-home';
import { WelcomeOnboardingComponent } from '../../../shared/welcome-onboarding/welcome-onboarding.component';

interface QuickAction {
  title: string;
  description: string;
  icon: string;
  route: string;
  color: string;
}

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    AlumnoHomeComponent,
    ProfesorHomeComponent,
    PostulanteHomeComponent,
    MasterContabilidadHomeComponent,
    SecretariaGeneralHomeComponent,
    WelcomeOnboardingComponent
  ],
  templateUrl: './dashboard-home.component.html',
  styleUrls: ['./dashboard-home.component.css']
})
export class DashboardHomeComponent implements OnInit {
  user: User | null = null;
  userName: string = '';
  isLoading = true;

  private authService = inject(AuthService);
  private postulacionService = inject(PostulacionService);
  private personaService = inject(PersonaService);

  // ─── KPIs Fila 1 (Solo Postulaciones) ─────────────────────────
  kpis = {
    totalPostulaciones: 0,
    postulacionesPendientes: 0,
    postulacionesAprobadas: 0,
    postulacionesRechazadas: 0
  };

  // ─── Acciones Rápidas (Solo Postulaciones y Cursos) ───────────
  quickActions: QuickAction[] = [
    {
      title: 'Gestionar Postulaciones',
      description: 'Revisar y aprobar postulaciones pendientes',
      icon: 'pi-file',
      route: '/dashboard/postulaciones/manage-postulations',
      color: 'blue'
    },
    {
      title: 'Configurar Cursos',
      description: 'Habilitar cursos para postulaciones del ciclo',
      icon: 'pi-sitemap',
      route: '/dashboard/configurar-cursos-postulacion',
      color: 'indigo'
    }
  ];

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
      if (this.hasRole('ADMINISTRADOR')) {
        this.loadUserName();
        this.loadDashboardData();
      }
    });
  }

  hasRole(roleName: string): boolean {
    return this.user?.roles.some(r => r.nombre === roleName) || false;
  }

  private loadUserName(): void {
    if (this.user?.id) {
      this.personaService.getPersonaByIdPersona(this.user.id).subscribe((persona: any) => {
        if (persona && persona.length > 0) {
          this.userName = `${persona[0].primerNombre} ${persona[0].primerApellido}`;
        } else {
          this.userName = this.user?.username || 'Administrador';
        }
      });
    } else {
      this.userName = this.user?.username || 'Administrador';
    }
  }

  private loadDashboardData(): void {
    this.isLoading = true;
    this.postulacionService.getPostulacionesFromAPI().pipe(
      catchError(() => of([]))
    ).subscribe({
      next: (postulaciones: any[]) => {
        const safePost = postulaciones || [];
        this.processPostulaciones(safePost);
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  private processPostulaciones(postulaciones: any[]): void {
    this.kpis.totalPostulaciones = postulaciones.length;
    this.kpis.postulacionesAprobadas = postulaciones.filter(p => p?.Estado === 'APROBADO').length;
    this.kpis.postulacionesRechazadas = postulaciones.filter(p => p?.Estado === 'RECHAZADO').length;
    this.kpis.postulacionesPendientes = postulaciones.filter(p =>
      p?.Estado === 'ESPERA APROBACIÓN' || p?.Estado === 'ESPERA DOCUMENTOS' ||
      p?.Estado === 'DOCUMENTOS REVISION' || p?.Estado === 'CONTACTO PERSONA'
    ).length;
  }

  getProcesoPercentage(tipo: 'postulacionesPendientes' | 'postulacionesAprobadas' | 'postulacionesRechazadas'): number {
    if (this.kpis.totalPostulaciones === 0) return 0;
    return Math.round((this.kpis[tipo] / this.kpis.totalPostulaciones) * 100);
  }

  get currentMonth(): string {
    return new Date().toLocaleDateString('es-EC', { month: 'long', year: 'numeric' });
  }
}
