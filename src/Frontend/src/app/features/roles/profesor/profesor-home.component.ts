import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService, User } from '../../../core/auth/index';
import { PersonaService } from '../../../core/services/postulaciones/persona.service';
import { DistributivoService } from '../../../core/services/infrastructure/distributivo.service';


interface QuickAction {
  title: string;
  description: string;
  icon: string;
  route: string;
  color: string;
}

@Component({
  selector: 'app-profesor-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './profesor-home.component.html',
  styleUrls: ['./profesor-home.component.css']
})
export class ProfesorHomeComponent implements OnInit {
  user: User | null = null;
  userName: string = '';
  loading = true;
  alerts: { type: string; message: string; materia: string }[] = [];

  private authService = inject(AuthService);
  private personaService = inject(PersonaService);
  private distributivoService = inject(DistributivoService);

  // KPIs
  kpis = {
    materiasAsignadas: 0,
    totalAlumnos: 0,
    totalHoras: 0
  };


  // Nueva estructura: carga docente agrupada
  cargaDocente: any = null;


  // Filtros para la nueva estructura
  searchTerm: string = '';
  selectedMalla: string = '';
  selectedParalelo: string = '';
  mallasDisponibles: string[] = [];
  paralelosDisponibles: string[] = [];

  // Acciones rápidas
  quickActions: QuickAction[] = [
    {
      title: 'Mi Distributivo',
      description: 'Consulta tus materias y paralelos asignados',
      icon: 'pi-id-card',
      route: '/dashboard/distributivo-docente',
      color: 'purple'
    },
    {
      title: 'Ingresar Calificaciones',
      description: 'Registra y gestiona las notas de tus alumnos',
      icon: 'pi-pencil',
      route: '/dashboard/calificaciones',
      color: 'blue'
    }
  ];

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
      if (user) {
        this.loadUserName();
        this.loadProfesorData();
      }
    });
  }

  private loadUserName(): void {
    if (this.user?.username) {
      this.personaService.getPersonaByIdPersona(this.user.id).subscribe((persona: any) => {
        if (persona && persona.length > 0) {
              this.userName = `${persona[0].primerNombre} ${persona[0].primerApellido}`;
        } else {
          this.userName = this.user?.username || 'Docente';
        }
      });
    } else {
      this.userName = this.user?.username || 'Docente';
    }
  }

  objectKeys(obj: any): string[] {
    return Object.keys(obj);
  }


  // Devuelve las mallas filtradas según los filtros actuales
  getMallasFiltradas(): any[] {
    if (!this.cargaDocente?.mallas) return [];
    return this.cargaDocente.mallas
      .filter((malla: any) => !this.selectedMalla || malla.nombreMalla === this.selectedMalla)
      .map((malla: any) => ({
        ...malla,
        materias: (malla.materias || [])
          .filter((materia: any) =>
            (!this.searchTerm || materia.nombreMateria.toLowerCase().includes(this.searchTerm.toLowerCase())) &&
            (!this.selectedParalelo || (materia.paralelos || []).some((p: any) => p.nombreParalelo === this.selectedParalelo))
          )
          .map((materia: any) => ({
            ...materia,
            paralelos: (materia.paralelos || [])
              .filter((p: any) => !this.selectedParalelo || p.nombreParalelo === this.selectedParalelo)
          }))
      }))
      .filter((malla: any) => (malla.materias || []).length > 0);
  }

  limpiarFiltros(): void {
    this.searchTerm = '';
    this.selectedMalla = '';
    this.selectedParalelo = '';
  }

  private loadProfesorData(): void {
    if (!this.user) return;
    this.loading = true;

    this.distributivoService.getCargaDocente(this.user.id).subscribe({
      next: (resp) => {
        // resp ya es el objeto completo recibido (con mallas, materias, paralelos)
        this.cargaDocente = resp;
        // KPIs
        this.kpis.materiasAsignadas = this.getTotalMaterias();
        this.kpis.totalAlumnos = this.getTotalAlumnos();
        this.kpis.totalHoras = this.getTotalHoras();
        
        // Filtros
        this.mallasDisponibles = this.cargaDocente?.mallas?.map((m: any) => m.nombreMalla) || [];
        this.paralelosDisponibles = this.getParalelosDisponibles();
        
        // Procesar alertas
        this.alerts = [];
        this.cargaDocente?.mallas?.forEach((m: any) => {
          m.materias?.forEach((mat: any) => {
            if (mat.statusPeriodo === 'GracePeriod') {
              this.alerts.push({
                type: 'warning',
                message: `⚠️ Prórroga para "${mat.nombreMateria}" - vence pronto`,
                materia: mat.nombreMateria
              });
            } else if (mat.statusPeriodo === 'Closed') {
              this.alerts.push({
                type: 'error',
                message: `🔒 Plazo vencido para "${mat.nombreMateria}"`,
                materia: mat.nombreMateria
              });
            }
          });
        });

        this.loading = false;
      },
      error: () => {
        this.cargaDocente = null;
        this.loading = false;
      }
    });
  }

  // Métodos auxiliares para KPIs y filtros
  getTotalMaterias(): number {
    if (!this.cargaDocente?.mallas) return 0;
    return this.cargaDocente.mallas.reduce((acc: number, m: any) => acc + (m.materias?.length || 0), 0);
  }

  getTotalAlumnos(): number {
    if (!this.cargaDocente?.totalAlumnos) return 0;
    return this.cargaDocente.totalAlumnos;
  }

  getTotalHoras(): number {
    if (!this.cargaDocente?.totalHoras) return 0;
    return this.cargaDocente.totalHoras;
  }

  getParalelosDisponibles(): string[] {
    if (!this.cargaDocente?.mallas) return [];
    const paralelos = new Set<string>();
    this.cargaDocente.mallas.forEach((m: any) => {
      m.materias?.forEach((mat: any) => {
        mat.paralelos?.forEach((p: any) => paralelos.add(p.nombreParalelo));
      });
    });
    return Array.from(paralelos).sort();
  }
}
