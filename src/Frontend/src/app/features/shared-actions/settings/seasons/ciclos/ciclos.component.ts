import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { CicloDTO, PeriodoLectivoDTO, RegimenDTO } from '../../../../../data/models/Entities';
import { CicloService } from '../../../../../core/services/postulaciones';
import { PeriodoLectivoService } from '../../../../../core/services/settings/periodo-lectivo.service';
import { RegimenService } from '../../../../../core/services/settings/regimen.service';
import { ConfirmationModalComponent } from '../../../../../shared/modal-confirmation/confirmation-modal.component';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-ciclos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TableModule, DialogModule, ButtonModule, InputTextModule, InputNumberModule, ToastModule, TooltipModule, ConfirmationModalComponent],
  templateUrl: './ciclos.component.html',
  styleUrls: ['./ciclos.component.css'],
  providers: [MessageService]
})
export class CiclosComponent implements OnInit {
  ciclos: CicloDTO[] = [];
  filteredCiclos: CicloDTO[] = [];
  periodos: PeriodoLectivoDTO[] = [];
  regimenes: RegimenDTO[] = [];
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
    private messageService: MessageService
  ) {
    this.cicloForm = this.fb.group({
      idCiclo: [null],
      idPadre: [null],
      idPeriodo: [null, Validators.required],
      idRegimen: [null, Validators.required],
      detalle: ['', Validators.required],
      fechaInicio: [null],
      fechaFin: [null]
    });
  }

  ngOnInit(): void {
    this.loadPeriodos();
    this.loadRegimenes();
    this.loadCiclos();
  }

  loadCiclos(): void {
    this.cicloService.getAll().subscribe({
      next: (data: CicloDTO[]) => {
        this.ciclos = data;
      },
      error: (error: any) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar ciclos' });
      }
    });
  }

  loadPeriodos(): void {
    this.periodoService.getAll().subscribe({
      next: (data: PeriodoLectivoDTO[]) => {
        this.periodos = data;
      },
      error: (error: any) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar periodos lectivos' });
      }
    });
  }

  loadRegimenes(): void {
    this.regimenService.getAll().subscribe({
      next: (data: RegimenDTO[]) => {
        this.regimenes = data;
      },
      error: (error: any) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar regimenes' });
      }
    });
  }

  openCreateDialog(): void {
    this.isEditing = false;
    this.cicloForm.reset();
    this.filteredCiclos = [...this.ciclos];
    this.displayDialog = true;
  }

  openEditDialog(ciclo: CicloDTO): void {
    this.isEditing = true;
    this.selectedCiclo = ciclo;
    this.cicloForm.patchValue(ciclo);
    this.filteredCiclos = this.ciclos.filter(c => c.idCiclo !== ciclo.idCiclo);
    this.displayDialog = true;
  }

  saveCiclo(): void {
    if (this.cicloForm.valid) {
      const ciclo: CicloDTO = this.cicloForm.value;
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