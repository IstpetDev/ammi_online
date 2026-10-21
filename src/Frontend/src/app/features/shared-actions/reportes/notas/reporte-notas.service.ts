import { Injectable, inject } from '@angular/core';
import { forkJoin, Observable, from, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import ExcelJS from 'exceljs';

import { MatriculaService } from '../../../../core/services/postulaciones/matricula.service';
import { DetalleMallaService } from '../../../../core/services/infrastructure/detalle-malla.service';
import { NotasAlumnoService } from '../../../../core/services/infrastructure/notas-alumno.service';
import { PlantillaEstructuraService } from '../../../../core/services/infrastructure/plantilla-estructura.service';
import { PlantillaEstructuraDTO } from '../../../../data/models/notas/plantilla-estructura.model';
import { NotasAlumnoDTO } from '../../../../data/models/notas/notas-alumno.model';

export interface ReporteNotasFila {
  estudiante: string;
  documento: string;
  materia: string;
  promedioMateria: number | null;
  recuperacion: number | null;
  promedioFinal: number | null;
  condicion: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReporteNotasService {

  private matriculaService = inject(MatriculaService);
  private detalleMallaService = inject(DetalleMallaService);
  private notasService = inject(NotasAlumnoService);
  private estructuraService = inject(PlantillaEstructuraService);

  exportarExcel(
    idMalla: number,
    idMallaParalelo: number,
    meta: { periodo: string; ciclo: string; nivel: string; paralelo: string }
  ): Observable<void> {
    return this.detalleMallaService.getByMalla(idMalla, 1, 200).pipe(
      switchMap(materias => {
        if (materias.length === 0) throw new Error('No hay materias en esta malla');

        // Master list of students (using the first subject)
        const masterAlumnos$ = this.matriculaService.getDetallesMatriculaByMallaParaleloYMateria(
          idMallaParalelo,
          materias[0].idDetalleMalla
        );

        // Fetch tree structures and grades for all subjects
        const subjectsData$ = materias.map(m =>
          forkJoin([
            m.idPlantillaEvaluacion && m.idPlantillaEvaluacion > 0
              ? this.estructuraService.getArbol(m.idPlantillaEvaluacion)
              : of<PlantillaEstructuraDTO[]>([]),
            this.notasService.getByMallaParalelo(idMallaParalelo, { idDetalleMalla: m.idDetalleMalla })
          ]).pipe(
            map(([arbol, notas]: [PlantillaEstructuraDTO[], NotasAlumnoDTO[]]) => ({
              materia: m,
              arbol,
              notas
            }))
          )
        );

        return forkJoin([masterAlumnos$, forkJoin(subjectsData$)]);
      }),
      switchMap(([alumnos, dataMaterias]) => {
        // Sort students alphabetically
        const sortedAlumnos = [...alumnos].sort((a, b) =>
          (a.nombreAlumno || '').localeCompare(b.nombreAlumno || '')
        );

        return from(this._generarReporteCompletoExcel(sortedAlumnos, dataMaterias, meta));
      })
    );
  }

  private _extraerHojas(arbol: PlantillaEstructuraDTO[]): PlantillaEstructuraDTO[] {
    const hojas: PlantillaEstructuraDTO[] = [];
    const recorrer = (n: PlantillaEstructuraDTO) => {
      if (!n.hijos || n.hijos.length === 0) hojas.push(n);
      else n.hijos.forEach(h => recorrer(h));
    };
    arbol.forEach(n => recorrer(n));
    return hojas;
  }

  private _obtenerLetraColumna(colNumber: number): string {
    let temp = colNumber;
    let letter = '';
    while (temp > 0) {
      let modulo = (temp - 1) % 26;
      letter = String.fromCharCode(65 + modulo) + letter;
      temp = Math.floor((temp - modulo) / 26);
    }
    return letter;
  }

  private async _generarReporteCompletoExcel(
    alumnos: any[],
    dataMaterias: any[],
    meta: { periodo: string; ciclo: string; nivel: string; paralelo: string }
  ): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'AMMI Online';

    const borderStyle: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: 'FFBFBFBF' } };
    const border = { top: borderStyle, bottom: borderStyle, left: borderStyle, right: borderStyle };

    const headerFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F4E78' } // Dark blue
    };

    const redCellFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFC7CE' } // Light red
    };

    const redRowFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFE5E5' } // Soft red row background
    };

    const greenCellFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE2EFDA' } // Light green
    };

    const yellowCellFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFEB9C' } // Light yellow
    };

    // Keep track of sheet name mappings to reference them correctly in formulas
    const cleanSheetNames: string[] = [];

    // =========================================================================
    //  1. SUBJECT SHEETS
    // =========================================================================
    dataMaterias.forEach(({ materia, arbol, notas }) => {
      const origName = materia.nombreMateria ?? `Materia ${materia.idDetalleMalla}`;
      // Clean sheet name (Excel limit of 31 chars, no special characters)
      let cleanName = origName.replace(/[\\/*?:[\]]/g, '').substring(0, 30);
      if (!cleanName) cleanName = `Materia_${materia.idDetalleMalla}`;
      
      // Ensure unique name
      let finalName = cleanName;
      let counter = 1;
      while (cleanSheetNames.includes(finalName.toLowerCase())) {
        finalName = `${cleanName.substring(0, 27)}_${counter}`;
        counter++;
      }
      cleanSheetNames.push(finalName.toLowerCase());
      materia.cleanSheetName = finalName; // Store it for references

      const sheet = workbook.addWorksheet(finalName);

      // Banner institucional
      sheet.mergeCells('A2:N2');
      const bannerCell = sheet.getCell('A2');
      bannerCell.value = meta.nivel.toUpperCase();
      bannerCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
      bannerCell.fill = headerFill;
      bannerCell.alignment = { horizontal: 'center', vertical: 'middle' };
      sheet.getRow(2).height = 30;

      sheet.mergeCells('A3:N3');
      const schoolCell = sheet.getCell('A3');
      schoolCell.value = 'UNIDAD EDUCATIVA PARTICULAR BILINGUE ACADEMIA MILITAR "GENERAL MIGUEL ITURRALDE"';
      schoolCell.font = { name: 'Calibri', size: 11, bold: true };
      schoolCell.alignment = { horizontal: 'center', vertical: 'middle' };

      sheet.mergeCells('A4:N4');
      const ofertaCell = sheet.getCell('A4');
      ofertaCell.value = 'OFERTA VIRTUAL PCEI ( PERSONAS CON ESCOLARIDAD INCONCLUSA ) 5 MESES';
      ofertaCell.font = { name: 'Calibri', size: 10, bold: true };
      ofertaCell.alignment = { horizontal: 'center', vertical: 'middle' };

      sheet.mergeCells('A5:N5');
      const promoCell = sheet.getCell('A5');
      promoCell.value = `PROM ${meta.periodo.toUpperCase()}`;
      promoCell.font = { name: 'Calibri', size: 10, bold: true };
      promoCell.alignment = { horizontal: 'center', vertical: 'middle' };

      sheet.mergeCells('A6:N6');
      const matTitleCell = sheet.getCell('A6');
      matTitleCell.value = `${meta.nivel.toUpperCase()} ${origName.toUpperCase()}`;
      matTitleCell.font = { name: 'Calibri', size: 11, bold: true };
      matTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };

      // Headers row at row 8
      const headerRow = sheet.getRow(8);
      headerRow.height = 25;
      const headers = [
        'N', 'CÉDULA', 'Nombres Completos',
        'TAREA 1', 'TAREA 2', 'TAREA 3', 'TAREA 4',
        'TAREA 5', 'TAREA 6', 'TAREA 7', 'TAREA 8',
        'promedio de tareas', 'EVALUACION', 'promedio final'
      ];
      headers.forEach((h, i) => {
        const cell = headerRow.getCell(i + 1);
        cell.value = h;
        cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF333333' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = border;
      });

      // Map eval nodes
      const hojas = this._extraerHojas(arbol);
      const evalNode = hojas.find(h =>
        h.nodoNombre.toLowerCase().includes('evaluac') ||
        h.nodoNombre.toLowerCase().includes('examen') ||
        h.nodoNombre.toLowerCase().includes('prueba')
      );
      const taskNodes = hojas.filter(h => h !== evalNode);

      // Index notes
      const notesIndex = new Map<number, number>();
      const remedialIndex = new Map<number, number>();
      notas.forEach((n: any) => {
        if (n.idMatricula != null && n.idPlantillaEstructura != null) {
          const key = n.idMatricula * 1000000 + n.idPlantillaEstructura;
          if (n.valorNota !== null && n.valorNota !== undefined) {
            notesIndex.set(key, n.valorNota);
          }
          if (n.examenRemedial !== null && n.examenRemedial !== undefined) {
            remedialIndex.set(n.idMatricula, n.examenRemedial);
          }
        }
      });

      // Fill data
      let rowIdx = 9;
      alumnos.forEach((alumno, idx) => {
        const row = sheet.getRow(rowIdx);
        row.height = 20;

        // Student metadata
        row.getCell(1).value = idx + 1;
        row.getCell(2).value = alumno.documentoAlumno ?? '';
        row.getCell(3).value = (alumno.nombreAlumno || '').toUpperCase();

        row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell(3).alignment = { horizontal: 'left', vertical: 'middle' };

        row.getCell(1).border = border;
        row.getCell(2).border = border;
        row.getCell(3).border = border;

        // Green background for Cédula
        row.getCell(2).fill = greenCellFill;

        // Fetch grades for TAREA 1 to TAREA 8
        const studentGrades: number[] = [];
        let hasGrades = false;

        for (let t = 0; t < 8; t++) {
          const cell = row.getCell(4 + t);
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = border;

          if (t < taskNodes.length && alumno.idMatricula != null) {
            const key = alumno.idMatricula * 1000000 + taskNodes[t].idPlantillaEstructura;
            const val = notesIndex.get(key);
            if (val !== undefined) {
              cell.value = val;
              studentGrades.push(val);
              hasGrades = true;
              if (val < 7) {
                cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFC00000' } };
                cell.fill = redCellFill;
              }
            } else {
              cell.value = '';
            }
          } else {
            cell.value = '';
          }
        }

        // Promedio de tareas formula
        const cellPromTareas = row.getCell(12);
        cellPromTareas.value = { formula: `AVERAGE(D${rowIdx}:K${rowIdx})` };
        cellPromTareas.alignment = { horizontal: 'center', vertical: 'middle' };
        cellPromTareas.border = border;

        // EVALUACION grade
        const cellEval = row.getCell(13);
        cellEval.alignment = { horizontal: 'center', vertical: 'middle' };
        cellEval.border = border;

        let evalVal: number | null = null;
        if (evalNode && alumno.idMatricula != null) {
          const key = alumno.idMatricula * 1000000 + evalNode.idPlantillaEstructura;
          const val = notesIndex.get(key);
          if (val !== undefined) {
            cellEval.value = val;
            evalVal = val;
            if (val < 7) {
              cellEval.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFC00000' } };
              cellEval.fill = redCellFill;
            }
          }
        }

        // Promedio final formula
        const cellPromFinal = row.getCell(14);
        cellPromFinal.value = { formula: `AVERAGE(L${rowIdx}, M${rowIdx})` };
        cellPromFinal.alignment = { horizontal: 'center', vertical: 'middle' };
        cellPromFinal.font = { name: 'Calibri', size: 10, bold: true };
        cellPromFinal.border = border;

        // Precalculate promedio final in JS to apply row highlights if failing
        const avgTasks = studentGrades.length > 0 ? (studentGrades.reduce((sum, g) => sum + g, 0) / studentGrades.length) : null;
        let finalGradeEst = 0;
        if (avgTasks !== null && evalVal !== null) {
          finalGradeEst = (avgTasks + evalVal) / 2;
        } else if (avgTasks !== null) {
          finalGradeEst = avgTasks;
        } else if (evalVal !== null) {
          finalGradeEst = evalVal;
        }

        if (finalGradeEst > 0 && finalGradeEst < 7) {
          // Highlight failing student row in soft red
          for (let col = 1; col <= 14; col++) {
            if (col !== 2) { // Keep cédula green
              row.getCell(col).fill = redRowFill;
            }
          }
          cellPromFinal.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFC00000' } };
        }

        rowIdx++;
      });

      // Set columns widths
      sheet.columns = [
        { width: 5 },   // N
        { width: 14 },  // CÉDULA
        { width: 35 },  // Nombres
        { width: 8 }, { width: 8 }, { width: 8 }, { width: 8 },
        { width: 8 }, { width: 8 }, { width: 8 }, { width: 8 }, // Tasks
        { width: 12 },  // Promedio tareas
        { width: 12 },  // EVALUACION
        { width: 12 }   // Promedio final
      ];
    });

    // =========================================================================
    //  2. PRIMER QUIMESTRE SHEET
    // =========================================================================
    const sheetPQ = workbook.addWorksheet('Primer Quimestre');

    sheetPQ.mergeCells('A2:M2');
    const pqTitle = sheetPQ.getCell('A2');
    pqTitle.value = 'CUADRO DE CALIFICACIONES PRIMER QUIMESTRE';
    pqTitle.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    pqTitle.fill = headerFill;
    pqTitle.alignment = { horizontal: 'center', vertical: 'middle' };
    sheetPQ.getRow(2).height = 30;

    sheetPQ.mergeCells('A3:M3');
    const pqSchool = sheetPQ.getCell('A3');
    pqSchool.value = 'COORDINACIÓN ZONAL 9 - DISTRITO EDUCATIVO 17D07 - QUITUMBE - AMMI ONLINE';
    pqSchool.font = { name: 'Calibri', size: 10, bold: true };
    pqSchool.alignment = { horizontal: 'center', vertical: 'middle' };

    sheetPQ.mergeCells('A4:M4');
    const pqDetails = sheetPQ.getCell('A4');
    pqDetails.value = `CURSO: ${meta.nivel.toUpperCase()}  |  PARALELO: ${meta.paralelo.toUpperCase()}  |  PERIODO: ${meta.periodo.toUpperCase()}`;
    pqDetails.font = { name: 'Calibri', size: 9, italic: true };
    pqDetails.alignment = { horizontal: 'center', vertical: 'middle' };

    const pqHeaderRow = sheetPQ.getRow(6);
    pqHeaderRow.height = 60;
    
    pqHeaderRow.getCell(1).value = 'ORD.';
    pqHeaderRow.getCell(2).value = 'APELLIDOS Y NOMBRES';
    pqHeaderRow.getCell(1).font = { name: 'Calibri', size: 9, bold: true };
    pqHeaderRow.getCell(2).font = { name: 'Calibri', size: 9, bold: true };
    pqHeaderRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    pqHeaderRow.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
    pqHeaderRow.getCell(1).border = border;
    pqHeaderRow.getCell(2).border = border;

    dataMaterias.forEach(({ materia }, subIdx) => {
      const cell = pqHeaderRow.getCell(3 + subIdx);
      cell.value = materia.nombreMateria?.toUpperCase() ?? '';
      cell.font = { name: 'Calibri', size: 8, bold: true };
      cell.alignment = { textRotation: 90, horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = border;
    });

    const pqPromColIdx = 3 + dataMaterias.length;
    const pqCompColIdx = pqPromColIdx + 1;
    const pqObsColIdx = pqCompColIdx + 1;

    pqHeaderRow.getCell(pqPromColIdx).value = 'PROMEDIO';
    pqHeaderRow.getCell(pqCompColIdx).value = 'COMPORTAMIENTO';
    pqHeaderRow.getCell(pqObsColIdx).value = 'OBSERVACIONES';

    [pqPromColIdx, pqCompColIdx, pqObsColIdx].forEach(colIdx => {
      const cell = pqHeaderRow.getCell(colIdx);
      cell.font = { name: 'Calibri', size: 9, bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = border;
    });

    let pqRowIdx = 7;
    alumnos.forEach((alumno, idx) => {
      const row = sheetPQ.getRow(pqRowIdx);
      row.height = 20;

      row.getCell(1).value = idx + 1;
      row.getCell(2).value = (alumno.nombreAlumno || '').toUpperCase();

      row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' };

      row.getCell(1).border = border;
      row.getCell(2).border = border;

      // Subject grades mapped as formulas to each subject sheet
      dataMaterias.forEach(({ materia }, subIdx) => {
        const cell = row.getCell(3 + subIdx);
        // N is column 14 (promedio final)
        const cellRowInSubject = 9 + idx;
        cell.value = { formula: `'${materia.cleanSheetName}'!N${cellRowInSubject}` };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = border;
      });

      // Promedio formula
      const cellProm = row.getCell(pqPromColIdx);
      const startLetter = this._obtenerLetraColumna(3);
      const endLetter = this._obtenerLetraColumna(pqPromColIdx - 1);
      cellProm.value = { formula: `AVERAGE(${startLetter}${pqRowIdx}:${endLetter}${pqRowIdx})` };
      cellProm.alignment = { horizontal: 'center', vertical: 'middle' };
      cellProm.font = { name: 'Calibri', size: 10, bold: true };
      cellProm.border = border;

      // Comportamiento default "B"
      const cellComp = row.getCell(pqCompColIdx);
      cellComp.value = 'B';
      cellComp.alignment = { horizontal: 'center', vertical: 'middle' };
      cellComp.border = border;

      // Observaciones formula
      const cellObs = row.getCell(pqObsColIdx);
      const promLetter = this._obtenerLetraColumna(pqPromColIdx);
      cellObs.value = { formula: `IF(${promLetter}${pqRowIdx}<5, "REPROBADO", IF(${promLetter}${pqRowIdx}<7, "SUPLETORIO", "PROMOVIDO"))` };
      cellObs.alignment = { horizontal: 'center', vertical: 'middle' };
      cellObs.border = border;
      cellObs.font = { name: 'Calibri', size: 9, bold: true };

      pqRowIdx++;
    });

    sheetPQ.columns = [
      { width: 5 },   // ORD
      { width: 35 },  // Nombre
      ...dataMaterias.map(() => ({ width: 10 })), // Subjects
      { width: 12 },  // Promedio
      { width: 16 },  // Comportamiento
      { width: 16 }   // Observaciones
    ];

    // =========================================================================
    //  3. CUADRO FINAL (CF) SHEET
    // =========================================================================
    const sheetCF = workbook.addWorksheet('CF');

    sheetCF.mergeCells('A2:Z2');
    const cfTitle = sheetCF.getCell('A2');
    cfTitle.value = 'CUADRO FINAL DE CALIFICACIONES';
    cfTitle.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    cfTitle.fill = headerFill;
    cfTitle.alignment = { horizontal: 'center', vertical: 'middle' };
    sheetCF.getRow(2).height = 30;

    sheetCF.mergeCells('A3:Z3');
    const cfSchool = sheetCF.getCell('A3');
    cfSchool.value = 'COORDINACIÓN ZONAL 9 - DISTRITO EDUCATIVO 17D07 - QUITUMBE - AMMI ONLINE';
    cfSchool.font = { name: 'Calibri', size: 10, bold: true };
    cfSchool.alignment = { horizontal: 'center', vertical: 'middle' };

    sheetCF.mergeCells('A4:Z4');
    const cfDetails = sheetCF.getCell('A4');
    cfDetails.value = `CURSO: ${meta.nivel.toUpperCase()}  |  PARALELO: ${meta.paralelo.toUpperCase()}  |  OFERTA: ACELERADA`;
    cfDetails.font = { name: 'Calibri', size: 9, italic: true };
    cfDetails.alignment = { horizontal: 'center', vertical: 'middle' };

    // Set up double-headers for CF: Row 6 (Subjects) & Row 7 (PQ, ES, PF)
    const cfHeaderSubjectRow = sheetCF.getRow(6);
    cfHeaderSubjectRow.height = 25;
    const cfHeaderSubRow = sheetCF.getRow(7);
    cfHeaderSubRow.height = 20;

    cfHeaderSubjectRow.getCell(1).value = 'ORD.';
    cfHeaderSubjectRow.getCell(2).value = 'CÉDULA';
    cfHeaderSubjectRow.getCell(3).value = 'APELLIDOS Y NOMBRES';

    [1, 2, 3].forEach(col => {
      sheetCF.mergeCells(6, col, 7, col);
      const cell = cfHeaderSubjectRow.getCell(col);
      cell.font = { name: 'Calibri', size: 9, bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = border;
    });

    // Populate remedial index mapping
    const remedialMap = new Map<string, { [idDetalleMalla: number]: number }>();
    dataMaterias.forEach(({ materia, notas }) => {
      notas.forEach((n: any) => {
        if (n.idMatricula != null && n.examenRemedial !== null && n.examenRemedial !== undefined) {
          const studentDoc = alumnos.find(a => a.idMatricula === n.idMatricula)?.documentoAlumno;
          if (studentDoc) {
            const studentRemedials = remedialMap.get(studentDoc) ?? {};
            studentRemedials[materia.idDetalleMalla] = n.examenRemedial;
            remedialMap.set(studentDoc, studentRemedials);
          }
        }
      });
    });

    dataMaterias.forEach(({ materia }, subIdx) => {
      const startCol = 4 + subIdx * 3;
      sheetCF.mergeCells(6, startCol, 6, startCol + 2);
      
      const mainHeader = cfHeaderSubjectRow.getCell(startCol);
      mainHeader.value = materia.nombreMateria?.toUpperCase() ?? '';
      mainHeader.font = { name: 'Calibri', size: 8, bold: true };
      mainHeader.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      mainHeader.border = border;

      // Sub-headers
      const cellPQ = cfHeaderSubRow.getCell(startCol);
      cellPQ.value = 'P.Q';
      const cellES = cfHeaderSubRow.getCell(startCol + 1);
      cellES.value = 'E.S';
      const cellPF = cfHeaderSubRow.getCell(startCol + 2);
      cellPF.value = 'P.F';

      [cellPQ, cellES, cellPF].forEach(cell => {
        cell.font = { name: 'Calibri', size: 8, bold: true };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = border;
      });
    });

    const cfSubjEndCol = 3 + dataMaterias.length * 3;
    const cfCompColIdx = cfSubjEndCol + 1;
    const cfPromColIdx = cfCompColIdx + 1;
    const cfObsColIdx = cfPromColIdx + 2; // Merge comp status / observations

    sheetCF.mergeCells(6, cfCompColIdx, 7, cfCompColIdx);
    cfHeaderSubjectRow.getCell(cfCompColIdx).value = 'COMPORTAMIENTO';
    
    sheetCF.mergeCells(6, cfPromColIdx, 7, cfPromColIdx);
    cfHeaderSubjectRow.getCell(cfPromColIdx).value = 'PROMEDIO FINAL';
    
    sheetCF.mergeCells(6, cfObsColIdx, 7, cfObsColIdx);
    cfHeaderSubjectRow.getCell(cfObsColIdx).value = 'OBSERVACIONES';

    [cfCompColIdx, cfPromColIdx, cfObsColIdx].forEach(colIdx => {
      const cell = cfHeaderSubjectRow.getCell(colIdx);
      cell.font = { name: 'Calibri', size: 9, bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = border;
    });

    let cfRowIdx = 8;
    alumnos.forEach((alumno, idx) => {
      const row = sheetCF.getRow(cfRowIdx);
      row.height = 20;

      row.getCell(1).value = idx + 1;
      row.getCell(2).value = alumno.documentoAlumno ?? '';
      row.getCell(3).value = (alumno.nombreAlumno || '').toUpperCase();

      row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(3).alignment = { horizontal: 'left', vertical: 'middle' };

      row.getCell(1).border = border;
      row.getCell(2).border = border;
      row.getCell(3).border = border;

      row.getCell(2).fill = greenCellFill;

      const studentRemedials = remedialMap.get(alumno.documentoAlumno) ?? {};
      const pfLetters: string[] = [];

      dataMaterias.forEach(({ materia }, subIdx) => {
        const startCol = 4 + subIdx * 3;
        
        // P.Q formula referencing the subject sheet
        const cellPQ = row.getCell(startCol);
        const cellRowInSubject = 9 + idx;
        cellPQ.value = { formula: `'${materia.cleanSheetName}'!N${cellRowInSubject}` };
        cellPQ.alignment = { horizontal: 'center', vertical: 'middle' };
        cellPQ.border = border;

        // E.S remedial value if any
        const cellES = row.getCell(startCol + 1);
        const remedialGrade = studentRemedials[materia.idDetalleMalla];
        cellES.value = remedialGrade !== undefined ? remedialGrade : '';
        cellES.alignment = { horizontal: 'center', vertical: 'middle' };
        cellES.border = border;
        if (remedialGrade !== undefined && remedialGrade < 7) {
          cellES.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFC00000' } };
        }

        // P.F formula
        const cellPF = row.getCell(startCol + 2);
        const pqChar = this._obtenerLetraColumna(startCol);
        const esChar = this._obtenerLetraColumna(startCol + 1);
        
        cellPF.value = {
          formula: `IF(ISNUMBER(${esChar}${cfRowIdx}), IF(${esChar}${cfRowIdx}>=7, 7, ROUND((${pqChar}${cfRowIdx}+${esChar}${cfRowIdx})/2, 2)), ${pqChar}${cfRowIdx})`
        };
        cellPF.alignment = { horizontal: 'center', vertical: 'middle' };
        cellPF.font = { name: 'Calibri', size: 10, bold: true };
        cellPF.border = border;

        pfLetters.push(`${this._obtenerLetraColumna(startCol + 2)}${cfRowIdx}`);
      });

      // Comportamiento yellow highlight cell
      const cellComp = row.getCell(cfCompColIdx);
      cellComp.value = 'B';
      cellComp.alignment = { horizontal: 'center', vertical: 'middle' };
      cellComp.fill = yellowCellFill;
      cellComp.border = border;

      // Promedio Final
      const cellPromFinal = row.getCell(cfPromColIdx);
      cellPromFinal.value = { formula: `AVERAGE(${pfLetters.join(',')})` };
      cellPromFinal.alignment = { horizontal: 'center', vertical: 'middle' };
      cellPromFinal.font = { name: 'Calibri', size: 10, bold: true };
      cellPromFinal.border = border;

      // Observaciones
      const cellObs = row.getCell(cfObsColIdx);
      const pfLetter = this._obtenerLetraColumna(cfPromColIdx);
      cellObs.value = { formula: `IF(${pfLetter}${cfRowIdx}<7, "REPROBADO", "APROBADO")` };
      cellObs.alignment = { horizontal: 'center', vertical: 'middle' };
      cellObs.font = { name: 'Calibri', size: 9, bold: true };
      cellObs.border = border;

      cfRowIdx++;
    });

    // Auto-fit CF column widths
    sheetCF.columns = [
      { width: 5 },   // ORD
      { width: 14 },  // CÉDULA
      { width: 35 },  // Nombre
      ...dataMaterias.reduce((acc: any[], m) => {
        acc.push({ width: 7 }); // PQ
        acc.push({ width: 7 }); // ES
        acc.push({ width: 7 }); // PF
        return acc;
      }, []),
      { width: 16 },  // Comportamiento
      { width: 14 },  // Promedio final
      { width: 16 }   // Observaciones
    ];

    // =========================================================================
    //  4. CERTIFICADO DE APTITUD SHEET
    // =========================================================================
    const sheetCert = workbook.addWorksheet('Certificado de Aptitud');

    // Search box in J2
    sheetCert.getCell('I2').value = 'CUADRO DE BUSQUEDA POR FOLIO';
    sheetCert.getCell('I2').font = { name: 'Calibri', size: 10, bold: true };
    sheetCert.getCell('I2').alignment = { horizontal: 'right', vertical: 'middle' };
    
    sheetCert.getCell('J2').value = 1; // Default folio to search
    sheetCert.getCell('J2').font = { name: 'Calibri', size: 11, bold: true };
    sheetCert.getCell('J2').alignment = { horizontal: 'center', vertical: 'middle' };
    sheetCert.getCell('J2').border = border;
    sheetCert.getCell('J2').fill = yellowCellFill;

    sheetCert.mergeCells('B4:F4');
    const certMin = sheetCert.getCell('B4');
    certMin.value = 'MINISTERIO DE EDUCACIÓN';
    certMin.font = { name: 'Calibri', size: 11, bold: true };
    certMin.alignment = { horizontal: 'center', vertical: 'middle' };

    sheetCert.mergeCells('B5:F5');
    const certTitle = sheetCert.getCell('B5');
    certTitle.value = 'CERTIFICADO DE APTITUD';
    certTitle.font = { name: 'Calibri', size: 16, bold: true };
    certTitle.alignment = { horizontal: 'center', vertical: 'middle' };

    sheetCert.mergeCells('B7:F7');
    const certRector = sheetCert.getCell('B7');
    certRector.value = 'El/la Rector (a)/Director (a) de la Institución Educativa';
    certRector.font = { name: 'Calibri', size: 10, italic: true };
    certRector.alignment = { horizontal: 'center', vertical: 'middle' };

    sheetCert.mergeCells('B8:F8');
    const certSchoolName = sheetCert.getCell('B8');
    certSchoolName.value = 'AMMI ONLINE';
    certSchoolName.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF1F4E78' } };
    certSchoolName.alignment = { horizontal: 'center', vertical: 'middle' };

    sheetCert.mergeCells('B10:F10');
    const text1 = sheetCert.getCell('B10');
    text1.value = 'De conformidad con lo prescrito en el Art. 197 del Reglamento General a la Ley Orgánica de Educación Intercultural, Acuerdo';
    text1.font = { name: 'Calibri', size: 9 };
    text1.alignment = { horizontal: 'left', vertical: 'middle' };

    sheetCert.mergeCells('B11:F11');
    const text2 = sheetCert.getCell('B11');
    text2.value = 'Ministerial Nro. MINEDUC-MINEDUC-2017-00040-A de 11-05-2017 codificado a septiembre-2017, y demás normativas vigentes,';
    text2.font = { name: 'Calibri', size: 9 };
    text2.alignment = { horizontal: 'left', vertical: 'middle' };

    sheetCert.mergeCells('B12:F12');
    const text3 = sheetCert.getCell('B12');
    text3.value = 'certifica que el/la estudiante:';
    text3.font = { name: 'Calibri', size: 9 };
    text3.alignment = { horizontal: 'left', vertical: 'middle' };

    // Dynamic Student Name
    sheetCert.mergeCells('B14:F14');
    const studentNameCell = sheetCert.getCell('B14');
    studentNameCell.value = { formula: `VLOOKUP(J2, CF!A8:AZ200, 3, FALSE)` };
    studentNameCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF1F4E78' } };
    studentNameCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheetCert.getRow(14).height = 25;

    // Dynamic level and Cédula
    sheetCert.mergeCells('B16:F16');
    const studentMetaCell = sheetCert.getCell('B16');
    // B is column 2 (Cédula) in CF sheet.
    studentMetaCell.value = { formula: `CONCATENATE("del   ", UPPER("${meta.nivel}"), "    Código del estudiante Nro.      ", VLOOKUP(J2, CF!A8:AZ200, 2, FALSE))` };
    studentMetaCell.font = { name: 'Calibri', size: 10 };
    studentMetaCell.alignment = { horizontal: 'center', vertical: 'middle' };

    sheetCert.mergeCells('B17:F17');
    const text4 = sheetCert.getCell('B17');
    text4.value = 'obtuvo las siguientes calificaciones en el presente período educativo:';
    text4.font = { name: 'Calibri', size: 10 };
    text4.alignment = { horizontal: 'center', vertical: 'middle' };

    // Subjects Table Headers
    const certTblHdr = sheetCert.getRow(19);
    certTblHdr.height = 25;
    
    sheetCert.mergeCells('B19:C19');
    certTblHdr.getCell(2).value = 'ÁREAS / ASIGNATURAS';
    certTblHdr.getCell(4).value = 'CUANTITATIVA';
    sheetCert.mergeCells('E19:F19');
    certTblHdr.getCell(5).value = 'CUALITATIVA';

    [2, 4, 5].forEach(col => {
      const cell = certTblHdr.getCell(col);
      cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = headerFill;
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = border;
    });

    let certRowIdx = 20;
    dataMaterias.forEach(({ materia }, subIdx) => {
      const row = sheetCert.getRow(certRowIdx);
      row.height = 20;

      sheetCert.mergeCells(certRowIdx, 2, certRowIdx, 3);
      row.getCell(2).value = materia.nombreMateria?.toUpperCase() ?? '';
      row.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' };
      row.getCell(2).font = { name: 'Calibri', size: 9 };
      row.getCell(2).border = border;
      row.getCell(3).border = border; // Apply border to merged cell target too

      // Quantitative Grade VLOOKUP
      // Column in CF sheet is 6 + 3*subIdx (which is P.F column)
      const pfColIdx = 6 + subIdx * 3;
      
      const quantCell = row.getCell(4);
      quantCell.value = { formula: `VLOOKUP(J2, CF!A8:AZ200, ${pfColIdx}, FALSE)` };
      quantCell.alignment = { horizontal: 'center', vertical: 'middle' };
      quantCell.font = { name: 'Calibri', size: 9, bold: true };
      quantCell.border = border;

      // Qualitative VLOOKUP/formula
      sheetCert.mergeCells(certRowIdx, 5, certRowIdx, 6);
      const qualCell = row.getCell(5);
      const currentQuantCellCoord = `D${certRowIdx}`;
      qualCell.value = {
        formula: `IF(${currentQuantCellCoord}>=9, "DOMINA LOS APRENDIZAJES REQUERIDOS", IF(${currentQuantCellCoord}>=7, "ALCANZA LOS APRENDIZAJES REQUERIDOS", "NO CONSIGUE LOS APRENDIZAJES REQUERIDOS"))`
      };
      qualCell.alignment = { horizontal: 'center', vertical: 'middle' };
      qualCell.font = { name: 'Calibri', size: 8 };
      qualCell.border = border;
      row.getCell(6).border = border;

      certRowIdx++;
    });

    // Promedio General Row
    const rowProm = sheetCert.getRow(certRowIdx);
    rowProm.height = 20;
    sheetCert.mergeCells(certRowIdx, 2, certRowIdx, 3);
    rowProm.getCell(2).value = 'PROMEDIO GENERAL';
    rowProm.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' };
    rowProm.getCell(2).font = { name: 'Calibri', size: 9, bold: true };
    rowProm.getCell(2).border = border;
    sheetCert.getCell(certRowIdx, 3).border = border;

    const cfPromFinalColIdx = 4 + dataMaterias.length * 3 + 1; // CF sheet Promedio Final column index
    const quantProm = rowProm.getCell(4);
    quantProm.value = { formula: `VLOOKUP(J2, CF!A8:AZ200, ${cfPromFinalColIdx}, FALSE)` };
    quantProm.alignment = { horizontal: 'center', vertical: 'middle' };
    quantProm.font = { name: 'Calibri', size: 9, bold: true };
    quantProm.border = border;

    sheetCert.mergeCells(certRowIdx, 5, certRowIdx, 6);
    const qualProm = rowProm.getCell(5);
    const currentQuantPromCoord = `D${certRowIdx}`;
    qualProm.value = {
      formula: `IF(${currentQuantPromCoord}>=9, "ALCANZA LOS APRENDIZAJES REQUERIDOS", IF(${currentQuantPromCoord}>=7, "ALCANZA LOS APRENDIZAJES REQUERIDOS", "NO CONSIGUE LOS APRENDIZAJES REQUERIDOS"))`
    };
    qualProm.alignment = { horizontal: 'center', vertical: 'middle' };
    qualProm.font = { name: 'Calibri', size: 8, bold: true };
    qualProm.border = border;
    sheetCert.getCell(certRowIdx, 6).border = border;

    certRowIdx++;

    // Evaluacion del comportamiento Row
    const rowComp = sheetCert.getRow(certRowIdx);
    rowComp.height = 20;
    sheetCert.mergeCells(certRowIdx, 2, certRowIdx, 3);
    rowComp.getCell(2).value = 'EVALUACIÓN DEL COMPORTAMIENTO';
    rowComp.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' };
    rowComp.getCell(2).font = { name: 'Calibri', size: 9, bold: true };
    rowComp.getCell(2).border = border;
    sheetCert.getCell(certRowIdx, 3).border = border;

    const cfCompColIdxCF = 4 + dataMaterias.length * 3; // CF sheet Comportamiento column index
    const quantComp = rowComp.getCell(4);
    quantComp.value = { formula: `VLOOKUP(J2, CF!A8:AZ200, ${cfCompColIdxCF}, FALSE)` };
    quantComp.alignment = { horizontal: 'center', vertical: 'middle' };
    quantComp.font = { name: 'Calibri', size: 9, bold: true };
    quantComp.border = border;

    sheetCert.mergeCells(certRowIdx, 5, certRowIdx, 6);
    const qualComp = rowComp.getCell(5);
    qualComp.value = 'MUY BUENO';
    qualComp.alignment = { horizontal: 'center', vertical: 'middle' };
    qualComp.font = { name: 'Calibri', size: 8, bold: true };
    qualComp.border = border;
    sheetCert.getCell(certRowIdx, 6).border = border;

    certRowIdx += 3;

    // Signature text
    sheetCert.mergeCells(certRowIdx, 2, certRowIdx, 6);
    const text5 = sheetCert.getCell(certRowIdx, 2);
    text5.value = 'Para constancia suscriben en unidad de acto el/la Director/a-Rector/a con el Secretario/a General del plantel.';
    text5.font = { name: 'Calibri', size: 9, italic: true };
    text5.alignment = { horizontal: 'center', vertical: 'middle' };

    certRowIdx++;
    
    // Dynamic date text
    sheetCert.mergeCells(certRowIdx, 2, certRowIdx, 6);
    const textDate = sheetCert.getCell(certRowIdx, 2);
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const now = new Date();
    const dateStr = `Dado y firmado el ${now.getDate()} de ${months[now.getMonth()]} del ${now.getFullYear()}`;
    textDate.value = dateStr.toUpperCase();
    textDate.font = { name: 'Calibri', size: 9, bold: true };
    textDate.alignment = { horizontal: 'center', vertical: 'middle' };

    certRowIdx += 4;

    // Signatures
    const sigRow = sheetCert.getRow(certRowIdx);
    sheetCert.mergeCells(certRowIdx, 2, certRowIdx, 3);
    sigRow.getCell(2).value = 'RECTOR';
    sigRow.getCell(2).font = { name: 'Calibri', size: 10, bold: true };
    sigRow.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };

    sheetCert.mergeCells(certRowIdx, 5, certRowIdx, 6);
    sigRow.getCell(5).value = 'SECRETARIA';
    sigRow.getCell(5).font = { name: 'Calibri', size: 10, bold: true };
    sigRow.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' };

    sheetCert.columns = [
      { width: 5 },   // A
      { width: 22 },  // B (Asignaturas part 1)
      { width: 22 },  // C (Asignaturas part 2)
      { width: 16 },  // D (Cuantitativa)
      { width: 22 },  // E (Cualitativa part 1)
      { width: 22 },  // F (Cualitativa part 2)
      { width: 10 }
    ];

    // Export to file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_notas_${meta.paralelo}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}
