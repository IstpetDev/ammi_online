import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  PlantillaEvaluacionDTO,
  PlantillaEstructuraDTO,
  TipoPlantillaEstructuraDTO,
  ValidacionPesosDTO,
  PlantillaEstructuraCreateDTO,
  PlantillaEstructuraUpdateDTO,
  TipoReglaCalculoDTO,
  ReglasCalculoDTO,
  ReglasCalculoCreateDTO,
  ReglasCalculoUpdateDTO
} from '../../../../../../data/models/notas';
import { PlantillaEstructuraService } from '../../../../../../core/services/infrastructure/plantilla-estructura.service';
import { TipoPlantillaEstructuraService } from '../../../../../../core/services/infrastructure/tipo-plantilla-estructura.service';
import { TipoReglaCalculoService } from '../../../../../../core/services/infrastructure/tipo-regla-calculo.service';
import { ReglasCalculoService } from '../../../../../../core/services/infrastructure/reglas-calculo.service';

import { EstructuraTreeComponent } from '../../components/estructura-tree/estructura-tree.component';
import { NodoFormComponent, NodoConReglaData } from '../../components/nodo-form/nodo-form.component';
import { ValidacionPesosComponent } from '../../components/validacion-pesos/validacion-pesos.component';
import { MessageService } from 'primeng/api';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-configurar-plantilla',
  standalone: true,
  imports: [
    CommonModule,
    EstructuraTreeComponent,
    NodoFormComponent,
    ValidacionPesosComponent,
    ButtonModule,
    ToastModule,
    ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './configurar-plantilla.component.html',
  styleUrls: ['./configurar-plantilla.component.css']
})
export class ConfigurarPlantillaComponent implements OnInit {
  @Input() plantilla!: PlantillaEvaluacionDTO;
  @Output() back = new EventEmitter<void>();

  estructura: PlantillaEstructuraDTO[] = [];
  tiposEstructura: TipoPlantillaEstructuraDTO[] = [];
  tiposReglaCalculo: TipoReglaCalculoDTO[] = [];
  validacion: ValidacionPesosDTO | null = null;

  loading: boolean = false;

  // Dialog de Nodo
  showNodoDialog: boolean = false;
  editingNodo: PlantillaEstructuraDTO | null = null;
  currentParentId: number | null = null;
  ordenSugerido: number = 1;
  reglaExistenteNodo: ReglasCalculoDTO | null = null;

  constructor(
    private estructuraService: PlantillaEstructuraService,
    private tipoEstructuraService: TipoPlantillaEstructuraService,
    private tipoReglaService: TipoReglaCalculoService,
    private reglasService: ReglasCalculoService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    if (this.plantilla) {
      this.loadCatalogos();
      this.loadEstructura();
    }
  }

  loadCatalogos(): void {
    // Cargar tipos de estructura y tipos de regla en paralelo
    forkJoin({
      tiposEstructura: this.tipoEstructuraService.getAll(),
      tiposRegla: this.tipoReglaService.getAll()
    }).subscribe({
      next: (result) => {
        this.tiposEstructura = result.tiposEstructura;
        this.tiposReglaCalculo = result.tiposRegla;
        console.log('Tipos de estructura cargados:', this.tiposEstructura);
        console.log('Tipos de regla cargados:', this.tiposReglaCalculo);
      },
      error: (err) => {
        console.error('Error cargando catalogos:', err);
        this.messageService.add({
          severity: 'warn',
          summary: 'Advertencia',
          detail: 'No se pudieron cargar algunos catalogos'
        });
      }
    });
  }

  loadEstructura(): void {
    this.loading = true;
    this.estructuraService.getArbol(this.plantilla.idPlantillaEvaluacion).subscribe({
      next: (data) => {
        this.estructura = data;
        this.loading = false;
        this.validarPesos();
      },
      error: (err) => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar estructura' });
      }
    });
  }

  validarPesos(): void {
    this.estructuraService.validarPesos(this.plantilla.idPlantillaEvaluacion).subscribe({
      next: (val) => {
        this.validacion = val;
      },
      error: (err) => {
        console.error('Error validando pesos:', err);
      }
    });
  }

  onBack(): void {
    this.back.emit();
  }

  // --- Handlers del Arbol ---

  onAddNode(event: { parentId: number | null }): void {
    this.currentParentId = event.parentId;
    this.editingNodo = null;
    this.reglaExistenteNodo = null;
    this.ordenSugerido = this.calcularOrdenSugerido(event.parentId);
    this.showNodoDialog = true;
  }

  onEditNode(nodo: PlantillaEstructuraDTO): void {
    this.editingNodo = nodo;
    this.currentParentId = nodo.idNodoPadre;
    this.reglaExistenteNodo = null;

    // Cargar regla existente del nodo si existe
    this.reglasService.getByEstructura(nodo.idPlantillaEstructura).subscribe({
      next: (reglas) => {
        // El endpoint devuelve un array, tomamos la primera regla si existe
        this.reglaExistenteNodo = reglas && reglas.length > 0 ? reglas[0] : null;
        this.showNodoDialog = true;
      },
      error: (err) => {
        console.error('Error cargando regla del nodo:', err);
        this.showNodoDialog = true;
      }
    });
  }

  onDeleteNode(nodo: PlantillaEstructuraDTO): void {
    this.confirmationService.confirm({
      message: `¿Está seguro de eliminar el nodo "${nodo.nodoNombre}" y todos sus hijos?`,
      header: 'Confirmar Eliminacion',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.estructuraService.delete(nodo.idPlantillaEstructura).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Nodo eliminado' });
            this.loadEstructura();
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el nodo' });
          }
        });
      }
    });
  }

  // --- Handlers del Formulario ---

  onNodeSave(data: NodoConReglaData): void {
    if (this.editingNodo) {
      // Actualizar nodo existente
      this.estructuraService.update(data.nodo as PlantillaEstructuraUpdateDTO).subscribe({
        next: (nodoActualizado) => {
          this.handleReglaAfterNodoSave(data, nodoActualizado.idPlantillaEstructura);
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar nodo' });
        }
      });
    } else {
      // Crear nuevo nodo
      this.estructuraService.create(data.nodo as PlantillaEstructuraCreateDTO).subscribe({
        next: (nodoCreado) => {
          // Si hay datos de regla y es nodo nuevo, crear la regla
          if (data.regla && !this.editingNodo) {
            const reglaCreate: ReglasCalculoCreateDTO = {
              idTipoReglaCalculo: (data.regla as any).idTipoReglaCalculo,
              idPlantillaEstructura: nodoCreado.idPlantillaEstructura,
              notaMinimaAprobar: (data.regla as any).notaMinimaAprobar,
              notaMinimaRecuperar: (data.regla as any).notaMinimaRecuperar
            };
            this.reglasService.create(reglaCreate).subscribe({
              next: () => {
                this.messageService.add({ severity: 'success', summary: 'Creado', detail: 'Nodo y regla creados' });
                this.showNodoDialog = false;
                this.loadEstructura();
              },
              error: () => {
                this.messageService.add({ severity: 'warn', summary: 'Advertencia', detail: 'Nodo creado, pero error al crear regla' });
                this.showNodoDialog = false;
                this.loadEstructura();
              }
            });
          } else {
            this.messageService.add({ severity: 'success', summary: 'Creado', detail: 'Nodo creado' });
            this.showNodoDialog = false;
            this.loadEstructura();
          }
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al crear nodo' });
        }
      });
    }
  }

  private handleReglaAfterNodoSave(data: NodoConReglaData, idPlantillaEstructura: number): void {
    if (data.eliminarRegla && this.reglaExistenteNodo) {
      // Eliminar regla
      this.reglasService.delete(this.reglaExistenteNodo.idReglasCalculo).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Nodo actualizado y regla eliminada' });
          this.showNodoDialog = false;
          this.loadEstructura();
        },
        error: () => {
          this.messageService.add({ severity: 'warn', summary: 'Advertencia', detail: 'Nodo actualizado, pero error al eliminar regla' });
          this.showNodoDialog = false;
          this.loadEstructura();
        }
      });
    } else if (data.regla) {
      if ('idReglasCalculo' in data.regla) {
        // Actualizar regla existente
        this.reglasService.update(data.regla as ReglasCalculoUpdateDTO).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Nodo y regla actualizados' });
            this.showNodoDialog = false;
            this.loadEstructura();
          },
          error: () => {
            this.messageService.add({ severity: 'warn', summary: 'Advertencia', detail: 'Nodo actualizado, pero error al actualizar regla' });
            this.showNodoDialog = false;
            this.loadEstructura();
          }
        });
      } else {
        // Crear nueva regla
        const reglaCreate: ReglasCalculoCreateDTO = {
          ...(data.regla as ReglasCalculoCreateDTO),
          idPlantillaEstructura: idPlantillaEstructura
        };
        this.reglasService.create(reglaCreate).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Nodo actualizado y regla creada' });
            this.showNodoDialog = false;
            this.loadEstructura();
          },
          error: () => {
            this.messageService.add({ severity: 'warn', summary: 'Advertencia', detail: 'Nodo actualizado, pero error al crear regla' });
            this.showNodoDialog = false;
            this.loadEstructura();
          }
        });
      }
    } else {
      this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Nodo actualizado' });
      this.showNodoDialog = false;
      this.loadEstructura();
    }
  }

  onNodeCancel(): void {
    this.showNodoDialog = false;
    this.editingNodo = null;
    this.reglaExistenteNodo = null;
  }

  // --- Helpers ---

  private calcularOrdenSugerido(parentId: number | null): number {
    let hermanos: PlantillaEstructuraDTO[] = [];

    if (parentId === null) {
      hermanos = this.estructura;
    } else {
      const padre = this.findNodeRecursive(this.estructura, parentId);
      if (padre) {
        hermanos = padre.hijos || [];
      }
    }

    if (!hermanos || hermanos.length === 0) return 1;

    const maxOrden = Math.max(...hermanos.map(n => n.orden));
    return maxOrden + 1;
  }

  private findNodeRecursive(nodos: PlantillaEstructuraDTO[], id: number): PlantillaEstructuraDTO | null {
    for (const nodo of nodos) {
      if (nodo.idPlantillaEstructura === id) return nodo;
      if (nodo.hijos) {
        const found = this.findNodeRecursive(nodo.hijos, id);
        if (found) return found;
      }
    }
    return null;
  }
}
