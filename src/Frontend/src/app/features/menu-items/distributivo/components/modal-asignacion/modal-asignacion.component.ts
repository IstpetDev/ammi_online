import { Component, EventEmitter, Input, Output, OnInit, inject, SimpleChanges, OnChanges } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DetalleMallaService } from '../../../../../core/services/infrastructure/detalle-malla.service';
import { DistributivoDTO, DocenteDisponibleDTO } from '../../../../../data/models/distributivo/distributivo.model';
import { DetalleMallaDTO } from '../../../../../data/models/detalle-malla/detalle-malla.model';
import { MallaDTO, ParaleloDTO, CicloDTO } from '../../../../../data/models/Entities';

@Component({
  selector: 'app-modal-asignacion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, DialogModule, SelectModule, ButtonModule, ProgressSpinnerModule],
  templateUrl: './modal-asignacion.component.html',
  styles: [`
    .form-grid {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-field.full-width {
      grid-column: 1 / -1;
    }

    .field-label {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-color);
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }

    .field-label i {
      color: var(--brand-yellow-dark);
    }

    .required {
      color: #dc3545;
    }

    .loading-materias {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem;
      background-color: var(--surface-ground);
      border-radius: 6px;
      font-size: 0.85rem;
      color: var(--text-color-secondary);
    }

    .loading-materias i {
      color: var(--brand-yellow-dark);
    }

    .error-text {
      font-size: 0.8rem;
      color: #dc3545;
      margin-top: 0.25rem;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding-top: 1rem;
      border-top: 1px solid var(--surface-border);
      margin-top: 1rem;
    }

    :host ::ng-deep .p-select {
      width: 100%;
    }

    :host ::ng-deep .asignacion-dialog .p-dialog-header {
      background: linear-gradient(135deg, var(--brand-black) 0%, var(--brand-gray) 100%);
      color: white;
      border-radius: 12px 12px 0 0;
    }

    :host ::ng-deep .asignacion-dialog .p-dialog-content {
      padding: 1.5rem;
      overflow: visible;
    }

    :host ::ng-deep .p-select-overlay {
      max-width: 90vw;
      max-height: 250px;
    }

    :host ::ng-deep .p-select-list-container {
      max-width: 100%;
      max-height: 200px;
      overflow-y: auto;
    }

    :host ::ng-deep .p-select-option {
      white-space: normal;
      word-wrap: break-word;
    }

    .docente-item {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .docente-nombre {
      font-weight: 500;
      color: var(--text-color);
    }

    .docente-ci {
      font-size: 0.8rem;
      color: var(--text-color-secondary);
    }

    .docente-selected {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    @media (max-width: 768px) {
      .form-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ModalAsignacionComponent implements OnInit, OnChanges {
  @Input() show = false;
  @Input() distributivo: DistributivoDTO | null = null;
  @Input() mallas: MallaDTO[] = [];
  @Input() cicloss: CicloDTO[] = [];
  @Input() paralelos: ParaleloDTO[] = [];
  @Input() docentes: DocenteDisponibleDTO[] = [];

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<{idDetalleMalla: number, idPersona: number, idParalelo: number}>();

  private detalleMallaService = inject(DetalleMallaService);
  private fb = inject(FormBuilder);

  form: FormGroup;
  materias: DetalleMallaDTO[] = [];
  loadingMaterias = false;

  // Opciones para dropdowns
  mallasOptions: any[] = [];
  materiasOptions: any[] = [];
  paralelosOptions: any[] = [];
  docentesOptions: any[] = [];

  constructor() {
    this.form = this.fb.group({
      idMalla: [null, Validators.required],
      idDetalleMalla: [null, Validators.required],
      idParalelo: [null, Validators.required],
      idPersona: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.prepararOpciones();
    
    // When Malla changes, load materias
    this.form.get('idMalla')?.valueChanges.subscribe(idMalla => {
      if (idMalla) {
        this.cargarMaterias(idMalla);
      } else {
        this.materias = [];
        this.materiasOptions = [];
        this.form.get('idDetalleMalla')?.setValue(null);
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mallas'] || changes['paralelos'] || changes['docentes']) {
      this.prepararOpciones();
    }
    
    if (changes['show'] && this.show) {
      if (this.distributivo) {
        this.cargarDatosEdicion();
      } else {
        this.form.reset();
        this.materias = [];
        this.materiasOptions = [];
      }
    }
  }

  prepararOpciones(): void {
    this.mallasOptions = this.mallas.map(m => ({ label: m.detalle, value: m.idMalla }));
    this.paralelosOptions = this.paralelos.map(p => ({ label: p.nombreParalelo, value: p.idParalelo }));
    this.docentesOptions = this.docentes.map(d => ({ 
      nombre: d.nombreCompleto,
      documento: d.documento, 
      value: d.idPersona 
    }));
  }

  async cargarDatosEdicion(): Promise<void> {
    if (!this.distributivo) return;
    
    const d = this.distributivo;
    
    // Pre-load materias for the selected malla
    await this.cargarMaterias(d.idMalla);

    this.form.patchValue({
      idMalla: d.idMalla,
      idDetalleMalla: d.idDetalleMalla,
      idParalelo: d.idParalelo,
      idPersona: d.idPersona
    });
  }

  async cargarMaterias(idMalla: number): Promise<void> {
    this.loadingMaterias = true;
    this.form.get('idDetalleMalla')?.setValue(null);
    
    try {
      this.materias = await lastValueFrom(this.detalleMallaService.getByMalla(idMalla)) || [];
      
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
      const { idDetalleMalla, idPersona, idParalelo } = this.form.value;
      this.save.emit({
        idDetalleMalla: Number(idDetalleMalla),
        idPersona: Number(idPersona),
        idParalelo: Number(idParalelo)
      });
    } else {
      this.form.markAllAsTouched();
    }
  }

  get isEditing(): boolean {
    return !!this.distributivo;
  }
}
