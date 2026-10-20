import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { MallaDTO, CicloDTO, ParaleloDTO } from '../../../../../data/models/Entities';

@Component({
  selector: 'app-filtros-distributivo',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectModule, InputTextModule, ButtonModule],
  templateUrl: './filtros-distributivo.component.html',
  styles: [`
    .filtros-card {
      background-color: var(--surface-card);
      border-radius: 12px;
      padding: 1.25rem;
      margin-bottom: 1.5rem;
      border: 1px solid var(--surface-border);
    }

    .filtros-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      align-items: end;
    }

    .filtro-item {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .filtro-label {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-color);
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }

    .filtro-label i {
      color: var(--brand-yellow-dark);
      font-size: 0.9rem;
    }

    .search-wrapper {
      position: relative;
    }

    .search-wrapper i {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-color-secondary);
    }

    .search-wrapper input {
      padding-left: 38px !important;
      width: 100%;
    }

    .filtros-actions {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      justify-content: flex-end;
    }

    :host ::ng-deep .p-select {
      width: 100%;
    }

    :host ::ng-deep .p-inputtext {
      width: 100%;
    }

    @media (max-width: 768px) {
      .filtros-grid {
        grid-template-columns: 1fr;
      }
      
      .filtros-actions {
        justify-content: stretch;
      }
      
      .filtros-actions .p-button {
        flex: 1;
      }
    }
  `]
})
export class FiltrosDistributivoComponent implements OnChanges {
  @Input() mallas: MallaDTO[] = [];
  @Input() ciclos: CicloDTO[] = [];
  @Input() paralelos: ParaleloDTO[] = [];
  
  @Output() filtrosChange = new EventEmitter<any>();

  filtros = {
    idCiclo: null as number | null,
    idMalla: null as number | null,
    idParalelo: null as number | null,
    busqueda: ''
  };

  // Opciones para dropdowns
  ciclosOptions: any[] = [];
  mallasOptions: any[] = [];
  paralelosOptions: any[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['ciclos']) {
      this.ciclosOptions = this.ciclos.map(c => ({ label: c.detalle, value: c.idCiclo }));
    }
    if (changes['mallas']) {
      this.mallasOptions = this.mallas.map(m => ({ label: m.detalle, value: m.idMalla }));
    }
    if (changes['paralelos']) {
      this.paralelosOptions = this.paralelos.map(p => ({ label: p.nombreParalelo, value: p.idParalelo }));
    }
  }

  onFiltroChange(): void {
    this.filtrosChange.emit(this.filtros);
  }

  limpiarFiltros(): void {
    this.filtros = {
      idCiclo: null,
      idMalla: null,
      idParalelo: null,
      busqueda: ''
    };
    this.onFiltroChange();
  }

  get tieneFiltrosActivos(): boolean {
    return !!(this.filtros.idCiclo || this.filtros.idMalla || this.filtros.idParalelo || this.filtros.busqueda);
  }
}
