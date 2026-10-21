import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

// Services
import { AuthService } from '../../../core/auth/auth.service';
import { MatriculaService } from '../../../core/services/postulaciones/matricula.service';
import { ToastService } from '../../../shared/toast.service';

// Components
import { SharedHeaderComponent } from '../../../shared/shared-header/shared-header.component';
import { SharedToastComponent } from '../../../shared/shared-toast/shared-toast.component';

// Models
import {
  HistorialAcademicoDTO,
  MallaHistorialDTO
} from '../../../data/models/matricula';

@Component({
  selector: 'app-mis-materias',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SharedHeaderComponent,
    SharedToastComponent
  ],
  templateUrl: './mis-materias.component.html',
  styleUrl: './mis-materias.component.css'
})
export class MisMateriasComponent implements OnInit {
  private authService = inject(AuthService);
  private matriculaService = inject(MatriculaService);
  private toastService = inject(ToastService);

  historial: HistorialAcademicoDTO | null = null;
  loading = false;
  error: string | null = null;

  // Filtro de búsqueda
  searchTerm: string = '';

  // Control de expansión de materias (Acordeón)
  materiasExpandidas = new Set<number>();
  ciclosExpandidos = new Set<number>();

  ngOnInit(): void {
    this.cargarMaterias();
  }

  cargarMaterias(): void {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.error = 'Usuario no autenticado';
      return;
    }
    this.loading = true;
    this.error = null;
    this.matriculaService.getHistorialCompleto(user.id).subscribe({
      next: (data) => {
        this.historial = data;
        this.loading = false;
        this.inicializarExpansiones();
      },
      error: (err) => {
        this.error = 'Error al cargar las materias: ' + (err?.message || 'Intente nuevamente');
        this.loading = false;
        this.toastService.showError(this.error, 'Error');
      }
    });
  }

  private inicializarExpansiones(): void {
    if (!this.historial?.mallas) return;
    this.materiasExpandidas.clear();
    this.ciclosExpandidos.clear();

    // Mantener los ciclos abiertos pero todas las materias cerradas por defecto
    for (const malla of this.historial.mallas) {
      for (const ciclo of malla.ciclos) {
        this.ciclosExpandidos.add(ciclo.idCiclo);
      }
    }
  }

  toggleMateria(idDetalleMalla: number, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (this.materiasExpandidas.has(idDetalleMalla)) {
      this.materiasExpandidas.delete(idDetalleMalla);
    } else {
      this.materiasExpandidas.add(idDetalleMalla);
    }
  }

  isMateriaExpanded(idDetalleMalla: number): boolean {
    return this.materiasExpandidas.has(idDetalleMalla);
  }

  toggleCiclo(idCiclo: number): void {
    if (this.ciclosExpandidos.has(idCiclo)) {
      this.ciclosExpandidos.delete(idCiclo);
    } else {
      this.ciclosExpandidos.add(idCiclo);
    }
  }

  isCicloExpanded(idCiclo: number): boolean {
    return this.ciclosExpandidos.has(idCiclo);
  }

  expandirTodas(): void {
    if (!this.historial?.mallas) return;
    for (const malla of this.historial.mallas) {
      for (const ciclo of malla.ciclos) {
        this.ciclosExpandidos.add(ciclo.idCiclo);
        for (const mat of ciclo.materias) {
          this.materiasExpandidas.add(mat.idDetalleMalla);
        }
      }
    }
  }

  colapsarTodas(): void {
    this.materiasExpandidas.clear();
  }

  isMateriaVisible(materia: any): boolean {
    // Si la materia ya fue calificada o aprobada, se mantiene en el historial
    if (materia.notaFinal !== null && materia.notaFinal !== undefined) return true;
    if (materia.estado?.toLowerCase() === 'aprobado') return true;

    // Para materias en curso o pendientes: solo se muestran si el período de notas está activo
    if (materia.periodoActivo !== undefined) {
      return materia.periodoActivo;
    }

    // Fallback con fechas si no viniera calculado
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    if (materia.fechaInicio) {
      const inicio = new Date(materia.fechaInicio); inicio.setHours(0, 0, 0, 0);
      if (hoy < inicio) return false;
    }
    if (materia.fechaFin) {
      const fin = new Date(materia.fechaFin); fin.setHours(0, 0, 0, 0);
      const gracia = materia.diasGracia ?? 5;
      const limite = new Date(fin); limite.setDate(limite.getDate() + gracia);
      if (hoy > limite) return false;
    }
    return true;
  }

  getMallasFiltradas(): MallaHistorialDTO[] {
    if (!this.historial?.mallas) return [];
    const term = this.searchTerm.toLowerCase().trim();
    return this.historial.mallas
      .map(malla => ({
        ...malla,
        ciclos: malla.ciclos
          .map(ciclo => ({
            ...ciclo,
            materias: ciclo.materias.filter(m =>
              this.isMateriaVisible(m) &&
              (!term || m.nombreMateria.toLowerCase().includes(term))
            )
          }))
          .filter(c => c.materias.length > 0)
      }))
      .filter(m => m.ciclos.length > 0);
  }

  getTotalMaterias(): number {
    return this.historial?.mallas?.reduce((t, m) =>
      t + m.ciclos.reduce((tc, c) => tc + c.materias.length, 0), 0) ?? 0;
  }

  getEstadoSeverity(estado: string | null): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
    switch (estado?.toLowerCase()) {
      case 'aprobado': return 'success';
      case 'reprobado': return 'danger';
      case 'en curso': return 'info';
      default: return 'secondary';
    }
  }

  /**
   * Determina el estado a mostrar en la UI para una materia.
   * Si no hay notaFinal ni examenRemedial, mostramos "En curso" aunque el campo estado diga "Reprobado".
   */
  getEstadoMostrar(materia: any): string {
    if (!materia) return 'En curso';
    const nf = materia.notaFinal;
    const rem = materia.examenRemedial;

    // Si no hay valores numéricos aún, consideramos que sigue en curso
    if ((nf === null || nf === undefined) && (rem === null || rem === undefined)) {
      return 'En curso';
    }

    // Si existe un estado explícito, lo respetamos
    if (materia.estado) return materia.estado;

    // Fallback usando notaFinal si está disponible
    if (nf !== null && nf !== undefined) {
      return nf >= 7 ? 'Aprobado' : 'Reprobado';
    }

    return 'En curso';
  }
}
