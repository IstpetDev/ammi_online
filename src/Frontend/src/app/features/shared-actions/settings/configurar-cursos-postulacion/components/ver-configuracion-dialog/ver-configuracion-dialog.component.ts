import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModalComponent } from '../../../../../../shared/shared-modal/shared-modal.component';


@Component({
  selector: 'app-ver-configuracion-dialog',
  standalone: true,
  imports: [CommonModule, SharedModalComponent],
  templateUrl: './ver-configuracion-dialog.component.html',
  styleUrls: ['./ver-configuracion-dialog.component.css']
})
export class VerConfiguracionDialogComponent {
  @Input() visible = false;
  @Input() curso: any = null;
  @Input() materias: any[] = [];
  @Input() requisitos: any[] = [];
  @Input() paralelos: any[] = [];
  @Input() costos: any[] = [];

  @Output() visibleChange = new EventEmitter<boolean>();

  close(): void {
    this.visible = false;
    this.visibleChange.emit(this.visible);
  }
}
