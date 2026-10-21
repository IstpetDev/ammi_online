import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { AuthService, User } from '../../../core/auth/index';
import { PersonaService } from '../../../core/services/postulaciones/persona.service';
import { PostulacionService } from '../../../core/services/postulaciones/postulacion.service';
import { PaginatedPostulacionesResponse } from '../../../core/services/postulaciones/postulacion.service';
import { PostulacionByDocumentoDTO } from '../../../data/models/Entities';

interface QuickAction {
  title: string;
  description: string;
  icon: string;
  route: string;
  color: string;
}

// Mapeo de estado a info visual
const ESTADO_INFO: Record<string, { label: string; severity: string; icon: string }> = {
  'CONTACTO PERSONA':    { label: 'Contacto Pendiente',    severity: 'info',      icon: 'pi-phone' },
  'ESPERA DOCUMENTOS':   { label: 'Espera Documentos',     severity: 'warning',   icon: 'pi-upload' },
  'DOCUMENTOS REVISION': { label: 'Documentos en Revisión', severity: 'info',      icon: 'pi-search' },
  'ESPERA APROBACIÓN':   { label: 'Espera Aprobación',     severity: 'info',      icon: 'pi-clock' },
  'APROBADO':            { label: 'Aprobada',              severity: 'success',   icon: 'pi-check-circle' },
  'RECHAZADO':           { label: 'Rechazada',             severity: 'danger',    icon: 'pi-times-circle' },
  'FINALIZADO':          { label: 'Finalizada',            severity: 'success',   icon: 'pi-check-circle' },
};

// Orden del flujo de estados para el timeline
const ESTADO_ORDER: string[] = [
  'CONTACTO PERSONA',
  'ESPERA DOCUMENTOS',
  'DOCUMENTOS REVISION',
  'ESPERA APROBACIÓN',
  'APROBADO',
];

@Component({
  selector: 'app-postulante-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './postulante-home.component.html',
  styleUrls: ['./postulante-home.component.css']
})
export class PostulanteHomeComponent implements OnInit {
  user: User | null = null;
  userName: string = '';
  loading = true;

  postulacion: PaginatedPostulacionesResponse | null = null;
  sinPostulacion = false;

  private authService = inject(AuthService);
  private personaService = inject(PersonaService);
  private postulacionService = inject(PostulacionService);

  quickActions: QuickAction[] = [
    {
      title: 'Ver mi Postulación',
      description: 'Consulta el estado detallado de tu solicitud',
      icon: 'pi-file',
      route: '/dashboard/mi-postulacion',
      color: 'orange'
    },
    {
      title: 'Subir Documentos',
      description: 'Carga los requisitos para tu postulación',
      icon: 'pi-upload',
      route: '/dashboard/mi-postulacion',
      color: 'blue'
    },
  ];

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
      if (user) {
        this.loadUserName();
        this.loadPostulacion();
      }
    });
  }

  private loadUserName(): void {
    if (this.user?.username) {
      this.personaService.getPersonaByIdPersona(this.user.id).subscribe((persona: any) => {
        if (persona && persona.length > 0) {
              this.userName = `${persona[0].primerNombre} ${persona[0].primerApellido}`;
        } else {
          this.userName = this.user?.username || 'Postulante';
        }
      });
    } else {
      this.userName = this.user?.username || 'Postulante';
    }
  }

  private loadPostulacion(): void {
    if (!this.user?.username) {
      this.loading = false;
      return;
    }

    this.postulacionService.getPostulacionByDocumento(this.user.username).pipe(
      catchError(() => of(null))
    ).subscribe(postulacion => {
      this.postulacion = postulacion;
      this.sinPostulacion = !postulacion || !postulacion.items || postulacion.items.length === 0;
      this.loading = false;
    });
  }

  getEstadoInfo(estado?: string): { label: string; severity: string; icon: string } {
    if (!estado) return { label: 'Sin estado', severity: 'secondary', icon: 'pi-question-circle' };
    return ESTADO_INFO[estado.toUpperCase().trim()] || { label: estado, severity: 'secondary', icon: 'pi-info-circle' };
  }

  get nombrePrograma(): string {
    const malla = this.postulacion?.items[0]?.malla;
    const curso = malla?.curso?.detalle || '';
    const modalidad = malla?.tipooferta?.detalle || '';
    return [curso, modalidad].filter(Boolean).join(' — ');
  }

  get cicloDetalle(): string {
    const ciclo = this.postulacion?.items[0]?.malla?.mallaCiclo?.ciclo;
    if (!ciclo) return '';
    const periodo = ciclo.periodo?.detalle || '';
    const regimen = ciclo.regimen?.detalle || '';
    return [periodo, regimen, ciclo.detalle].filter(Boolean).join(' · ');
  }

  /**
   * Determina la clase CSS del paso del timeline:
   * - 'timeline-step--done'   : ya fue superado
   * - 'timeline-step--active' : estado actual
   * - ''                      : aún no alcanzado
   */
  getTimelineClass(stepEstado: string): string {
    const currentRaw = this.postulacion?.items[0]?.tipoestadoaprobacion?.detalle?.toUpperCase()?.trim() || '';
    // Si está FINALIZADO o APROBADO, todos los pasos están completos
    if (currentRaw === 'FINALIZADO' || currentRaw === 'APROBADO') {
      return 'timeline-step--done';
    }
    const currentIdx = ESTADO_ORDER.indexOf(currentRaw);
    const stepIdx    = ESTADO_ORDER.indexOf(stepEstado.toUpperCase());
    if (stepIdx === -1 || currentIdx === -1) return '';
    if (stepIdx < currentIdx)  return 'timeline-step--done';
    if (stepIdx === currentIdx) return 'timeline-step--active';
    return '';
  }
}
