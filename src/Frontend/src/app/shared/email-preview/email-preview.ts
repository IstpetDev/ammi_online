import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EmailTemplatesService, EmailTemplateData } from '../email-templates.service';

@Component({
  selector: 'app-email-preview',
  imports: [FormsModule],
  templateUrl: './email-preview.html',
  styleUrl: './email-preview.css',
})
export class EmailPreview {
  // Datos de ejemplo para la plantilla (puedes editar estos valores en tiempo real)
  templateData: EmailTemplateData = {
    nombreEstudiante: 'Juan Pérez',
    cedula: '1234567890',
    malla: 'Ingeniería en Sistemas',
    ciclo: '2023-1',
    motivoRechazo: 'Documento incompleto', // Solo para plantillas que lo usen
    nombreDocumento: 'Cédula de Identidad',
    nombreMateria: 'Matemáticas',
    notaFinal: 85,
    estado: 'Aprobado'
  };

  // Selección de plantilla (puedes cambiar esto dinámicamente)
  selectedTemplate: 'aprobada' | 'rechazada' | 'documentoAprobado' | 'documentoRechazado' | 'calificacion' = 'aprobada';

  // Propiedades para mostrar la plantilla generada
  subject: string = '';
  body: string = '';

  constructor(private emailTemplatesService: EmailTemplatesService) {
    this.updatePreview(); // Genera la vista previa inicial
  }

  // Método para actualizar la vista previa cuando cambien los datos
  updatePreview() {
    let template;
    switch (this.selectedTemplate) {
      case 'aprobada':
        template = this.emailTemplatesService.getPostulacionAprobadaTemplate(this.templateData);
        break;
      case 'rechazada':
        template = this.emailTemplatesService.getPostulacionRechazadaTemplate(this.templateData);
        break;
      case 'documentoAprobado':
        template = this.emailTemplatesService.getDocumentoAprobadoTemplate(this.templateData);
        break;
      case 'documentoRechazado':
        template = this.emailTemplatesService.getDocumentoRechazadoTemplate(this.templateData);
        break;
      case 'calificacion':
        template = this.emailTemplatesService.getCalificacionNotificadaTemplate(this.templateData);
        break;
    }
    this.subject = template.subject;
    this.body = template.body;
  }

  // Método para cambiar la plantilla seleccionada
  onTemplateChange() {
    this.updatePreview();
  }
}
