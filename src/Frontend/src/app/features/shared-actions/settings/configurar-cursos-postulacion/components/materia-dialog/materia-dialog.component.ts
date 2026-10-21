import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { SharedModalComponent } from '../../../../../../shared/shared-modal/shared-modal.component';
import { MateriaDTO } from '../../../../../../data/models/Entities';
import { MateriaService } from '../../../../../../core/services/infrastructure/materia.service';

@Component({
  selector: 'app-materia-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModalComponent],
  templateUrl: './materia-dialog.component.html',
  styleUrls: ['./materia-dialog.component.css']
})
export class MateriaDialogComponent {
  private materiaService = inject(MateriaService);
  private messageService = inject(MessageService);

  @Input() visible: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<MateriaDTO>();

  formDetalle: string = '';
  formHoras: number | null = null;
  guardando: boolean = false;

  guardar(): void {
    if (!this.formDetalle.trim() || this.guardando) return;
    this.guardando = true;

    const data: MateriaDTO = {
      detalle: this.formDetalle.trim().toUpperCase(),
      horasRequeridas: this.formHoras && this.formHoras > 0 ? this.formHoras : undefined,
      esActivo: true
    };

    this.materiaService.create(data).subscribe({
      next: (nuevo) => {
        this.guardando = false;
        const id = typeof nuevo === 'number' ? nuevo : (nuevo as any).idMateria;
        const newMateria: MateriaDTO = {
          idMateria: id,
          detalle: data.detalle,
          horasRequeridas: data.horasRequeridas,
          esActivo: data.esActivo
        };
        this.messageService.add({
          severity: 'success',
          summary: 'Materia Creada',
          detail: `Materia "${newMateria.detalle || this.formDetalle}" creada con éxito`
        });
        this.saved.emit(newMateria);
        this.close();
      },
      error: () => {
        this.guardando = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo crear la materia'
        });
      }
    });
  }

  close(): void {
    this.formDetalle = '';
    this.formHoras = null;
    this.guardando = false;
    this.visible = false;
    this.visibleChange.emit(false);
  }
}
