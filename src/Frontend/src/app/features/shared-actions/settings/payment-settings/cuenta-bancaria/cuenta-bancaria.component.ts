import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { CuentaBancariaDTO, TipoCuentaDTO } from '../../../../../data/models/Entities';
import { CuentaBancariaService } from '../../../../../core/services/pagos/cuenta-bancaria.service';
import { TipoCuentaService } from '../../../../../core/services/pagos/tipo-cuenta.service';
import { ConfirmationModalComponent } from '../../../../../shared/modal-confirmation/confirmation-modal.component';
import { SharedToastComponent } from '../../../../../shared/shared-toast/shared-toast.component';

@Component({
  selector: 'app-cuenta-bancaria',
  standalone: true,
  imports: [CommonModule,
    ReactiveFormsModule,
    TableModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    CheckboxModule,
    TooltipModule,
    ConfirmationModalComponent, SharedToastComponent],
  templateUrl: './cuenta-bancaria.component.html',
  styleUrls: ['./cuenta-bancaria.component.css'],
  providers: [MessageService]
})
export class CuentaBancariaComponent implements OnInit {
  cuentas: CuentaBancariaDTO[] = [];
  tiposCuenta: TipoCuentaDTO[] = [];
  cuentaForm: FormGroup;
  displayDialog = false;
  isEditing = false;
  showConfirmDelete = false;
  cuentaToDelete: CuentaBancariaDTO | null = null;
  isSaving = false;

  constructor(
    private fb: FormBuilder,
    private cuentaBancariaService: CuentaBancariaService,
    private tipoCuentaService: TipoCuentaService,
    private messageService: MessageService
  ) {
    this.cuentaForm = this.fb.group({
      idCuentaBancaria: [null],
      idTipoCuenta: [null, Validators.required],
      numeroCuenta: ['', [Validators.required, Validators.minLength(4)]],
      banco: ['', [Validators.required, Validators.minLength(2)]],
      activo: [true]
    });
  }

  ngOnInit(): void {
    this.loadCuentas();
    this.loadTiposCuenta();
  }

  loadCuentas(): void {
    this.cuentaBancariaService.getAll().subscribe({
      next: (data) => { this.cuentas = data; },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar las cuentas bancarias' });
      }
    });
  }

  loadTiposCuenta(): void {
    this.tipoCuentaService.getAll().subscribe({
      next: (data) => { this.tiposCuenta = data; },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar los tipos de cuenta' });
      }
    });
  }

  openCreateDialog(): void {
    this.isEditing = false;
    this.cuentaForm.reset({ activo: true });
    this.displayDialog = true;
  }

  openEditDialog(cuenta: CuentaBancariaDTO): void {
    this.isEditing = true;
    this.cuentaForm.patchValue(cuenta);
    this.displayDialog = true;
  }

  saveCuenta(): void {
    if (this.cuentaForm.invalid) return;
    this.isSaving = true;
    const data: CuentaBancariaDTO = this.cuentaForm.value;

    const operation = this.isEditing
      ? this.cuentaBancariaService.update(data)
      : this.cuentaBancariaService.create(data);

    const successMsg = this.isEditing ? 'Cuenta bancaria actualizada correctamente' : 'Cuenta bancaria creada correctamente';
    const errorMsg = this.isEditing ? 'Error al actualizar la cuenta bancaria' : 'Error al crear la cuenta bancaria';

    operation.subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: successMsg });
        this.loadCuentas();
        this.displayDialog = false;
        this.isSaving = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: errorMsg });
        this.isSaving = false;
      }
    });
  }

  confirmDelete(cuenta: CuentaBancariaDTO): void {
    this.cuentaToDelete = cuenta;
    this.showConfirmDelete = true;
  }

  deleteCuenta(): void {
    if (this.cuentaToDelete?.idCuentaBancaria) {
      this.cuentaBancariaService.delete(this.cuentaToDelete.idCuentaBancaria).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Cuenta bancaria desactivada correctamente' });
          this.loadCuentas();
          this.showConfirmDelete = false;
          this.cuentaToDelete = null;
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al desactivar la cuenta' });
        }
      });
    }
  }

  cancelDelete(): void {
    this.showConfirmDelete = false;
    this.cuentaToDelete = null;
  }

  hideDialog(): void {
    this.displayDialog = false;
    this.cuentaForm.reset({ activo: true });
  }

  getTipoCuentaLabel(idTipoCuenta?: number): string {
    if (!idTipoCuenta) return '—';
    return this.tiposCuenta.find(t => t.idTipoCuenta === idTipoCuenta)?.detalle ?? '—';
  }
}
