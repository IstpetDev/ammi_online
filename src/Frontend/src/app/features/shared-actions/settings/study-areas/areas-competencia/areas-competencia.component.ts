import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { AreaCompetenciaDTO, AreaDTO } from '../../../../../data/models/Entities';
import { AreaCompetenciaService } from '../../../../../core/services/infrastructure/area-competencia.service';
import { AreaService } from '../../../../../core/services/infrastructure/area.service';
import { ConfirmationModalComponent } from '../../../../../shared/modal-confirmation/confirmation-modal.component';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-areas-competencia',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TableModule, DialogModule, ButtonModule, InputTextModule, ToastModule, TooltipModule, ConfirmationModalComponent],
  templateUrl: './areas-competencia.component.html',
  styleUrls: ['./areas-competencia.component.css'],
  providers: [MessageService]
})
export class AreasCompetenciaComponent implements OnInit {
  areasCompetencia: AreaCompetenciaDTO[] = [];
  areas: AreaDTO[] = [];
  areaCompetenciaForm: FormGroup;
  displayDialog: boolean = false;
  isEditing: boolean = false;
  selectedAreaCompetencia: AreaCompetenciaDTO | null = null;
  showConfirmDelete: boolean = false;
  areaCompetenciaToDelete: AreaCompetenciaDTO | null = null;

  constructor(
    private fb: FormBuilder,
    private areaCompetenciaService: AreaCompetenciaService,
    private areaService: AreaService,
    private messageService: MessageService
  ) {
    this.areaCompetenciaForm = this.fb.group({
      idAreaCompetencia: [null],
      detalle: ['', Validators.required],
      idArea: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadAreasCompetencia();
    this.loadAreas();
  }

  loadAreasCompetencia(): void {
    this.areaCompetenciaService.getAll().subscribe({
      next: (data) => {
        this.areasCompetencia = data;
      },
      error: (error) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar áreas de competencia' });
      }
    });
  }

  loadAreas(): void {
    this.areaService.getAll().subscribe({
      next: (data) => {
        this.areas = data;
      },
      error: (error) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar áreas' });
      }
    });
  }

  openCreateDialog(): void {
    this.isEditing = false;
    this.areaCompetenciaForm.reset();
    this.displayDialog = true;
  }

  openEditDialog(areaCompetencia: AreaCompetenciaDTO): void {
    this.isEditing = true;
    this.selectedAreaCompetencia = areaCompetencia;
    this.areaCompetenciaForm.patchValue(areaCompetencia);
    this.displayDialog = true;
  }

  saveAreaCompetencia(): void {
    if (this.areaCompetenciaForm.valid) {
      const areaCompetencia: AreaCompetenciaDTO = this.areaCompetenciaForm.value;
      if (this.isEditing) {
        this.areaCompetenciaService.update(areaCompetencia).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Área de competencia actualizada correctamente' });
            this.loadAreasCompetencia();
            this.displayDialog = false;
          },
          error: (error) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar área de competencia' });
          }
        });
      } else {
        this.areaCompetenciaService.create(areaCompetencia).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Área de competencia creada correctamente' });
            this.loadAreasCompetencia();
            this.displayDialog = false;
          },
          error: (error) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al crear área de competencia' });
          }
        });
      }
    }
  }

  confirmDelete(areaCompetencia: AreaCompetenciaDTO): void {
    this.areaCompetenciaToDelete = areaCompetencia;
    this.showConfirmDelete = true;
  }

  deleteAreaCompetencia(): void {
    if (this.areaCompetenciaToDelete?.idAreaCompetencia) {
      this.areaCompetenciaService.delete(this.areaCompetenciaToDelete.idAreaCompetencia).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Área de competencia eliminada correctamente' });
          this.loadAreasCompetencia();
          this.showConfirmDelete = false;
          this.areaCompetenciaToDelete = null;
        },
        error: (error) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar área de competencia' });
        }
      });
    }
  }

  cancelDelete(): void {
    this.showConfirmDelete = false;
    this.areaCompetenciaToDelete = null;
  }

  hideDialog(): void {
    this.displayDialog = false;
    this.areaCompetenciaForm.reset();
  }

  getAreaName(idArea: number): string {
    const area = this.areas.find(a => a.idArea === idArea);
    return area?.detalle || '';
  }
}