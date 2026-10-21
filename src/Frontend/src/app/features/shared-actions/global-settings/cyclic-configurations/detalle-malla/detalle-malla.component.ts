import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { ChipModule } from 'primeng/chip';
import { DividerModule } from 'primeng/divider';
import { InputTextModule } from 'primeng/inputtext';
import { PickListModule } from 'primeng/picklist';
import { MessageService, ConfirmationService } from 'primeng/api';

// Services
import { MallaService } from '../../../../../core/services/infrastructure/malla.service';
import { MateriaService } from '../../../../../core/services/infrastructure/materia.service';
import { PlantillaEvaluacionService } from '../../../../../core/services/infrastructure/plantilla-evaluacion.service';
import { AreaCompetenciaService } from '../../../../../core/services/infrastructure/area-competencia.service';
import { DetalleMallaService } from '../../../../../core/services/infrastructure/detalle-malla.service';
import { TipoOfertaService } from '../../../../../core/services/infrastructure/tipo-oferta.service';
import { CicloService } from '../../../../../core/services/postulaciones/ciclo.service';
import { PeriodoLectivoService } from '../../../../../core/services/postulaciones/periodo-lectivo.service';

// Models
import { MallaDTO } from '../../../../../data/models/Entities';
import { MateriaDTO } from '../../../../../data/models/Entities';
import { PlantillaEvaluacionDTO } from '../../../../../data/models/notas/plantilla-evaluacion.model';
import { AreaCompetenciaDTO } from '../../../../../data/models/Entities';
import { DetalleMallaCreateDTO, DetalleMallaUpdateDTO } from '../../../../../data/models/detalle-malla/detalle-malla.model';
import { TipoOfertaDTO, CicloDTO, PeriodoLectivoDTO } from '../../../../../data/models/Entities';
import { ConfirmationModalComponent } from '../../../../../shared/modal-confirmation/confirmation-modal.component';
import { SharedToastComponent } from '../../../../../shared/shared-toast/shared-toast.component';

@Component({
  selector: 'app-detalle-malla',
  standalone: true,
  imports: [CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    TableModule,
    ConfirmDialogModule,
    DialogModule,
    TooltipModule,
    MultiSelectModule,
    SelectModule,
    ChipModule,
    DividerModule,
    InputTextModule,
    PickListModule,
    ConfirmationModalComponent, SharedToastComponent],
  providers: [MessageService, ConfirmationService],
  templateUrl: './detalle-malla.component.html',
  styleUrls: ['./detalle-malla.component.css']
})
export class DetalleMallaComponent implements OnInit {
  // Services
  private mallaService = inject(MallaService);
  private materiaService = inject(MateriaService);
  private plantillaService = inject(PlantillaEvaluacionService);
  private areaCompetenciaService = inject(AreaCompetenciaService);
  private detalleMallaService = inject(DetalleMallaService);
  private tipoOfertaService = inject(TipoOfertaService);
  private cicloService = inject(CicloService);
  // Catalogues
  tiposOferta: TipoOfertaDTO[] = [];
  periodos: PeriodoLectivoDTO[] = [];
  ciclos: CicloDTO[] = [];
  mallas: MallaDTO[] = [];
  materias: MateriaDTO[] = [];
  plantillas: PlantillaEvaluacionDTO[] = [];
  areasCompetencia: AreaCompetenciaDTO[] = [];

  // Filter selectors
  selectedPeriodo: PeriodoLectivoDTO | null = null;
  selectedCiclo: CicloDTO | null = null;

  // Grouped view: { malla, detalles[] }
  mallasGrouped: { malla: MallaDTO; detalles: any[] }[] = [];

  loading = false;
  saving = false;

  // ── Dialog: Agregar materias a una malla ──────────────────────────────────
  showAddMateriasDialog = false;
  selectedMallaForAdd: { malla: MallaDTO; detalles: any[] } | null = null;
  // Step 1 — PickList
  pickListSourceMaterias: MateriaDTO[] = [];
  pickListTargetMaterias: MateriaDTO[] = [];
  // Step 2
  pendingDetalles: any[] = [];
  pendingRemovals: number[] = [];
  saveAttempted = false;
  globalPlantillaEvaluacionId: number | null = null;

  // ── Dialog: Editar detalle ─────────────────────────────────────────────────
  showEditDialog = false;
  editingDetalle: any = null;
  selectedPlantilla: PlantillaEvaluacionDTO | null = null;
  selectedAreaCompetencia: AreaCompetenciaDTO | null = null;
  editingMallaId: number | null = null;

  // ── Confirmar eliminar detalle ─────────────────────────────────────────────
  showConfirmDeleteDetalle = false;
  detalleToDelete: { idDetalleMalla: number; mallaId: number } | null = null;

  // ── Dialog: Replicar entre ciclos ─────────────────────────────────────────
  showReplicateDialog = false;
  sourceCicloReplicate: CicloDTO | null = null;
  targetCicloReplicate: CicloDTO | null = null;
  sourceCiclosFull: CicloDTO[] = []; // esActivo = false
  targetCiclosFull: CicloDTO[] = []; // esActivo = true
  sourceCiclosVisible: CicloDTO[] = [];
  targetCiclosVisible: CicloDTO[] = [];
  showAllSourceRep = false;
  showAllTargetRep = false;
  sourceMallasRep: MallaDTO[] = [];
  targetMallasRep: MallaDTO[] = [];
  replicateMallaMismatch = false;
  replicating = false;

  // ── Load counters ───────────────────────────────────────────────────────────
  private loadCount = 0;
  private totalLoads = 4; // TiposOferta, Materias, Plantillas, AreasCompetencia
  private periodoService = inject(PeriodoLectivoService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  ngOnInit(): void {
    this.loadCatalogues();
    this.cargarPeriodos();
  }

  // ── Catalogues ──────────────────────────────────────────────────────────────

  loadCatalogues(): void {
    this.loading = true;
    this.loadCount = 0;
    this.totalLoads = 4;
    this.cargarTiposOferta();
    this.cargarMaterias();
    this.cargarPlantillas();
    this.cargarAreasCompetencia();
  }

  cargarPeriodos(): void {
    this.periodoService.getPeriodosLectivos().subscribe({
      next: (d) => { this.periodos = d; },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los períodos' })
    });
  }

  cargarTiposOferta(): void {
    this.tipoOfertaService.getAll().subscribe({
      next: (d) => { this.tiposOferta = d; this.checkLoadingComplete(); },
      error: () => this.checkLoadingComplete()
    });
  }

  cargarMaterias(): void {
    this.materiaService.getAll().subscribe({
      next: (data: any) => {
        this.materias = data?.items || [];
        this.checkLoadingComplete();
      },
      error: () => this.checkLoadingComplete()
    });
  }

  cargarPlantillas(): void {
    this.plantillaService.getAll().subscribe({
      next: (d) => { this.plantillas = d; this.checkLoadingComplete(); },
      error: () => this.checkLoadingComplete()
    });
  }

  cargarAreasCompetencia(): void {
    this.areaCompetenciaService.getAll().subscribe({
      next: (d) => { this.areasCompetencia = d; this.checkLoadingComplete(); },
      error: () => this.checkLoadingComplete()
    });
  }

  checkLoadingComplete(): void {
    this.loadCount++;
    if (this.loadCount >= this.totalLoads) this.loading = false;
  }

  // ── Selectors ───────────────────────────────────────────────────────────────

  onPeriodoChange(): void {
    this.selectedCiclo = null;
    this.ciclos = [];
    this.resetGrouped();
    if (this.selectedPeriodo?.idPeriodoLectivo) {
      this.cicloService.getByPeriodo(this.selectedPeriodo.idPeriodoLectivo).subscribe({
        next: (d) => { this.ciclos = (d || []).filter(c => c.esActivo === true); },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los ciclos' })
      });
    }
  }

  onCicloChange(): void {
    this.resetGrouped();
    if (this.selectedCiclo) this.loadMallasGrouped();
  }

  resetGrouped(): void {
    this.mallas = [];
    this.mallasGrouped = [];
  }

  // ── Grouped loading ─────────────────────────────────────────────────────────

  loadMallasGrouped(): void {
    if (!this.selectedCiclo) return;
    this.loading = true;
    this.mallaService.getByCiclo(this.selectedCiclo.idCiclo!).subscribe({
      next: (mallas) => {
        this.mallas = Array.isArray(mallas) ? mallas : [];
        if (this.mallas.length === 0) {
          this.mallasGrouped = [];
          this.loading = false;
          return;
        }
        // Load detalles for each malla in parallel
        let done = 0;
        const groups: { malla: MallaDTO; detalles: any[] }[] = this.mallas.map(m => ({ malla: m, detalles: [] }));
        groups.forEach((g, i) => {
          this.detalleMallaService.getByMalla(g.malla.idMalla!, 1, 800).subscribe({
            next: (detalles) => {
              groups[i].detalles = detalles;
              done++;
              if (done === groups.length) {
                this.mallasGrouped = groups;
                this.loading = false;
              }
            },
            error: () => {
              done++;
              if (done === groups.length) {
                this.mallasGrouped = groups;
                this.loading = false;
              }
            }
          });
        });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar mallas' });
        this.loading = false;
      }
    });
  }

  refreshGroupEntry(mallaId: number): void {
    this.detalleMallaService.getByMalla(mallaId, 1, 800).subscribe({
      next: (detalles) => {
        const g = this.mallasGrouped.find(x => x.malla.idMalla === mallaId);
        if (g) g.detalles = detalles;
      }
    });
  }

  // ── Agregar materias a una malla ────────────────────────────────────────────

  get availableMateriasForAdd(): MateriaDTO[] {
    if (!this.selectedMallaForAdd) return this.materias;
    const usedIds = this.selectedMallaForAdd.detalles.map((d: any) => d.idMateria);
    return this.materias.filter(m => !usedIds.includes(m.idMateria));
  }

  openAddMateriasDialog(mallaGroup: { malla: MallaDTO; detalles: any[] }): void {
    this.selectedMallaForAdd = mallaGroup;
    this.pickListSourceMaterias = this.availableMateriasForAdd.slice();

    // Solo nuevas materias a asignar (las ya asignadas se gestionan con el botón eliminar)
    this.pickListTargetMaterias = [];

    this.pendingDetalles = [];
    this.pendingRemovals = [];
    this.showAddMateriasDialog = true;
  }

  hideAddMateriasDialog(): void {
    this.showAddMateriasDialog = false;
    this.selectedMallaForAdd = null;
    this.pickListSourceMaterias = [];
    this.pickListTargetMaterias = [];
    this.pendingDetalles = [];
    this.pendingRemovals = [];
    this.globalPlantillaEvaluacionId = null;
    this.saveAttempted = false;
  }

  prepareDetalles(): void {
    if (!this.selectedMallaForAdd) return;

    const newMaterias = this.pickListTargetMaterias.slice();

    if (newMaterias.length === 0) {
      this.messageService.add({ severity: 'info', summary: 'Información', detail: 'Seleccione materias para continuar.' });
      return;
    }

    this.pendingRemovals = [];

    const cycleDates = this.getCycleDateRange(this.selectedCiclo);

    this.pendingDetalles = newMaterias.map(m => ({
      idMateria: m.idMateria,
      nombreMateria: m.detalle,
      horasMateria: m.horasRequeridas || 0,
      idPlantillaEvaluacion: null,
      idAreaCompetencia: null,
      modulo: null,
      duracionHoras: m.horasRequeridas || 0,
      fechaInicio: cycleDates?.fechaInicio ?? null,
      fechaFin: cycleDates?.fechaFin ?? null
    }));
  }

  backToMateriaSelection(): void {
    this.pendingDetalles = [];
    this.pendingRemovals = [];
    this.globalPlantillaEvaluacionId = null;
    this.saveAttempted = false;
  }

  onGlobalPlantillaChange(): void {
    if (this.pendingDetalles.length === 0 || this.globalPlantillaEvaluacionId === null) return;
    this.pendingDetalles = this.pendingDetalles.map(d => ({
      ...d,
      idPlantillaEvaluacion: this.globalPlantillaEvaluacionId
    }));
  }

  onDetallePlantillaChange(det: any, newValue: number | null): void {
    det.idPlantillaEvaluacion = newValue;

    const groupKey = this.getModuloGroupKey(det);
    this.pendingDetalles.forEach(item => {
      if (item !== det && this.getModuloGroupKey(item) === groupKey) {
        item.idPlantillaEvaluacion = newValue;
      }
    });

    if (
      this.globalPlantillaEvaluacionId !== null &&
      newValue !== null &&
      newValue !== this.globalPlantillaEvaluacionId &&
      this.hasMultiplePlantillas()
    ) {
      this.confirmationService.confirm({
        header: 'Confirmar excepción de plantilla',
        message: '¿Está seguro de que desea manejar 2 tipos de plantilla de evaluación a la vez?',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Sí, continuar',
        rejectLabel: 'No, mantener única',
        acceptButtonStyleClass: 'p-button-warning',
        rejectButtonStyleClass: 'p-button-text p-button-secondary',
        accept: () => {
          this.messageService.add({
            severity: 'warn',
            summary: 'Plantillas mixtas',
            detail: 'Se mantuvo una plantilla diferente para este caso especial.'
          });
        },
        reject: () => {
          det.idPlantillaEvaluacion = this.globalPlantillaEvaluacionId;
        }
      });
    }
  }

  onModuloChange(det: any): void {
    const modulo = this.normalizeModulo(det?.modulo);
    det.modulo = modulo;
    if (!modulo) return;

    const sameModulo = this.pendingDetalles.filter(x => this.normalizeModulo(x?.modulo) === modulo);
    if (sameModulo.length <= 1) return;

    const leader = sameModulo[0];
    const fechaInicio = this.toYMD(leader?.fechaInicio);
    const fechaFin = this.toYMD(leader?.fechaFin);

    sameModulo.forEach(item => {
      if (item !== leader) {
        item.fechaInicio = fechaInicio;
        item.fechaFin = fechaFin;
      }
    });
  }

  onModuloDateChange(det: any, field: 'fechaInicio' | 'fechaFin', value: string | null): void {
    det[field] = value;
    const modulo = this.normalizeModulo(det?.modulo);
    if (!modulo) return;

    const sameModulo = this.pendingDetalles.filter(x => this.normalizeModulo(x?.modulo) === modulo);
    if (sameModulo.length <= 1) return;

    const leader = sameModulo[0];
    if (leader !== det) return;

    sameModulo.forEach(item => {
      if (item !== leader) {
        item[field] = value;
      }
    });
  }

  isModuleDateEditable(det: any, index: number): boolean {
    const modulo = this.normalizeModulo(det?.modulo);
    if (!modulo) return true;
    const firstIndex = this.pendingDetalles.findIndex(x => this.normalizeModulo(x?.modulo) === modulo);
    return firstIndex === index;
  }

  private hasMultiplePlantillas(): boolean {
    const unique = new Set(
      this.pendingDetalles
        .map(d => d?.idPlantillaEvaluacion)
        .filter((id): id is number => typeof id === 'number' && id > 0)
    );
    return unique.size > 1;
  }

  private normalizeModulo(value: unknown): number | null {
    const numeric = Number(value);
    if (!Number.isInteger(numeric) || numeric <= 0) return null;
    return numeric;
  }

  private getModuloGroupKey(det: any): string {
    const modulo = this.normalizeModulo(det?.modulo);
    return modulo ? `mod-${modulo}` : 'sin-modulo';
  }

  allDetallesValid(): boolean {
    if (this.pendingDetalles.length === 0) return true;

    return this.pendingDetalles.every(
      d =>
        d.idPlantillaEvaluacion !== null &&
        d.idAreaCompetencia !== null &&
        d.duracionHoras !== null &&
        Number(d.duracionHoras) > 0 &&
        !!this.toYMD(d.fechaInicio) &&
        !!this.toYMD(d.fechaFin)
    );
  }

  hasFieldError(det: any, field: 'idPlantillaEvaluacion' | 'idAreaCompetencia' | 'duracionHoras' | 'fechaInicio' | 'fechaFin'): boolean {
    if (!this.saveAttempted) return false;

    switch (field) {
      case 'idPlantillaEvaluacion':
        return det?.idPlantillaEvaluacion === null || det?.idPlantillaEvaluacion === undefined;
      case 'idAreaCompetencia':
        return det?.idAreaCompetencia === null || det?.idAreaCompetencia === undefined;
      case 'duracionHoras':
        return det?.duracionHoras === null || det?.duracionHoras === undefined || Number(det?.duracionHoras) <= 0;
      case 'fechaInicio':
        return !this.toYMD(det?.fechaInicio);
      case 'fechaFin':
        return !this.toYMD(det?.fechaFin);
      default:
        return false;
    }
  }

  isDetalleInvalid(det: any): boolean {
    if (!this.saveAttempted) return false;
    return this.getDetalleValidationIssues(det).length > 0;
  }

  private focusFirstInvalidPendingDetalle(): void {
    const firstInvalidIndex = this.pendingDetalles.findIndex(det => this.getDetalleValidationIssues(det).length > 0);
    if (firstInvalidIndex < 0) return;

    if (typeof document === 'undefined') return;

    setTimeout(() => {
      const rowId = `pending-det-row-${firstInvalidIndex}`;
      const rowEl = document.getElementById(rowId);
      if (!rowEl) return;

      rowEl.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      rowEl.classList.add('pending-row-focus');
      setTimeout(() => rowEl.classList.remove('pending-row-focus'), 1800);
    }, 50);
  }

  private getDetalleValidationIssues(det: any): string[] {
    const issues: string[] = [];

    if (det?.idPlantillaEvaluacion === null || det?.idPlantillaEvaluacion === undefined) {
      issues.push('Plantilla de Evaluación');
    }

    if (det?.idAreaCompetencia === null || det?.idAreaCompetencia === undefined) {
      issues.push('Área de Competencia');
    }

    if (det?.duracionHoras === null || det?.duracionHoras === undefined || Number(det?.duracionHoras) <= 0) {
      issues.push('Duración Horas');
    }

    if (!this.toYMD(det?.fechaInicio)) {
      issues.push('Fecha Inicio');
    }

    if (!this.toYMD(det?.fechaFin)) {
      issues.push('Fecha Fin');
    }

    return issues;
  }

  private logPendingDetallesValidationIssues(): string[] {
    const invalidRows = this.pendingDetalles
      .map((det, index) => {
        const issues = this.getDetalleValidationIssues(det);
        return {
          row: index + 1,
          materia: det?.nombreMateria || `Materia #${index + 1}`,
          idMateria: det?.idMateria,
          modulo: det?.modulo,
          issues,
          raw: {
            idPlantillaEvaluacion: det?.idPlantillaEvaluacion,
            idAreaCompetencia: det?.idAreaCompetencia,
            duracionHoras: det?.duracionHoras,
            fechaInicio: det?.fechaInicio,
            fechaFin: det?.fechaFin
          }
        };
      })
      .filter(item => item.issues.length > 0);

    if (invalidRows.length === 0) {
      return [];
    }

    console.group('[DetalleMalla] Validación fallida al guardar materias');
    console.log('Total filas con problemas:', invalidRows.length);
    console.table(
      invalidRows.map(item => ({
        fila: item.row,
        materia: item.materia,
        idMateria: item.idMateria,
        modulo: item.modulo,
        camposFaltantes: item.issues.join(', '),
        idPlantillaEvaluacion: item.raw.idPlantillaEvaluacion,
        idAreaCompetencia: item.raw.idAreaCompetencia,
        duracionHoras: item.raw.duracionHoras,
        fechaInicio: item.raw.fechaInicio,
        fechaFin: item.raw.fechaFin
      }))
    );
    console.groupEnd();

    return invalidRows.map(item => `Fila ${item.row} (${item.materia}): ${item.issues.join(', ')}`);
  }

  guardarMateriasAgregadas(): void {
    this.saveAttempted = true;
    if (!this.selectedMallaForAdd || !this.allDetallesValid()) {
      const invalidSummaries = this.logPendingDetallesValidationIssues();
      this.focusFirstInvalidPendingDetalle();
      this.messageService.add({
        severity: 'warn',
        summary: 'Campos obligatorios pendientes',
        detail: invalidSummaries.length > 0
          ? `Revise consola (F12): ${invalidSummaries[0]}${invalidSummaries.length > 1 ? ` y ${invalidSummaries.length - 1} más.` : ''}`
          : 'Complete los campos requeridos marcados en rojo para continuar.'
      });
      return;
    }

    const cycleDates = this.getCycleDateRange(this.selectedCiclo);
    if (!cycleDates) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Ciclo sin fechas',
        detail: 'No se pudieron recuperar fecha inicio y fecha fin del ciclo seleccionado.'
      });
      return;
    }

    this.saving = true;

    const detalles: DetalleMallaCreateDTO[] = this.pendingDetalles.map(d => ({
      idMalla: this.selectedMallaForAdd!.malla.idMalla!,
      idMateria: d.idMateria,
      idPlantillaEvaluacion: d.idPlantillaEvaluacion,
      idAreaCompetencia: d.idAreaCompetencia,
      modulo: Number(d.modulo) || 0,
      fechaInicio: this.toYMD(d.fechaInicio) || cycleDates.fechaInicio,
      fechaFin: this.toYMD(d.fechaFin) || cycleDates.fechaFin,
      duracionHoras: Number(d.duracionHoras)
    }));

    this.executeSaveAndRemovals(detalles, this.pendingRemovals);
  }

  private executeSaveAndRemovals(detallesToCreate: DetalleMallaCreateDTO[], toRemoveMateriaIds: number[]): void {
    const mallaId = this.selectedMallaForAdd!.malla.idMalla!;

    const removalPromises: Promise<any>[] = [];
    toRemoveMateriaIds.forEach(materiaId => {
      const detail = this.selectedMallaForAdd!.detalles.find((d: any) => d.idMateria === materiaId);
      if (detail && detail.idDetalleMalla) {
        removalPromises.push(this.detalleMallaService.delete(detail.idDetalleMalla).toPromise());
      }
    });

    const createPromise = detallesToCreate.length > 0
      ? this.detalleMallaService.createBulk(detallesToCreate).toPromise()
      : Promise.resolve();

    Promise.all([...removalPromises, createPromise]).then(() => {
      this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Malla actualizada correctamente' });
      this.refreshGroupEntry(mallaId);
      this.hideAddMateriasDialog();
      this.saving = false;
    }).catch(() => {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar las materias' });
      this.saving = false;
    });
  }

  // ── Eliminar detalle ─────────────────────────────────────────────────────────

  confirmarEliminar(detalle: any, mallaId: number): void {
    this.detalleToDelete = { idDetalleMalla: detalle.idDetalleMalla, mallaId };
    this.showConfirmDeleteDetalle = true;
  }

  eliminarDetalle(): void {
    if (!this.detalleToDelete) return;
    const { idDetalleMalla, mallaId } = this.detalleToDelete;
    this.detalleMallaService.delete(idDetalleMalla).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Materia eliminada de la malla correctamente' });
        this.refreshGroupEntry(mallaId);
        this.showConfirmDeleteDetalle = false;
        this.detalleToDelete = null;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar la materia' });
        this.showConfirmDeleteDetalle = false;
        this.detalleToDelete = null;
      }
    });
  }

  cancelarEliminar(): void {
    this.showConfirmDeleteDetalle = false;
    this.detalleToDelete = null;
  }

  // ── Editar detalle ──────────────────────────────────────────────────────────

  editarDetalle(detalle: any, mallaId: number): void {
    const cycleDates = this.getCycleDateRange(this.selectedCiclo);
    this.editingDetalle = {
      ...detalle,
      fechaInicio: this.toYMD(detalle?.fechaInicio) || cycleDates?.fechaInicio || '',
      fechaFin: this.toYMD(detalle?.fechaFin) || cycleDates?.fechaFin || ''
    };
    this.editingMallaId = mallaId;
    this.selectedPlantilla = this.plantillas.find(p => p.idPlantillaEvaluacion === detalle.idPlantillaEvaluacion) || null;
    this.selectedAreaCompetencia = this.areasCompetencia.find(a => a.idAreaCompetencia === detalle.idAreaCompetencia) || null;
    this.showEditDialog = true;
  }

  cancelarEdicion(): void {
    this.editingDetalle = null;
    this.editingMallaId = null;
    this.selectedPlantilla = null;
    this.selectedAreaCompetencia = null;
    this.showEditDialog = false;
  }

  guardarEdicion(): void {
    if (!this.editingDetalle || !this.selectedPlantilla || !this.selectedAreaCompetencia) return;

    const cycleDates = this.getCycleDateRange(this.selectedCiclo);
    const fechaInicio = this.toYMD(this.editingDetalle.fechaInicio) || cycleDates?.fechaInicio;
    const fechaFin = this.toYMD(this.editingDetalle.fechaFin) || cycleDates?.fechaFin;

    if (!fechaInicio || !fechaFin) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Fechas requeridas',
        detail: 'No se pudo determinar la fecha inicio y fin para actualizar el detalle.'
      });
      return;
    }

    const modulo = Number(this.editingDetalle.modulo);
    const duracionHoras = Number(this.editingDetalle.duracionHoras);

    if (!Number.isFinite(duracionHoras) || duracionHoras <= 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Datos inválidos',
        detail: 'Ingrese una duración de horas válida para guardar.'
      });
      return;
    }

    this.saving = true;
    const updateData: DetalleMallaUpdateDTO = {
      idDetalleMalla: this.editingDetalle.idDetalleMalla,
      idMalla: this.editingDetalle.idMalla,
      idMateria: this.editingDetalle.idMateria,
      idPlantillaEvaluacion: this.selectedPlantilla!.idPlantillaEvaluacion,
      idAreaCompetencia: this.selectedAreaCompetencia!.idAreaCompetencia!,
      modulo: Number.isInteger(modulo) && modulo > 0 ? modulo : 0,
      fechaInicio,
      fechaFin,
      duracionHoras
    };
    this.detalleMallaService.update(updateData).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Detalle actualizado correctamente' });
        if (this.editingMallaId) this.refreshGroupEntry(this.editingMallaId);
        this.cancelarEdicion();
        this.saving = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar el detalle' });
        this.saving = false;
      }
    });
  }

  // ── Replicar entre ciclos ───────────────────────────────────────────────────

  openReplicateDialog(): void {
    this.sourceCicloReplicate = null;
    this.targetCicloReplicate = null;
    this.sourceMallasRep = [];
    this.targetMallasRep = [];
    this.replicateMallaMismatch = false;
    this.showAllSourceRep = false;
    this.showAllTargetRep = false;
    this.showReplicateDialog = true;
    this.loadCiclosForReplicate();
  }

  loadCiclosForReplicate(): void {
    this.cicloService.getAll().subscribe({
      next: (all) => {
        const sorted = [...all].sort((a, b) => {
          const da = a.fechaInicioEstimada ? new Date(a.fechaInicioEstimada).getTime() : 0;
          const db = b.fechaInicioEstimada ? new Date(b.fechaInicioEstimada).getTime() : 0;
          return db - da;
        });
        this.sourceCiclosFull = sorted.filter(c => !c.esActivo);
        this.targetCiclosFull = sorted.filter(c => c.esActivo);
        this.updateVisibleCiclos();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar ciclos' })
    });
  }

  updateVisibleCiclos(): void {
    this.sourceCiclosVisible = this.showAllSourceRep ? this.sourceCiclosFull : this.sourceCiclosFull.slice(0, 10);
    this.targetCiclosVisible = this.showAllTargetRep ? this.targetCiclosFull : this.targetCiclosFull.slice(0, 10);
  }

  toggleShowAllSourceRep(): void { this.showAllSourceRep = true; this.updateVisibleCiclos(); }
  toggleShowAllTargetRep(): void { this.showAllTargetRep = true; this.updateVisibleCiclos(); }

  get sourceCiclosTotalCount(): number { return this.sourceCiclosFull.length; }
  get targetCiclosTotalCount(): number { return this.targetCiclosFull.length; }

  onSourceCicloRepChange(): void {
    this.sourceMallasRep = [];
    this.replicateMallaMismatch = false;
    if (this.sourceCicloReplicate) {
      this.mallaService.getByCiclo(this.sourceCicloReplicate.idCiclo!).subscribe({
        next: (m) => { this.sourceMallasRep = m; this.checkMallaMismatch(); },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar mallas del ciclo origen' })
      });
    }
  }

  onTargetCicloRepChange(): void {
    this.targetMallasRep = [];
    this.replicateMallaMismatch = false;
    if (this.targetCicloReplicate) {
      this.mallaService.getByCiclo(this.targetCicloReplicate.idCiclo!).subscribe({
        next: (m) => { this.targetMallasRep = m; this.checkMallaMismatch(); },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar mallas del ciclo destino' })
      });
    }
  }

  checkMallaMismatch(): void {
    if (this.sourceMallasRep.length > 0 && this.targetMallasRep.length > 0) {
      const targetDetalles = new Set(
        this.targetMallasRep.map(m => m.detalle?.trim().toLowerCase())
      );
      this.replicateMallaMismatch = this.sourceMallasRep.some(
        m => !targetDetalles.has(m.detalle?.trim().toLowerCase())
      );
    } else {
      this.replicateMallaMismatch = false;
    }
  }

  get unmatchedSourceMallas(): string[] {
    if (!this.sourceMallasRep.length || !this.targetMallasRep.length) return [];
    const targetDetalles = new Set(
      this.targetMallasRep.map(m => m.detalle?.trim().toLowerCase())
    );
    return this.sourceMallasRep
      .filter(m => !targetDetalles.has(m.detalle?.trim().toLowerCase()))
      .map(m => m.detalle || '');
  }

  /** Count detalles of a source malla (from the already loaded detalles in mallasGrouped when viewing same ciclo, otherwise fetched live) */
  getSourceMallaDetalleCount(mallaId: number): number {
    // We don't pre-load for source, so we just show "?" or trust user
    return -1; // Placeholder — handled in template
  }

  replicarEntreCiclos(): void {
    if (!this.sourceCicloReplicate || !this.targetCicloReplicate) return;
    this.replicating = true;

    // Build a lookup map from trimmed detalle → target malla
    const targetByDetalle = new Map<string, MallaDTO>();
    this.targetMallasRep.forEach(m => {
      if (m.detalle) targetByDetalle.set(m.detalle.trim().toLowerCase(), m);
    });

    // For each source malla, load its detalles and create them in the matching target malla
    let completed = 0;
    const total = this.sourceMallasRep.length;
    let hasError = false;

    this.sourceMallasRep.forEach((sourceMalla) => {
      const targetMalla = targetByDetalle.get(sourceMalla.detalle?.trim().toLowerCase() ?? '');
      if (!targetMalla) { completed++; if (completed === total) this.finishReplicate(hasError); return; }

      this.detalleMallaService.getByMalla(sourceMalla.idMalla!, 1, 800).subscribe({
        next: (detalles) => {
          if (detalles.length === 0) {
            completed++;
            if (completed === total) this.finishReplicate(hasError);
            return;
          }
          const toCreate: DetalleMallaCreateDTO[] = detalles.map((d: any) => ({
            idMalla: targetMalla.idMalla!,
            idMateria: d.idMateria,
            idPlantillaEvaluacion: d.idPlantillaEvaluacion,
            idAreaCompetencia: d.idAreaCompetencia,
            modulo: Number(d.modulo) || 1,
            fechaInicio: this.getCycleDateRange(this.targetCicloReplicate)?.fechaInicio || this.toYMD(d.fechaInicio) || this.toYMD(this.targetCicloReplicate?.fechaInicioEstimada) || '',
            fechaFin: this.getCycleDateRange(this.targetCicloReplicate)?.fechaFin || this.toYMD(d.fechaFin) || this.toYMD(this.targetCicloReplicate?.fechaFinEstimada) || '',
            duracionHoras: Number(d.duracionHoras) || Number(d.horasMateria) || 1
          }));

          const invalidDatePayload = toCreate.some(x => !x.fechaInicio || !x.fechaFin);
          if (invalidDatePayload) {
            hasError = true;
            completed++;
            if (completed === total) this.finishReplicate(hasError);
            return;
          }

          this.detalleMallaService.createBulk(toCreate).subscribe({
            next: () => {
              completed++;
              if (completed === total) this.finishReplicate(hasError);
            },
            error: () => {
              hasError = true;
              completed++;
              if (completed === total) this.finishReplicate(hasError);
            }
          });
        },
        error: () => {
          hasError = true;
          completed++;
          if (completed === total) this.finishReplicate(hasError);
        }
      });
    });
  }

  private finishReplicate(hasError: boolean): void {
    this.replicating = false;
    if (hasError) {
      this.messageService.add({ severity: 'warn', summary: 'Parcial', detail: 'Replicación completada con algunos errores' });
    } else {
      this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Materias replicadas correctamente entre ciclos' });
    }
    this.hideReplicateDialog();
    if (this.selectedCiclo) this.loadMallasGrouped();
  }

  hideReplicateDialog(): void {
    this.showReplicateDialog = false;
    this.sourceCicloReplicate = null;
    this.targetCicloReplicate = null;
    this.sourceMallasRep = [];
    this.targetMallasRep = [];
    this.replicateMallaMismatch = false;
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  getTipoOfertaName(id: number): string {
    return this.tiposOferta.find(t => t.idtipoOferta === id)?.detalle || '';
  }

  getNombrePlantilla(id: number): string {
    return this.plantillas.find(p => p.idPlantillaEvaluacion === id)?.nombre || '';
  }

  getNombreAreaCompetencia(id: number): string {
    return this.areasCompetencia.find(a => a.idAreaCompetencia === id)?.detalle || '';
  }

  getNombreMateria(id: number): string {
    return this.materias.find(m => m.idMateria === id)?.detalle || '';
  }

  getHorasMateria(id: number): number {
    return this.materias.find(m => m.idMateria === id)?.horasRequeridas || 0;
  }

  private toYMD(value: unknown): string | null {
    if (!value) return null;

    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }

    const date = value instanceof Date ? value : new Date(value as string);
    if (Number.isNaN(date.getTime())) return null;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getCycleDateRange(ciclo: CicloDTO | null): { fechaInicio: string; fechaFin: string } | null {
    if (!ciclo) return null;

    const fechaInicio = this.toYMD(ciclo.fechaInicioEstimada);
    const fechaFin = this.toYMD(ciclo.fechaFinEstimada);

    if (!fechaInicio || !fechaFin) return null;
    return { fechaInicio, fechaFin };
  }
}
