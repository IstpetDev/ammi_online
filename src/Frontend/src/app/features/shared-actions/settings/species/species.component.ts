import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { MessageService, ConfirmationService } from 'primeng/api';

// Services
import { EspecieService } from '../../../../core/services/infrastructure/especie.service';

// Models
import { EspecieDTO } from '../../../../data/models/Entities';

@Component({
  selector: 'app-species',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    CheckboxModule,
    TableModule,
    ToastModule,
    ConfirmDialogModule,
    DialogModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './species.component.html',
  styleUrls: ['./species.component.css']
})
export class SpeciesComponent implements OnInit {
  // Services
  private especieService = inject(EspecieService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  // Data
  especies: EspecieDTO[] = [];
  especieSeleccionada: EspecieDTO | null = null;

  // UI state
  loading = false;
  saving = false;
  showDialog = false;
  isEditing = false;

  // Form
  especieForm: EspecieDTO = {
    detalle: '',
    esDiferible: false
  };

  ngOnInit(): void {
    this.cargarEspecies();
  }

  /**
   * Cargar lista de especies
   */
  cargarEspecies(): void {
    this.loading = true;
    console.log('🔄 Iniciando carga de especies...');
    this.especieService.getAll().subscribe({
      next: (data) => {
        console.log('✅ Datos recibidos del servicio:', data);
        console.log('📊 Tipo de data:', typeof data);
        console.log('📊 Es array?', Array.isArray(data));
        console.log('📊 Longitud:', data?.length);
        this.especies = data;
        console.log('📋 Especies asignadas:', this.especies);
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Error cargando especies:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las especies'
        });
        this.loading = false;
      }
    });
  }

  /**
   * Abrir dialog para nueva especie
   */
  nuevaEspecie(): void {
    this.isEditing = false;
    this.especieForm = {
      detalle: '',
      esDiferible: false
    };
    this.showDialog = true;
  }

  /**
   * Abrir dialog para editar especie
   */
  editarEspecie(especie: EspecieDTO): void {
    this.isEditing = true;
    this.especieSeleccionada = especie;
    this.especieForm = { ...especie };
    this.showDialog = true;
  }

  /**
   * Guardar especie
   */
  guardarEspecie(): void {
    if (!this.especieForm.detalle?.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campo requerido',
        detail: 'El detalle de la especie es obligatorio'
      });
      return;
    }

    this.saving = true;

    if (this.isEditing && this.especieSeleccionada) {
      // Actualizar
      const dataToUpdate = {
        ...this.especieSeleccionada,
        ...this.especieForm
      };

      this.especieService.update(dataToUpdate).subscribe({
        next: (result) => {
          this.saving = false;
          this.showDialog = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Actualizado',
            detail: 'Especie actualizada correctamente'
          });
          this.cargarEspecies();
        },
        error: (err) => {
          this.saving = false;
          console.error('Error actualizando especie:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo actualizar la especie'
          });
        }
      });
    } else {
      // Crear nueva
      this.especieService.create(this.especieForm).subscribe({
        next: (result) => {
          this.saving = false;
          this.showDialog = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Creado',
            detail: 'Especie creada correctamente'
          });
          this.cargarEspecies();
        },
        error: (err) => {
          this.saving = false;
          console.error('Error creando especie:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo crear la especie'
          });
        }
      });
    }
  }

  /**
   * Eliminar especie
   */
  eliminarEspecie(especie: EspecieDTO): void {
    if (!especie.idEspecie) return;

    this.confirmationService.confirm({
      message: `¿Está seguro de eliminar la especie "${especie.detalle}"?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.especieService.delete(especie.idEspecie!).subscribe({
          next: (success) => {
            if (success) {
              this.messageService.add({
                severity: 'success',
                summary: 'Eliminado',
                detail: 'Especie eliminada correctamente'
              });
              this.cargarEspecies();
            } else {
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudo eliminar la especie'
              });
            }
          },
          error: (err) => {
            console.error('Error eliminando especie:', err);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo eliminar la especie'
            });
          }
        });
      }
    });
  }

  /**
   * Cerrar dialog
   */
  cerrarDialog(): void {
    this.showDialog = false;
    this.especieSeleccionada = null;
    this.especieForm = {
      detalle: '',
      esDiferible: false
    };
  }
}