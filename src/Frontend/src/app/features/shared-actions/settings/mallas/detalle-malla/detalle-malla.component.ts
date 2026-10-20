import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { Select } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';

// Services
import { MallaService } from '../../../../../core/services/infrastructure/malla.service';
import { MateriaService } from '../../../../../core/services/infrastructure/materia.service';
import { PlantillaEvaluacionService } from '../../../../../core/services/infrastructure/plantilla-evaluacion.service';
import { AreaCompetenciaService } from '../../../../../core/services/infrastructure/area-competencia.service';
import { DetalleMallaService } from '../../../../../core/services/infrastructure/detalle-malla.service';

// Models
import { MallaDTO } from '../../../../../data/models/Entities';
import { MateriaDTO } from '../../../../../data/models/Entities';
import { PlantillaEvaluacionDTO } from '../../../../../data/models/notas/plantilla-evaluacion.model';
import { AreaCompetenciaDTO } from '../../../../../data/models/Entities';
import { DetalleMallaCreateDTO, DetalleMallaBulkDTO } from '../../../../../data/models/detalle-malla/detalle-malla.model';

@Component({
  selector: 'app-detalle-malla',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    Select,
    TableModule,
    ToastModule,
    ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './detalle-malla.component.html',
  styleUrls: ['./detalle-malla.component.css']
})
export class DetalleMallaComponent implements OnInit {
  // Services
  private mallaService = inject(MallaService);
  private materiaService = inject(MateriaService);
  private plantillaService = inject(PlantillaEvaluacionService);
  private areaCompetenciaService = inject(AreaCompetenciaService);
  private detalleMallaService = inject(DetalleMallaService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  // Data
  mallas: MallaDTO[] = [];
  materias: MateriaDTO[] = [];
  plantillas: PlantillaEvaluacionDTO[] = [];
  areasCompetencia: AreaCompetenciaDTO[] = [];
  detallesMalla: DetalleMallaCreateDTO[] = [];

  // Form data
  selectedMalla: MallaDTO | null = null;
  selectedMateria: MateriaDTO | null = null;
  selectedPlantilla: PlantillaEvaluacionDTO | null = null;
  selectedAreaCompetencia: AreaCompetenciaDTO | null = null;

  // UI state
  loading = false;
  saving = false;

  // Dropdown options
  mallaOptions: { label: string; value: MallaDTO }[] = [];
  materiaOptions: { label: string; value: MateriaDTO }[] = [];
  plantillaOptions: { label: string; value: PlantillaEvaluacionDTO }[] = [];
  areaCompetenciaOptions: { label: string; value: AreaCompetenciaDTO }[] = [];

  ngOnInit(): void {
    this.cargarDatos();
  }

  /**
   * Cargar todas las listas de opciones
   */
  cargarDatos(): void {
    this.loading = true;    
    this.cargarMallas();
    this.cargarMaterias();
    this.cargarPlantillas();
    this.cargarAreasCompetencia();
  }

  /**
   * Cargar lista de mallas
   */
  cargarMallas(): void {
    this.mallaService.getAll().subscribe({
      next: (mallas) => {
        this.mallas = mallas;
        this.mallaOptions = mallas.map(m => ({
          label: m.detalle || `Malla ${m.idMalla}`,
          value: m
        }));
        this.checkLoadingComplete();
      },
      error: (err) => {
        console.error('Error cargando mallas:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las mallas'
        });
        this.checkLoadingComplete();
      }
    });
  }

  /**
   * Cargar lista de materias
   */
  cargarMaterias(): void {
    this.materiaService.getAll().subscribe({
      next: (data) => {
        this.materias = data?.items || [];
        this.materiaOptions = this.materias.map(m => ({
          label: m.detalle || `Materia ${m.idMateria}`,
          value: m
        }));
        this.checkLoadingComplete();
      },
      error: (err) => {
        console.error('Error cargando materias:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las materias'
        });
        this.checkLoadingComplete();
      }
    });
  }

  /**
   * Cargar lista de plantillas de evaluación
   */
  cargarPlantillas(): void {
    this.plantillaService.getAll().subscribe({
      next: (plantillas) => {
        this.plantillas = plantillas;
        this.plantillaOptions = plantillas.map(p => ({
          label: p.nombre,
          value: p
        }));
        this.checkLoadingComplete();
      },
      error: (err) => {
        console.error('Error cargando plantillas:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las plantillas de evaluación'
        });
        this.checkLoadingComplete();
      }
    });
  }

  /**
   * Cargar lista de áreas de competencia
   */
  cargarAreasCompetencia(): void {
    this.areaCompetenciaService.getAll().subscribe({
      next: (areas) => {
        this.areasCompetencia = areas;
        this.areaCompetenciaOptions = areas.map(a => ({
          label: a.detalle || `Área ${a.idAreaCompetencia}`,
          value: a
        }));
        this.checkLoadingComplete();
      },
      error: (err) => {
        console.error('Error cargando áreas de competencia:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las áreas de competencia'
        });
        this.checkLoadingComplete();
      }
    });
  }

  /**
   * Verificar si todas las cargas han completado
   */
  private loadCount = 0;
  private totalLoads = 4;

  checkLoadingComplete(): void {
    this.loadCount++;
    if (this.loadCount >= this.totalLoads) {
      this.loading = false;
    }
  }

  /**
   * Agregar detalle malla a la lista
   */
  agregarDetalle(): void {
    if (!this.selectedMalla || !this.selectedMateria || !this.selectedPlantilla || !this.selectedAreaCompetencia) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campos requeridos',
        detail: 'Debe seleccionar todos los campos para agregar un detalle'
      });
      return;
    }

    const detalle: DetalleMallaCreateDTO = {
      idMalla: this.selectedMalla.idMalla!,
      idMateria: this.selectedMateria.idMateria!,
      idPlantillaEvaluacion: this.selectedPlantilla.idPlantillaEvaluacion,
      idAreaCompetencia: this.selectedAreaCompetencia.idAreaCompetencia!
    };

    // Verificar si ya existe esta combinación
    const existe = this.detallesMalla.some(d =>
      d.idMalla === detalle.idMalla &&
      d.idMateria === detalle.idMateria
    );

    if (existe) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Duplicado',
        detail: 'Esta combinación de malla y materia ya existe'
      });
      return;
    }

    this.detallesMalla.push(detalle);

    // Limpiar formulario
    this.selectedMateria = null;
    this.selectedPlantilla = null;
    this.selectedAreaCompetencia = null;

    this.messageService.add({
      severity: 'success',
      summary: 'Agregado',
      detail: 'Detalle malla agregado correctamente'
    });
  }

  /**
   * Eliminar detalle malla de la lista
   */
  eliminarDetalle(index: number): void {
    this.confirmationService.confirm({
      message: '¿Está seguro de eliminar este detalle malla?',
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.detallesMalla.splice(index, 1);
        this.messageService.add({
          severity: 'success',
          summary: 'Eliminado',
          detail: 'Detalle malla eliminado correctamente'
        });
      }
    });
  }

  /**
   * Guardar todos los detalles malla
   */
  guardarDetalles(): void {
    if (this.detallesMalla.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sin datos',
        detail: 'No hay detalles malla para guardar'
      });
      return;
    }

    this.confirmationService.confirm({
      message: `¿Está seguro de guardar ${this.detallesMalla.length} detalle(s) malla?`,
      header: 'Confirmar guardado',
      icon: 'pi pi-question-circle',
      accept: () => {
        this.saving = true;

        const bulkData: DetalleMallaBulkDTO = {
          detalles: this.detallesMalla
        };

        this.detalleMallaService.createBulk(bulkData).subscribe({
          next: (result) => {
            this.saving = false;
            this.messageService.add({
              severity: 'success',
              summary: 'Guardado exitoso',
              detail: `Se guardaron ${result.length} detalles malla correctamente`
            });

            // Limpiar lista y formulario
            this.detallesMalla = [];
            this.selectedMalla = null;
            this.selectedMateria = null;
            this.selectedPlantilla = null;
            this.selectedAreaCompetencia = null;
          },
          error: (err) => {
            this.saving = false;
            console.error('Error guardando detalles malla:', err);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudieron guardar los detalles malla'
            });
          }
        });
      }
    });
  }

  /**
   * Limpiar formulario
   */
  limpiarFormulario(): void {
    this.selectedMalla = null;
    this.selectedMateria = null;
    this.selectedPlantilla = null;
    this.selectedAreaCompetencia = null;
  }

  /**
   * Obtener nombre de malla por ID
   */
  getNombreMalla(idMalla: number): string {
    const malla = this.mallas.find(m => m.idMalla === idMalla);
    return malla?.detalle || `Malla ${idMalla}`;
  }

  /**
   * Obtener nombre de materia por ID
   */
  getNombreMateria(idMateria: number): string {
    const materia = this.materias.find(m => m.idMateria === idMateria);
    return materia?.detalle || `Materia ${idMateria}`;
  }

  /**
   * Obtener nombre de plantilla por ID
   */
  getNombrePlantilla(idPlantilla: number): string {
    const plantilla = this.plantillas.find(p => p.idPlantillaEvaluacion === idPlantilla);
    return plantilla?.nombre || `Plantilla ${idPlantilla}`;
  }

  /**
   * Obtener nombre de área de competencia por ID
   */
  getNombreAreaCompetencia(idAreaCompetencia: number): string {
    const area = this.areasCompetencia.find(a => a.idAreaCompetencia === idAreaCompetencia);
    return area?.detalle || `Área ${idAreaCompetencia}`;
  }
}