import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PeriodoLectivoDTO, RegimenDTO, CicloDTO, TipoOfertaDTO } from '../../../../data/models/Entities';
import { PeriodoLectivoService } from '../../../../core/services/settings/periodo-lectivo.service';
import { RegimenService } from '../../../../core/services/settings/regimen.service';
import { CicloService } from '../../../../core/services/postulaciones/ciclo.service';
import { TipoOfertaService } from '../../../../core/services/infrastructure/tipo-oferta.service';
import { SharedTableComponent, SharedTableColTemplateDirective, TableColumn, PageEvent } from '../../../../shared/shared-table/shared-table.component';
import { SharedModalComponent } from '../../../../shared/shared-modal/shared-modal.component';
import { SharedDrawerComponent } from '../../../../shared/shared-drawer/shared-drawer.component';
import { CustomSelectComponent } from '../../../../shared/custom-select/custom-select.component';
import { MessageService } from 'primeng/api';
import { SharedToastComponent } from '../../../../shared/shared-toast/shared-toast.component';

@Component({
  selector: 'app-seasons',
  standalone: true,
  imports: [CommonModule,
    FormsModule,
    SharedTableComponent,
    SharedTableColTemplateDirective,
    SharedModalComponent,
    SharedDrawerComponent,
    CustomSelectComponent, SharedToastComponent],
  providers: [MessageService],
  templateUrl: './seasons.component.html',
  styleUrls: ['./seasons.component.css']
})
export class SeasonsComponent implements OnInit {
  @Output() backClicked = new EventEmitter<void>();

  // ── Periodos ──────────────────────────────────────────────
  periodos: PeriodoLectivoDTO[] = [];
  periodosLoading = false;
  periodosPage = 1;
  periodosRows = 10;
  periodosColumns: TableColumn[] = [
    { field: 'detalle', header: 'Periodo Lectivo' },
    { field: 'fechaInicioEstimada', header: 'Inicio', width: '140px', align: 'center' },
    { field: 'fechaFinEstimada', header: 'Fin', width: '140px', align: 'center' },
    { field: 'acciones', header: 'Acciones', width: '120px', align: 'center' }
  ];

  showPeriodoModal = false;
  periodoEditando: PeriodoLectivoDTO | null = null;
  periodoDetalle = '';
  periodoFechaInicio = '';
  periodoFechaFin = '';
  periodoGuardando = false;

  // ── Regimenes ─────────────────────────────────────────────
  regimenes: RegimenDTO[] = [];
  regimenesLoading = false;
  regimenesPage = 1;
  regimenesRows = 10;
  regimenesColumns: TableColumn[] = [
    { field: 'detalle', header: 'Regimen' },
    { field: 'acciones', header: 'Acciones', width: '120px', align: 'center' }
  ];

  showRegimenModal = false;
  regimenEditando: RegimenDTO | null = null;
  regimenDetalle = '';
  regimenGuardando = false;

  // ── Ciclos ────────────────────────────────────────────────
  ciclos: CicloDTO[] = [];
  ciclosLoading = false;
  ciclosPage = 1;
  ciclosRows = 10;
  ciclosColumns: TableColumn[] = [
    { field: 'detalle', header: 'Ciclo' },
    { field: 'nombrePeriodo', header: 'Periodo', width: '130px' },
    { field: 'nombreRegimen', header: 'Regimen', width: '130px' },
    { field: 'nombreTipoOferta', header: 'Tipo Oferta', width: '140px' },
    { field: 'esActivo', header: 'Estado', width: '100px', align: 'center' },
    { field: 'acciones', header: 'Acciones', width: '180px', align: 'center' }
  ];

  showCicloDrawer = false;
  cicloEditando: CicloDTO | null = null;
  cicloGuardando = false;

  // Ciclo form fields
  cicloIdPadre: number | null = null;
  cicloIdTipoOferta: number | null = null;
  cicloIdPeriodo: number | null = null;
  cicloIdRegimen: number | null = null;
  cicloDetalle = '';
  cicloFechaInicio = '';
  cicloFechaFin = '';

  // Catalogos para selects de ciclos
  periodosSelect: any[] = [];
  regimenesSelect: any[] = [];
  tiposOfertaSelect: any[] = [];
  ciclosPadreSelect: any[] = [];

  // Auto-generacion de detalle
  private detalleAuto = true;
  private lastGenerated = '';

  // ── Delete confirmation ───────────────────────────────────
  showConfirmDelete = false;
  deleteTitle = '';
  deleteMessage = '';
  private deleteAction: (() => void) | null = null;

  constructor(
    private periodoService: PeriodoLectivoService,
    private regimenService: RegimenService,
    private cicloService: CicloService,
    private tipoOfertaService: TipoOfertaService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadPeriodos();
    this.loadRegimenes();
    this.loadCiclos();
    this.loadTiposOferta();
  }

  onBackClick() {
    this.backClicked.emit();
  }

  // ═══════════════════════════════════════════════════════════
  //  PERIODOS
  // ═══════════════════════════════════════════════════════════

  loadPeriodos(): void {
    this.periodosLoading = true;
    this.periodoService.getAll().subscribe({
      next: (data) => { this.periodos = data; this.periodosLoading = false; this.periodosSelect = data.map(p => ({ label: p.detalle || '', value: p.idPeriodoLectivo })); },
      error: () => { this.periodosLoading = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar periodos lectivos' }); }
    });
  }

  get periodosPaginated(): PeriodoLectivoDTO[] {
    const start = (this.periodosPage - 1) * this.periodosRows;
    return this.periodos.slice(start, start + this.periodosRows);
  }

  onPeriodosPage(event: PageEvent): void {
    this.periodosPage = event.page;
  }

  openNuevoPeriodo(): void {
    this.periodoEditando = null;
    this.periodoDetalle = '';
    this.periodoFechaInicio = '';
    this.periodoFechaFin = '';
    this.showPeriodoModal = true;
  }

  openEditarPeriodo(p: PeriodoLectivoDTO): void {
    this.periodoEditando = p;
    this.periodoDetalle = p.detalle || '';
    this.periodoFechaInicio = p.fechaInicioEstimada || '';
    this.periodoFechaFin = p.fechaFinEstimada || '';
    this.showPeriodoModal = true;
  }

  guardarPeriodo(): void {
    if (!this.periodoDetalle.trim()) return;
    this.periodoGuardando = true;
    const dto: PeriodoLectivoDTO = {
      detalle: this.periodoDetalle.trim(),
      fechaInicioEstimada: this.periodoFechaInicio || undefined,
      fechaFinEstimada: this.periodoFechaFin || undefined
    };
    if (this.periodoEditando) {
      dto.idPeriodoLectivo = this.periodoEditando.idPeriodoLectivo;
      this.periodoService.update(dto).subscribe({
        next: () => { this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Periodo actualizado' }); this.periodoGuardando = false; this.showPeriodoModal = false; this.loadPeriodos(); },
        error: () => { this.periodoGuardando = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar periodo' }); }
      });
    } else {
      this.periodoService.create(dto).subscribe({
        next: () => { this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Periodo creado' }); this.periodoGuardando = false; this.showPeriodoModal = false; this.loadPeriodos(); },
        error: () => { this.periodoGuardando = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al crear periodo' }); }
      });
    }
  }

  confirmDeletePeriodo(p: PeriodoLectivoDTO): void {
    this.deleteTitle = 'Eliminar Periodo';
    this.deleteMessage = `¿Eliminar el periodo "${p.detalle}"?`;
    this.deleteAction = () => {
      this.periodoService.delete(p.idPeriodoLectivo!).subscribe({
        next: () => { this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Periodo eliminado' }); this.loadPeriodos(); this.showConfirmDelete = false; },
        error: () => { this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar periodo' }); this.showConfirmDelete = false; }
      });
    };
    this.showConfirmDelete = true;
  }

  // ═══════════════════════════════════════════════════════════
  //  REGIMENES
  // ═══════════════════════════════════════════════════════════

  loadRegimenes(): void {
    this.regimenesLoading = true;
    this.regimenService.getAll().subscribe({
      next: (data) => { this.regimenes = data; this.regimenesLoading = false; this.regimenesSelect = data.map(r => ({ label: r.detalle, value: r.idRegimen })); },
      error: () => { this.regimenesLoading = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar regimenes' }); }
    });
  }

  get regimenesPaginated(): RegimenDTO[] {
    const start = (this.regimenesPage - 1) * this.regimenesRows;
    return this.regimenes.slice(start, start + this.regimenesRows);
  }

  onRegimenesPage(event: PageEvent): void {
    this.regimenesPage = event.page;
  }

  openNuevoRegimen(): void {
    this.regimenEditando = null;
    this.regimenDetalle = '';
    this.showRegimenModal = true;
  }

  openEditarRegimen(r: RegimenDTO): void {
    this.regimenEditando = r;
    this.regimenDetalle = r.detalle || '';
    this.showRegimenModal = true;
  }

  guardarRegimen(): void {
    if (!this.regimenDetalle.trim()) return;
    this.regimenGuardando = true;
    const dto: RegimenDTO = { detalle: this.regimenDetalle.trim() };
    if (this.regimenEditando) {
      dto.idRegimen = this.regimenEditando.idRegimen;
      this.regimenService.update(dto).subscribe({
        next: () => { this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Regimen actualizado' }); this.regimenGuardando = false; this.showRegimenModal = false; this.loadRegimenes(); },
        error: () => { this.regimenGuardando = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar regimen' }); }
      });
    } else {
      this.regimenService.create(dto).subscribe({
        next: () => { this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Regimen creado' }); this.regimenGuardando = false; this.showRegimenModal = false; this.loadRegimenes(); },
        error: () => { this.regimenGuardando = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al crear regimen' }); }
      });
    }
  }

  confirmDeleteRegimen(r: RegimenDTO): void {
    this.deleteTitle = 'Eliminar Regimen';
    this.deleteMessage = `¿Eliminar el regimen "${r.detalle}"?`;
    this.deleteAction = () => {
      this.regimenService.delete(r.idRegimen!).subscribe({
        next: () => { this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Regimen eliminado' }); this.loadRegimenes(); this.showConfirmDelete = false; },
        error: () => { this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar regimen' }); this.showConfirmDelete = false; }
      });
    };
    this.showConfirmDelete = true;
  }

  // ═══════════════════════════════════════════════════════════
  //  CICLOS
  // ═══════════════════════════════════════════════════════════

  loadCiclos(): void {
    this.ciclosLoading = true;
    this.cicloService.getAll().subscribe({
      next: (data) => { this.ciclos = data || []; this.ciclosLoading = false; },
      error: () => { this.ciclosLoading = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar ciclos' }); }
    });
  }

  loadTiposOferta(): void {
    this.tipoOfertaService.getAll().subscribe({
      next: (data) => { this.tiposOfertaSelect = (data || []).map(t => ({ label: t.detalle || '', value: t.idtipoOferta })); },
      error: () => { this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar tipos de oferta' }); }
    });
  }

  get ciclosPaginated(): CicloDTO[] {
    const start = (this.ciclosPage - 1) * this.ciclosRows;
    return this.ciclos.slice(start, start + this.ciclosRows);
  }

  onCiclosPage(event: PageEvent): void {
    this.ciclosPage = event.page;
  }

  getPeriodoDetalle(id: number | undefined): string {
    const p = this.periodos.find(x => x.idPeriodoLectivo === id);
    return p ? p.detalle || '' : '';
  }

  getRegimenDetalle(id: number | undefined): string {
    const r = this.regimenes.find(x => x.idRegimen === id);
    return r ? r.detalle || '' : '';
  }

  getTipoOfertaDetalle(id: number | undefined): string {
    const t = this.tiposOfertaSelect.find(x => x.value === id);
    return t ? t.label : '';
  }

  private generateDetalle(): string {
    const ofertaId = this.cicloIdTipoOferta;
    const regimenId = this.cicloIdRegimen;
    const padreId = this.cicloIdPadre;
    const regimenName = regimenId ? this.getRegimenDetalle(regimenId) : '';
    if (!ofertaId) return '';
    const ofertaObj = this.tiposOfertaSelect.find(t => t.value === Number(ofertaId));
    const ofertaDetalle = (ofertaObj?.label || '').toUpperCase();
    if (ofertaDetalle.includes('FORMAL')) {
      return ['CICLO', regimenName, 'FORMAL VIRTUAL'].filter(s => s).join(' ');
    }
    if (ofertaDetalle.includes('ACELERADO')) {
      const prefix = padreId ? 'CICLO II' : 'CICLO I';
      return [prefix, regimenName, 'ACELERADO'].filter(s => s).join(' ');
    }
    return ofertaObj?.label || '';
  }

  private updateDetalleIfAllowed(): void {
    const generated = this.generateDetalle();
    if (this.detalleAuto || !this.cicloDetalle || this.cicloDetalle === this.lastGenerated) {
      this.lastGenerated = generated;
      this.cicloDetalle = generated;
    }
  }

  onCicloTipoOfertaChange(val: any): void { this.cicloIdTipoOferta = val; this.updateDetalleIfAllowed(); }
  onCicloRegimenChange(val: any): void { this.cicloIdRegimen = val; this.updateDetalleIfAllowed(); }
  onCicloPadreChange(val: any): void { this.cicloIdPadre = val; this.updateDetalleIfAllowed(); }

  onCicloDetalleInput(): void {
    this.detalleAuto = false;
  }

  openNuevoCiclo(): void {
    this.cicloEditando = null;
    this.cicloIdPadre = null;
    this.cicloIdTipoOferta = null;
    this.cicloIdPeriodo = null;
    this.cicloIdRegimen = null;
    this.cicloDetalle = '';
    this.cicloFechaInicio = '';
    this.cicloFechaFin = '';
    this.detalleAuto = true;
    this.lastGenerated = '';
    this.ciclosPadreSelect = (this.ciclos || []).map(c => ({ label: c.detalle || '', value: c.idCiclo }));
    this.showCicloDrawer = true;
  }

  openEditarCiclo(c: CicloDTO): void {
    this.cicloEditando = c;
    this.cicloIdPadre = c.idPadre ?? null;
    this.cicloIdTipoOferta = c.idTipoOferta ?? null;
    this.cicloIdPeriodo = c.idPeriodo ?? null;
    this.cicloIdRegimen = c.idRegimen ?? null;
    this.cicloDetalle = c.detalle || '';
    this.cicloFechaInicio = c.fechaInicioEstimada ? (typeof c.fechaInicioEstimada === 'string' ? c.fechaInicioEstimada : c.fechaInicioEstimada.toISOString().split('T')[0]) : '';
    this.cicloFechaFin = c.fechaFinEstimada ? (typeof c.fechaFinEstimada === 'string' ? c.fechaFinEstimada : c.fechaFinEstimada.toISOString().split('T')[0]) : '';
    this.detalleAuto = false;
    this.lastGenerated = c.detalle || '';
    this.ciclosPadreSelect = (this.ciclos || []).filter(x => x.idCiclo !== c.idCiclo).map(x => ({ label: x.detalle || '', value: x.idCiclo }));
    this.showCicloDrawer = true;
  }

  guardarCiclo(): void {
    if (!this.cicloDetalle.trim() || !this.cicloIdPeriodo || !this.cicloIdRegimen || !this.cicloIdTipoOferta) return;
    this.cicloGuardando = true;
    const dto: CicloDTO = {
      detalle: this.cicloDetalle.trim(),
      idPeriodo: this.cicloIdPeriodo,
      idRegimen: this.cicloIdRegimen,
      idTipoOferta: this.cicloIdTipoOferta,
      idPadre: this.cicloIdPadre,
      fechaInicioEstimada: this.cicloFechaInicio ? new Date(this.cicloFechaInicio) : undefined,
      fechaFinEstimada: this.cicloFechaFin ? new Date(this.cicloFechaFin) : undefined
    };
    if (this.cicloEditando) {
      dto.idCiclo = this.cicloEditando.idCiclo;
      this.cicloService.update(dto).subscribe({
        next: () => { this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Ciclo actualizado' }); this.cicloGuardando = false; this.showCicloDrawer = false; this.loadCiclos(); },
        error: () => { this.cicloGuardando = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar ciclo' }); }
      });
    } else {
      this.cicloService.create(dto).subscribe({
        next: () => { this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Ciclo creado' }); this.cicloGuardando = false; this.showCicloDrawer = false; this.loadCiclos(); },
        error: () => { this.cicloGuardando = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al crear ciclo' }); }
      });
    }
  }

  desactivarCiclo(c: CicloDTO): void {
    this.cicloService.deactivate(c.idCiclo!).subscribe({
      next: () => { this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Ciclo desactivado' }); this.loadCiclos(); },
      error: () => { this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al desactivar ciclo' }); }
    });
  }

  reactivarCiclo(c: CicloDTO): void {
    this.cicloService.reactivate(c).subscribe({
      next: () => { this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Ciclo reactivado' }); this.loadCiclos(); },
      error: () => { this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al reactivar ciclo' }); }
    });
  }

  confirmDeleteCiclo(c: CicloDTO): void {
    this.deleteTitle = 'Eliminar Ciclo';
    this.deleteMessage = `¿Eliminar el ciclo "${c.detalle}"?`;
    this.deleteAction = () => {
      this.cicloService.delete(c.idCiclo!).subscribe({
        next: () => { this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Ciclo eliminado' }); this.loadCiclos(); this.showConfirmDelete = false; },
        error: () => { this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar ciclo' }); this.showConfirmDelete = false; }
      });
    };
    this.showConfirmDelete = true;
  }

  // ═══════════════════════════════════════════════════════════
  //  DELETE CONFIRMATION
  // ═══════════════════════════════════════════════════════════

  executeDelete(): void {
    if (this.deleteAction) this.deleteAction();
  }

  cancelDelete(): void {
    this.showConfirmDelete = false;
    this.deleteAction = null;
  }
}
