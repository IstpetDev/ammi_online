import { Injectable, inject } from '@angular/core';
import { HistorialPago } from '../../../../shared/models/pagos.model';
import { ReporteBaseService, ColumnaReporte, ReporteConfig } from '../reporte-base.service';

const COLUMNAS_PAGO: ColumnaReporte[] = [
  { header: 'Fecha', key: 'fecha' },
  { header: 'Estudiante / Cliente', key: 'estudiante' },
  { header: 'Documento / Cédula', key: 'documento' },
  { header: 'Método / Tipo', key: 'tipoPago' },
  { header: 'N° Depósito / Transacción', key: 'numeroDeposito' },
  { header: 'Banco', key: 'banco' },
  { header: 'Estado', key: 'estadoPago', tipo: 'estado' },
  { header: 'Monto ($)', key: 'monto', tipo: 'monto' }
];

@Injectable({
  providedIn: 'root'
})
export class PagoReporteService {
  private reporteBase = inject(ReporteBaseService);

  private MapearDatosPagos(pagos: HistorialPago[]): Record<string, any>[] {
    return pagos.map(p => {
      const fechaObj = p.fechaPago ? new Date(p.fechaPago) : null;
      const fechaFormateada = fechaObj && !isNaN(fechaObj.getTime())
        ? fechaObj.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : (p.fechaPago || 'N/A');

      return {
        fecha: fechaFormateada,
        estudiante: p.alumnoNombre || p.clienteNombre || 'Sin nombre',
        documento: p.clienteDocumento || p.documento || 'S/D',
        tipoPago: p.tipoPago || 'N/A',
        numeroDeposito: p.numeroDeposito || 'N/A',
        banco: p.bancoDeposito || 'N/A',
        estadoPago: p.estadoPago || 'PENDIENTE',
        monto: p.valorPago ?? 0
      };
    });
  }

  exportarExcel(pagos: HistorialPago[], titulo: string = 'Reporte de Pagos', subtitulo?: string): void {
    const datosProcesados = this.MapearDatosPagos(pagos);
    const config: ReporteConfig = {
      titulo,
      subtitulo: subtitulo || `Total Registros: ${pagos.length}`,
      nombreArchivo: `${titulo.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}`,
      columnas: COLUMNAS_PAGO
    };

    this.reporteBase.generarExcel(datosProcesados, config);
  }

  async exportarPDF(pagos: HistorialPago[], titulo: string = 'Reporte de Pagos', subtitulo?: string): Promise<void> {
    const datosProcesados = this.MapearDatosPagos(pagos);

    const montoTotal = pagos.reduce((acc, curr) => acc + (curr.valorPago || 0), 0);
    const subtituloConTotal = `${subtitulo ? subtitulo + ' | ' : ''}Total Registros: ${pagos.length} | Suma Total: $${montoTotal.toFixed(2)}`;

    const config: ReporteConfig = {
      titulo,
      subtitulo: subtituloConTotal,
      nombreArchivo: `${titulo.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}`,
      columnas: COLUMNAS_PAGO
    };

    await this.reporteBase.generarPDF(datosProcesados, config);
  }
}
