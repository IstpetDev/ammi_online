import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TooltipModule } from 'primeng/tooltip';
import { CicloDTO, PeriodoLectivoDTO, RegimenDTO, TipoOfertaDTO } from '../../../../../data/models/Entities';
import { CicloService } from '../../../../../core/services/postulaciones';
import { PeriodoLectivoService } from '../../../../../core/services/settings/periodo-lectivo.service';
import { RegimenService } from '../../../../../core/services/settings/regimen.service';
import { TipoOfertaService } from '../../../../../core/services/infrastructure/tipo-oferta.service';
import { ConfirmationModalComponent } from '../../../../../shared/modal-confirmation/confirmation-modal.component';
import { MessageService } from 'primeng/api';
import { SharedToastComponent } from '../../../../../shared/shared-toast/shared-toast.component';

@Component({
  selector: 'app-ciclos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TableModule, DialogModule, ButtonModule,
    InputTextModule, InputNumberModule, SelectModule, DatePickerModule,
    TooltipModule, ConfirmationModalComponent, SharedToastComponent],
  templateUrl: './ciclos.component.html',
  styleUrls: ['./ciclos.component.css'],
  providers: [MessageService]
})
export class CiclosComponent implements OnInit {
  ciclos: CicloDTO[] = [];
  filteredCiclos: CicloDTO[] = [];
  periodos: PeriodoLectivoDTO[] = [];
  regimenes: RegimenDTO[] = [];
  tiposOferta: TipoOfertaDTO[] = [];
  cicloForm: FormGroup;
  displayDialog: boolean = false;
  isEditing: boolean = false;
  selectedCiclo: CicloDTO | null = null;
  showConfirmDelete: boolean = false;
  cicloToDelete: CicloDTO | null = null;

  constructor(
    private fb: FormBuilder,
    private cicloService: CicloService,
    private periodoService: PeriodoLectivoService,
    private regimenService: RegimenService,
    private tipoOfertaService: TipoOfertaService,
    private messageService: MessageService
  ) {
    this.cicloForm = this.fb.group({
      idCiclo: [null],
      idPadre: [null],
      idTipoOferta: [null, Validators.required],
      idPeriodo: [null, Validators.required],
      idRegimen: [null, Validators.required],
      detalle: ['', Validators.required],
      fechaInicioEstimada: [null],
      fechaFinEstimada: [null]
    });
    // autogeneracion flags
    this.detalleAuto = true;
    this.lastGeneratedDetalle = '';
  }

  // autogeneration state
  private detalleAuto: boolean = true;
  private lastGeneratedDetalle: string = '';

  ngOnInit(): void {
    this.loadPeriodos();
    this.loadRegimenes();
    this.loadCiclos();
    this.loadTiposOferta();
    this.setupAutoDetalleSubscription();
  }

  loadTiposOferta(): void {
    this.tipoOfertaService.getAll().subscribe({
      next: (data) => { this.tiposOferta = data || []; },
      error: () => { this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar tipos de oferta' }); }
    });
  }

  private setupAutoDetalleSubscription(): void {
    this.cicloForm.get('idRegimen')?.valueChanges.subscribe(() => this.updateGeneratedDetalleIfAllowed());
    this.cicloForm.get('idPadre')?.valueChanges.subscribe(() => this.updateGeneratedDetalleIfAllowed());
    this.cicloForm.get('idTipoOferta')?.valueChanges.subscribe(() => this.updateGeneratedDetalleIfAllowed());
  }

  private updateGeneratedDetalleIfAllowed(): void {
    const generated = this.generateDetalleForCiclo();
    const current = this.cicloForm.get('detalle')?.value || '';
    if (this.detalleAuto || current === this.lastGeneratedDetalle || !current) {
      this.lastGeneratedDetalle = generated;
      this.cicloForm.patchValue({ detalle: generated }, { emitEvent: false });
    }
  }

  private generateDetalleForCiclo(): string {
    const ofertaId = this.cicloForm.get('idTipoOferta')?.value;
    const idRegimen = this.cicloForm.get('idRegimen')?.value;
    const idPadre = this.cicloForm.get('idPadre')?.value;
    const regimenName = idRegimen ? this.getRegimenDetalle(idRegimen) : '';

    if (!ofertaId) return '';
    const ofertaObj = this.tiposOferta.find(t => t.idtipoOferta === Number(ofertaId));
    const ofertaDetalle = ofertaObj?.detalle?.toUpperCase() || '';

    const isFormal = ofertaDetalle.includes('FORMAL');
    const isAcelerado = ofertaDetalle.includes('ACELERADO');

    if (isFormal) {
      // CICLO (literal) + Regimen + FORMALIDAD
      return ['CICLO', regimenName, 'FORMAL VIRTUAL'].filter(s => s).join(' ');
    }

    if (isAcelerado) {
      const prefix = idPadre ? 'CICLO II' : 'CICLO I';
      return [prefix, regimenName, 'ACELERADO'].filter(s => s).join(' ');
    }

    // Fallback: si no detecta, devolver vacío o el detalle de la oferta
    return ofertaObj?.detalle || '';
  }

  onDetalleInput(): void {
    this.detalleAuto = false;
  }

  desactivarCiclo(ciclo: CicloDTO): void {
    this.cicloService.deactivate(ciclo.idCiclo!).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Ciclo desactivado correctamente' });
        this.loadCiclos();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al desactivar ciclo' });
      }
    });
  }

  reactivarCiclo(ciclo: CicloDTO): void {
    this.cicloService.reactivate(ciclo).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Ciclo reactivado correctamente' });
        this.loadCiclos();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al reactivar ciclo' });
      }
    });
  }

  loadCiclos(): void {
    this.cicloService.getAll().subscribe({
      next: (data: CicloDTO[] | null) => { this.ciclos = data || []; },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar ciclos' });
      }
    });
  }

  loadPeriodos(): void {
    this.periodoService.getAll().subscribe({
      next: (data: PeriodoLectivoDTO[]) => { this.periodos = data; },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar periodos lectivos' });
      }
    });
  }

  loadRegimenes(): void {
    this.regimenService.getAll().subscribe({
      next: (data: RegimenDTO[]) => { this.regimenes = data; },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar regimenes' });
      }
    });
  }

  openCreateDialog(): void {
    this.isEditing = false;
    this.cicloForm.reset();
    // defensiva: si la API devolvió null, aseguramos un array
    this.filteredCiclos = [...(this.ciclos || [])];
    this.displayDialog = true;
  }

  openEditDialog(ciclo: CicloDTO): void {
    this.isEditing = true;
    this.selectedCiclo = ciclo;
    // defensiva: proteger contra ciclos null/undefined
    this.filteredCiclos = Array.isArray(this.ciclos) ? this.ciclos.filter(c => c.idCiclo !== ciclo.idCiclo) : [];
    this.cicloForm.patchValue({
      ...ciclo,
      fechaInicioEstimada: ciclo.fechaInicioEstimada ? new Date(ciclo.fechaInicioEstimada) : null,
      fechaFinEstimada: ciclo.fechaFinEstimada ? new Date(ciclo.fechaFinEstimada) : null,
    });
    this.displayDialog = true;
  }

  saveCiclo(): void {
    if (this.cicloForm.valid) {
      const fv = this.cicloForm.value;
      const ciclo: CicloDTO = {
        ...fv,
        fechaInicioEstimada: fv.fechaInicioEstimada instanceof Date
          ? fv.fechaInicioEstimada.toISOString().split('T')[0]
          : fv.fechaInicioEstimada,
        fechaFinEstimada: fv.fechaFinEstimada instanceof Date
          ? fv.fechaFinEstimada.toISOString().split('T')[0]
          : fv.fechaFinEstimada,
      };
      if (this.isEditing) {
        this.cicloService.update(ciclo).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Ciclo actualizado correctamente' });
            this.loadCiclos();
            this.displayDialog = false;
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar ciclo' });
          }
        });
      } else {
        this.cicloService.create(ciclo).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Ciclo creado correctamente' });
            this.loadCiclos();
            this.displayDialog = false;
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al crear ciclo' });
          }
        });
      }
    }
  }

  confirmDelete(ciclo: CicloDTO): void {
    this.cicloToDelete = ciclo;
    this.showConfirmDelete = true;
  }

  deleteCiclo(): void {
    if (this.cicloToDelete) {
      this.cicloService.delete(this.cicloToDelete.idCiclo!).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Ciclo eliminado correctamente' });
          this.loadCiclos();
          this.showConfirmDelete = false;
          this.cicloToDelete = null;
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar ciclo' });
        }
      });
    }
  }

  onHideDialog(): void {
    this.displayDialog = false;
    this.cicloForm.reset();
  }

  onRejectDelete(): void {
    this.showConfirmDelete = false;
    this.cicloToDelete = null;
  }

  getPeriodoDetalle(id: number | undefined): string {
    const periodo = this.periodos.find(p => p.idPeriodoLectivo === id);
    return periodo ? periodo.detalle || '' : '';
  }

  getRegimenDetalle(id: number | undefined): string {
    const regimen = this.regimenes.find(r => r.idRegimen === id);
    return regimen ? regimen.detalle || '' : '';
  }
}
