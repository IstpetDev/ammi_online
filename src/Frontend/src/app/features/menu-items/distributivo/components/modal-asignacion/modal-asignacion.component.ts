import { Component, EventEmitter, Input, Output, OnInit, inject, SimpleChanges, OnChanges } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SharedDrawerComponent } from '../../../../../shared/shared-drawer/shared-drawer.component';
import { CustomSelectComponent } from '../../../../../shared/custom-select/custom-select.component';
import { DetalleMallaService } from '../../../../../core/services/infrastructure/detalle-malla.service';
import { MallaParaleloService } from '../../../../../core/services/infrastructure/malla-paralelo.service';
import { DistributivoDTO, DocenteDisponibleDTO } from '../../../../../data/models/distributivo/distributivo.model';
import { DetalleMallaDTO } from '../../../../../data/models/detalle-malla/detalle-malla.model';
import { MallaDTO, CicloDTO, MallaParaleloDTO } from '../../../../../data/models/Entities';

@Component({
  selector: 'app-modal-asignacion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SharedDrawerComponent, CustomSelectComponent, ButtonModule, ProgressSpinnerModule],
  templateUrl: './modal-asignacion.component.html',
  styles: [`
    .form-grid { display: flex; flex-direction: column; gap: 1.25rem; }
    .section-title {
      font-size: 0.72rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.08em; color: var(--text-color-secondary);
      margin-bottom: 1rem; display: flex; align-items: center; gap: 0.4rem;
    }
    .section-title::after { content: ''; flex: 1; height: 1px; background: var(--surface-border); }
    .form-row { display: flex; flex-direction: column; gap: 1.25rem; }
    .form-field { display: flex; flex-direction: column; gap: 0.4rem; min-width: 0; }
    .field-label {
      font-size: 0.83rem; font-weight: 600; color: var(--text-color);
      display: flex; align-items: center; gap: 0.35rem;
    }
    .field-label i { font-size: 0.85rem; color: var(--brand-yellow-dark, #f59e0b); }
    .required { color: #ef4444; font-size: 0.9rem; }
    .error-text { font-size: 0.77rem; color: #ef4444; display: flex; align-items: center; gap: 0.25rem; }
    .info-text { font-size: 0.77rem; color: var(--text-color-secondary); display: flex; align-items: center; gap: 0.25rem; }
    .hierarchy-hint {
      font-size: 0.75rem; color: var(--text-color-secondary);
      display: flex; align-items: center; gap: 0.3rem; margin-top: 0.15rem;
    }
  `]
})
export class ModalAsignacionComponent implements OnInit, OnChanges {
  @Input() show = false;
  @Input() distributivo: DistributivoDTO | null = null;
  @Input() mallas: MallaDTO[] = [];
  @Input() cicloss: CicloDTO[] = [];
  @Input() docentes: DocenteDisponibleDTO[] = [];
  @Input() idMallaInicial: number | null = null;
  @Input() distributivoExistentes: DistributivoDTO[] = [];

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<{ idDetalleMalla: number, idPersona: number, idMallaParalelo: number }>();

  private detalleMallaService = inject(DetalleMallaService);
  private mallaParaleloService = inject(MallaParaleloService);
  private fb = inject(FormBuilder);

  form: FormGroup;
  materias: DetalleMallaDTO[] = [];
  loadingMaterias = false;
  saving = false;
  mallaParalelos: MallaParaleloDTO[] = [];
  loadingParalelos = false;

  mallasOptions: any[] = [];
  materiasOptions: any[] = [];
  paralelosOptions: any[] = [];
  paralelosFiltrados: any[] = [];
  docentesOptions: any[] = [];

  constructor() {
    this.form = this.fb.group({
      idMalla: [null, Validators.required],
      idDetalleMalla: [null, Validators.required],
      idMallaParalelo: [null, Validators.required],
      idPersona: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.prepararOpciones();

    this.form.get('idMalla')?.valueChanges.subscribe(idMalla => {
      this.mallaParalelos = [];
      this.paralelosOptions = [];
      this.paralelosFiltrados = [];
      this.form.get('idMallaParalelo')?.setValue(null);
      this.form.get('idDetalleMalla')?.setValue(null);
      this.materias = [];
      this.materiasOptions = [];
      if (idMalla) {
        this.cargarMaterias(idMalla);
        this.loadingParalelos = true;
        this.mallaParaleloService.getByMalla(idMalla).subscribe({
          next: (mps) => {
            this.mallaParalelos = (mps || []).filter(mp => mp.esActivo);
            this.paralelosOptions = this.mallaParalelos.map(mp => ({
              label: `Paralelo ${mp.nombreParalelo} — ${mp.alumnosMatriculados ?? 0}/${mp.cupoMaximo ?? 0} alumnos`,
              value: mp.idMallaParalelo
            }));
            this.actualizarParalelosFiltrados(this.form.get('idDetalleMalla')?.value);
            this.loadingParalelos = false;
          },
          error: () => { this.loadingParalelos = false; }
        });
      } else {
        this.materias = [];
        this.materiasOptions = [];
      }
    });

    this.form.get('idDetalleMalla')?.valueChanges.subscribe(idDetalleMalla => {
      this.actualizarParalelosFiltrados(idDetalleMalla);
      this.form.get('idMallaParalelo')?.setValue(null);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mallas'] || changes['docentes'] || changes['distributivoExistentes']) {
      this.prepararOpciones();
    }
    if (changes['show'] && this.show) {
      this.saving = false;
      if (this.distributivo) {
        this.cargarDatosEdicion();
      } else {
        this.form.reset();
        this.materias = [];
        this.materiasOptions = [];
        if (this.idMallaInicial) {
          this.form.get('idMalla')?.setValue(this.idMallaInicial);
        }
      }
    }
  }

  prepararOpciones(): void {
    this.mallasOptions = this.mallas.map(m => ({ label: m.detalle, value: m.idMalla }));
    this.docentesOptions = this.docentes.map(d => ({
      label: `${d.nombreCompleto} — CI: ${d.documento}`,
      value: d.idPersona
    }));
    this.actualizarParalelosFiltrados(this.form.get('idDetalleMalla')?.value);
  }

  actualizarParalelosFiltrados(idDetalleMalla: number | null): void {
    if (!idDetalleMalla) {
      this.paralelosFiltrados = [...this.paralelosOptions];
      return;
    }
    const idMallaParaleloActual = this.distributivo?.idMallaParalelo ?? null;
    const paralelosYaAsignados = this.distributivoExistentes
      .filter(d => d.idDetalleMalla === idDetalleMalla && !!d.idPersona && d.idMallaParalelo !== idMallaParaleloActual)
      .map(d => d.idMallaParalelo);
    this.paralelosFiltrados = this.paralelosOptions.filter(
      p => !paralelosYaAsignados.includes(p.value)
    );
  }

  async cargarDatosEdicion(): Promise<void> {
    if (!this.distributivo) return;
    const d = this.distributivo;
    this.loadingParalelos = true;
    const mps = await lastValueFrom(this.mallaParaleloService.getByMalla(d.idMalla)).catch(() => []);
    this.mallaParalelos = (mps || []).filter(mp => mp.esActivo);
    this.paralelosOptions = this.mallaParalelos.map(mp => ({
      label: `Paralelo ${mp.nombreParalelo} — ${mp.alumnosMatriculados ?? 0}/${mp.cupoMaximo ?? 0} alumnos`,
      value: mp.idMallaParalelo
    }));
    this.loadingParalelos = false;
    await this.cargarMaterias(d.idMalla);
    this.form.patchValue({
      idMalla: d.idMalla,
      idDetalleMalla: d.idDetalleMalla,
      idMallaParalelo: d.idMallaParalelo,
      idPersona: d.idPersona
    }, { emitEvent: false });
    this.actualizarParalelosFiltrados(d.idDetalleMalla);
  }

  async cargarMaterias(idMalla: number): Promise<void> {
    this.loadingMaterias = true;
    this.form.get('idDetalleMalla')?.setValue(null);
    this.paralelosFiltrados = [...this.paralelosOptions];
    try {
      const todasLasMaterias = await lastValueFrom(this.detalleMallaService.getByMalla(idMalla, 1, 200)) || [];
      const idParaleloActual = this.distributivo?.idParalelo ?? null;
      const idDetalleMallaActual = this.distributivo?.idDetalleMalla ?? null;
      this.materias = todasLasMaterias.filter(m => {
        if (m.idDetalleMalla === idDetalleMallaActual) return true;
        const paralelosUsados = this.distributivoExistentes
          .filter(d => d.idDetalleMalla === m.idDetalleMalla && !!d.idPersona)
          .map(d => d.idMallaParalelo);
        if (this.mallaParalelos.length === 0) return true;
        const paralelosLibres = this.mallaParalelos.filter(
          mp => mp.idMallaParalelo != null && !paralelosUsados.includes(mp.idMallaParalelo)
        );
        return paralelosLibres.length > 0;
      });
      this.materiasOptions = this.materias.map(m => ({
        label: `${m.nombreMateria} (${m.horasMateria}H)`,
        value: m.idDetalleMalla
      }));
    } catch (error) {
      console.error('Error loading materias:', error);
      this.materias = [];
      this.materiasOptions = [];
    } finally {
      this.loadingMaterias = false;
    }
  }

  onClose(): void {
    this.close.emit();
  }

  onSubmit(): void {
    if (this.form.valid) {
      if (this.saving) return;
      this.saving = true;
      const { idDetalleMalla, idPersona, idMallaParalelo } = this.form.value;
      this.save.emit({
        idDetalleMalla: Number(idDetalleMalla),
        idPersona: Number(idPersona),
        idMallaParalelo: Number(idMallaParalelo)
      });
    } else {
      this.form.markAllAsTouched();
    }
  }

  get isEditing(): boolean {
    return !!this.distributivo;
  }

  get drawerTitle(): string {
    return this.isEditing ? 'Editar Asignación' : 'Nueva Asignación';
  }

  onMallaChange(idMalla: number | null): void {
    this.form.get('idMalla')?.setValue(idMalla);
  }

  onMateriaChange(idDetalleMalla: number | null): void {
    this.form.get('idDetalleMalla')?.setValue(idDetalleMalla);
  }

  onParaleloChange(idMallaParalelo: number | null): void {
    this.form.get('idMallaParalelo')?.setValue(idMallaParalelo);
  }

  onDocenteChange(idPersona: number | null): void {
    this.form.get('idPersona')?.setValue(idPersona);
  }
}
