import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PlantillaEvaluacionService } from '../../../../../../core/services/infrastructure/plantilla-evaluacion.service';
import { PlantillaEvaluacionDTO, PlantillaEvaluacionCreateDTO, PlantillaEvaluacionUpdateDTO } from '../../../../../../data/models/notas';
import { MessageService } from 'primeng/api';

// PrimeNG Imports
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-plantilla-form',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    InputTextModule,
    TextareaModule,
    ToggleSwitchModule,
    ButtonModule
  ],
  templateUrl: './plantilla-form.component.html',
  styleUrls: ['./plantilla-form.component.css']
})
export class PlantillaFormComponent implements OnInit {
  @Input() plantilla: PlantillaEvaluacionDTO | null = null;
  @Input() isEditing: boolean = false;
  
  @Output() save = new EventEmitter<PlantillaEvaluacionCreateDTO | PlantillaEvaluacionUpdateDTO>();
  @Output() cancel = new EventEmitter<void>();

  plantillaForm: FormGroup;
  loading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private plantillaService: PlantillaEvaluacionService,
    private messageService: MessageService
  ) {
    this.plantillaForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      detalle: ['', [Validators.maxLength(500)]],
      esActivo: [true]
    });
  }

  ngOnInit(): void {
    if (this.isEditing && this.plantilla) {
      this.plantillaForm.patchValue({
        nombre: this.plantilla.nombre,
        detalle: this.plantilla.detalle,
        esActivo: this.plantilla.esActivo
      });
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onSubmit(): void {
    if (this.plantillaForm.invalid) {
      this.plantillaForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const formValue = this.plantillaForm.value;

    if (this.isEditing && this.plantilla) {
      const updateData: PlantillaEvaluacionUpdateDTO = {
        idPlantillaEvaluacion: this.plantilla.idPlantillaEvaluacion,
        nombre: formValue.nombre,
        detalle: formValue.detalle,
        esActivo: formValue.esActivo
      };

      this.plantillaService.update(updateData).subscribe({
        next: (response) => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Plantilla actualizada correctamente' });
          this.loading = false;
          this.save.emit(updateData);
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar la plantilla' });
          this.loading = false;
        }
      });
    } else {
      // Force esActivo to true on creation as requested
      const createData: PlantillaEvaluacionCreateDTO = {
        nombre: formValue.nombre,
        detalle: formValue.detalle,
        esActivo: true
      };

      this.plantillaService.create(createData).subscribe({
        next: (response) => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Plantilla creada correctamente' });
          this.loading = false;
          this.save.emit(createData);
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear la plantilla' });
          this.loading = false;
        }
      });
    }
  }
}
