import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { SharedModalComponent } from '../../../../../../shared/shared-modal/shared-modal.component';
import { PeriodoLectivoDTO } from '../../../../../../data/models/Entities';
import { PeriodoLectivoService } from '../../../../../../core/services/settings/periodo-lectivo.service';


@Component({
  selector: 'app-periodo-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModalComponent],
  templateUrl: './periodo-dialog.component.html',
  styleUrls: ['./periodo-dialog.component.css']
})
export class PeriodoDialogComponent {
  private periodoService = inject(PeriodoLectivoService);
  private messageService = inject(MessageService);

  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<{ action: 'create' | 'update'; data: PeriodoLectivoDTO }>();

  editando = false;
  periodoEditando: PeriodoLectivoDTO | null = null;
  formDetalle = '';
  formFechaInicio = '';
  formFechaFin = '';
  guardando = false;

  openNew(): void {
    this.editando = false;
    this.periodoEditando = null;
    this.formDetalle = '';
    this.formFechaInicio = '';
    this.formFechaFin = '';
    this.visible = true;
    this.visibleChange.emit(this.visible);
  }

  openEdit(periodo: PeriodoLectivoDTO): void {
    this.editando = true;
    this.periodoEditando = periodo;
    this.formDetalle = periodo.detalle || '';
    this.formFechaInicio = periodo.fechaInicioEstimada ? this.formatDate(periodo.fechaInicioEstimada) : '';
    this.formFechaFin = periodo.fechaFinEstimada ? this.formatDate(periodo.fechaFinEstimada) : '';
    this.visible = true;
    this.visibleChange.emit(this.visible);
  }

  close(): void {
    this.visible = false;
    this.visibleChange.emit(this.visible);
  }

  guardar(): void {
    if (!this.formDetalle.trim() || !this.formFechaInicio || !this.formFechaFin) return;
    this.guardando = true;
    const data: PeriodoLectivoDTO = {
      detalle: this.formDetalle.trim().toUpperCase(),
      fechaInicioEstimada: this.formFechaInicio,
      fechaFinEstimada: this.formFechaFin
    };

    const obs = this.editando && this.periodoEditando?.idPeriodoLectivo
      ? this.periodoService.update({ ...data, idPeriodoLectivo: this.periodoEditando.idPeriodoLectivo })
      : this.periodoService.create(data);

    obs.subscribe({
      next: (res) => {
        this.guardando = false;
        const msg = this.editando ? 'actualizado' : 'creado';
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: `Periodo ${msg} correctamente` });
        this.close();
        if (this.editando && this.periodoEditando?.idPeriodoLectivo) {
          this.saved.emit({ action: 'update', data: { ...data, idPeriodoLectivo: this.periodoEditando.idPeriodoLectivo } });
        } else if (res) {
          const newId = typeof res === 'number' ? res : (res as any).idPeriodoLectivo || (res as any).data;
          const newPeriodo: PeriodoLectivoDTO = {
            ...data,
            idPeriodoLectivo: newId
          };
          this.saved.emit({ action: 'create', data: newPeriodo });
        }
      },
      error: () => {
        this.guardando = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el periodo' });
      }
    });
  }

  private formatDate(d: Date | string | undefined): string {
    if (!d) return '';
    const date = d instanceof Date ? d : new Date(d);
    return date.toISOString().split('T')[0];
  }
}
