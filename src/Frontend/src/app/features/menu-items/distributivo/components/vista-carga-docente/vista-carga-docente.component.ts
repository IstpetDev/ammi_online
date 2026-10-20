import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { CargaDocenteDTO } from '../../../../../data/models/distributivo/distributivo.model';

@Component({
  selector: 'app-vista-carga-docente',
  standalone: true,
  imports: [CommonModule, ButtonModule, TooltipModule],
  templateUrl: './vista-carga-docente.component.html',
  styles: [`
    .carga-container {
      padding: 0;
      max-width: 100%;
      overflow-x: hidden;
    }

    /* Docente Card - Compact */
    .docente-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: linear-gradient(135deg, var(--brand-black) 0%, var(--brand-gray) 100%);
      border-radius: 12px;
      padding: 1rem 1.25rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }

    .docente-avatar {
      width: 48px;
      height: 48px;
      background: var(--brand-yellow);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .docente-avatar i {
      font-size: 1.5rem;
      color: var(--brand-black);
    }

    .docente-details {
      flex: 1;
      min-width: 150px;
    }

    .docente-name {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 700;
      color: white;
      line-height: 1.2;
    }

    .docente-doc {
      font-size: 0.8rem;
      color: rgba(255,255,255,0.75);
      display: flex;
      align-items: center;
      gap: 0.35rem;
      margin-top: 0.25rem;
    }

    .docente-stats {
      display: flex;
      gap: 0.75rem;
    }

    .mini-stat {
      text-align: center;
      padding: 0.5rem 0.75rem;
      background: rgba(255,255,255,0.1);
      border-radius: 8px;
      min-width: 55px;
    }

    .mini-stat.highlight {
      background: var(--brand-yellow);
    }

    .mini-stat.highlight .mini-stat-value,
    .mini-stat.highlight .mini-stat-label {
      color: var(--brand-black);
    }

    .mini-stat-value {
      font-size: 1.1rem;
      font-weight: 800;
      color: white;
      display: block;
    }

    .mini-stat-label {
      font-size: 0.65rem;
      color: rgba(255,255,255,0.75);
      text-transform: uppercase;
    }

    .docente-actions {
      display: flex;
      gap: 0.25rem;
    }

    :host ::ng-deep .docente-actions .p-button {
      color: white !important;
    }

    /* Malla Compact */
    .malla-compact {
      background: var(--surface-card);
      border-radius: 10px;
      margin-bottom: 0.75rem;
      border: 1px solid var(--surface-border);
      overflow: hidden;
    }

    .malla-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: var(--surface-ground);
      font-weight: 600;
      font-size: 0.9rem;
      color: var(--text-color);
      border-bottom: 1px solid var(--surface-border);
    }

    .malla-title i {
      color: var(--brand-yellow-dark);
      font-size: 1rem;
    }

    .materias-list {
      padding: 0.5rem;
    }

    /* Materia Row - Compact */
    .materia-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.5rem 0.75rem;
      border-radius: 6px;
      background: var(--surface-ground);
      margin-bottom: 0.35rem;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .materia-row:last-child {
      margin-bottom: 0;
    }

    .materia-info-compact {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex: 1;
      min-width: 200px;
    }

    .materia-info-compact i {
      color: var(--brand-yellow-dark);
      font-size: 0.9rem;
    }

    .materia-text {
      font-weight: 500;
      font-size: 0.85rem;
      color: var(--text-color);
    }

    .materia-hours {
      font-size: 0.75rem;
      font-weight: 700;
      color: white;
      background: var(--brand-yellow-dark);
      padding: 0.15rem 0.5rem;
      border-radius: 10px;
      margin-left: auto;
    }

    .paralelos-inline {
      display: flex;
      gap: 0.35rem;
      flex-wrap: wrap;
    }

    .paralelo-tag {
      font-size: 0.7rem;
      font-weight: 500;
      padding: 0.2rem 0.5rem;
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: 4px;
      color: var(--text-color-secondary);
    }

    .empty-state {
      text-align: center;
      padding: 2rem;
      color: var(--text-color-secondary);
    }

    .empty-state i {
      font-size: 2rem;
      opacity: 0.5;
      margin-bottom: 0.5rem;
      display: block;
    }

    @media print {
      .docente-actions {
        display: none !important;
      }
      
      .docente-card {
        background: #333 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }

    @media (max-width: 768px) {
      .docente-card {
        padding: 0.75rem;
        gap: 0.75rem;
      }

      .docente-avatar {
        width: 40px;
        height: 40px;
      }

      .docente-name {
        font-size: 0.95rem;
      }

      .docente-stats {
        order: 4;
        width: 100%;
        justify-content: center;
      }

      .materia-info-compact {
        min-width: 100%;
      }

      .paralelos-inline {
        width: 100%;
        margin-top: 0.25rem;
      }
    }
  `]
})
export class VistaCargaDocenteComponent {
  @Input() carga: CargaDocenteDTO | null = null;
  @Output() volver = new EventEmitter<void>();

  onVolver(): void {
    this.volver.emit();
  }

  print(): void {
    window.print();
  }
}
