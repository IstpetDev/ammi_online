import { Injectable, inject } from '@angular/core';
import { Observable, map, forkJoin } from 'rxjs';
import { PostulacionService } from '../../../../core/services/postulaciones/postulacion.service';
import { PostulacionCompletaDTO } from '../../../../data/models/Entities';
import { ReporteBaseService, ReporteConfig } from '../reporte-base.service';

/**
 * Columnas disponibles para el reporte de postulaciones.
 * Se pueden agregar, quitar o reordenar según necesidad.
 */
const COLUMNAS_POSTULACION: ReporteConfig['columnas'] = [
  { header: 'ID',                  key: 'idPostulacion' },
  { header: 'Documento',           key: 'Documento' },
  { header: 'Tipo Documento',      key: 'TipoDocumento' },
  { header: 'Nombre Completo',     key: 'NombreCompleto' },
  { header: 'Género',              key: 'Genero' },
  { header: 'Fecha Nacimiento',    key: 'FechaNacimiento' },
  { header: 'Edad',                key: 'Edad' },
  { header: 'Estado Civil',        key: 'EstadoCivil' },
  { header: 'Nacionalidad Étnica', key: 'NacionalidadEtnica' },
  { header: 'Parroquia',           key: 'Parroquia' },
  { header: 'Dirección',          key: 'DireccionDomiciliaria' },
  { header: 'Ciclo',               key: 'Ciclo' },
  { header: 'Curso',               key: 'Curso' },
  { header: 'Oferta Académica',   key: 'OfertaAcademica' },
  { header: 'Fecha Postulación',  key: 'FechaPostulacion' },
  { header: 'Estado',              key: 'Estado' },
];

@Injectable({
  providedIn: 'root'
})
export class PostulacionReporteService {
  private postulacionService = inject(PostulacionService);
  private reporteBase = inject(ReporteBaseService);

  // ─────────────────────────────────────────────────────────────────────────────
  //  OBTENCIÓN DE DATOS
  // ─────────────────────────────────────────────────────────────────────────────

  /** Obtiene todas las postulaciones sin filtros */
  obtenerTodasLasPostulaciones(): Observable<PostulacionCompletaDTO[]> {
    return this.postulacionService.getPostulacionesFromAPI();
  }

  /** Obtiene postulaciones filtradas por ciclo y tipo de oferta */
  obtenerPorCicloYOferta(idCiclo: number, idOferta: number): Observable<PostulacionCompletaDTO[]> {
    return this.postulacionService.getPostulacionesByCicloAndOferta(idCiclo, idOferta, 1, 10000).pipe(
      map(response => response.items)
    );
  }

  /** Obtiene postulaciones para un listado de ciclos de forma consolidada */
  obtenerPorRangoCiclosYOferta(idCiclos: number[], idOferta: number): Observable<PostulacionCompletaDTO[]> {
    const observables = idCiclos.map(id => 
      this.postulacionService.getPostulacionesByCicloAndOferta(id, idOferta, 1, 10000).pipe(
        map(response => response.items || [])
      )
    );
    return forkJoin(observables).pipe(
      map(results => results.reduce((acc, val) => acc.concat(val), []))
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  //  EXCEL
  // ─────────────────────────────────────────────────────────────────────────────

  /** Descarga reporte Excel con todas las postulaciones */
  exportarExcelTodas(): void {
    this.obtenerTodasLasPostulaciones().subscribe({
      next: (datos) => this._generarExcel(datos, 'Todas'),
      error: (err) => console.error('Error al obtener postulaciones para Excel:', err)
    });
  }

  /** Descarga reporte Excel filtrado por ciclo y oferta */
  exportarExcelPorCicloYOferta(idCiclo: number, idOferta: number, labelCiclo: string, labelOferta: string): void {
    this.obtenerPorCicloYOferta(idCiclo, idOferta).subscribe({
      next: (datos) => this._generarExcel(datos, `${labelCiclo} - ${labelOferta}`),
      error: (err) => console.error('Error al obtener postulaciones para Excel:', err)
    });
  }

  /** Descarga reporte Excel filtrado por un rango de ciclos y oferta */
  exportarExcelPorRangoCiclosYOferta(idCiclos: number[], idOferta: number, labelRangoCiclos: string, labelOferta: string): void {
    this.obtenerPorRangoCiclosYOferta(idCiclos, idOferta).subscribe({
      next: (datos) => this._generarExcel(datos, `${labelRangoCiclos} - ${labelOferta}`),
      error: (err) => console.error('Error al obtener postulaciones para Excel:', err)
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  //  PDF
  // ─────────────────────────────────────────────────────────────────────────────

  /** Descarga reporte PDF con todas las postulaciones */
  exportarPDFTodas(): void {
    this.obtenerTodasLasPostulaciones().subscribe({
      next: (datos) => this._generarPDF(datos, 'Todas'),
      error: (err) => console.error('Error al obtener postulaciones para PDF:', err)
    });
  }

  /** Descarga reporte PDF filtrado por ciclo y oferta */
  exportarPDFPorCicloYOferta(idCiclo: number, idOferta: number, labelCiclo: string, labelOferta: string): void {
    this.obtenerPorCicloYOferta(idCiclo, idOferta).subscribe({
      next: (datos) => this._generarPDF(datos, `${labelCiclo} - ${labelOferta}`),
      error: (err) => console.error('Error al obtener postulaciones para PDF:', err)
    });
  }

  /** Descarga reporte PDF filtrado por un rango de ciclos y oferta */
  exportarPDFPorRangoCiclosYOferta(idCiclos: number[], idOferta: number, labelRangoCiclos: string, labelOferta: string): void {
    this.obtenerPorRangoCiclosYOferta(idCiclos, idOferta).subscribe({
      next: (datos) => this._generarPDF(datos, `${labelRangoCiclos} - ${labelOferta}`),
      error: (err) => console.error('Error al obtener postulaciones para PDF:', err)
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  //  HELPERS PRIVADOS
  // ─────────────────────────────────────────────────────────────────────────────

  private _config(subtitulo: string): ReporteConfig {
    const fecha = new Date().toISOString().slice(0, 10);
    return {
      titulo: 'Reporte de Postulaciones',
      subtitulo,
      nombreArchivo: `postulaciones_${fecha}`,
      columnas: COLUMNAS_POSTULACION
    };
  }

  private _generarExcel(datos: PostulacionCompletaDTO[], subtitulo: string): void {
    this.reporteBase.generarExcel(datos as Record<string, any>[], this._config(subtitulo));
  }

  private _generarPDF(datos: PostulacionCompletaDTO[], subtitulo: string): void {
    void this.reporteBase.generarPDF(datos as Record<string, any>[], this._config(subtitulo));
  }
}
