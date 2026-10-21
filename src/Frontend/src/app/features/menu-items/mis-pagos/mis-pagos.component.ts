import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, NgZone, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService, UserRole } from '../../../core/auth/auth.service';
import { API_BASE_URL } from '../../../core/constants/app.constants';
import { ClienteService } from '../../../core/services/pagos/cliente.service';
import { CreditoService } from '../../../core/services/pagos/credito.service';
import { PagoService } from '../../../core/services/pagos/pago.service';
import { MatriculaService } from '../../../core/services/postulaciones/matricula.service';
import { DetalleCreditoDTO, MatriculaDTO } from '../../../data/models/Entities';
import { Especie, HistorialPago, PagoEstudiante } from '../../../shared/models/pagos.model';
import { SharedHeaderComponent } from '../../../shared/shared-header/shared-header.component';
import { SharedTableComponent, SharedTableColTemplateDirective } from '../../../shared/shared-table/shared-table.component';
import { SharedEmptyStateComponent } from '../../../shared/shared-empty-state/shared-empty-state.component';
import { SharedToastComponent } from '../../../shared/shared-toast/shared-toast.component';
import { ToastService } from '../../../shared/toast.service';

@Component({
  selector: 'app-mis-pagos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SharedHeaderComponent,
    SharedTableComponent,
    SharedTableColTemplateDirective,
    SharedEmptyStateComponent,
    SharedToastComponent
  ],
  templateUrl: './mis-pagos.component.html',
  styleUrls: ['./mis-pagos.component.css']
})
export class MisPagosComponent implements OnInit {
  // Inyección de servicios
  private creditoService = inject(CreditoService);
  private pagoService = inject(PagoService);
  private clienteService = inject(ClienteService);
  private matriculaService = inject(MatriculaService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

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

  private parseMonto(val: any): number {
    if (val && typeof val === 'object' && val.parsedValue !== undefined) {
      return Number(val.parsedValue) || 0;
    }
    return Number(val) || 0;
  }

  searchValue: string = '';
  estudianteSeleccionado: PagoEstudiante | null = null;
  mostrarDetalle: boolean = false;
  loading: boolean = false;
  loadingDetalle: boolean = false;

  // Datos de matrículas del alumno
  pagos: PagoEstudiante[] = [];

  // Info del alumno logueado
  nombreAlumno: string = '';
  cedulaAlumno: string = '';

  // Configuración de tabla
  tablaColumnas = [
    { field: 'modalidad', header: 'Modalidad', width: '12rem', sortable: true },
    { field: 'detalleCiclo', header: 'Ciclo', width: '14rem', sortable: true },
    { field: 'progreso', header: 'Progreso de Pagos', width: '12rem' },
    { field: 'estado', header: 'Estado', width: '10rem' },
    { field: 'acciones', header: 'Detalle', width: '5rem', align: 'center' as const }
  ];

  // Caché de progresos ya cargados (evita repetir peticiones)
  private progresoCache = new Map<number, { totalDeuda: number; totalPagado: number; montoEnRevision?: number; tienePagosEnRevision?: boolean }>();

  // Control de paginación
  currentPage: number = 1;
  private filaInicio: number = 0;
  filasPorPagina: number = 10;

  // Datos del API
  detallesCreditoAPI: DetalleCreditoDTO[] = [];

  // Control de vista en detalle (especies / historial)
  vistaDetalle: 'especies' | 'historial' = 'especies';
  historialPagos: HistorialPago[] = [];
  loadingHistorial: boolean = false;

  modalidades = [
    { label: 'Formal virtual', value: 'Formal virtual' },
    { label: 'Acelerado', value: 'Acelerado' }
  ];

  ngOnInit(): void {
    this.cargarMisMatriculas();
  }

  cargarMisMatriculas(): void {
    // Obtener el usuario actual
    const currentUser = this.authService.getCurrentUser();

    if (!currentUser) {
      this.toastService.showError('No se pudo obtener la información del usuario', 'Error');
      return;
    }

    // Verificar que sea un alumno
    const esAlumno = currentUser.roles.some(r => r.nombre === UserRole.ALUMNO);
    if (!esAlumno) {
      this.toastService.showWarning('Esta sección es solo para alumnos', 'Acceso restringido');
      return;
    }

    this.setTableLoading(true);

    // Usar el idPersona del usuario logueado para obtener sus matrículas
    const idPersona = currentUser.id;

    this.matriculaService.getMatriculasByAlumno(idPersona)
      .subscribe({
        next: (matriculas) => {
          // Mapear matrículas a PagoEstudiante (sin progreso aún)
          const pagosBase = matriculas.map(m => this.mapMatriculaToPagoEstudiante(m));

          // Guardar info del alumno
          if (matriculas.length > 0) {
            const m = matriculas[0];
            this.nombreAlumno = [m.primerNombre, m.segundoNombre, m.primerApellido, m.segundoApellido]
              .filter(Boolean).join(' ');
            this.cedulaAlumno = m.numeroDocumento || '';
          }

          this.ngZone.run(() => {
            this.pagos = pagosBase;
          });
          this.setTableLoading(false);

          // Cargar progreso solo de las filas visibles (primera página)
          this.cargarProgresoFilasVisibles();
        },
        error: (err) => {
          console.error('Error al cargar matrículas:', err);
          this.toastService.showError('No se pudieron cargar tus matrículas', 'Error');
          this.ngZone.run(() => {
            this.pagos = [];
          });
          this.setTableLoading(false);
        }
      });
  }

  /**
   * Evento cuando cambia la página o se aplica filtro
   * Solo carga el progreso de las filas visibles
   */
  onPageChange(event: { page: number; rows: number }): void {
    this.currentPage = event.page;
    this.filasPorPagina = event.rows;
    this.filaInicio = (event.page - 1) * this.filasPorPagina;
    this.cargarProgresoFilasVisibles();
  }

  /**
   * Carga el progreso SOLO de las filas actualmente visibles
   * Usa caché para no repetir peticiones
   * Incluye pensiones sin diferir en el cálculo
   */
  private cargarProgresoFilasVisibles(): void {
    const filasVisibles = this.pagos.slice(this.filaInicio, this.filaInicio + this.filasPorPagina);
    const filasSinProgreso = filasVisibles.filter(p => !this.progresoCache.has(p.idMatricula));

    if (filasSinProgreso.length === 0) {
      this.actualizarDesdeCache(filasVisibles);
      return;
    }

    const requests = filasSinProgreso.map(pago =>
      this.creditoService.getCreditosConDetallesByMatricula(pago.idMatricula).pipe(
        catchError(() => of([]))
      )
    );

    forkJoin(requests).subscribe({
      next: (resultados) => {
        resultados.forEach((creditos: any[], index) => {
          const pago = filasSinProgreso[index];
          let totalDeuda = 0;
          let totalPagado = 0;
          let tienePagosEnRevision = false;
          let montoEnRevision = 0;

          creditos.forEach(credito => {
            const montoOriginal = this.parseMonto(credito.montoOriginal) || this.parseMonto(credito.montoFinal) || 0;

            if (credito.detallesCredito && credito.detallesCredito.length > 0) {
              let deudaCredito = 0;
              let pagadoCredito = 0;
              credito.detallesCredito.forEach((d: any) => {
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

          this.progresoCache.set(pago.idMatricula, { totalDeuda, totalPagado, montoEnRevision, tienePagosEnRevision });
          pago.tienePagosEnRevision = tienePagosEnRevision;
          pago.montoEnRevision = montoEnRevision;
        });

        this.actualizarDesdeCache(filasVisibles);
      },
      error: (err) => {
        console.error('Error al cargar progreso:', err);
      }
    });
  }

  /**
   * Actualiza los datos de las filas desde el caché
   */
  private actualizarDesdeCache(filas: PagoEstudiante[]): void {
    this.ngZone.run(() => {
      filas.forEach(pago => {
        const cached = this.progresoCache.get(pago.idMatricula);
        if (cached) {
          pago.totalDeuda = cached.totalDeuda;
          pago.totalPagado = cached.totalPagado;
          pago.montoEnRevision = cached.montoEnRevision;
          pago.tienePagosEnRevision = cached.tienePagosEnRevision;
        }
      });
      this.cdr.detectChanges();
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
      especies: []
    };
  }

  getSeverity(totalDeuda: number, totalPagado: number): 'success' | 'info' | 'warn' | 'danger' {
    const porcentajePagado = (totalDeuda > 0) ? (totalPagado / totalDeuda) * 100 : 0;

    if (porcentajePagado === 100) return 'success';
    if (porcentajePagado >= 50) return 'info';
    if (porcentajePagado >= 25) return 'warn';
    return 'danger';
  }

  getEstadoLabel(totalDeuda: number, totalPagado: number): string {
    const pendiente = totalDeuda - totalPagado;
    if (pendiente === 0 && totalDeuda > 0) return 'Pagado';
    if (totalPagado === 0) return 'Pendiente';
    return 'Parcial';
  }

  getProgreso(totalDeuda: number, totalPagado: number): number {
    if (totalDeuda === 0) return 0;
    return Math.round((totalPagado / totalDeuda) * 100);
  }

  clearFilters(): void {
    this.searchValue = '';
  }

  filteredPagos(): PagoEstudiante[] {
    if (!this.searchValue.trim()) return this.pagos;
    const term = this.searchValue.toLowerCase().trim();
    return this.pagos.filter(p =>
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
        next: (creditos: any[]) => {
          this.ngZone.run(() => {
            const especies: Especie[] = creditos.map(credito => {
              const detalleEspecie = credito.detalleEspecie || 'Especie';
              const esPension = detalleEspecie.toUpperCase().includes('PENSION') ||
                detalleEspecie.toUpperCase().includes('PENSIÓN');
              const montoOriginal = this.parseMonto(credito.montoOriginal) || this.parseMonto(credito.montoFinal) || 0;
              const montoFinal = this.parseMonto(credito.montoFinal);
              const montoBeneficio = this.parseMonto(credito.montoBeneficio);
              const esPendienteDiferir = credito.estado === 'PENDIENTE_DIFERIR';

              // Calcular valorPagado y deuda por especie:
              let valorPagado = 0;
              let valorDeudaEspecie = montoOriginal;

              if (credito.detallesCredito && credito.detallesCredito.length > 0) {
                valorDeudaEspecie = 0;
                credito.detallesCredito.forEach((d: any) => {
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
                  (d: any) => d.pagado === true
                );
              const pagado = todasCuotasLiquidadas;

              return {
                idEspecie: credito.idCredito ?? 0,
                idCredito: credito.idCredito ?? 0,
                nombre: detalleEspecie,
                tipo: esPension ? 'pension' : 'matricula',
                estado: credito.estado ?? 'ACTIVO',
                ciclo: pago.detalleCiclo || 'Sin ciclo',
                valor: valorDeudaEspecie,
                montoFinal: montoFinal,
                montoBeneficio: montoBeneficio,
                valorPagado: valorPagado,
                pagado: pagado,
                fechaLimite: primeraFecha ?? (esPendienteDiferir ? 'Por definir al diferir' : 'Sin fecha'),
                detallesCredito: (credito.detallesCredito ?? []).map((d: any) => ({
                  idDetalleCredito: d.idDetalleCredito ?? 0,
                  numeroCuota: d.numeroCuota ?? 0,
                  valor: this.parseMonto(d.valor),
                  valorCancelado: this.parseMonto(d.valorCancelado),
                  valorOriginal: this.parseMonto(d.valorOriginal),
                  saldoCuota: this.parseMonto(d.saldoCuota),
                  fechaLimite: d.fechaLimite ?? null,
                  estado: d.estado ?? 'PENDIENTE',
                  pagado: d.pagado ?? false
                })).sort((a: any, b: any) => a.numeroCuota - b.numeroCuota),
                esPensionNoDiferida: esPendienteDiferir
              } as Especie;
            });

            let totalDeuda = 0;
            let totalPagado = 0;
            let tienePagosEnRevision = false;
            let montoEnRevision = 0;

            creditos.forEach(c => {
              if (c.detallesCredito && c.detallesCredito.length > 0) {
                let deudaCredito = 0;
                c.detallesCredito.forEach((d: any) => {
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
              totalDeuda: totalDeuda,
              totalPagado: totalPagado,
              tienePagosEnRevision: tienePagosEnRevision,
              montoEnRevision: montoEnRevision,
              especies: especies
            };

            this.verificarCuotasVencidas(especies);
          });
          this.setDetalleLoading(false);
        },
        error: (err) => {
          console.error('Error al obtener créditos completos:', err);
          this.toastService.showError('No se pudieron cargar los créditos', 'Error');
          this.setDetalleLoading(false);
        }
      });
  }

  cuotasExpandidas: Especie | null = null;

  toggleCuotas(especie: Especie): void {
    if (this.cuotasExpandidas?.idCredito === especie.idCredito) {
      this.cuotasExpandidas = null;
    } else {
      this.cuotasExpandidas = especie;
    }
  }

  cerrarCuotasPanel(): void {
    this.cuotasExpandidas = null;
  }

  volverALista(): void {
    this.estudianteSeleccionado = null;
    this.mostrarDetalle = false;
    this.cuotasExpandidas = null;
    this.vistaDetalle = 'especies';
    this.historialPagos = [];
  }

  cambiarVistaDetalle(vista: 'especies' | 'historial'): void {
    this.vistaDetalle = vista;
    if (vista === 'historial' && this.estudianteSeleccionado && this.historialPagos.length === 0) {
      this.cargarHistorialPagos(this.estudianteSeleccionado.idMatricula);
    }
  }

  cargarHistorialPagos(idMatricula: number): void {
    this.loadingHistorial = true;
    this.historialPagos = [];
    this.pagoService.getHistorialPagos(idMatricula).subscribe({
      next: (response) => {
        if (response.isSuccess && response.data && response.data.length > 0) {
          this.historialPagos = response.data.map(pago => ({
            ...pago,
            cuotasPagadas: pago.cuotasPagadas
              ? [...pago.cuotasPagadas].sort((a, b) => a.numeroCuota - b.numeroCuota)
              : []
          }));

          // Cargar datos extra del cliente por cada pago
          this.historialPagos.forEach(pago => {
            const idC = pago.idCliente ?? (pago as any).IdCliente;
            if (idC) {
              this.clienteService.getClienteById(idC).subscribe({
                next: (resCliente) => {
                  if (resCliente.isSuccess && resCliente.data && resCliente.data.length > 0) {
                    const c = resCliente.data[0];
                    pago.clienteNombre = `${c.nombres} ${c.apellidos}`.trim();
                    pago.clienteDocumento = c.documento;
                    this.cdr.detectChanges();
                  }
                }
              });
            }
          });
        } else {
          this.toastService.showInfo('No hay pagos registrados para esta matrícula', 'Sin Historial');
        }
        this.loadingHistorial = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar historial de pagos:', err);
        this.toastService.showError('No se pudo cargar el historial de pagos', 'Error');
        this.loadingHistorial = false;
        this.historialPagos = [];
        this.cdr.detectChanges();
      }
    });
  }

  /** Retorna true si la especie tiene cuotas con estado PENDIENTE_APROBACION */
  especiePendienteAprobacion(especie: Especie): boolean {
    if (!especie.detallesCredito || especie.detallesCredito.length === 0) return false;
    return especie.detallesCredito.some(
      d => d.estado?.toUpperCase() === 'PENDIENTE_APROBACION'
    );
  }

  /** Verdadero si alguna especie tiene cuotas en PENDIENTE_APROBACION */
  get hayPagosEnRevision(): boolean {
    if (!this.estudianteSeleccionado) return false;
    return this.estudianteSeleccionado.especies.some(e => this.especiePendienteAprobacion(e));
  }

  /** Retorna el monto total de cuotas pendientes de validación por contabilidad */
  get montoEnRevision(): number {
    if (!this.estudianteSeleccionado?.especies) return 0;
    let total = 0;
    this.estudianteSeleccionado.especies.forEach(e => {
      total += this.getMontoEnRevisionEspecie(e);
    });
    return total;
  }

  /** Retorna el monto pendiente de validación para una especie específica */
  getMontoEnRevisionEspecie(especie: Especie): number {
    if (!especie?.detallesCredito) return 0;
    return especie.detallesCredito
      .filter(d => d.estado?.toUpperCase() === 'PENDIENTE_APROBACION')
      .reduce((sum, d) => sum + (this.parseMonto(d.valorCancelado) || this.parseMonto(d.valor) || 0), 0);
  }

  getEstadoCuotaSeverity(estado: string): 'success' | 'warn' | 'danger' | 'secondary' {
    switch (estado?.toUpperCase()) {
      case 'PAGADO': return 'success';
      case 'PAGADA': return 'success';
      case 'PENDIENTE_APROBACION': return 'warn';
      case 'PENDIENTE': return 'danger';
      case 'PARCIAL': return 'warn';
      default: return 'secondary';
    }
  }

  // ─── Helpers para historial ───────────────────────────────────────

  getTotalBeneficioHistorial(pago: HistorialPago): number {
    let beneficio = 0;
    if (this.detallesCreditoAPI && pago.cuotasPagadas?.length > 0) {
      const creditoIds = [...new Set(pago.cuotasPagadas.map(c => c.idCredito))];
      creditoIds.forEach(idCredito => {
        const credito: any = this.detallesCreditoAPI.find((c: any) => c.idCredito === idCredito);
        if (credito?.montoBeneficio) {
          beneficio += credito.montoBeneficio;
        }
      });
    }
    return beneficio;
  }

  getTipoPagoSeverity(tipoPago: string): 'success' | 'info' | 'warn' | 'secondary' {
    const t = tipoPago?.toUpperCase() ?? '';
    if (t.includes('EFECTIVO')) return 'success';
    if (t.includes('TRANSFERENCIA')) return 'info';
    return 'secondary';
  }

  getTipoPagoIcon(tipoPago: string): string {
    const t = tipoPago?.toUpperCase() ?? '';
    if (t.includes('EFECTIVO')) return 'pi pi-money-bill';
    if (t.includes('TRANSFERENCIA')) return 'pi pi-building-columns';
    return 'pi pi-credit-card';
  }

  getEstadoPagoSeverity(estadoPago: string): 'success' | 'info' | 'warn' | 'secondary' | 'danger' {
    const estado = estadoPago?.toUpperCase() ?? '';
    if (estado === 'APROBADO') return 'success';
    if (estado === 'CANCELADO') return 'danger';
    if (estado === 'PENDIENTE') return 'warn';
    if (estado === 'RECHAZADO') return 'danger';
    return 'secondary';
  }

  abrirComprobante(path: string): void {
    if (path) {
      const fullUrl = path.startsWith('http') ? path : `${API_BASE_URL}/${path}`;
      window.open(fullUrl, '_blank');
    }
  }

  getEspecieSeverity(especie: Especie): 'success' | 'warn' | 'danger' {
    if (especie.pagado) return 'success';
    if (this.especiePendienteAprobacion(especie)) return 'warn';
    const porcentaje = (especie.valorPagado / especie.valor) * 100;
    if (porcentaje > 0) return 'warn';
    return 'danger';
  }

  getEspecieEstado(especie: Especie): string {
    if (especie.pagado) return 'Pagado';
    if (this.especiePendienteAprobacion(especie)) return 'Pago en Revisión';
    if (especie.valorPagado > 0) return 'Parcial';
    return 'Pendiente';
  }

  /**
   * Verifica si hay cuotas vencidas y no pagadas, y muestra notificaciones toast
   */
  private verificarCuotasVencidas(especies: Especie[]): void {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const cuotasVencidas = especies.filter(especie => {
      if (especie.pagado) return false;
      if (!especie.fechaLimite || especie.fechaLimite === 'Sin fecha' || especie.fechaLimite === 'Por definir') return false;

      try {
        const fechaLimite = new Date(especie.fechaLimite);
        fechaLimite.setHours(0, 0, 0, 0);
        return fechaLimite < hoy;
      } catch {
        return false;
      }
    });

    if (cuotasVencidas.length > 0) {
      cuotasVencidas.forEach(cuota => {
        this.toastService.showWarning(
          `${cuota.nombre} - Fecha límite: ${this.formatearFecha(cuota.fechaLimite)} - Pendiente: $${(cuota.valor - cuota.valorPagado).toFixed(2)}`,
          'Cuota Vencida'
        );
      });
    }
  }

  /**
   * Formatea una fecha a formato legible
   */
  private formatearFecha(fecha: string): string {
    try {
      const date = new Date(fecha);
      return date.toLocaleDateString('es-EC', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return fecha;
    }
  }
}