import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TooltipModule } from 'primeng/tooltip';
import { CheckboxModule } from 'primeng/checkbox';
import { PickListModule } from 'primeng/picklist';
import { MessageService } from 'primeng/api';

import { PeriodoLectivoService } from '../../../../../core/services/settings/periodo-lectivo.service';
import { RegimenService } from '../../../../../core/services/settings/regimen.service';
import { CicloService } from '../../../../../core/services/infrastructure/ciclo.service';
import { CursoService } from '../../../../../core/services/infrastructure/curso.service';
import { TipoOfertaService } from '../../../../../core/services/infrastructure/tipo-oferta.service';
import { MateriaService } from '../../../../../core/services/infrastructure/materia.service';
import { PlantillaEvaluacionService } from '../../../../../core/services/infrastructure/plantilla-evaluacion.service';
import { AreaCompetenciaService } from '../../../../../core/services/infrastructure/area-competencia.service';
import { RequisitosService } from '../../../../../core/services/settings/requisitos.service';
import { ParaleloService } from '../../../../../core/services/infrastructure/paralelo.service';
import { EspecieService } from '../../../../../core/services/infrastructure/especie.service';
import { SharedToastComponent } from '../../../../../shared/shared-toast/shared-toast.component';
import {
  MallaCompletaService,
  CrearMallaCompletaRequest,
  CrearMallaCompletaResult
} from '../../../../../core/services/infrastructure/malla-completa.service';

interface StepDef {
  id: number;
  title: string;
  icon: string;
  active: boolean;
  completed: boolean;
}

interface SelectOption {
  label: string;
  value: number;
}

@Component({
  selector: 'app-crear-malla-completa',
  standalone: true,
  imports: [CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    DatePickerModule,
    TooltipModule,
    CheckboxModule,
    PickListModule, SharedToastComponent],
  templateUrl: './crear-malla-completa.component.html',
  styleUrls: ['./crear-malla-completa.component.css'],
  providers: [MessageService]
})
export class CrearMallaCompletaComponent implements OnInit, OnDestroy {
  currentStep = 1;
  isSubmitting = false;
  submitResult: CrearMallaCompletaResult | null = null;
  today = new Date();

  /** true = seleccionar ciclo existente | false = crear nuevo ciclo */
  usarCicloExistente = true;

  /** Picklist de requisitos */
  sourceRequisitos: SelectOption[] = [];
  targetRequisitos: SelectOption[] = [];

  private destroy$ = new Subject<void>();

  steps: StepDef[] = [
    { id: 1, title: 'Ciclo',     icon: 'pi pi-calendar',     active: true,  completed: false },
    { id: 2, title: 'Malla',     icon: 'pi pi-sitemap',      active: false, completed: false },
    { id: 3, title: 'Materias',  icon: 'pi pi-book',         active: false, completed: false },
    { id: 4, title: 'Extras',    icon: 'pi pi-list',         active: false, completed: false },
    { id: 5, title: 'Confirmar', icon: 'pi pi-check-circle', active: false, completed: false }
  ];

  periodoOptions:    SelectOption[] = [];
  regimenOptions:    SelectOption[] = [];
  cicloOptions:      SelectOption[] = [];
  tipoOfertaOptions: SelectOption[] = [];
  cursoOptions:      SelectOption[] = [];
  materiaOptions:    SelectOption[] = [];
  plantillaOptions:  SelectOption[] = [];
  areaOptions:       SelectOption[] = [];
  paraleloOptions:   SelectOption[] = [];
  especieOptions:    SelectOption[] = [];

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private messageService: MessageService,
    private periodoService: PeriodoLectivoService,
    private regimenService: RegimenService,
    private cicloService: CicloService,
    private tipoOfertaService: TipoOfertaService,
    private cursoService: CursoService,
    private materiaService: MateriaService,
    private plantillaService: PlantillaEvaluacionService,
    private areaCompetenciaService: AreaCompetenciaService,
    private requisitosService: RequisitosService,
    private paraleloService: ParaleloService,
    private mallaCompletaService: MallaCompletaService,
    private especieService: EspecieService
  ) {
    this.form = this.fb.group({
      // Opción A: usar ciclo existente
      cicloExistente: this.fb.group({
        idCiclo: [null]
      }),
      // Opción B: crear ciclo nuevo
      cicloNuevo: this.fb.group({
        idPeriodo:           [null, Validators.required],
        idRegimen:           [null, Validators.required],
        idTipoOferta:        [null, Validators.required],
        idPadre:             [null],
        detalle:             ['', [Validators.required, Validators.minLength(3)]],
        fechaInicioEstimada: [null, Validators.required],
        fechaFinEstimada:    [null, Validators.required]
      }),
      malla: this.fb.group({
        detalle:  ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
        idCursos: [null, Validators.required]
      }),
      materias:        this.fb.array([this.createMateriaGroup()]),
      especies:        this.fb.array([]),
      incluirParalelo: [false],
      paralelo: this.fb.group({
        idParalelo: [null],
        cupoMaximo: [null, [Validators.min(1)]]
      })
    });
  }

  ngOnInit(): void {
    this.especiesArray.push(this.createEspecieGroup());
    this.especiesArray.push(this.createEspecieGroup());
    this.loadAllData();
    // Auto-completar nombre de malla: {Curso} {Ciclo}
    this.form.get('malla.idCursos')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.updateMallaDetalle());

    this.form.get('cicloExistente.idCiclo')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.updateMallaDetalle());

    this.form.get('cicloNuevo.detalle')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.updateMallaDetalle());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAllData(): void {
    this.periodoService.getAll().subscribe({
      next: d => this.periodoOptions = d.map(p => ({ label: p.detalle ?? `ID ${p.idPeriodoLectivo}`, value: p.idPeriodoLectivo! }))
    });
    this.regimenService.getAll().subscribe({
      next: d => this.regimenOptions = d.map(r => ({ label: r.detalle ?? `ID ${r.idRegimen}`, value: r.idRegimen! }))
    });
    this.cicloService.getAll().subscribe({
      next: d => this.cicloOptions = d.map(c => ({ label: c.detalle ?? `ID ${c.idCiclo}`, value: c.idCiclo! }))
    });
    this.tipoOfertaService.getAll().subscribe({
      next: d => this.tipoOfertaOptions = d.map(t => ({ label: t.detalle ?? `ID ${t.idtipoOferta}`, value: t.idtipoOferta! }))
    });
    this.cursoService.getAll().subscribe({
      next: d => this.cursoOptions = d.map(c => ({ label: c.detalle ?? `ID ${c.idCursos}`, value: c.idCursos! }))
    });
    this.materiaService.getAll().subscribe({
      next: res => this.materiaOptions = (res?.items ?? []).map((m: any) => ({ label: m.detalle ?? `ID ${m.idMateria}`, value: m.idMateria }))
    });
    this.plantillaService.getActivas().subscribe({
      next: d => this.plantillaOptions = d.map(p => ({ label: p.nombre, value: p.idPlantillaEvaluacion }))
    });
    this.areaCompetenciaService.getAll().subscribe({
      next: d => this.areaOptions = d.map(a => ({ label: a.detalle ?? `ID ${a.idAreaCompetencia}`, value: a.idAreaCompetencia! }))
    });
    this.requisitosService.getAll().subscribe({
      next: (d: any[]) => {
        this.sourceRequisitos = d.map((r: any) => ({
          label: r.detalle ?? r.nombre ?? `Requisito ${r.idRequisitos ?? r.id}`,
          value: r.idRequisitos ?? r.id
        }));
        this.targetRequisitos = [];
      }
    });
    this.paraleloService.getAllParalelos().subscribe({
      next: d => this.paraleloOptions = d.map((p: any) => ({
        label: p.detalle ?? p.nombre ?? `Paralelo ${p.idParalelo}`,
        value: p.idParalelo!
      }))
    });
    this.especieService.getAll().subscribe({
      next: d => this.especieOptions = d.map(e => ({
        label: e.detalle ?? `Especie ${e.idEspecie}`,
        value: e.idEspecie!
      }))
    });
  }

  get materiasArray(): FormArray { return this.form.get('materias') as FormArray; }
  get especiesArray(): FormArray { return this.form.get('especies') as FormArray; }

  createEspecieGroup(): FormGroup {
    return this.fb.group({
      idEspecie:    [null, Validators.required],
      valorEspecie: [null, [Validators.required, Validators.min(0)]]
    });
  }

  addEspecie(): void    { this.especiesArray.push(this.createEspecieGroup()); }
  removeEspecie(i: number): void { this.especiesArray.removeAt(i); }

  createMateriaGroup(): FormGroup {
    return this.fb.group({
      idMateria:             [null, Validators.required],
      idPlantillaEvaluacion: [null, Validators.required],
      idAreaCompetencia:     [null, Validators.required],
      modulo:                [null],
      fechaInicio:           [null],
      fechaFin:              [null],
      duracionHoras:         [null, Validators.min(0)]
    });
  }

  addMateria(): void    { this.materiasArray.push(this.createMateriaGroup()); }
  removeMateria(i: number): void { if (this.materiasArray.length > 1) this.materiasArray.removeAt(i); }

  toggleCicloMode(existente: boolean): void {
    this.usarCicloExistente = existente;
    this.updateMallaDetalle();
  }

  /** Construye el nombre de la malla como "{Curso} {Ciclo}" y lo aplica al campo detalle */
  private updateMallaDetalle(): void {
    const idCurso = this.form.get('malla.idCursos')?.value;
    const curso = idCurso ? this.cursoOptions.find(c => c.value === idCurso) : null;
    if (!curso) return;

    let cicloNombre = '';
    if (this.usarCicloExistente) {
      const idCiclo = this.form.get('cicloExistente.idCiclo')?.value;
      const label = this.getLabel(this.cicloOptions, idCiclo);
      cicloNombre = label !== '—' ? label : '';
    } else {
      cicloNombre = this.form.get('cicloNuevo.detalle')?.value || '';
    }

    let nombre = cicloNombre ? `${curso.label} ${cicloNombre}` : curso.label;
    if (nombre.length > 100) nombre = nombre.substring(0, 100);
    this.form.get('malla.detalle')?.setValue(nombre, { emitEvent: false });
  }

  /**
   * Replica fechaInicio o fechaFin a todas las materias que tengan el mismo módulo.
   * Se llama desde (onSelect) del datepicker de cada materia.
   */
  onMateriaFechaChange(index: number, field: 'fechaInicio' | 'fechaFin'): void {
    setTimeout(() => {
      const materiaCtrl = this.materiasArray.at(index);
      const modulo = materiaCtrl.get('modulo')?.value;
      if (!modulo) return;
      const newValue = materiaCtrl.get(field)?.value;
      this.materiasArray.controls.forEach((ctrl, i) => {
        if (i !== index && ctrl.get('modulo')?.value === modulo) {
          ctrl.get(field)?.setValue(newValue, { emitEvent: false });
        }
      });
    });
  }

  /**
   * Al cambiar el módulo de una materia, toma las fechas de otra materia
   * con el mismo módulo (si existe) y las aplica a esta.
   * Se usa setTimeout para esperar a que el FormControl de módulo esté actualizado
   * antes de leer su valor (PrimeNG dispara el output antes de actualizar el control).
   */
  onMateriaModuloChange(index: number): void {
    setTimeout(() => {
      const materiaCtrl = this.materiasArray.at(index);
      const modulo = materiaCtrl.get('modulo')?.value;
      if (!modulo) return;
      const reference = this.materiasArray.controls.find((ctrl, i) =>
        i !== index &&
        ctrl.get('modulo')?.value === modulo &&
        (ctrl.get('fechaInicio')?.value || ctrl.get('fechaFin')?.value)
      );
      if (reference) {
        materiaCtrl.get('fechaInicio')?.setValue(reference.get('fechaInicio')?.value);
        materiaCtrl.get('fechaFin')?.setValue(reference.get('fechaFin')?.value);
      }
    });
  }

  /**
   * Devuelve true si la materia en `index` debe tener sus fechas bloqueadas (solo lectura),
   * porque ya existe una materia anterior con el mismo módulo que "posee" las fechas.
   */
  isMateriaFechaLocked(index: number): boolean {
    const modulo = this.materiasArray.at(index).get('modulo')?.value;
    if (!modulo) return false;
    return this.materiasArray.controls.some((ctrl, i) =>
      i < index && ctrl.get('modulo')?.value === modulo
    );
  }

  /**
   * Para las fechas bloqueadas, lee el valor directamente del control dueño
   * (primera materia con ese módulo) en lugar del control bloqueado.
   * Esto evita problemas de detección de cambios con setValue.
   */
  getLockedFecha(index: number, field: 'fechaInicio' | 'fechaFin'): Date | null {
    const modulo = this.materiasArray.at(index).get('modulo')?.value;
    if (!modulo) return null;
    const owner = this.materiasArray.controls.find((ctrl, i) =>
      i < index && ctrl.get('modulo')?.value === modulo
    );
    return owner?.get(field)?.value ?? null;
  }

  /** Picklist: no-op, los arrays se mutan directamente por el componente */
  onPickListChange(): void { }

  getMaxAccessibleStep(): number {
    const ids = this.steps.filter(s => s.completed).map(s => s.id);
    return ids.length > 0 ? Math.max(...ids) + 1 : 1;
  }

  setStep(id: number): void {
    if (id > this.getMaxAccessibleStep()) return;
    this.steps.forEach(s => s.active = s.id === id);
    this.currentStep = id;
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.steps[this.currentStep - 1].active = false;
      this.currentStep--;
      this.steps[this.currentStep - 1].active = true;
    }
  }

  nextStep(): void {
    if (this.validateCurrentStep()) {
      this.steps[this.currentStep - 1].completed = true;
      this.steps[this.currentStep - 1].active = false;
      this.currentStep++;
      this.steps[this.currentStep - 1].active = true;
    }
  }

  validateCurrentStep(): boolean {
    switch (this.currentStep) {
      case 1: {
        if (this.usarCicloExistente) {
          const idCiclo = this.form.get('cicloExistente.idCiclo')?.value;
          if (!idCiclo) {
            this.form.get('cicloExistente.idCiclo')?.markAsTouched();
            this.messageService.add({ severity: 'warn', summary: 'Campos requeridos', detail: 'Seleccione un ciclo existente.' });
            return false;
          }
        } else {
          const g = this.form.get('cicloNuevo') as FormGroup;
          g.markAllAsTouched();
          if (!g.valid) {
            this.messageService.add({ severity: 'warn', summary: 'Campos requeridos', detail: 'Complete todos los campos del nuevo ciclo.' });
            return false;
          }
        }
        return true;
      }
      case 2: {
        const g = this.form.get('malla') as FormGroup;
        g.markAllAsTouched();
        if (!g.valid) {
          this.messageService.add({ severity: 'warn', summary: 'Campos requeridos', detail: 'Complete todos los campos obligatorios de la malla.' });
          return false;
        }
        return true;
      }
      case 3: {
        this.materiasArray.markAllAsTouched();
        if (!this.materiasArray.valid) {
          this.messageService.add({ severity: 'warn', summary: 'Campos requeridos', detail: 'Complete los campos requeridos de cada materia.' });
          return false;
        }
        return true;
      }
      case 4: {
        if (this.especiesArray.length !== 2) {
          this.messageService.add({ severity: 'warn', summary: 'Especies requeridas', detail: 'Debe definir exactamente 2 especies.' });
          return false;
        }
        this.especiesArray.markAllAsTouched();
        if (!this.especiesArray.valid) {
          this.messageService.add({ severity: 'warn', summary: 'Campos requeridos', detail: 'Complete los campos de cada especie (tipo y valor).' });
          return false;
        }
        if (this.form.get('incluirParalelo')?.value) {
          const ctrl = this.form.get('paralelo.idParalelo');
          ctrl?.setValidators(Validators.required);
          ctrl?.updateValueAndValidity();
          if (!ctrl?.valid) {
            ctrl?.markAsTouched();
            this.messageService.add({ severity: 'warn', summary: 'Paralelo requerido', detail: 'Seleccione un paralelo o desactive la opción.' });
            return false;
          }
        }
        return true;
      }
      default: return true;
    }
  }

  private formatDate(d: Date | null | undefined): string | null {
    if (!d) return null;
    const date = new Date(d);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  buildRequest(): CrearMallaCompletaRequest {
    const v = this.form.value;
    const req: CrearMallaCompletaRequest = {
      crearCiclo: !this.usarCicloExistente,
      idCiclo:    this.usarCicloExistente ? (v.cicloExistente.idCiclo ?? 0) : 0,
      // El backend siempre requiere nuevoCiclo; si se usa ciclo existente se mandan valores vacíos
      nuevoCiclo: !this.usarCicloExistente ? {
        idPeriodo:           v.cicloNuevo.idPeriodo,
        idRegimen:           v.cicloNuevo.idRegimen,
        idTipoOferta:        v.cicloNuevo.idTipoOferta,
        idPadre:             v.cicloNuevo.idPadre || null,
        detalle:             v.cicloNuevo.detalle,
        fechaInicioEstimada: this.formatDate(v.cicloNuevo.fechaInicioEstimada) ?? '',
        fechaFinEstimada:    this.formatDate(v.cicloNuevo.fechaFinEstimada) ?? ''
      } : {
        idPeriodo:           0,
        idRegimen:           0,
        idPadre:             null,
        detalle:             '',
        fechaInicioEstimada: '2000-01-01',
        fechaFinEstimada:    '2000-01-01'
      },
      malla: {
        detalle:  v.malla.detalle,
        idCursos: v.malla.idCursos
      },
      idsRequisitos: this.targetRequisitos.map(r => r.value),
      materias: this.materiasArray.controls.map(c => {
        const m = c.value;
        return {
          idMateria:             m.idMateria,
          idPlantillaEvaluacion: m.idPlantillaEvaluacion,
          idAreaCompetencia:     m.idAreaCompetencia,
          modulo:                m.modulo || null,
          fechaInicio:           this.formatDate(m.fechaInicio),
          fechaFin:              this.formatDate(m.fechaFin),
          duracionHoras:         m.duracionHoras || null
        };
      }),
      especies: this.especiesArray.controls.map(c => ({
        idEspecie:    c.get('idEspecie')!.value,
        valorEspecie: c.get('valorEspecie')!.value
      })),
      paralelo: v.incluirParalelo ? {
        idParalelo: v.paralelo.idParalelo,
        cupoMaximo: v.paralelo.cupoMaximo || null
      } : null
    };

    return req;
  }

  onSubmit(): void {
    this.isSubmitting = true;
    this.mallaCompletaService.crear(this.buildRequest()).subscribe({
      next: res => {
        this.isSubmitting = false;
        if (res.isSuccess) {
          this.submitResult = res.data;
          this.steps[4].completed = true;
          this.messageService.add({ severity: 'success', summary: '¡Malla creada!', detail: res.message, life: 6000 });
          setTimeout(() => this.router.navigate(['/dashboard/parametrizacion']), 2000);
        } else {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: res.message });
        }
      },
      error: err => {
        this.isSubmitting = false;
        const msg = err.error?.message ?? 'Error inesperado. Ningún dato fue guardado (rollback automático).';
        this.messageService.add({ severity: 'error', summary: 'Error', detail: msg, life: 8000 });
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard/parametrizacion']);
  }

  getLabel(options: SelectOption[], value: number | null): string {
    if (value === null || value === undefined) return '—';
    return options.find(o => o.value === value)?.label ?? `ID ${value}`;
  }

  getCicloResumenLabel(): string {
    if (this.usarCicloExistente) {
      return this.getLabel(this.cicloOptions, this.form.get('cicloExistente.idCiclo')?.value);
    }
    return this.form.get('cicloNuevo.detalle')?.value || '—';
  }
}
