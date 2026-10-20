import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { FileUploadModule } from 'primeng/fileupload';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { MessageService } from 'primeng/api';

// Services
import { AuthService } from '../../../core/auth/auth.service';
import { DistributivoService } from '../../../core/services/infrastructure/distributivo.service';

// Models
import { AsignacionDocenteDTO } from '../../../data/models/distributivo';

@Component({
  selector: 'app-distributivo-docente',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    CardModule,
    ProgressSpinnerModule,
    ToastModule,
    DialogModule,
    FileUploadModule,
    InputTextModule,
    TextareaModule
  ],
  templateUrl: './distributivo-docente.html',
  styleUrl: './distributivo-docente.css',
  providers: [MessageService]
})
export class DistributivoDocente implements OnInit {
  private authService = inject(AuthService);
  private distributivoService = inject(DistributivoService);
  private messageService = inject(MessageService);

  asignaciones: AsignacionDocenteDTO[] = [];
  loading = false;
  error: string | null = null;

  // Dialog
  displayDialog = false;
  selectedAsignacion: AsignacionDocenteDTO | null = null;
  tituloContenido = '';
  descripcionContenido = '';
  archivoSeleccionado: File | null = null;
  uploading = false;

  ngOnInit(): void {
    this.cargarAsignacionesDocente();
  }

  cargarAsignacionesDocente(): void {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.error = 'Usuario no autenticado';
      return;
    }

    this.loading = true;
    this.error = null;

    this.distributivoService.getAsignacionesByDocente(user.id).subscribe({
      next: (data) => {
        this.asignaciones = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar asignaciones: ' + err.message;
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: this.error
        });
      }
    });
  }

  subirContenidoMalla(asignacion: AsignacionDocenteDTO): void {
    this.selectedAsignacion = asignacion;
    this.tituloContenido = '';
    this.descripcionContenido = '';
    this.archivoSeleccionado = null;
    this.displayDialog = true;
  }

  onFileSelect(event: any): void {
    if (event.files && event.files.length > 0) {
      this.archivoSeleccionado = event.files[0];
    }
  }

  onFileRemove(): void {
    this.archivoSeleccionado = null;
  }

  guardarContenido(): void {
    if (!this.selectedAsignacion || !this.tituloContenido.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'El título es obligatorio'
      });
      return;
    }

    // TODO: Implementar la lógica de subida
    this.uploading = true;

    // Simular subida
    setTimeout(() => {
      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: `Contenido "${this.tituloContenido}" subido para ${this.selectedAsignacion?.nombreMateria}`
      });
      this.displayDialog = false;
      this.uploading = false;
    }, 2000);
  }

  cancelarSubida(): void {
    this.displayDialog = false;
    this.selectedAsignacion = null;
    this.tituloContenido = '';
    this.descripcionContenido = '';
    this.archivoSeleccionado = null;
  }
}
