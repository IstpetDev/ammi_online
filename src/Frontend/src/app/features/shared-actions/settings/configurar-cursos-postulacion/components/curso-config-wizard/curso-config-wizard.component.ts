import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap, map } from 'rxjs/operators';
import { MessageService } from 'primeng/api';
import { CustomSelectComponent } from '../../../../../../shared/custom-select/custom-select.component';
import { SharedDrawerComponent } from '../../../../../../shared/shared-drawer/shared-drawer.component';
import { SharedModalComponent } from '../../../../../../shared/shared-modal/shared-modal.component';
import {
  CicloDTO, TipoOfertaDTO, CursoDTO, MateriaDTO, MallaDTO,
  RequisitoDTO, ParaleloDTO, EspecieDTO, EspecieCicloDTO,
  MallaParaleloCreateDTO, AreaCompetenciaDTO
} from '../../../../../../data/models/Entities';
import { DetalleMallaCreateDTO, DetalleMallaDTO } from '../../../../../../data/models/detalle-malla/detalle-malla.model';
import { PlantillaEvaluacionDTO } from '../../../../../../data/models/notas/plantilla-evaluacion.model';
import { MateriaService } from '../../../../../../core/services/infrastructure/materia.service';
import { MallaService } from '../../../../../../core/services/infrastructure/malla.service';
import { DetalleMallaService } from '../../../../../../core/services/infrastructure/detalle-malla.service';
import { RequisitosService } from '../../../../../../core/services/settings/requisitos.service';
import { ParaleloService } from '../../../../../../core/services/infrastructure/paralelo.service';
import { EspecieService } from '../../../../../../core/services/infrastructure/especie.service';
import { EspecieCicloService } from '../../../../../../core/services/infrastructure/especie-ciclo.service';
import { PlantillaEvaluacionService } from '../../../../../../core/services/infrastructure/plantilla-evaluacion.service';
import { MallaParaleloService } from '../../../../../../core/services/infrastructure/malla-paralelo.service';
import { AreaCompetenciaService } from '../../../../../../core/services/infrastructure/area-competencia.service';
import { MateriaDialogComponent } from '../materia-dialog/materia-dialog.component';

interface MateriaDrawerRow {
  materia: MateriaDTO;
  modulo: number;
  idPlantillaEvaluacion: number;
  idAreaCompetencia: number;
  horas: number;
  fechaInicio: string;
  fechaFin: string;
}

@Component({
  selector: 'app-curso-config-wizard',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, CustomSelectComponent, SharedDrawerComponent, SharedModalComponent, MateriaDialogComponent],
  templateUrl: './curso-config-wizard.component.html',
  styleUrls: ['./curso-config-wizard.component.css']
})
export class CursoConfigWizardComponent implements OnChanges {
  private materiaService = inject(MateriaService);
  private requisitosService = inject(RequisitosService);
  private paraleloService = inject(ParaleloService);
  private especieService = inject(EspecieService);
  private especieCicloService = inject(EspecieCicloService);
  private plantillaEvaluacionService = inject(PlantillaEvaluacionService);
  private mallaParaleloService = inject(MallaParaleloService);
  private areaCompetenciaService = inject(AreaCompetenciaService);
  private mallaService = inject(MallaService);
  private detalleMallaService = inject(DetalleMallaService);
  private messageService = inject(MessageService);

  @Input() visible = false;
  @Input() curso: (CursoDTO & { _mallaId?: number }) | null = null;
  @Input() selectedCicloId: number | null = null;
  @Input() selectedTipoOfertaId: number | null = null;
  @Input() ciclos: CicloDTO[] = [];
  @Input() replicatedData: any = null;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<any>();

  stepsConfig = [
    { label: 'Materias' },
    { label: 'Fechas' },
    { label: 'Requisitos' },
    { label: 'Paralelos' },
    { label: 'Costos' },
    { label: 'Resumen' }
  ];

  wizardStep = 1;
  readonly totalSteps = 6;
  guardando = false;
  configDirty = false;
  showUnsavedChangesDialog = false;
  pendingConfigAction: (() => void) | null = null;

  // Master Data loaded inside Wizard
  materiasDisponibles: (MateriaDTO & {
    _selected?: boolean; _modulo?: number; _horas?: number;
    _plantilla?: number; _area?: number;
    _fechaInicio?: string; _fechaFin?: string;
  })[] = [];
  todosRequisitos: (RequisitoDTO & { _sel?: boolean })[] = [];
  todosParalelos: (ParaleloDTO & { _sel?: boolean; _cupo?: number })[] = [];
  todosEspecies: (EspecieDTO & { _sel?: boolean; _valor?: number })[] = [];
  plantillas: PlantillaEvaluacionDTO[] = [];
  areasCompetencia: AreaCompetenciaDTO[] = [];

  materiaDefaultPlantilla: number | null = null;
  materiasFilterText = '';
  private readonly DIAS_POR_MODULO = 28;

  // Inline forms
  showMateriaDialog = false;
  nuevaMateriaDetalle = '';
  nuevaMateriaHoras: number | null = null;

  showRequisitoDialog = false;
  nuevoRequisitoDetalle = '';
  nuevoRequisitoTipoDato = 'ADJUNTO';
  nuevoRequisitoObligatorio = false;
  nuevoRequisitoBloquea = false;
  readonly tipoDatoOptions = [
    { label: 'Adjunto (PDF, imagen)', value: 'ADJUNTO' },
    { label: 'Sí / No', value: 'BOOL' }
  ];

  showEspecieDialog = false;
  nuevaEspecieDetalle = '';
  nuevaEspecieValor: number | null = 1;
  nuevaEspecieEsMatricula = false;
  nuevaEspecieEsPension = false;

  private readonly AREA_KEYWORDS: { keywords: string[]; areaId: number }[] = [
    { keywords: ['LENGUA', 'LITERATURA'], areaId: 1 },
    { keywords: ['MATEMATICA', 'MATEMÁTICA', 'MATEMATICAS', 'MATEMÁTICAS'], areaId: 2 },
    { keywords: ['CIENCIAS SOCIALES', 'HISTORIA', 'GEOGRAFIA', 'GEOGRAFÍA'], areaId: 3 },
    { keywords: ['CIENCIAS NATURALES', 'BIOLOGIA', 'BIOLOGÍA', 'QUIMICA', 'QUÍMICA', 'FISICA', 'FÍSICA'], areaId: 4 },
    { keywords: ['LENGUA EXTRANJERA', 'INGLES', 'INGLÉS', 'ENGLISH'], areaId: 5 },
    { keywords: ['EDUCACION FISICA', 'EDUCACIÓN FÍSICA', 'EDUCACION FÍSICA', 'DEPORTE', 'CULTURA FISICA'], areaId: 6 },
    { keywords: ['EDUCACION CULTURAL', 'EDUCACIÓN CULTURAL', 'ARTISTICA', 'ARTÍSTICA', 'ARTE', 'CULTURA ARTISTICA'], areaId: 7 },
    { keywords: ['MODULO INTERDISCIPLINAR', 'MÓDULO INTERDISCIPLINAR', 'INTERDISCIPLINAR'], areaId: 8 },
    { keywords: ['CIVICA', 'CÍVICA', 'ACOMPAÑAMIENTO', 'CIVICA Y ACOMPAÑAMIENTO'], areaId: 9 }
  ];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible && this.curso) {
      this.initWizard();
    }
  }

  private initWizard(): void {
    this.wizardStep = 1;
    this.configDirty = false;
    this.materiasFilterText = this.obtenerNivelCurso();

    this.loadConfigData().subscribe({
      next: (res: any) => {
        this.plantillas = res.plantillas || [];
        this.materiaDefaultPlantilla = this.plantillas.length > 0 ? this.plantillas[0].idPlantillaEvaluacion! : null;
        this.areasCompetencia = res.areas || [];

        // Mapear historial previo de materias (módulo y área previa)
        const historialMateriasMap = new Map<number, { modulo: number; idAreaCompetencia?: number }>();
        const historialDetalles: DetalleMallaDTO[] = res.historialDetalles || [];
        historialDetalles.forEach(d => {
          if (d.idMateria && !historialMateriasMap.has(d.idMateria)) {
            historialMateriasMap.set(d.idMateria, { modulo: d.modulo, idAreaCompetencia: d.idAreaCompetencia });
          }
        });

        this.materiasDisponibles = (res.materias?.items || []).map((m: any) => {
          const prevHist = historialMateriasMap.get(m.idMateria);
          return {
            ...m,
            _selected: false,
            _modulo: prevHist?.modulo || 1,
            _horas: m.horasRequeridas && m.horasRequeridas > 0 ? m.horasRequeridas : 40,
            _fechaInicio: '',
            _fechaFin: '',
            _plantilla: this.materiaDefaultPlantilla ?? undefined,
            _area: prevHist?.idAreaCompetencia || this.autoAsignarArea(m.detalle)
          };
        });

        this.todosRequisitos = (res.requisitos || []).map((r: any) => ({ ...r, _sel: false }));
        this.todosParalelos = (res.paralelos || []).map((p: any) => ({ ...p, _sel: false, _cupo: p.cupoMaximo && p.cupoMaximo > 0 ? p.cupoMaximo : 30 }));
        this.todosEspecies = (res.especies || []).map((e: any) => ({ ...e, _sel: false, _valor: 1 }));

        if (this.replicatedData) {
          this.aplicarReplicarData(this.replicatedData);
          this.actualizarMateriasPorModulo();
        } else if (this.curso?._mallaId) {
          this.cargarConfiguracionExistente(this.curso._mallaId);
        } else {
          this.predisponerDatosNuevos();
          this.actualizarMateriasPorModulo();
        }
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los datos del asistente' });
      }
    });
  }

  private loadConfigData() {
    return forkJoin({
      materias: this.materiaService.getAll(200).pipe(catchError(() => of({ items: [] } as any))),
      requisitos: this.requisitosService.getAll().pipe(catchError(() => of([]))),
      paralelos: this.paraleloService.getAllParalelos().pipe(catchError(() => of([]))),
      especies: this.especieService.getAll().pipe(catchError(() => of([]))),
      plantillas: this.plantillaEvaluacionService.getActivas().pipe(catchError(() => of([]))),
      areas: this.areaCompetenciaService.getAll().pipe(catchError(() => of([]))),
      historialDetalles: this.mallaService.getAll().pipe(
        switchMap(mallas => {
          if (!mallas || mallas.length === 0) return of([] as DetalleMallaDTO[]);
          const lastMallas = mallas.slice(-5); // Consultar últimas 5 mallas para obtener historial reciente
          return forkJoin(
            lastMallas.map(m => {
              const id = m.idMalla || (m as any).idMallaCurricular;
              return id ? this.detalleMallaService.getByMalla(id, 1, 100).pipe(catchError(() => of([]))) : of([]);
            })
          ).pipe(map(results => results.flat()));
        }),
        catchError(() => of([] as DetalleMallaDTO[]))
      )
    });
  }

  private aplicarReplicarData(data: any): void {
    const defaultFechaInicio = this.ciclos.find(c => c.idCiclo === this.selectedCicloId)?.fechaInicioEstimada ? this.formatDate(this.ciclos.find(c => c.idCiclo === this.selectedCicloId)!.fechaInicioEstimada) : '';
    const defaultFechaFin = this.ciclos.find(c => c.idCiclo === this.selectedCicloId)?.fechaFinEstimada ? this.formatDate(this.ciclos.find(c => c.idCiclo === this.selectedCicloId)!.fechaFinEstimada) : '';

    if (data.materias && data.materias.length > 0) {
      data.materias.forEach((m: any) => {
        const match = this.materiasDisponibles.find(x => x.idMateria === m.materia.idMateria);
        if (match) {
          match._selected = true;
          match._modulo = m.modulo;
          match._horas = m.horas && m.horas > 0 ? m.horas : (match.horasRequeridas || 40);
          match._fechaInicio = m.fechaInicio || defaultFechaInicio;
          match._fechaFin = m.fechaFin || defaultFechaFin;
          match._plantilla = m.idPlantillaEvaluacion;
          match._area = m.idAreaCompetencia || this.autoAsignarArea(match.detalle);
        }
      });
    }

    if (data.requisitos && data.requisitos.length > 0) {
      data.requisitos.forEach((r: any) => {
        const match = this.todosRequisitos.find(x => x.idRequisitos === r.idRequisitos);
        if (match) match._sel = true;
      });
    }

    if (data.paralelos && data.paralelos.length > 0) {
      data.paralelos.forEach((p: any) => {
        const match = this.todosParalelos.find(x => x.idParalelo === p.idParalelo);
        if (match) {
          match._sel = true;
          match._cupo = p.cupoMaximo && p.cupoMaximo > 0 ? p.cupoMaximo : (match._cupo || 30);
        }
      });
    }

    if (data.especies && data.especies.length > 0) {
      data.especies.forEach((e: any) => {
        const match = this.todosEspecies.find(x => x.idEspecie === e.especie.idEspecie);
        if (match) {
          match._sel = true;
          match._valor = e.valorEspecie && e.valorEspecie > 0 ? e.valorEspecie : 10;
        }
      });
    }

    this.todosEspecies.forEach(e => {
      const matched = data.especies?.some((em: any) => em.especie.idEspecie === e.idEspecie);
      if (!matched) {
        if (e.esMatricula || e.esPension || e.detalle?.toLowerCase().includes('matricula')) {
          e._sel = true;
          e._valor = e._valor && e._valor > 0 ? e._valor : 10;
        }
      }
    });

    this.configDirty = true;
  }

  private predisponerDatosNuevos(): void {
    const ciclo = this.ciclos.find(c => c.idCiclo === this.selectedCicloId);
    const defaultFechaInicio = ciclo?.fechaInicioEstimada ? this.formatDate(ciclo.fechaInicioEstimada) : '';
    const defaultFechaFin = ciclo?.fechaFinEstimada ? this.formatDate(ciclo.fechaFinEstimada) : '';

    this.materiasDisponibles.forEach(m => {
      m._selected = false;
      m._fechaInicio = defaultFechaInicio;
      m._fechaFin = defaultFechaFin;
    });

    if (defaultFechaInicio) {
      this.propagarFechaInicio(1, defaultFechaInicio);
    }

    // Predisponer Especies/Matrículas por defecto
    this.todosEspecies.forEach(e => {
      // "las especie y matriculas deben estar predispuestas" - check them by default
      if (e.esMatricula || e.esPension || e.detalle?.toLowerCase().includes('matricula') || e.detalle?.toLowerCase().includes('materia')) {
        e._sel = true;
      }
      e._valor = e._valor && e._valor > 0 ? e._valor : 10; // Default non-zero value, e.g. 10 USD
    });
  }

  private cargarConfiguracionExistente(idMalla: number): void {
    forkJoin({
      detalles: this.detalleMallaService.getByMalla(idMalla, 1, 999).pipe(catchError(() => of([]))),
      especies: this.especieCicloService.getByMalla(idMalla).pipe(catchError(() => of([]))),
      requisitos: this.requisitosService.getByMalla(idMalla).pipe(catchError(() => of([]))),
      paralelos: this.mallaParaleloService.getByMalla(idMalla).pipe(catchError(() => of([])))
    }).subscribe({
      next: (res: any) => {
        const { detalles = [], especies = [], requisitos = [], paralelos = [] } = res;

        // Materias
        detalles.forEach((d: any) => {
          const match = this.materiasDisponibles.find(m => m.idMateria === d.idMateria);
          if (match) {
            match._selected = true;
            match._modulo = d.modulo;
            match._horas = d.duracionHoras && d.duracionHoras > 0 ? d.duracionHoras : (match.horasRequeridas || 40);
            match._fechaInicio = d.fechaInicio ? this.formatDate(d.fechaInicio) : '';
            match._fechaFin = d.fechaFin ? this.formatDate(d.fechaFin) : '';
            match._plantilla = d.idPlantillaEvaluacion;
            match._area = d.idAreaCompetencia || this.autoAsignarArea(match.detalle);
          }
        });

        // Requisitos
        requisitos.forEach((rm: any) => {
          const match = this.todosRequisitos.find(r => r.idRequisitos === rm.idRequisitos);
          if (match) match._sel = true;
        });

        // Paralelos
        paralelos.forEach((pm: any) => {
          const match = this.todosParalelos.find(p => p.idParalelo === pm.idParalelo);
          if (match) {
            match._sel = true;
            match._cupo = pm.cupoMaximo && pm.cupoMaximo > 0 ? pm.cupoMaximo : (match._cupo || 30);
          }
        });

        // Especies / Costos
        especies.forEach((em: any) => {
          const match = this.todosEspecies.find(e => e.idEspecie === em.idEspecie);
          if (match) {
            match._sel = true;
            match._valor = em.valorEspecie && em.valorEspecie > 0 ? em.valorEspecie : 10;
          }
        });

        // For species that are NOT saved in the database but exist, pre-select if they are matriculas/pensiones
        this.todosEspecies.forEach(e => {
          const matched = especies.some((em: any) => em.idEspecie === e.idEspecie);
          if (!matched) {
            if (e.esMatricula || e.esPension || e.detalle?.toLowerCase().includes('matricula')) {
              e._sel = true;
              e._valor = e._valor && e._valor > 0 ? e._valor : 10;
            }
          }
        });
        this.actualizarMateriasPorModulo();
      }
    });
  }

  // Getters
  get totalMateriasSeleccionadas(): number {
    return this.materiasDisponibles.filter(m => m._selected).length;
  }
  get totalRequisitosSeleccionados(): number {
    return this.todosRequisitos.filter(r => r._sel).length;
  }
  get totalParalelosSeleccionados(): number {
    return this.todosParalelos.filter(p => p._sel).length;
  }
  get totalEspeciesSeleccionadas(): number {
    return this.todosEspecies.filter(e => e._sel).length;
  }

  get todasMateriasSel(): boolean {
    return this.materiasFiltradas.length > 0 && this.materiasFiltradas.every(m => m._selected);
  }
  get todosRequisitosSel(): boolean {
    return this.todosRequisitos.length > 0 && this.todosRequisitos.every(r => r._sel);
  }
  get todosParalelosSel(): boolean {
    return this.todosParalelos.length > 0 && this.todosParalelos.every(p => p._sel);
  }
  get todosEspeciesSel(): boolean {
    return this.todosEspecies.length > 0 && this.todosEspecies.every(e => e._sel);
  }

  modulosUnicos: number[] = [];
  materiasPorModulo: { modulo: number; materias: string[]; fechaInicio: string; fechaFin: string }[] = [];

  actualizarMateriasPorModulo(): void {
    const mods = new Set<number>();
    this.materiasDisponibles.filter(m => m._selected).forEach(m => mods.add(Number(m._modulo) || 1));
    this.modulosUnicos = Array.from(mods).sort((a, b) => a - b);

    this.materiasPorModulo = this.modulosUnicos.map(mod => {
      const mats = this.materiasDisponibles.filter(m => m._selected && (Number(m._modulo) || 1) === mod);
      const fInicio = mats.find(m => m._fechaInicio)?._fechaInicio ?? '';
      const fFin = mats.find(m => m._fechaFin)?._fechaFin ?? '';
      return {
        modulo: mod,
        materias: mats.map(m => m.detalle || `Materia #${m.idMateria}`),
        fechaInicio: fInicio,
        fechaFin: fFin
      };
    });

    // Consultar backend para auto-completar fechas sugeridas si existen en otra malla del mismo periodo
    const cId = this.selectedCicloId;
    if (cId) {
      this.modulosUnicos.forEach(mod => {
        const mats = this.materiasDisponibles.filter(m => m._selected && (Number(m._modulo) || 1) === mod);
        const tieneFechas = mats.some(m => !!m._fechaInicio || !!m._fechaFin);
        if (!tieneFechas) {
          this.detalleMallaService.getFechasSugeridasModulo(cId, mod).subscribe(res => {
            if (res && res.tieneFechasSugeridas) {
              if (res.fechaInicio) {
                this.materiasDisponibles.forEach(m => {
                  if (m._selected && (Number(m._modulo) || 1) === mod && !m._fechaInicio) {
                    m._fechaInicio = res.fechaInicio!;
                  }
                });
              }
              if (res.fechaFin) {
                this.materiasDisponibles.forEach(m => {
                  if (m._selected && (Number(m._modulo) || 1) === mod && !m._fechaFin) {
                    m._fechaFin = res.fechaFin!;
                  }
                });
              }
              this.actualizarMateriasPorModuloSilencioso();
            }
          });
        }
      });
    }
  }



  private actualizarMateriasPorModuloSilencioso(): void {
    this.materiasPorModulo = this.modulosUnicos.map(mod => {
      const mats = this.materiasDisponibles.filter(m => m._selected && (Number(m._modulo) || 1) === mod);
      const fInicio = mats.find(m => m._fechaInicio)?._fechaInicio ?? '';
      const fFin = mats.find(m => m._fechaFin)?._fechaFin ?? '';
      return {
        modulo: mod,
        materias: mats.map(m => m.detalle || `Materia #${m.idMateria}`),
        fechaInicio: fInicio,
        fechaFin: fFin
      };
    });
  }


  get materiasFiltradas() {
    const t = this.materiasFilterText.trim().toLowerCase();
    if (!t) return this.materiasDisponibles;
    const nivel = this.obtenerNivelCursoNumero();
    if (nivel != null && t === String(nivel)) {
      return this.materiasDisponibles.filter(m =>
        m._selected || this.materiaCoincideNivel(m, nivel)
      );
    }
    const escapa = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.materiasDisponibles.filter(m =>
      m._selected || new RegExp(`\\b${escapa(t)}`).test((m.detalle ?? '').toLowerCase())
    );
  }

  private materiaCoincideNivel(m: any, nivel: number): boolean {
    const numeros = (m.detalle ?? '').match(/\b\d+\b/g)?.map(Number) ?? [];
    return numeros.includes(nivel);
  }

  private obtenerNivelCursoNumero(): number | null {
    const match = (this.curso?.detalle ?? '').match(/\d+/);
    return match ? Number(match[0]) : null;
  }

  get materiasSeleccionadasResumen() {
    return this.materiasDisponibles.filter(m => m._selected);
  }
  get requisitosSeleccionadosResumen() {
    return this.todosRequisitos.filter(r => r._sel);
  }
  get paralelosSeleccionadosResumen() {
    return this.todosParalelos.filter(p => p._sel);
  }
  get especiesSeleccionadasResumen() {
    return this.todosEspecies.filter(e => e._sel);
  }

  get wizardProgress(): number {
    return Math.round(((this.wizardStep - 1) / (this.totalSteps - 1)) * 100);
  }

  // Validaciones
  validarHorasMaterias(): boolean {
    // "no pueden ir con valores de 0"
    return this.materiasDisponibles
      .filter(m => m._selected)
      .every(m => m._horas != null && m._horas > 0);
  }

  validarCuposParalelos(): boolean {
    // "no pueden ir con valores de 0"
    return this.todosParalelos
      .filter(p => p._sel)
      .every(p => p._cupo != null && p._cupo > 0);
  }

  validarValoresEspecies(): boolean {
    // "no pueden ir con valores de 0"
    return this.todosEspecies
      .filter(e => e._sel)
      .every(e => e._valor != null && e._valor > 0);
  }

  get canGoNext(): boolean {
    // "siempre deben estar seleccionados al menos datos , no pueden ir con valores de 0"
    switch (this.wizardStep) {
      case 1:
        return this.totalMateriasSeleccionadas > 0 && this.validarHorasMaterias();
      case 2:
        return this.modulosUnicos.length > 0;
      case 3:
        return this.totalRequisitosSeleccionados > 0;
      case 4:
        return this.totalParalelosSeleccionados > 0 && this.validarCuposParalelos();
      case 5:
        return this.totalEspeciesSeleccionadas > 0 && this.validarValoresEspecies();
      case 6:
        return this.esFormularioValido();
      default:
        return false;
    }
  }

  canNavigateToStep(step: number): boolean {
    if (step === 1) return true;
    if (step === 2) return this.totalMateriasSeleccionadas > 0 && this.validarHorasMaterias();
    if (step === 3) return this.totalMateriasSeleccionadas > 0 && this.validarHorasMaterias();
    if (step === 4) return this.totalMateriasSeleccionadas > 0 && this.validarHorasMaterias() && this.totalRequisitosSeleccionados > 0;
    if (step === 5) return this.totalMateriasSeleccionadas > 0 && this.validarHorasMaterias() && this.totalRequisitosSeleccionados > 0 && this.totalParalelosSeleccionados > 0 && this.validarCuposParalelos();
    if (step === 6) return this.totalMateriasSeleccionadas > 0 && this.totalRequisitosSeleccionados > 0 && this.totalParalelosSeleccionados > 0 && this.totalEspeciesSeleccionadas > 0;
    return false;
  }

  esFormularioValido(): boolean {
    return this.totalMateriasSeleccionadas > 0 && this.validarHorasMaterias() &&
      this.totalRequisitosSeleccionados > 0 &&
      this.totalParalelosSeleccionados > 0 && this.validarCuposParalelos() &&
      this.totalEspeciesSeleccionadas > 0 && this.validarValoresEspecies();
  }

  mostrarErroresValidacion(step: number): void {
    if (step === 1) {
      if (this.totalMateriasSeleccionadas === 0) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Materia requerida',
          detail: 'Debe seleccionar al menos una materia para poder continuar.'
        });
      } else if (!this.validarHorasMaterias()) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Horas inválidas',
          detail: 'Todas las materias seleccionadas deben tener un número de horas mayor a 0.'
        });
      }
    } else if (step === 2) {
      if (this.modulosUnicos.length === 0) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Sin módulos',
          detail: 'Debe regresar al paso anterior y seleccionar al menos una materia.'
        });
      }
    } else if (step === 3) {
      if (this.totalRequisitosSeleccionados === 0) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Requisito requerido',
          detail: 'Debe seleccionar al menos un requisito para poder continuar.'
        });
      }
    } else if (step === 4) {
      if (this.totalParalelosSeleccionados === 0) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Paralelo requerido',
          detail: 'Debe seleccionar al menos un paralelo para poder continuar.'
        });
      } else if (!this.validarCuposParalelos()) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Cupos inválidos',
          detail: 'Todos los paralelos seleccionados deben tener un cupo mayor a 0.'
        });
      }
    } else if (step === 5) {
      if (this.totalEspeciesSeleccionadas === 0) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Costo requerido',
          detail: 'Debe seleccionar al menos un costo o matrícula para poder continuar.'
        });
      } else if (!this.validarValoresEspecies()) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Valores inválidos',
          detail: 'Todos los costos seleccionados deben tener un valor mayor a 0.'
        });
      }
    } else if (step === 6) {
      if (this.totalMateriasSeleccionadas === 0) {
        this.messageService.add({ severity: 'warn', summary: 'Materia requerida', detail: 'Debe seleccionar al menos una materia.' });
      } else if (!this.validarHorasMaterias()) {
        this.messageService.add({ severity: 'warn', summary: 'Horas inválidas', detail: 'Hay materias seleccionadas con 0 horas.' });
      } else if (this.totalRequisitosSeleccionados === 0) {
        this.messageService.add({ severity: 'warn', summary: 'Requisito requerido', detail: 'Debe seleccionar al menos un requisito.' });
      } else if (this.totalParalelosSeleccionados === 0) {
        this.messageService.add({ severity: 'warn', summary: 'Paralelo requerido', detail: 'Debe seleccionar al menos un paralelo.' });
      } else if (!this.validarCuposParalelos()) {
        this.messageService.add({ severity: 'warn', summary: 'Cupos inválidos', detail: 'Hay paralelos seleccionados con cupo 0.' });
      } else if (this.totalEspeciesSeleccionadas === 0) {
        this.messageService.add({ severity: 'warn', summary: 'Costo requerido', detail: 'Debe seleccionar al menos un costo o matrícula.' });
      } else if (!this.validarValoresEspecies()) {
        this.messageService.add({ severity: 'warn', summary: 'Valores inválidos', detail: 'Hay costos seleccionados con valor 0.' });
      }
    }
  }

  clickStepHeader(step: number): void {
    if (this.canNavigateToStep(step)) {
      this.wizardStep = step;
    } else {
      if (step > this.wizardStep) {
        this.mostrarErroresValidacion(this.wizardStep);
      }
    }
  }

  nextStep(): void {
    if (this.canGoNext) {
      if (this.wizardStep < this.totalSteps) {
        this.wizardStep++;
      }
    } else {
      this.mostrarErroresValidacion(this.wizardStep);
    }
  }

  prevStep(): void {
    if (this.wizardStep > 1) {
      this.wizardStep--;
    }
  }

  markDirty(): void {
    this.configDirty = true;
  }

  onVisibleChange(isVisible: boolean): void {
    if (!isVisible && this.configDirty) {
      this.pendingConfigAction = () => {
        this.visible = false;
        this.visibleChange.emit(false);
        this.configDirty = false;
      };
      this.showUnsavedChangesDialog = true;
      return;
    }
    this.visible = isVisible;
    this.visibleChange.emit(isVisible);
  }

  onCancel(): void {
    if (this.configDirty) {
      this.pendingConfigAction = () => {
        this.visible = false;
        this.visibleChange.emit(false);
        this.configDirty = false;
      };
      this.showUnsavedChangesDialog = true;
    } else {
      this.visible = false;
      this.visibleChange.emit(false);
    }
  }

  confirmUnsavedChanges(): void {
    this.showUnsavedChangesDialog = false;
    if (this.pendingConfigAction) {
      this.pendingConfigAction();
      this.pendingConfigAction = null;
    }
  }

  cancelUnsavedChanges(): void {
    this.showUnsavedChangesDialog = false;
    this.pendingConfigAction = null;
  }

  // Fechas y Propagación
  propagarFechaInicio(modulo: number, fecha: string): void {
    this.materiasDisponibles.forEach(m => {
      if (m._selected && (Number(m._modulo) || 1) === modulo) m._fechaInicio = fecha;
    });
    const fechaFin = this.addDays(fecha, this.DIAS_POR_MODULO);
    this.propagarFechaFin(modulo, fechaFin);
    this.cascadaForward(modulo);
    this.actualizarMateriasPorModulo();
    this.markDirty();
  }

  propagarFechaFin(modulo: number, fecha: string): void {
    this.materiasDisponibles.forEach(m => {
      if (m._selected && (Number(m._modulo) || 1) === modulo) m._fechaFin = fecha;
    });
    this.cascadaForward(modulo);
    this.actualizarMateriasPorModulo();
    this.markDirty();
  }

  private cascadaForward(fromModulo: number): void {
    const modulos = this.modulosUnicos.sort((a, b) => a - b);
    const idx = modulos.indexOf(fromModulo);
    if (idx === -1 || idx >= modulos.length - 1) return;
    for (let i = idx + 1; i < modulos.length; i++) {
      const prevMod = modulos[i - 1];
      const currentMod = modulos[i];
      const prevFechaFin = this.getFechaFinModulo(prevMod);
      if (!prevFechaFin) break;
      const nextInicio = this.nextDaySkipSunday(prevFechaFin);
      const nextFin = this.addDays(nextInicio, this.DIAS_POR_MODULO);
      this.materiasDisponibles.forEach(m => {
        if (m._selected && (Number(m._modulo) || 1) === currentMod) {
          m._fechaInicio = nextInicio;
          m._fechaFin = nextFin;
        }
      });
    }
  }

  getFechaInicioModulo(modulo: number): string {
    const m = this.materiasDisponibles.find(m => m._selected && (Number(m._modulo) || 1) === modulo && m._fechaInicio);
    return m?._fechaInicio ?? '';
  }

  getFechaFinModulo(modulo: number): string {
    const m = this.materiasDisponibles.find(m => m._selected && (Number(m._modulo) || 1) === modulo && m._fechaFin);
    return m?._fechaFin ?? '';
  }

  // Toggles
  toggleMateriaRow(m: any): void {
    m._selected = !m._selected;
    if (m._selected) {
      if (m._modulo == null) m._modulo = 1;
      if (m._horas == null || m._horas <= 0) m._horas = m.horasRequeridas && m.horasRequeridas > 0 ? m.horasRequeridas : 40;
    }
    this.actualizarMateriasPorModulo();
    this.markDirty();
  }

  toggleTodasMaterias(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.materiasFiltradas.forEach(m => {
      m._selected = checked;
      if (checked) {
        if (m._modulo == null) m._modulo = 1;
        if (m._horas == null || m._horas <= 0) m._horas = m.horasRequeridas && m.horasRequeridas > 0 ? m.horasRequeridas : 40;
      }
    });
    this.actualizarMateriasPorModulo();
    this.markDirty();
  }

  toggleRequisito(r: any): void {
    r._sel = !r._sel;
    this.markDirty();
  }

  toggleTodosRequisitos(event: Event): void {
    const c = (event.target as HTMLInputElement).checked;
    this.todosRequisitos.forEach(r => r._sel = c);
    this.markDirty();
  }

  toggleParalelo(p: any): void {
    p._sel = !p._sel;
    if (p._sel && (!p._cupo || p._cupo <= 0)) {
      p._cupo = 30;
    }
    this.markDirty();
  }

  toggleTodosParalelos(event: Event): void {
    const c = (event.target as HTMLInputElement).checked;
    this.todosParalelos.forEach(p => {
      p._sel = c;
      if (c && (!p._cupo || p._cupo <= 0)) {
        p._cupo = 30;
      }
    });
    this.markDirty();
  }

  toggleEspecie(e: any): void {
    e._sel = !e._sel;
    if (e._sel && (!e._valor || e._valor <= 0)) {
      e._valor = 10;
    }
    this.markDirty();
  }

  toggleTodosEspecies(event: Event): void {
    const c = (event.target as HTMLInputElement).checked;
    this.todosEspecies.forEach(e => {
      e._sel = c;
      if (c && (!e._valor || e._valor <= 0)) {
        e._valor = 10;
      }
    });
    this.markDirty();
  }

  onPlantillaChange(value: number): void {
    this.materiaDefaultPlantilla = value;
    this.materiasDisponibles.forEach(m => {
      if (this.materiaDefaultPlantilla != null) {
        m._plantilla = this.materiaDefaultPlantilla;
      }
    });
    this.markDirty();
  }

  // Evento recibido al crear materia en MateriaDialogComponent
  onNuevaMateriaCreada(nuevo: MateriaDTO): void {
    if (!nuevo) return;
    const row = {
      idMateria: nuevo.idMateria,
      detalle: nuevo.detalle || '',
      horasRequeridas: nuevo.horasRequeridas ?? 40,
      _selected: true,
      _modulo: 1,
      _horas: nuevo.horasRequeridas ?? 40,
      _fechaInicio: '',
      _fechaFin: '',
      _plantilla: this.materiaDefaultPlantilla ?? undefined,
      _area: this.autoAsignarArea(nuevo.detalle)
    };
    this.materiasDisponibles = [...this.materiasDisponibles, row];
    this.actualizarMateriasPorModulo();
    this.markDirty();
  }

  guardarNuevoRequisito(): void {
    if (!this.nuevoRequisitoDetalle.trim()) return;
    const data: RequisitoDTO = {
      detalle: this.nuevoRequisitoDetalle.trim().toUpperCase(),
      tipoDato: this.nuevoRequisitoTipoDato,
      esObligatorio: this.nuevoRequisitoObligatorio,
      bloqueaInscripcion: this.nuevoRequisitoBloquea
    };
    this.requisitosService.create(data).subscribe({
      next: (nuevo) => {
        const item = { ...nuevo, _sel: true };
        this.todosRequisitos = [...this.todosRequisitos, item];
        this.showRequisitoDialog = false;
        this.nuevoRequisitoDetalle = '';
        this.nuevoRequisitoTipoDato = 'ADJUNTO';
        this.nuevoRequisitoObligatorio = false;
        this.nuevoRequisitoBloquea = false;
        this.markDirty();
        this.messageService.add({ severity: 'success', summary: 'Creado', detail: 'Requisito creado y seleccionado' });
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear el requisito' })
    });
  }

  guardarNuevaEspecie(): void {
    if (!this.nuevaEspecieDetalle.trim()) return;
    const data: EspecieDTO = {
      detalle: this.nuevaEspecieDetalle.trim().toUpperCase(),
      esMatricula: this.nuevaEspecieEsMatricula,
      esPension: this.nuevaEspecieEsPension,
      activo: true
    };
    this.especieService.create(data).subscribe({
      next: (nuevo) => {
        const item = { ...nuevo, _sel: true, _valor: this.nuevaEspecieValor && this.nuevaEspecieValor > 0 ? this.nuevaEspecieValor : 10 };
        this.todosEspecies = [...this.todosEspecies, item];
        this.showEspecieDialog = false;
        this.nuevaEspecieDetalle = '';
        this.nuevaEspecieValor = null;
        this.nuevaEspecieEsMatricula = false;
        this.nuevaEspecieEsPension = false;
        this.markDirty();
        this.messageService.add({ severity: 'success', summary: 'Creada', detail: 'Especie creada y seleccionada' });
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear la especie' })
    });
  }

  // Guardado principal
  guardarConfiguracionCurso(): void {
    if (!this.esFormularioValido()) {
      this.mostrarErroresValidacion(6);
      return;
    }
    if (!this.curso || !this.selectedCicloId) return;
    this.guardando = true;

    const materiasSeleccionadas = this.materiasDisponibles
      .filter(m => m._selected)
      .map(m => ({
        materia: { idMateria: m.idMateria, detalle: m.detalle, horasRequeridas: m.horasRequeridas },
        modulo: m._modulo ?? 1,
        idPlantillaEvaluacion: m._plantilla ?? this.materiaDefaultPlantilla ?? 0,
        idAreaCompetencia: m._area ?? this.autoAsignarArea(m.detalle),
        horas: m._horas ?? m.horasRequeridas ?? 40,
        fechaInicio: m._fechaInicio ?? '',
        fechaFin: m._fechaFin ?? ''
      }));

    const requisitosSeleccionados = this.todosRequisitos
      .filter(r => r._sel)
      .map(r => {
        const { _sel, ...req } = r;
        return req as RequisitoDTO;
      });

    const paralelosSeleccionados = this.todosParalelos
      .filter(p => p._sel)
      .map(p => {
        const { _sel, _cupo, ...par } = p;
        return {
          ...par,
          cupoMaximo: p._cupo ?? p.cupoMaximo ?? 30
        } as ParaleloDTO;
      });

    const especiesSeleccionadas = this.todosEspecies
      .filter(e => e._sel)
      .map(e => ({
        especie: { idEspecie: e.idEspecie, detalle: e.detalle, esMatricula: e.esMatricula, esPension: e.esPension } as EspecieDTO,
        valorEspecie: e._valor ?? 10
      }));

    const curso = this.curso;
    const cursoName = curso.detalle || 'Curso';

    const mallaData: MallaDTO = {
      idMalla: curso._mallaId,
      detalle: cursoName,
      idCursos: curso.idCursos!,
      idTipoOferta: +this.selectedTipoOfertaId!,
      idCiclo: this.selectedCicloId
    };

    const mallaObs = curso._mallaId
      ? this.mallaService.update(mallaData)
      : this.mallaService.create(mallaData);

    mallaObs.subscribe({
      next: (malla) => {
        const idMalla = malla.idMalla || curso._mallaId;
        if (!idMalla) {
          this.guardando = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear/actualizar la malla' });
          return;
        }

        const reqObs: any[] = [];
        const detalles = materiasSeleccionadas.map(m => ({
          idMalla, idMateria: m.materia.idMateria!,
          idPlantillaEvaluacion: m.idPlantillaEvaluacion,
          idAreaCompetencia: m.idAreaCompetencia,
          modulo: m.modulo, fechaInicio: m.fechaInicio, fechaFin: m.fechaFin,
          duracionHoras: m.horas
        } as DetalleMallaCreateDTO));

        if (detalles.length > 0) {
          reqObs.push(this.detalleMallaService.createBulk(detalles));
        }

        if (requisitosSeleccionados.length > 0) {
          const ids = requisitosSeleccionados.map(r => r.idRequisitos!).filter(Boolean);
          if (ids.length > 0) reqObs.push(this.requisitosService.asignarRequisitosAMalla(idMalla, ids));
        }

        paralelosSeleccionados.forEach(p => {
          if (p.idParalelo != null) {
            reqObs.push(this.mallaParaleloService.create({
              idMalla, idParalelo: p.idParalelo, cupoMaximo: p.cupoMaximo ?? 30
            } as MallaParaleloCreateDTO));
          }
        });

        especiesSeleccionadas.forEach(e => {
          if (e.especie.idEspecie != null) {
            reqObs.push(this.especieCicloService.create({
              idMalla, idEspecie: e.especie.idEspecie, valorEspecie: e.valorEspecie
            } as EspecieCicloDTO));
          }
        });

        if (reqObs.length === 0) {
          this.guardando = false;
          this.configDirty = false;
          this.visible = false;
          this.visibleChange.emit(false);
          this.saved.emit({ idMalla, materiasSeleccionadas, requisitosSeleccionados, paralelosSeleccionados, especiesSeleccionadas });
          return;
        }

        forkJoin(reqObs).subscribe({
          next: () => {
            this.guardando = false;
            this.configDirty = false;
            this.visible = false;
            this.visibleChange.emit(false);
            this.saved.emit({ idMalla, materiasSeleccionadas, requisitosSeleccionados, paralelosSeleccionados, especiesSeleccionadas });
          },
          error: () => {
            this.guardando = false;
            this.messageService.add({ severity: 'warn', summary: 'Advertencia', detail: 'Malla guardada pero algunos datos no se asignaron' });
            this.visible = false;
            this.visibleChange.emit(false);
            this.saved.emit({ idMalla, materiasSeleccionadas, requisitosSeleccionados, paralelosSeleccionados, especiesSeleccionadas });
          }
        });
      },
      error: () => {
        this.guardando = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la configuración del curso' });
      }
    });
  }

  // Helpers
  private obtenerNivelCurso(): string {
    const match = (this.curso?.detalle ?? '').match(/\d+/);
    return match ? match[0] : '';
  }

  private autoAsignarArea(nombre: string | undefined): number {
    if (!nombre) return 1;
    const upper = nombre.toUpperCase();
    for (const entry of this.AREA_KEYWORDS) {
      if (entry.keywords.some(k => upper.includes(k))) return entry.areaId;
    }
    return 1;
  }

  private formatDate(d: Date | string | undefined): string {
    if (!d) return '';
    const date = d instanceof Date ? d : new Date(d);
    return date.toISOString().split('T')[0];
  }

  private addDays(dateStr: string, days: number): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    date.setUTCDate(date.getUTCDate() + days);
    return this.formatDate(date);
  }

  private nextDaySkipSunday(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    date.setUTCDate(date.getUTCDate() + 1);
    if (date.getUTCDay() === 0) {
      date.setUTCDate(date.getUTCDate() + 1);
    }
    return this.formatDate(date);
  }

  trackByModulo(index: number, grupo: any): number {
    return grupo.modulo;
  }
}
