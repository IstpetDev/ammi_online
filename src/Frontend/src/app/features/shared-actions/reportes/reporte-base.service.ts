import { Injectable } from '@angular/core';
import ExcelJS from 'exceljs';

export interface ColumnaReporte {
  header: string;
  key: string;
  tipo?: 'texto' | 'monto' | 'estado';
}

export interface ReporteConfig {
  titulo: string;
  subtitulo?: string;
  nombreArchivo: string;
  columnas: ColumnaReporte[];
}

function obtenerEstiloEstado(estado: string): { fontArgb: string; fillArgb: string; fontRgb: [number, number, number]; fillRgb: [number, number, number] } {
  const e = estado.toUpperCase();
  if (e.includes('APROB') || e.includes('VALID')) {
    return { fontArgb: 'FF16A34A', fillArgb: 'FFF0FDF4', fontRgb: [22, 163, 74], fillRgb: [240, 253, 244] };
  }
  if (e.includes('RECHAZ')) {
    return { fontArgb: 'FFDC2626', fillArgb: 'FFFEF2F2', fontRgb: [220, 38, 38], fillRgb: [254, 242, 242] };
  }
  if (e.includes('CANCEL')) {
    return { fontArgb: 'FF64748B', fillArgb: 'FFF8FAFC', fontRgb: [100, 116, 139], fillRgb: [248, 250, 252] };
  }
  return { fontArgb: 'FFD97706', fillArgb: 'FFFFFBEB', fontRgb: [217, 119, 6], fillRgb: [255, 251, 235] };
}

@Injectable({
  providedIn: 'root'
})
export class ReporteBaseService {

  generarExcel<T extends Record<string, any>>(datos: T[], config: ReporteConfig): void {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'AMMI Online';
    const sheet = workbook.addWorksheet(config.titulo.substring(0, 31));

    const borderStyle: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: 'FF000000' } };
    const border = { top: borderStyle, bottom: borderStyle, left: borderStyle, right: borderStyle };

    const colCount = config.columnas.length;
    let rowIdx = 1;

    sheet.mergeCells(rowIdx, 1, rowIdx, colCount);
    const titleCell = sheet.getCell(rowIdx, 1);
    titleCell.value = config.titulo;
    titleCell.font = { name: 'Calibri', size: 18, bold: true, color: { argb: 'FF1E293B' } };
    titleCell.alignment = { horizontal: 'left', vertical: 'middle' };
    sheet.getRow(rowIdx).height = 36;
    rowIdx++;

    if (config.subtitulo) {
      sheet.mergeCells(rowIdx, 1, rowIdx, colCount);
      const subCell = sheet.getCell(rowIdx, 1);
      subCell.value = config.subtitulo;
      subCell.font = { name: 'Calibri', size: 11, italic: true, color: { argb: 'FF64748B' } };
      subCell.alignment = { horizontal: 'left', vertical: 'middle' };
      sheet.getRow(rowIdx).height = 22;
      rowIdx++;
    }

    rowIdx++;

    const headerRow = sheet.getRow(rowIdx);
    config.columnas.forEach((col, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = col.header;
      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = border;
    });
    headerRow.height = 32;
    rowIdx++;

    datos.forEach((item, idx) => {
      const row = sheet.getRow(rowIdx);
      config.columnas.forEach((col, colIdx) => {
        const cell = row.getCell(colIdx + 1);
        const val = item[col.key];
        cell.value = val !== null && val !== undefined ? val : '';
        cell.border = border;
        cell.alignment = {
          horizontal: col.tipo === 'monto' ? 'right' : 'left',
          vertical: 'middle'
        };

        if (col.tipo === 'estado') {
          const estilo = obtenerEstiloEstado(String(val));
          cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: estilo.fontArgb } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: estilo.fillArgb } };
        } else if (col.tipo === 'monto') {
          cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F172A' } };
          cell.numFmt = '"$"#,##0.00';
          const numVal = typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]/g, '')) : Number(val);
          cell.value = isNaN(numVal) ? val : numVal;
        } else {
          cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF1E293B' } };
          if (idx % 2 === 1) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
          }
        }
      });
      row.height = 24;
      rowIdx++;
    });

    sheet.columns = config.columnas.map(c => {
      if (c.tipo === 'monto') return { width: 18 };
      if (c.tipo === 'estado') return { width: 16 };
      return { width: 26 };
    });

    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${config.nombreArchivo}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    });
  }

  async generarPDF<T extends Record<string, any>>(datos: T[], config: ReporteConfig): Promise<void> {
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable')
    ]);

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    const fechaGeneracion = new Date().toLocaleDateString('es-EC', {
      day: '2-digit', month: 'long', year: 'numeric'
    });

    doc.setFontSize(18);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text(config.titulo, 14, 18);

    if (config.subtitulo) {
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'italic');
      doc.text(config.subtitulo, 14, 26);
    }

    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    const fechaY = config.subtitulo ? 32 : 26;
    doc.text(`Generado: ${fechaGeneracion}`, 14, fechaY);

    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.5);
    doc.line(14, fechaY + 3, doc.internal.pageSize.width - 14, fechaY + 3);

    const head = [config.columnas.map(c => c.header)];
    const body = datos.map(item =>
      config.columnas.map(col => {
        const val = item[col.key];
        return val !== null && val !== undefined ? String(val) : '';
      })
    );

    autoTable(doc, {
      head,
      body,
      startY: fechaY + 6,
      styles: {
        fontSize: 7.5,
        cellPadding: 2.5,
        lineColor: [0, 0, 0],
        lineWidth: 0.3,
        textColor: [30, 41, 59],
        font: 'helvetica',
      },
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center',
        lineColor: [0, 0, 0],
        lineWidth: 0.5,
      },
      bodyStyles: {
        lineColor: [0, 0, 0],
        lineWidth: 0.3,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: 14, right: 14 },
      tableLineColor: [0, 0, 0],
      tableLineWidth: 0.5,
      didParseCell: (data) => {
        if (data.section === 'body') {
          const col = config.columnas[data.column.index];
          if (col?.tipo === 'estado') {
            const estado = String(data.cell.raw).toUpperCase();
            const estilo = obtenerEstiloEstado(estado);
            data.cell.styles.textColor = estilo.fontRgb;
            data.cell.styles.fillColor = estilo.fillRgb;
            data.cell.styles.fontStyle = 'bold';
          }
          if (col?.tipo === 'monto') {
            data.cell.styles.halign = 'right';
            data.cell.styles.fontStyle = 'bold';
          }
        }
      },
      didDrawPage: (data) => {
        const pageCount = doc.getNumberOfPages();
        const pg = data.pageNumber;
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.setFont('helvetica', 'normal');
        const text = `Página ${pg} de ${pageCount} | AMMI Online`;
        const textWidth = doc.getTextWidth(text);
        doc.text(
          text,
          doc.internal.pageSize.width / 2 - textWidth / 2,
          doc.internal.pageSize.height - 10
        );
      },
    });

    doc.save(`${config.nombreArchivo}.pdf`);
  }
}
