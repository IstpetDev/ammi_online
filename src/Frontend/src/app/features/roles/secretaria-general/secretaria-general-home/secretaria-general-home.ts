import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DatePickerModule } from 'primeng/datepicker';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { PagoService } from '../../../../core/services/pagos/pago.service';
import { SharedToastComponent } from '../../../../shared/shared-toast/shared-toast.component';
import { SharedModalComponent } from '../../../../shared/shared-modal/shared-modal.component';
import { PostulacionService } from '../../../../core/services/postulaciones/postulacion.service';
import { Router } from '@angular/router';
import { PagoReporteService } from '../../../shared-actions/reportes/pagos/pago-reporte.service';

interface HistorialPagoItem {
  idPago: number;
  fechaPago: string;
  valorPago: number;
  tipoPago: string;
  esValidado: boolean | null;
  estadoPago?: string;
  estadoCredito: string;
  documento: string;
  numeroDeposito?: string;
  bancoDeposito: string;
  alumnoNombre: string;
  observaciones?: string;
}

@Component({
  selector: 'app-secretaria-general-home',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    CardModule,
    ButtonModule,
    DatePickerModule,
    TableModule,
    TagModule,
    ProgressSpinnerModule,
    SharedToastComponent,
    SharedModalComponent
  ],
  providers: [MessageService],
  templateUrl: './secretaria-general-home.html',
  styleUrl: './secretaria-general-home.css'
})
export class SecretariaGeneralHomeComponent implements OnInit {
  private pagoService = inject(PagoService);
  private postulacionService = inject(PostulacionService);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private pagoReporteService = inject(PagoReporteService);

  loading = false;
  fechaHoy: Date = new Date();
  showReportModal = false;
  generandoReporte = false;

  pagos: HistorialPagoItem[] = [];
  pagosPendientes: HistorialPagoItem[] = [];
  pagosAprobadosHoy: HistorialPagoItem[] = [];
  pagosRechazadosHoy: HistorialPagoItem[] = [];

  // Postulaciones aprobadas pendientes de pago de matrícula
  postulacionesAprobadasSinPago: any[] = [];
  totalPostulacionesSinPago: number = 0;
  cargandoPostulacionesSinPago: boolean = false;

  kpis = {
    totalPagosHoy: 0,
    montoRecaudadoHoy: 0,
    montoValidadoHoy: 0,
    montoPendiente: 0,
    montoRechazadoHoy: 0,
    pendientesValidacion: 0,
    aprobadosHoy: 0,
    rechazadosHoy: 0
  };

  ngOnInit(): void {
    this.cargarControlDiario();
    this.cargarPostulacionesSinPago();
  }

  cargarPostulacionesSinPago(): void {
    this.cargandoPostulacionesSinPago = true;
    this.postulacionService.getAllPostulaciones(1, 100, undefined, undefined, undefined, undefined, 4).subscribe({
      next: (response) => {
        this.cargandoPostulacionesSinPago = false;
        const items = (response.items as any[]) || [];
        this.postulacionesAprobadasSinPago = items.filter(p => !p.matriculaPagada);
        this.totalPostulacionesSinPago = this.postulacionesAprobadasSinPago.length;
      },
      error: (err) => {
        console.error('Error al cargar postulaciones aprobadas sin pago:', err);
        this.cargandoPostulacionesSinPago = false;
        this.postulacionesAprobadasSinPago = [];
        this.totalPostulacionesSinPago = 0;
      }
    });
  }

  irAPagosEstudiante(documento: string): void {
    if (documento) {
      this.router.navigate(['/dashboard/pagos'], { queryParams: { documento } });
    } else {
      this.router.navigate(['/dashboard/pagos']);
    }
  }

  cargarControlDiario(): void {
    this.loading = true;
    const hoyStr = this.toDateOnlyString(new Date());

    this.pagoService.getHistorialPagosContabilidadFiltrado({
      fechaDesde: hoyStr,
      fechaHasta: hoyStr
    }).subscribe({
      next: (response) => {
        const rawData = response?.isSuccess && response.data ? response.data : [];
        this.pagos = rawData.map((item: any) => this.normalizarPagoItem(item));
        this.procesarMetricasDiarias();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando control diario para secretaría:', error);
        this.loading = false;
        this.pagos = [];
        this.procesarMetricasDiarias();
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar la información del día.'
        });
      }
    });
  }

  getValidacionLabel(esValidado: boolean | null): string {
    if (esValidado === true) return 'Validado';
    if (esValidado === false) return 'Rechazado';
    return 'Pendiente';
  }

  getValidacionSeverity(esValidado: boolean | null): 'success' | 'danger' | 'warn' {
    if (esValidado === true) return 'success';
    if (esValidado === false) return 'danger';
    return 'warn';
  }

  getPorcentajeValidados(): number {
    return this.kpis.montoRecaudadoHoy > 0 ? (this.kpis.montoValidadoHoy / this.kpis.montoRecaudadoHoy) * 100 : 0;
  }

  getPorcentajePendientes(): number {
    return this.kpis.montoRecaudadoHoy > 0 ? (this.kpis.montoPendiente / this.kpis.montoRecaudadoHoy) * 100 : 0;
  }

  getPorcentajeRechazados(): number {
    return this.kpis.montoRecaudadoHoy > 0 ? (this.kpis.montoRechazadoHoy / this.kpis.montoRecaudadoHoy) * 100 : 0;
  }

  exportarReporteDiario(): void {
    if (this.pagos.length === 0) {
      this.messageService.add({
        severity: 'info',
        summary: 'Sin registros',
        detail: 'No hay transacciones registradas el día de hoy para generar reporte.'
      });
      return;
    }
    this.showReportModal = true;
  }

  cerrarModalReporte(): void {
    this.showReportModal = false;
  }

  exportarReportePDF(): void {
    if (this.pagos.length === 0) return;

    const titulo = 'Reporte Diario - Secretaría General';
    const subtitulo = `Fecha: ${new Date().toLocaleDateString('es-EC')} | Total: ${this.pagos.length} pago(s)`;

    this.generandoReporte = true;
    this.pagoReporteService.exportarPDF(this.pagos as any, titulo, subtitulo)
      .then(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'PDF Generado',
          detail: 'El reporte diario PDF se descargó correctamente.'
        });
        this.showReportModal = false;
      })
      .catch((err) => {
        console.error('Error al generar PDF:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo generar el documento PDF.'
        });
      })
      .finally(() => {
        this.generandoReporte = false;
      });
  }

  exportarReporteExcel(): void {
    if (this.pagos.length === 0) return;

    const titulo = 'Reporte Diario - Secretaría General';
    const subtitulo = `Fecha: ${new Date().toLocaleDateString('es-EC')} | Total: ${this.pagos.length} pago(s)`;

    try {
      this.pagoReporteService.exportarExcel(this.pagos as any, titulo, subtitulo);
      this.messageService.add({
        severity: 'success',
        summary: 'Excel Generado',
        detail: 'El reporte diario Excel se descargó correctamente.'
      });
      this.showReportModal = false;
    } catch (err) {
      console.error('Error al generar Excel:', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo generar el archivo Excel.'
      });
    }
  }

  private normalizarPagoItem(item: any): HistorialPagoItem {
    let esValidadoNormalized: boolean | null = null;

    if (item.esValidado !== undefined && item.esValidado !== null) {
      esValidadoNormalized = item.esValidado;
    } else if (item.estadoPago) {
      const estadoUpper = String(item.estadoPago).toUpperCase();
      if (estadoUpper.includes('APROBADO') || estadoUpper.includes('VALIDADO')) {
        esValidadoNormalized = true;
      } else if (estadoUpper.includes('RECHAZADO') || estadoUpper.includes('CANCELADO')) {
        esValidadoNormalized = false;
      } else {
        esValidadoNormalized = null;
      }
    }

    return {
      idPago: item.idPago,
      fechaPago: item.fechaPago,
      valorPago: Number(item.valorPago) || 0,
      tipoPago: item.tipoPago || 'Depósito/Transferencia',
      esValidado: esValidadoNormalized,
      estadoPago: item.estadoPago,
      estadoCredito: item.estadoCredito || 'N/A',
      documento: item.documento || '',
      numeroDeposito: item.numeroDeposito || '',
      bancoDeposito: item.bancoDeposito || 'Sin banco especificado',
      alumnoNombre: item.alumnoNombre || 'Alumno Desconocido',
      observaciones: item.observaciones || ''
    };
  }

  private procesarMetricasDiarias(): void {
    this.kpis.totalPagosHoy = this.pagos.length;
    this.kpis.montoRecaudadoHoy = this.pagos.reduce((sum, p) => sum + p.valorPago, 0);

    const validados = this.pagos.filter(p => p.esValidado === true);
    const pendientes = this.pagos.filter(p => p.esValidado === null);
    const rechazados = this.pagos.filter(p => p.esValidado === false);

    this.kpis.aprobadosHoy = validados.length;
    this.kpis.pendientesValidacion = pendientes.length;
    this.kpis.rechazadosHoy = rechazados.length;

    this.kpis.montoValidadoHoy = validados.reduce((sum, p) => sum + p.valorPago, 0);
    this.kpis.montoPendiente = pendientes.reduce((sum, p) => sum + p.valorPago, 0);
    this.kpis.montoRechazadoHoy = rechazados.reduce((sum, p) => sum + p.valorPago, 0);

    this.pagosPendientes = pendientes.sort((a, b) => new Date(b.fechaPago).getTime() - new Date(a.fechaPago).getTime());
    this.pagosAprobadosHoy = validados.sort((a, b) => new Date(b.fechaPago).getTime() - new Date(a.fechaPago).getTime());
    this.pagosRechazadosHoy = rechazados.sort((a, b) => new Date(b.fechaPago).getTime() - new Date(a.fechaPago).getTime());
  }

  private toDateOnlyString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
