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
import { PagoService } from '../../../core/services/pagos/pago.service';
import { SharedToastComponent } from '../../../shared/shared-toast/shared-toast.component';

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

interface BancoResumen {
  banco: string;
  totalPagos: number;
  montoTotal: number;
  montoValidado: number;
  montoPendiente: number;
}

@Component({
  selector: 'app-master-contabilidad-home',
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
    SharedToastComponent
  ],
  providers: [MessageService],
  templateUrl: './master-contabilidad-home.component.html',
  styleUrls: ['./master-contabilidad-home.component.css']
})
export class MasterContabilidadHomeComponent implements OnInit {
  private pagoService = inject(PagoService);
  private messageService = inject(MessageService);

  loading = false;
  fechaDesde: Date | null = null;
  fechaHasta: Date | null = null;

  pagos: HistorialPagoItem[] = [];
  pagosPendientesRecientes: HistorialPagoItem[] = [];
  pagosRechazadosRecientes: HistorialPagoItem[] = [];
  bancosResumen: BancoResumen[] = [];

  kpis = {
    totalPagos: 0,
    montoTotal: 0,
    montoValidado: 0,
    montoPendiente: 0,
    montoRechazado: 0,
    pendientesValidacion: 0,
    rechazados: 0,
    aprobados: 0
  };

  ngOnInit(): void {
    this.irRangoEsteMes();
  }

  aplicarRango(): void {
    if (!this.fechaDesde || !this.fechaHasta) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Rango incompleto',
        detail: 'Selecciona fecha desde y fecha hasta'
      });
      return;
    }

    if (this.fechaDesde > this.fechaHasta) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Rango inválido',
        detail: 'La fecha desde no puede ser mayor a la fecha hasta'
      });
      return;
    }

    this.cargarResumen();
  }

  irRangoHoy(): void {
    const hoy = new Date();
    this.fechaDesde = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 0, 0, 0);
    this.fechaHasta = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59);
    this.cargarResumen();
  }

  irRangoEsteMes(): void {
    const hoy = new Date();
    this.fechaDesde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    this.fechaHasta = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59);
    this.cargarResumen();
  }

  irRangoUltimoAnio(): void {
    const hoy = new Date();
    const desde = new Date(hoy);
    desde.setFullYear(desde.getFullYear() - 1);

    this.fechaDesde = desde;
    this.fechaHasta = hoy;
    this.cargarResumen();
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
    return this.kpis.montoTotal > 0 ? (this.kpis.montoValidado / this.kpis.montoTotal) * 100 : 0;
  }

  getPorcentajePendientes(): number {
    return this.kpis.montoTotal > 0 ? (this.kpis.montoPendiente / this.kpis.montoTotal) * 100 : 0;
  }

  getPorcentajeRechazados(): number {
    return this.kpis.montoTotal > 0 ? (this.kpis.montoRechazado / this.kpis.montoTotal) * 100 : 0;
  }

  private cargarResumen(): void {
    if (!this.fechaDesde || !this.fechaHasta) return;

    this.loading = true;
    this.pagoService.getHistorialPagosContabilidadFiltrado({
      fechaDesde: this.toDateOnlyString(this.fechaDesde),
      fechaHasta: this.toDateOnlyString(this.fechaHasta),
      pageNumber: 1,
      pageSize: 5000
    }).subscribe({
      next: (response) => {
        const rawData = response?.isSuccess && response.data ? (Array.isArray(response.data) ? response.data : (response.data.items || [])) : [];
        this.pagos = rawData.map((item: any) => this.normalizarPagoItem(item));
        this.procesarKPIs();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando resumen de contabilidad:', error);
        this.loading = false;
        this.pagos = [];
        this.procesarKPIs();
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar el resumen de contabilidad'
        });
      }
    });
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

  private procesarKPIs(): void {
    this.kpis.totalPagos = this.pagos.length;
    this.kpis.montoTotal = this.pagos.reduce((sum, p) => sum + p.valorPago, 0);

    const validados = this.pagos.filter(p => p.esValidado === true);
    const pendientes = this.pagos.filter(p => p.esValidado === null);
    const rechazados = this.pagos.filter(p => p.esValidado === false);

    this.kpis.aprobados = validados.length;
    this.kpis.pendientesValidacion = pendientes.length;
    this.kpis.rechazados = rechazados.length;

    this.kpis.montoValidado = validados.reduce((sum, p) => sum + p.valorPago, 0);
    this.kpis.montoPendiente = pendientes.reduce((sum, p) => sum + p.valorPago, 0);
    this.kpis.montoRechazado = rechazados.reduce((sum, p) => sum + p.valorPago, 0);

    // Listas ordenadas recientes
    this.pagosPendientesRecientes = pendientes
      .sort((a, b) => new Date(b.fechaPago).getTime() - new Date(a.fechaPago).getTime());

    this.pagosRechazadosRecientes = rechazados
      .sort((a, b) => new Date(b.fechaPago).getTime() - new Date(a.fechaPago).getTime());

    // Resumen por bancos
    const mapaBancos = new Map<string, BancoResumen>();

    this.pagos.forEach((pago) => {
      const bankKey = (pago.bancoDeposito || 'Sin banco').trim() || 'Sin banco';
      const actual = mapaBancos.get(bankKey) || {
        banco: bankKey,
        totalPagos: 0,
        montoTotal: 0,
        montoValidado: 0,
        montoPendiente: 0
      };

      actual.totalPagos += 1;
      actual.montoTotal += pago.valorPago;
      if (pago.esValidado === true) {
        actual.montoValidado += pago.valorPago;
      } else if (pago.esValidado === null) {
        actual.montoPendiente += pago.valorPago;
      }

      mapaBancos.set(bankKey, actual);
    });

    this.bancosResumen = Array.from(mapaBancos.values())
      .sort((a, b) => b.montoTotal - a.montoTotal);
  }

  private toDateOnlyString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
