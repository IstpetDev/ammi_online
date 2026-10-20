import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TreeNode } from 'primeng/api';
import { PlantillaEstructuraDTO, TipoPlantillaEstructuraDTO } from '../../../../../../data/models/notas';

// PrimeNG Imports
import { TreeTableModule } from 'primeng/treetable';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-estructura-tree',
  standalone: true,
  imports: [
    CommonModule,
    TreeTableModule,
    ButtonModule,
    TagModule,
    TooltipModule
  ],
  templateUrl: './estructura-tree.component.html',
  styleUrls: ['./estructura-tree.component.css']
})
export class EstructuraTreeComponent implements OnChanges {
  @Input() estructura: PlantillaEstructuraDTO[] = [];
  @Input() tiposEstructura: TipoPlantillaEstructuraDTO[] = [];
  @Input() loading: boolean = false;

  @Output() addNode = new EventEmitter<{ parentId: number | null }>();
  @Output() editNode = new EventEmitter<PlantillaEstructuraDTO>();
  @Output() deleteNode = new EventEmitter<PlantillaEstructuraDTO>();

  treeNodes: TreeNode[] = [];
  cols: any[] = [];

  // Iconos y colores para tipos de nodo
  private readonly TIPO_NODO_CONFIG: Record<string, { icon: string; color: string }> = {
    'QUIMESTRE': { icon: 'pi pi-book', color: 'text-blue-500' },
    'PARCIAL': { icon: 'pi pi-file', color: 'text-purple-500' },
    'EXAMEN': { icon: 'pi pi-check-square', color: 'text-red-500' },
    'TAREA': { icon: 'pi pi-pencil', color: 'text-green-500' },
    'LECCION': { icon: 'pi pi-list', color: 'text-orange-500' },
    'PROYECTO': { icon: 'pi pi-briefcase', color: 'text-cyan-500' },
    'ACTIVIDAD': { icon: 'pi pi-cog', color: 'text-gray-500' },
    'DEFAULT': { icon: 'pi pi-circle', color: 'text-gray-400' }
  };

  constructor() {
    this.cols = [
      { field: 'nombre', header: 'Nombre' },
      { field: 'peso', header: 'Peso (%)' },
      { field: 'tipo', header: 'Tipo' },
      { field: 'orden', header: 'Orden' }
    ];
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['estructura'] && this.estructura) {
      this.treeNodes = this.transformToTreeNodes(this.estructura);
    }
  }

  transformToTreeNodes(estructura: PlantillaEstructuraDTO[]): TreeNode[] {
    return estructura.map(nodo => this.mapNodoToTreeNode(nodo));
  }

  private mapNodoToTreeNode(nodo: PlantillaEstructuraDTO): TreeNode {
    const tipoNombre = nodo.tipoNombre || this.getTipoNombre(nodo.idTipoPlantillaEstructura);
    
    return {
      key: nodo.idPlantillaEstructura.toString(),
      data: {
        nombre: nodo.nodoNombre,
        peso: nodo.peso,
        tipo: tipoNombre,
        orden: nodo.orden,
        formula: nodo.formula,
        nodo: nodo // Referencia al objeto completo
      },
      children: nodo.hijos?.map(hijo => this.mapNodoToTreeNode(hijo)) || [],
      expanded: true
    };
  }

  private getTipoNombre(idTipo: number): string {
    const tipo = this.tiposEstructura.find(t => t.idTipoPlantillaEstrucutra === idTipo);
    return tipo ? tipo.detalle : 'Desconocido';
  }

  getIconClass(tipoNombre: string): string {
    const config = this.TIPO_NODO_CONFIG[tipoNombre?.toUpperCase()] || this.TIPO_NODO_CONFIG['DEFAULT'];
    return `${config.icon} ${config.color}`;
  }

  getPesoSeverity(peso: number): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | undefined {
    // Logica simple visual, validación real es aparte
    return 'info';
  }

  onAddChild(rowNode: any): void {
    const nodo = rowNode.node.data.nodo as PlantillaEstructuraDTO;
    this.addNode.emit({ parentId: nodo.idPlantillaEstructura });
  }

  onEdit(rowNode: any): void {
    const nodo = rowNode.node.data.nodo as PlantillaEstructuraDTO;
    this.editNode.emit(nodo);
  }

  onDelete(rowNode: any): void {
    const nodo = rowNode.node.data.nodo as PlantillaEstructuraDTO;
    this.deleteNode.emit(nodo);
  }

  // Determine si se puede agregar hijos (logica de negocio)
  canAddChild(tipo: string): boolean {
    // Ejemplo: Examenes o Tareas finales podrian no tener hijos
    // Por ahora permitimos todo salvo que se especifique lo contrario
    return true; 
  }
}
