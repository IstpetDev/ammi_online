import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of, Subject, Subscription } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { VerDetallesComponent } from './ver-detalles/ver-detalles';
import { CreditoService } from '../../../core/services/pagos/credito.service';
import { PagoService } from '../../../core/services/pagos/pago.service';
import { MatriculaService } from '../../../core/services/postulaciones/matricula.service';
import { CicloService } from '../../../core/services/postulaciones/ciclo.service';
import { PeriodoLectivoService } from '../../../core/services/postulaciones/periodo-lectivo.service';
import { MatriculaDTO, MallaDTO, CicloDTO, PeriodoLectivoDTO, CreditoConDetallesDTO, EspecieDTO } from '../../../data/models/Entities';
import { MallaService } from '../../../core/services/infrastructure/malla.service';
import { EspecieService } from '../../../core/services/infrastructure/especie.service';
import { AuthService } from '../../../core/auth/auth.service';
import { PagoEstudiante, Especie, HistorialPago } from '../../../shared/models/pagos.model';
import { CustomSelectComponent } from '../../../shared/custom-select/custom-select.component';
import { SharedEmptyStateComponent } from '../../../shared/shared-empty-state/shared-empty-state.component';
import { SharedHeaderComponent } from '../../../shared/shared-header/shared-header.component';
import { SharedTableComponent, SharedTableColTemplateDirective } from '../../../shared/shared-table/shared-table.component';
import { SharedModalComponent } from '../../../shared/shared-modal/shared-modal.component';
import { SharedDrawerComponent } from '../../../shared/shared-drawer/shared-drawer.component';
import { ConfirmationModalComponent } from '../../../shared/modal-confirmation/confirmation-modal.component';
import { SharedToastComponent } from '../../../shared/shared-toast/shared-toast.component';
import { ToastService } from '../../../shared/toast.service';

@Component({
  selector: 'app-pagos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    VerDetallesComponent,
    CustomSelectComponent,
    SharedEmptyStateComponent,
    SharedHeaderComponent,
    SharedTableComponent,
    SharedTableColTemplateDirective,
    SharedModalComponent,
    SharedDrawerComponent,
    ConfirmationModalComponent,
    SharedToastComponent
  ],
  templateUrl: './pagos.component.html',
  styleUrls: ['./pagos.component.css']
})
export class PagosComponent implements OnInit, OnDestroy {
  private creditoService = inject(CreditoService);
  private pagoService = inject(PagoService);
  private mallaInfraService = inject(MallaService);
  private matriculaService = inject(MatriculaService);
  private cicloService = inject(CicloService);
  private periodoService = inject(PeriodoLectivoService);
  private especieService = inject(EspecieService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  /**
   * Asegura que los campos monetarios devueltos como Object{source, parsedValue} en el JSON 
   * puedan extraerse sin corromper el Frontend (NaN / Object text)
   */
  private parseMonto(val: any): number {
    if (val && typeof val === 'object' && val.parsedValue !== undefined) {
      return Number(val.parsedValue) || 0;
    }
    return Number(val) || 0;
  }

  private setTableLoading(value: boolean): void {
    this.ngZone.run(() => {
      this.loading = value;
      this.cdr.detectChanges();
    });
  }

  private setDetalleLoading(value: boolean): void {
    this.ngZone.run(() => {
      this.loadingDetalle = value;
      this.cdr.detectChanges();
    });
  }

  searchValue: string = '';
  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;
  private currentMatriculasSub?: Subscription;
  private currentProgresoSub?: Subscription;

  estudianteSeleccionado: PagoEstudiante | null = null;
  mostrarDetalle: boolean = false;
  loading: boolean = false;
  loadingDetalle: boolean = false;

  // Permisos de roles
  esAdmin: boolean = false;
  esSecretaria: boolean = false;
  puedeAsignarCostos: boolean = false;

  // Modal para ver observación
  mostrarModalObs: boolean = false;
  obsEstudianteNombre: string = '';
  obsContenido: string = '';

  // Drawer Asignar Costo Extra
  mostrarDrawerCostoExtra: boolean = false;
  alumnoCostoExtra: PagoEstudiante | null = null;
  catalogoExtras: EspecieDTO[] = [];
  especieSeleccionadaId: number | null = null;
  montoAsignacion: number | null = null;
  fechaLimiteAsignacion: string = '';
  observacionesAsignacion: string = '';
  guardandoAsignacion: boolean = false;
  cargandoHistorialAlumno: boolean = false;
  creditosExtrasAlumno: any[] = [];

  // Modal Nuevo Arancel en Catálogo
  mostrarModalNuevoCosto: boolean = false;
  nombreNuevoCosto: string = '';
  guardandoNuevoCosto: boolean = false;

  // Modal Confirmación Anular Arancel
  mostrarModalAnularCostoExtra: boolean = false;
  creditoAAnular: any = null;
  anulandoCreditoExtra: boolean = false;

  // Modal Asignación Masiva de Arancel
  mostrarModalAsignacionMasiva: boolean = false;
  masivoPeriodoId: number | null = null;
  masivoCiclos: CicloDTO[] = [];
  masivoCicloId: number | null = null;
  masivoCursos: MallaDTO[] = [];
  masivoCursosSeleccionados: { [idMalla: number]: boolean } = {};
  masivoSeleccionarTodosCursos: boolean = true;
  masivoEspecieId: number | null = null;
  masivoMonto: number | null = null;
  masivoFechaLimite: string = '';
  masivoObservaciones: string = '';
  guardandoAsignacionMasiva: boolean = false;
  cargandoCursosMasivo: boolean = false;

  // Modal Resultado de Asignación Masiva
  mostrarModalResultadoMasivo: boolean = false;
  resultadoMasivo: { totalMatriculasEvaluadas: number; totalAsignados: number; totalOmitidosDuplicados: number; mensaje: string } | null = null;

  abrirModalObservacion(pago: PagoEstudiante, event?: Event): void {
    if (event) event.stopPropagation();
    this.obsEstudianteNombre = pago.nombreEstudiante;
    this.obsContenido = pago.observaciones || 'Sin detalle de observación registrado.';
    this.mostrarModalObs = true;
  }

  cerrarModalObservacion(): void {
    this.mostrarModalObs = false;
  }

  // Datos de matrículas
  pagos: PagoEstudiante[] = [];
  mallasFiltradas: MallaDTO[] = [];
  loadingMatriculas: boolean = false;

  tablaColumnas = [
    { field: 'cedula', header: 'Cédula', width: '12rem', sortable: true },
    { field: 'nombreEstudiante', header: 'Estudiante', width: '14rem', sortable: true },
    { field: 'modalidad', header: 'Modalidad', width: '12rem', sortable: true },
    { field: 'progreso', header: 'Progreso', width: '12rem' },
    { field: 'detalleCiclo', header: 'Ciclo', width: '10rem', sortable: true },
    { field: 'acciones', header: 'Acciones', width: '7.5rem', align: 'center' as const }
  ];

  // Filtros
  periodos: PeriodoLectivoDTO[] = [];
  todosLosCiclos: CicloDTO[] = [];
  ciclos: CicloDTO[] = [];
  filtroPeriodoId: number | null = null;
  filtroCicloId: number | null = null;
  filtroCursoId: number | null = null;

  // Caché de progresos ya cargados (evita repetir peticiones)
  private progresoCache = new Map<number, { 
    totalDeuda: number; 
    totalPagado: number; 
    montoEnRevision?: number; 
    tienePagosEnRevision?: boolean;
    tieneObservaciones?: boolean;
    observaciones?: string;
  }>();

  // Control de paginación
  currentPage: number = 1;
  filasPorPagina: number = 10;
  totalRecords: number = 0;

  // Datos del API
  detallesCreditoAPI: any[] = [];

  modalidades = [
    { label: 'Formal virtual', value: 'Formal virtual' },
    { label: 'Acelerado', value: 'Acelerado' }
  ];

  estados = [
    { label: 'Pagado', value: 'Pagado' },
    { label: 'Parcial', value: 'Parcial' },
    { label: 'Pendiente', value: 'Pendiente' }
  ];

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    const roles = user?.roles.map(r => r.nombre) || [];
    this.esAdmin = roles.includes('ADMINISTRADOR') || roles.includes('ADMIN');
    this.esSecretaria = roles.includes('SECRETARIA-GENERAL');
    this.puedeAsignarCostos = this.esAdmin || this.esSecretaria;

    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(350),
      distinctUntilChanged()
    ).subscribe(() => {
      this.currentPage = 1;
      this.loadData();
    });

    this.cargarDatosIniciales();

    this.route.queryParams.subscribe(params => {
      const idMatriculaParam = params['idMatricula'];
      const documentoParam = params['documento'];
      if (idMatriculaParam || documentoParam) {
        this.verificarNavegacionDirecta(idMatriculaParam, documentoParam);
      }
    });
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
    this.currentMatriculasSub?.unsubscribe();
    this.currentProgresoSub?.unsubscribe();
  }

  /**
   * Si se navegó desde la aprobación de una postulación con un idMatricula o documento,
   * carga esa matrícula directamente y abre la barra lateral de gestionar pagos.
   */
  verificarNavegacionDirecta(idMatriculaParam?: string | null, documentoParam?: string | null): void {
    const idMat = idMatriculaParam ?? this.route.snapshot.queryParamMap.get('idMatricula');
    const doc = (documentoParam ?? this.route.snapshot.queryParamMap.get('documento'))?.trim();

    if (idMat) {
      const idMatricula = Number(idMat);
      if (idMatricula) {
        this.matriculaService.getById(idMatricula).subscribe({
          next: (matricula) => {
            if (matricula) {
              const pago = this.mapMatriculaToPagoEstudiante(matricula);
              this.verDetalle(pago);
            }
          },
          error: (err) => {
            console.error('Error al cargar matrícula directa:', err);
          }
        });
      }
    } else if (doc) {
      this.searchValue = doc;
      this.matriculaService.getAllMatriculasPaginated(10, 1, undefined, undefined, doc).subscribe({
        next: (res) => {
          if (res && res.items && res.items.length > 0) {
            const mat = res.items[0];
            const pago = this.mapMatriculaToPagoEstudiante(mat);
            this.verDetalle(pago);
          } else {
            this.loadData();
          }
        },
        error: (err) => {
          console.error('Error al buscar matrícula por documento:', err);
          this.loadData();
        }
      });
    }
  }

  cargarDatosIniciales(): void {
    this.setTableLoading(true);

    forkJoin({
      periodos: this.periodoService.getPeriodosLectivos(),
      ciclos: this.cicloService.getAll()
    }).subscribe({
      next: ({ periodos, ciclos }) => {
        this.periodos = periodos || [];
        this.todosLosCiclos = ciclos || [];
        this.setTableLoading(false);

        if (this.periodos.length > 0) {
          this.filtroPeriodoId = this.periodos[0].idPeriodoLectivo!;
          this.onPeriodoChange();
        } else {
          this.loadData();
        }
      },
      error: (err) => {
        console.error('Error al cargar datos iniciales:', err);
        this.toastService.showError('No se pudieron cargar los datos iniciales', 'Error');
        this.setTableLoading(false);
        this.loadData();
      }
    });
  }

  onPeriodoChange(): void {
    this.filtroCicloId = null;
    this.filtroCursoId = null;
    this.ciclos = [];
    this.mallasFiltradas = [];
    if (this.filtroPeriodoId) {
      this.ciclos = this.todosLosCiclos.filter(c => c.idPeriodo === this.filtroPeriodoId && c.esActivo === true);
      if (this.ciclos.length > 0) {
        this.filtroCicloId = this.ciclos[0].idCiclo!;
        this.onCicloChange();
        return;
      }
    }
    this.currentPage = 1;
    this.loadData();
  }

  onCicloChange(): void {
    this.filtroCursoId = null;
    this.mallasFiltradas = [];
    if (this.filtroCicloId) {
      this.mallaInfraService.getByCiclo(this.filtroCicloId).subscribe({
        next: (data) => {
          this.mallasFiltradas = this.ordenarCursos(data || []);
        },
        error: () => {}
      });
    }
    this.currentPage = 1;
    this.loadData();
  }

  onCursoChange(): void {
    this.currentPage = 1;
    this.loadData();
  }

  private ordenarCursos(cursos: MallaDTO[]): MallaDTO[] {
    return [...(cursos || [])].sort((a, b) => {
      const ordenA = a.ordenCurso ?? Number.MAX_SAFE_INTEGER;
      const ordenB = b.ordenCurso ?? Number.MAX_SAFE_INTEGER;
      if (ordenA !== ordenB) return ordenA - ordenB;
      return (a.detalle || '').toLowerCase().localeCompare((b.detalle || '').toLowerCase());
    });
  }

  onSearchInput(value: string): void {
    this.searchValue = value;
    this.searchSubject.next(value);
  }

  /**
   * Carga matrículas paginadas (10 por página) desde el backend aplicando ciclo y término de búsqueda
   */
  loadData(): void {
    this.currentMatriculasSub?.unsubscribe();
    this.currentProgresoSub?.unsubscribe();

    this.loadingMatriculas = true;
    const idCiclo = this.filtroCicloId ?? undefined;
    const idMalla = this.filtroCursoId ?? undefined;

    if (!idCiclo) {
      this.ngZone.run(() => {
        this.pagos = [];
        this.totalRecords = 0;
        this.loadingMatriculas = false;
      });
      return;
    }

    const searchTerm = this.searchValue ? this.searchValue.trim() : undefined;

    this.currentMatriculasSub = this.matriculaService.getAllMatriculasPaginated(
      this.filasPorPagina,
      this.currentPage,
      idCiclo,
      undefined,
      searchTerm,
      idMalla
    ).subscribe({
      next: (response) => {
        const pagosBase = response.items.map(m => ({
          ...this.mapMatriculaToPagoEstudiante(m),
          cargandoProgreso: true
        }));

        this.ngZone.run(() => {
          this.pagos = pagosBase;
          this.totalRecords = response.totalCount;
          this.loadingMatriculas = false;
        });

        this.cargarProgresoMatriculasActuales();
      },
      error: (err) => {
        console.error('Error cargando matrículas:', err);
        this.toastService.showError('No se pudieron cargar las matrículas', 'Error');
        this.ngZone.run(() => {
          this.pagos = [];
          this.totalRecords = 0;
          this.loadingMatriculas = false;
        });
      }
    });
  }

  /**
   * Evento cuando cambia la página o la cantidad de filas en la tabla
   */
  onPageChange(event: { page: number; rows: number }): void {
    this.currentPage = event.page;
    this.filasPorPagina = event.rows;
    this.loadData();
  }

  /**
   * Carga el progreso de los pagos de las matrículas actualmente devueltas
   */
  private cargarProgresoMatriculasActuales(): void {
    if (this.pagos.length === 0) return;

    const filasSinProgreso = this.pagos.filter(p => !this.progresoCache.has(p.idMatricula));

    // Aplicar inmediatamente los que ya están en caché
    this.pagos.forEach(pago => {
      const cached = this.progresoCache.get(pago.idMatricula);
      if (cached) {
        pago.totalDeuda = cached.totalDeuda;
        pago.totalPagado = cached.totalPagado;
        pago.montoEnRevision = cached.montoEnRevision;
        pago.tienePagosEnRevision = cached.tienePagosEnRevision;
        pago.tieneObservaciones = cached.tieneObservaciones;
        pago.observaciones = cached.observaciones;
        pago.cargandoProgreso = false;
      }
    });

    if (filasSinProgreso.length === 0) {
      this.cdr.detectChanges();
      return;
    }

    const requests = filasSinProgreso.map(pago =>
      forkJoin({
        creditos: this.creditoService.getCreditosConDetallesByMatricula(pago.idMatricula).pipe(catchError(() => of([]))),
        historial: this.pagoService.getHistorialPagos(pago.idMatricula).pipe(catchError(() => of({ isSuccess: false, data: [] })))
      })
    );

    this.currentProgresoSub = forkJoin(requests).subscribe({
      next: (resultados) => {
        resultados.forEach((res: any, index: number) => {
          const pago = filasSinProgreso[index];
          const creditos: CreditoConDetallesDTO[] = res.creditos || [];
          const historialResponse = res.historial;
          const historialData: any[] = (historialResponse?.isSuccess && historialResponse?.data) ? historialResponse.data : [];

          let totalDeuda = 0;
          let totalPagado = 0;
          let tienePagosEnRevision = false;
          let montoEnRevision = 0;
          let tieneObservaciones = false;
          let observaciones = '';

          // Revisar si en su historial hay pagos con observaciones
          const pagoConObs = historialData.find((p: any) => p.observaciones && p.observaciones.trim() !== '');
          if (pagoConObs) {
            tieneObservaciones = true;
            observaciones = pagoConObs.observaciones;
          }

          if (creditos && creditos.length > 0) {
            creditos.forEach(credito => {
              const montoOriginal = this.parseMonto(credito.montoOriginal) || this.parseMonto(credito.montoFinal) || 0;

              if (credito.detallesCredito && credito.detallesCredito.length > 0) {
                let deudaCredito = 0;
                let pagadoCredito = 0;
                credito.detallesCredito.forEach(d => {
                  deudaCredito += this.parseMonto(d.valor);
                  if (d.estado?.toUpperCase() === 'PENDIENTE_APROBACION') {
                    tienePagosEnRevision = true;
                    montoEnRevision += (this.parseMonto(d.valorCancelado) || this.parseMonto(d.valor) || 0);
                  } else {
                    pagadoCredito += this.parseMonto(d.valorCancelado);
                  }
                });
                totalDeuda += deudaCredito;
                totalPagado += pagadoCredito;
              } else {
                totalDeuda += montoOriginal;
              }
            });
          }

          this.progresoCache.set(pago.idMatricula, { 
            totalDeuda, 
            totalPagado, 
            montoEnRevision, 
            tienePagosEnRevision,
            tieneObservaciones,
            observaciones
          });
          pago.totalDeuda = totalDeuda;
          pago.totalPagado = totalPagado;
          pago.tienePagosEnRevision = tienePagosEnRevision;
          pago.montoEnRevision = montoEnRevision;
          pago.tieneObservaciones = tieneObservaciones;
          pago.observaciones = observaciones;
          pago.cargandoProgreso = false;
        });

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar progreso de pagos:', err);
        filasSinProgreso.forEach(pago => {
          pago.cargandoProgreso = false;
        });
        this.cdr.detectChanges();
      }
    });
  }



  mapMatriculaToPagoEstudiante(matricula: MatriculaDTO): PagoEstudiante {
    const nombreCompleto = [
      matricula.primerNombre,
      matricula.segundoNombre,
      matricula.primerApellido,
      matricula.segundoApellido
    ].filter(Boolean).join(' ');

    return {
      idMatricula: matricula.idMatricula || 0,
      cedula: matricula.numeroDocumento || '',
      nombreEstudiante: nombreCompleto,
      modalidad: matricula.detalleTipoOferta || '',
      detalleCiclo: matricula.detalleCiclo || '',
      totalDeuda: 0,
      totalPagado: 0,
      especies: [],
      idPersona: matricula.idUsuarioAlumno || 0
    };
  }

  getSeverity(totalDeuda: number, totalPagado: number): 'success' | 'info' | 'warn' | 'danger' {
    const pendiente = totalDeuda - totalPagado;
    const porcentajePagado = (totalDeuda > 0) ? (totalPagado / totalDeuda) * 100 : 0;

    if (porcentajePagado === 100) return 'success';
    if (porcentajePagado >= 50) return 'info';
    if (porcentajePagado >= 25) return 'warn';
    return 'danger';
  }

  getEstadoLabel(totalDeuda: number, totalPagado: number): string {
    const pendiente = totalDeuda - totalPagado;
    if (pendiente === 0) return 'Pagado';
    if (totalPagado === 0) return 'Pendiente';
    return 'Parcial';
  }

  getProgreso(totalDeuda: number, totalPagado: number): number {
    if (totalDeuda === 0) return 0;
    return Math.round((totalPagado / totalDeuda) * 100);
  }

  clearFilters(): void {
    this.searchValue = '';
    this.filtroPeriodoId = null;
    this.filtroCicloId = null;
    this.filtroCursoId = null;
    this.ciclos = [];
    this.mallasFiltradas = [];
    this.loadData();
  }

  filteredPagos(): PagoEstudiante[] {
    if (!this.searchValue.trim()) return this.pagos;
    const term = this.searchValue.toLowerCase().trim();
    return this.pagos.filter(p =>
      p.cedula.toLowerCase().includes(term) ||
      p.nombreEstudiante.toLowerCase().includes(term) ||
      p.modalidad.toLowerCase().includes(term) ||
      p.detalleCiclo.toLowerCase().includes(term)
    );
  }

  verDetalle(pago: PagoEstudiante): void {
    this.setDetalleLoading(true);
    this.mostrarDetalle = true;

    // Única petición: créditos completos con detalles
    this.creditoService.getCreditosConDetallesByMatricula(pago.idMatricula)
      .subscribe({
        next: (creditos: CreditoConDetallesDTO[]) => {
          this.ngZone.run(() => {
            const especies: Especie[] = creditos.map(credito => {
              const detalleEspecie = credito.detalleEspecie || 'Especie';
              const upperDetalle = detalleEspecie.toUpperCase();
              const esPension = upperDetalle.includes('PENSION') || upperDetalle.includes('PENSIÓN');
              const esMatricula = upperDetalle.includes('MATRICULA') || upperDetalle.includes('MATRÍCULA');
              const tipoEspecie: 'matricula' | 'pension' | 'extra' = esPension ? 'pension' : (esMatricula ? 'matricula' : 'extra');
              const montoOriginal = this.parseMonto(credito.montoOriginal) || this.parseMonto(credito.montoFinal) || 0;
              const montoFinal = this.parseMonto(credito.montoFinal);
              const montoBeneficio = this.parseMonto(credito.montoBeneficio);
              const esPendienteDiferir = credito.estado === 'PENDIENTE_DIFERIR';

              // Calcular valorPagado y deuda por especie:
              let valorPagado = 0;
              let valorDeudaEspecie = montoOriginal;

              if (credito.detallesCredito && credito.detallesCredito.length > 0) {
                valorDeudaEspecie = 0;
                credito.detallesCredito.forEach(d => {
                  valorDeudaEspecie += this.parseMonto(d.valor);
                  if (d.estado?.toUpperCase() === 'PENDIENTE_APROBACION') {
                    // excluir de totales hasta validación
                  } else {
                    valorPagado += this.parseMonto(d.valorCancelado);
                  }
                });
              }

              // Fecha límite: primera cuota si existe
              const primeraFecha = credito.detallesCredito?.[0]?.fechaLimite ?? null;

              // Pagado: todas las cuotas tienen pagado === true
              const todasCuotasLiquidadas =
                (credito.detallesCredito?.length ?? 0) > 0 &&
                (credito.detallesCredito ?? []).every(
                  d => d.pagado === true
                );
              const pagado = todasCuotasLiquidadas;

              return {
                idEspecie: credito.idCredito ?? 0,
                idCredito: credito.idCredito ?? 0,
                nombre: detalleEspecie,
                tipo: tipoEspecie,
                estado: credito.estado ?? 'ACTIVO',
                ciclo: pago.detalleCiclo || 'Sin ciclo',
                valor: valorDeudaEspecie,
                montoFinal: montoFinal,
                montoBeneficio: montoBeneficio,
                valorPagado: valorPagado,
                pagado: pagado,
                fechaLimite: primeraFecha ?? (esPendienteDiferir ? 'Por definir al diferir' : 'Sin fecha'),
                detallesCredito: (credito.detallesCredito ?? []).map(d => ({
                  idDetalleCredito: d.idDetalleCredito ?? 0,
                  numeroCuota: d.numeroCuota ?? 0,
                  valor: this.parseMonto(d.valor),
                  valorCancelado: this.parseMonto(d.valorCancelado),
                  valorOriginal: this.parseMonto(d.valorOriginal),
                  saldoCuota: this.parseMonto(d.saldoCuota),
                  fechaLimite: d.fechaLimite ?? null,
                  estado: d.estado ?? 'PENDIENTE',
                  pagado: d.pagado ?? false
                })),
                esPensionNoDiferida: esPendienteDiferir,
                esExtra: tipoEspecie === 'extra'
              } as Especie;
            });

            let totalDeuda = 0;
            let totalPagado = 0;
            let tienePagosEnRevision = false;
            let montoEnRevision = 0;

            creditos.forEach(c => {
              if (c.detallesCredito && c.detallesCredito.length > 0) {
                let deudaCredito = 0;
                c.detallesCredito.forEach(d => {
                  deudaCredito += this.parseMonto(d.valor);
                  if (d.estado?.toUpperCase() === 'PENDIENTE_APROBACION') {
                    tienePagosEnRevision = true;
                    montoEnRevision += (this.parseMonto(d.valorCancelado) || this.parseMonto(d.valor) || 0);
                  } else {
                    totalPagado += this.parseMonto(d.valorCancelado);
                  }
                });
                totalDeuda += deudaCredito;
              } else {
                totalDeuda += (this.parseMonto(c.montoOriginal) || this.parseMonto(c.montoFinal) || 0);
              }
            });

            this.estudianteSeleccionado = {
              ...pago,
              totalDeuda,
              totalPagado,
              tienePagosEnRevision,
              montoEnRevision,
              especies
            };

            this.detallesCreditoAPI = creditos;
          });
          this.setDetalleLoading(false);
        },
        error: (err) => {
          console.error('Error al obtener créditos:', err);
          this.toastService.showError('No se pudieron cargar los detalles del crédito', 'Error');
          this.ngZone.run(() => {
            this.estudianteSeleccionado = pago;
          });
          this.setDetalleLoading(false);
        }
      });
  }

  volverALista(): void {
    this.estudianteSeleccionado = null;
    this.mostrarDetalle = false;
  }

  navigateToPostulaciones(): void {
    this.router.navigate(['/dashboard/postulaciones/manage-postulations']);
  }

  /** Limpia la caché del estudiante visitado y recarga el progreso de las filas visibles */
  recargarProgresoLista(): void {
    if (this.estudianteSeleccionado) {
      this.progresoCache.delete(this.estudianteSeleccionado.idMatricula);
    }
    this.cargarProgresoMatriculasActuales();
  }

  // ==========================================
  // GESTIÓN DE COSTOS EXTRAS / ARANCELES
  // ==========================================

  abrirDrawerCostoExtra(pago: PagoEstudiante, event?: Event): void {
    if (event) event.stopPropagation();
    this.alumnoCostoExtra = pago;
    this.especieSeleccionadaId = null;
    this.montoAsignacion = null;
    this.fechaLimiteAsignacion = '';
    this.observacionesAsignacion = '';
    this.mostrarDrawerCostoExtra = true;

    this.cargarCatalogoEspeciesExtras();
    this.cargarHistorialExtrasAlumno(pago.idMatricula);
  }

  cerrarDrawerCostoExtra(): void {
    this.mostrarDrawerCostoExtra = false;
    this.alumnoCostoExtra = null;
    this.creditosExtrasAlumno = [];
  }

  onDrawerVisibleChange(visible: boolean): void {
    this.mostrarDrawerCostoExtra = visible;
    if (!visible) {
      this.alumnoCostoExtra = null;
      this.creditosExtrasAlumno = [];
    }
  }

  cargarCatalogoEspeciesExtras(): void {
    this.especieService.getAll().subscribe({
      next: (especies) => {
        const lista = especies || [];
        this.catalogoExtras = lista.filter(e => (e.activo !== false && (e as any).esActivo !== false) && (e.tipoEspecie === 'EXTRA' || (e as any).tipo === 'EXTRA'));
        if (this.catalogoExtras.length === 0) {
          this.catalogoExtras = lista.filter(e => 
            (e.activo !== false && (e as any).esActivo !== false) && 
            !e.detalle?.toUpperCase().includes('MATRICULA') && 
            !e.detalle?.toUpperCase().includes('MATRÍCULA') && 
            !e.detalle?.toUpperCase().includes('PENSION') && 
            !e.detalle?.toUpperCase().includes('PENSIÓN')
          );
        }
      },
      error: (err) => {
        console.error('Error al cargar catálogo de especies extras:', err);
      }
    });
  }

  cargarHistorialExtrasAlumno(idMatricula: number): void {
    this.cargandoHistorialAlumno = true;
    this.creditoService.getCreditosExtras(idMatricula).subscribe({
      next: (res) => {
        this.cargandoHistorialAlumno = false;
        if (res.isSuccess && res.data) {
          this.creditosExtrasAlumno = res.data;
        } else {
          this.creditosExtrasAlumno = [];
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar historial de extras del alumno:', err);
        this.cargandoHistorialAlumno = false;
        this.creditosExtrasAlumno = [];
        this.cdr.detectChanges();
      }
    });
  }

  asignarCostoExtra(): void {
    if (!this.alumnoCostoExtra || !this.especieSeleccionadaId || !this.montoAsignacion || this.montoAsignacion <= 0) {
      this.toastService.showWarning('Por favor seleccione un arancel y defina un monto válido', 'Campos Incompletos');
      return;
    }

    this.guardandoAsignacion = true;
    const payload = {
      idMatricula: this.alumnoCostoExtra.idMatricula,
      idEspecie: this.especieSeleccionadaId,
      monto: Number(this.montoAsignacion),
      fechaLimite: this.fechaLimiteAsignacion ? this.fechaLimiteAsignacion : null,
      observaciones: this.observacionesAsignacion?.trim() ? this.observacionesAsignacion.trim() : null
    };

    this.creditoService.asignarCreditoExtra(payload).subscribe({
      next: (res) => {
        this.guardandoAsignacion = false;
        if (res.isSuccess) {
          this.toastService.showSuccess(res.message || 'Arancel extra asignado correctamente', 'Éxito');
          // Limpiar inputs del form
          this.especieSeleccionadaId = null;
          this.montoAsignacion = null;
          this.fechaLimiteAsignacion = '';
          this.observacionesAsignacion = '';
          
          if (this.alumnoCostoExtra) {
            this.cargarHistorialExtrasAlumno(this.alumnoCostoExtra.idMatricula);
            this.progresoCache.delete(this.alumnoCostoExtra.idMatricula);
            this.cargarProgresoMatriculasActuales();
          }
        } else {
          this.toastService.showError(res.message || 'No se pudo asignar el arancel', 'Error');
        }
      },
      error: (err) => {
        this.guardandoAsignacion = false;
        console.error('Error al asignar arancel extra:', err);
        const errMsg = err?.error?.message || 'Ocurrió un error al procesar la asignación';
        this.toastService.showError(errMsg, 'Error');
      }
    });
  }

  // Modal Nuevo Costo en Catálogo
  abrirModalNuevoCosto(): void {
    this.nombreNuevoCosto = '';
    this.mostrarModalNuevoCosto = true;
  }

  cerrarModalNuevoCosto(): void {
    this.mostrarModalNuevoCosto = false;
    this.nombreNuevoCosto = '';
  }

  guardarNuevoCosto(): void {
    if (!this.nombreNuevoCosto || !this.nombreNuevoCosto.trim()) {
      this.toastService.showWarning('Ingrese el nombre del arancel', 'Campo Requerido');
      return;
    }

    this.guardandoNuevoCosto = true;
    const nuevaEspecie: any = {
      detalle: this.nombreNuevoCosto.trim().toUpperCase(),
      tipoEspecie: 'EXTRA',
      esActivo: true
    };

    this.especieService.create(nuevaEspecie).subscribe({
      next: (created) => {
        this.guardandoNuevoCosto = false;
        this.toastService.showSuccess('Arancel creado en catálogo', 'Éxito');
        this.mostrarModalNuevoCosto = false;
        this.nombreNuevoCosto = '';
        this.especieService.getAll().subscribe(list => {
          const arr = list || [];
          this.catalogoExtras = arr.filter(e => (e.activo !== false && (e as any).esActivo !== false) && (e.tipoEspecie === 'EXTRA' || (e as any).tipo === 'EXTRA'));
          if (created && created.idEspecie) {
            this.especieSeleccionadaId = created.idEspecie;
          }
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.guardandoNuevoCosto = false;
        console.error('Error al crear especie en catálogo:', err);
        const msg = err?.error?.message || 'No se pudo crear el arancel en el catálogo';
        this.toastService.showError(msg, 'Error');
      }
    });
  }

  // Anulación de Arancel Extra
  abrirModalAnularCosto(item: any, event?: Event): void {
    if (event) event.stopPropagation();
    this.creditoAAnular = item;
    this.mostrarModalAnularCostoExtra = true;
  }

  cerrarModalAnularCosto(): void {
    this.mostrarModalAnularCostoExtra = false;
    this.creditoAAnular = null;
  }

  confirmarAnularCostoExtra(): void {
    if (!this.creditoAAnular) return;

    this.anulandoCreditoExtra = true;
    this.creditoService.anularCreditoExtra(this.creditoAAnular.idCredito).subscribe({
      next: (res) => {
        this.anulandoCreditoExtra = false;
        if (res.isSuccess) {
          this.toastService.showSuccess(res.message || 'Arancel extra anulado correctamente', 'Éxito');
          this.mostrarModalAnularCostoExtra = false;
          this.creditoAAnular = null;
          if (this.alumnoCostoExtra) {
            this.cargarHistorialExtrasAlumno(this.alumnoCostoExtra.idMatricula);
            this.progresoCache.delete(this.alumnoCostoExtra.idMatricula);
            this.cargarProgresoMatriculasActuales();
          }
        } else {
          this.toastService.showError(res.message || 'No se pudo anular el arancel', 'Error');
        }
      },
      error: (err) => {
        this.anulandoCreditoExtra = false;
        console.error('Error al anular arancel:', err);
        const errMsg = err?.error?.message || 'Error al procesar la anulación';
        this.toastService.showError(errMsg, 'Error');
      }
    });
  }

  // ==========================================
  // ASIGNACIÓN MASIVA DE ARANCELES / COSTOS
  // ==========================================

  abrirModalAsignacionMasiva(): void {
    this.cargarCatalogoEspeciesExtras();
    this.masivoEspecieId = null;
    this.masivoMonto = null;
    this.masivoFechaLimite = '';
    this.masivoObservaciones = '';
    this.masivoCursosSeleccionados = {};
    this.masivoSeleccionarTodosCursos = true;

    this.masivoPeriodoId = this.filtroPeriodoId || (this.periodos.length > 0 ? this.periodos[0].idPeriodoLectivo! : null);
    
    if (this.masivoPeriodoId) {
      this.masivoCiclos = this.todosLosCiclos.filter(c => c.idPeriodo === this.masivoPeriodoId && c.esActivo === true);
      this.masivoCicloId = this.filtroCicloId || (this.masivoCiclos.length > 0 ? this.masivoCiclos[0].idCiclo! : null);
    } else {
      this.masivoCiclos = [];
      this.masivoCicloId = null;
    }

    if (this.masivoCicloId) {
      this.cargarCursosMasivo(this.masivoCicloId);
    } else {
      this.masivoCursos = [];
    }

    this.mostrarModalAsignacionMasiva = true;
  }

  cerrarModalAsignacionMasiva(): void {
    this.mostrarModalAsignacionMasiva = false;
  }

  onMasivoPeriodoChange(): void {
    this.masivoCiclos = [];
    this.masivoCicloId = null;
    this.masivoCursos = [];
    this.masivoCursosSeleccionados = {};

    if (this.masivoPeriodoId) {
      this.masivoCiclos = this.todosLosCiclos.filter(c => c.idPeriodo === this.masivoPeriodoId && c.esActivo === true);
      if (this.masivoCiclos.length > 0) {
        this.masivoCicloId = this.masivoCiclos[0].idCiclo!;
        this.onMasivoCicloChange();
      }
    }
  }

  onMasivoCicloChange(): void {
    this.masivoCursos = [];
    this.masivoCursosSeleccionados = {};
    if (this.masivoCicloId) {
      this.cargarCursosMasivo(this.masivoCicloId);
    }
  }

  private cargarCursosMasivo(idCiclo: number): void {
    this.cargandoCursosMasivo = true;
    this.mallaInfraService.getByCiclo(idCiclo).subscribe({
      next: (cursos) => {
        this.cargandoCursosMasivo = false;
        this.masivoCursos = this.ordenarCursos(cursos || []);
        this.masivoCursosSeleccionados = {};
        this.masivoCursos.forEach(c => {
          if (c.idMalla) {
            this.masivoCursosSeleccionados[c.idMalla] = true;
          }
        });
        this.masivoSeleccionarTodosCursos = true;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.cargandoCursosMasivo = false;
        console.error('Error al cargar cursos para asignación masiva:', err);
        this.toastService.showError('No se pudieron cargar los cursos del ciclo', 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  toggleTodosCursosMasivo(event: any): void {
    const checked = event.target ? event.target.checked : !!event;
    this.masivoSeleccionarTodosCursos = checked;
    this.masivoCursos.forEach(c => {
      if (c.idMalla) {
        this.masivoCursosSeleccionados[c.idMalla] = checked;
      }
    });
  }

  onCursoMasivoCheckChange(): void {
    const seleccionados = this.getCursosSeleccionadosIds();
    this.masivoSeleccionarTodosCursos = (seleccionados.length === this.masivoCursos.length && this.masivoCursos.length > 0);
  }

  isCursoSeleccionado(idMalla?: number): boolean {
    return !!(idMalla && this.masivoCursosSeleccionados[idMalla]);
  }

  setCursoSeleccionado(idMalla: number | undefined, checked: boolean): void {
    if (idMalla) {
      this.masivoCursosSeleccionados[idMalla] = checked;
      this.onCursoMasivoCheckChange();
    }
  }

  getCursosSeleccionadosIds(): number[] {
    return Object.keys(this.masivoCursosSeleccionados)
      .filter(id => this.masivoCursosSeleccionados[+id])
      .map(id => +id);
  }

  getCursosSeleccionadosCount(): number {
    return this.getCursosSeleccionadosIds().length;
  }

  ejecutarAsignacionMasiva(): void {
    const idsMallas = this.getCursosSeleccionadosIds();
    if (idsMallas.length === 0) {
      this.toastService.showWarning('Debe seleccionar al menos un curso para la asignación', 'Validación');
      return;
    }
    if (!this.masivoEspecieId) {
      this.toastService.showWarning('Debe seleccionar un arancel o concepto', 'Validación');
      return;
    }
    if (!this.masivoMonto || this.masivoMonto <= 0) {
      this.toastService.showWarning('El monto debe ser mayor a 0', 'Validación');
      return;
    }

    this.guardandoAsignacionMasiva = true;
    const payload = {
      idsMallas: idsMallas,
      idEspecie: this.masivoEspecieId,
      monto: Number(this.masivoMonto),
      fechaLimite: this.masivoFechaLimite ? this.masivoFechaLimite : null,
      observaciones: this.masivoObservaciones?.trim() ? this.masivoObservaciones.trim() : null
    };

    this.creditoService.asignarCreditoExtraMasivo(payload).subscribe({
      next: (res) => {
        this.guardandoAsignacionMasiva = false;
        if (res.isSuccess && res.data) {
          this.resultadoMasivo = res.data;
          this.mostrarModalAsignacionMasiva = false;
          this.mostrarModalResultadoMasivo = true;

          this.progresoCache.clear();
          this.loadData();
        } else {
          this.toastService.showError(res.message || 'No se pudo completar la asignación masiva', 'Error');
        }
      },
      error: (err) => {
        this.guardandoAsignacionMasiva = false;
        console.error('Error en asignación masiva:', err);
        const msg = err?.error?.message || 'Ocurrió un error al procesar la asignación masiva';
        this.toastService.showError(msg, 'Error');
      }
    });
  }

  cerrarModalResultadoMasivo(): void {
    this.mostrarModalResultadoMasivo = false;
    this.resultadoMasivo = null;
  }
}