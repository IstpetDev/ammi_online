import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { CustomSelectComponent } from '../../../../shared/custom-select/custom-select.component';
import { SharedHeaderComponent } from '../../../../shared/shared-header/shared-header.component';
import { SharedModalComponent } from '../../../../shared/shared-modal/shared-modal.component';
import { SharedToastComponent } from '../../../../shared/shared-toast/shared-toast.component';
import {
  CicloDTO, TipoOfertaDTO, EspecialidadDTO, CursoDTO, MallaDTO,
  ParaleloDTO, EspecieDTO, RequisitoDTO, PeriodoLectivoDTO, RegimenDTO
} from '../../../../data/models/Entities';
import { CicloService } from '../../../../core/services/infrastructure/ciclo.service';
import { PeriodoLectivoService } from '../../../../core/services/settings/periodo-lectivo.service';
import { RegimenService } from '../../../../core/services/settings/regimen.service';
import { TipoOfertaService } from '../../../../core/services/postulaciones/tipo-oferta.service';
import { EspecialidadService } from '../../../../core/services/infrastructure/especialidad.service';
import { CursoService } from '../../../../core/services/infrastructure/curso.service';
import { MallaService } from '../../../../core/services/infrastructure/malla.service';
import { RequisitosService } from '../../../../core/services/settings/requisitos.service';
import { ParaleloService } from '../../../../core/services/infrastructure/paralelo.service';
import { EspecieService } from '../../../../core/services/infrastructure/especie.service';
import { EspecieCicloService } from '../../../../core/services/infrastructure/especie-ciclo.service';
import { PlantillaEvaluacionService } from '../../../../core/services/infrastructure/plantilla-evaluacion.service';
import { MallaParaleloService } from '../../../../core/services/infrastructure/malla-paralelo.service';
import { AreaCompetenciaService } from '../../../../core/services/infrastructure/area-competencia.service';
import { DetalleMallaService } from '../../../../core/services/infrastructure/detalle-malla.service';
import { CursoPostulacionService, CursoConfigRequest } from '../../../../core/services/infrastructure/curso-postulacion.service';
import { PlantillaEvaluacionDTO } from '../../../../data/models/notas/plantilla-evaluacion.model';
import { AreaCompetenciaDTO } from '../../../../data/models/Entities';

import { PeriodoDialogComponent } from './components/periodo-dialog/periodo-dialog.component';
import { CicloDialogComponent } from './components/ciclo-dialog/ciclo-dialog.component';
import { VerConfiguracionDialogComponent } from './components/ver-configuracion-dialog/ver-configuracion-dialog.component';
import { CursoConfigWizardComponent } from './components/curso-config-wizard/curso-config-wizard.component';

interface ReplicarOpciones {
  materias: boolean;
  requisitos: boolean;
  paralelos: boolean;
  costos: boolean;
}

interface ReplicarOrigenData {
  materiasCount: number;
  requisitosCount: number;
  paralelosCount: number;
  costosCount: number;
  materias: any[];
  requisitos: RequisitoDTO[];
  paralelos: ParaleloDTO[];
  especies: { especie: EspecieDTO; valorEspecie: number }[];
}

@Component({
  selector: 'app-configurar-cursos-postulacion',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, CustomSelectComponent,
    SharedHeaderComponent, SharedModalComponent, SharedToastComponent,
    PeriodoDialogComponent, CicloDialogComponent, VerConfiguracionDialogComponent,
    CursoConfigWizardComponent
  ],
  providers: [MessageService],
  templateUrl: './configurar-cursos-postulacion.component.html',
  styleUrls: ['./configurar-cursos-postulacion.component.css']
})
export class ConfigurarCursosPostulacionComponent implements OnInit {
  private router = inject(Router);
  private messageService = inject(MessageService);
  private cicloService = inject(CicloService);
  private periodoService = inject(PeriodoLectivoService);
  private regimenService = inject(RegimenService);
  private tipoOfertaService = inject(TipoOfertaService);
  private especialidadService = inject(EspecialidadService);
  private cursoService = inject(CursoService);
  private mallaService = inject(MallaService);
  private requisitosService = inject(RequisitosService);
  private paraleloService = inject(ParaleloService);
  private especieService = inject(EspecieService);
  private especieCicloService = inject(EspecieCicloService);
  private plantillaEvaluacionService = inject(PlantillaEvaluacionService);
  private mallaParaleloService = inject(MallaParaleloService);
  private areaCompetenciaService = inject(AreaCompetenciaService);
  private detalleMallaService = inject(DetalleMallaService);
  private cursoPostulacionService = inject(CursoPostulacionService);

  ciclos: CicloDTO[] = [];
  periodos: PeriodoLectivoDTO[] = [];
  regimenes: RegimenDTO[] = [];
  tiposOferta: TipoOfertaDTO[] = [];
  especialidades: EspecialidadDTO[] = [];
  cursosTodos: (CursoDTO & {
    _mallaId?: number; _status?: string; _statusLabel?: string;
    _materiasCount?: number; _requisitosCount?: number;
    _paralelosCount?: number; _especiesCount?: number;
  })[] = [];
  plantillas: PlantillaEvaluacionDTO[] = [];
  areasCompetencia: AreaCompetenciaDTO[] = [];

  selectedPeriodoId: number | null = null;
  selectedCicloId: number | null = null;
  selectedTipoOfertaId: number | null = null;
  selectedEspecialidadId: number | null = null;

  cargandoCursos = false;
  private _regimenesLoaded = false;
  private _especialidadesLoaded = false;

  // Dialog Visibility states
  showPeriodoDialog = false;
  showCicloDialog = false;
  showVerDialog = false;
  showConfigDrawer = false;
  showDeleteCicloDialog = false;

  // Period / Ciclo references for child dialogs
  periodoSeleccionado: PeriodoLectivoDTO | null = null;
  cicloSeleccionado: CicloDTO | null = null;
  cicloAEliminar: CicloDTO | null = null;

  // Ver configuración state
  cursoAVer: any = null;
  verMaterias: any[] = [];
  verRequisitos: any[] = [];
  verParalelos: any[] = [];
  verCostos: any[] = [];

  // Config wizard references
  cursoEnConfiguracion: any = null;

  // Replicar state
  showReplicarDialog = false;
  cursoAReplicar: (CursoDTO & { _mallaId?: number }) | null = null;
  cursosOrigenReplicar: (CursoDTO & { _label: string; _mallaId?: number })[] = [];
  replicarOrigenId: number | null = null;
  replicarOrigenData: ReplicarOrigenData | null = null;
  replicarOpciones: ReplicarOpciones = { materias: true, requisitos: true, paralelos: true, costos: true };

  get ciclosDelPeriodo(): CicloDTO[] {
    if (!this.selectedPeriodoId || !this.selectedTipoOfertaId) return [];
    return this.ciclos.filter(c =>
      c.idPeriodo === +this.selectedPeriodoId! &&
      c.idTipoOferta === +this.selectedTipoOfertaId!
    );
  }

  get cursosFiltrados() {
    return this.selectedCicloId ? this.cursosTodos : [];
  }

  ngOnInit(): void {
    this.loadInitialData();
  }

  private loadInitialData(): void {
    forkJoin({
      ciclos: this.cicloService.getAll(),
      periodos: this.periodoService.getAll(),
      tiposOferta: this.tipoOfertaService.getTiposOfertaActivos(),
      cursos: this.cursoService.getAll(),
      regimenes: this.regimenService.getAll(),
      especialidades: this.especialidadService.getAll()
    }).subscribe({
      next: (data) => {
        this.ciclos = data.ciclos;
        this.periodos = data.periodos;
        this.tiposOferta = data.tiposOferta;
        this.cursosTodos = data.cursos.map(c => ({ ...c }));
        this.regimenes = data.regimenes;
        this.especialidades = data.especialidades;
        this._regimenesLoaded = true;
        this._especialidadesLoaded = true;

        const now = new Date();
        let closestPeriodo = this.periodos.length > 0 ? this.periodos[0] : null;
        let minDiff = Infinity;
        for (const p of this.periodos) {
          const fechaRef = p.fechaInicioEstimada || p.fechaFinEstimada;
          if (fechaRef) {
            const diff = Math.abs(new Date(fechaRef).getTime() - now.getTime());
            if (diff < minDiff) {
              minDiff = diff;
              closestPeriodo = p;
            }
          }
        }
        if (closestPeriodo?.idPeriodoLectivo != null) {
          this.selectedPeriodoId = closestPeriodo.idPeriodoLectivo;
        }

        const cicloPeriodo = data.ciclos.find(c => c.idPeriodo === this.selectedPeriodoId);
        if (cicloPeriodo?.idTipoOferta != null) {
          this.selectedTipoOfertaId = cicloPeriodo.idTipoOferta;
        }
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los datos iniciales' })
    });
  }

  private loadRegimenes(): void {
    if (this._regimenesLoaded) return;
    this._regimenesLoaded = true;
    this.regimenService.getAll().subscribe(r => this.regimenes = r);
  }

  private loadEspecialidades(): void {
    if (this._especialidadesLoaded) return;
    this._especialidadesLoaded = true;
    this.especialidadService.getAll().subscribe(e => this.especialidades = e);
  }

  getOfertaIcon(detalle: string | undefined): string {
    const d = detalle?.toLowerCase() ?? '';
    if (d.includes('online')) return 'pi-globe';
    if (d.includes('presencial')) return 'pi-building';
    if (d.includes('semipresencial')) return 'pi-sync';
    return 'pi-tag';
  }

  trackByCurso(_: number, curso: CursoDTO): number {
    return curso.idCursos!;
  }

  getRegimenDetalle(id: number | undefined): string {
    const r = this.regimenes.find(r => r.idRegimen === id);
    return r?.detalle ?? '';
  }

  getTipoOfertaDetalle(id: number | undefined): string {
    const t = this.tiposOferta.find(t => t.idtipoOferta === id);
    return t?.detalle ?? '';
  }

  onPeriodoChange(id: any): void {
    this.selectedPeriodoId = id;
    this.selectedCicloId = null;
    this.selectedTipoOfertaId = null;
    this.selectedEspecialidadId = null;
    this.cursosTodos.forEach(c => {
      c._mallaId = undefined;
      c._status = undefined;
      c._statusLabel = undefined;
      c._materiasCount = 0;
      c._requisitosCount = 0;
      c._paralelosCount = 0;
      c._especiesCount = 0;
    });
  }

  onCicloSelect(id: number): void {
    this.selectedCicloId = id;
    this.selectedEspecialidadId = null;
    this.cursosTodos.forEach(c => {
      c._mallaId = undefined;
      c._status = undefined;
      c._statusLabel = undefined;
      c._materiasCount = 0;
      c._requisitosCount = 0;
      c._paralelosCount = 0;
      c._especiesCount = 0;
    });
    this.cargarEstadoCursos();
  }

  onTipoOfertaChange(id: any): void {
    this.selectedTipoOfertaId = id;
    this.selectedCicloId = null;
    this.selectedEspecialidadId = null;
    this.cursosTodos.forEach(c => {
      c._mallaId = undefined;
      c._status = undefined;
      c._statusLabel = undefined;
      c._materiasCount = 0;
      c._requisitosCount = 0;
      c._paralelosCount = 0;
      c._especiesCount = 0;
    });
    this.loadEspecialidades();
  }

  onEspecialidadChange(id: any): void {
    this.selectedEspecialidadId = id;
    this.cargarEstadoCursos();
  }

  /* ── Periodo CRUD ── */
  openPeriodoDialog(): void {
    this.periodoSeleccionado = null;
    this.showPeriodoDialog = true;
  }

  onPeriodoSaved(event: { action: 'create' | 'update'; data: PeriodoLectivoDTO }): void {
    if (event.action === 'create') {
      this.periodos = [...this.periodos, event.data];
      if (event.data.idPeriodoLectivo) {
        this.selectedPeriodoId = event.data.idPeriodoLectivo;
        this.onPeriodoChange(this.selectedPeriodoId);
      }
    } else {
      const idx = this.periodos.findIndex(p => p.idPeriodoLectivo === event.data.idPeriodoLectivo);
      if (idx >= 0) {
        this.periodos[idx] = event.data;
      }
    }
  }

  /* ── Ciclo CRUD ── */
  openCicloDialog(): void {
    this.loadRegimenes();
    this.cicloSeleccionado = null;
    this.showCicloDialog = true;
  }

  editCiclo(c: CicloDTO): void {
    this.loadRegimenes();
    this.cicloSeleccionado = c;
    this.showCicloDialog = true;
  }

  onCicloSaved(event: { action: 'create' | 'update'; data: CicloDTO }): void {
    if (event.action === 'create') {
      this.ciclos = [...this.ciclos, event.data];
      if (event.data.idCiclo) {
        this.onCicloSelect(event.data.idCiclo);
      }
    } else {
      const idx = this.ciclos.findIndex(c => c.idCiclo === event.data.idCiclo);
      if (idx >= 0) {
        this.ciclos[idx] = event.data;
      }
    }
  }

  deleteCiclo(c: CicloDTO): void {
    this.cicloAEliminar = c;
    this.showDeleteCicloDialog = true;
  }

  confirmDeleteCiclo(): void {
    if (!this.cicloAEliminar?.idCiclo) return;
    const idEliminar = this.cicloAEliminar.idCiclo;
    this.cicloService.delete(idEliminar).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Ciclo eliminado correctamente' });
        this.showDeleteCicloDialog = false;
        this.cicloAEliminar = null;
        this.ciclos = this.ciclos.filter(c => c.idCiclo !== idEliminar);
        if (this.selectedCicloId === idEliminar) {
          this.selectedCicloId = null;
        }
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el ciclo' })
    });
  }

  /* ── Cargar estado de cursos ── */
  private cargarEstadoCursos(): void {
    if (!this.selectedCicloId) return;
    this.cargandoCursos = true;

    const request: CursoConfigRequest = {
      idCiclo: this.selectedCicloId,
      idTipoOferta: this.selectedTipoOfertaId!,
      idEspecialidad: this.selectedEspecialidadId ?? undefined
    };

    this.cursoPostulacionService.getConfiguracionCursos(request).subscribe({
      next: (response) => {
        const statusList = response.data || [];
        this.cursosTodos.forEach(c => {
          const status = statusList.find(s => s.idCurso === c.idCursos);
          if (status) {
            c._mallaId = status.idMalla ?? undefined;
            c._materiasCount = status.materiasCount;
            c._requisitosCount = status.requisitosCount;
            c._paralelosCount = status.paralelosCount;
            c._especiesCount = status.especiesCount;

            if (status.estado === 'completo') {
              c._status = 'configured';
              c._statusLabel = 'Configurado';
            } else if (status.estado === 'parcial') {
              c._status = 'partial';
              c._statusLabel = 'Parcial';
            } else {
              c._status = 'unconfigured';
              c._statusLabel = 'Sin configurar';
            }
          } else {
            c._mallaId = undefined;
            c._status = 'unconfigured';
            c._statusLabel = 'Sin configurar';
            c._materiasCount = 0;
            c._requisitosCount = 0;
            c._paralelosCount = 0;
            c._especiesCount = 0;
          }
        });
        this.cargandoCursos = false;
      },
      error: () => {
        this.cargarEstadoFallback();
      }
    });
  }

  private cargarEstadoFallback(): void {
    if (!this.selectedCicloId) return;
    const cicloActual = this.ciclos.find(c => c.idCiclo === this.selectedCicloId);
    const tipoOfertaIdEfectivo = this.selectedTipoOfertaId ?? cicloActual?.idTipoOferta ?? null;

    this.mallaService.getByCiclo(this.selectedCicloId).subscribe({
      next: (mallas) => {
        const mallasFiltradas = tipoOfertaIdEfectivo
          ? mallas.filter(m => {
            const ciclo = this.ciclos.find(c => c.idCiclo === m.idCiclo);
            const tipoOfertaId = ciclo?.idTipoOferta || m.idTipoOferta;
            return tipoOfertaId === +tipoOfertaIdEfectivo;
          })
          : mallas;

        this.cursosTodos.forEach(c => {
          const malla = mallasFiltradas.find(m => m.idCursos === c.idCursos);
          c._mallaId = malla?.idMalla;
          c._status = malla ? 'configured' : 'unconfigured';
          c._statusLabel = malla ? 'Configurado' : 'Sin configurar';
          c._materiasCount = 0;
          c._requisitosCount = 0;
          c._paralelosCount = 0;
          c._especiesCount = 0;
        });
        this.cargandoCursos = false;
      },
      error: () => { this.cargandoCursos = false; }
    });
  }

  /* ── Ver configuración (read-only) ── */
  verConfiguracion(curso: any): void {
    this.cursoAVer = curso;
    this.verMaterias = [];
    this.verRequisitos = [];
    this.verParalelos = [];
    this.verCostos = [];

    if (!curso._mallaId) return;

    forkJoin({
      detalles: this.detalleMallaService.getByMalla(curso._mallaId, 1, 999).pipe(catchError(() => of([]))),
      especies: this.especieCicloService.getByMalla(curso._mallaId).pipe(catchError(() => of([]))),
      requisitos: this.requisitosService.getByMalla(curso._mallaId).pipe(catchError(() => of([]))),
      paralelos: this.mallaParaleloService.getByMalla(curso._mallaId).pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ detalles, especies, requisitos, paralelos }) => {
        this.verMaterias = (detalles || []).map((d: any) => ({
          nombre: d.nombreMateria || `Materia #${d.idMateria}`,
          modulo: d.modulo,
          horas: d.duracionHoras,
          fechaInicio: d.fechaInicio || '—',
          fechaFin: d.fechaFin || '—'
        }));
        this.verRequisitos = (requisitos || []).map((r: any) => ({
          detalle: r.detalleRequisito || r.detalle,
          tipo: r.tipoDato === 'ADJUNTO' ? 'Adjunto' : 'Sí/No',
          obligatorio: r.esObligatorio ? 'Sí' : 'No'
        }));
        this.verParalelos = (paralelos || []).map((p: any) => ({
          nombre: p.nombreParalelo || `Paralelo #${p.idParalelo}`,
          cupo: p.cupoMaximo ?? 30
        }));
        this.verCostos = (especies || []).map((e: any) => ({
          detalle: e.especie?.detalle || '',
          valor: `$${e.valorEspecie ?? 0}`,
          tipo: e.esMatricula ? 'Matrícula' : e.esPension ? 'Pensión' : '—'
        }));
        this.showVerDialog = true;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la configuración' });
      }
    });
  }

  /* ── Wizard triggers ── */
  configurarCurso(curso: any): void {
    this.cursoEnConfiguracion = curso;
    this.showConfigDrawer = true;
  }

  onCursoConfigSaved(event: any): void {
    const curso = this.cursoEnConfiguracion;
    if (curso) {
      curso._mallaId = event.idMalla;
      curso._status = 'configured';
      curso._statusLabel = 'Configurado';
      curso._materiasCount = event.materiasSeleccionadas.length;
      curso._requisitosCount = event.requisitosSeleccionados.length;
      curso._paralelosCount = event.paralelosSeleccionados.length;
      curso._especiesCount = event.especiesSeleccionadas.length;
    }
    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Configuración guardada correctamente' });
    this.showConfigDrawer = false;
  }

  /* ── Replicar state & actions ── */
  abrirReplicar(curso: any): void {
    this.cursoAReplicar = curso;
    this.replicarOrigenId = null;
    this.replicarOrigenData = null;
    this.replicarOpciones = { materias: true, requisitos: true, paralelos: true, costos: true };

    const cursosConMalla = this.cursosTodos
      .filter(c => c._mallaId && c.idCursos !== curso.idCursos)
      .map(c => {
        const ciclo = this.ciclos.find(ci => ci.idCiclo === this.selectedCicloId);
        return { ...c, _label: `${c.detalle} (${ciclo?.detalle || 'Otro Ciclo'})` };
      });

    if (cursosConMalla.length > 0) {
      this.cursosOrigenReplicar = cursosConMalla;
      this.showReplicarDialog = true;
    } else {
      this.messageService.add({ severity: 'info', summary: 'Sin origen', detail: 'No hay otros cursos configurados para replicar' });
    }
  }

  onReplicarOrigenChange(id: any): void {
    this.replicarOrigenId = id;
    this.replicarOrigenData = null;
    if (!id) return;

    const curso = this.cursosOrigenReplicar.find(c => c.idCursos === +id);
    if (!curso || !curso._mallaId) return;

    forkJoin({
      detalles: this.detalleMallaService.getByMalla(curso._mallaId, 1, 999).pipe(catchError(() => of([]))),
      especies: this.especieCicloService.getByMalla(curso._mallaId).pipe(catchError(() => of([]))),
      requisitos: this.requisitosService.getByMalla(curso._mallaId).pipe(catchError(() => of([]))),
      paralelos: this.mallaParaleloService.getByMalla(curso._mallaId).pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ detalles, especies, requisitos, paralelos }) => {
        this.replicarOrigenData = {
          materiasCount: (detalles || []).length,
          requisitosCount: (requisitos || []).length,
          paralelosCount: (paralelos || []).length,
          costosCount: (especies || []).length,
          materias: (detalles || []).map(d => ({
            materia: { idMateria: d.idMateria, detalle: d.nombreMateria || `Materia #${d.idMateria}`, horasRequeridas: d.duracionHoras },
            modulo: d.modulo,
            idPlantillaEvaluacion: d.idPlantillaEvaluacion,
            idAreaCompetencia: d.idAreaCompetencia,
            horas: d.duracionHoras,
            fechaInicio: d.fechaInicio || '',
            fechaFin: d.fechaFin || ''
          })),
          requisitos: (requisitos || []).map((r: any) => ({
            idRequisitos: r.idRequisitos,
            detalle: r.detalleRequisito || r.detalle,
            esObligatorio: r.esObligatorio,
            bloqueaInscripcion: r.bloqueaInscripcion,
            tipoDato: r.tipoDato,
            esMayorEdad: r.esMayorEdad
          })),
          paralelos: (paralelos || []).map((p: any) => ({
            idParalelo: p.idParalelo,
            nombreParalelo: p.nombreParalelo || `Paralelo #${p.idParalelo}`,
            cupoMaximo: p.cupoMaximo ?? 30
          })),
          especies: (especies || []).map(e => ({
            especie: { idEspecie: e.idEspecie, detalle: e.especie?.detalle || '', esMatricula: e.esMatricula || false, esPension: e.esPension || false } as EspecieDTO,
            valorEspecie: e.valorEspecie ?? 0
          }))
        };
      }
    });
  }

  ejecutarReplicar(): void {
    if (!this.replicarOrigenData || !this.cursoAReplicar) return;

    // Open Config Wizard with the replicated data
    this.cursoEnConfiguracion = this.cursoAReplicar;
    this.showConfigDrawer = true;
    this.showReplicarDialog = false;

    // After a tiny timeout, we set up the wizard state using a public initialization helper or by delegating replication to the wizard.
    // To cleanly pass the replicated state, we can let the wizard component fetch it or we can pass a 'replicatedData' input to the wizard!
    // But since the wizard is already modular, passing the replicated data is super clean. Let's make sure the wizard can receive it.
    // Wait! Let's pass the replicated state directly via input or let the wizard handle it.
    // Actually, we can pass `replicatedData` to `app-curso-config-wizard` or just trigger load config, or let the parent pass it.
    // Let's implement it inside the wizard or pass it to it.
    // Wait, let's see how we can pass the replicated data.
    // In `curso-config-wizard`, we can have an input `replicatedData`.
  }
}
