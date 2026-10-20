import { Component, EventEmitter, Input, Output, OnInit, inject, OnChanges, SimpleChanges } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { DetalleMallaService } from '../../../../../core/services/infrastructure/detalle-malla.service';
import { DocenteDisponibleDTO } from '../../../../../data/models/distributivo/distributivo.model';
import { DetalleMallaDTO } from '../../../../../data/models/detalle-malla/detalle-malla.model';
import { MallaDTO, ParaleloDTO } from '../../../../../data/models/Entities';

@Component({
  selector: 'app-modal-asignacion-masiva',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    DialogModule, SelectModule, ButtonModule, CheckboxModule,
    ProgressSpinnerModule, TagModule
  ],
  templateUrl: './modal-asignacion-masiva.component.html',
  styles: [`
    .info-banner {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      background: linear-gradient(135deg, rgba(var(--brand-yellow-rgb, 252, 206, 0), 0.1), rgba(var(--brand-yellow-rgb, 252, 206, 0), 0.05));
      border-left: 4px solid var(--brand-yellow-dark, #e6b800);
      border-radius: 0 8px 8px 0;
      margin-bottom: 1.5rem;
    }

    .info-banner i {
      font-size: 1.25rem;
      color: var(--brand-yellow-dark, #e6b800);
    }

    .info-banner p {
      margin: 0;
      color: var(--text-color);
      font-size: 0.9rem;
    }

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

    .paralelos-section {
      background: var(--surface-ground);
      border-radius: 12px;
      padding: 1rem;
    }

    .paralelos-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .paralelos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 0.75rem;
      max-height: 180px;
      overflow-y: auto;
      padding: 0.5rem;
    }

    .paralelo-card {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      background: var(--surface-card);
      border: 2px solid var(--surface-border);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .paralelo-card i {
      font-size: 1.1rem;
      color: var(--text-color-secondary);
      transition: all 0.2s ease;
    }

    .paralelo-card:hover {
      border-color: var(--brand-yellow-dark);
      background: var(--surface-hover);
    }

    .paralelo-card.selected {
      border-color: var(--brand-yellow);
      background: rgba(var(--brand-yellow-rgb, 252, 206, 0), 0.1);
    }

    .paralelo-card.selected i {
      color: var(--brand-yellow-dark);
    }

    .paralelo-info {
      display: flex;
      flex-direction: column;
    }

    .paralelo-info span {
      font-weight: 600;
      color: var(--text-color);
    }

    .paralelo-info small {
      color: var(--text-color-secondary);
      font-size: 0.75rem;
    }

    .selection-count {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 1rem;
      padding: 0.75rem;
      background: var(--surface-card);
      border-radius: 8px;
    }

    .selection-count.error {
      background: rgba(220, 53, 69, 0.1);
      border: 1px solid rgba(220, 53, 69, 0.3);
    }

    .selection-count.success {
      background: rgba(25, 135, 84, 0.1);
      border: 1px solid rgba(25, 135, 84, 0.3);
    }

    .loading-materias {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem;
      background-color: var(--surface-ground);
      border-radius: 6px;
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

    :host ::ng-deep .masiva-dialog .p-dialog-header {
      background: linear-gradient(135deg, var(--brand-black) 0%, var(--brand-gray) 100%);
      color: white;
      border-radius: 12px 12px 0 0;
    }

    :host ::ng-deep .masiva-dialog .p-dialog-content {
      padding: 1.5rem;
      max-height: 70vh;
      overflow-y: auto;
      overflow-x: hidden;
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
      
      .paralelos-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ModalAsignacionMasivaComponent implements OnInit, OnChanges {
  @Input() show = false;
  @Input() mallas: MallaDTO[] = [];
  @Input() paralelos: ParaleloDTO[] = [];
  @Input() docentes: DocenteDisponibleDTO[] = [];

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<{idDetalleMalla: number, idPersona: number, idsParalelos: number[]}>();

  private detalleMallaService = inject(DetalleMallaService);
  private fb = inject(FormBuilder);

  form: FormGroup;
  materias: DetalleMallaDTO[] = [];
  loadingMaterias = false;

  // Opciones para dropdowns
  mallasOptions: any[] = [];
  materiasOptions: any[] = [];
  docentesOptions: any[] = [];

  constructor() {
    this.form = this.fb.group({
      idMalla: [null, Validators.required],
      idDetalleMalla: [null, Validators.required],
      idPersona: [null, Validators.required],
      paralelosCheck: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.prepararOpciones();
    this.initParalelosCheck();

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
    if (changes['mallas'] || changes['docentes']) {
      this.prepararOpciones();
    }
    
    if (changes['paralelos']) {
      this.initParalelosCheck();
    }
    
    if (changes['show'] && this.show) {
      this.form.reset();
      this.materias = [];
      this.materiasOptions = [];
      this.initParalelosCheck();
    }
  }

  prepararOpciones(): void {
    this.mallasOptions = this.mallas.map(m => ({ label: m.detalle, value: m.idMalla }));
    this.docentesOptions = this.docentes.map(d => ({ 
      nombre: d.nombreCompleto,
      documento: d.documento, 
      value: d.idPersona 
    }));
  }

  initParalelosCheck(): void {
    const arr = this.form.get('paralelosCheck') as FormArray;
    arr.clear();
    this.paralelos.forEach(() => {
      arr.push(this.fb.control(false));
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

  get paralelosFormArray(): FormArray {
    return this.form.get('paralelosCheck') as FormArray;
  }

  get selectedParalelosCount(): number {
    return this.paralelosFormArray.controls.filter(c => c.value).length;
  }

  toggleParalelo(index: number): void {
    const control = this.paralelosFormArray.at(index);
    control.setValue(!control.value);
  }

  selectAllParalelos(): void {
    this.paralelosFormArray.controls.forEach(c => c.setValue(true));
  }

  deselectAllParalelos(): void {
    this.paralelosFormArray.controls.forEach(c => c.setValue(false));
  }

  onSubmit(): void {
    if (this.form.valid && this.selectedParalelosCount > 0) {
      const { idDetalleMalla, idPersona } = this.form.value;
      const selectedIndexes = this.form.value.paralelosCheck
        .map((checked: boolean, i: number) => checked ? i : -1)
        .filter((v: number) => v !== -1);
      
      const idsParalelos = selectedIndexes.map((i: number) => this.paralelos[i].idParalelo);

      this.save.emit({
        idDetalleMalla: Number(idDetalleMalla),
        idPersona: Number(idPersona),
        idsParalelos
      });
    } else {
      this.form.markAllAsTouched();
    }
  }
}
