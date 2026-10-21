import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { SharedModalComponent } from '../../../../../../shared/shared-modal/shared-modal.component';
import { CustomSelectComponent } from '../../../../../../shared/custom-select/custom-select.component';
import { CicloDTO, RegimenDTO, TipoOfertaDTO, PeriodoLectivoDTO } from '../../../../../../data/models/Entities';
import { CicloService } from '../../../../../../core/services/infrastructure/ciclo.service';

@Component({
  selector: 'app-ciclo-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModalComponent, CustomSelectComponent],
  templateUrl: './ciclo-dialog.component.html',
  styleUrls: ['./ciclo-dialog.component.css']
})
export class CicloDialogComponent {
  private cicloService = inject(CicloService);
  private messageService = inject(MessageService);

  @Input() visible = false;
  @Input() selectedPeriodoId: number | null = null;
  @Input() selectedTipoOfertaId: number | null = null;
  @Input() regimenes: RegimenDTO[] = [];
  @Input() tiposOferta: TipoOfertaDTO[] = [];
  @Input() periodos: PeriodoLectivoDTO[] = [];
  @Input() ciclosDelPeriodo: CicloDTO[] = [];

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<{ action: 'create' | 'update'; data: CicloDTO }>();

  editando = false;
  cicloEditando: CicloDTO | null = null;
  formIdRegimen: number | null = null;
  formIdTipoOferta: number | null = null;
  formDetalle = '';
  formFechaInicio = '';
  formFechaFin = '';
  detalleManual = false;
  fechasAutoAsignadas = false;
  guardando = false;

  openNew(): void {
    this.editando = false;
    this.cicloEditando = null;
    this.formIdRegimen = null;
    this.formIdTipoOferta = this.selectedTipoOfertaId;
    this.formDetalle = '';
    this.formFechaInicio = '';
    this.formFechaFin = '';
    this.detalleManual = false;
    this.fechasAutoAsignadas = false;
    this.visible = true;
    this.visibleChange.emit(this.visible);
    this.cicloAutoDetalle();
  }

  openEdit(ciclo: CicloDTO): void {
    this.editando = true;
    this.cicloEditando = ciclo;
    this.formIdRegimen = ciclo.idRegimen ?? null;
    this.formIdTipoOferta = ciclo.idTipoOferta ?? null;
    this.formDetalle = ciclo.detalle || '';
    this.formFechaInicio = ciclo.fechaInicioEstimada ? this.formatDate(ciclo.fechaInicioEstimada) : '';
    this.formFechaFin = ciclo.fechaFinEstimada ? this.formatDate(ciclo.fechaFinEstimada) : '';
    this.detalleManual = true;
    this.visible = true;
    this.visibleChange.emit(this.visible);
  }

  close(): void {
    this.visible = false;
    this.visibleChange.emit(this.visible);
  }

  cicloAutoDetalle(): void {
    if (this.detalleManual) return;
    const regimenId = this.formIdRegimen;
    const ofertaId = this.formIdTipoOferta;
    if (!regimenId || !ofertaId) return;

    const regimen = this.regimenes.find(r => r.idRegimen === +regimenId);
    const oferta = this.tiposOferta.find(t => t.idtipoOferta === +ofertaId);
    const ofertaDet = oferta?.detalle?.toUpperCase() || '';
    const regimenDet = regimen?.detalle || '';

    const isFormal = ofertaDet.includes('FORMAL');
    const isAcelerado = ofertaDet.includes('ACELERADO');

    if (isFormal) {
      this.formDetalle = ['CICLO', regimenDet, 'FORMAL VIRTUAL'].filter(s => s).join(' ');
    } else if (isAcelerado) {
      const esCicloII = this.ciclosDelPeriodo.some(c => c.detalle?.includes('CICLO I'));
      this.formDetalle = `${esCicloII ? 'CICLO II' : 'CICLO I'} ${regimenDet} ACELERADO`.trim();
    } else {
      this.formDetalle = oferta?.detalle || '';
    }

    this.cicloAutoFechas();
  }

  private cicloAutoFechas(): void {
    if (this.editando || this.fechasAutoAsignadas) return;
    if (!this.formIdRegimen || !this.formIdTipoOferta || !this.selectedPeriodoId) return;

    const periodo = this.periodos.find(p => p.idPeriodoLectivo === this.selectedPeriodoId);
    if (!periodo?.fechaInicioEstimada) return;

    const fechaBase = new Date(periodo.fechaInicioEstimada);
    const fechaInicio = new Date(fechaBase);
    fechaInicio.setMonth(fechaInicio.getMonth() + 1);
    this.formFechaInicio = this.formatDate(fechaInicio);

    const oferta = this.tiposOferta.find(t => t.idtipoOferta === +this.formIdTipoOferta!);
    const ofertaDet = oferta?.detalle?.toLowerCase() || '';
    const meses = ofertaDet.includes('acelerado') ? 6 : 10;

    const fechaFin = new Date(fechaInicio);
    fechaFin.setMonth(fechaFin.getMonth() + meses);
    this.formFechaFin = this.formatDate(fechaFin);

    this.fechasAutoAsignadas = true;
  }

  guardar(): void {
    if (!this.formDetalle.trim() || !this.formIdRegimen || !this.formIdTipoOferta || !this.selectedPeriodoId) return;
    this.guardando = true;

    const data: CicloDTO = {
      idCiclo: this.cicloEditando?.idCiclo,
      idPeriodo: this.selectedPeriodoId,
      idRegimen: this.formIdRegimen,
      idTipoOferta: this.formIdTipoOferta,
      detalle: this.formDetalle.trim().toUpperCase(),
      fechaInicioEstimada: this.formFechaInicio || undefined as any,
      fechaFinEstimada: this.formFechaFin || undefined as any,
      esActivo: true
    };

    const obs = this.editando
      ? this.cicloService.update(data)
      : this.cicloService.create(data);

    obs.subscribe({
      next: (res) => {
        this.guardando = false;
        const msg = this.editando ? 'actualizado' : 'creado';
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: `Ciclo ${msg} correctamente` });
        this.close();
        if (this.editando && this.cicloEditando?.idCiclo) {
          this.saved.emit({ action: 'update', data: { ...data, idCiclo: this.cicloEditando.idCiclo } });
        } else if (res) {
          const newId = typeof res === 'number' ? res : (res as any).idCiclo || (res as any).data;
          const newCiclo: CicloDTO = {
            ...data,
            idCiclo: newId
          };
          this.saved.emit({ action: 'create', data: newCiclo });
        }
      },
      error: () => {
        this.guardando = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el ciclo' });
      }
    });
  }

  private formatDate(d: Date | string | undefined): string {
    if (!d) return '';
    const date = d instanceof Date ? d : new Date(d);
    return date.toISOString().split('T')[0];
  }
}
