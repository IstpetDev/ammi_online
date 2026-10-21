import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { forkJoin } from 'rxjs';
import { CustomSelectComponent } from '../../../../shared/custom-select/custom-select.component';
import { SharedDrawerComponent } from '../../../../shared/shared-drawer/shared-drawer.component';
import {
  CicloDTO, TipoOfertaDTO,
  EspecialidadDTO, CursoDTO, MateriaDTO, MallaDTO,
  RequisitoDTO, ParaleloDTO, EspecieDTO, EspecieCicloDTO,
  AreaCompetenciaDTO, MallaParaleloDTO, MallaParaleloCreateDTO
} from '../../../../data/models/Entities';
import { DetalleMallaCreateDTO, DetalleMallaDTO } from '../../../../data/models/detalle-malla/detalle-malla.model';
import { PlantillaEvaluacionDTO, PlantillaEvaluacionCreateDTO } from '../../../../data/models/notas/plantilla-evaluacion.model';
import { CicloService } from '../../../../core/services/infrastructure/ciclo.service';
import { TipoOfertaService } from '../../../../core/services/postulaciones/tipo-oferta.service';
import { EspecialidadService } from '../../../../core/services/infrastructure/especialidad.service';
import { CursoService } from '../../../../core/services/infrastructure/curso.service';
import { MateriaService } from '../../../../core/services/infrastructure/materia.service';
import { MallaService } from '../../../../core/services/infrastructure/malla.service';
import { DetalleMallaService } from '../../../../core/services/infrastructure/detalle-malla.service';
import { RequisitosService } from '../../../../core/services/settings/requisitos.service';
import { ParaleloService } from '../../../../core/services/infrastructure/paralelo.service';
import { EspecieService } from '../../../../core/services/infrastructure/especie.service';
import { EspecieCicloService } from '../../../../core/services/infrastructure/especie-ciclo.service';
import { PlantillaEvaluacionService } from '../../../../core/services/infrastructure/plantilla-evaluacion.service';
import { AreaCompetenciaService } from '../../../../core/services/infrastructure/area-competencia.service';
import { MallaCompletaService, DuplicarMallaRequest } from '../../../../core/services/infrastructure/malla-completa.service';
import { MallaParaleloService } from '../../../../core/services/infrastructure/malla-paralelo.service';
import { API_ENDPOINTS } from '../../../../core/constants/app.constants';
import { environment } from '../../../../environments/environment';
import { SharedToastComponent } from '../../../../shared/shared-toast/shared-toast.component';

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
  selector: 'app-crear-curso-rapido',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, DialogModule, TableModule,
    CustomSelectComponent, SharedDrawerComponent, SharedToastComponent],
  providers: [MessageService],
  templateUrl: './crear-curso-rapido.component.html',
  styles: [`
    .quick-setup { width: 100%; font-family: 'Poppins', sans-serif; }
    .qs-header { margin-bottom: 1rem; }
    .qs-header h1 { margin: 0 0 0.25rem 0; font-size: 1.2rem; display: flex; align-items: center; gap: 0.4rem; color: var(--text-color); }
    .qs-header h1 i { color: var(--brand-yellow-dark); }
    .qs-header p { margin: 0; color: var(--text-color-secondary); font-size: 0.8rem; }
    .qs-duplicar-banner {
      display: flex; align-items: center; justify-content: space-between; gap: 0.75rem;
      padding: 0.65rem 1rem; background: #e3f2fd; border: 1px solid #90caf9; border-radius: 10px;
      margin-bottom: 0.75rem; flex-wrap: wrap;
    }
    .qs-duplicar-info { display: flex; align-items: center; gap: 0.5rem; }
    .qs-duplicar-info i { font-size: 1.1rem; color: #1976d2; }
    .qs-duplicar-info strong { font-size: 0.8rem; color: #0d47a1; display: block; }
    .qs-duplicar-info p { margin: 0; font-size: 0.75rem; color: #1565c0; }
    .qs-duplicar-success { background: #e8f5e9; border-color: #a5d6a7; }
    .qs-duplicar-success i { font-size: 1.1rem; color: #2e7d32; }
    .qs-duplicar-success span { font-size: 0.8rem; color: #1b5e20; }
    .btn-sm { padding: 0.35rem 0.75rem; font-size: 0.75rem; }
    .qs-card { background: var(--surface-card); border: 1px solid var(--surface-border); border-radius: 12px; padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .qs-section-title {
      margin: 0.25rem 0 0 0; font-size: 0.82rem; font-weight: 700; color: var(--text-color);
      display: flex; align-items: center; gap: 0.3rem;
    }
    .qs-section-title i { color: var(--brand-yellow-dark); font-size: 0.75rem; }
    .qs-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.65rem; }
    .qs-field { display: flex; flex-direction: column; gap: 0.25rem; }
    .qs-field label { font-size: 0.75rem; font-weight: 600; color: var(--text-color); }
    .qs-field-row { display: flex; gap: 0.4rem; align-items: center; }
    .qs-field-row app-custom-select { flex: 1; }
    .qs-section-row { display: flex; flex-direction: column; gap: 0.6rem; }
    .qs-btn-select {
      padding: 0.4rem 0.85rem; font-size: 0.78rem; font-weight: 600; border-radius: 8px; cursor: pointer;
      background: var(--surface-ground); border: 1px solid var(--surface-border); color: var(--text-color);
      display: inline-flex; align-items: center; gap: 0.35rem; transition: all 0.2s ease; font-family: inherit; align-self: flex-start;
    }
    .qs-btn-select:hover:not(:disabled) { border-color: var(--brand-yellow-dark); background: rgba(233,185,2,0.08); }
    .qs-btn-select:disabled { opacity: 0.5; cursor: not-allowed; }
    .qs-tags { display: flex; flex-wrap: wrap; gap: 0.25rem; }
    .qs-tag {
      display: inline-flex; align-items: center; gap: 0.25rem; padding: 0.2rem 0.5rem;
      background: rgba(233,185,2,0.12); border-radius: 16px; font-size: 0.72rem; color: var(--text-color);
    }
    .qs-tag i { font-size: 0.5rem; cursor: pointer; color: var(--text-color-secondary); }
    .qs-tag i:hover { color: var(--error-color); }
    .qs-actions { display: flex; justify-content: flex-end; gap: 0.65rem; padding-top: 0.65rem; border-top: 1px solid var(--surface-border); }
    .qs-dialog-body { display: flex; flex-direction: column; gap: 1rem; padding: 0.5rem 0; }
    .qs-dialog-field { display: flex; flex-direction: column; gap: 0.25rem; }
    .qs-dialog-field label { font-size: 0.75rem; font-weight: 600; color: var(--text-color); }
    .qs-dialog-field input[type="text"], .qs-dialog-field input[type="number"], .qs-dialog-field input[type="date"] {
      width: 100%; padding: 0.5rem 0.7rem; background: var(--surface-section); border: 2px solid var(--surface-border);
      border-radius: 8px; font-size: 0.82rem; color: var(--text-color); outline: none; font-family: inherit;
      transition: border-color 0.2s ease; box-sizing: border-box;
    }
    .qs-dialog-field input:focus { border-color: var(--brand-yellow-dark); box-shadow: 0 0 0 3px rgba(233,185,2,0.12); }
    .qs-dialog-check-row label { display: flex; align-items: center; gap: 0.4rem; font-size: 0.78rem; color: var(--text-color); cursor: pointer; }
    .qs-dialog-check-row input[type="checkbox"] { width: 15px; height: 15px; cursor: pointer; }
    .qs-dialog-info { display: flex; align-items: center; gap: 0.35rem; padding: 0.4rem; background: var(--surface-ground); border-radius: 6px; font-size: 0.75rem; color: var(--text-color-secondary); }
    .qs-dialog-info i { color: var(--brand-yellow-dark); }
    .qs-radio-list { display: flex; flex-direction: column; gap: 0.3rem; }
    .qs-radio-item { display: flex; align-items: center; gap: 0.4rem; padding: 0.4rem 0.6rem; border-radius: 6px; cursor: pointer; font-size: 0.82rem; color: var(--text-color); transition: background 0.15s ease; }
    .qs-radio-item:hover { background: var(--surface-hover); }
    .qs-radio-item input[type="radio"] { width: 15px; height: 15px; cursor: pointer; }
    .qs-empty-msg { padding: 0.75rem; text-align: center; font-size: 0.78rem; color: var(--text-color-secondary); }
    .qs-drawer-content { display: flex; flex-direction: column; gap: 1rem; padding: 0.5rem 0; }
    .qs-table-wrap { width: 100%; overflow-x: auto; }
    .qs-table-wrap ::ng-deep .p-datatable { width: 100%; }
    .qs-table-wrap ::ng-deep .p-datatable-table { width: 100%; table-layout: fixed; }
    .qs-table-wrap ::ng-deep .p-datatable-tbody > tr > td,
    .qs-table-wrap ::ng-deep .p-datatable-thead > tr > th { padding: 0.65rem 0.5rem; }
    .qs-plantilla-row { display: flex; flex-direction: column; gap: 0.75rem; }
    .qs-plantilla-row .qs-defaults-row { width: 100%; }
    .qs-btn-plantilla-toggle {
      padding: 0.35rem 0.7rem; font-size: 0.72rem; font-weight: 500; border-radius: 6px; cursor: pointer;
      background: transparent; border: 1px solid var(--surface-border); color: var(--text-color-secondary);
      display: inline-flex; align-items: center; gap: 0.35rem; transition: all 0.2s ease; font-family: inherit; white-space: nowrap;
    }
    .qs-btn-plantilla-toggle:hover { border-color: var(--brand-yellow-dark); color: var(--text-color); background: rgba(233,185,2,0.06); }
    .qs-btn-plantilla-toggle.active { border-color: var(--brand-yellow-dark); color: var(--brand-black); background: rgba(233,185,2,0.12); }
    .qs-drawer-toolbar { display: flex; width: 100%; }
    .qs-btn-create {
      width: 100%; justify-content: center;
      padding: 0.45rem 0.85rem; font-size: 0.8rem; font-weight: 600; border-radius: 8px; cursor: pointer;
      background: var(--brand-yellow-dark); border: none; color: var(--brand-black);
      display: inline-flex; align-items: center; gap: 0.4rem; transition: background 0.2s ease; font-family: inherit;
    }
    .qs-btn-create:hover { background: var(--brand-yellow); }
    .qs-drawer-defaults { display: flex; flex-direction: column; gap: 0.85rem; padding: 0.75rem 0.85rem; background: var(--surface-ground); border-radius: 8px; }
    .qs-defaults-row { display: flex; align-items: center; gap: 0.4rem; flex: 1; min-width: 180px; }
    .qs-defaults-row label { font-size: 0.75rem; font-weight: 600; color: var(--text-color-secondary); white-space: nowrap; }
    .qs-defaults-row app-custom-select { flex: 1; width: 100%; }
    .qs-inline-input {
      width: 100%; padding: 0.35rem 0.45rem; background: var(--surface-section); border: 1px solid var(--surface-border);
      border-radius: 6px; font-size: 0.78rem; color: var(--text-color); outline: none; font-family: inherit; text-align: center;
      transition: border-color 0.2s ease; box-sizing: border-box;
    }
    .qs-inline-input[type="date"] { max-width: 140px; text-align: left; font-size: 0.75rem; padding: 0.35rem 0.5rem; }
    .qs-inline-input[type="number"] { max-width: 55px; }
    .qs-inline-input:focus { border-color: var(--brand-yellow-dark); }
    .qs-row-selected { background: rgba(233,185,2,0.08) !important; }
    .qs-empty { text-align: center; padding: 1.5rem 1rem; color: var(--text-color-secondary); font-size: 0.82rem; }
    .qs-historial-block { border: 1px solid var(--surface-border); border-radius: 8px; overflow: hidden; }
    .qs-historial-header {
      display: flex; align-items: center; gap: 0.5rem; padding: 0.55rem 0.75rem; cursor: pointer;
      background: var(--surface-ground); font-size: 0.8rem; font-weight: 600; color: var(--text-color);
      transition: background 0.15s ease; user-select: none;
    }
    .qs-historial-header:hover { background: var(--surface-hover); }
    .qs-historial-header i { font-size: 0.7rem; color: var(--text-color-secondary); }
    .qs-historial-header .qs-historial-count { margin-left: auto; font-size: 0.75rem; font-weight: 400; color: var(--text-color-secondary); }
    .qs-historial-body { padding: 0.75rem 0.85rem; display: flex; flex-direction: column; gap: 0.75rem; }
    .qs-historial-body .qs-table-wrapper { max-height: 220px; overflow-y: auto; }
    .qs-historial-actions { display: flex; justify-content: flex-end; gap: 0.5rem; }
    .qs-historial-loading { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem; justify-content: center; color: var(--text-color-secondary); font-size: 0.78rem; }
    .btn {
      padding: 0.6rem 1.25rem; border: none; border-radius: 0.35rem; font-size: 0.82rem; font-weight: 600;
      cursor: pointer; display: inline-flex; align-items: center; gap: 0.4rem; transition: all 0.2s ease; font-family: inherit;
    }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-secondary { background-color: var(--surface-ground); color: var(--text-color); border: 1px solid var(--surface-border); }
    .btn-secondary:hover:not(:disabled) { background-color: var(--surface-hover); }
    .btn-primary { background-color: var(--brand-yellow-dark); color: var(--brand-black); }
    .btn-primary:hover:not(:disabled) { background-color: var(--brand-yellow); }
    .btn-success { background-color: #22c55e; color: white; }
    .btn-success:hover:not(:disabled) { background-color: #16a34a; }
    :host-context(.app-dark) .qs-card { background: var(--surface-card); border-color: var(--surface-border); }
  `]
})
export class CrearCursoRapidoComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private cicloService = inject(CicloService);
  private tipoOfertaService = inject(TipoOfertaService);
  private especialidadService = inject(EspecialidadService);
  private cursoService = inject(CursoService);
  private materiaService = inject(MateriaService);
  private mallaService = inject(MallaService);
  private detalleMallaService = inject(DetalleMallaService);
  private requisitosService = inject(RequisitosService);
  private paraleloService = inject(ParaleloService);
  private especieService = inject(EspecieService);
  private especieCicloService = inject(EspecieCicloService);
  private plantillaEvaluacionService = inject(PlantillaEvaluacionService);
  private areaCompetenciaService = inject(AreaCompetenciaService);
  private mallaCompletaService = inject(MallaCompletaService);
  private mallaParaleloService = inject(MallaParaleloService);

  form!: FormGroup;

  ciclos: CicloDTO[] = [];
  ciclosPrevios: CicloDTO[] = [];
  tiposOferta: TipoOfertaDTO[] = [];
  especialidades: EspecialidadDTO[] = [];
  cursosTodos: CursoDTO[] = [];
  plantillas: PlantillaEvaluacionDTO[] = [];
  areasCompetencia: AreaCompetenciaDTO[] = [];
  todosRequisitos: (RequisitoDTO & { _sel?: boolean })[] = [];
  todosParalelos: (ParaleloDTO & { _sel?: boolean })[] = [];
  todosEspecies: (EspecieDTO & { _sel?: boolean; _valor?: number })[] = [];

  materiasDisponibles: (MateriaDTO & {
    _selected?: boolean; _modulo?: number; _horas?: number;
    _plantilla?: number; _area?: number;
    _fechaInicio?: string; _fechaFin?: string;
  })[] = [];

  materiasSeleccionadas: MateriaDrawerRow[] = [];
  requisitosSeleccionados: RequisitoDTO[] = [];
  paralelosSeleccionados: ParaleloDTO[] = [];
  especiesSeleccionadas: { especie: EspecieDTO; valorEspecie: number }[] = [];

  materiaDefaultPlantilla: number | null = null;
  showPlantillaColumn = false;

  showHistorial = false;
  cargandoHistorial = false;
  materiasHistorial: (DetalleMallaDTO & { _histSel?: boolean; _mallaOrigen?: string })[] = [];

  showDuplicarDialog = false;
  showMateriasDrawer = false;
  showRequisitosDrawer = false;
  showParalelosDrawer = false;
  showEspeciesDrawer = false;
  showMateriaDialog = false;
  showRequisitoDialog = false;
  showParaleloDialog = false;
  showEspecieDialog = false;

  origenCicloId: number | null = null;
  origenMallaId: number | null = null;
  mallasOrigen: MallaDTO[] = [];
  duplicando = false;
  mallaDuplicada = false;

  nuevaMateriaDetalle = '';
  nuevaMateriaHoras: number | null = null;
  nuevoRequisitoDetalle = '';
  nuevoRequisitoTipoDato: string = 'ADJUNTO';
  nuevoRequisitoObligatorio = false;
  nuevoRequisitoBloquea = false;
  nuevoParaleloNombre = '';
  nuevoParaleloCupo: number | null = null;
  nuevaEspecieDetalle = '';
  nuevaEspecieValor: number | null = null;
  nuevaEspecieEsMatricula = false;
  nuevaEspecieEsPension = false;

  loading = false;

  readonly tipoDatoOptions = [
    { label: 'Adjunto (PDF, imagen)', value: 'ADJUNTO' },
    { label: 'Sí / No', value: 'BOOL' }
  ];

  get cursosFiltrados(): CursoDTO[] {
    const idEsp = this.form?.get('idEspecialidad')?.value;
    return idEsp ? this.cursosTodos.filter(c => c.idEspecialidad === +idEsp) : [];
  }

  get todasMateriasSel(): boolean {
    return this.materiasDisponibles.length > 0 && this.materiasDisponibles.every(m => m._selected);
  }

  get todasHistorialSel(): boolean {
    return this.materiasHistorial.length > 0 && this.materiasHistorial.every(h => h._histSel);
  }

  get algunHistorialSel(): boolean {
    return this.materiasHistorial.some(h => h._histSel);
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

  get cicloDestinoLabel(): string {
    const id = this.form?.get('idCiclo')?.value;
    const c = this.ciclos.find(c => c.idCiclo === id);
    return c?.detalle ?? '—';
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      idCiclo: ['', Validators.required],
      idTipoOferta: ['', Validators.required],
      idEspecialidad: ['', Validators.required],
      idCurso: ['', Validators.required]
    });
    this.loadInitialData();
  }

  private loadInitialData(): void {
    forkJoin({
      ciclos: this.cicloService.getAll(),
      tiposOferta: this.tipoOfertaService.getTiposOfertaActivos(),
      especialidades: this.especialidadService.getAll(),
      cursos: this.cursoService.getAll(),
      materias: this.materiaService.getAll(200),
      requisitos: this.requisitosService.getAll(),
      paralelos: this.paraleloService.getAllParalelos(),
      especies: this.especieService.getAll(),
      plantillas: this.plantillaEvaluacionService.getActivas(),
      areas: this.areaCompetenciaService.getAll()
    }).subscribe({
      next: (data) => {
        this.ciclos = data.ciclos;
        this.tiposOferta = data.tiposOferta;
        this.especialidades = data.especialidades;
        this.cursosTodos = data.cursos;
        this.plantillas = data.plantillas;
        this.areasCompetencia = data.areas;
        this.materiasDisponibles = (data.materias.items || []).map(m => ({ ...m, _selected: false, _modulo: 1, _horas: m.horasRequeridas ?? 0, _fechaInicio: '', _fechaFin: '' }));
        this.todosRequisitos = (data.requisitos || []).map(r => ({ ...r, _sel: false }));
        this.todosParalelos = (data.paralelos || []).map(p => ({ ...p, _sel: false }));
        this.todosEspecies = (data.especies || []).map(e => ({ ...e, _sel: false, _valor: 0 }));

        const activo = data.ciclos.find(c => c.esActivo);
        if (activo?.idCiclo != null) {
          this.form.patchValue({ idCiclo: activo.idCiclo });
        }
        this.ciclosPrevios = data.ciclos.filter(c => c.idCiclo !== activo?.idCiclo);

        this.restoreFromSessionOrSetDefaults();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los datos iniciales' })
    });
  }

  private restoreFromSessionOrSetDefaults(): void {
    let idTipoOfertaFromSession: number | null = null;
    let idEspecialidadFromSession: number | null = null;
    let idCursoFromSession: number | null = null;

    try {
      const saved = sessionStorage.getItem('postulacion_manual_form');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.idTipoOferta) idTipoOfertaFromSession = +data.idTipoOferta;
        if (data.idMalla) {
          const malla = this.mallaService.getById(+data.idMalla);
          malla.subscribe(m => {
            if (m?.idCursos != null) {
              idCursoFromSession = m.idCursos;
              const curso = this.cursosTodos.find(c => c.idCursos === m.idCursos);
              if (curso?.idEspecialidad != null) {
                idEspecialidadFromSession = curso.idEspecialidad;
              }
              this.applyFormValues(idTipoOfertaFromSession, idEspecialidadFromSession, idCursoFromSession);
            }
          });
          return;
        }
      }
    } catch {}

    this.applyFormValues(idTipoOfertaFromSession, idEspecialidadFromSession, idCursoFromSession);
  }

  private applyFormValues(idTipoOferta: number | null, idEspecialidad: number | null, idCurso: number | null): void {
    const patch: any = {};

    if (idTipoOferta != null && this.tiposOferta.some(t => t.idtipoOferta === idTipoOferta)) {
      patch.idTipoOferta = idTipoOferta;
    } else if (this.tiposOferta.length > 0 && this.tiposOferta[0].idtipoOferta != null) {
      patch.idTipoOferta = this.tiposOferta[0].idtipoOferta;
    }

    if (idEspecialidad != null && this.especialidades.some(e => e.idEspecialidad === idEspecialidad)) {
      patch.idEspecialidad = idEspecialidad;
      if (idCurso != null && this.cursosTodos.some(c => c.idCursos === idCurso && c.idEspecialidad === idEspecialidad)) {
        patch.idCurso = idCurso;
      }
    } else if (this.especialidades.length > 0 && this.especialidades[0].idEspecialidad != null) {
      patch.idEspecialidad = this.especialidades[0].idEspecialidad;
    }

    if (Object.keys(patch).length > 0) {
      this.form.patchValue(patch);
      this.form.updateValueAndValidity();
    }
  }

  onCicloChange(id: any): void {
    this.form.patchValue({ idCiclo: id });
    this.ciclosPrevios = this.ciclos.filter(c => c.idCiclo !== +id);
  }

  onEspecialidadChange(id: any): void {
    this.form.patchValue({ idEspecialidad: id, idCurso: '' });
    this.materiasSeleccionadas = [];
  }

  onOrigenCicloChange(id: any): void {
    this.origenCicloId = id;
    this.origenMallaId = null;
    this.mallasOrigen = [];
    if (id) {
      this.mallaService.getByCiclo(id).subscribe({
        next: (data) => this.mallasOrigen = data,
        error: () => this.mallasOrigen = []
      });
    }
  }

  onCreateCurso(data: Record<string, any>): void {
    const idEsp = this.form.get('idEspecialidad')?.value;
    const cursoData: CursoDTO = { detalle: data['detalle'], idEspecialidad: idEsp ? +idEsp : undefined };
    this.cursoService.create(cursoData).subscribe({
      next: (nuevo) => {
        const id = typeof nuevo === 'number' ? nuevo : (nuevo as any).idCursos;
        const newCurso: CursoDTO = {
          idCursos: id,
          detalle: cursoData.detalle,
          idEspecialidad: cursoData.idEspecialidad
        };
        this.cursosTodos = [...this.cursosTodos, newCurso];
        if (id != null) this.form.patchValue({ idCurso: id });
        this.messageService.add({ severity: 'success', summary: 'Creado', detail: 'Curso creado' });
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear' })
    });
  }

  /* ── Duplicar ── */
  ejecutarDuplicar(): void {
    if (!this.origenMallaId || !this.form.get('idCiclo')?.value) return;
    this.duplicando = true;
    const req: DuplicarMallaRequest = {
      idMallaOrigen: this.origenMallaId,
      idCicloDestino: +this.form.get('idCiclo')!.value
    };
    this.mallaCompletaService.duplicar(req).subscribe({
      next: () => {
        this.duplicando = false;
        this.showDuplicarDialog = false;
        this.mallaDuplicada = true;
        this.messageService.add({ severity: 'success', summary: 'Duplicado', detail: 'Configuración duplicada exitosamente' });
      },
      error: () => {
        this.duplicando = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo duplicar la configuración' });
      }
    });
  }

  /* ── Drawers ── */
  openDrawer(type: string): void {
    if (type === 'materias') {
      this.materiasDisponibles.forEach(m => {
        const existing = this.materiasSeleccionadas.find(s => s.materia.idMateria === m.idMateria);
        m._selected = !!existing;
        m._modulo = existing?.modulo ?? 1;
        m._horas = existing?.horas ?? m.horasRequeridas ?? 0;
        m._fechaInicio = existing?.fechaInicio ?? '';
        m._fechaFin = existing?.fechaFin ?? '';
        m._plantilla = existing?.idPlantillaEvaluacion ?? this.materiaDefaultPlantilla ?? undefined;
      });
      this.cargarMateriasHistorial();
      this.showMateriasDrawer = true;
    } else if (type === 'requisitos') {
      this.todosRequisitos.forEach(r => r._sel = this.requisitosSeleccionados.some(s => s.idRequisitos === r.idRequisitos));
      this.showRequisitosDrawer = true;
    } else if (type === 'paralelos') {
      this.todosParalelos.forEach(p => p._sel = this.paralelosSeleccionados.some(s => s.idParalelo === p.idParalelo));
      this.showParalelosDrawer = true;
    } else if (type === 'especies') {
      this.todosEspecies.forEach(e => {
        const existing = this.especiesSeleccionadas.find(s => s.especie.idEspecie === e.idEspecie);
        e._sel = !!existing;
        e._valor = existing?.valorEspecie ?? 0;
      });
      this.showEspeciesDrawer = true;
    }
  }

  guardarDrawer(type: string): void {
    if (type === 'materias') {
      this.materiasSeleccionadas = this.materiasDisponibles
        .filter(m => m._selected)
        .map(m => ({
          materia: { idMateria: m.idMateria, detalle: m.detalle, horasRequeridas: m.horasRequeridas },
          modulo: m._modulo ?? 1,
          idPlantillaEvaluacion: m._plantilla ?? 0,
          idAreaCompetencia: m._area ?? 0,
          horas: m._horas ?? m.horasRequeridas ?? 0,
          fechaInicio: m._fechaInicio ?? '',
          fechaFin: m._fechaFin ?? ''
        }));
      this.showMateriasDrawer = false;
    } else if (type === 'requisitos') {
      this.requisitosSeleccionados = this.todosRequisitos.filter(r => r._sel).map(r => {
        const { _sel, ...req } = r;
        return req as RequisitoDTO;
      });
      this.showRequisitosDrawer = false;
    } else if (type === 'paralelos') {
      this.paralelosSeleccionados = this.todosParalelos.filter(p => p._sel).map(p => {
        const { _sel, ...par } = p;
        return par as ParaleloDTO;
      });
      this.showParalelosDrawer = false;
    } else if (type === 'especies') {
      this.especiesSeleccionadas = this.todosEspecies
        .filter(e => e._sel)
        .map(e => ({ especie: { idEspecie: e.idEspecie, detalle: e.detalle, esMatricula: e.esMatricula, esPension: e.esPension } as EspecieDTO, valorEspecie: e._valor ?? 0 }));
      this.showEspeciesDrawer = false;
    }
  }

  cancelarDrawer(type: string): void {
    if (type === 'materias') this.showMateriasDrawer = false;
    else if (type === 'requisitos') this.showRequisitosDrawer = false;
    else if (type === 'paralelos') this.showParalelosDrawer = false;
    else if (type === 'especies') this.showEspeciesDrawer = false;
  }

  toggleMateriaRow(m: any): void {
    m._selected = !m._selected;
    if (m._selected) {
      if (m._modulo == null) m._modulo = 1;
      if (m._horas == null) m._horas = m.horasRequeridas ?? 0;
      if (m._fechaInicio == null) m._fechaInicio = '';
      if (m._fechaFin == null) m._fechaFin = '';
    }
  }

  syncMateriaRow(m: any): void { /* valores ya vinculados vía [(ngModel)] */ }

  toggleTodasMaterias(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.materiasDisponibles.forEach(m => {
      m._selected = checked;
      if (checked) {
        if (m._modulo == null) m._modulo = 1;
        if (m._horas == null) m._horas = m.horasRequeridas ?? 0;
        if (m._fechaInicio == null) m._fechaInicio = '';
        if (m._fechaFin == null) m._fechaFin = '';
      }
    });
  }

  toggleRequisito(r: any): void { r._sel = !r._sel; }
  toggleTodosRequisitos(event: Event): void { const c = (event.target as HTMLInputElement).checked; this.todosRequisitos.forEach(r => r._sel = c); }
  toggleParalelo(p: any): void { p._sel = !p._sel; }
  toggleTodosParalelos(event: Event): void { const c = (event.target as HTMLInputElement).checked; this.todosParalelos.forEach(p => p._sel = c); }
  toggleEspecie(e: any): void { e._sel = !e._sel; }
  toggleTodosEspecies(event: Event): void { const c = (event.target as HTMLInputElement).checked; this.todosEspecies.forEach(e => e._sel = c); }
  toggleTodasHistorial(event: Event): void { const c = (event.target as HTMLInputElement).checked; this.materiasHistorial.forEach(h => h._histSel = c); }

  removeMateria(m: MateriaDTO): void { this.materiasSeleccionadas = this.materiasSeleccionadas.filter(s => s.materia.idMateria !== m.idMateria); }
  removeRequisito(r: RequisitoDTO): void { this.requisitosSeleccionados = this.requisitosSeleccionados.filter(x => x.idRequisitos !== r.idRequisitos); }
  removeParalelo(p: ParaleloDTO): void { this.paralelosSeleccionados = this.paralelosSeleccionados.filter(x => x.idParalelo !== p.idParalelo); }
  removeEspecie(e: { especie: EspecieDTO; valorEspecie: number }): void { this.especiesSeleccionadas = this.especiesSeleccionadas.filter(x => x.especie.idEspecie !== e.especie.idEspecie); }

  actualizarDefaultsMaterias(): void {
    this.materiasDisponibles.forEach(m => {
      if (m._selected && this.materiaDefaultPlantilla != null) {
        m._plantilla = this.materiaDefaultPlantilla;
      }
    });
  }

  /* ── Historial de materias ── */
  cargarMateriasHistorial(): void {
    const idCurso = this.form.get('idCurso')?.value;
    const idTipoOferta = this.form.get('idTipoOferta')?.value;
    const idCiclo = this.form.get('idCiclo')?.value;
    if (!idCurso || !idTipoOferta) {
      this.materiasHistorial = [];
      return;
    }
    this.cargandoHistorial = true;
    this.mallaService.getAll().subscribe({
      next: (mallas) => {
        const previas = mallas.filter(m =>
          m.idCursos === +idCurso &&
          m.idTipoOferta === +idTipoOferta &&
          m.idCiclo !== +idCiclo
        );
        if (previas.length === 0) {
          this.materiasHistorial = [];
          this.cargandoHistorial = false;
          return;
        }
        const obs = previas.map(m =>
          this.detalleMallaService.getByMalla(m.idMalla!, 1, 999)
        );
        forkJoin(obs).subscribe({
          next: (results) => {
            const items: any[] = [];
            results.forEach((detalles, i) => {
              const cicloLabel = this.ciclos.find(c => c.idCiclo === previas[i].idCiclo)?.detalle ?? `Ciclo #${previas[i].idCiclo}`;
              detalles.forEach(d => {
                if (!items.some(x => x.idMateria === d.idMateria)) {
                  items.push({ ...d, _histSel: false, _mallaOrigen: cicloLabel });
                }
              });
            });
            this.materiasHistorial = items;
            this.cargandoHistorial = false;
          },
          error: () => {
            this.materiasHistorial = [];
            this.cargandoHistorial = false;
          }
        });
      },
      error: () => {
        this.materiasHistorial = [];
        this.cargandoHistorial = false;
      }
    });
  }

  copiarMateriasHistorial(): void {
    const seleccionadas = this.materiasHistorial.filter(h => h._histSel);
    seleccionadas.forEach(h => {
      const existente = this.materiasDisponibles.find(m => m.idMateria === h.idMateria);
      if (existente) {
        existente._selected = true;
        if (!existente._fechaInicio && h.fechaInicio) existente._fechaInicio = h.fechaInicio;
        if (!existente._fechaFin && h.fechaFin) existente._fechaFin = h.fechaFin;
        if (!existente._horas && h.duracionHoras) existente._horas = h.duracionHoras;
      } else {
        const nueva: MateriaDTO & { _selected: boolean; _modulo: number; _horas: number; _fechaInicio: string; _fechaFin: string; _plantilla?: number; _area?: number } = {
          idMateria: h.idMateria,
          detalle: h.nombreMateria || `Materia #${h.idMateria}`,
          horasRequeridas: h.duracionHoras,
          _selected: true,
          _modulo: h.modulo,
          _horas: h.duracionHoras,
          _fechaInicio: h.fechaInicio || '',
          _fechaFin: h.fechaFin || '',
          _plantilla: h.idPlantillaEvaluacion,
          _area: h.idAreaCompetencia
        };
        this.materiasDisponibles = [nueva, ...this.materiasDisponibles];
      }
    });
    this.materiasHistorial.forEach(h => h._histSel = false);
    this.showHistorial = false;
  }

  togglePlantillaPorMateria(): void {
    this.showPlantillaColumn = !this.showPlantillaColumn;
  }

  /* ── Propagación de fechas por módulo ── */
  propagarFechaInicio(modulo: number, fecha: string): void {
    this.materiasDisponibles.forEach(m => {
      if (m._modulo === modulo) m._fechaInicio = fecha;
    });
  }

  propagarFechaFin(modulo: number, fecha: string): void {
    this.materiasDisponibles.forEach(m => {
      if (m._modulo === modulo) m._fechaFin = fecha;
    });
  }

  /* ── Crear entidades ── */
  guardarNuevaMateria(): void {
    if (!this.nuevaMateriaDetalle.trim()) return;
    const data: MateriaDTO = { detalle: this.nuevaMateriaDetalle.trim(), horasRequeridas: this.nuevaMateriaHoras ?? undefined, esActivo: true };
    this.materiaService.create(data).subscribe({
      next: (nuevo) => {
        const id = typeof nuevo === 'number' ? nuevo : (nuevo as any).idMateria;
        const row = {
          idMateria: id,
          detalle: data.detalle || this.nuevaMateriaDetalle.trim(),
          horasRequeridas: data.horasRequeridas ?? this.nuevaMateriaHoras ?? 0,
          _selected: true,
          _modulo: 1,
          _horas: data.horasRequeridas ?? this.nuevaMateriaHoras ?? 0,
          _fechaInicio: '',
          _fechaFin: '',
          _plantilla: this.materiaDefaultPlantilla ?? undefined
        };
        this.materiasDisponibles = [...this.materiasDisponibles, row];
        this.showMateriaDialog = false;
        this.nuevaMateriaDetalle = '';
        this.nuevaMateriaHoras = null;
        this.messageService.add({ severity: 'success', summary: 'Creada', detail: 'Materia creada' });
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear la materia' })
    });
  }

  guardarNuevoRequisito(): void {
    if (!this.nuevoRequisitoDetalle.trim()) return;
    const data: RequisitoDTO = {
      detalle: this.nuevoRequisitoDetalle.trim(),
      tipoDato: this.nuevoRequisitoTipoDato,
      esObligatorio: this.nuevoRequisitoObligatorio,
      bloqueaInscripcion: this.nuevoRequisitoBloquea
    };
    this.requisitosService.create(data).subscribe({
      next: (nuevo) => {
        const item = { ...nuevo, _sel: true };
        this.todosRequisitos = [...this.todosRequisitos, item];
        this.requisitosSeleccionados = [...this.requisitosSeleccionados, nuevo];
        this.showRequisitoDialog = false;
        this.nuevoRequisitoDetalle = '';
        this.nuevoRequisitoTipoDato = 'ADJUNTO';
        this.nuevoRequisitoObligatorio = false;
        this.nuevoRequisitoBloquea = false;
        this.messageService.add({ severity: 'success', summary: 'Creado', detail: 'Requisito creado' });
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear el requisito' })
    });
  }

  guardarNuevoParalelo(): void {
    if (!this.nuevoParaleloNombre.trim()) return;
    const apiUrl = environment.apiUrl;
    this.http.post<{ isSuccess: boolean; data: ParaleloDTO }>(
      `${apiUrl}/Paralelo/CreateParalelo`,
      { nombreParalelo: this.nuevoParaleloNombre.trim(), cupoMaximo: this.nuevoParaleloCupo ?? 35 }
    ).subscribe({
      next: (res) => {
        if (res.isSuccess && res.data) {
          const item = { ...res.data, _sel: true };
          this.todosParalelos = [...this.todosParalelos, item];
          this.paralelosSeleccionados = [...this.paralelosSeleccionados, res.data];
        }
        this.showParaleloDialog = false;
        this.nuevoParaleloNombre = '';
        this.nuevoParaleloCupo = null;
        this.messageService.add({ severity: 'success', summary: 'Creado', detail: 'Paralelo creado' });
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear el paralelo' })
    });
  }

  guardarNuevaEspecie(): void {
    if (!this.nuevaEspecieDetalle.trim()) return;
    const data: EspecieDTO = {
      detalle: this.nuevaEspecieDetalle.trim(),
      esMatricula: this.nuevaEspecieEsMatricula,
      esPension: this.nuevaEspecieEsPension,
      activo: true
    };
    this.especieService.create(data).subscribe({
      next: (nuevo) => {
        const item = { ...nuevo, _sel: true, _valor: this.nuevaEspecieValor ?? 0 };
        this.todosEspecies = [...this.todosEspecies, item];
        this.especiesSeleccionadas = [...this.especiesSeleccionadas, { especie: nuevo, valorEspecie: this.nuevaEspecieValor ?? 0 }];
        this.showEspecieDialog = false;
        this.nuevaEspecieDetalle = '';
        this.nuevaEspecieValor = null;
        this.nuevaEspecieEsMatricula = false;
        this.nuevaEspecieEsPension = false;
        this.messageService.add({ severity: 'success', summary: 'Creada', detail: 'Especie creada' });
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear la especie' })
    });
  }

  /* ── Crear Malla (todo) ── */
  crearMalla(): void {
    if (this.form.invalid) return;
    this.loading = true;

    const fv = this.form.value;
    const cursoName = this.cursosTodos.find(c => c.idCursos === +fv.idCurso)?.detalle || 'Curso';

    const mallaData: MallaDTO = {
      detalle: cursoName,
      idCursos: +fv.idCurso,
      idTipoOferta: +fv.idTipoOferta,
      idCiclo: +fv.idCiclo
    };

    this.mallaService.create(mallaData).subscribe({
      next: (malla) => {
        const idMalla = malla.idMalla;
        if (idMalla == null) {
          this.loading = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear la malla' });
          return;
        }

        const detalles = this.materiasSeleccionadas.map(m => ({
          idMalla, idMateria: m.materia.idMateria!,
          idPlantillaEvaluacion: m.idPlantillaEvaluacion,
          idAreaCompetencia: m.idAreaCompetencia,
          modulo: m.modulo, fechaInicio: m.fechaInicio, fechaFin: m.fechaFin,
          duracionHoras: m.horas
        } as DetalleMallaCreateDTO));

        const reqObs: any[] = [];

        if (detalles.length > 0) {
          reqObs.push(this.detalleMallaService.createBulk(detalles));
        }

        if (this.requisitosSeleccionados.length > 0) {
          const ids = this.requisitosSeleccionados.map(r => r.idRequisitos!).filter(Boolean);
          if (ids.length > 0) reqObs.push(this.requisitosService.asignarRequisitosAMalla(idMalla, ids));
        }

        if (this.paralelosSeleccionados.length > 0) {
          this.paralelosSeleccionados.forEach(p => {
            if (p.idParalelo != null) {
              reqObs.push(this.mallaParaleloService.create({
                idMalla: idMalla, idParalelo: p.idParalelo, cupoMaximo: p.cupoMaximo ?? 35
              } as MallaParaleloCreateDTO));
            }
          });
        }

        if (this.especiesSeleccionadas.length > 0) {
          this.especiesSeleccionadas.forEach(e => {
            if (e.especie.idEspecie != null) {
              reqObs.push(this.especieCicloService.create({
                idMalla: idMalla, idEspecie: e.especie.idEspecie, valorEspecie: e.valorEspecie
              } as EspecieCicloDTO));
            }
          });
        }

        if (reqObs.length === 0) {
          this.loading = false;
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Malla creada correctamente' });
          setTimeout(() => window.close(), 2000);
          return;
        }

        forkJoin(reqObs).subscribe({
          next: () => {
            this.loading = false;
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Curso y malla creados correctamente' });
            setTimeout(() => window.close(), 2000);
          },
          error: () => {
            this.loading = false;
            this.messageService.add({ severity: 'warn', summary: 'Advertencia', detail: 'Malla creada pero algunos datos no se asignaron' });
            setTimeout(() => window.close(), 2000);
          }
        });
      },
      error: () => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear la malla' });
      }
    });
  }

  volver(): void {
    window.close();
  }

  cancelar(): void {
    window.close();
  }
}
