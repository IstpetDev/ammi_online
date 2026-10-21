import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { PostulacionService, PaginatedPostulacionesResponse } from '../../../../core/services/postulaciones/postulacion.service';
import { PostulacionFlatDTO, CicloDTO, PeriodoLectivoDTO, MallaDTO, TipoEstadoAprobacionDTO } from '../../../../data/models/Entities';
import { CicloService } from '../../../../core/services/postulaciones/ciclo.service';
import { PeriodoLectivoService } from '../../../../core/services/postulaciones/periodo-lectivo.service';
import { MallaService } from '../../../../core/services/infrastructure/malla.service';
import { TipoEstadoAprobacionService } from '../../../../core/services/postulaciones/tipo-estado-aprovacion.service';
import { CustomSelectComponent } from '../../../../shared/custom-select/custom-select.component';
import { SharedTableComponent, TableColumn, SharedTableColTemplateDirective } from '../../../../shared/shared-table/shared-table.component';
import { SharedEmptyStateComponent } from '../../../../shared/shared-empty-state/shared-empty-state.component';
import { SharedDrawerComponent } from '../../../../shared/shared-drawer/shared-drawer.component';
import { PostulacionesStateService } from '../postulaciones-state.service';
import { SharedToastComponent } from '../../../../shared/shared-toast/shared-toast.component';
import { AuthService } from '../../../../core/auth/index';

@Component({
  selector: 'app-manage-postulations',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomSelectComponent, SharedTableComponent, SharedTableColTemplateDirective,
    SharedEmptyStateComponent, SharedDrawerComponent, SharedToastComponent],
  providers: [MessageService],
  templateUrl: './manage-postulations.component.html',
  styleUrls: ['./manage-postulations.component.css']
})
export class ManagePostulationsComponent implements OnInit, OnDestroy {

  postulaciones: PostulacionFlatDTO[] = [];
  loading: boolean = false;
  totalRecords: number = 0;

  periodos: PeriodoLectivoDTO[] = [];
  ciclos: CicloDTO[] = [];
  todosLosCiclos: CicloDTO[] = [];
  cursos: MallaDTO[] = [];
  estados: TipoEstadoAprobacionDTO[] = [];

  filtroPeriodoId: number | null = null;
  filtroCicloId: number | null = null;
  filtroCursoId: number | null = null;
  filtroEstadoId: number | null = null;
  filtroSearch: string = '';
  private searchDebounceTimer: any = null;

  mostrarModalCambioCiclo: boolean = false;
  postulacionSeleccionada: PostulacionFlatDTO | null = null;
  ciclosActivos: CicloDTO[] = [];
  cicloSeleccionadoId: number | null = null;
  mallasDisponibles: MallaDTO[] = [];
  mallaSeleccionadaId: number | null = null;

  tableColumns: TableColumn[] = [
    { field: 'documento', header: 'Documento', width: '140px' },
    { field: 'nombreCompleto', header: 'Nombre Completo' },
    { field: 'edad', header: 'Edad', width: '70px', align: 'center' },
    { field: 'cicloActivoDetalle', header: 'Ciclo' },
    { field: 'mallaDetalle', header: 'Curso' },
    { field: 'requisitosPendientes', header: 'Requisitos', width: '230px', align: 'center' },
    { field: 'estadoDetalle', header: 'Estado', width: '130px', align: 'center' },
    { field: 'acciones', header: 'Acciones', width: '110px', align: 'center' }
  ];

  private readonly stateService = inject(PostulacionesStateService);
  private readonly authService = inject(AuthService);

  get esSecretaria(): boolean {
    const user = this.authService.getCurrentUser();
    const roles = user?.roles.map(r => r.nombre) || [];
    return roles.includes('SECRETARIA-GENERAL') || roles.includes('SECRETARIA');
  }

  constructor(
    private postulacionService: PostulacionService,
    private cicloService: CicloService,
    private periodoService: PeriodoLectivoService,
    private mallaService: MallaService,
    private tipoEstadoService: TipoEstadoAprobacionService,
    private messageService: MessageService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadCiclosActivos();
  }

  ngOnDestroy(): void {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
  }

  onSearchInput(): void {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
    this.searchDebounceTimer = setTimeout(() => {
      this.loadData(1, 10);
    }, 350);
  }

  limpiarSearch(): void {
    if (this.filtroSearch) {
      this.filtroSearch = '';
      this.loadData(1, 10);
    }
  }

  private ordenarCursos(cursos: MallaDTO[]): MallaDTO[] {
    return [...(cursos || [])].sort((a, b) => {
      const ordenA = a.ordenCurso ?? Number.MAX_SAFE_INTEGER;
      const ordenB = b.ordenCurso ?? Number.MAX_SAFE_INTEGER;
      if (ordenA !== ordenB) return ordenA - ordenB;
      return (a.detalle || '').toLowerCase().localeCompare((b.detalle || '').toLowerCase());
    });
  }

  loadData(page: number, size: number): void {
    if (!this.filtroCicloId || this.filtroCicloId <= 0) {
      this.postulaciones = [];
      this.totalRecords = 0;
      this.loading = false;
      return;
    }

    this.loading = true;
    const idCiclo = this.filtroCicloId;
    const idMalla = this.filtroCursoId ?? 0;
    const idEstado = this.filtroEstadoId ?? 0;

    this.postulacionService.getAllPostulaciones(page, size, idCiclo, idMalla, undefined, undefined, idEstado, this.filtroSearch).subscribe({
      next: (response: PaginatedPostulacionesResponse) => {
        this.postulaciones = ((response.items as any[]) || []).map((item: any) => ({
          ...item,
          idPostulacion: item.idPostulacion ?? 0,
          primerNombre: item.primerNombre ?? '',
          segundoNombre: item.segundoNombre ?? '',
          primerApellido: item.primerApellido ?? '',
          segundoApellido: item.segundoApellido ?? '',
          documento: item.documento ?? '',
          fechaNacimiento: item.fechaNacimiento,
          mallaDetalle: (item.mallaDetalle && item.mallaDetalle.trim()) ? item.mallaDetalle : 'Curso por definir',
          cursoDetalle: item.cursoDetalle ?? '',
          tipoOfertaDetalle: item.tipoOfertaDetalle ?? '',
          estadoDetalle: item.estadoDetalle ?? '',
          cicloActivoDetalle: (item.cicloActivoDetalle && item.cicloActivoDetalle.trim()) ? item.cicloActivoDetalle : 'Ciclo lectivo por definir',
          tieneRequisitosPendientes: item.tieneRequisitosPendientes ?? false,
          estadoRequisitos: item.estadoRequisitos ?? '',
          totalRequisitosObligatorios: item.totalRequisitosObligatorios ?? 0,
          totalSubidosSinRevisar: item.totalSubidosSinRevisar ?? 0,
          totalSubidosAprobados: item.totalSubidosAprobados ?? 0,
          totalSubidosRechazados: item.totalSubidosRechazados ?? 0,
          totalRequisitosPendientes: item.totalRequisitosPendientes ?? (item.requisitosPendientesNombres ? item.requisitosPendientesNombres.length : (item.tieneRequisitosPendientes ? 1 : 0)),
          requisitosPendientesNombres: item.requisitosPendientesNombres ?? [],
          observacionesRevision: item.observacionesRevision ?? '',
          matriculaPagada: item.matriculaPagada ?? false,
          tieneMatriculaGenerada: item.tieneMatriculaGenerada ?? false,
          estadoPagoMatricula: item.estadoPagoMatricula ?? (item.matriculaPagada ? 'PAGADO' : 'SIN_PAGO'),
          montoTotalMatricula: item.montoTotalMatricula ?? 0,
          saldoPendienteMatricula: item.saldoPendienteMatricula ?? 0,
          montoPagadoMatricula: item.montoPagadoMatricula ?? 0,
          nombreCompleto: `${item.primerNombre ?? ''} ${item.segundoNombre ?? ''} ${item.primerApellido ?? ''} ${item.segundoApellido ?? ''}`.trim(),
          edad: this.calcularEdad(item.fechaNacimiento)
        } as PostulacionFlatDTO & { nombreCompleto: string; edad: string }));
        this.totalRecords = response.totalCount || (response.items ? response.items.length : 0);
        this.loading = false;
      },
      error: () => {
        this.postulaciones = [];
        this.totalRecords = 0;
        this.loading = false;
      }
    });
  }

  loadCiclosActivos(): void {
    this.cicloService.getAll().subscribe({
      next: (data: CicloDTO[]) => {
        this.todosLosCiclos = data;
        this.ciclosActivos = data.filter(c => c.esActivo == true);
        this.loadFiltros();
      },
      error: () => { this.loadFiltros(); }
    });
  }

  loadFiltros(): void {
    this.periodoService.getPeriodosLectivos().subscribe({
      next: (data) => {
        this.periodos = data;
        if (data.length > 0) {
          const hoy = new Date();
          const periodoActual = data.find(p =>
            p.fechaInicioEstimada && p.fechaFinEstimada &&
            new Date(p.fechaInicioEstimada) <= hoy &&
            new Date(p.fechaFinEstimada) >= hoy
          );
          this.filtroPeriodoId = (periodoActual ?? data[0]).idPeriodoLectivo!;
          this.onPeriodoChange();
        }
      },
      error: () => {}
    });
    this.mallaService.getAll().subscribe({
      next: (data) => { this.cursos = this.ordenarCursos(data || []); },
      error: () => {}
    });
    this.tipoEstadoService.getEstadosPostulacion().subscribe({
      next: (data) => {
        let list = data || [];
        if (this.esSecretaria) {
          list = list.filter(e => e.idTipoEstadoAprobacion !== 8 && (e.detalle || '').toUpperCase() !== 'CONTACTO PERSONA');
        }
        this.estados = list;
      },
      error: () => {}
    });
  }

  limpiarFiltros(): void {
    this.filtroPeriodoId = null;
    this.filtroCicloId = null;
    this.filtroCursoId = null;
    this.filtroEstadoId = null;
    this.filtroSearch = '';
    this.ciclos = [];
    this.mallaService.getAll().subscribe({
      next: (data) => { this.cursos = this.ordenarCursos(data || []); },
      error: () => {}
    });
    this.loadData(1, 10);
  }

  onPeriodoChange(): void {
    this.filtroCicloId = null;
    this.filtroCursoId = null;
    this.ciclos = [];
    if (this.filtroPeriodoId) {
      this.ciclos = this.todosLosCiclos.filter(
        c => c.idPeriodo === this.filtroPeriodoId && c.esActivo === true
      );
      if (this.ciclos.length > 0) {
        this.filtroCicloId = this.ciclos[0].idCiclo!;
      }
    }
    if (this.filtroCicloId) {
      this.mallaService.getByCiclo(this.filtroCicloId).subscribe({
        next: (data) => { this.cursos = this.ordenarCursos(data || []); },
        error: () => {}
      });
    } else {
      this.mallaService.getAll().subscribe({
        next: (data) => { this.cursos = this.ordenarCursos((data || []).filter(m => m.tieneDetalleMalla !== false)); },
        error: () => {}
      });
    }
    this.onFiltroChange();
  }

  onCicloChange(): void {
    this.filtroCursoId = null;
    if (this.filtroCicloId) {
      this.mallaService.getByCiclo(this.filtroCicloId).subscribe({
        next: (data) => { this.cursos = this.ordenarCursos(data || []); },
        error: () => {}
      });
    } else {
      this.mallaService.getAll().subscribe({
        next: (data) => { this.cursos = this.ordenarCursos(data || []); },
        error: () => {}
      });
    }
    this.onFiltroChange();
  }

  verDetalles(postulacion: PostulacionFlatDTO): void {
    if (postulacion.documento) {
      this.router.navigate(['/dashboard/postulacion', postulacion.documento]);
    } else {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo determinar el documento de la postulación' });
    }
  }

  irAPagos(postulacion: PostulacionFlatDTO): void {
    if (postulacion.documento) {
      this.router.navigate(['/dashboard/pagos'], { queryParams: { documento: postulacion.documento } });
    } else {
      this.router.navigate(['/dashboard/pagos']);
    }
  }

  onFiltroChange(): void {
    this.loadData(1, 10);
  }

  onLazyLoad(event: { page: number; rows: number }): void {
    this.loadData(event.page, event.rows);
  }

  abrirModalCambiarCiclo(postulacion: PostulacionFlatDTO): void {
    this.postulacionSeleccionada = postulacion;
    this.cicloSeleccionadoId = null;
    this.mallaSeleccionadaId = null;
    this.mallasDisponibles = [];

    const cicloActualDetalle = (postulacion.cicloActivoDetalle || '').toUpperCase();
    const modalidadKeywords = [
      'FORMAL VIRTUAL', 'EXTRAORDINARIO VIRTUAL',
      'ACELERADO', 'EXTRAORDINARIO', 'FORMAL', 'VIRTUAL', 'NOCTURNO', 'INTENSIVO'
    ];
    const modalidadActual = modalidadKeywords.find(kw => cicloActualDetalle.includes(kw));

    this.ciclosActivos = this.todosLosCiclos.filter(c => {
      if (!c.esActivo) return false;
      if (modalidadActual) return (c.detalle || '').toUpperCase().includes(modalidadActual);
      return true;
    });

    this.mostrarModalCambioCiclo = true;
  }

  cerrarModalCambioCiclo(): void {
    this.mostrarModalCambioCiclo = false;
    this.postulacionSeleccionada = null;
    this.cicloSeleccionadoId = null;
    this.mallaSeleccionadaId = null;
    this.mallasDisponibles = [];
  }

  onCicloSeleccionadoChange(): void {
    this.mallaSeleccionadaId = null;
    this.mallasDisponibles = [];
    if (this.cicloSeleccionadoId) {
      this.mallaService.getByCiclo(this.cicloSeleccionadoId).subscribe({
        next: (data: MallaDTO[]) => { this.mallasDisponibles = this.ordenarCursos(data || []); },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las mallas disponibles' });
        }
      });
    }
  }

  confirmarCambioCiclo(): void {
    if (!this.postulacionSeleccionada || !this.mallaSeleccionadaId) return;
    this.postulacionService.updateMalla(this.postulacionSeleccionada.idPostulacion!, this.mallaSeleccionadaId).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'La malla ha sido actualizada correctamente' });
        this.cerrarModalCambioCiclo();
        this.onFiltroChange();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar la malla' });
      }
    });
  }

  calcularEdad(fechaNacimiento: string | undefined): string {
    if (!fechaNacimiento) return 'N/A';
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
    return edad.toString();
  }

  crearNuevaPostulacion(): void {
    this.stateService.openDrawer();
  }

  gestionarCursos(): void {
    this.router.navigate(['/dashboard/configurar-cursos-postulacion']);
  }

  trackById(_index: number, item: any): any {
    return item.idPostulacion ?? item.id ?? _index;
  }
}
