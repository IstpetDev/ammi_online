import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-acciones-postulacion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './acciones-postulacion.component.html',
  styleUrls: ['./acciones-postulacion.component.css']
})
export class AccionesPostulacionComponent {
  @Input() postulacion: any;
  @Input() puedeIntentarAprobacion = false;
  @Input() motivoBloqueoAprobacion = '';
  @Input() aprobandoPostulacion = false;
  @Input() ocultarAccionesPostulacion = false;

  @Output() contactar = new EventEmitter<void>();
  @Output() completarRegistro = new EventEmitter<void>();
  @Output() rechazar = new EventEmitter<void>();
  @Output() aprobar = new EventEmitter<void>();

  get statusDetalle(): string {
    return (this.postulacion?.tipoestadoaprobacion?.detalle || '').toUpperCase().trim();
  }
}
