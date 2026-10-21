import { Injectable } from '@angular/core';

export interface EmailTemplateData {
  nombreEstudiante?: string;
  cedula?: string;
  malla?: string;
  ciclo?: string;
  motivoRechazo?: string;
  nombreDocumento?: string;
  nombreMateria?: string;
  notaFinal?: number;
  estado?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EmailTemplatesService {

  /**
   * Base URL where the public/ assets are hosted.
   * Update this to your production domain before deploying.
   */
  private readonly logoBase64 = 'data:image/png;base64,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';

  private readonly colors = {
    brandYellow: '#d6c06a',
    brandYellowDark: '#b49a43',
    brandBlack: '#1D1E1C',
    brandGray: '#363636',
    brandWhite: '#FFFFFF',
    brandOrange: '#FF6B35',
    brandOrangeDark: '#E55A2B',
    success: '#22c55e',
    successLight: '#dcfce7',
    warning: '#f59e0b',
    warningLight: '#fef3c7',
    error: '#ef4444',
    errorLight: '#fee2e2',
    info: '#3b82f6',
    infoLight: '#dbeafe',
    bgPage: '#eeeff2',
    textMuted: '#374151',
  };

  constructor() { }

  /** Shared email shell (estilo sobrio tipo tarjeta institucional) */
  private wrapEmail(
    subject: string,
    accentColor: string,
    innerHtml: string,
    bannerTitle: string = 'COMUNICACIÓN AMMI ONLINE'
  ): { subject: string; body: string } {
    const c = this.colors;
    const logo = this.logoBase64;

    const body = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:${c.bgPage};font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${c.bgPage};padding:24px 12px;">
    <tr>
      <td align="center">
        <table width="460" cellpadding="0" cellspacing="0"
          style="max-width:460px;width:100%;border-radius:8px;overflow:hidden;
                 box-shadow:0 8px 28px rgba(17,24,39,0.12);border:1px solid #d6d9df;background:#ffffff;">

          <!-- Header con logo -->
          <tr>
            <td style="background:#ffffff;padding:16px 18px;text-align:center;border-top:4px solid ${c.brandYellowDark};border-bottom:4px solid #9b9b9b;">
              <img src="${logo}"
                   alt="AMMI Online"
                   width="178"
                   style="width:178px;height:auto;display:block;margin:0 auto;" />
            </td>
          </tr>

          <!-- Título de comunicación -->
          <tr>
            <td style="padding:18px 22px;background:#ffffff;text-align:center;border-bottom:1px solid #e6e7eb;">
              <div style="font-size:20px;line-height:1.25;font-weight:500;letter-spacing:0.5px;color:${c.brandYellowDark};text-transform:uppercase;">
                ${bannerTitle}
              </div>
            </td>
          </tr>

          <!-- Cuerpo -->
          <tr>
            <td style="background:${c.brandWhite};padding:22px 22px 20px;">
              ${innerHtml}

              <div style="margin-top:14px;text-align:center;color:#1f2937;">
                <p style="margin:0 0 4px;font-size:13px;">Atentamente,</p>
                <img src="${logo}" alt="AMMI" width="92" style="width:92px;height:auto;display:block;margin:0 auto 4px;" />
                <p style="margin:0;font-size:31px;font-weight:700;color:${c.brandYellowDark};">Equipo AMMI.Online</p>
              </div>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align:center;">
                    <p style="margin:10px 0 0;font-size:14px;color:#111827;">
                      © ${new Date().getFullYear()} AMMI.Online. Todos los derechos reservados.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;

    return { subject, body };
  }

  /** Reusable info-row inside body */
  private row(label: string, value: string): string {
    return `
      <tr>
        <td style="padding:9px 12px;font-size:13px;color:#222222;white-space:nowrap;
                   width:30%;border:1px solid #bfa95a;background:#f4f1e5;font-weight:700;">${label}</td>
        <td style="padding:9px 12px;font-size:13px;color:#111827;font-weight:500;
                   border:1px solid #bfa95a;background:#f7f5ec;">${value}</td>
      </tr>`;
  }

  /** Reusable info table wrapper */
  private infoTable(rows: string): string {
    return `
      <table width="100%" cellpadding="0" cellspacing="0"
        style="border-collapse:separate;border-spacing:0;border:1px solid #bfa95a;border-radius:10px;
               overflow:hidden;margin-bottom:20px;background:#f7f5ec;">
        ${rows}
      </table>`;
  }

  /** CTA button with gradient */
  private button(text: string, href: string, bg: string, color: string): string {
    return `
      <div style="text-align:center;margin-top:12px;margin-bottom:8px;">
        <a href="${href}"
          style="display:inline-block;padding:10px 26px;background:${bg};color:${color};
                 border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;
                 border:1px solid #b39a43;box-shadow:0 2px 6px rgba(179,154,67,0.35);">
          ${text}
        </a>
      </div>`;
  }

  /** Highlight box with gradient tint */
  private highlightBox(
    title: string, content: string,
    bgColor: string, borderColor: string, textColor: string
  ): string {
    return `
      <div style="background:${bgColor};border:1px solid ${borderColor};border-radius:10px;
                  padding:14px 16px;margin-bottom:20px;">
        <div style="font-size:16px;font-weight:700;text-transform:uppercase;color:#1D1E1C;margin-bottom:10px;">${title}</div>
        <div style="font-size:14px;color:${textColor};line-height:1.5;">${content}</div>
      </div>`;
  }

  // ─────────────────────────────────────────
  // POSTULACIÓN APROBADA
  // ─────────────────────────────────────────
  getPostulacionAprobadaTemplate(data: EmailTemplateData): { subject: string; body: string } {
    const c = this.colors;
    const subject = '¡Postulación aprobada! – Bienvenido/a a AMMI';

    const rows = [
      this.row('Estudiante', data.nombreEstudiante || 'N/A'),
      data.malla  ? this.row('Programa', data.malla)  : '',
      data.ciclo  ? this.row('Ciclo',    data.ciclo)  : '',
    ].join('');

    const credContent = `
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:0 6px 0 0;width:50%;">
            <div style="background:#f4f1e5;border:1px solid #bfa95a;border-radius:10px;padding:10px 12px;">
              <div style="font-size:12px;color:#1f2937;margin-bottom:4px;font-weight:700;text-transform:uppercase;">Usuario</div>
              <div style="font-size:33px;font-weight:700;color:${c.brandBlack};letter-spacing:0.6px;">${data.cedula || 'N/A'}</div>
            </div>
          </td>
          <td style="padding:0 0 0 6px;width:50%;">
            <div style="background:#f4f1e5;border:1px solid #bfa95a;border-radius:10px;padding:10px 12px;">
              <div style="font-size:12px;color:#1f2937;margin-bottom:4px;font-weight:700;text-transform:uppercase;">Contraseña inicial</div>
              <div style="font-size:33px;font-weight:700;color:${c.brandBlack};letter-spacing:0.6px;">${data.cedula || 'N/A'}</div>
            </div>
          </td>
        </tr>
      </table>
      <p style="margin:12px 0 0;font-size:12px;color:#111827;text-align:center;">
        Cambia tu contraseña al ingresar por primera vez.
      </p>
    `;

    const inner = `
      <h1 style="margin:0 0 8px;font-size:42px;font-weight:800;color:${c.brandBlack};
                 text-align:center;line-height:1.2;">
        ¡Felicitaciones, ${data.nombreEstudiante || ''}!
      </h1>
      <p style="margin:0 0 18px;font-size:18px;color:${c.textMuted};text-align:center;line-height:1.6;">
        Tu postulación ha sido <strong style="color:${c.success};">aprobada</strong>.
        Ya puedes acceder al portal de AMMI Online.
      </p>

      ${this.infoTable(rows)}
      ${this.highlightBox('Credenciales de acceso', credContent, '#f7f5ec', '#bfa95a', '#1f2937')}
      ${this.button('Ir al portal', '#', c.brandYellowDark, c.brandWhite)}
    `;

    return this.wrapEmail(subject, c.success, inner, 'COMUNICACIÓN DE MATRÍCULA');
  }

  // ─────────────────────────────────────────
  // POSTULACIÓN RECHAZADA
  // ─────────────────────────────────────────
  getPostulacionRechazadaTemplate(data: EmailTemplateData): { subject: string; body: string } {
    const c = this.colors;
    const subject = 'Resultado de tu postulación – AMMI';

    const rows = [
      this.row('Estudiante',          data.nombreEstudiante || 'N/A'),
      data.malla ? this.row('Programa solicitado', data.malla) : '',
      data.ciclo ? this.row('Ciclo',               data.ciclo) : '',
    ].join('');

    const inner = `
      <h1 style="margin:0 0 10px;font-size:28px;font-weight:800;color:${c.brandBlack};
                 text-align:center;line-height:1.2;">
        Resultado de postulación
      </h1>
      <p style="margin:0 0 32px;font-size:15px;color:${c.textMuted};text-align:center;line-height:1.7;">
        Lamentamos informarte que tu postulación no fue
        <strong style="color:${c.error};">aprobada</strong> en esta ocasión.
        Te invitamos a comunicarte con nosotros para más información.
      </p>

      ${this.infoTable(rows)}

      ${data.motivoRechazo
        ? this.highlightBox('Motivo del rechazo', data.motivoRechazo, c.errorLight, c.error, c.brandGray)
        : ''}

      ${this.button('Contactar soporte', 'mailto:soporte@ammi.edu', c.brandOrange, c.brandWhite)}
    `;

    return this.wrapEmail(subject, c.error, inner, 'RESULTADO DE POSTULACIÓN');
  }

  // ─────────────────────────────────────────
  // DOCUMENTO APROBADO
  // ─────────────────────────────────────────
  getDocumentoAprobadoTemplate(data: EmailTemplateData): { subject: string; body: string } {
    const c = this.colors;
    const subject = 'Documento aprobado – AMMI';

    const rows = [
      this.row('Estudiante', data.nombreEstudiante || 'N/A'),
      this.row('Documento',  data.nombreDocumento  || 'N/A'),
    ].join('');

    const inner = `
      <h1 style="margin:0 0 10px;font-size:28px;font-weight:800;color:${c.brandBlack};
                 text-align:center;line-height:1.2;">
        Documento aprobado
      </h1>
      <p style="margin:0 0 32px;font-size:15px;color:${c.textMuted};text-align:center;line-height:1.7;">
        Tu documento fue revisado y <strong style="color:${c.success};">aprobado</strong> correctamente.
        Puedes continuar con el proceso de admisión.
      </p>

      ${this.infoTable(rows)}
      ${this.button('Continuar proceso →', '#', c.brandYellowDark, c.brandBlack)}
    `;

    return this.wrapEmail(subject, c.success, inner, 'COMUNICACIÓN DE DOCUMENTOS');
  }

  // ─────────────────────────────────────────
  // DOCUMENTO RECHAZADO
  // ─────────────────────────────────────────
  getDocumentoRechazadoTemplate(data: EmailTemplateData): { subject: string; body: string } {
    const c = this.colors;
    const subject = 'Documento rechazado – AMMI';

    const rows = [
      this.row('Estudiante', data.nombreEstudiante || 'N/A'),
      this.row('Documento',  data.nombreDocumento  || 'N/A'),
    ].join('');

    const inner = `
      <h1 style="margin:0 0 10px;font-size:28px;font-weight:800;color:${c.brandBlack};
                 text-align:center;line-height:1.2;">
        Documento rechazado
      </h1>
      <p style="margin:0 0 32px;font-size:15px;color:${c.textMuted};text-align:center;line-height:1.7;">
        Tu documento requiere <strong style="color:${c.error};">correcciones</strong>.
        Por favor revisa las observaciones y reenvíalo.
      </p>

      ${this.infoTable(rows)}

      ${data.motivoRechazo
        ? this.highlightBox('Observaciones', data.motivoRechazo, c.errorLight, c.error, c.brandGray)
        : ''}

      ${this.button('Reenviar documento →', '#', c.brandOrange, c.brandWhite)}
    `;

    return this.wrapEmail(subject, c.error, inner, 'COMUNICACIÓN DE DOCUMENTOS');
  }

  // ─────────────────────────────────────────
  // CALIFICACIÓN NOTIFICADA
  // ─────────────────────────────────────────
  getCalificacionNotificadaTemplate(data: EmailTemplateData): { subject: string; body: string } {
    const c = this.colors;
    const subject = `Calificación registrada – ${data.nombreMateria || 'Materia'}`;

    const nota = data.notaFinal ?? null;
    const notaColor = nota === null ? c.textMuted : nota >= 7 ? c.success : c.error;

    const rows = [
      this.row('Estudiante', data.nombreEstudiante || 'N/A'),
      this.row('Materia',    data.nombreMateria    || 'N/A'),
      this.row('Estado',     data.estado           || 'N/A'),
    ].join('');

    const inner = `
      <h1 style="margin:0 0 10px;font-size:28px;font-weight:800;color:${c.brandBlack};
                 text-align:center;line-height:1.2;">
        Nueva calificación registrada
      </h1>
      <p style="margin:0 0 32px;font-size:15px;color:${c.textMuted};text-align:center;line-height:1.7;">
        Se ha registrado tu calificación final en
        <strong>${data.nombreMateria || 'la materia'}</strong>.
      </p>

      <!-- Big score display -->
      <div style="text-align:center;margin-bottom:32px;">
        <div style="display:inline-block;
                    background:linear-gradient(135deg,${notaColor}15 0%,${notaColor}08 50%,${notaColor}20 100%);
                    border:2px solid ${notaColor}60;border-radius:24px;padding:24px 56px;
                    box-shadow:0 8px 32px ${notaColor}30, inset 0 2px 4px rgba(255,255,255,0.1);
                    position:relative;">
          <div style="font-size:11px;font-weight:700;letter-spacing:2px;
                      text-transform:uppercase;color:${notaColor};margin-bottom:10px;
                      text-shadow:0 1px 2px rgba(0,0,0,0.1);">NOTA FINAL</div>
          <div style="font-size:64px;font-weight:800;color:${notaColor};line-height:1;
                      text-shadow:0 2px 8px ${notaColor}40;">${nota ?? 'N/A'}</div>
          <div style="position:absolute;top:0;left:0;right:0;bottom:0;
                      background:linear-gradient(45deg,transparent 30%,rgba(255,255,255,0.1) 50%,transparent 70%);
                      border-radius:24px;pointer-events:none;"></div>
        </div>
      </div>

      ${this.infoTable(rows)}
      ${this.button('Ver mis calificaciones →', '#', c.brandYellowDark, c.brandBlack)}
    `;

    return this.wrapEmail(subject, c.info, inner, 'COMUNICACIÓN DE CALIFICACIONES');
  }
}