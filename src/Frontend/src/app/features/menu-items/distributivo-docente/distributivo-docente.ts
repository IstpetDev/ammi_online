
// (Removed all stray/duplicate buildAsignacion methods. The correct method will be inside the class below.)
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { SharedToastComponent } from '../../../shared/shared-toast/shared-toast.component';
import { SharedHeaderComponent } from '../../../shared/shared-header/shared-header.component';
import { SharedEmptyStateComponent } from '../../../shared/shared-empty-state/shared-empty-state.component';
import { CustomSelectComponent } from '../../../shared/custom-select/custom-select.component';

// Services
import { AuthService } from '../../../core/auth/auth.service';
import { DistributivoService } from '../../../core/services/infrastructure/distributivo.service';

// Models


@Component({
  selector: 'app-distributivo-docente',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    CardModule,
    ProgressSpinnerModule,
    SharedToastComponent,
    SharedHeaderComponent,
    SharedEmptyStateComponent,
    CustomSelectComponent,
  ],
  templateUrl: './distributivo-docente.html',
  styleUrls: ['./distributivo-docente.css'],
  providers: [MessageService]
})
export class DistributivoDocente implements OnInit {
  private authService = inject(AuthService);
  private distributivoService = inject(DistributivoService);
  private messageService = inject(MessageService);

  cargaDocente: any = null;
  loading = false;
  error: string | null = null;

  // Filtros
  searchTerm: string = '';
  selectedMalla: string = '';
  selectedParalelo: string = '';
  mallasDisponibles: { label: string, value: string }[] = [];
  paralelosDisponibles: { label: string, value: string }[] = [];

  ngOnInit(): void {
    this.cargarCargaDocente();
  }

  cargarCargaDocente(): void {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.error = 'Usuario no autenticado';
      return;
    }

    this.loading = true;
    this.error = null;

    this.distributivoService.getCargaDocente(user.id).subscribe({
      next: (resp) => {
        this.cargaDocente = resp;
        // Poblar listas de filtros
        this.mallasDisponibles = (this.cargaDocente?.mallas?.map((m: any) => ({ label: m.nombreMalla, value: m.nombreMalla })) || []);
        this.paralelosDisponibles = this.getParalelosDisponibles().map((p: string) => ({ label: p, value: p }));
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar asignaciones: ' + err.message;
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: this.error
        });
      }
    });
  }

  getParalelosDisponibles(): string[] {
    if (!this.cargaDocente?.mallas) return [];
    const paralelos = new Set<string>();
    this.cargaDocente.mallas.forEach((m: any) => {
      (m.materias || []).forEach((mat: any) => {
        // soportar distintas formas del API: 'paralelos' o 'paralelo'
        const lista = mat.paralelos || mat.paralelo || [];
        (lista || []).forEach((p: any) => {
          const nombre = this.buildParaleloLabel(p);
          if (nombre) paralelos.add(nombre);
        });
      });
    });
    return Array.from(paralelos).sort();
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
            (!this.selectedParalelo || ((materia.paralelos || materia.paralelo || []).some((p: any) => this.buildParaleloLabel(p) === this.selectedParalelo)))
          )
          .map((materia: any) => ({
            ...materia,
            paralelos: (materia.paralelos || materia.paralelo || [])
              .filter((p: any) => !this.selectedParalelo || this.buildParaleloLabel(p) === this.selectedParalelo)
          }))
      }))
      .filter((malla: any) => (malla.materias || []).length > 0);
  }

  /**
   * Devuelve los paralelos agrupados por malla.
   * Cada grupo tiene: idParalelo, nombreParalelo (puede ser generado), materias: []
   */
  getParalelosPorMalla(malla: any): any[] {
    const map = new Map<any, any>();
    (malla.materias || []).forEach((materia: any) => {
      const lista = materia.paralelos || materia.paralelo || [];
      (lista || []).forEach((p: any) => {
        const key = p?.idParalelo != null ? p.idParalelo : (p?.nombreParalelo || JSON.stringify(p));
        if (!map.has(key)) {
          map.set(key, {
            idParalelo: p?.idParalelo ?? null,
            nombreParalelo: p?.nombreParalelo || null,
            materias: [] as any[],
          });
        }
        const group = map.get(key);
        group.materias.push({
          idDetalleMalla: materia.idDetalleMalla,
          nombreMateria: materia.nombreMateria,
          horas: materia.horas,
          cantidadAlumnos: p?.cantidadAlumnos ?? 0,
          nombrePlantilla:
            p?.nombrePlantilla ||
            p?.plantilla?.nombre ||
            p?.plantillaEvaluacion?.nombre ||
            p?.nombrePlantillaEvaluacion ||
            null,
        });
      });
    });

    // Convertir a array y ordenar por idParalelo (si existe)
    const arr = Array.from(map.values());
    arr.sort((a: any, b: any) => {
      const ai = a.idParalelo ?? 9999;
      const bi = b.idParalelo ?? 9999;
      return ai - bi;
    });
    return arr;
  }

  paraleloLabel(par: any): string {
    return this.buildParaleloLabel(par) || 'Paralelo';
  }

  private buildParaleloLabel(p: any): string {
    if (!p) return '';
    const nombre = p?.nombreParalelo || p?.nombre || p?.paralelo || '';
    if (nombre && String(nombre).trim()) return String(nombre).trim();

    const id = p?.idParalelo;
    if (id == null) return '';

    const index = Number(id);
    if (isNaN(index)) return `Paralelo ${id}`;

    const letter = String.fromCharCode(64 + Math.min(Math.max(index, 1), 26));
    return `Paralelo ${letter}`;
  }

  limpiarFiltros(): void {
    this.searchTerm = '';
    this.selectedMalla = '';
    this.selectedParalelo = '';
  }

}

