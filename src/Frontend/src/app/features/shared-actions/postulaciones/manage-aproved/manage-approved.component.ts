import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { MatriculaService } from '../../../../core/services/postulaciones/matricula.service';
import { MatriculaDTO } from '../../../../data/models/Entities';

@Component({
  selector: 'app-manage-approved',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    DialogModule,
    CheckboxModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './manage-approved.component.html',
  styleUrls: ['./manage-approved.component.css']
})
export class ManageApprovedComponent implements OnInit {

  matriculas: MatriculaDTO[] = [];

  // Filtros
  filtroNombre: string = '';

  // Edición
  showEditDialog = false;
  editingMatricula: MatriculaDTO | null = null;
  editForm: Partial<MatriculaDTO> = {
    detalleParalelo: '',
    esFinalizada: false
  };
  saving = false;

  constructor(
    private matriculaService: MatriculaService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadMatriculas();
  }

  limpiarFiltros(): void {
    this.filtroNombre = '';
  }

  loadMatriculas(): void {
    this.matriculaService.getAllMatriculas().subscribe({
      next: (data) => {
        this.matriculas = data;
        console.log('Matrículas cargadas desde API:', data.length);
      },
      error: (err) => {
        console.error('Error loading matrículas:', err);
      }
    });
  }

  // Método para filtrar matrículas
  get matriculasFiltradas(): MatriculaDTO[] {
    return this.matriculas.filter(m => {
      const matchNombre = !this.filtroNombre || 
        `${m.primerNombre || ''} ${m.segundoNombre || ''} ${m.primerApellido || ''} ${m.segundoApellido || ''}`.toLowerCase().includes(this.filtroNombre.toLowerCase()) ||
        (m.numeroDocumento && m.numeroDocumento.includes(this.filtroNombre));
      return matchNombre;
    });
  }

  /**
   * Abrir diálogo de edición
   */
  editarMatricula(matricula: MatriculaDTO): void {
    this.editingMatricula = matricula;
    this.editForm = {
      detalleParalelo: matricula.detalleParalelo || '',
      esFinalizada: Boolean(matricula.esFinalizada)
    };
    this.showEditDialog = true;
  }

  /**
   * Guardar cambios de matrícula
   */
  guardarEdicion(): void {
    if (!this.editingMatricula || !this.editingMatricula.idMatricula) {
      return;
    }

    console.log('Guardando matrícula:', this.editForm);
    this.saving = true;
    this.matriculaService.updateMatricula(this.editingMatricula.idMatricula, this.editForm).subscribe({
      next: (response) => {
        this.saving = false;
        this.showEditDialog = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Actualizado',
          detail: 'Matrícula actualizada correctamente'
        });
        this.loadMatriculas(); // Recargar la lista
      },
      error: (err) => {
        this.saving = false;
        console.error('Error actualizando matrícula:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo actualizar la matrícula'
        });
      }
    });
  }

  /**
   * Cancelar edición
   */
  cancelarEdicion(): void {
    this.showEditDialog = false;
    this.editingMatricula = null;
    this.editForm = {
      detalleParalelo: '',
      esFinalizada: false
    };
  }
}