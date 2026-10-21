import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { BeneficioDTO, EspecieDTO } from '../../../../../data/models/Entities';
import { BeneficioService } from '../../../../../core/services/pagos/beneficio.service';
import { EspecieService } from '../../../../../core/services/infrastructure/especie.service';
import { ConfirmationModalComponent } from '../../../../../shared/modal-confirmation/confirmation-modal.component';
import { SharedToastComponent } from '../../../../../shared/shared-toast/shared-toast.component';

@Component({
  selector: 'app-beneficios',
  standalone: true,
  imports: [CommonModule,
    ReactiveFormsModule,
    TableModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    TagModule,
    CheckboxModule,
    TooltipModule,
    ConfirmationModalComponent, SharedToastComponent],
  templateUrl: './beneficios.component.html',
  styleUrls: ['./beneficios.component.css'],
  providers: [MessageService]
})
export class BeneficiosComponent implements OnInit {
  beneficios: BeneficioDTO[] = [];
  especies: EspecieDTO[] = [];
  beneficioForm: FormGroup;
  displayDialog = false;
  isEditing = false;
  showConfirmDelete = false;
  beneficioToDelete: BeneficioDTO | null = null;
  isSaving = false;

  readonly tipoValorOptions = [
    { label: 'Porcentaje (%)', value: 'PORCENTAJE' },
    { label: 'Valor Fijo ($)', value: 'VALOR_FIJO' }
  ];

  constructor(
    private fb: FormBuilder,
    private beneficioService: BeneficioService,
    private especieService: EspecieService,
    private messageService: MessageService
  ) {
    this.beneficioForm = this.fb.group({
      idBeneficio: [null],
      detalle: ['', [Validators.required, Validators.minLength(3)]],
      tipoValor: ['PORCENTAJE', Validators.required],
      valor: [null, [Validators.required, Validators.min(0.01)]],
      requiereRenovacion: [false],
      aplicaA: [null, Validators.required],
      esBeca: [false, Validators.required],
      descripcion: ['', Validators.required],
      activo: [true]
    });
  }

  
  ngOnInit(): void {
    this.loadBeneficios();
    this.loadEspecies();
  }

  loadBeneficios(): void {
    this.beneficioService.getAll().subscribe({
      next: (data) => { this.beneficios = data; },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar los beneficios' });
      }
    });
  }

  loadEspecies(): void {
    this.especieService.getAll().subscribe({
      next: (data) => { this.especies = data; },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar las especies' });
      }
    });
  }

  openCreateDialog(): void {
    this.isEditing = false;
    this.beneficioForm.reset({ tipoValor: 'PORCENTAJE', requiereRenovacion: false, activo: true, esBeca: false, descripcion: '' });
    this.displayDialog = true;
  }

  openEditDialog(beneficio: BeneficioDTO): void {
    this.isEditing = true;
    this.beneficioForm.patchValue(beneficio);
    this.displayDialog = true;
  }

  saveBeneficio(): void {
    if (this.beneficioForm.invalid) return;
    this.isSaving = true;
    const data: BeneficioDTO = this.beneficioForm.value;

    if (this.isEditing) {
      this.beneficioService.update(data).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Beneficio actualizado correctamente' });
          this.loadBeneficios();
          this.displayDialog = false;
          this.isSaving = false;
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar el beneficio' });
          this.isSaving = false;
        }
      });
    } else {
      this.beneficioService.create(data).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Beneficio creado correctamente' });
          this.loadBeneficios();
          this.displayDialog = false;
          this.isSaving = false;
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al crear el beneficio' });
          this.isSaving = false;
        }
      });
    }
  }

  confirmDelete(beneficio: BeneficioDTO): void {
    this.beneficioToDelete = beneficio;
    this.showConfirmDelete = true;
  }

  deleteBeneficio(): void {
    if (this.beneficioToDelete?.idBeneficio) {
      this.beneficioService.delete(this.beneficioToDelete.idBeneficio).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Beneficio eliminado correctamente' });
          this.loadBeneficios();
          this.showConfirmDelete = false;
          this.beneficioToDelete = null;
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al eliminar el beneficio' });
        }
      });
    }
  }

  cancelDelete(): void {
    this.showConfirmDelete = false;
    this.beneficioToDelete = null;
  }

  hideDialog(): void {
    this.displayDialog = false;
    this.beneficioForm.reset({ tipoValor: 'PORCENTAJE', requiereRenovacion: false, activo: true, esBeca: false, descripcion: '' });
  }

  getEspecieLabel(aplicaA?: number): string {
    if (!aplicaA) return '—';
    return this.especies.find(e => e.idEspecie === aplicaA)?.detalle ?? '—';
  }

  formatValor(beneficio: BeneficioDTO): string {
    if (beneficio.tipoValor === 'PORCENTAJE') return `${beneficio.valor ?? 0}%`;
    return `$${(beneficio.valor ?? 0).toFixed(2)}`;
  }
}
