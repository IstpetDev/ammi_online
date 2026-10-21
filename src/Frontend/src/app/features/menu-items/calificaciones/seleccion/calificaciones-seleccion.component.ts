import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';

import { AuthService } from '../../../../core/auth/auth.service';
import { DistributivoService } from '../../../../core/services/infrastructure/distributivo.service';
import { ParaleloService } from '../../../../core/services/infrastructure/paralelo.service';
import { DetalleMallaService } from '../../../../core/services/infrastructure/detalle-malla.service';
import { CicloService } from '../../../../core/services/postulaciones/ciclo.service';
import { MallaService } from '../../../../core/services/postulaciones/malla.service';
import { PeriodoLectivoService } from '../../../../core/services/postulaciones/periodo-lectivo.service';

import { DetalleMallaDTO } from '../../../../data/models/detalle-malla/detalle-malla.model';
import { CicloDTO, MallaDTO, PeriodoLectivoDTO } from '../../../../data/models/Entities';
import { DistributivoDTO } from '../../../../data/models/distributivo';
import { CustomSelectComponent } from '../../../../shared/custom-select/custom-select.component';
import { SharedEmptyStateComponent } from '../../../../shared/shared-empty-state/shared-empty-state.component';
import { SharedChipComponent } from '../../../../shared/shared-chip/shared-chip.component';
import { CalificacionesStateService } from '../calificaciones.state.service';
import { SharedToastComponent } from '../../../../shared/shared-toast/shared-toast.component';

interface ParaleloConMalla {
  idMallaParalelo?: number;
  idParalelo: number;
  nombreParalelo: string;
  alumnosMatriculados?: number;
  esActivo?: boolean;
  [key: string]: any;
}

@Component({
  selector: 'app-calificaciones-seleccion',
  standalone: true,
  imports: [CommonModule, FormsModule,
    CardModule, ButtonModule, ProgressSpinnerModule, CustomSelectComponent, SharedEmptyStateComponent, SharedChipComponent, SharedToastComponent],
  templateUrl: './calificaciones-seleccion.component.html',
  styleUrls: ['./calificaciones-seleccion.component.css']
})
export class CalificacionesSeleccionComponent implements OnInit {
  private authService = inject(AuthService);
  private distributivoService = inject(DistributivoService);
  private paraleloService = inject(ParaleloService);
  private detalleMallaService = inject(DetalleMallaService);
  private cicloService = inject(CicloService);
  private mallaService = inject(MallaService);
  private periodoLectivoService = inject(PeriodoLectivoService);
  private router = inject(Router);
  private stateService = inject(CalificacionesStateService);
  private messageService = inject(MessageService);

  esDocente = false;
  esAdmin = false;
  idUsuarioActual = 0;

  loading = false;
  error = '';

  // Teacher data
  cargaDocente: any = null;
  docenteSearchTerm = '';
  docenteSelectedParalelo = '';
  docenteSelectedMalla = '';
  paralelosDisponibles: any[] = [];
  mallasDisponibles: any[] = [];
  paraleloNombrePorId: Map<number, string> = new Map();

  // Admin data
  todosLosCiclos: CicloDTO[] = [];
  ciclos: CicloDTO[] = [];
  periodosLectivos: PeriodoLectivoDTO[] = [];
  mallas: MallaDTO[] = [];
  detallesMalla: DetalleMallaDTO[] = [];

  _filtroPeriodoLectivo: PeriodoLectivoDTO | null = null;
  _filtroCiclo: CicloDTO | null = null;
  _filtroMalla: MallaDTO | null = null;
  _filtroMateria: DetalleMallaDTO | null = null;

  selectedPeriodo: any = null;
  selectedCiclo: any = null;
  selectedMalla: any = null;
  selectedMateria: any = null;

  get filtroPeriodoLectivo(): PeriodoLectivoDTO | null { return this._filtroPeriodoLectivo; }
  set filtroPeriodoLectivo(value: PeriodoLectivoDTO | null) {
    this._filtroPeriodoLectivo = value;
    this._filtroCiclo = null;
    this._filtroMalla = null;
    this._filtroMateria = null;
    this.selectedPeriodo = value?.idPeriodoLectivo ?? null;
    this.selectedCiclo = null;
    this.selectedMalla = null;
    this.selectedMateria = null;
    this.ciclos = [];
    this.mallas = [];
    this.detallesMalla = [];
    if (value) {
      this.cargarCiclosPorPeriodo(value.idPeriodoLectivo!);
      if (this.ciclos.length > 0) {
        this.filtroCiclo = this.ciclos[0];
      }
    }
  }

  get filtroCiclo(): CicloDTO | null { return this._filtroCiclo; }
  set filtroCiclo(value: CicloDTO | null) {
    this._filtroCiclo = value;
    this._filtroMalla = null;
    this._filtroMateria = null;
    this.selectedCiclo = value?.idCiclo ?? null;
    this.selectedMalla = null;
    this.selectedMateria = null;
    this.mallas = [];
    this.detallesMalla = [];
    if (value) this.cargarMallas();
  }

  get filtroMalla(): MallaDTO | null { return this._filtroMalla; }
  set filtroMalla(value: MallaDTO | null) {
    this._filtroMalla = value;
    this._filtroMateria = null;
    this.selectedMalla = value?.idMalla ?? null;
    this.selectedMateria = null;
    this.detallesMalla = [];
    if (value) this.cargarDetallesMalla(value.idMalla!);
  }

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.idUsuarioActual = user.id;
      this.esDocente = this.authService.hasRole('PROFESOR');
      this.esAdmin = this.authService.hasRole('ADMINISTRADOR');
      if (this.esDocente && !this.esAdmin) {
        this.cargarAsignacionesDocente();
      } else if (this.esAdmin) {
        this.cargarTodosDistributivos();
      }
    }
  }

  cargarAsignacionesDocente(): void {
    this.loading = true; this.error = '';
    forkJoin({
      carga: this.distributivoService.getCargaDocente(this.idUsuarioActual),
      paralelos: this.paraleloService.getAllParalelos().pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ carga, paralelos }) => {
        this.paraleloNombrePorId = new Map(
          (paralelos || []).filter((p: any) => p?.idParalelo != null)
            .map((p: any) => [p.idParalelo, (p.nombreParalelo || p.detalle || `Paralelo ${p.idParalelo}`).toString().trim()])
        );
        this.cargaDocente = carga;
        this.aplicarNombresParalelosDocente();
        this.mallasDisponibles = (this.cargaDocente?.mallas?.map((m: any) => ({ label: m.nombreMalla, value: m.nombreMalla })) || []);
        this.paralelosDisponibles = this.getParalelosDisponiblesDocente().map((p: string) => ({ label: p, value: p }));
        this.loading = false;
        if (!this.cargaDocente?.mallas || this.cargaDocente.mallas.length === 0) {
          this.error = 'No tienes asignaciones de materias/paralelos activas.';
        }
      },
      error: () => { this.error = 'Error al cargar asignaciones.'; this.loading = false; }
    });
  }

  cargarTodosDistributivos(): void {
    this.loading = true;
    forkJoin({
      periodos: this.periodoLectivoService.getPeriodosLectivos(),
      ciclos: this.cicloService.getAll()
    }).subscribe({
      next: ({ periodos, ciclos }) => {
        this.periodosLectivos = periodos || [];
        this.todosLosCiclos = ciclos || [];

        const savedPeriodoId = this.stateService.savedPeriodoId;
        const savedCicloId = this.stateService.savedCicloId;

        if (savedPeriodoId) {
          this.filtroPeriodoLectivo = this.periodosLectivos.find(p => p.idPeriodoLectivo === savedPeriodoId) || null;
          if (savedCicloId) {
            const foundCiclo = this.ciclos.find(c => c.idCiclo === savedCicloId);
            if (foundCiclo) {
              this.filtroCiclo = foundCiclo;
            }
          }
        } else if (this.periodosLectivos.length > 0) {
          this.filtroPeriodoLectivo = this.periodosLectivos[0];
        }
        this.loading = false;
      },
      error: () => { this.error = 'Error al cargar datos'; this.loading = false; }
    });
  }

  cargarCiclosPorPeriodo(idPeriodoLectivo: number): void {
    this.ciclos = (this.todosLosCiclos || []).filter(c => c && c.idPeriodo === idPeriodoLectivo && c.esActivo === true);
  }

  cargarMallas(): void {
    if (!this._filtroCiclo) { this.mallas = []; return; }
    this.loading = true;
    this.mallaService.getMallasByParams({ IdCiclo: this._filtroCiclo.idCiclo }).subscribe({
      next: (response: any) => {
        this.mallas = response.items ?? response ?? [];
        this.loading = false;
        const savedMallaId = this.stateService.savedMallaId;
        if (savedMallaId) {
          const found = this.mallas.find(m => m.idMalla === savedMallaId);
          if (found) {
            this.filtroMalla = found;
          }
        }
      },
      error: () => { this.mallas = []; this.loading = false; }
    });
  }

  cargarDetallesMalla(idMalla: number): void {
    this.loading = true;
    this.detalleMallaService.getByMalla(idMalla, 1, 800).subscribe({
      next: (response: any) => {
        this.detallesMalla = response?.items ?? response ?? [];
        this.loading = false;
        const savedMateriaId = this.stateService.savedMateriaId;
        if (savedMateriaId) {
          const found = this.detallesMalla.find(dm => dm.idDetalleMalla === savedMateriaId);
          if (found) {
            this._filtroMateria = found;
            this.selectedMateria = found.idDetalleMalla;
          }
        }
      },
      error: () => { this.detallesMalla = []; this.loading = false; }
    });
  }

  getMallasFiltradasDocente(): any[] {
    if (!this.cargaDocente?.mallas) return [];
    return this.cargaDocente.mallas
      .filter((m: any) => !this.docenteSelectedMalla || m.nombreMalla === this.docenteSelectedMalla)
      .map((m: any) => ({
        ...m, materias: (m.materias || []).filter((mat: any) =>
          this.isPeriodoActivo(mat) &&
          (!this.docenteSearchTerm || mat.nombreMateria.toLowerCase().includes(this.docenteSearchTerm.toLowerCase())) &&
          (!this.docenteSelectedParalelo || (mat.paralelo || mat.paralelos || []).some((p: any) => p.nombreParalelo === this.docenteSelectedParalelo))
        ).map((mat: any) => ({
          ...mat, paralelos: (mat.paralelo || mat.paralelos || []).filter((p: any) => !this.docenteSelectedParalelo || p.nombreParalelo === this.docenteSelectedParalelo)
        }))
      }))
      .map((m: any) => ({ ...m, materias: this.getMateriasVisibles(m) }))
      .filter((m: any) => (m.materias || []).length > 0);
  }

  getTotalParalelosMateria(materia: any): number {
    const paralelos = materia?.paralelos || materia?.paralelo || [];
    return Array.isArray(paralelos) ? paralelos.length : 0;
  }

  getTotalAlumnosMateria(materia: any): number {
    const paralelos = materia?.paralelos || materia?.paralelo || [];
    if (!Array.isArray(paralelos)) return 0;
    return paralelos.reduce((total: number, p: any) => total + Number(p?.cantidadAlumnos ?? p?.alumnosMatriculados ?? 0), 0);
  }

  private normalizarParalelosMateria(paralelos: ParaleloConMalla[]): ParaleloConMalla[] {
    if (!Array.isArray(paralelos)) return [];
    const soloActivos = paralelos.filter(p => p?.esActivo !== false);
    const base = soloActivos.length > 0 ? soloActivos : paralelos;
    const porParalelo = new Map<number, ParaleloConMalla>();
    base.forEach(p => { const key = p.idParalelo ?? p.idMallaParalelo; if (key == null) return; if (!porParalelo.has(key)) porParalelo.set(key, p); });
    return Array.from(porParalelo.values()).sort((a, b) => (a.nombreParalelo || '').localeCompare(b.nombreParalelo || ''));
  }

  private normalizarNombreParalelo(paralelo: any): string {
    const actual = (paralelo?.nombreParalelo ?? '').toString().trim();
    if (actual) return actual;
    const id = paralelo?.idParalelo;
    const desdeMapa = id != null ? this.paraleloNombrePorId.get(id) : undefined;
    return desdeMapa || (id != null ? `Paralelo ${id}` : 'Paralelo');
  }

  private aplicarNombresParalelosDocente(): void {
    if (!this.cargaDocente?.mallas) return;
    this.cargaDocente = {
      ...this.cargaDocente,
      mallas: this.cargaDocente.mallas.map((malla: any) => ({
        ...malla,
        materias: (malla.materias || []).map((materia: any) => {
          const paralelosBase = materia.paralelos || materia.paralelo || [];
          const normalizados = (paralelosBase || []).map((p: any) => ({ ...p, nombreParalelo: this.normalizarNombreParalelo(p) }));
          return { ...materia, paralelos: normalizados, paralelo: normalizados };
        })
      }))
    };
  }

  getParalelosDisponiblesDocente(): string[] {
    if (!this.cargaDocente?.mallas) return [];
    const paralelos = new Set<string>();
    this.cargaDocente.mallas.forEach((m: any) => {
      m.materias?.forEach((mat: any) => {
        (mat.paralelos || mat.paralelo || []).forEach((p: any) => {
          const nombre = this.normalizarNombreParalelo(p);
          if (nombre) paralelos.add(nombre);
        });
      });
    });
    return Array.from(paralelos).sort();
  }

  getMateriasConParalelos(): any[] {
    return this.detallesMalla
      .map((materia: any) => ({
        ...materia,
        paralelos: this.getParalelosVisibles({ paralelos: this.normalizarParalelosMateria(materia.paralelo || []) })
      }))
      .filter((m: any) => m.paralelos.length > 0);
  }

  getEstadoParalelo(materia: any, paralelo: any): { clase: string; texto: string; } {
    const alumnos = paralelo?.cantidadAlumnos ?? 0;
    const tieneDocente = paralelo?.tieneDocente !== false;
    const status = this.getStatusMateria(materia);
    const calificados = paralelo?.alumnosCalificados ?? 0;

    if (alumnos === 0) {
      return { clase: 'sin-alumnos', texto: 'Sin alumnos' };
    }
    if (!tieneDocente && alumnos > 0) {
      return { clase: 'sin-docente', texto: 'Sin docente' };
    }
    if (status === 'NotStarted') {
      return { clase: 'no-iniciado', texto: 'Por iniciar' };
    }
    if (status === 'Closed') {
      return { clase: 'vencido', texto: 'Plazo vencido' };
    }
    if (status === 'GracePeriod') {
      return { clase: 'periodo-gracia', texto: 'Período de gracia' };
    }
    if (calificados > 0 && calificados >= alumnos) {
      return { clase: 'calificado', texto: 'Calificado' };
    }
    return { clase: 'en-curso', texto: 'En curso' };
  }

  getEstadoAdmin(paralelo: any): { clase: string; texto: string; } {
    const alumnos = paralelo?.alumnosMatriculados ?? paralelo?.cantidadAlumnos ?? 0;
    const tieneDocente = paralelo?.tieneDocente ?? !!paralelo?.nombreDocente;
    const calificados = paralelo?.alumnosCalificados ?? 0;

    if (alumnos === 0) {
      return { clase: 'sin-alumnos', texto: 'Sin alumnos' };
    }
    if (!tieneDocente && alumnos > 0) {
      return { clase: 'sin-docente', texto: 'Sin docente' };
    }
    if (calificados > 0 && calificados >= alumnos) {
      return { clase: 'calificado', texto: 'Calificado' };
    }
    return { clase: 'en-curso', texto: 'En curso' };
  }

  private calcularStatusPeriodo(fechaFin?: string, diasGracia?: number, fechaInicio?: string): string {
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    if (fechaInicio) {
      const inicio = new Date(fechaInicio); inicio.setHours(0, 0, 0, 0);
      if (hoy < inicio) return 'NotStarted';
    }
    if (!fechaFin) return 'InProgress';
    const fin = new Date(fechaFin); fin.setHours(0, 0, 0, 0);
    const gracia = diasGracia ?? 5;
    const limite = new Date(fin); limite.setDate(limite.getDate() + gracia);
    if (hoy < fin) return 'InProgress';
    if (hoy <= limite) return 'GracePeriod';
    return 'Closed';
  }

  paraleloEsVisible(paralelo: any): boolean {
    return (paralelo?.cantidadAlumnos ?? 0) > 0 || (paralelo?.tieneDocente ?? false) || !!paralelo?.nombreDocente;
  }

  getParalelosVisibles(materia: any): any[] {
    const lista = materia?.paralelos || materia?.paralelo || [];
    return (lista || []).filter((p: any) => this.paraleloEsVisible(p));
  }

  getMateriasVisibles(malla: any): any[] {
    if (!malla?.materias) return [];
    return malla.materias.filter((mat: any) => this.getParalelosVisibles(mat).length > 0);
  }

  getTotalCalificadosMateria(materia: any): number {
    const paralelos = this.getParalelosVisibles(materia);
    return paralelos.reduce((t: number, p: any) => t + (p?.alumnosCalificados ?? 0), 0);
  }

  getStatusMateria(materia: any): string {
    return materia?.statusPeriodo || this.calcularStatusPeriodo(materia?.fechaFin, materia?.diasGracia, materia?.fechaInicio);
  }

  isPeriodoActivo(materia: any): boolean {
    const status = this.getStatusMateria(materia);
    return status === 'InProgress' || status === 'GracePeriod';
  }

  isGracePeriodMateria(materia: any): boolean {
    return this.getStatusMateria(materia) === 'GracePeriod';
  }

  formatFecha(fecha?: string): string {
    if (!fecha) return '—';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  getDocenteLabel(materia: any, paralelo: any): string {
    if (paralelo?.nombreDocente) return paralelo.nombreDocente;
    if (paralelo?.tieneDocente) return 'Asignado';
    return 'Sin docente';
  }

  limpiarFiltrosDocente(): void {
    this.docenteSearchTerm = '';
    this.docenteSelectedParalelo = '';
    this.docenteSelectedMalla = '';
  }

  limpiarFiltrosAdmin(): void {
    this._filtroPeriodoLectivo = null;
    this._filtroCiclo = null;
    this._filtroMalla = null;
    this._filtroMateria = null;
    this.selectedPeriodo = null;
    this.selectedCiclo = null;
    this.selectedMalla = null;
    this.selectedMateria = null;
    this.ciclos = [];
    this.mallas = [];
    this.detallesMalla = [];

    this.stateService.savedPeriodoId = null;
    this.stateService.savedCicloId = null;
    this.stateService.savedMallaId = null;
    this.stateService.savedMateriaId = null;
  }

  private combinarAsignacion(materia: any, paralelo: any): any {
    return {
      ...paralelo,
      idMallaParalelo: paralelo.idMallaParalelo,
      alumnosMatriculados: paralelo.alumnosMatriculados ?? 0,
      idDetalleMalla: materia.idDetalleMalla,
      idMateria: materia.idMateria,
      nombreMateria: materia.nombreMateria,
      horas: materia.horasMateria ?? materia.horas,
      idPlantillaEvaluacion: materia.idPlantillaEvaluacion,
      nombrePlantilla: materia.nombrePlantilla,
      nombreAreaCompetencia: materia.nombreAreaCompetencia,
      paralelosMateria: this.normalizarParalelosMateria(materia.paralelo || materia.paralelos || [])
    };
  }

  onPeriodoChange(value: any): void {
    this.filtroPeriodoLectivo = this.periodosLectivos.find(p => p.idPeriodoLectivo === value) || null;
    this.stateService.savedPeriodoId = value;
    this.stateService.savedCicloId = this.selectedCiclo;
    this.stateService.savedMallaId = null;
    this.stateService.savedMateriaId = null;
  }

  onCicloChange(value: any): void {
    this.filtroCiclo = this.ciclos.find(c => c.idCiclo === value) || null;
    this.stateService.savedCicloId = value;
    this.stateService.savedMallaId = null;
    this.stateService.savedMateriaId = null;
  }

  onMallaChange(value: any): void {
    this.filtroMalla = this.mallas.find(m => m.idMalla === value) || null;
    this.stateService.savedMallaId = value;
    this.stateService.savedMateriaId = null;
  }

  onMateriaChange(value: any): void {
    const dm = this.detallesMalla.find(m => m.idDetalleMalla === value) || null;
    this._filtroMateria = dm;
    this.stateService.savedMateriaId = value;
    if (dm) this.seleccionarMateriaAdmin(dm);
  }

  seleccionarMateriaDocente(materia: any): void {
    const paralelos = materia?.paralelos || materia?.paralelo || [];
    if (!paralelos.length) return;
    this.navegarAIngreso(this.combinarAsignacion(materia, paralelos[0]));
  }

  seleccionarMateriaParaleloDocente(materia: any, paralelo: any): void {
    if (!paralelo) return;
    this.navegarAIngreso(this.combinarAsignacion(materia, paralelo));
  }

  seleccionarMateriaAdmin(dm: DetalleMallaDTO): void {
    const paralelos = this.normalizarParalelosMateria(dm.paralelo || []);
    if (!paralelos.length) {
      this.messageService.add({ severity: 'warn', summary: 'Sin paralelos', detail: 'La materia seleccionada no tiene paralelos activos.' });
      return;
    }
    const asignacion = {
      ...paralelos[0],
      idDetalleMalla: dm.idDetalleMalla!,
      idMateria: dm.idMateria,
      nombreMateria: dm.nombreMateria,
      idPlantillaEvaluacion: dm.idPlantillaEvaluacion,
      nombrePlantilla: dm.nombrePlantilla,
      paralelosMateria: this.normalizarParalelosMateria(dm.paralelo || [])
    };
    this.navegarAIngreso(asignacion);
  }

  seleccionarParaleloAdmin(dm: any, paralelo: any): void {
    if (!paralelo) return;
    const asignacion = {
      ...paralelo,
      idDetalleMalla: dm.idDetalleMalla!,
      idMateria: dm.idMateria,
      nombreMateria: dm.nombreMateria,
      idPlantillaEvaluacion: dm.idPlantillaEvaluacion,
      nombrePlantilla: dm.nombrePlantilla,
      paralelosMateria: this.normalizarParalelosMateria(dm.paralelo || [])
    };
    this.navegarAIngreso(asignacion);
  }

  private navegarAIngreso(asignacion: any): void {
    this.stateService.setAsignacion(asignacion);
    this.router.navigate(['/dashboard/calificaciones/ingreso', asignacion.idMallaParalelo, asignacion.idDetalleMalla]);
  }
}
