import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { AreaDTO } from '../../../../../data/models/Entities';
import { AreaService } from '../../../../../core/services/infrastructure/area.service';
import { ConfirmationModalComponent } from '../../../../../shared/modal-confirmation/confirmation-modal.component';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-areas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TableModule, DialogModule, ButtonModule, InputTextModule, ToastModule, TooltipModule, ConfirmationModalComponent],
  templateUrl: './areas.component.html',
  styleUrls: ['./areas.component.css'],
  providers: [MessageService]
})
export class AreasComponent implements OnInit {
  areas: AreaDTO[] = [];
  areaForm: FormGroup;
  displayDialog: boolean = false;
  isEditing: boolean = false;
  selectedArea: AreaDTO | null = null;
  showConfirmDelete: boolean = false;
  areaToDelete: AreaDTO | null = null;

  constructor(
    private fb: FormBuilder,
    private areaService: AreaService,
    private messageService: MessageService
  ) {
    this.areaForm = this.fb.group({
      idArea: [null],
      detalle: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadAreas();
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
    this.areaForm.reset();
    this.displayDialog = true;
  }

  openEditDialog(area: AreaDTO): void {
    this.isEditing = true;
    this.selectedArea = area;
    this.areaForm.patchValue(area);
    this.displayDialog = true;
  }

  saveArea(): void {
    if (this.areaForm.valid) {
      const area: AreaDTO = this.areaForm.value;
      if (this.isEditing) {
        this.areaService.update(area).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Área actualizada correctamente' });
            this.loadAreas();
            this.displayDialog = false;
          },
          error: (error) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar área' });
          }
        });
      } else {
        this.areaService.create(area).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Área creada correctamente' });
            this.loadAreas();
            this.displayDialog = false;
          },
          error: (error) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al crear área' });
          }
        });
      }
    }
  }

  confirmDelete(area: AreaDTO): void {
    this.areaToDelete = area;
    this.showConfirmDelete = true;
  }

  deleteArea(): void {
    if (this.areaToDelete?.idArea) {
      this.areaService.delete(this.areaToDelete.idArea).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Área eliminada correctamente' });
          this.loadAreas();
          this.showConfirmDelete = false;
          this.areaToDelete = null;
        },
        error: (error) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar área' });
        }
      });
    }
  }

  cancelDelete(): void {
    this.showConfirmDelete = false;
    this.areaToDelete = null;
  }

  hideDialog(): void {
    this.displayDialog = false;
    this.areaForm.reset();
  }
}