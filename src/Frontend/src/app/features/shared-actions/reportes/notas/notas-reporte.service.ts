import { Injectable, inject } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import ExcelJS from 'exceljs';

import { ReporteBaseService, ReporteConfig } from '../reporte-base.service';
import { MatriculaService } from '../../../../core/services/postulaciones/matricula.service';
import { DetalleMallaService } from '../../../../core/services/infrastructure/detalle-malla.service';
import { NotasAlumnoService } from '../../../../core/services/infrastructure/notas-alumno.service';
import { PlantillaEstructuraService } from '../../../../core/services/infrastructure/plantilla-estructura.service';
import { PlantillaEstructuraDTO } from '../../../../data/models/notas/plantilla-estructura.model';
import { NotasAlumnoDTO } from '../../../../data/models/notas/notas-alumno.model';
import {
  SabanaNotaFilaDTO,
  QuimestreFilaDTO,
  QuimesteMateriaColumnaDTO
} from '../../../../data/models/notas/sabana-notas.model';

// ─── Tipos internos de cálculo ─────────────────────────────────────────────

interface AlumnoBase {
  idDetalleMatricula: number | null;
  idMatricula: number;
  nombreAlumno: string;
  documentoAlumno: string;
}

type PesosMap = { [idEstructura: number]: number };

// ─── Service ───────────────────────────────────────────────────────────────

@Injectable({
  providedIn: 'root'
})
export class NotasReporteService {

  private reporteBase     = inject(ReporteBaseService);
  private matriculaService = inject(MatriculaService);
  private detalleMallaService = inject(DetalleMallaService);
  private notasService     = inject(NotasAlumnoService);
  private estructuraService = inject(PlantillaEstructuraService);

  // =========================================================================
  //  SÁBANA DE NOTAS — Cuadro por materia (Macro Final)
  // =========================================================================

  /**
   * Genera y descarga el Excel de la Sábana de Notas para una materia.
   * Filtros: idMallaParalelo + idDetalleMalla (+ idPlantillaEvaluacion para pesos).
   */
  exportarSabanaExcel(
    idMallaParalelo: number,
    idDetalleMalla: number,
    idPlantillaEvaluacion: number,
    meta: { ciclo: string; nivel: string; paralelo: string; materia: string }
  ): Observable<void> {
    return this._calcularFilasSabana(idMallaParalelo, idDetalleMalla, idPlantillaEvaluacion).pipe(
      map(filas => {
        const config = this._configSabana(meta);
        this.reporteBase.generarExcel(filas as Record<string, any>[], config);
      })
    );
  }

  /**
   * Genera y descarga el PDF de la Sábana de Notas para una materia.
   */
  exportarSabanaPDF(
    idMallaParalelo: number,
    idDetalleMalla: number,
    idPlantillaEvaluacion: number,
    meta: { ciclo: string; nivel: string; paralelo: string; materia: string }
  ): Observable<void> {
    return this._calcularFilasSabana(idMallaParalelo, idDetalleMalla, idPlantillaEvaluacion).pipe(
      switchMap(filas => this.reporteBase.generarPDF(filas as Record<string, any>[], this._configSabana(meta)))
    );
  }

  /**
   * Genera y descarga un único Excel con una hoja por cada materia del paralelo.
   */
  exportarSabanaCompletaExcel(
    idMalla: number,
    idMallaParalelo: number,
    meta: { periodo: string; ciclo: string; nivel: string; paralelo: string }
  ): Observable<void> {
    return this.detalleMallaService.getByMalla(idMalla, 1, 200).pipe(
      switchMap(materias => {
        if (materias.length === 0) throw new Error('No hay materias en esta malla');

        const calculos$ = materias.map(m =>
          this._calcularFilasSabana(idMallaParalelo, m.idDetalleMalla, m.idPlantillaEvaluacion ?? 0).pipe(
            map(filas => ({ materia: m, filas }))
          )
        );

        return forkJoin(calculos$);
      }),
      map(resultados => {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'AMMI Online';
        const fecha = new Date().toISOString().slice(0, 10);

        const sheet = workbook.addWorksheet('Sábana de Notas');

        // Configuración de bordes y estilos
        const borderStyle: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: 'FF000000' } };
        const border = { top: borderStyle, bottom: borderStyle, left: borderStyle, right: borderStyle };

        // 1. Título e Información en la parte superior
        sheet.getRow(2).height = 24;

        const cellParaleloLabel = sheet.getCell('B2');
        cellParaleloLabel.value = 'PARALELO:';
        cellParaleloLabel.font = { name: 'Calibri', size: 10, bold: true };
        cellParaleloLabel.alignment = { horizontal: 'right', vertical: 'middle' };

        const cellParaleloVal = sheet.getCell('C2');
        cellParaleloVal.value = meta.paralelo.toUpperCase();
        cellParaleloVal.font = { name: 'Calibri', size: 10, bold: true };
        cellParaleloVal.alignment = { horizontal: 'left', vertical: 'middle' };

        const cellOfertaLabel = sheet.getCell('E2');
        cellOfertaLabel.value = 'OFERTA EDUCATIVA:';
        cellOfertaLabel.font = { name: 'Calibri', size: 10, bold: true };
        cellOfertaLabel.alignment = { horizontal: 'right', vertical: 'middle' };

        const cellOfertaVal = sheet.getCell('F2');
        cellOfertaVal.value = meta.nivel.toUpperCase();
        cellOfertaVal.font = { name: 'Calibri', size: 10, bold: true };
        cellOfertaVal.alignment = { horizontal: 'left', vertical: 'middle' };

        // 2. Encabezados de columnas (Fila 4)
        const headerRow = sheet.getRow(4);
        headerRow.height = 100;

        const cellOrd = headerRow.getCell(1);
        cellOrd.value = 'ORD.';
        cellOrd.alignment = { horizontal: 'center', vertical: 'middle' };
        cellOrd.font = { name: 'Calibri', size: 9, bold: true };
        cellOrd.border = border;

        const cellCed = headerRow.getCell(2);
        cellCed.value = 'Nº DE CEDULA';
        cellCed.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cellCed.font = { name: 'Calibri', size: 9, bold: true };
        cellCed.border = border;

        const cellNom = headerRow.getCell(3);
        cellNom.value = 'APELLIDOS Y NOMBRES';
        cellNom.alignment = { horizontal: 'center', vertical: 'middle' };
        cellNom.font = { name: 'Calibri', size: 9, bold: true };
        cellNom.border = border;

        resultados.forEach((res, i) => {
          const colStart = 4 + i * 4;

          // Nombre de Materia
          const cellMat = headerRow.getCell(colStart);
          cellMat.value = res.materia.nombreMateria?.toUpperCase() ?? '';
          cellMat.alignment = { textRotation: 90, horizontal: 'center', vertical: 'middle', wrapText: true };
          cellMat.font = { name: 'Calibri', size: 9, bold: true };
          cellMat.border = border;

          // SUPL
          const cellSupl = headerRow.getCell(colStart + 1);
          cellSupl.value = 'SUPL';
          cellSupl.alignment = { textRotation: 90, horizontal: 'center', vertical: 'middle' };
          cellSupl.font = { name: 'Calibri', size: 9, bold: true };
          cellSupl.border = border;

          // PROM. FIN
          const cellPromFin = headerRow.getCell(colStart + 2);
          cellPromFin.value = 'PROM. FIN';
          cellPromFin.alignment = { textRotation: 90, horizontal: 'center', vertical: 'middle' };
          cellPromFin.font = { name: 'Calibri', size: 9, bold: true };
          cellPromFin.border = border;

          // Columna Cualitativa (sin texto, fondo verde)
          const cellQual = headerRow.getCell(colStart + 3);
          cellQual.value = '';
          cellQual.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } };
          cellQual.border = border;
        });

        // 3. Procesar Alumnos y Notas
        const alumnosMap = new Map<string, { cedula: string, nombreAlumno: string }>();
        resultados.forEach(res => {
          res.filas.forEach(f => {
            if (f.cedula) {
              alumnosMap.set(f.cedula, { cedula: f.cedula, nombreAlumno: f.nombreAlumno });
            }
          });
        });

        const listaAlumnos = Array.from(alumnosMap.values()).sort((a, b) =>
          a.nombreAlumno.localeCompare(b.nombreAlumno)
        );

        let rowIdx = 5;
        listaAlumnos.forEach((alumno, idx) => {
          const row = sheet.getRow(rowIdx);
          row.height = 20;

          // Ordinal
          const cOrd = row.getCell(1);
          cOrd.value = idx + 1;
          cOrd.alignment = { horizontal: 'center', vertical: 'middle' };
          cOrd.font = { name: 'Calibri', size: 10 };
          cOrd.border = border;

          // Cédula
          const cCed = row.getCell(2);
          cCed.value = alumno.cedula;
          cCed.alignment = { horizontal: 'center', vertical: 'middle' };
          cCed.font = { name: 'Calibri', size: 10 };
          cCed.border = border;

          // Nombre
          const cNom = row.getCell(3);
          cNom.value = alumno.nombreAlumno.toUpperCase();
          cNom.alignment = { horizontal: 'left', vertical: 'middle' };
          cNom.font = { name: 'Calibri', size: 10 };
          cNom.border = border;

          // Notas de cada materia
          resultados.forEach((res, subIdx) => {
            const colStart = 4 + subIdx * 4;
            const fNota = res.filas.find(f => f.cedula === alumno.cedula);

            const notaVal = fNota?.notaFinalMateria ?? null;
            const suplVal = fNota?.notaSupletorio ?? null;
            const promVal = fNota?.promedioFinal ?? null;
            const qualText = this._obtenerCualitativa(promVal);

            // Grade column
            const cNota = row.getCell(colStart);
            cNota.value = notaVal !== null ? notaVal : '';
            cNota.alignment = { horizontal: 'center', vertical: 'middle' };
            cNota.border = border;
            if (notaVal !== null && notaVal < 7) {
              cNota.font = { name: 'Calibri', size: 10, color: { argb: 'FFFF0000' }, bold: true };
            } else {
              cNota.font = { name: 'Calibri', size: 10 };
            }

            // SUPL column
            const cSupl = row.getCell(colStart + 1);
            cSupl.value = suplVal !== null ? suplVal : '';
            cSupl.alignment = { horizontal: 'center', vertical: 'middle' };
            cSupl.border = border;
            if (suplVal !== null && suplVal < 7) {
              cSupl.font = { name: 'Calibri', size: 10, color: { argb: 'FFFF0000' }, bold: true };
            } else {
              cSupl.font = { name: 'Calibri', size: 10 };
            }

            // PROM. FIN column (verde)
            const cProm = row.getCell(colStart + 2);
            cProm.value = promVal !== null ? promVal : '';
            cProm.alignment = { horizontal: 'center', vertical: 'middle' };
            cProm.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } };
            cProm.border = border;
            if (promVal !== null && promVal < 7) {
              cProm.font = { name: 'Calibri', size: 10, color: { argb: 'FFFF0000' }, bold: true };
            } else {
              cProm.font = { name: 'Calibri', size: 10 };
            }

            // Cualitativa column (verde)
            const cQual = row.getCell(colStart + 3);
            cQual.value = qualText;
            cQual.alignment = { horizontal: 'left', vertical: 'middle' };
            cQual.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } };
            cQual.border = border;
            cQual.font = { name: 'Calibri', size: 9 };
          });

          rowIdx++;
        });

        // Configuración de anchos de columna
        const colWidths = [
          { width: 6 },   // ORD
          { width: 14 },  // Nº DE CEDULA
          { width: 35 }   // APELLIDOS Y NOMBRES
        ];
        resultados.forEach(() => {
          colWidths.push({ width: 8 });  // Grade
          colWidths.push({ width: 8 });  // SUPL
          colWidths.push({ width: 10 }); // PROM FIN
          colWidths.push({ width: 14 }); // QUAL
        });
        sheet.columns = colWidths;

        workbook.xlsx.writeBuffer().then((buffer) => {
          const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `sabana_notas_completa_${meta.paralelo}_${fecha}.xlsx`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        });
      })
    );
  }

  private _obtenerCualitativa(promedio: number | null): string {
    if (promedio === null || promedio < 7) return '';
    if (promedio >= 9) return 'Domina los aprendizajes requeridos';
    return 'Alcanza los aprendizajes requeridos';
  }

  /**
   * Genera y descarga un único Excel con una hoja por materia mostrando
   * todas las notas individuales (cada ítem evaluable como columna).
   */
  exportarNotasDetalladasExcel(
    idMalla: number,
    idMallaParalelo: number,
    meta: { periodo: string; ciclo: string; nivel: string; paralelo: string }
  ): Observable<void> {
    return this.detalleMallaService.getByMalla(idMalla, 1, 200).pipe(
      switchMap(materias => {
        if (materias.length === 0) throw new Error('No hay materias en esta malla');

        const primeraMateria = materias[0];
        const alumnos$ = this.matriculaService.getDetallesMatriculaByMallaParaleloYMateria(
          idMallaParalelo, primeraMateria.idDetalleMalla
        );

        const notasYArbol$ = materias.map(m =>
          forkJoin([
            m.idPlantillaEvaluacion && m.idPlantillaEvaluacion > 0
              ? this.estructuraService.getArbol(m.idPlantillaEvaluacion)
              : of<PlantillaEstructuraDTO[]>([]),
            this.notasService.getByMallaParalelo(idMallaParalelo, { idDetalleMalla: m.idDetalleMalla })
          ]).pipe(
            map(([arbol, notas]) => ({ materia: m, arbol, notas }))
          )
        );

        return forkJoin([alumnos$, forkJoin(notasYArbol$)]).pipe(
          map(([alumnos, materiasData]) => ({ alumnos, materiasData }))
        );
      }),
      map(({ alumnos, materiasData }) => {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'AMMI Online';
        const fecha = new Date().toISOString().slice(0, 10);

        const borderStyle: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: 'FF000000' } };
        const border = { top: borderStyle, bottom: borderStyle, left: borderStyle, right: borderStyle };

        materiasData.forEach(({ materia, arbol, notas }) => {
          const hojas = this._extraerHojas(arbol);
          const pesosEfectivos = this._calcularPesosEfectivos(arbol);
          const nombreMateria = (materia.nombreMateria ?? `Materia ${materia.idDetalleMalla}`).substring(0, 31);
          const sheet = workbook.addWorksheet(nombreMateria);

          const notasPorDetalle = new Map<number, NotasAlumnoDTO[]>();
          notas.forEach(n => {
            if (n.idMatricula != null) {
              const arr = notasPorDetalle.get(n.idMatricula) ?? [];
              arr.push(n);
              notasPorDetalle.set(n.idMatricula, arr);
            }
          });

          const columnas: { header: string; key: string }[] = [
            { header: 'N°', key: 'numero' },
            { header: 'Cédula', key: 'cedula' },
            { header: 'Apellidos y Nombres', key: 'nombreAlumno' }
          ];
          hojas.forEach(h => {
            columnas.push({ header: h.nodoNombre, key: `eval_${h.idPlantillaEstructura}` });
          });
          columnas.push(
            { header: 'Nota Final', key: 'notaFinal' },
            { header: 'Supletorio', key: 'supletorio' },
            { header: 'Promedio Final', key: 'promedioFinal' },
            { header: 'Estado', key: 'estado' }
          );

          const colCount = columnas.length;
          let rowIdx = 1;

          sheet.mergeCells(rowIdx, 1, rowIdx, colCount);
          const titleCell = sheet.getCell(rowIdx, 1);
          titleCell.value = 'NOTAS DETALLADAS POR MATERIA';
          titleCell.font = { name: 'Calibri', size: 18, bold: true, color: { argb: 'FF1E293B' } };
          titleCell.alignment = { horizontal: 'left', vertical: 'middle' };
          sheet.getRow(rowIdx).height = 36;
          rowIdx++;

          sheet.mergeCells(rowIdx, 1, rowIdx, colCount);
          const subCell = sheet.getCell(rowIdx, 1);
          subCell.value = `${meta.nivel} | Paralelo: ${meta.paralelo} | Materia: ${materia.nombreMateria ?? ''} | Ciclo: ${meta.ciclo}`;
          subCell.font = { name: 'Calibri', size: 11, italic: true, color: { argb: 'FF64748B' } };
          subCell.alignment = { horizontal: 'left', vertical: 'middle' };
          sheet.getRow(rowIdx).height = 22;
          rowIdx++;

          rowIdx++;

          const headerRow = sheet.getRow(rowIdx);
          columnas.forEach((col, idx) => {
            const cell = headerRow.getCell(idx + 1);
            cell.value = col.header;
            cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            cell.border = border;
          });
          headerRow.height = 32;
          rowIdx++;

          alumnos.forEach((alumno, idx) => {
            const notasAlumno = (alumno.idMatricula != null)
              ? (notasPorDetalle.get(alumno.idMatricula) ?? [])
              : [];
            const notasIndex = new Map<number, number | null>();
            notasAlumno.forEach(n => {
              if (n.idPlantillaEstructura != null) {
                notasIndex.set(n.idPlantillaEstructura, n.valorNota ?? null);
              }
            });

            const notaFinal = this._calcularNotaFinal(notasAlumno, hojas, pesosEfectivos);
            const supletorio = notasAlumno.find(n => n.examenRemedial != null)?.examenRemedial ?? null;
            const promedioFinal = this._calcularPromedio(notaFinal, supletorio);
            const estado = this._determinarEstado(promedioFinal, supletorio);

            const row = sheet.getRow(rowIdx);
            columnas.forEach((col, colIdx) => {
              const cell = row.getCell(colIdx + 1);
              let val: any = '';

              if (col.key === 'numero') val = idx + 1;
              else if (col.key === 'cedula') val = alumno.documentoAlumno ?? '';
              else if (col.key === 'nombreAlumno') val = alumno.nombreAlumno ?? '';
              else if (col.key === 'notaFinal') val = notaFinal;
              else if (col.key === 'supletorio') val = supletorio;
              else if (col.key === 'promedioFinal') val = promedioFinal;
              else if (col.key === 'estado') val = estado;
              else if (col.key.startsWith('eval_')) {
                const idEstructura = Number(col.key.replace('eval_', ''));
                val = notasIndex.get(idEstructura) ?? '';
              }

              cell.value = val;
              cell.border = border;
              cell.alignment = { horizontal: 'left', vertical: 'middle' };
              cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF1E293B' } };
              if (idx % 2 === 1) {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
              }
            });
            row.height = 24;
            rowIdx++;
          });

          sheet.columns = columnas.map(c => {
            if (c.key === 'estado') return { width: 16 };
            if (c.key.startsWith('eval_')) return { width: 14 };
            return { width: 26 };
          });
        });

        workbook.xlsx.writeBuffer().then((buffer) => {
          const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `notas_detalladas_${meta.paralelo}_${fecha}.xlsx`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        });
      })
    );
  }

  // =========================================================================
  //  CALIFICACIONES DEL QUIMESTRE — Todas las materias de un paralelo
  // =========================================================================

  /**
   * Genera y descarga el Excel del Cuadro de Calificaciones del Quimestre.
   * Requiere la lista de materias del paralelo.
   */
  exportarQuimestreExcel(
    columnasMaterias: QuimesteMateriaColumnaDTO[],
    meta: { ciclo: string; nivel: string; paralelo: string; ofertaEducativa: string }
  ): Observable<void> {
    return this._calcularFilasQuimestre(columnasMaterias).pipe(
      map(({ filas, nombresMaterias }) => {
        const config = this._configQuimestre(nombresMaterias, meta);
        const filasPlanas = this._aplanarFilasQuimestre(filas, columnasMaterias, nombresMaterias);
        this.reporteBase.generarExcel(filasPlanas, config);
      })
    );
  }

  /**
   * Genera y descarga el PDF del Cuadro de Calificaciones del Quimestre.
   */
  exportarQuimestrePDF(
    columnasMaterias: QuimesteMateriaColumnaDTO[],
    meta: { ciclo: string; nivel: string; paralelo: string; ofertaEducativa: string }
  ): Observable<void> {
    return this._calcularFilasQuimestre(columnasMaterias).pipe(
      switchMap(({ filas, nombresMaterias }) => {
        const config = this._configQuimestre(nombresMaterias, meta);
        const filasPlanas = this._aplanarFilasQuimestre(filas, columnasMaterias, nombresMaterias);
        return this.reporteBase.generarPDF(filasPlanas, config);
      })
    );
  }


  // =========================================================================
  //  CÁLCULO — Sábana de Notas (una materia)
  // =========================================================================

  private _calcularFilasSabana(
    idMallaParalelo: number,
    idDetalleMalla: number,
    idPlantillaEvaluacion: number
  ): Observable<SabanaNotaFilaDTO[]> {
    const alumnos$ = this.matriculaService.getDetallesMatriculaByMallaParaleloYMateria(idMallaParalelo, idDetalleMalla);
    const notas$ = this.notasService.getByMallaParalelo(idMallaParalelo, { idDetalleMalla });
    const arbol$ = idPlantillaEvaluacion > 0
      ? this.estructuraService.getArbol(idPlantillaEvaluacion)
      : of<PlantillaEstructuraDTO[]>([]);

    return forkJoin([alumnos$, notas$, arbol$]).pipe(
      map(([alumnos, notas, arbol]) => {
        const hojas = this._extraerHojas(arbol);
        const pesosEfectivos = this._calcularPesosEfectivos(arbol);

        // Indexar notas por idDetalleMatricula
        const notasPorDetalle = new Map<number, NotasAlumnoDTO[]>();
        notas.forEach(n => {
          if (n.idDetalleMatricula != null) {
            const arr = notasPorDetalle.get(n.idDetalleMatricula) ?? [];
            arr.push(n);
            notasPorDetalle.set(n.idDetalleMatricula, arr);
          }
        });

        return alumnos.map((a, idx) => {
          const notasAlumno = (a.idDetalleMatricula != null)
            ? (notasPorDetalle.get(a.idDetalleMatricula) ?? [])
            : [];

          const notaFinalMateria = this._calcularNotaFinal(notasAlumno, hojas, pesosEfectivos);
          const notaSupletorio = notasAlumno.find(n => n.examenRemedial != null)?.examenRemedial ?? null;
          const promedioFinal = this._calcularPromedio(notaFinalMateria, notaSupletorio);
          const estado = this._determinarEstado(promedioFinal, notaSupletorio);

          const fila: SabanaNotaFilaDTO = {
            numero: idx + 1,
            cedula: a.documentoAlumno ?? '',
            nombreAlumno: a.nombreAlumno ?? '',
            notaFinalMateria,
            notaSupletorio,
            promedioFinal,
            estado
          };
          return fila;
        });
      })
    );
  }

  // =========================================================================
  //  CÁLCULO — Calificaciones del Quimestre (todas las materias)
  // =========================================================================

  private _calcularFilasQuimestre(
    columnasMaterias: QuimesteMateriaColumnaDTO[]
  ): Observable<{ filas: QuimestreFilaDTO[]; nombresMaterias: string[] }> {
    if (columnasMaterias.length === 0) {
      return of({ filas: [], nombresMaterias: [] });
    }

    // Para la primera materia obtenemos la lista de alumnos del paralelo
    const primerMateria = columnasMaterias[0];

    // Construir observables: por cada materia obtenemos notas y estructura
    const notasYArbol$ = columnasMaterias.map(col =>
      forkJoin([
        this.notasService.getByMallaParalelo(col.idMallaParalelo, { idDetalleMalla: col.idDetalleMalla }),
        col.idPlantillaEvaluacion > 0
          ? this.estructuraService.getArbol(col.idPlantillaEvaluacion)
          : of<PlantillaEstructuraDTO[]>([])
      ])
    );

    return forkJoin([
      this.matriculaService.getDetallesMatriculaByMallaParaleloYMateria(
        primerMateria.idMallaParalelo,
        primerMateria.idDetalleMalla
      ),
      forkJoin(notasYArbol$)
    ]).pipe(
      map(([alumnos, notasYArboles]) => {
        const nombresMaterias = columnasMaterias.map(c => c.nombreMateria);

        // Para cada materia, precalcular: notas indexadas, hojas, pesos
        const materiaData = columnasMaterias.map((col, i) => {
          const [notas, arbol] = notasYArboles[i];
          const hojas = this._extraerHojas(arbol);
          const pesosEfectivos = this._calcularPesosEfectivos(arbol);
          const notasPorDetalle = new Map<number, NotasAlumnoDTO[]>();
          notas.forEach(n => {
            if (n.idDetalleMatricula != null) {
              const arr = notasPorDetalle.get(n.idDetalleMatricula) ?? [];
              arr.push(n);
              notasPorDetalle.set(n.idDetalleMatricula, arr);
            }
          });
          return { col, notasPorDetalle, hojas, pesosEfectivos };
        });

        const filas: QuimestreFilaDTO[] = alumnos.map((a, idx) => {
          const notasPorMateria: { [idDetalleMalla: number]: number | null } = {};
          const supletorioPorMateria: { [idDetalleMalla: number]: number | null } = {};
          const notasFinales: (number | null)[] = [];

          materiaData.forEach(({ col, notasPorDetalle, hojas, pesosEfectivos }) => {
            const notasAlumno = (a.idDetalleMatricula != null)
              ? (notasPorDetalle.get(a.idDetalleMatricula) ?? [])
              : [];
            const notaFinal = this._calcularNotaFinal(notasAlumno, hojas, pesosEfectivos);
            const supletorio = notasAlumno.find(n => n.examenRemedial != null)?.examenRemedial ?? null;

            notasPorMateria[col.idDetalleMalla] = notaFinal;
            supletorioPorMateria[col.idDetalleMalla] = supletorio;
            notasFinales.push(this._calcularPromedio(notaFinal, supletorio));
          });

          const promedioGeneral = this._calcularPromedioGeneral(notasFinales);
          const observacion = this._determinarObservacion(promedioGeneral, notasPorMateria, supletorioPorMateria);

          return {
            numero: idx + 1,
            cedula: a.documentoAlumno ?? '',
            nombreAlumno: a.nombreAlumno ?? '',
            notasPorMateria,
            supletorioPorMateria,
            promedio: promedioGeneral,
            observacion
          };
        });

        return { filas, nombresMaterias };
      })
    );
  }

  // =========================================================================
  //  HELPERS DE CÁLCULO
  // =========================================================================

  private _extraerHojas(arbol: PlantillaEstructuraDTO[]): PlantillaEstructuraDTO[] {
    const hojas: PlantillaEstructuraDTO[] = [];
    const recorrer = (n: PlantillaEstructuraDTO) => {
      if (!n.hijos || n.hijos.length === 0) hojas.push(n);
      else n.hijos.forEach(h => recorrer(h));
    };
    arbol.forEach(n => recorrer(n));
    return hojas;
  }

  private _calcularPesosEfectivos(arbol: PlantillaEstructuraDTO[]): PesosMap {
    const index = new Map<number, PlantillaEstructuraDTO>();
    const stack: PlantillaEstructuraDTO[] = [...arbol];
    while (stack.length > 0) {
      const actual = stack.pop()!;
      index.set(actual.idPlantillaEstructura, actual);
      if (actual.hijos?.length) stack.push(...actual.hijos);
    }
    const hojas = this._extraerHojas(arbol);
    const pesosEfectivos: PesosMap = {};
    hojas.forEach(hoja => {
      const id = hoja.idPlantillaEstructura;
      let peso = Number(hoja.peso || 0);
      let parentId = hoja.idNodoPadre;
      while (parentId != null) {
        const parent = index.get(parentId);
        if (!parent) break;
        peso = (peso * Number(parent.peso || 0)) / 100;
        parentId = parent.idNodoPadre;
      }
      pesosEfectivos[id] = Math.round(peso * 10000) / 10000;
    });
    return pesosEfectivos;
  }

  private _calcularNotaFinal(
    notasAlumno: NotasAlumnoDTO[],
    hojas: PlantillaEstructuraDTO[],
    pesosEfectivos: PesosMap
  ): number | null {
    if (hojas.length === 0) return null;
    const sumaTotalPesos = hojas.reduce((t, n) => t + (pesosEfectivos[n.idPlantillaEstructura] ?? n.peso), 0);
    let sumaPonderada = 0;
    let hayNotas = false;

    hojas.forEach(nodo => {
      const notaObj = notasAlumno.find(n => n.idPlantillaEstructura === nodo.idPlantillaEstructura);
      const nota = notaObj?.valorNota;
      if (nota !== null && nota !== undefined && nota >= 0) {
        hayNotas = true;
        const peso = pesosEfectivos[nodo.idPlantillaEstructura] ?? nodo.peso;
        sumaPonderada += (nota * peso) / 100;
      }
    });

    if (!hayNotas || sumaTotalPesos === 0) return null;
    return Math.round((sumaPonderada / (sumaTotalPesos / 100)) * 100) / 100;
  }

  private _calcularPromedio(notaFinal: number | null, supletorio: number | null): number | null {
    if (supletorio != null) {
      // Si pasó el supletorio, la nota final es 7
      return supletorio >= 7 ? 7 : Math.round(((notaFinal ?? 0) + supletorio) / 2 * 100) / 100;
    }
    return notaFinal;
  }

  private _calcularPromedioGeneral(notas: (number | null)[]): number | null {
    const validas = notas.filter((n): n is number => n !== null);
    if (validas.length === 0) return null;
    return Math.round((validas.reduce((a, b) => a + b, 0) / validas.length) * 100) / 100;
  }

  private _determinarEstado(
    promedio: number | null,
    supletorio: number | null
  ): SabanaNotaFilaDTO['estado'] {
    if (promedio === null) return 'Sin nota';
    if (supletorio != null) return supletorio >= 7 ? 'Aprobado' : 'Reprobado';
    if (promedio >= 7) return 'Aprobado';
    if (promedio > 5) return 'Recuperación';
    return 'Reprobado';
  }

  private _determinarObservacion(
    promedioGeneral: number | null,
    notasPorMateria: { [id: number]: number | null },
    supletorioPorMateria: { [id: number]: number | null }
  ): QuimestreFilaDTO['observacion'] {
    if (promedioGeneral === null) return 'PENDIENTE';

    // Verificar si alguna materia tiene supletorio pendiente (nota entre 5 y 7)
    const tieneSuplemento = Object.keys(notasPorMateria).some(idStr => {
      const id = Number(idStr);
      const nota = notasPorMateria[id];
      const supletorio = supletorioPorMateria[id];
      if (supletorio != null) return false; // ya tiene supletorio registrado
      return nota !== null && nota > 5 && nota < 7;
    });

    if (promedioGeneral < 5) return 'REPROBADO';
    if (tieneSuplemento) return 'SUPLETORIO';
    return 'PROMOVIDO';
  }

  private _aplanarFilasQuimestre(
    filas: QuimestreFilaDTO[],
    columnasMaterias: QuimesteMateriaColumnaDTO[],
    nombresMaterias: string[]
  ): Record<string, any>[] {
    return filas.map(fila => {
      const flat: Record<string, any> = {
        numero:       fila.numero,
        cedula:       fila.cedula,
        nombreAlumno: fila.nombreAlumno
      };
      columnasMaterias.forEach((col, i) => {
        const nombre = nombresMaterias[i];
        const nota = fila.notasPorMateria[col.idDetalleMalla];
        // El valor puede ser la nota final directa, o 7 si aprobó supletorio
        const supl = fila.supletorioPorMateria[col.idDetalleMalla];
        flat[`mat_${nombre}`] = (nota !== null && nota !== undefined)
          ? (supl != null && supl >= 7 ? 7 : nota)
          : '-';
      });
      flat['promedio']    = fila.promedio;
      flat['observacion'] = fila.observacion;
      return flat;
    });
  }

  // =========================================================================
  //  CONFIGURACIONES DE REPORTE
  // =========================================================================

  private _configSabana(meta: { ciclo: string; nivel: string; paralelo: string; materia: string }): ReporteConfig {
    const fecha = new Date().toISOString().slice(0, 10);
    return {
      titulo: 'CUADRO MACRO FINAL — SÁBANA DE NOTAS',
      subtitulo: `${meta.nivel} | Paralelo: ${meta.paralelo} | Materia: ${meta.materia} | Ciclo: ${meta.ciclo}`,
      nombreArchivo: `sabana_notas_${meta.paralelo}_${meta.materia}_${fecha}`.replace(/\s+/g, '_'),
      columnas: [
        { header: 'N°',                  key: 'numero' },
        { header: 'Cédula',              key: 'cedula' },
        { header: 'Apellidos y Nombres', key: 'nombreAlumno' },
        { header: 'Nota Final Materia',  key: 'notaFinalMateria' },
        { header: 'Nota Supletorio',     key: 'notaSupletorio' },
        { header: 'Promedio Final',      key: 'promedioFinal' },
        { header: 'Estado',              key: 'estado' }
      ]
    };
  }

  private _configQuimestre(
    nombresMaterias: string[],
    meta: { ciclo: string; nivel: string; paralelo: string; ofertaEducativa: string }
  ): ReporteConfig {
    const fecha = new Date().toISOString().slice(0, 10);
    // Columnas base + una columna por materia + promedio + observaciones
    const columnas: ReporteConfig['columnas'] = [
      { header: 'N°',                  key: 'numero' },
      { header: 'Cédula',              key: 'cedula' },
      { header: 'Apellidos y Nombres', key: 'nombreAlumno' },
      ...nombresMaterias.map(nombre => ({ header: nombre, key: `mat_${nombre}` })),
      { header: 'Promedio',            key: 'promedio' },
      { header: 'Observaciones',       key: 'observacion' }
    ];

    return {
      titulo: 'CUADRO DE CALIFICACIONES DEL QUIMESTRE',
      subtitulo: `${meta.nivel} | Paralelo: ${meta.paralelo} | Oferta: ${meta.ofertaEducativa} | Ciclo: ${meta.ciclo}`,
      nombreArchivo: `calificaciones_quimestre_${meta.paralelo}_${fecha}`.replace(/\s+/g, '_'),
      columnas
    };
  }
}
