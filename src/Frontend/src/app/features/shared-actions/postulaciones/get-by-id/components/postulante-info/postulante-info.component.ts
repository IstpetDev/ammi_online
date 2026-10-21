import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-postulante-info',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './postulante-info.component.html',
  styleUrls: ['./postulante-info.component.css']
})
export class PostulanteInfoComponent {
  @Input() postulante: any;
  @Output() editarPostulante = new EventEmitter<void>();
  @Output() eliminarPostulante = new EventEmitter<void>();

  /**
   * Devuelve los datos de contacto del postulante si existen
   */
  get datosContacto(): any[] {
    const pcontacto = this.postulante?.personasimple?.pcontacto;
    if (pcontacto) {
      return Array.isArray(pcontacto) ? pcontacto : [pcontacto];
    }
    return [];
  }

  /**
   * Retorna true si existen datos de contacto válidos
   */
  get tieneDatosContacto(): boolean {
    const pcontacto = this.postulante?.personasimple?.pcontacto;
    if (!pcontacto) return false;

    if (Array.isArray(pcontacto)) {
      return pcontacto.some((c: any) => c && (c.tipocontacto?.detalle?.trim() || c.detalle?.trim()));
    }
    return pcontacto.tipocontacto?.detalle?.trim() || pcontacto.detalle?.trim();
  }

  /**
   * Retorna la edad a partir de la fecha de nacimiento
   */
  calcularEdad(fechaNacimiento: string | undefined): string {
    if (!fechaNacimiento) return '';

    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();

    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }

    return edad + ' años';
  }

  onEditarClick(): void {
    this.editarPostulante.emit();
  }

  onEliminarClick(): void {
    this.eliminarPostulante.emit();
  }

  /**
   * Obtiene el nombre completo formateado del estudiante
   */
  getNombreEstudiante(): string {
    const p = this.postulante?.personasimple;
    if (!p) return 'Estimado/a estudiante';
    return [p.primerNombre, p.segundoNombre, p.primerApellido, p.segundoApellido]
      .filter(name => name != null && name.trim() !== 'null' && name.trim() !== '')
      .join(' ');
  }
}
