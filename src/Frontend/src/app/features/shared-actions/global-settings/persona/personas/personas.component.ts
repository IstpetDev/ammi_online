import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { PersonaService } from '../../../../../core/services/seguridad';
import { TipoDocumentoService, GeneroService } from '../../../../../core/services/postulaciones';
import { PersonaDTO, TipoDocumentoDTO, GeneroDTO } from '../../../../../data/models/Entities';
import { AsignacionRolComponent } from '../asignacion-rol/asignacion-rol.component';
@Component({
  selector: 'app-personas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    ToastModule
  ],
  templateUrl: './personas.component.html',
  styleUrls: ['./personas.component.css']
})
export class PersonasComponent implements OnInit {
  personas: PersonaDTO[] = [];
  tiposDocumento: TipoDocumentoDTO[] = [];
  generos: GeneroDTO[] = [];
  loading = false;

  personaDialog = false;
  persona: PersonaDTO = { documento: '', primerNombre: '', segundoNombre: '', primerApellido: '', segundoApellido: '' };
  selectedTipoDocumento: TipoDocumentoDTO | undefined = undefined;
  selectedGenero: GeneroDTO | undefined = undefined;
  isEdit = false;

  constructor(
    private personaService: PersonaService,
    private tipoDocumentoService: TipoDocumentoService,
    private generoService: GeneroService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadPersonas();
    this.loadTiposDocumento();
    this.loadGeneros();
  }

  loadPersonas() {
    this.loading = true;
    this.personaService.getPersonas().subscribe({
      next: (data: PersonaDTO[]) => {
        this.personas = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar personas' });
      }
    });
  }

  loadTiposDocumento() {
    this.tipoDocumentoService.getTiposDocumento().subscribe({
      next: (data: TipoDocumentoDTO[]) => this.tiposDocumento = data,
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar tipos de documento' })
    });
  }

  loadGeneros() {
    this.generoService.getGeneros().subscribe({
      next: (data: GeneroDTO[]) => this.generos = data,
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar géneros' })
    });
  }

  openNewPersonaDialog() {
    this.persona = { documento: '', primerNombre: '', segundoNombre: '', primerApellido: '', segundoApellido: '' };
    this.selectedTipoDocumento = undefined;
    this.selectedGenero = undefined;
    this.isEdit = false;
    this.personaDialog = true;
  }

  editPersona(persona: PersonaDTO) {
    this.persona = { ...persona };
    this.selectedTipoDocumento = this.tiposDocumento.find(t => t.idTipoDocumento === persona.idTipoDocumento);
    this.selectedGenero = this.generos.find(g => g.idGenero === persona.idGenero);
    this.isEdit = true;
    this.personaDialog = true;
  }

  hidePersonaDialog() {
    this.personaDialog = false;
  }

  savePersona() {
    this.persona.idTipoDocumento = this.selectedTipoDocumento?.idTipoDocumento;
    this.persona.idGenero = this.selectedGenero?.idGenero;
    if (this.isEdit) {
      this.personaService.updatePersona(this.persona).subscribe({
        next: () => {
          this.loadPersonas();
          this.hidePersonaDialog();
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Persona actualizada' });
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar persona' })
      });
    } else {
      this.personaService.createPersona(this.persona).subscribe({
        next: () => {
          this.loadPersonas();
          this.hidePersonaDialog();
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Persona creada' });
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al crear persona' })
      });
    }
  }

  deletePersona(persona: PersonaDTO) {
    if (confirm('¿Está seguro de eliminar esta persona?')) {
      this.personaService.deletePersona(persona.idPersona!).subscribe({
        next: () => {
          this.loadPersonas();
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Persona eliminada' });
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar persona' })
      });
    }
  }

  getTipoDocumentoNombre(id: number): string {
    return this.tiposDocumento.find(t => t.idTipoDocumento === id)?.nombre || '';
  }

  getGeneroNombre(id: number): string {
    return this.generos.find(g => g.idGenero === id)?.nombre || '';
  }
}
