import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';

// Services
import { MallaParaleloService } from '../../../../../core/services/infrastructure/malla-paralelo.service';
import { MallaService } from '../../../../../core/services/infrastructure/malla.service';
import { ParaleloService } from '../../../../../core/services/infrastructure/paralelo.service';
import { PeriodoLectivoService } from '../../../../../core/services/postulaciones/periodo-lectivo.service';
import { CicloService } from '../../../../../core/services/postulaciones/ciclo.service';

// Models
import {
  MallaParaleloDTO,
  MallaParaleloCreateDTO,
  ActivarMallaParaleloDTO,
  MallaDTO,
  ParaleloDTO,
  PeriodoLectivoDTO,
  CicloDTO
} from '../../../../../data/models/Entities';

// Shared
import { ConfirmationModalComponent } from '../../../../../shared/modal-confirmation/confirmation-modal.component';
import { SharedToastComponent } from '../../../../../shared/shared-toast/shared-toast.component';

@Component({
  selector: 'app-malla-paralelo',
  standalone: true,
  imports: [CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    DialogModule,
    CheckboxModule,
    TooltipModule,
    ConfirmationModalComponent, SharedToastComponent],
  providers: [MessageService],
  templateUrl: './malla-paralelo.component.html',
  styleUrls: ['./malla-paralelo.component.css']
})
export class MallaParaleloComponent implements OnInit {
  private mallaParaleloService = inject(MallaParaleloService);
  private mallaService = inject(MallaService);
  private paraleloService = inject(ParaleloService);
  private periodoService = inject(PeriodoLectivoService);
  private cicloService = inject(CicloService);
  private messageService = inject(MessageService);

  // Catalogues
  allCiclos: CicloDTO[] = [];
  periodos: PeriodoLectivoDTO[] = [];
  ciclos: CicloDTO[] = [];
  mallas: MallaDTO[] = [];
  paralelos: ParaleloDTO[] = [];

  // Filters
  selectedPeriodo: PeriodoLectivoDTO | null = null;
  selectedCiclo: CicloDTO | null = null;

  // Data
  mallaParalelos: MallaParaleloDTO[] = [];

  // UI state
  loading = false;
  saving = false;

  // Dialog: Create
  showCreateDialog = false;
  createForm: MallaParaleloCreateDTO = { idMalla: undefined, idParalelo: undefined, cupoMaximo: 30 };
  dialogMalla: MallaDTO | null = null;

  // Dialog: Activate
  showActivarDialog = false;
  activarForm: ActivarMallaParaleloDTO = { idMallaParalelo: undefined, clonarDistributivos: false, idMallaParaleloOrigen: null };
  itemToActivar: MallaParaleloDTO | null = null;

  // Confirm: Deactivate
  showConfirmDesactivar = false;
  itemToDesactivar: MallaParaleloDTO | null = null;

  ngOnInit(): void {
    this.cargarPeriodos();
    this.cicloService.getAll().subscribe({
      next: (data) => { this.allCiclos = data || []; },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los ciclos' })
    });
  }

  cargarPeriodos(): void {
    this.periodoService.getPeriodosLectivos().subscribe({
      next: (data) => { this.periodos = data || []; },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los períodos' })
    });
  }

  onPeriodoChange(): void {
    this.selectedCiclo = null;
    this.ciclos = [];
    this.mallas = [];
    this.mallaParalelos = [];

    if (this.selectedPeriodo?.idPeriodoLectivo) {
      this.ciclos = this.allCiclos.filter(
        c => c.idPeriodo === this.selectedPeriodo!.idPeriodoLectivo && c.esActivo === true
      );
    }
  }

  onCicloChange(): void {
    this.mallas = [];
    this.mallaParalelos = [];

    if (this.selectedCiclo?.idCiclo) {
      this.loading = true;
      this.mallaService.getByCiclo(this.selectedCiclo.idCiclo).subscribe({
        next: (data) => {
          this.mallas = data || [];
          this.cargarTodosLosMallaParalelos();
        },
        error: () => {
          this.loading = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las mallas' });
        }
      });
    } else {
      this.loading = false;
    }
  }

  cargarTodosLosMallaParalelos(): void {
    if (!this.mallas.length) {
      this.mallaParalelos = [];
      this.loading = false;
      return;
    }

    forkJoin(this.mallas.map(m => this.mallaParaleloService.getByMalla(m.idMalla!))).subscribe({
      next: (resultadoPorMalla) => {
        this.mallaParalelos = resultadoPorMalla
          .flatMap((items, idx) =>
            (items || []).map(item => ({
              ...item,
              idMalla: (item as any).idMalla ?? this.mallas[idx]?.idMalla
            }))
          ) as MallaParaleloDTO[];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los paralelos de las mallas' });
      }
    });
  }

  get paralelosPorMalla(): any[] {
    return this.mallas.map(malla => ({
      idMalla: malla.idMalla,
      detalleMalla: malla.detalle || `Malla ${malla.idMalla}`,
      detalleCiclo: malla.detalleCiclo || '',
      paralelos: this.mallaParalelos.filter((mp: any) => mp.idMalla === malla.idMalla)
    }));
  }

  // ── Create ─────────────────────────────────────────────────────────────────

  abrirCrearDialogPorMalla(mallaGroup: any): void {
    const idMalla = mallaGroup?.idMalla;
    if (!idMalla) return;

    this.dialogMalla = this.mallas.find(m => m.idMalla === idMalla) ?? null;
    this.createForm = { idMalla, idParalelo: undefined, cupoMaximo: 30 };

    this.paraleloService.getAllParalelos().subscribe({
      next: (data) => {
        // Exclude paralelos already assigned to this malla
        const idsUsados = new Set(
          this.mallaParalelos
            .filter((mp: any) => mp.idMalla === idMalla)
            .map(mp => mp.idParalelo)
        );
        this.paralelos = (data || []).filter(p => !idsUsados.has(p.idParalelo));
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los paralelos' })
    });
    this.showCreateDialog = true;
  }

  guardarNuevoParalelo(): void {
    if (!this.createForm.idParalelo) {
      this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Seleccione un paralelo' });
      return;
    }
    if (!this.createForm.cupoMaximo || this.createForm.cupoMaximo < 1) {
      this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Ingrese un cupo máximo válido' });
      return;
    }
    this.saving = true;
    this.mallaParaleloService.create(this.createForm).subscribe({
      next: () => {
        this.saving = false;
        this.showCreateDialog = false;
        this.dialogMalla = null;
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Paralelo agregado a la malla' });
        this.cargarTodosLosMallaParalelos();
      },
      error: (err) => {
        this.saving = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message ?? 'No se pudo crear el paralelo' });
      }
    });
  }

  // ── Activate ───────────────────────────────────────────────────────────────

  confirmarActivar(item: MallaParaleloDTO): void {
    this.itemToActivar = item;
    this.activarForm = {
      idMallaParalelo: item.idMallaParalelo,
      clonarDistributivos: false,
      idMallaParaleloOrigen: null
    };
    this.showActivarDialog = true;
  }

  ejecutarActivar(): void {
    if (!this.itemToActivar?.idMallaParalelo) return;
    this.saving = true;
    this.mallaParaleloService.activar(this.itemToActivar.idMallaParalelo, this.activarForm).subscribe({
      next: () => {
        this.saving = false;
        this.showActivarDialog = false;
        this.itemToActivar = null;
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Paralelo activado correctamente' });
        this.cargarTodosLosMallaParalelos();
      },
      error: (err) => {
        this.saving = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message ?? 'No se pudo activar el paralelo' });
      }
    });
  }

  // ── Deactivate ─────────────────────────────────────────────────────────────

  confirmarDesactivar(item: MallaParaleloDTO): void {
    this.itemToDesactivar = item;
    this.showConfirmDesactivar = true;
  }

  ejecutarDesactivar(): void {
    if (!this.itemToDesactivar?.idMallaParalelo) return;
    this.saving = true;
    this.mallaParaleloService.desactivar(this.itemToDesactivar.idMallaParalelo).subscribe({
      next: () => {
        this.saving = false;
        this.showConfirmDesactivar = false;
        this.itemToDesactivar = null;
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Paralelo desactivado' });
        this.cargarTodosLosMallaParalelos();
      },
      error: (err) => {
        this.saving = false;
        this.showConfirmDesactivar = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message ?? 'No se pudo desactivar el paralelo' });
      }
    });
  }

  cancelarDesactivar(): void {
    this.showConfirmDesactivar = false;
    this.itemToDesactivar = null;
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  getNombreParalelo(paralelo: ParaleloDTO): string {
    return paralelo.detalle ?? paralelo.nombreParalelo ?? `Paralelo ${paralelo.idParalelo}`;
  }

  get activosParaOrigen(): MallaParaleloDTO[] {
    const idMallaActual = (this.itemToActivar as any)?.idMalla;
    return this.mallaParalelos.filter(
      (mp: any) =>
        mp.esActivo &&
        mp.idMallaParalelo !== this.itemToActivar?.idMallaParalelo &&
        mp.idMalla === idMallaActual
    );
  }
}
