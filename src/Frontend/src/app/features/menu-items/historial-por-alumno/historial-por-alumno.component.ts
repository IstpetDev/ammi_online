import { Component, inject, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { PagoService } from '../../../core/services/pagos/pago.service';
import { CicloService } from '../../../core/services/postulaciones/ciclo.service';
import { PeriodoLectivoService } from '../../../core/services/postulaciones/periodo-lectivo.service';
import { MallaService } from '../../../core/services/infrastructure/malla.service';
import { CursoService } from '../../../core/services/infrastructure/curso.service';
import { CicloDTO, PeriodoLectivoDTO, MallaDTO } from '../../../data/models/Entities';
import { ResumenAlumnoContabilidad } from '../../../shared/models/pagos.model';
import { CustomSelectComponent } from '../../../shared/custom-select/custom-select.component';
import { SharedEmptyStateComponent } from '../../../shared/shared-empty-state/shared-empty-state.component';
import { SharedHeaderComponent } from '../../../shared/shared-header/shared-header.component';
import { SharedTableComponent, SharedTableColTemplateDirective } from '../../../shared/shared-table/shared-table.component';
import { SharedToastComponent } from '../../../shared/shared-toast/shared-toast.component';
import { ToastService } from '../../../shared/toast.service';

@Component({
  selector: 'app-historial-por-alumno',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CustomSelectComponent,
    SharedEmptyStateComponent,
    SharedHeaderComponent,
    SharedTableComponent,
    SharedTableColTemplateDirective,
    SharedToastComponent
  ],
  templateUrl: './historial-por-alumno.component.html',
  styleUrls: ['./historial-por-alumno.component.css']
})
export class HistorialPorAlumnoComponent implements OnInit {
  private pagoService = inject(PagoService);
  private cicloService = inject(CicloService);
  private periodoService = inject(PeriodoLectivoService);
  private mallaService = inject(MallaService);
  private cursoService = inject(CursoService);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  loading = false;
  data: ResumenAlumnoContabilidad[] = [];

  periodos: PeriodoLectivoDTO[] = [];
  todosLosCiclos: CicloDTO[] = [];
  ciclos: CicloDTO[] = [];
  cursos: { label: string; value: number }[] = [];
  mallasDelCiclo: MallaDTO[] = [];

  filtroPeriodoId: number | null = null;
  filtroCicloId: number | null = null;
  filtroCursoId: number | null = null;
  searchValue = '';

  tablaColumnas = [
    { field: 'documento', header: 'Cédula', width: '12rem', sortable: true },
    { field: 'nombreCompleto', header: 'Estudiante', width: '16rem', sortable: true },
    { field: 'nombreCiclo', header: 'Ciclo', width: '10rem', sortable: true },
    { field: 'nombreCurso', header: 'Curso', width: '12rem', sortable: true },
    { field: 'saldoPendiente', header: 'Saldo Pendiente', width: '12rem', sortable: true, align: 'right' as const },
    { field: 'saldoAprobado', header: 'Saldo Aprobado', width: '12rem', sortable: true, align: 'right' as const },
    { field: 'saldoPendienteAprobacion', header: 'Pendiente Aprobación', width: '12rem', sortable: true, align: 'right' as const }
  ];

  currentPage = 1;
  filasPorPagina = 10;

  ngOnInit(): void {
    this.cargarDatosIniciales();
  }

  cargarDatosIniciales(): void {
    this.loading = true;
    forkJoin({
      periodos: this.periodoService.getPeriodosLectivos(),
      ciclos: this.cicloService.getAll()
    }).subscribe({
      next: ({ periodos, ciclos }) => {
        this.periodos = periodos || [];
        this.todosLosCiclos = ciclos || [];
        this.loading = false;

        if (this.periodos.length > 0) {
          this.filtroPeriodoId = this.periodos[0].idPeriodoLectivo!;
          this.onPeriodoChange();
        } else {
          this.cargarDatos();
        }
      },
      error: (err) => {
        console.error('Error al cargar datos iniciales:', err);
        this.toastService.showError('No se pudieron cargar los datos iniciales', 'Error');
        this.loading = false;
      }
    });
  }

  onPeriodoChange(): void {
    this.filtroCicloId = null;
    this.filtroCursoId = null;
    this.ciclos = [];
    this.cursos = [];
    if (this.filtroPeriodoId) {
      this.ciclos = this.todosLosCiclos.filter(c => c.idPeriodo === this.filtroPeriodoId && c.esActivo === true);
      if (this.ciclos.length > 0) {
        this.filtroCicloId = this.ciclos[0].idCiclo!;
        this.onCicloChange();
      }
    }
  }

  onCicloChange(): void {
    this.filtroCursoId = null;
    this.cursos = [];
    if (this.filtroCicloId) {
      this.mallaService.getByCiclo(this.filtroCicloId).subscribe({
        next: (mallas) => {
          this.mallasDelCiclo = mallas;
          const cursoIds = [...new Set(mallas.map(m => m.idCursos).filter(id => id != null))];
          if (cursoIds.length > 0) {
            this.cursoService.getAll().subscribe({
              next: (todosCursos) => {
                this.cursos = todosCursos
                  .filter(c => cursoIds.includes(c.idCursos!))
                  .map(c => ({ label: c.detalle || `Curso #${c.idCursos}`, value: c.idCursos! }));
                this.cargarDatos();
              },
              error: () => this.cargarDatos()
            });
          } else {
            this.cargarDatos();
          }
        },
        error: () => this.cargarDatos()
      });
    } else {
      this.cargarDatos();
    }
  }

  onCursoChange(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    if (!this.filtroCicloId) {
      this.data = [];
      return;
    }

    this.loading = true;
    this.ngZone.run(() => { this.data = []; });

    this.pagoService.getResumenAlumnosContabilidad({
      idCiclo: this.filtroCicloId,
      idCurso: this.filtroCursoId,
      documento: null
    }).subscribe({
      next: (resultados) => {
        this.ngZone.run(() => { this.data = resultados; });
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar resumen:', err);
        this.toastService.showError('No se pudieron cargar los datos', 'Error');
        this.loading = false;
      }
    });
  }

  filteredData(): ResumenAlumnoContabilidad[] {
    if (!this.searchValue.trim()) return this.data;
    const term = this.searchValue.toLowerCase().trim();
    return this.data.filter(d =>
      d.documento.toLowerCase().includes(term) ||
      d.nombreCompleto.toLowerCase().includes(term) ||
      d.nombreCurso.toLowerCase().includes(term) ||
      d.nombreCiclo.toLowerCase().includes(term)
    );
  }

  onPageChange(event: { page: number; rows: number }): void {
    this.currentPage = event.page;
    this.filasPorPagina = event.rows;
  }

  clearFilters(): void {
    this.searchValue = '';
    this.filtroPeriodoId = null;
    this.filtroCicloId = null;
    this.filtroCursoId = null;
    this.ciclos = [];
    this.cursos = [];
    this.data = [];
  }
}
