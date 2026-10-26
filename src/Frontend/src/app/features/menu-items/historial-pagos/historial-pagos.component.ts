import { Component, OnInit, inject, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, map } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PagoService } from '../../../core/services/pagos/pago.service';
import { CreditoService } from '../../../core/services/pagos/credito.service';
import { AuthService, UserRole } from '../../../core/auth/auth.service';
import { API_BASE_URL } from '../../../core/constants/app.constants';
import { SharedToastComponent } from '../../../shared/shared-toast/shared-toast.component';
import { SharedDrawerComponent } from '../../../shared/shared-drawer/shared-drawer.component';
import { SharedModalComponent } from '../../../shared/shared-modal/shared-modal.component';
import { SharedTableComponent, SharedTableColTemplateDirective, TableColumn, PageEvent, SortEvent } from '../../../shared/shared-table/shared-table.component';
import { CustomSelectComponent } from '../../../shared/custom-select/custom-select.component';
import { SharedImagePreviewComponent } from '../../../shared/shared-image-preview/shared-image-preview.component';
import { SharedHeaderComponent } from '../../../shared/shared-header/shared-header.component';
import { SharedEmptyStateComponent } from '../../../shared/shared-empty-state/shared-empty-state.component';
import { ClienteService } from '../../../core/services/pagos/cliente.service';
import { CreditoConDetallesDTO, ClienteDTO } from '../../../data/models/Entities';
import { Especie, PagoEstudiante } from '../../../shared/models/pagos.model';
import { PagoReporteService } from '../../shared-actions/reportes/pagos/pago-reporte.service';
import { ToastService } from '../../../shared/toast.service';

export interface CuotaPagada {
  idPagoCuota: number;
  idDetalleCredito: number;
  numeroCuota: number;
  valorAplicado: number;
  valorOriginalCuota: number;
  saldoCuota: number;
  estadoCuota: string;
  idCredito: number;
  detalleEspecie: string;
  esDiferible: boolean;
}

export interface HistorialPagoItem {
  idPago: number;
  fechaPago: string;
  valorPago: number;
  tipoPago: string;
  esValidado: boolean | null;
  estadoPago: string;
  esCancelado: boolean;
  estadoCredito: string;
  totalPagadoCredito: number;
  numeroCuotasPagadas: number;
  idCliente: number;
  documento: string;
  numeroDeposito: string;
  bancoDeposito: string;
  pathComprobante: string;
  alumnoNombre: string;
  idMatricula: number;
  cuotasPagadas: CuotaPagada[];
  observaciones?: string | undefined;
  usuarioAprueba?: number | null;
  usuarioApruebaNombre?: string | null;
  fechaAprobacion?: string | null;
  clienteNombre?: string;
  clienteDocumento?: string;
  clienteCorreo?: string;
  clienteCelular?: string;
}

interface HistorialFiltros {
  documento: string;
  fechaDesde: Date | null;
  fechaHasta: Date | null;
  estadoPago: string | null;
}

@Component({
  selector: 'app-historial-pagos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SharedToastComponent,
    SharedDrawerComponent,
    SharedModalComponent,
    SharedTableComponent,
    SharedTableColTemplateDirective,
    CustomSelectComponent,
    SharedImagePreviewComponent,
    SharedHeaderComponent,
    SharedEmptyStateComponent
  ],
  templateUrl: './historial-pagos.component.html',
  styleUrls: ['./historial-pagos.component.css']
})
export class HistorialPagosComponent implements OnInit {
  private pagoService = inject(PagoService);
  private creditoService = inject(CreditoService);
  private clienteService = inject(ClienteService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
  private pagoReporteService = inject(PagoReporteService);
  private sanitizer = inject(DomSanitizer);

  // Table Config
  tableColumns: TableColumn[] = [
    { field: 'idPago', header: '#', width: '70px', sortable: true },
    { field: 'fechaPago', header: 'Fecha', width: '135px', sortable: true },
    { field: 'alumnoNombre', header: 'Alumno', width: '200px', sortable: true },
    { field: 'clienteNombre', header: 'Cliente Facturado', width: '200px', sortable: true },
    { field: 'documento', header: 'Doc. Alumno', width: '120px', sortable: true },
    { field: 'valorPago', header: 'Valor', width: '100px', sortable: true },
    { field: 'tipoPago', header: 'Tipo Pago', width: '110px', sortable: true },
    { field: 'bancoDeposito', header: 'Banco', width: '130px', sortable: true },
    { field: 'estadoPago', header: 'Estado', width: '120px', sortable: true },
    { field: 'acciones', header: 'Acciones', width: '150px', align: 'center' }
  ];

  currentPage = 1;
  rowsPerPage = 10;
  totalRecords = 0;

  // Drawer Comprobante Preview
  showComprobanteDrawer = false;
  selectedComprobanteUrl: string | null = null;
  selectedComprobanteSafeUrl: SafeResourceUrl | null = null;
  selectedComprobanteIsPdf = false;
  selectedComprobanteFileName = 'Comprobante_Pago';

  // Modal de Reporte
  showReportModal = false;
  esReporteDiario = true;
  fechaReporteInicio: Date | null = new Date();
  fechaReporteFin: Date | null = new Date();
  estadoReporte: string | null = null;
  generandoReporte = false;

  opcionesEstadoReporte = [
    { label: 'Todos los estados', value: null },
    { label: 'Solo APROBADOS', value: 'APROBADO' },
    { label: 'Solo PENDIENTES', value: 'PENDIENTE' },
    { label: 'Solo CANCELADOS', value: 'CANCELADO' },
    { label: 'Solo RECHAZADOS', value: 'RECHAZADO' }
  ];

  pagos: HistorialPagoItem[] = [];
  loading = false;
  hasBuscado = false;
  searchValue = '';

  // Drawer saldo alumno
  showSaldoDrawer = false;
  saldoEstudiante: PagoEstudiante | null = null;
  loadingSaldo = false;
  detallesCreditoAPI: any[] = [];

  esSecretariaGeneral = false;
  esMasterContabilidad = false;

  filtros: HistorialFiltros = {
    documento: '',
    fechaDesde: null,
    fechaHasta: null,
    estadoPago: null
  };

  opcionesEstadoPago = [
    { label: 'Todos los estados', value: null },
    { label: 'PENDIENTE', value: 'PENDIENTE' },
    { label: 'APROBADO', value: 'APROBADO' },
    { label: 'RECHAZADO', value: 'RECHAZADO' },
    { label: 'CANCELADO', value: 'CANCELADO' }
  ];

  // Getters/setters for date inputs (YYYY-MM-DD)
  get fechaDesdeStr(): string {
    return this.toDateOnlyString(this.filtros.fechaDesde) || '';
  }
  set fechaDesdeStr(val: string) {
    this.filtros.fechaDesde = val ? new Date(val + 'T00:00:00') : null;
  }

  get fechaHastaStr(): string {
    return this.toDateOnlyString(this.filtros.fechaHasta) || '';
  }
  set fechaHastaStr(val: string) {
    this.filtros.fechaHasta = val ? new Date(val + 'T23:59:59') : null;
  }

  get fechaReporteInicioStr(): string {
    return this.toDateOnlyString(this.fechaReporteInicio) || '';
  }
  set fechaReporteInicioStr(val: string) {
    this.fechaReporteInicio = val ? new Date(val + 'T00:00:00') : null;
  }

  get fechaReporteFinStr(): string {
    return this.toDateOnlyString(this.fechaReporteFin) || '';
  }
  set fechaReporteFinStr(val: string) {
    this.fechaReporteFin = val ? new Date(val + 'T23:59:59') : null;
  }

  get pagosFiltrados(): HistorialPagoItem[] {
    let list = this.pagos;
    if (this.searchValue.trim()) {
      const term = this.searchValue.toLowerCase().trim();
      list = list.filter(p =>
        (p.alumnoNombre && p.alumnoNombre.toLowerCase().includes(term)) ||
        (p.documento && p.documento.toLowerCase().includes(term)) ||
        (p.bancoDeposito && p.bancoDeposito.toLowerCase().includes(term)) ||
        (p.clienteNombre && p.clienteNombre.toLowerCase().includes(term)) ||
        (p.clienteDocumento && p.clienteDocumento.toLowerCase().includes(term)) ||
        (p.idPago && p.idPago.toString().includes(term))
      );
    }
    return list;
  }

  get pagosPaginados(): HistorialPagoItem[] {


    return this.pagosFiltrados;
  }

  // Approve dialog state
  showApproveDialog = false;
  pagoToApprove: HistorialPagoItem | null = null;

  // Reject dialog state
  showRejectDialog = false;
  pagoToReject: HistorialPagoItem | null = null;
  rejectReason = '';

  // Cancel dialog state
  showCancelDialog = false;
  pagoToCancel: HistorialPagoItem | null = null;
  cancelObservation = '';

  // Observation dialog state
  showObservationDialog = false;
  pagoToViewObservation: HistorialPagoItem | null = null;
  observacionTexto = '';
  guardandoObservacion = false;

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    this.esSecretariaGeneral = currentUser?.roles.some(r => r.nombre === UserRole.SECRETARIA_GENERAL) ?? false;
    this.esMasterContabilidad = currentUser?.roles.some(r => r.nombre === 'MASTER-CONTABILIDAD') ?? false;

    this.pagos = [];
    this.filtros = {
      documento: '',
      fechaDesde: null,
      fechaHasta: null,
      estadoPago: null
    };
    this.hasBuscado = true;
    this.cargarHistorial();
  }

  onDocumentoChange(): void {
    if (this.filtros.documento && this.filtros.documento.trim()) {
      // Documento es excluyente con fechas (gana documento)
      this.filtros.fechaDesde = null;
      this.filtros.fechaHasta = null;
    }
  }

  onFechaChange(): void {
    if (this.filtros.fechaDesde || this.filtros.fechaHasta) {
      // Fechas son excluyentes con documento
      this.filtros.documento = '';
    }
  }

  buscarPorTexto(): void {
    const term = this.searchValue.trim();
    if (!term) return;

    this.filtros.documento = term;
    this.filtros.fechaDesde = null;
    this.filtros.fechaHasta = null;
    this.aplicarFiltros();
  }

  onSearchInputChange(): void {
    if (!this.searchValue.trim() && this.filtros.documento) {
      this.filtros.documento = '';
      this.currentPage = 1;
      this.cargarHistorial();
    }
  }

  recargarHistorial(): void {
    this.cargarHistorial();
  }

  private enriquecerClientesSiFaltan(): void {
    this.pagos.forEach(pago => {
      if (pago.clienteNombre) return;
      const idC = pago.idCliente ?? (pago as any).IdCliente;
      if (idC) {
        this.clienteService.getClienteById(idC).subscribe({
          next: (resCliente) => {
            if (resCliente.isSuccess && resCliente.data && resCliente.data.length > 0) {
              const c = resCliente.data[0];
              pago.clienteNombre = [c.nombres || '', c.apellidos || ''].join(' ').trim();
              pago.clienteDocumento = c.documento || '';
              pago.clienteCorreo = c.correo || '';
              pago.clienteCelular = c.celular || '';
              this.cdr.detectChanges();
            }
          }
        });
      }
    });
  }

  cargarHistorial(): void {
    this.loading = true;
    const esSoloDocumento = Boolean(this.filtros.documento?.trim());

    this.pagoService.getHistorialPagosContabilidadFiltrado({
      documento: esSoloDocumento ? this.filtros.documento.trim() : undefined,
      fechaDesde: esSoloDocumento ? null : this.toDateOnlyString(this.filtros.fechaDesde),
      fechaHasta: esSoloDocumento ? null : this.toDateOnlyString(this.filtros.fechaHasta),
      estadoPago: this.filtros.estadoPago,
      esValidado: null,
      pageNumber: this.currentPage,
      pageSize: this.rowsPerPage
    }).subscribe({
      next: (response) => {
        if (response.isSuccess && response.data) {
          const data = response.data;
          if (Array.isArray(data)) {
            this.pagos = data;
            this.totalRecords = data.length;
          } else {
            this.pagos = data.items || [];
            this.totalRecords = data.totalCount ?? this.pagos.length;
          }
          this.enriquecerClientesSiFaltan();
        } else {
          this.pagos = [];
          this.totalRecords = 0;
          this.toastService.showWarning(response.message || 'No se encontraron pagos', 'Sin datos');
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error cargando historial de pagos:', err);
        this.toastService.showError('No se pudo cargar el historial de pagos', 'Error');
        this.pagos = [];
        this.totalRecords = 0;
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  aplicarFiltros(): void {
    if (this.filtros.documento && this.filtros.documento.trim()) {
      this.filtros.fechaDesde = null;
      this.filtros.fechaHasta = null;
    } else if (this.filtros.fechaDesde && this.filtros.fechaHasta && this.filtros.fechaDesde > this.filtros.fechaHasta) {
      this.toastService.showWarning('La fecha desde no puede ser mayor a la fecha hasta', 'Rango inválido');
      return;
    }

    this.currentPage = 1;
    this.hasBuscado = true;
    this.cargarHistorial();
  }

  limpiarFiltros(): void {
    this.filtros = {
      documento: '',
      fechaDesde: null,
      fechaHasta: null,
      estadoPago: null
    };
    this.searchValue = '';
    this.currentPage = 1;
    this.hasBuscado = true;
    this.cargarHistorial();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.page;
    this.rowsPerPage = event.rows;
    this.cargarHistorial();
  }

  onSortChange(event: SortEvent): void {
    const field = event.field as keyof HistorialPagoItem;
    const order = event.order === 'asc' ? 1 : -1;
    this.pagos.sort((a, b) => {
      const valA = a[field] ?? '';
      const valB = b[field] ?? '';
      if (valA < valB) return -1 * order;
      if (valA > valB) return 1 * order;
      return 0;
    });
  }

  // ─── Comprobante Drawer ────────────────────────────────────────

  abrirComprobante(path: string): void {
    if (!path) {
      this.toastService.showWarning('Este pago no tiene un comprobante disponible', 'Sin comprobante');
      return;
    }

    const fullUrl = path.startsWith('http') ? path : `${API_BASE_URL}/${path}`;
    this.selectedComprobanteUrl = fullUrl;
    this.selectedComprobanteIsPdf = path.toLowerCase().endsWith('.pdf');
    if (this.selectedComprobanteIsPdf) {
      this.selectedComprobanteSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(fullUrl);
    } else {
      this.selectedComprobanteSafeUrl = null;
    }
    const filename = path.split('/').pop() || 'Comprobante_Pago';
    this.selectedComprobanteFileName = filename;
    this.showComprobanteDrawer = true;
  }

  cerrarDrawerComprobante(): void {
    this.showComprobanteDrawer = false;
    this.selectedComprobanteUrl = null;
    this.selectedComprobanteSafeUrl = null;
  }

  // ─── Aprobar Pago ─────────────────────────────────────────────

  confirmarAprobar(pago: HistorialPagoItem): void {
    this.pagoToApprove = pago;
    this.showApproveDialog = true;
  }

  confirmApproveDialogAccept(): void {
    if (!this.pagoToApprove) return;
    this.aprobarPago(this.pagoToApprove);
  }

  private aprobarPago(pago: HistorialPagoItem): void {
    const usuario = this.authService.getCurrentUser();
    const usuarioAprueba = usuario?.id ?? 0;

    this.pagoService.aprobarPago(pago.idPago, usuarioAprueba).subscribe({
      next: (response) => {
        if (response.isSuccess) {
          this.toastService.showSuccess(`Pago #${pago.idPago} aprobado correctamente`, 'Éxito');
          this.recargarHistorial();
        } else {
          this.toastService.showError(response.message || 'No se pudo aprobar el pago', 'Error');
        }
        this.showApproveDialog = false;
        this.pagoToApprove = null;
      },
      error: (err) => {
        console.error('Error al aprobar pago:', err);
        this.toastService.showError(err.error?.message || err.message || 'No se pudo aprobar el pago', 'Error');
        this.showApproveDialog = false;
        this.pagoToApprove = null;
      }
    });
  }

  // ─── Rechazar Pago ────────────────────────────────────────────

  confirmarRechazar(pago: HistorialPagoItem): void {
    this.pagoToReject = pago;
    this.rejectReason = '';
    this.showRejectDialog = true;
  }

  confirmRejectDialogAccept(): void {
    if (!this.pagoToReject || !this.rejectReason?.trim()) return;
    this.rechazarPago(this.pagoToReject, this.rejectReason.trim());
  }

  private rechazarPago(pago: HistorialPagoItem, motivo: string): void {
    const usuario = this.authService.getCurrentUser();
    const usuarioRechaza = usuario?.id ?? 0;

    this.pagoService.rechazarPago(pago.idPago, usuarioRechaza, motivo).subscribe({
      next: (response) => {
        if (response.isSuccess) {
          this.toastService.showSuccess(`Pago #${pago.idPago} rechazado correctamente`, 'Rechazado');
          this.recargarHistorial();
        } else {
          this.toastService.showError(response.message || 'No se pudo rechazar el pago', 'Error');
        }
        this.showRejectDialog = false;
        this.pagoToReject = null;
        this.rejectReason = '';
      },
      error: (err) => {
        console.error('Error al rechazar pago:', err);
        this.toastService.showError(err.error?.message || err.message || 'No se pudo rechazar el pago', 'Error');
        this.showRejectDialog = false;
        this.pagoToReject = null;
        this.rejectReason = '';
      }
    });
  }

  // ─── Cancelar Pago (Master Contabilidad) ──────────────────────

  confirmarCancelar(pago: HistorialPagoItem): void {
    this.pagoToCancel = pago;
    this.cancelObservation = '';
    this.showCancelDialog = true;
  }

  onCancelObservationInput(event: Event): void {
    const val = (event.target as HTMLTextAreaElement).value;
    this.cancelObservation = val.toUpperCase();
  }

  confirmCancelDialogAccept(): void {
    if (!this.pagoToCancel) return;
    const obsUpper = this.cancelObservation ? this.cancelObservation.trim().toUpperCase() : undefined;
    this.cancelarPago(this.pagoToCancel, obsUpper);
  }

  private cancelarPago(pago: HistorialPagoItem, observaciones?: string): void {
    const usuario = this.authService.getCurrentUser();
    const usuarioElimino = usuario?.id ?? 0;

    const requestCancelar = {
      idPago: pago.idPago,
      usuarioElimino,
      observaciones: observaciones ? observaciones.toUpperCase() : `CANCELACIÓN SOLICITADA DESDE HISTORIAL DE PAGOS (PAGO #${pago.idPago}).`
    };

    this.pagoService.cancelarPago(requestCancelar).subscribe({
      next: (response) => {
        if (response.isSuccess) {
          this.toastService.showSuccess(`Pago #${pago.idPago} cancelado correctamente`, 'Éxito');
          this.recargarHistorial();
        } else {
          this.toastService.showError(response.message || 'No se pudo cancelar el pago', 'Error');
        }
        this.showCancelDialog = false;
        this.pagoToCancel = null;
        this.cancelObservation = '';
      },
      error: (err) => {
        console.error('Error al cancelar pago:', err);
        this.toastService.showError('No se pudo cancelar el pago', 'Error');
        this.showCancelDialog = false;
      }
    });
  }

  // ─── Observaciones ────────────────────────────────────────────

  verObservacion(pago: HistorialPagoItem): void {
    this.pagoToViewObservation = pago;
    this.observacionTexto = pago.observaciones || '';
    this.showObservationDialog = true;
  }

  cerrarModalObservacion(): void {
    this.showObservationDialog = false;
    this.pagoToViewObservation = null;
    this.observacionTexto = '';
    this.guardandoObservacion = false;
  }

  guardarObservacion(): void {
    if (!this.pagoToViewObservation) return;
    this.guardandoObservacion = true;
    const idPago = this.pagoToViewObservation.idPago;
    const nuevaObs = this.observacionTexto.trim();

    this.pagoService.actualizarObservacionPago(idPago, nuevaObs).subscribe({
      next: (res) => {
        this.guardandoObservacion = false;
        if (res.isSuccess) {
          this.toastService.showSuccess(`Observación del pago #${idPago} guardada correctamente`, 'Guardado');
          if (this.pagoToViewObservation) {
            this.pagoToViewObservation.observaciones = nuevaObs;
          }
          const pagoEnLista = this.pagos.find(p => p.idPago === idPago);
          if (pagoEnLista) {
            pagoEnLista.observaciones = nuevaObs;
          }
          this.cerrarModalObservacion();
          this.cdr.detectChanges();
        } else {
          this.toastService.showError(res.message || 'No se pudo guardar la observación', 'Error');
        }
      },
      error: (err) => {
        this.guardandoObservacion = false;
        console.error('Error al guardar observación:', err);
        this.toastService.showError(err.error?.message || err.message || 'No se pudo guardar la observación', 'Error');
      }
    });
  }

  // ─── Severidad de estados ─────────────────────────────────────

  getEstadoPagoSeverity(estado: string): string {
    const e = estado?.toUpperCase();
    if (e === 'APROBADO') return 'success';
    if (e === 'PENDIENTE') return 'warn';
    if (e === 'RECHAZADO') return 'danger';
    if (e === 'CANCELADO') return 'secondary';
    return 'info';
  }

  private toDateOnlyString(date: Date | null): string | null {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // ─── Generación de Reportes ──────────────────────────────────

  abrirModalReporte(): void {
    this.esReporteDiario = true;
    this.fechaReporteInicio = new Date();
    this.fechaReporteFin = new Date();
    this.estadoReporte = null;
    this.showReportModal = true;
  }

  cerrarModalReporte(): void {
    this.showReportModal = false;
  }

  toggleReporteDiario(): void {
    if (this.esReporteDiario) {
      this.fechaReporteInicio = new Date();
      this.fechaReporteFin = new Date();
    }
  }

  private obtenerPagosParaReporte(): HistorialPagoItem[] {
    let list: HistorialPagoItem[] = [];
    if (this.esReporteDiario) {
      const hoyStr = this.toDateOnlyString(new Date());
      list = this.pagos.filter(p => {
        if (!p.fechaPago) return false;
        const pagoFechaStr = p.fechaPago.slice(0, 10);
        return pagoFechaStr === hoyStr;
      });
    } else {
      const desdeStr = this.toDateOnlyString(this.fechaReporteInicio);
      const hastaStr = this.toDateOnlyString(this.fechaReporteFin);

      list = this.pagos.filter(p => {
        if (!p.fechaPago) return false;
        const pagoFechaStr = p.fechaPago.slice(0, 10);
        if (desdeStr && pagoFechaStr < desdeStr) return false;
        if (hastaStr && pagoFechaStr > hastaStr) return false;
        return true;
      });
    }

    if (this.estadoReporte) {
      list = list.filter(p => p.estadoPago === this.estadoReporte);
    }

    return list;
  }

  exportarReportePDF(): void {
    const pagosReporte = this.obtenerPagosParaReporte();
    if (pagosReporte.length === 0) {
      this.toastService.showWarning('No existen pagos registrados con los criterios seleccionados para generar el PDF.', 'Sin datos');
      return;
    }

    const titulo = this.esReporteDiario ? 'Reporte Diario de Pagos' : 'Reporte de Pagos por Rango de Fechas';
    const estadoInfo = this.estadoReporte ? ` | Estado: ${this.estadoReporte}` : '';
    const subtitulo = (this.esReporteDiario
      ? `Fecha: ${new Date().toLocaleDateString('es-EC')}`
      : `Desde: ${this.fechaReporteInicio?.toLocaleDateString('es-EC') || 'Inicio'} Hasta: ${this.fechaReporteFin?.toLocaleDateString('es-EC') || 'Fin'}`) + estadoInfo;

    this.generandoReporte = true;
    this.pagoReporteService.exportarPDF(pagosReporte as any, titulo, subtitulo)
      .then(() => {
        this.toastService.showSuccess('El reporte PDF se descargó correctamente.', 'PDF Generado');
        this.showReportModal = false;
      })
      .catch((err) => {
        console.error('Error al generar PDF:', err);
        this.toastService.showError('No se pudo generar el documento PDF.', 'Error');
      })
      .finally(() => {
        this.generandoReporte = false;
      });
  }

  exportarReporteExcel(): void {
    const pagosReporte = this.obtenerPagosParaReporte();
    if (pagosReporte.length === 0) {
      this.toastService.showWarning('No existen pagos registrados con los criterios seleccionados para generar el Excel.', 'Sin datos');
      return;
    }

    const titulo = this.esReporteDiario ? 'Reporte Diario de Pagos' : 'Reporte de Pagos por Rango de Fechas';
    const estadoInfo = this.estadoReporte ? ` | Estado: ${this.estadoReporte}` : '';
    const subtitulo = (this.esReporteDiario
      ? `Fecha: ${new Date().toLocaleDateString('es-EC')}`
      : `Desde: ${this.fechaReporteInicio?.toLocaleDateString('es-EC') || 'Inicio'} Hasta: ${this.fechaReporteFin?.toLocaleDateString('es-EC') || 'Fin'}`) + estadoInfo;

    try {
      this.pagoReporteService.exportarExcel(pagosReporte as any, titulo, subtitulo);
      this.toastService.showSuccess('El archivo Excel se descargó correctamente.', 'Excel Generado');
      this.showReportModal = false;
    } catch (err) {
      console.error('Error al generar Excel:', err);
      this.toastService.showError('No se pudo generar el archivo Excel.', 'Error');
    }
  }

  private hasFiltrosActivos(): boolean {
    return Boolean(
      this.filtros.documento?.trim() ||
      this.filtros.fechaDesde ||
      this.filtros.fechaHasta ||
      this.filtros.estadoPago
    );
  }

  // ─── Drawer: Ver saldo del alumno ─────────────────────────────

  private parseMonto(val: any): number {
    if (val && typeof val === 'object' && val.parsedValue !== undefined) {
      return Number(val.parsedValue) || 0;
    }
    return Number(val) || 0;
  }

  verSaldoAlumno(pago: HistorialPagoItem): void {
    this.loadingSaldo = true;
    this.showSaldoDrawer = true;
    this.detallesCreditoAPI = [];

    this.saldoEstudiante = {
      idMatricula: pago.idMatricula,
      cedula: pago.documento,
      nombreEstudiante: pago.alumnoNombre || '',
      modalidad: '',
      detalleCiclo: '',
      totalDeuda: 0,
      totalPagado: 0,
      tienePagosEnRevision: false,
      especies: [],
      idPersona: 0
    };

    this.creditoService.getCreditosConDetallesByMatricula(pago.idMatricula)
      .subscribe({
        next: (creditos: CreditoConDetallesDTO[]) => {
          this.ngZone.run(() => {
            this.detallesCreditoAPI = creditos;

            const especies: Especie[] = creditos.map(credito => {
              const detalleEspecie = credito.detalleEspecie || 'Especie';
              const esPension = detalleEspecie.toUpperCase().includes('PENSION') ||
                detalleEspecie.toUpperCase().includes('PENSIÓN');
              const montoOriginal = this.parseMonto(credito.montoOriginal) || this.parseMonto(credito.montoFinal) || 0;
              const montoFinal = this.parseMonto(credito.montoFinal);
              const montoBeneficio = this.parseMonto(credito.montoBeneficio);
              const esPendienteDiferir = credito.estado === 'PENDIENTE_DIFERIR';

              let valorPagado = 0;
              let valorDeudaEspecie = montoOriginal;

              if (credito.detallesCredito && credito.detallesCredito.length > 0) {
                valorDeudaEspecie = 0;
                credito.detallesCredito.forEach(d => {
                  valorDeudaEspecie += this.parseMonto(d.valor);
                  if (d.estado?.toUpperCase() !== 'PENDIENTE_APROBACION') {
                    valorPagado += this.parseMonto(d.valorCancelado);
                  }
                });
              }

              const primeraFecha = credito.detallesCredito?.[0]?.fechaLimite ?? null;
              const todasCuotasLiquidadas =
                (credito.detallesCredito?.length ?? 0) > 0 &&
                (credito.detallesCredito ?? []).every(d => d.pagado === true);

              return {
                idEspecie: credito.idCredito ?? 0,
                idCredito: credito.idCredito ?? 0,
                nombre: detalleEspecie,
                tipo: esPension ? 'pension' as const : 'matricula' as const,
                estado: credito.estado ?? 'ACTIVO',
                ciclo: '',
                valor: valorDeudaEspecie,
                montoFinal: montoFinal,
                montoBeneficio: montoBeneficio,
                valorPagado: valorPagado,
                pagado: todasCuotasLiquidadas,
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
                esPensionNoDiferida: esPendienteDiferir
              } as Especie;
            });

            let totalDeuda = 0;
            let totalPagado = 0;
            let tienePagosEnRevision = false;

            creditos.forEach(c => {
              if (c.detallesCredito && c.detallesCredito.length > 0) {
                let deudaCredito = 0;
                c.detallesCredito.forEach(d => {
                  deudaCredito += this.parseMonto(d.valor);
                  if (d.estado?.toUpperCase() === 'PENDIENTE_APROBACION') {
                    tienePagosEnRevision = true;
                  } else {
                    totalPagado += this.parseMonto(d.valorCancelado);
                  }
                });
                totalDeuda += deudaCredito;
              } else {
                totalDeuda += (this.parseMonto(c.montoOriginal) || this.parseMonto(c.montoFinal) || 0);
              }
            });

            this.saldoEstudiante = {
              ...this.saldoEstudiante!,
              totalDeuda,
              totalPagado,
              tienePagosEnRevision,
              especies
            };
          });
          this.loadingSaldo = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error al cargar créditos:', err);
          this.toastService.showError('No se pudieron cargar los datos del saldo del alumno', 'Error');
          this.loadingSaldo = false;
          this.cerrarDrawerSaldo();
          this.cdr.detectChanges();
        }
      });
  }

  cerrarDrawerSaldo(): void {
    this.showSaldoDrawer = false;
    this.saldoEstudiante = null;
    this.detallesCreditoAPI = [];
  }

  getSaldoPendienteTotal(): number {
    if (!this.saldoEstudiante) return 0;
    const totalBeneficio = this.saldoEstudiante.especies.reduce((acc, e) =>
      acc + (this.parseMonto(e.montoBeneficio) || 0), 0);
    return this.saldoEstudiante.totalDeuda - totalBeneficio - this.saldoEstudiante.totalPagado;
  }

  getSaldoAprobadoTotal(): number {
    if (!this.saldoEstudiante) return 0;
    return this.saldoEstudiante.totalPagado;
  }

  getSaldoPendienteAprobacion(): number {
    if (!this.saldoEstudiante) return 0;
    let pendienteAprobacion = 0;
    this.saldoEstudiante.especies.forEach(e => {
      if (e.detallesCredito) {
        e.detallesCredito.forEach(d => {
          if (d.estado?.toUpperCase() === 'PENDIENTE_APROBACION') {
            pendienteAprobacion += d.valorCancelado;
          }
        });
      }
    });
    return pendienteAprobacion;
  }

  getEspecieSeverity(especie: Especie): string {
    if (especie.pagado) return 'success';
    if (especie.valorPagado > 0) return 'warn';
    if (especie.esPensionNoDiferida || especie.estado === 'PENDIENTE_DIFERIR') return 'secondary';
    return 'danger';
  }

  getEstadoLabel(especie: Especie): string {
    if (especie.pagado) return 'Pagado';
    if (especie.valorPagado > 0) return 'Parcial';
    if (especie.esPensionNoDiferida || especie.estado === 'PENDIENTE_DIFERIR') return 'Pendiente Diferir';
    return 'Pendiente';
  }
}