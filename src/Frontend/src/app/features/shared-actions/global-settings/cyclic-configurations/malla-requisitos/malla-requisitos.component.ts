import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { ChipModule } from 'primeng/chip';
import { DividerModule } from 'primeng/divider';
import { PickListModule } from 'primeng/picklist';
import { TooltipModule } from 'primeng/tooltip';
import { MallaRequisitosDTO, MallaDTO, RequisitoDTO, CicloDTO, PeriodoLectivoDTO } from '../../../../../data/models/Entities';
import { MallaRequisitosService } from '../../../../../core/services/settings/malla-requisitos.service';
import { MallaService } from '../../../../../core/services/infrastructure/malla.service';
import { RequisitosService } from '../../../../../core/services/settings/requisitos.service';
import { CicloService } from '../../../../../core/services/postulaciones/ciclo.service';
import { PeriodoLectivoService } from '../../../../../core/services/postulaciones/periodo-lectivo.service';
import { ConfirmationModalComponent } from '../../../../../shared/modal-confirmation/confirmation-modal.component';
import { MessageService } from 'primeng/api';
import { SharedToastComponent } from '../../../../../shared/shared-toast/shared-toast.component';

@Component({
  selector: 'app-malla-requisitos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, TableModule, DialogModule, ButtonModule, InputTextModule, MultiSelectModule, SelectModule, ChipModule, DividerModule, PickListModule, TooltipModule, ConfirmationModalComponent, SharedToastComponent],
  templateUrl: './malla-requisitos.component.html',
  styleUrls: ['./malla-requisitos.component.css'],
  providers: [MessageService]
})
export class MallaRequisitosComponent implements OnInit {
  mallaRequisitos: MallaRequisitosDTO[] = [];
  mallas: MallaDTO[] = [];
  requisitos: RequisitoDTO[] = [];
  periodos: PeriodoLectivoDTO[] = [];
  ciclos: CicloDTO[] = [];
  selectedPeriodo: PeriodoLectivoDTO | null = null;
  selectedCiclo: CicloDTO | null = null;
  requisitosOptions: any[] = [];
  mallasOptions: any[] = [];
  mallasGrouped: any[] = [];
  activeCiclosSorted: CicloDTO[] = [];

  // Agregar requisitos a una malla específica
  addRequisitosForm: FormGroup;
  displayAddRequisitosDialog: boolean = false;
  selectedMallaForAdd: any = null; // mallaGroup { malla, requisitos }
  pickListSourceReqs: any[] = [];
  pickListTargetReqs: any[] = [];

  // Replicar entre ciclos
  displayReplicateDialog: boolean = false;
  sourceCicloReplicate: CicloDTO | null = null;
  targetCicloReplicate: CicloDTO | null = null;
  sourceMallasReplicate: MallaDTO[] = [];
  targetMallasReplicate: MallaDTO[] = [];
  allCiclosForReplicate: CicloDTO[] = [];
  allSourceCiclosReplicate: CicloDTO[] = [];
  allTargetCiclosReplicate: CicloDTO[] = [];
  sourceCiclosReplicate: CicloDTO[] = [];
  targetCiclosReplicate: CicloDTO[] = [];
  showAllSourceReplicate: boolean = false;
  showAllTargetReplicate: boolean = false;
  replicateMallaMismatch: boolean = false;

  // Confirmación eliminar
  showConfirmDelete: boolean = false;
  mallaRequisitoToDelete: MallaRequisitosDTO | null = null;

  constructor(
    private fb: FormBuilder,
    private mallaRequisitosService: MallaRequisitosService,
    private mallaService: MallaService,
    private requisitosService: RequisitosService,
    private cicloService: CicloService,
    private periodoService: PeriodoLectivoService,
    private messageService: MessageService
  ) {
    this.addRequisitosForm = this.fb.group({
      requisitoIds: [[], Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadRequisitos();
    this.loadPeriodos();
  }

  loadPeriodos(): void {
    this.periodoService.getPeriodosLectivos().subscribe({
      next: (data) => {
        this.periodos = data;
      },
      error: (err) => {
        console.error('Error cargando períodos:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los períodos'
        });
      }
    });
  }

  /**
   * Cuando cambia el período seleccionado
   */
  onPeriodoChange(): void {
    // Resetear ciclos
    this.selectedCiclo = null;
    this.ciclos = [];
    this.mallas = [];
    this.mallaRequisitos = [];
    this.mallasGrouped = [];

    if (this.selectedPeriodo?.idPeriodoLectivo) {
      this.cicloService.getByPeriodo(this.selectedPeriodo.idPeriodoLectivo).subscribe({
        next: (data) => { this.ciclos = (data || []).filter(c => c.esActivo === true); },
        error: (err) => {
          console.error('Error cargando ciclos:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron cargar los ciclos'
          });
        }
      });
    }
  }

  loadMallaRequisitos(): void {
    this.mallaRequisitosService.getAll().subscribe({
      next: (data) => {
        this.mallaRequisitos = data;
        console.log('Malla Requisitos cargados:', this.mallaRequisitos);
        this.groupMallaRequisitos();
      },
      error: (error) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar malla requisitos' });
      }
    });
  }

  groupMallaRequisitos(): void {
    if (this.mallas.length === 0 || this.requisitos.length === 0) {
      this.mallasGrouped = [];
      return;
    }

    this.mallasGrouped = this.mallas.map(malla => {
      const requisitosAsignados = this.mallaRequisitos
        .filter(mr => mr.idMalla === malla.idMalla)
        .map(mr => {
          const req = this.requisitos.find(r => r.idRequisitos === mr.idRequisitos);
          return {
            idMallaRequisitos: mr.idMallaRequisitos,
            idRequisitos: mr.idRequisitos,
            detalle: req?.detalle || 'Desconocido'
          };
        });

      return {
        malla: malla,
        requisitos: requisitosAsignados
      };
    });

    console.log('Mallas agrupadas:', this.mallasGrouped);
  }

  onCicloChange(): void {
    if (this.selectedCiclo) {
      this.loadMallas();
      this.loadMallaRequisitos();
    } else {
      this.mallas = [];
      this.mallaRequisitos = [];
      this.mallasGrouped = [];
    }
  }

  loadMallas(): void {
    if (this.selectedCiclo) {
      this.mallaService.getByCiclo(this.selectedCiclo.idCiclo!).subscribe({
        next: (data) => {
          this.mallas = Array.isArray(data) ? data : [];
          console.log('Mallas cargadas:', this.mallas);
          this.mallasOptions = this.mallas.map(m => ({
            label: this.getMallaDisplayText(m),
            value: m.idMalla
          }));
          this.groupMallaRequisitos();
        },
        error: (error) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar mallas' });
        }
      });
    } else {
      this.mallas = [];
      this.mallasOptions = [];
    }
  }

  loadRequisitos(): void {
    this.requisitosService.getAll().subscribe({
      next: (data) => {
        this.requisitos = data;
        this.requisitosOptions = data.map(r => ({ label: r.detalle, value: r.idRequisitos }));
        console.log('Requisitos cargados:', this.requisitos);
        this.groupMallaRequisitos();
      },
      error: (error) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar requisitos' });
      }
    });
  }


  // ── Requisitos asignados: agregar a una malla ─────────────────────────────

  get availableRequisitosForAdd(): any[] {
    if (!this.selectedMallaForAdd) return this.requisitosOptions;
    const assignedIds = this.selectedMallaForAdd.requisitos.map((r: any) => r.idRequisitos);
    return this.requisitosOptions.filter(r => !assignedIds.includes(r.value));
  }

  openAddRequisitosDialog(mallaGroup: any): void {
    this.selectedMallaForAdd = mallaGroup;
    this.pickListSourceReqs = this.availableRequisitosForAdd.slice();

    // Pre-populate target with already assigned requirements
    const assignedIds = mallaGroup.requisitos.map((r: any) => r.idRequisitos);
    this.pickListTargetReqs = this.requisitosOptions.filter(r => assignedIds.includes(r.value));

    this.addRequisitosForm.reset({ requisitoIds: [] });
    this.displayAddRequisitosDialog = true;
  }

  saveAddRequisitos(): void {
    if (this.selectedMallaForAdd) {
      const mallaId: number = this.selectedMallaForAdd.malla.idMalla;
      const initialAssignedIds = this.selectedMallaForAdd.requisitos.map((r: any) => r.idRequisitos);
      const currentTargetIds = this.pickListTargetReqs.map((r: any) => r.value);

      const toAdd = currentTargetIds.filter((id: number) => !initialAssignedIds.includes(id));
      const toRemoveIds = initialAssignedIds.filter((id: number) => !currentTargetIds.includes(id));

      const removalPromises: Promise<any>[] = [];
      toRemoveIds.forEach((reqId: number) => {
        const mr = this.mallaRequisitos.find(m => m.idMalla === mallaId && m.idRequisitos === reqId);
        if (mr && mr.idMallaRequisitos) {
          removalPromises.push(this.mallaRequisitosService.delete(mr.idMallaRequisitos).toPromise());
        }
      });

      const addPromise = toAdd.length > 0
        ? this.requisitosService.asignarRequisitosAMalla(mallaId, toAdd).toPromise()
        : Promise.resolve();

      Promise.all([...removalPromises, addPromise]).then(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Requisitos actualizados correctamente'
        });
        this.loadMallaRequisitos();
        this.hideAddRequisitosDialog();
      }).catch(() => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar requisitos' });
      });
    }
  }

  hideAddRequisitosDialog(): void {
    this.displayAddRequisitosDialog = false;
    this.selectedMallaForAdd = null;
    this.pickListSourceReqs = [];
    this.pickListTargetReqs = [];
    this.addRequisitosForm.reset();
  }

  // ── Eliminar requisito ────────────────────────────────────────────────────

  confirmDelete(mallaRequisito: MallaRequisitosDTO): void {
    this.mallaRequisitoToDelete = mallaRequisito;
    this.showConfirmDelete = true;
  }

  deleteMallaRequisito(): void {
    if (this.mallaRequisitoToDelete?.idMallaRequisitos) {
      this.mallaRequisitosService.delete(this.mallaRequisitoToDelete.idMallaRequisitos).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Requisito eliminado correctamente' });
          this.loadMallaRequisitos();
          this.showConfirmDelete = false;
          this.mallaRequisitoToDelete = null;
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar malla requisito' });
        }
      });
    }
  }

  cancelDelete(): void {
    this.showConfirmDelete = false;
    this.mallaRequisitoToDelete = null;
  }

  // ── Helpers de nombre ─────────────────────────────────────────────────────

  getCicloName(idCiclo: number): string {
    const ciclo = this.ciclos.find(c => c.idCiclo === idCiclo);
    return ciclo?.detalle || '';
  }

  getCicloNameFromList(idCiclo: number, list: CicloDTO[]): string {
    const ciclo = list.find(c => c.idCiclo === idCiclo);
    return ciclo?.detalle || '';
  }

  getMallaDisplayText(malla: MallaDTO): string {
    return malla.nombreTipoOferta ? `${malla.detalle} - ${malla.nombreTipoOferta}` : (malla.detalle || '');
  }

  getMallaRequisitoCount(mallaId: number): number {
    return this.mallaRequisitos.filter(mr => mr.idMalla === mallaId).length;
  }

  // ── Replicar entre ciclos ─────────────────────────────────────────────────

  openReplicateDialog(): void {
    this.sourceCicloReplicate = null;
    this.targetCicloReplicate = null;
    this.sourceMallasReplicate = [];
    this.targetMallasReplicate = [];
    this.replicateMallaMismatch = false;
    this.showAllSourceReplicate = false;
    this.showAllTargetReplicate = false;
    this.displayReplicateDialog = true;
    this.loadCiclosForReplicate();
  }

  loadCiclosForReplicate(): void {
    this.cicloService.getAll().subscribe({
      next: (data) => {
        this.allCiclosForReplicate = data;
        const sortByDate = (arr: CicloDTO[]) => [...arr].sort((a, b) => {
          const dateA = a.fechaInicioEstimada ? new Date(a.fechaInicioEstimada).getTime() : 0;
          const dateB = b.fechaInicioEstimada ? new Date(b.fechaInicioEstimada).getTime() : 0;
          return dateB - dateA;
        });
        this.allSourceCiclosReplicate = sortByDate(data.filter(c => c.esActivo === false));
        this.allTargetCiclosReplicate = sortByDate(data.filter(c => c.esActivo === true));
        this.sourceCiclosReplicate = this.showAllSourceReplicate
          ? this.allSourceCiclosReplicate
          : this.allSourceCiclosReplicate.slice(0, 10);
        this.targetCiclosReplicate = this.showAllTargetReplicate
          ? this.allTargetCiclosReplicate
          : this.allTargetCiclosReplicate.slice(0, 10);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar ciclos' });
      }
    });
  }

  toggleShowAllSourceReplicate(): void {
    this.showAllSourceReplicate = true;
    this.loadCiclosForReplicate();
  }

  toggleShowAllTargetReplicate(): void {
    this.showAllTargetReplicate = true;
    this.loadCiclosForReplicate();
  }

  get allCiclosReplicateCount(): number {
    return this.allCiclosForReplicate.length;
  }

  get sourceReplicateCount(): number {
    return this.allSourceCiclosReplicate.length;
  }

  get targetReplicateCount(): number {
    return this.allTargetCiclosReplicate.length;
  }

  onSourceCicloReplicateChange(): void {
    if (this.sourceCicloReplicate) {
      this.mallaService.getByCiclo(this.sourceCicloReplicate.idCiclo!).subscribe({
        next: (mallas) => {
          this.sourceMallasReplicate = mallas;
          this.checkMallaMismatch();
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar mallas del ciclo origen' });
        }
      });
    } else {
      this.sourceMallasReplicate = [];
      this.checkMallaMismatch();
    }
  }

  onTargetCicloReplicateChange(): void {
    if (this.targetCicloReplicate) {
      this.mallaService.getByCiclo(this.targetCicloReplicate.idCiclo!).subscribe({
        next: (mallas) => {
          this.targetMallasReplicate = mallas;
          this.checkMallaMismatch();
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar mallas del ciclo destino' });
        }
      });
    } else {
      this.targetMallasReplicate = [];
      this.checkMallaMismatch();
    }
  }

  checkMallaMismatch(): void {
    if (this.sourceMallasReplicate.length > 0 && this.targetMallasReplicate.length > 0) {
      const targetDetalles = new Set(
        this.targetMallasReplicate.map(m => m.detalle?.trim().toLowerCase())
      );
      this.replicateMallaMismatch = this.sourceMallasReplicate.some(
        m => !targetDetalles.has(m.detalle?.trim().toLowerCase())
      );
    } else {
      this.replicateMallaMismatch = false;
    }
  }

  get unmatchedSourceMallas(): string[] {
    if (!this.sourceMallasReplicate.length || !this.targetMallasReplicate.length) return [];
    const targetDetalles = new Set(
      this.targetMallasReplicate.map(m => m.detalle?.trim().toLowerCase())
    );
    return this.sourceMallasReplicate
      .filter(m => !targetDetalles.has(m.detalle?.trim().toLowerCase()))
      .map(m => m.detalle || '');
  }

  saveReplicate(): void {
    if (!this.sourceCicloReplicate || !this.targetCicloReplicate) return;

    const targetByDetalle = new Map<string, MallaDTO>();
    this.targetMallasReplicate.forEach(m => {
      if (m.detalle) targetByDetalle.set(m.detalle.trim().toLowerCase(), m);
    });

    const promises: Promise<any>[] = [];
    this.sourceMallasReplicate.forEach((sourceMalla) => {
      const targetMalla = targetByDetalle.get(sourceMalla.detalle?.trim().toLowerCase() ?? '');
      if (!targetMalla) return;
      const sourceReqIds = this.mallaRequisitos
        .filter(mr => mr.idMalla === sourceMalla.idMalla)
        .map(mr => mr.idRequisitos)
        .filter(id => id !== undefined) as number[];
      if (sourceReqIds.length > 0) {
        promises.push(
          this.requisitosService.asignarRequisitosAMalla(targetMalla.idMalla!, sourceReqIds).toPromise()
        );
      }
    });

    if (promises.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'El ciclo origen no tiene requisitos asignados a sus mallas'
      });
      return;
    }

    Promise.all(promises).then(() => {
      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Requisitos replicados correctamente entre ciclos'
      });
      this.loadMallaRequisitos();
      this.hideReplicateDialog();
    }).catch(() => {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al replicar requisitos entre ciclos' });
    });
  }

  hideReplicateDialog(): void {
    this.displayReplicateDialog = false;
    this.sourceCicloReplicate = null;
    this.targetCicloReplicate = null;
    this.sourceMallasReplicate = [];
    this.targetMallasReplicate = [];
    this.replicateMallaMismatch = false;
  }
}
