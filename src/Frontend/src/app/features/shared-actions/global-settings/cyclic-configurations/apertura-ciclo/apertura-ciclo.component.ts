import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DividerModule } from 'primeng/divider';
import { MessageService } from 'primeng/api';
import { CicloDTO } from '../../../../../data/models/Entities';
import { CicloService } from '../../../../../core/services/postulaciones/ciclo.service';
import { AperturaCicloService } from '../../../../../core/services/infrastructure/apertura-ciclo.service';
import { ApiResponse, ClonarMallaItem, ClonarMallasResult } from '../../../../../data/models/rematricula.model';
import { SharedToastComponent } from '../../../../../shared/shared-toast/shared-toast.component';

@Component({
  selector: 'app-apertura-ciclo',
  standalone: true,
  imports: [CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    TableModule,
    TagModule,
    SelectModule,
    ProgressSpinnerModule,
    DividerModule, SharedToastComponent],
  providers: [MessageService],
  templateUrl: './apertura-ciclo.component.html',
  styleUrls: ['./apertura-ciclo.component.css']
})
export class AperturaCicloComponent implements OnInit {
  todosCiclos: CicloDTO[] = [];
  ciclosActivos: CicloDTO[] = [];
  idCicloOrigen: number | null = null;
  idCicloDestino: number | null = null;
  clonarParalelos = true;
  loading = false;
  result: ClonarMallasResult | null = null;

  constructor(
    private cicloService: CicloService,
    private aperturaCicloService: AperturaCicloService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.cicloService.getAll().subscribe({
      next: (ciclos: CicloDTO[]) => this.todosCiclos = ciclos,
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los ciclos.' })
    });
    this.cicloService.getActivos().subscribe({
      next: (ciclos: CicloDTO[]) => this.ciclosActivos = ciclos,
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los ciclos activos.' })
    });
  }

  ejecutarClonado(): void {
    this.result = null;

    if (!this.idCicloOrigen || !this.idCicloDestino) {
      this.messageService.add({ severity: 'warn', summary: 'Datos incompletos', detail: 'Debe seleccionar el ciclo origen y el ciclo destino.' });
      return;
    }

    if (this.idCicloOrigen === this.idCicloDestino) {
      this.messageService.add({ severity: 'warn', summary: 'Selección inválida', detail: 'El ciclo origen y el destino no pueden ser el mismo.' });
      return;
    }

    this.loading = true;
    this.aperturaCicloService.clonarMallas({
      idCicloOrigen: this.idCicloOrigen,
      idCicloDestino: this.idCicloDestino,
      clonarParalelos: this.clonarParalelos
    }).subscribe({
      next: (res: ApiResponse<ClonarMallasResult>) => {
        this.loading = false;
        if (res.isSuccess && res.data) {
          this.result = res.data;
          this.messageService.add({
            severity: 'success',
            summary: 'Clonación exitosa',
            detail: `${res.data.totalMallasClonadas} malla(s) clonadas al ciclo destino.`
          });
        } else {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: res.message || 'No fue posible clonar las mallas.' });
        }
      },
      error: (err: any) => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Error al clonar mallas para apertura de ciclo.' });
      }
    });
  }

  nueva(): void {
    this.idCicloOrigen = null;
    this.idCicloDestino = null;
    this.clonarParalelos = true;
    this.result = null;
  }

  getNombreCiclo(id: number | null): string {
    if (!id) return '—';
    return this.todosCiclos.find(c => c.idCiclo === id)?.detalle ?? `Ciclo #${id}`;
  }

  getMallasTotal(malla: ClonarMallaItem): number {
    return malla.totalDetalles + malla.totalRequisitos + malla.totalEspecies;
  }
}
