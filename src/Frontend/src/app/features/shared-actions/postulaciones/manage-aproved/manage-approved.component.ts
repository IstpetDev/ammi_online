import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { forkJoin, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { MallaParaleloService } from '../../../../core/services/infrastructure/malla-paralelo.service';
import { ParaleloService } from '../../../../core/services/infrastructure/paralelo.service';
import { MatriculaService } from '../../../../core/services/postulaciones/matricula.service';

import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AuthService } from '../../../../core/auth/index';
import { API_BASE_URL } from '../../../../core/constants/app.constants';
import { CicloService } from '../../../../core/services/postulaciones/ciclo.service';
import { FotoPerfilService } from '../../../../core/services/postulaciones/foto-perfil.service';
import { PeriodoLectivoService } from '../../../../core/services/postulaciones/periodo-lectivo.service';
import { MallaService } from '../../../../core/services/infrastructure/malla.service';
import { CicloDTO, MallaDTO, MallaParaleloDTO, MatriculaDTO, ParaleloDTO, PeriodoLectivoDTO } from '../../../../data/models/Entities';
import { StudentPanelDialogComponent } from '../manage-approved/student-panel-dialog/student-panel-dialog.component';
import { CustomSelectComponent } from '../../../../shared/custom-select/custom-select.component';
import { SharedEmptyStateComponent } from '../../../../shared/shared-empty-state/shared-empty-state.component';
import { SharedTableComponent, TableColumn, SharedTableColTemplateDirective } from '../../../../shared/shared-table/shared-table.component';
import { SharedDrawerComponent } from '../../../../shared/shared-drawer/shared-drawer.component';
import { SharedToastComponent } from '../../../../shared/shared-toast/shared-toast.component';

@Component({
  selector: 'app-manage-approved',
  standalone: true,
  imports: [CommonModule,
    FormsModule,
    ButtonModule,
    StudentPanelDialogComponent,
    CustomSelectComponent,
    SharedEmptyStateComponent,
    SharedTableComponent,
    SharedTableColTemplateDirective,
    SharedDrawerComponent, SharedToastComponent],
  providers: [MessageService],
  templateUrl: './manage-approved.component.html',
  styleUrls: ['./manage-approved.component.css']
})
export class ManageApprovedComponent implements OnInit, OnDestroy {

  matriculas: MatriculaDTO[] = [];
  paralelos: ParaleloDTO[] = [];
  todosLosCiclos: CicloDTO[] = [];
  ciclos: CicloDTO[] = [];
  mallas: MallaDTO[] = [];
  estudiantesFotos: { [id: number]: { url?: string, isPdf?: boolean, safeUrl?: SafeResourceUrl } } = {};
  showLargeProfile: { [id: number]: boolean } = {};

  periodos: PeriodoLectivoDTO[] = [];

  filtroPeriodoId: number | null = null;
  filtroCicloId: number | null = null;
  filtroCursoId: number | null = null;
  filtroNombre: string = '';

  currentPage: number = 1;
  pageSize: number = 10;
  totalRecords: number = 0;
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  loading = false;
  loadingMatriculas = false;

  showEditDialog = false;
  editingMatricula: MatriculaDTO | null = null;
  mallaParalelosEdicion: MallaParaleloDTO[] = [];
  loadingParalelosEdicion = false;
  editForm: {
    idMallaParalelo: number | undefined;
    idEstadoMatricula: number;
  } = {
      idMallaParalelo: undefined,
      idEstadoMatricula: 1
    };
  saving = false;

  showStudentPanel = false;
  selectedMatriculaForPanel: MatriculaDTO | null = null;

  tableColumns: TableColumn[] = [
    { field: 'documento', header: 'Documento', width: '160px' },
    { field: 'nombreCompleto', header: 'Nombre Completo' },
    { field: 'curso', header: 'Curso' },
    { field: 'paralelo', header: 'Paralelo' },
    { field: 'estado', header: 'Estado', width: '120px', align: 'center' },
    { field: 'tipoOferta', header: 'Tipo Oferta' },
    { field: 'ciclo', header: 'Ciclo' },
    { field: 'acciones', header: 'Acciones', width: '120px', align: 'center' }
  ];

  constructor(
    private matriculaService: MatriculaService,
    private paraleloService: ParaleloService,
    private mallaParaleloService: MallaParaleloService,
    private cicloService: CicloService,
    private mallaService: MallaService,
    private periodoService: PeriodoLectivoService,
    private messageService: MessageService,
    private fotoPerfilService: FotoPerfilService,
    private sanitizer: DomSanitizer,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.searchSubject.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.currentPage = 1;
      this.loadData(1);
    });

    this.cargarDatosIniciales();

    const currentUser = this.authService.getCurrentUser();
    const userRoles = currentUser?.roles.map(r => r.nombre) || [];
    const isSecretaria = userRoles.includes('SECRETARIA-GENERAL') || userRoles.includes('SECRETARIA');
    if (isSecretaria) {
      this.tableColumns = this.tableColumns.filter(col => col.field !== 'acciones');
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(page: number = 1): void {
    this.currentPage = page;
    this.loadingMatriculas = true;
    this.matriculas = [];
    this.totalRecords = 0;

    const idCiclo = this.filtroCicloId ?? undefined;
    if (!idCiclo) {
      this.loadingMatriculas = false;
      return;
    }

    const documentoNombre = this.filtroNombre ? this.filtroNombre.trim() : undefined;
    const idMalla = this.filtroCursoId ?? undefined;

    this.matriculaService.getAllMatriculasPaginated(this.pageSize, this.currentPage, idCiclo, undefined, documentoNombre, idMalla).subscribe({
      next: (res) => {
        this.matriculas = res.items || [];
        this.totalRecords = res.totalCount || 0;
        this.cargarFotosEstudiantes();
        this.loadingMatriculas = false;
      },
      error: (err) => {
        console.error('Error cargando matrículas:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las matrículas'
        });
        this.matriculas = [];
        this.totalRecords = 0;
        this.loadingMatriculas = false;
      }
    });
  }

  onSearchInput(value: string): void {
    this.filtroNombre = value;
    this.searchSubject.next(value);
  }

  limpiarBusqueda(): void {
    this.filtroNombre = '';
    this.currentPage = 1;
    this.loadData(1);
  }

  cargarDatosIniciales(): void {
    this.loading = true;
    forkJoin({
      periodos: this.periodoService.getPeriodosLectivos(),
      paralelos: this.paraleloService.getAllParalelos(),
      ciclos: this.cicloService.getAll()
    }).subscribe({
      next: ({ periodos, paralelos, ciclos }) => {
        this.periodos = periodos || [];
        this.paralelos = paralelos || [];
        this.todosLosCiclos = ciclos || [];
        this.loading = false;

        if (this.periodos.length > 0) {
          const hoy = new Date();
          const periodoActual = this.periodos.find(p =>
            p.fechaInicioEstimada && p.fechaFinEstimada &&
            new Date(p.fechaInicioEstimada) <= hoy &&
            new Date(p.fechaFinEstimada) >= hoy
          );
          this.filtroPeriodoId = (periodoActual ?? this.periodos[0]).idPeriodoLectivo!;
          this.ciclos = this.todosLosCiclos.filter(
            c => c.idPeriodo === this.filtroPeriodoId && c.esActivo === true
          );
          if (this.ciclos.length > 0) {
            this.filtroCicloId = this.ciclos[0].idCiclo!;
            this.onCicloChange();
          } else {
            this.loadData(1);
          }
        }
      },
      error: (err) => {
        console.error('Error cargando datos iniciales:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los datos iniciales'
        });
        this.loading = false;
      }
    });
  }

  onPeriodoChange(): void {
    this.currentPage = 1;
    this.filtroCicloId = null;
    this.filtroCursoId = null;
    this.ciclos = [];
    this.mallas = [];
    if (this.filtroPeriodoId) {
      this.ciclos = this.todosLosCiclos.filter(
        c => c.idPeriodo === this.filtroPeriodoId && c.esActivo === true
      );
      if (this.ciclos.length > 0) {
        this.filtroCicloId = this.ciclos[0].idCiclo!;
        this.onCicloChange();
        return;
      }
    }
    this.loadData(1);
  }

  onCicloChange(): void {
    this.currentPage = 1;
    this.filtroCursoId = null;
    this.mallas = [];
    if (this.filtroCicloId) {
      this.mallaService.getByCiclo(this.filtroCicloId).subscribe({
        next: (data) => { this.mallas = this.ordenarCursos(data || []); },
        error: () => { }
      });
    }
    this.loadData(1);
  }

  onFiltroChange(): void {
    this.currentPage = 1;
    this.loadData(1);
  }

  private ordenarCursos(cursos: MallaDTO[]): MallaDTO[] {
    return [...(cursos || [])].sort((a, b) => {
      const ordenA = a.ordenCurso ?? Number.MAX_SAFE_INTEGER;
      const ordenB = b.ordenCurso ?? Number.MAX_SAFE_INTEGER;
      if (ordenA !== ordenB) return ordenA - ordenB;
      return (a.detalle || '').toLowerCase().localeCompare((b.detalle || '').toLowerCase());
    });
  }

  limpiarFiltros(): void {
    this.currentPage = 1;
    this.filtroPeriodoId = null;
    this.filtroCicloId = null;
    this.filtroCursoId = null;
    this.filtroNombre = '';
    this.ciclos = [];
    this.matriculas = [];
    this.totalRecords = 0;
    this.mallas = [];
    this.loadData(1);
  }

  private normalizarTexto(texto: string | undefined | null): string {
    return (texto || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  get matriculasFiltradas(): MatriculaDTO[] {
    return this.matriculas;
  }

  onLazyLoad(event: { page: number; rows: number }): void {
    this.currentPage = event.page;
    this.pageSize = event.rows;
    this.loadData(this.currentPage);
  }

  openStudentPanel(matricula: MatriculaDTO): void {
    this.selectedMatriculaForPanel = matricula;
    this.showStudentPanel = true;
  }

  recargarMatriculas(): void {
    this.loadData();
  }

  getEstadoLabel(matricula: MatriculaDTO): string {
    const detalle = (matricula as any)?.detalleEstado;
    if (detalle) return detalle;
    const completado = (matricula as any)?.estadoCompletado;
    if (typeof completado === 'boolean') return completado ? 'Matricula Aprobada' : 'Matricula en Curso';
    return matricula.esFinalizada ? 'Matricula Aprobada' : 'Matricula en Curso';
  }

  cargarFotosEstudiantes(): void {
    this.matriculas.forEach(m => {
      const id = m.idUsuarioAlumno;
      if (id && !this.estudiantesFotos[id]) {
        if (m.pathFoto) {
          const rawUrl = `${API_BASE_URL}/${m.pathFoto}?t=${new Date().getTime()}`;
          const isPdf = rawUrl.toLowerCase().includes('.pdf');
          this.estudiantesFotos[id] = {
            url: rawUrl,
            isPdf: isPdf,
            safeUrl: this.sanitizer.bypassSecurityTrustResourceUrl(rawUrl)
          };
        } else {
          this.estudiantesFotos[id] = { url: undefined };
        }
      }
    });
  }

  // === Edicion ===

  editarMatricula(matricula: MatriculaDTO): void {
    this.editingMatricula = matricula;
    this.editForm = {
      idMallaParalelo: undefined,
      idEstadoMatricula: matricula.esFinalizada ? 2 : 1
    };
    this.mallaParalelosEdicion = [];
    if (matricula.idMalla) {
      this.loadingParalelosEdicion = true;
      this.mallaParaleloService.getByMalla(matricula.idMalla).subscribe({
        next: (data) => {
          this.mallaParalelosEdicion = (data || []).filter(mp => mp.esActivo).map(mp => ({
            ...mp,
            detalle: `Paralelo ${mp.nombreParalelo} (Cupo: ${mp.cupoMaximo})`
          }));
          this.loadingParalelosEdicion = false;
        },
        error: () => { this.loadingParalelosEdicion = false; }
      });
    }
    this.showEditDialog = true;
  }

  guardarEdicion(): void {
    if (!this.editingMatricula || !this.editingMatricula.idMatricula || !this.editingMatricula.idUsuarioAlumno || !this.editForm.idMallaParalelo) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Datos incompletos',
        detail: 'Debe seleccionar un paralelo'
      });
      return;
    }

    const updateData = {
      idMatricula: this.editingMatricula.idMatricula,
      idUsuarioAlumno: this.editingMatricula.idUsuarioAlumno,
      idMallaParalelo: this.editForm.idMallaParalelo,
      idEstadoMatricula: this.editForm.idEstadoMatricula
    };

    this.saving = true;
    this.matriculaService.actualizarMatricula(updateData).subscribe({
      next: () => {
        this.saving = false;
        this.showEditDialog = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Actualizado',
          detail: 'Matricula actualizada correctamente'
        });
        this.recargarMatriculas();
      },
      error: (err) => {
        this.saving = false;
        console.error('Error actualizando matricula:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo actualizar la matricula'
        });
      }
    });
  }

  cancelarEdicion(): void {
    this.showEditDialog = false;
    this.editingMatricula = null;
    this.mallaParalelosEdicion = [];
    this.editForm = {
      idMallaParalelo: undefined,
      idEstadoMatricula: 1
    };
  }

  get selectedIdPersonaForBenefits(): number | null {
    return this.selectedMatriculaForPanel?.idUsuarioAlumno ?? null;
  }

  get idCicloActual(): number | null {
    return this.selectedMatriculaForPanel?.idCiclo ?? this.filtroCicloId ?? null;
  }

  get idAprobadoPorActual(): number | null {
    return this.authService.getCurrentUser()?.id ?? null;
  }

  trackById(_index: number, item: any): any {
    return item.idMatricula ?? item.id ?? _index;
  }

  navigateToPostulaciones(): void {
    this.router.navigate(['/dashboard/postulaciones/manage-postulations']);
  }
}
