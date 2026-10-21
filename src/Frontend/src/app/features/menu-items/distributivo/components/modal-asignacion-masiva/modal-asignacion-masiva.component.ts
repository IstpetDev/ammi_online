import { Component, EventEmitter, Input, Output, OnInit, inject, OnChanges, SimpleChanges } from '@angular/core';
import { lastValueFrom, forkJoin } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SharedDrawerComponent } from '../../../../../shared/shared-drawer/shared-drawer.component';
import { CustomSelectComponent } from '../../../../../shared/custom-select/custom-select.component';
import { GestorMallaComponent } from '../../../../../shared/gestor-malla/gestor-malla.component';
import { Router } from '@angular/router';
import { DetalleMallaService } from '../../../../../core/services/infrastructure/detalle-malla.service';
import { MallaParaleloService } from '../../../../../core/services/infrastructure/malla-paralelo.service';
import { TipoOfertaService } from '../../../../../core/services/infrastructure/tipo-oferta.service';
import { CicloService } from '../../../../../core/services/infrastructure/ciclo.service';
import { MallaService } from '../../../../../core/services/infrastructure/malla.service';
import { RequisitosService } from '../../../../../core/services/settings/requisitos.service';
import { EspecieCicloService } from '../../../../../core/services/infrastructure/especie-ciclo.service';
import { CursoService } from '../../../../../core/services/infrastructure/curso.service';
import { AreaCompetenciaService } from '../../../../../core/services/infrastructure/area-competencia.service';
import { DocenteDisponibleDTO, DistributivoDTO } from '../../../../../data/models/distributivo/distributivo.model';
import { MallaDTO, TipoOfertaDTO, CicloDTO, MallaParaleloDTO, MallaParaleloCreateDTO, EspecieCicloDTO, RequisitoDTO } from '../../../../../data/models/Entities';
import { DetalleMallaCreateDTO } from '../../../../../data/models/detalle-malla/detalle-malla.model';

@Component({
  selector: 'app-modal-asignacion-masiva',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ButtonModule, SharedDrawerComponent, CustomSelectComponent, GestorMallaComponent],
  templateUrl: './modal-asignacion-masiva.component.html',
  styles: [`
    .form-grid { display: flex; flex-direction: column; gap: 1.25rem; }
    .info-banner {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 1rem;
      background: linear-gradient(135deg, rgba(233,185,2,0.1), rgba(233,185,2,0.05));
      border-left: 4px solid var(--brand-yellow-dark);
      border-radius: 0 8px 8px 0;
    }
    .info-banner i { font-size: 1.25rem; color: var(--brand-yellow-dark); }
    .info-banner p { margin: 0; color: var(--text-color); font-size: 0.85rem; }
    .curso-section {
      display: flex; flex-direction: column; gap: 0.5rem;
      padding: 1rem; background: var(--surface-ground);
      border-radius: 8px; border: 1px solid var(--surface-border);
    }
    .curso-malla-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      width: 100%;
    }
    .select-container {
      flex: 1;
    }
    .btn-generar-curso {
      width: 46px; height: 46px; min-width: 46px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      background: var(--surface-card); border: 2px solid var(--surface-border);
      border-radius: 12px; cursor: pointer; color: var(--brand-yellow-dark);
      transition: all 0.2s ease; padding: 0;
    }
    .btn-generar-curso:hover:not(:disabled) { border-color: var(--brand-yellow-dark); background: rgba(233,185,2,0.08); }
    .btn-generar-curso:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-generar-curso svg { width: 20px; height: 20px; }
    .field-label {
      font-size: 0.85rem; font-weight: 600; color: var(--text-color);
      display: flex; align-items: center; gap: 0.35rem;
    }
    .field-label i { font-size: 0.85rem; color: var(--brand-yellow-dark); }
    .required { color: #dc3545; }
    .hierarchy-hint {
      font-size: 0.75rem; color: var(--text-color-secondary);
      display: flex; align-items: center; gap: 0.3rem; margin-top: 0.15rem;
    }
    .info-details {
      display: flex; gap: 1.5rem; padding: 0.75rem;
      background: var(--surface-card); border-radius: 6px; margin-top: 0.5rem;
    }
    .info-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: var(--text-color-secondary); }
    .info-item i { color: var(--brand-yellow-dark); }
    .info-item strong { color: var(--text-color); font-weight: 600; }
    .loading-materias {
      display: flex; align-items: center; justify-content: center; gap: 0.75rem;
      padding: 2rem; background: var(--surface-ground); border-radius: 8px;
      color: var(--text-color-secondary); font-size: 0.9rem;
    }
    .quick-assign-section {
      padding: 1rem; background: color-mix(in srgb, #e0e7ff 30%, var(--surface-card));
      border: 1px solid #a5b4fc; border-radius: 8px;
    }
    .quick-assign-section h4 { margin: 0 0 0.75rem 0; font-size: 0.9rem; font-weight: 700; color: var(--text-color); display: flex; align-items: center; gap: 0.4rem; }
    .quick-assign-row { display: grid; grid-template-columns: 1fr 1fr auto; gap: 0.75rem; align-items: end; }
    .quick-assign-hint { font-size: 0.78rem; color: var(--text-color-secondary); margin-top: 0.5rem; display: flex; align-items: center; gap: 0.3rem; }
    .materias-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
    .materias-header h3 { margin: 0; font-size: 1rem; font-weight: 600; color: var(--text-color); }
    .materias-lista { display: flex; flex-direction: column; gap: 0.75rem; }
    .materia-card {
      display: flex; flex-direction: column; gap: 0.75rem;
      padding: 1rem; background: var(--surface-card);
      border: 1px solid var(--surface-border); border-radius: 8px;
    }
    .materia-card-header { display: flex; justify-content: space-between; align-items: center; }
    .materia-nombre { font-size: 0.88rem; font-weight: 600; color: var(--text-color); }
    .materia-horas { font-size: 0.78rem; color: var(--text-color-secondary); display: flex; align-items: center; gap: 0.25rem; }
    .materia-card-body { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    .materia-empty {
      text-align: center;
      padding: 2.5rem 1.5rem;
      border-radius: 12px;
      background: var(--surface-card);
      border: 1px dashed var(--surface-border);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      margin-top: 0.5rem;
    }
    .materia-completed {
      text-align: center;
      padding: 2.5rem 1.5rem;
      border-radius: 12px;
      background: linear-gradient(180deg, rgba(34, 197, 94, 0.08) 0%, rgba(34, 197, 94, 0.02) 100%);
      border: 1px solid rgba(34, 197, 94, 0.3);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      margin-top: 0.5rem;
    }
    .status-icon-circle {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.85rem;
      margin-bottom: 0.25rem;
    }
    .status-icon-circle.success {
      background: rgba(34, 197, 94, 0.15);
      color: #16a34a;
      box-shadow: 0 0 0 8px rgba(34, 197, 94, 0.08);
    }
    .status-icon-circle.empty {
      background: var(--surface-ground);
      color: var(--text-color-secondary);
    }
    .status-icon-circle.warning {
      background: rgba(245, 158, 11, 0.15);
      color: #d97706;
    }
    .status-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--text-color);
      margin: 0;
    }
    .status-desc {
      font-size: 0.88rem;
      color: var(--text-color-secondary);
      max-width: 440px;
      line-height: 1.45;
      margin: 0;
    }
    .status-stats {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
      justify-content: center;
      margin: 0.5rem 0;
    }
    .stat-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.4rem 0.85rem;
      border-radius: 20px;
      font-size: 0.82rem;
      font-weight: 600;
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      color: var(--text-color);
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .status-actions {
      display: flex;
      gap: 0.75rem;
      margin-top: 0.5rem;
      flex-wrap: wrap;
      justify-content: center;
    }
    @media (max-width: 768px) {
      .quick-assign-row { grid-template-columns: 1fr; }
      .materia-card-body { grid-template-columns: 1fr; }
    }
  `]
})
export class ModalAsignacionMasivaComponent implements OnInit, OnChanges {
  @Input() show = false;
  @Input() mallas: MallaDTO[] = [];
  @Input() docentes: DocenteDisponibleDTO[] = [];
  @Input() cicloPreseleccionado: CicloDTO | null = null;
  @Input() distributivoExistentes: DistributivoDTO[] = [];

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any[]>();
  @Output() mallaCreada = new EventEmitter<void>();

  private tipoOfertaService = inject(TipoOfertaService);
  private cicloService = inject(CicloService);
  private detalleMallaService = inject(DetalleMallaService);
  private mallaParaleloService = inject(MallaParaleloService);
  private mallaService = inject(MallaService);
  private requisitosService = inject(RequisitosService);
  private especieCicloService = inject(EspecieCicloService);
  private cursoService = inject(CursoService);
  private areaCompetenciaService = inject(AreaCompetenciaService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  areasCompetencia: any[] = [];

  form: FormGroup;
  detallesMallaDestino: any[] = [];
  distributivosMapped: any[] = [];
  loadingDetalles = false;
  saving = false;
  mallaParalelos: MallaParaleloDTO[] = [];
  ciclosOptions: any[] = [];
  mallasOptions: any[] = [];
  docentesOptions: any[] = [];
  paralelosDisponiblesPorDetalle: { [idDetalleMalla: number]: any[] } = {};
  quickParalelo: number | null = null;
  quickDocente: number | null = null;
  mallasFiltradas: MallaDTO[] = [];
  tiposOferta: TipoOfertaDTO[] = [];
  ciclos: CicloDTO[] = [];
  tipoOfertaMalla: string = '';
  cicloMalla: string = '';

  showGestorMallaDrawer = false;
  gestorMallaMode: 'create' | 'edit' = 'create';

  constructor() {
    this.form = this.fb.group({
      idCiclo: [null, Validators.required],
      idMalla: [null, Validators.required]
    });
  }

  async ngOnInit(): Promise<void> {
    await this.cargarDatosIniciales();
    this.prepararOpciones();
    this.form.get('idCiclo')?.valueChanges.subscribe((idCiclo) => {
      this.form.get('idMalla')?.setValue(null);
      this.tipoOfertaMalla = '';
      this.cicloMalla = '';
      this.detallesMallaDestino = [];
      this.distributivosMapped = [];
      if (idCiclo) {
        this.mallasFiltradas = this.mallas.filter(m => m.idCiclo === idCiclo);
      } else {
        this.mallasFiltradas = [];
      }
      this.prepararOpcionesMallas();
    });
    this.form.get('idMalla')?.valueChanges.subscribe(async (idMalla) => {
      if (idMalla) {
        this.actualizarInfoMalla(idMalla);
        await this.cargarDetallesMalla(idMalla);
      } else {
        this.tipoOfertaMalla = '';
        this.cicloMalla = '';
        this.detallesMallaDestino = [];
        this.distributivosMapped = [];
      }
    });
  }

  actualizarInfoMalla(idMalla: number): void {
    const malla = this.mallas.find(m => m.idMalla === idMalla);
    if (malla) {
      const ciclo = this.ciclos.find(c => c.idCiclo === malla.idCiclo);
      this.tipoOfertaMalla = malla.nombreTipoOferta || 'N/A';
      this.cicloMalla = ciclo?.detalle || 'N/A';
    }
  }

  async cargarDetallesMalla(idMalla: number): Promise<void> {
    this.loadingDetalles = true;
    try {
      const [detalles, mps] = await Promise.all([
        lastValueFrom(this.detalleMallaService.getByMalla(idMalla, 1, 200)),
        lastValueFrom(this.mallaParaleloService.getByMalla(idMalla))
      ]);
      this.detallesMallaDestino = detalles || [];
      const rawMps = (mps || []).filter(mp => mp.esActivo);
      const seenMps = new Set<number>();
      this.mallaParalelos = rawMps.filter(mp => {
        if (!mp.idMallaParalelo || seenMps.has(mp.idMallaParalelo)) return false;
        seenMps.add(mp.idMallaParalelo);
        return true;
      });
      const materiasDisponibles = this.detallesMallaDestino.filter(d => {
        const paralelosUsados = this.distributivoExistentes
          .filter(e => e.idDetalleMalla === d.idDetalleMalla && !!e.idPersona)
          .map(e => e.idMallaParalelo);
        return this.mallaParalelos.some(mp => mp.idMallaParalelo != null && !paralelosUsados.includes(mp.idMallaParalelo!));
      });
      this.distributivosMapped = materiasDisponibles.map(d => ({
        idDetalleMalla: d.idDetalleMalla,
        nombreMateria: d.nombreMateria,
        horasMateria: d.horasMateria,
        idMallaParalelo: null,
        idPersona: null
      }));
      this.calcularParalelosDisponibles();
    } catch (error) {
      console.error('Error loading detalles malla:', error);
      this.detallesMallaDestino = [];
      this.distributivosMapped = [];
      this.mallaParalelos = [];
      this.paralelosDisponiblesPorDetalle = {};
    } finally {
      this.loadingDetalles = false;
    }
  }

  calcularParalelosDisponibles(): void {
    this.distributivosMapped.forEach(d => {
      const yaAsignadosEnBD = this.distributivoExistentes
        .filter(e => e.idDetalleMalla === d.idDetalleMalla && !!e.idPersona)
        .map(e => e.idMallaParalelo);
      this.paralelosDisponiblesPorDetalle[d.idDetalleMalla] = this.mallaParalelos
        .filter(mp => mp.idMallaParalelo != null && !yaAsignadosEnBD.includes(mp.idMallaParalelo!))
        .map(mp => ({
          label: `Paralelo ${mp.nombreParalelo} — ${mp.alumnosMatriculados ?? 0}/${mp.cupoMaximo ?? 0} alumnos`,
          value: mp.idMallaParalelo
        }));
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mallas'] || changes['docentes'] || changes['distributivoExistentes']) {
      this.prepararOpciones();
      this.calcularParalelosDisponibles();
    }
    if (changes['show'] && this.show) {
      this.saving = false;
      const cicloId = this.cicloPreseleccionado?.idCiclo ?? null;
      this.form.reset({ idCiclo: cicloId, idMalla: null });
      this.tipoOfertaMalla = '';
      this.cicloMalla = '';
      this.detallesMallaDestino = [];
      this.distributivosMapped = [];
      this.quickParalelo = null;
      this.quickDocente = null;
      if (cicloId) {
        this.mallasFiltradas = this.mallas.filter(m => m.idCiclo === cicloId);
      } else {
        this.mallasFiltradas = [];
      }
      this.prepararOpcionesMallas();
    }
  }

  async cargarDatosIniciales(): Promise<void> {
    try {
      [this.tiposOferta, this.ciclos, this.areasCompetencia] = await Promise.all([
        lastValueFrom(this.tipoOfertaService.getAll()),
        lastValueFrom(this.cicloService.getAll()),
        lastValueFrom(this.areaCompetenciaService.getAll())
      ]);
      this.ciclosOptions = this.ciclos.filter(c => c.esActivo).map(c => ({ label: c.detalle, value: c.idCiclo }));
    } catch (error) {
      console.error('Error cargando datos iniciales:', error);
      this.tiposOferta = [];
      this.ciclos = [];
      this.areasCompetencia = [];
    }
  }

  autoAsignarArea(nombre: string): number {
    const normalizado = nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (normalizado.includes('matematica') || normalizado.includes('calculo') || normalizado.includes('algebra')) return 2;
    if (normalizado.includes('lengua') || normalizado.includes('literatura') || normalizado.includes('lectura') || normalizado.includes('redaccion')) return 1;
    if (normalizado.includes('ciencias sociales') || normalizado.includes('sociales') || normalizado.includes('historia') || normalizado.includes('geografia') || normalizado.includes('filosofia')) return 3;
    if (normalizado.includes('ciencias naturales') || normalizado.includes('naturales') || normalizado.includes('biologia') || normalizado.includes('quimica') || normalizado.includes('fisica')) return 4;
    if (normalizado.includes('ingles') || normalizado.includes('extranjera') || normalizado.includes('frances')) return 5;
    if (normalizado.includes('educacion fisica') || normalizado.includes('deporte') || normalizado.includes('gimnasia')) return 6;
    if (normalizado.includes('artistica') || normalizado.includes('cultural') || normalizado.includes('musica') || normalizado.includes('dibujo')) return 7;
    if (normalizado.includes('proyecto') || normalizado.includes('emprendimiento') || normalizado.includes('interdisciplinar')) return 8;
    return 9; // CIVICA Y ACOMPAÑAMIENTO INTEGRAL EN EL AULA (Default)
  }

  prepararOpciones(): void {
    this.ciclosOptions = this.ciclos.filter(c => c.esActivo).map(c => ({ label: c.detalle, value: c.idCiclo }));
    this.prepararOpcionesMallas();
    this.docentesOptions = this.docentes.map(d => ({
      label: `${d.nombreCompleto} — CI: ${d.documento}`,
      value: d.idPersona
    }));
  }

  prepararOpcionesMallas(): void {
    const source = this.mallasFiltradas.length > 0
      ? this.mallasFiltradas.slice().sort((a, b) => (a.ordenCurso ?? 0) - (b.ordenCurso ?? 0))
      : [];
    this.mallasOptions = source.map(m => ({
      label: `${m.detalle} - ${m.nombreTipoOferta || 'N/A'}`,
      value: m.idMalla
    }));
  }

  onClose(): void {
    this.close.emit();
  }

  onMateriaParaleloChange(index: number, idMallaParalelo: number): void {
    this.distributivosMapped[index].idMallaParalelo = idMallaParalelo;
    this.calcularParalelosDisponibles();
  }

  onMateriaDocenteChange(index: number, idPersona: number): void {
    this.distributivosMapped[index].idPersona = idPersona;
  }

  get validForSubmit(): boolean {
    const asignacionesCompletas = this.distributivosMapped.filter(d => d.idMallaParalelo && d.idPersona).length;
    return this.form.valid && asignacionesCompletas > 0;
  }

  get paralelosRapidosOptions(): any[] {
    return this.mallaParalelos.map(mp => ({
      label: `Paralelo ${mp.nombreParalelo} — ${mp.alumnosMatriculados ?? 0}/${mp.cupoMaximo ?? 0} alumnos`,
      value: mp.idMallaParalelo
    }));
  }

  applyQuickAssign(): void {
    if (!this.quickParalelo || !this.quickDocente) return;
    this.distributivosMapped.forEach(d => {
      const disponibles = this.paralelosDisponiblesPorDetalle[d.idDetalleMalla] || [];
      const paraleloDisponible = disponibles.some((p: any) => p.value === this.quickParalelo);
      if (paraleloDisponible) {
        d.idMallaParalelo = this.quickParalelo;
        d.idPersona = this.quickDocente;
      }
    });
    this.calcularParalelosDisponibles();
  }

  onQuickParaleloChange(value: number | null): void {
    this.quickParalelo = value;
  }

  onQuickDocenteChange(value: number | null): void {
    this.quickDocente = value;
  }

  onCicloChange(idCiclo: number | null): void {
    this.form.get('idCiclo')?.setValue(idCiclo);
  }

  onMallaChange(idMalla: number | null): void {
    this.form.get('idMalla')?.setValue(idMalla);
  }

  getMateriasCount(): number {
    return this.distributivosMapped.length;
  }

  get totalMateriasConfiguradas(): number {
    return this.detallesMallaDestino.length;
  }

  get totalParalelosConfigurados(): number {
    return this.mallaParalelos.length;
  }

  get todasMateriasAsignadas(): boolean {
    return !this.loadingDetalles &&
      !!this.form.get('idMalla')?.value &&
      this.detallesMallaDestino.length > 0 &&
      this.mallaParalelos.length > 0 &&
      this.distributivosMapped.length === 0;
  }

  get sinMaterias(): boolean {
    return !this.loadingDetalles &&
      !!this.form.get('idMalla')?.value &&
      this.detallesMallaDestino.length === 0;
  }

  get sinParalelos(): boolean {
    return !this.loadingDetalles &&
      !!this.form.get('idMalla')?.value &&
      this.detallesMallaDestino.length > 0 &&
      this.mallaParalelos.length === 0;
  }

  onSubmit(): void {
    if (!this.validForSubmit) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.saving) return;
    this.saving = true;
    const nuevosDistributivos = this.distributivosMapped
      .filter(d => d.idMallaParalelo && d.idPersona)
      .map(d => ({
        idDetalleMalla: d.idDetalleMalla,
        idPersona: d.idPersona,
        idMallaParalelo: d.idMallaParalelo
      }));
    this.save.emit(nuevosDistributivos);
  }

  irADetalleMalla(): void {
    this.gestorMallaMode = 'edit';
    this.showGestorMallaDrawer = true;
  }

  irAGenerarCursos(): void {
    this.router.navigate(['/dashboard/configurar-cursos-postulacion']);
  }

  onGestorMallaClose(): void {
    this.showGestorMallaDrawer = false;
  }

  async onGestorMallaSave(data: any): Promise<void> {
    this.showGestorMallaDrawer = false;
    if (data.mode === 'create') {
      this.saving = true;

      // 1. Get the course name to name the malla
      let cursoName = 'Curso';
      try {
        const cursos = await lastValueFrom(this.cursoService.getAll());
        const curso = cursos.find(c => c.idCursos === +data.idCurso);
        if (curso) {
          cursoName = curso.detalle || 'Curso';
        }
      } catch (e) {
        console.error(e);
      }

      // 2. Create the malla entity
      const mallaData: MallaDTO = {
        idMalla: 0,
        detalle: cursoName,
        idCursos: +data.idCurso,
        idTipoOferta: +data.idTipoOferta,
        idCiclo: +data.cicloId
      };

      this.mallaService.create(mallaData).subscribe({
        next: async (malla) => {
          const idMalla = malla.idMalla;
          if (!idMalla) {
            this.saving = false;
            return;
          }

          const reqObs: any[] = [];

          // 3. Create details
          const detalles = (data.materias || []).map((m: any) => ({
            idMalla,
            idMateria: m.idMateria,
            idPlantillaEvaluacion: 1, // Default plantilla
            idAreaCompetencia: this.autoAsignarArea(m.detalle),
            modulo: m.modulo,
            fechaInicio: m.fechaInicio,
            fechaFin: m.fechaFin,
            duracionHoras: m.horas
          } as DetalleMallaCreateDTO));

          if (detalles.length > 0) {
            reqObs.push(this.detalleMallaService.createBulk(detalles));
          }

          // 4. Assign requirements
          if (data.requisitos && data.requisitos.length > 0) {
            const ids = data.requisitos.map((r: any) => r.idRequisitos).filter(Boolean);
            if (ids.length > 0) {
              reqObs.push(this.requisitosService.asignarRequisitosAMalla(idMalla, ids));
            }
          }

          // 5. Assign paralelos
          (data.paralelos || []).forEach((p: any) => {
            if (p.idParalelo != null) {
              reqObs.push(this.mallaParaleloService.create({
                idMalla,
                idParalelo: p.idParalelo,
                cupoMaximo: p.cupoMaximo ?? 30
              } as MallaParaleloCreateDTO));
            }
          });

          // 6. Assign species
          (data.especies || []).forEach((e: any) => {
            if (e.especie?.idEspecie != null) {
              reqObs.push(this.especieCicloService.create({
                idMalla,
                idEspecie: e.especie.idEspecie,
                valorEspecie: e.valorEspecie
              } as EspecieCicloDTO));
            }
          });

          if (reqObs.length === 0) {
            this.saving = false;
            this.mallas.push(malla);
            this.mallasFiltradas = this.mallas.filter(m => m.idCiclo === this.form.get('idCiclo')?.value);
            this.prepararOpcionesMallas();
            this.form.get('idMalla')?.setValue(idMalla);
            this.mallaCreada.emit();
            return;
          }

          forkJoin(reqObs).subscribe({
            next: () => {
              this.saving = false;
              this.mallas.push(malla);
              this.mallasFiltradas = this.mallas.filter(m => m.idCiclo === this.form.get('idCiclo')?.value);
              this.prepararOpcionesMallas();
              this.form.get('idMalla')?.setValue(idMalla);
              this.mallaCreada.emit();
            },
            error: (err) => {
              console.error('Error al guardar los detalles de la malla:', err);
              this.saving = false;
              this.mallas.push(malla);
              this.mallasFiltradas = this.mallas.filter(m => m.idCiclo === this.form.get('idCiclo')?.value);
              this.prepararOpcionesMallas();
              this.form.get('idMalla')?.setValue(idMalla);
              this.mallaCreada.emit();
            }
          });
        },
        error: (err) => {
          console.error('Error al crear la malla:', err);
          this.saving = false;
        }
      });
    } else {
      await this.cargarDetallesMalla(this.form.get('idMalla')?.value);
    }
  }
}
