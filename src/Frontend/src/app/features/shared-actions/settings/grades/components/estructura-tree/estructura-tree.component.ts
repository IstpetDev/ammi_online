import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TreeNode } from 'primeng/api';
import { PlantillaEstructuraDTO, TipoPlantillaEstructuraDTO } from '../../../../../../data/models/notas';

// PrimeNG Imports
import { TreeTableModule } from 'primeng/treetable';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';

export interface BatchNodeItem {
  nodoNombre: string;
  peso: number;
  idTipoPlantillaEstructura: number;
  orden: number;
}

export interface DraftNodeItem {
  id: string;
  nombre: string;
  peso: number;
  idTipoPlantillaEstructura: number;
}

@Component({
  selector: 'app-estructura-tree',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TreeTableModule,
    ButtonModule,
    TagModule,
    TooltipModule,
    CheckboxModule,
    InputTextModule,
    InputNumberModule
  ],
  templateUrl: './estructura-tree.component.html',
  styleUrls: ['./estructura-tree.component.css']
})
export class EstructuraTreeComponent implements OnChanges {
  @Input() estructura: PlantillaEstructuraDTO[] = [];
  @Input() tiposEstructura: TipoPlantillaEstructuraDTO[] = [];
  @Input() loading: boolean = false;

  @Output() addNode = new EventEmitter<{ parentId: number | null }>();
  @Output() addBatchNodes = new EventEmitter<{ parentId: number | null; nodes: BatchNodeItem[] }>();
  @Output() editNode = new EventEmitter<PlantillaEstructuraDTO>();
  @Output() deleteNode = new EventEmitter<PlantillaEstructuraDTO>();

  treeNodes: TreeNode[] = [];
  cols: any[] = [];

  // Estado de formulario Inline Multi-Fila
  activeInlineParentId: number | null | undefined = undefined;
  draftRows: DraftNodeItem[] = [];

  // Iconos SVG para tipos de nodo (material-style, sin color)
  private readonly TIPO_NODO_ICON: Record<string, string> = {
    'QUIMESTRE': 'book',
    'PARCIAL': 'description',
    'EXAMEN': 'fact_check',
    'TAREA': 'edit_note',
    'LECCION': 'format_list_bulleted',
    'PROYECTO': 'work',
    'ACTIVIDAD': 'settings',
    'DEFAULT': 'circle'
  };

  // SVG markup inline (monocromatico, sin color)
  private readonly SVG_ICONS: Record<string, string> = {
    'book': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="tree-icon"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
    'description': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="tree-icon"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
    'fact_check': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="tree-icon"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
    'edit_note': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="tree-icon"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
    'format_list_bulleted': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="tree-icon"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
    'work': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="tree-icon"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
    'settings': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="tree-icon"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    'circle': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="tree-icon"><circle cx="12" cy="12" r="6"/></svg>'
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
      expanded: false
    };
  }

  private getTipoNombre(idTipo: number): string {
    const tipo = this.tiposEstructura.find(t => t.idTipoPlantillaEstrucutra === idTipo);
    return tipo ? tipo.detalle : 'Desconocido';
  }

  getIconSvg(tipoNombre: string): string {
    const iconKey = this.TIPO_NODO_ICON[tipoNombre?.toUpperCase()] || 'circle';
    return this.SVG_ICONS[iconKey] || this.SVG_ICONS['circle'];
  }

  getPesoSeverity(peso: number): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | undefined {
    return 'info';
  }

  // --- Expandir / Contraer todos los niveles ---
  expandAll(): void {
    this.treeNodes.forEach(node => this.expandRecursive(node, true));
    this.treeNodes = [...this.treeNodes];
  }

  collapseAll(): void {
    this.treeNodes.forEach(node => this.expandRecursive(node, false));
    this.treeNodes = [...this.treeNodes];
  }

  private expandRecursive(node: TreeNode, expanded: boolean): void {
    node.expanded = expanded;
    if (node.children) {
      node.children.forEach(child => this.expandRecursive(child, expanded));
    }
  }

  onNodeToggle(): void {
    this.treeNodes = [...this.treeNodes];
  }

  // --- Manejo de Acordeón ---
  onRowClick(event: MouseEvent, rowNode: any): void {
    const target = event.target as HTMLElement;
    if (target.closest('.p-treetable-toggler') || target.closest('button') || target.closest('input') || target.closest('.no-row-click')) {
      return;
    }
    if (rowNode && rowNode.node && rowNode.node.children && rowNode.node.children.length > 0) {
      rowNode.node.expanded = !rowNode.node.expanded;
      this.treeNodes = [...this.treeNodes];
    }
  }

  // --- Formulario Inline Multi-Fila para agregar subnivel(es) ---
  onAddChildInline(rowNode: any, event: MouseEvent): void {
    event.stopPropagation();
    if (rowNode && rowNode.node) {
      rowNode.node.expanded = true;
      this.treeNodes = [...this.treeNodes];
      const nodo = rowNode.node.data.nodo as PlantillaEstructuraDTO;
      
      if (this.activeInlineParentId === nodo.idPlantillaEstructura) {
        // Al hacer clic de nuevo en 'Nuevo' (+), agrega otra fila a la lista
        this.addDraftRow();
      } else {
        // Abrir para este padre con la primera fila
        this.openInlineAdd(nodo.idPlantillaEstructura);
      }
    }
  }

  openInlineAdd(parentId: number | null): void {
    if (this.activeInlineParentId === parentId && this.draftRows.length > 0) {
      this.addDraftRow();
      return;
    }
    this.activeInlineParentId = parentId;
    this.draftRows = [];
    this.addDraftRow();
  }

  addDraftRow(): void {
    const count = this.draftRows.length + 1;
    const defaultTipoId = (this.tiposEstructura && this.tiposEstructura.length > 0)
      ? this.tiposEstructura[0].idTipoPlantillaEstrucutra
      : 1;

    this.draftRows.push({
      id: 'draft_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      nombre: `Tarea ${count}`,
      peso: 0,
      idTipoPlantillaEstructura: defaultTipoId
    });
  }

  removeDraftRow(index: number): void {
    if (index >= 0 && index < this.draftRows.length) {
      this.draftRows.splice(index, 1);
    }
    if (this.draftRows.length === 0) {
      this.cancelInlineAdd();
    }
  }

  cancelInlineAdd(): void {
    this.activeInlineParentId = undefined;
    this.draftRows = [];
  }

  saveInlineAdd(parentId: number | null): void {
    const validRows = this.draftRows.filter(r => r.nombre && r.nombre.trim().length > 0);
    if (validRows.length === 0) return;

    const nodesToCreate: BatchNodeItem[] = validRows.map((r, idx) => ({
      nodoNombre: r.nombre.trim(),
      peso: Number(r.peso) || 0,
      idTipoPlantillaEstructura: r.idTipoPlantillaEstructura,
      orden: idx + 1
    }));

    this.addBatchNodes.emit({
      parentId: parentId,
      nodes: nodesToCreate
    });

    this.cancelInlineAdd();
  }

  onEdit(rowNode: any): void {
    const nodo = rowNode.node.data.nodo as PlantillaEstructuraDTO;
    this.editNode.emit(nodo);
  }

  onDelete(rowNode: any): void {
    const nodo = rowNode.node.data.nodo as PlantillaEstructuraDTO;
    this.deleteNode.emit(nodo);
  }

  canAddChild(tipo: string): boolean {
    return true; 
  }
}

