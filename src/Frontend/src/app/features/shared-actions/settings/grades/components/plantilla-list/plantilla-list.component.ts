import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlantillaEvaluacionService } from '../../../../../../core/services/infrastructure/plantilla-evaluacion.service';
import { PlantillaEstructuraService } from '../../../../../../core/services/infrastructure/plantilla-estructura.service';
import { PlantillaEvaluacionDTO } from '../../../../../../data/models/notas';
import { ConfirmationModalComponent } from '../../../../../../shared/modal-confirmation/confirmation-modal.component';
import { SharedDrawerComponent } from '../../../../../../shared/shared-drawer/shared-drawer.component';
import { SharedTableComponent, SharedTableColTemplateDirective, TableColumn, PageEvent } from '../../../../../../shared/shared-table/shared-table.component';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { SelectButtonModule } from 'primeng/selectbutton';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { SharedToastComponent } from '../../../../../../shared/shared-toast/shared-toast.component';

@Component({
  selector: 'app-plantilla-list',
  standalone: true,
  imports: [CommonModule, 
    FormsModule,
    SharedTableComponent,
    SharedTableColTemplateDirective,
    ButtonModule,
    TagModule,
    TooltipModule,
    SelectButtonModule,
    InputTextModule,
    SharedDrawerComponent,
    ConfirmationModalComponent, SharedToastComponent],
  providers: [MessageService],
  templateUrl: './plantilla-list.component.html',
  styleUrls: ['./plantilla-list.component.css']
})
export class PlantillaListComponent implements OnInit {
  @Output() create = new EventEmitter<void>();
  @Output() edit = new EventEmitter<PlantillaEvaluacionDTO>();
  @Output() configure = new EventEmitter<PlantillaEvaluacionDTO>();

  plantillas: PlantillaEvaluacionDTO[] = [];
  loading: boolean = false;

  // Shared table
  currentPage: number = 1;
  rowsPerPage: number = 10;

  tableColumns: TableColumn[] = [
    { field: 'nombre', header: 'Nombre' },
    { field: 'detalle', header: 'Descripción' },
    { field: 'estado', header: 'Estado', width: '120px', align: 'center' },
    { field: 'cantidadMateriasUsando', header: 'Materias Usando', width: '160px', align: 'center' },
    { field: 'acciones', header: 'Acciones', width: '200px', align: 'center' }
  ];

  get paginatedPlantillas(): PlantillaEvaluacionDTO[] {
    const start = (this.currentPage - 1) * this.rowsPerPage;
    return this.plantillas.slice(start, start + this.rowsPerPage);
  }

  // Filtro
  filtroOptions: any[] = [
    { label: 'Activas', value: 'activas' },
    { label: 'Todas', value: 'todas' }
  ];
  filtroActivo: string = 'activas';

  // Eliminar
  plantillaToDelete: PlantillaEvaluacionDTO | null = null;
  showConfirmDelete: boolean = false;
  mensajeConfirmacion: string = '';

  // Duplicar
  showDuplicateDialog: boolean = false;
  plantillaToDuplicate: PlantillaEvaluacionDTO | null = null;
  nuevoNombreDuplicado: string = '';
  duplicating: boolean = false;

  constructor(
    private plantillaService: PlantillaEvaluacionService,
    private estructuraService: PlantillaEstructuraService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadPlantillas();
  }

  loadPlantillas(): void {
    this.loading = true;
    const request$ = this.filtroActivo === 'activas' 
      ? this.plantillaService.getActivas()
      : this.plantillaService.getAll();

    request$.subscribe({
      next: (data) => {
        this.plantillas = data;
        this.currentPage = 1;
        this.loading = false;
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las plantillas' });
        this.loading = false;
      }
    });
  }

  onFiltroChange(): void {
    this.loadPlantillas();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.page;
  }

  onCreate(): void {
    this.create.emit();
  }

  onEdit(plantilla: PlantillaEvaluacionDTO): void {
    this.edit.emit(plantilla);
  }

  onConfigure(plantilla: PlantillaEvaluacionDTO): void {
    this.configure.emit(plantilla);
  }

  // Eliminar logic
  onDelete(plantilla: PlantillaEvaluacionDTO): void {
    this.plantillaToDelete = plantilla;
    this.mensajeConfirmacion = `¿Está seguro de eliminar la plantilla "${plantilla.nombre}"?`;
    this.showConfirmDelete = true;
  }

  confirmDelete(): void {
    if (!this.plantillaToDelete) return;

    this.plantillaService.delete(this.plantillaToDelete.idPlantillaEvaluacion).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Plantilla eliminada correctamente' });
        this.showConfirmDelete = false;
        this.plantillaToDelete = null;
        this.loadPlantillas();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la plantilla' });
      }
    });
  }

  cancelDelete(): void {
    this.showConfirmDelete = false;
    this.plantillaToDelete = null;
  }

  // Duplicar logic
  onDuplicate(plantilla: PlantillaEvaluacionDTO): void {
    this.plantillaToDuplicate = plantilla;
    this.nuevoNombreDuplicado = `${plantilla.nombre} (Copia)`;
    this.showDuplicateDialog = true;
  }

  cancelDuplicate(): void {
    this.showDuplicateDialog = false;
    this.plantillaToDuplicate = null;
    this.nuevoNombreDuplicado = '';
  }

  confirmDuplicate(): void {
    if (!this.plantillaToDuplicate || !this.nuevoNombreDuplicado.trim()) return;

    this.duplicating = true;
    this.estructuraService.duplicarPlantilla(
      this.plantillaToDuplicate.idPlantillaEvaluacion, 
      this.nuevoNombreDuplicado
    ).subscribe({
      next: (nuevaPlantilla) => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Plantilla duplicada correctamente' });
        this.showDuplicateDialog = false;
        this.plantillaToDuplicate = null;
        this.duplicating = false;
        this.loadPlantillas();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo duplicar la plantilla' });
        this.duplicating = false;
      }
    });
  }
}
