import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { DistributivoDTO } from '../../../../../data/models/distributivo/distributivo.model';

@Component({
  selector: 'app-tabla-distributivo',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, TooltipModule, TagModule, ProgressBarModule],
  templateUrl: './tabla-distributivo.component.html',
  styles: [`
    .tabla-card {
      background-color: var(--surface-card);
      border-radius: 12px;
      padding: 0.75rem;
      border: 1px solid var(--surface-border);
      overflow: hidden;
    }

    .materia-info {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .materia-nombre {
      font-weight: 600;
      color: var(--text-color);
      font-size: 0.85rem;
    }

    .materia-horas {
      font-size: 0.75rem;
      color: var(--text-color-secondary);
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .docente-info {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .docente-nombre {
      font-weight: 500;
      color: var(--text-color);
      font-size: 0.85rem;
    }

    .sin-asignar {
      color: #dc3545;
      font-style: italic;
      font-size: 0.8rem;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .actions-cell {
      display: flex;
      justify-content: center;
      gap: 0.25rem;
    }

    :host ::ng-deep .p-datatable {
      font-size: 0.85rem;
    }

    :host ::ng-deep .p-datatable .p-datatable-thead > tr > th {
      background-color: var(--surface-ground);
      color: var(--text-color);
      font-weight: 600;
      padding: 0.6rem 0.75rem;
      font-size: 0.8rem;
    }

    :host ::ng-deep .p-datatable .p-datatable-tbody > tr > td {
      padding: 0.5rem 0.75rem;
    }

    :host ::ng-deep .p-datatable .p-datatable-tbody > tr:hover {
      background-color: var(--surface-hover);
    }

    :host ::ng-deep .p-paginator {
      background: transparent;
      border: none;
      padding: 0.5rem 0 0 0;
      font-size: 0.8rem;
    }

    .empty-message {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem;
      color: var(--text-color-secondary);
    }

    .empty-message i {
      font-size: 2rem;
      margin-bottom: 0.5rem;
      color: var(--surface-400);
    }

    .empty-message p {
      font-size: 0.9rem;
      margin: 0;
    }

    @media (max-width: 768px) {
      .tabla-card {
        padding: 0.5rem;
      }
    }
  `]
})
export class TablaDistributivoComponent {
  @Input() distributivos: DistributivoDTO[] = [];
  @Output() editar = new EventEmitter<DistributivoDTO>();
  @Output() eliminar = new EventEmitter<number>();
  @Output() verCarga = new EventEmitter<number>();

  onEditar(item: DistributivoDTO): void {
    this.editar.emit(item);
  }

  onEliminar(id: number): void {
    this.eliminar.emit(id);
  }

  onVerCarga(idPersona: number): void {
    this.verCarga.emit(idPersona);
  }
}
