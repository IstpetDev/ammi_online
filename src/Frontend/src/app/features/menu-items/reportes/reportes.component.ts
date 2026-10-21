import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';


import { CicloDTO, MallaDTO, MallaParaleloDTO, PeriodoLectivoDTO } from '../../../data/models/Entities';
import { CicloService, MallaService, PeriodoLectivoService } from '../../../core/services/postulaciones';
import { MallaParaleloService } from '../../../core/services/infrastructure/malla-paralelo.service';
import { DetalleMallaService } from '../../../core/services/infrastructure/detalle-malla.service';
import { NotasReporteService } from '../../../features/shared-actions/reportes/notas/notas-reporte.service';
import { ReporteNotasService } from '../../../features/shared-actions/reportes/notas/reporte-notas.service';
import { SharedToastComponent } from '../../../shared/shared-toast/shared-toast.component';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedToastComponent],
  providers: [MessageService],
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.css']
})
export class ReportesComponent implements OnInit {
  private messageService       = inject(MessageService);
  private cicloService         = inject(CicloService);
  private mallaService         = inject(MallaService);
  private mallaParaleloService = inject(MallaParaleloService);
  private detalleMallaService  = inject(DetalleMallaService);
  private periodoLectivoService = inject(PeriodoLectivoService);
  private notasReporte         = inject(NotasReporteService);
  private reporteNotasService  = inject(ReporteNotasService);

  // ─── Cascada Sábana de Notas: Periodo → Ciclo → Nivel → Paralelo ──────
  sabPeriodos:         PeriodoLectivoDTO[] = [];
  sabSelectedPeriodo:  number | null = null;

  sabCiclos:           CicloDTO[] = [];
  sabSelectedCiclo:    number | null = null;
  sabLoadingCiclos    = false;

  sabMallas:           MallaDTO[] = [];
  sabSelectedMalla:    number | null = null;
  sabLoadingMallas    = false;

  sabParalelos:        MallaParaleloDTO[] = [];
  sabSelectedParalelo: number | null = null;
  sabLoadingParalelos = false;

  // ─── Cascada Reporte de Notas: Periodo → Ciclo → Nivel → Paralelo ──────
  rnPeriodos:         PeriodoLectivoDTO[] = [];
  rnSelectedPeriodo:  number | null = null;

  rnCiclos:           CicloDTO[] = [];
  rnSelectedCiclo:    number | null = null;
  rnLoadingCiclos    = false;

  rnMallas:           MallaDTO[] = [];
  rnSelectedMalla:    number | null = null;
  rnLoadingMallas    = false;

  rnParalelos:        MallaParaleloDTO[] = [];
  rnSelectedParalelo: number | null = null;
  rnLoadingParalelos = false;

  // ─── Cascada Notas Detalladas: Periodo → Ciclo → Nivel → Paralelo ─────────
  ndPeriodos:         PeriodoLectivoDTO[] = [];
  ndSelectedPeriodo:  number | null = null;

  ndCiclos:           CicloDTO[] = [];
  ndSelectedCiclo:    number | null = null;
  ndLoadingCiclos    = false;

  ndMallas:           MallaDTO[] = [];
  ndSelectedMalla:    number | null = null;
  ndLoadingMallas    = false;

  ndParalelos:        MallaParaleloDTO[] = [];
  ndSelectedParalelo: number | null = null;
  ndLoadingParalelos = false;

  // ─── Estado de generación ─────────────────────────────────────────────────
  loadingSabanaExcel         = false;
  loadingSabanaPDF           = false;
  loadingReporteNotasExcel   = false;
  loadingNotasDetalladasExcel = false;

  // ─── Lifecycle ────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.periodoLectivoService.getPeriodosLectivos().subscribe({
      next:  (data) => { this.sabPeriodos = data; this.rnPeriodos = data; this.ndPeriodos = data; },
      error: () => this._toast('error', 'Error', 'No se pudieron cargar los periodos lectivos')
    });
  }

  // ─── Cascada Sábana ───────────────────────────────────────────────────────

  onSabPeriodoChange(): void {
    this.sabCiclos          = [];
    this.sabMallas          = [];
    this.sabParalelos       = [];
    this.sabSelectedCiclo   = null;
    this.sabSelectedMalla   = null;
    this.sabSelectedParalelo = null;
    if (!this.sabSelectedPeriodo) return;
    this.sabLoadingCiclos = true;
    this.cicloService.getAll().subscribe({
      next: (data) => { this.sabCiclos = data.filter(c => c.idPeriodo === this.sabSelectedPeriodo); this.sabLoadingCiclos = false; },
      error: () => { this.sabLoadingCiclos = false; this._toast('error', 'Error', 'No se pudieron cargar los ciclos'); }
    });
  }

  onSabCicloChange(): void {
    this.sabMallas          = [];
    this.sabParalelos       = [];
    this.sabSelectedMalla   = null;
    this.sabSelectedParalelo = null;
    if (!this.sabSelectedCiclo) return;
    this.sabLoadingMallas = true;
    this.mallaService.getMallasByParams({ IdCiclo: this.sabSelectedCiclo }).subscribe({
      next:  (data) => { this.sabMallas = data; this.sabLoadingMallas = false; },
      error: () => { this.sabLoadingMallas = false; this._toast('error', 'Error', 'No se pudieron cargar los niveles'); }
    });
  }

  onSabMallaChange(): void {
    this.sabParalelos         = [];
    this.sabSelectedParalelo  = null;
    if (!this.sabSelectedMalla) return;
    this.sabLoadingParalelos = true;
    this.mallaParaleloService.getByMalla(this.sabSelectedMalla).subscribe({
      next:  (data) => { this.sabParalelos = data; this.sabLoadingParalelos = false; },
      error: () => { this.sabLoadingParalelos = false; this._toast('error', 'Error', 'No se pudieron cargar los paralelos'); }
    });
  }

  // ─── Cascada Reporte de Notas ─────────────────────────────────────────────

  onRnPeriodoChange(): void {
    this.rnCiclos          = [];
    this.rnMallas          = [];
    this.rnParalelos       = [];
    this.rnSelectedCiclo   = null;
    this.rnSelectedMalla   = null;
    this.rnSelectedParalelo = null;
    if (!this.rnSelectedPeriodo) return;
    this.rnLoadingCiclos = true;
    this.cicloService.getAll().subscribe({
      next: (data) => { this.rnCiclos = data.filter(c => c.idPeriodo === this.rnSelectedPeriodo); this.rnLoadingCiclos = false; },
      error: () => { this.rnLoadingCiclos = false; this._toast('error', 'Error', 'No se pudieron cargar los ciclos'); }
    });
  }

  onRnCicloChange(): void {
    this.rnMallas          = [];
    this.rnParalelos       = [];
    this.rnSelectedMalla   = null;
    this.rnSelectedParalelo = null;
    if (!this.rnSelectedCiclo) return;
    this.rnLoadingMallas = true;
    this.mallaService.getMallasByParams({ IdCiclo: this.rnSelectedCiclo }).subscribe({
      next:  (data) => { this.rnMallas = data; this.rnLoadingMallas = false; },
      error: () => { this.rnLoadingMallas = false; this._toast('error', 'Error', 'No se pudieron cargar los niveles'); }
    });
  }

  onRnMallaChange(): void {
    this.rnParalelos         = [];
    this.rnSelectedParalelo  = null;
    if (!this.rnSelectedMalla) return;
    this.rnLoadingParalelos = true;
    this.mallaParaleloService.getByMalla(this.rnSelectedMalla).subscribe({
      next:  (data) => { this.rnParalelos = data; this.rnLoadingParalelos = false; },
      error: () => { this.rnLoadingParalelos = false; this._toast('error', 'Error', 'No se pudieron cargar los paralelos'); }
    });
  }

  // ─── Cascada Notas Detalladas ──────────────────────────────────────────────

  onNdPeriodoChange(): void {
    this.ndCiclos            = [];
    this.ndMallas            = [];
    this.ndParalelos         = [];
    this.ndSelectedCiclo     = null;
    this.ndSelectedMalla     = null;
    this.ndSelectedParalelo  = null;
    if (!this.ndSelectedPeriodo) return;
    this.ndLoadingCiclos = true;
    this.cicloService.getAll().subscribe({
      next: (data) => { this.ndCiclos = data.filter(c => c.idPeriodo === this.ndSelectedPeriodo); this.ndLoadingCiclos = false; },
      error: () => { this.ndLoadingCiclos = false; this._toast('error', 'Error', 'No se pudieron cargar los ciclos'); }
    });
  }

  onNdCicloChange(): void {
    this.ndMallas            = [];
    this.ndParalelos         = [];
    this.ndSelectedMalla     = null;
    this.ndSelectedParalelo  = null;
    if (!this.ndSelectedCiclo) return;
    this.ndLoadingMallas = true;
    this.mallaService.getMallasByParams({ IdCiclo: this.ndSelectedCiclo }).subscribe({
      next:  (data) => { this.ndMallas = data; this.ndLoadingMallas = false; },
      error: () => { this.ndLoadingMallas = false; this._toast('error', 'Error', 'No se pudieron cargar los niveles'); }
    });
  }

  onNdMallaChange(): void {
    this.ndParalelos          = [];
    this.ndSelectedParalelo   = null;
    if (!this.ndSelectedMalla) return;
    this.ndLoadingParalelos = true;
    this.mallaParaleloService.getByMalla(this.ndSelectedMalla).subscribe({
      next:  (data) => { this.ndParalelos = data; this.ndLoadingParalelos = false; },
      error: () => { this.ndLoadingParalelos = false; this._toast('error', 'Error', 'No se pudieron cargar los paralelos'); }
    });
  }

  // ─── Labels Sábana ────────────────────────────────────────────────────────
  private get sabLabelPeriodo(): string {
    return this.sabPeriodos.find(p => p.idPeriodoLectivo === this.sabSelectedPeriodo)?.detalle ?? '';
  }
  private get sabLabelCiclo(): string {
    return this.sabCiclos.find(c => c.idCiclo === this.sabSelectedCiclo)?.detalle ?? '';
  }
  private get sabLabelMalla(): string {
    return this.sabMallas.find(m => m.idMalla === this.sabSelectedMalla)?.detalle ?? '';
  }
  private get sabLabelParalelo(): string {
    return this.sabParalelos.find(p => p.idMallaParalelo === this.sabSelectedParalelo)?.nombreParalelo ?? '';
  }

  // ─── Labels Reporte de Notas ──────────────────────────────────────────────
  private get rnLabelPeriodo(): string {
    return this.rnPeriodos.find(p => p.idPeriodoLectivo === this.rnSelectedPeriodo)?.detalle ?? '';
  }
  private get rnLabelCiclo(): string {
    return this.rnCiclos.find(c => c.idCiclo === this.rnSelectedCiclo)?.detalle ?? '';
  }
  private get rnLabelMalla(): string {
    return this.rnMallas.find(m => m.idMalla === this.rnSelectedMalla)?.detalle ?? '';
  }
  private get rnLabelParalelo(): string {
    return this.rnParalelos.find(p => p.idMallaParalelo === this.rnSelectedParalelo)?.nombreParalelo ?? '';
  }

  // ─── Labels Notas Detalladas ───────────────────────────────────────────────
  private get ndLabelPeriodo(): string {
    return this.ndPeriodos.find(p => p.idPeriodoLectivo === this.ndSelectedPeriodo)?.detalle ?? '';
  }
  private get ndLabelCiclo(): string {
    return this.ndCiclos.find(c => c.idCiclo === this.ndSelectedCiclo)?.detalle ?? '';
  }
  private get ndLabelMalla(): string {
    return this.ndMallas.find(m => m.idMalla === this.ndSelectedMalla)?.detalle ?? '';
  }
  private get ndLabelParalelo(): string {
    return this.ndParalelos.find(p => p.idMallaParalelo === this.ndSelectedParalelo)?.nombreParalelo ?? '';
  }

  // ─── Sábana de Notas (todas las materias del paralelo) ────────────────────

  generarSabanaExcel(): void {
    if (!this.sabSelectedPeriodo || !this.sabSelectedCiclo || !this.sabSelectedMalla || !this.sabSelectedParalelo) {
      this._toast('warn', 'Campos requeridos', 'Debe seleccionar periodo, ciclo, nivel y paralelo.');
      return;
    }
    this.loadingSabanaExcel = true;
    this._exportarSabana(this.sabSelectedMalla, this.sabSelectedParalelo, 'xlsx');
  }

  generarSabanaPDF(): void {
    if (!this.sabSelectedPeriodo || !this.sabSelectedCiclo || !this.sabSelectedMalla || !this.sabSelectedParalelo) {
      this._toast('warn', 'Campos requeridos', 'Debe seleccionar periodo, ciclo, nivel y paralelo.');
      return;
    }
    this.loadingSabanaPDF = true;
    this._exportarSabana(this.sabSelectedMalla, this.sabSelectedParalelo, 'pdf');
  }

  private _exportarSabana(idMalla: number, idMallaParalelo: number, formato: 'xlsx' | 'pdf'): void {
    if (formato === 'xlsx') {
      const meta = {
        periodo:  this.sabLabelPeriodo,
        ciclo:    this.sabLabelCiclo,
        nivel:    this.sabLabelMalla,
        paralelo: this.sabLabelParalelo
      };

      this.notasReporte.exportarSabanaCompletaExcel(idMalla, idMallaParalelo, meta).subscribe({
        next:  () => { this.loadingSabanaExcel = false; this._toast('success', 'Excel generado', 'Sábana de Notas descargada'); },
        error: (err) => { this.loadingSabanaExcel = false; this._toast('error', 'Error', err?.message ?? 'No se pudo generar la Sábana de Notas'); }
      });
      return;
    }

    // PDF — una materia por descarga (no soporta multi-hoja)
    this.detalleMallaService.getByMalla(idMalla, 1, 200).subscribe({
      next: (materias) => {
        if (materias.length === 0) {
          this.loadingSabanaPDF = false;
          this._toast('warn', 'Sin materias', 'No hay materias en esta malla');
          return;
        }

        const meta = {
          periodo:  this.sabLabelPeriodo,
          ciclo:    this.sabLabelCiclo,
          nivel:    this.sabLabelMalla,
          paralelo: this.sabLabelParalelo
        };

        let idx = 0;
        const procesarSiguiente = () => {
          if (idx >= materias.length) {
            this.loadingSabanaPDF = false;
            this._toast('success', 'PDF generado', 'Sábana de Notas descargada');
            return;
          }

          const m = materias[idx];
          const nombreMateria = m.nombreMateria ?? `Materia ${m.idDetalleMalla}`;
          this.notasReporte.exportarSabanaPDF(idMallaParalelo, m.idDetalleMalla, m.idPlantillaEvaluacion ?? 0, { ...meta, materia: nombreMateria }).subscribe({
            next:  () => { idx++; procesarSiguiente(); },
            error: () => { idx++; procesarSiguiente(); }
          });
        };

        procesarSiguiente();
      },
      error: () => {
        this.loadingSabanaPDF = false;
        this._toast('error', 'Error', 'No se pudo cargar las materias');
      }
    });
  }

  // ─── Reporte de Notas ─────────────────────────────────────────────────────

  generarReporteNotasExcel(): void {
    if (!this.rnSelectedPeriodo || !this.rnSelectedCiclo || !this.rnSelectedMalla || !this.rnSelectedParalelo) {
      this._toast('warn', 'Campos requeridos', 'Debe seleccionar periodo, ciclo, nivel y paralelo.');
      return;
    }

    this.loadingReporteNotasExcel = true;

    const meta = {
      periodo:  this.rnLabelPeriodo,
      ciclo:    this.rnLabelCiclo,
      nivel:    this.rnLabelMalla,
      paralelo: this.rnLabelParalelo
    };

    this.reporteNotasService.exportarExcel(this.rnSelectedMalla, this.rnSelectedParalelo, meta).subscribe({
      next:  () => { this._toast('success', 'Excel generado', 'Reporte de Notas descargado'); this.loadingReporteNotasExcel = false; },
      error: (err) => { this._toast('error', 'Error', err?.message ?? 'No se pudo generar el Reporte de Notas'); this.loadingReporteNotasExcel = false; }
    });
  }

  // ─── Notas Detalladas por Materia ─────────────────────────────────────────

  generarNotasDetalladasExcel(): void {
    if (!this.ndSelectedPeriodo || !this.ndSelectedCiclo || !this.ndSelectedMalla || !this.ndSelectedParalelo) {
      this._toast('warn', 'Campos requeridos', 'Debe seleccionar periodo, ciclo, nivel y paralelo.');
      return;
    }

    this.loadingNotasDetalladasExcel = true;

    const meta = {
      periodo:  this.ndLabelPeriodo,
      ciclo:    this.ndLabelCiclo,
      nivel:    this.ndLabelMalla,
      paralelo: this.ndLabelParalelo
    };

    this.notasReporte.exportarNotasDetalladasExcel(this.ndSelectedMalla, this.ndSelectedParalelo, meta).subscribe({
      next:  () => { this._toast('success', 'Excel generado', 'Notas detalladas descargadas'); this.loadingNotasDetalladasExcel = false; },
      error: (err) => { this._toast('error', 'Error', err?.message ?? 'No se pudo generar el reporte de notas detalladas'); this.loadingNotasDetalladasExcel = false; }
    });
  }

  // ─── Helper toast ─────────────────────────────────────────────────────────
  private _toast(severity: string, summary: string, detail: string): void {
    this.messageService.add({ severity, summary, detail, life: 4000 });
  }
}
