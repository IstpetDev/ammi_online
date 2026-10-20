import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { PersonaService, RolUsuarioService, RolService } from '../../../../../core/services/seguridad';
import { PersonaDTO, RolUsuarioDTO, RolDTO } from '../../../../../data/models/Entities';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-asignacion-rol',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    AutoCompleteModule,
    ToastModule
  ],
  providers: [PersonaService, RolUsuarioService, RolService, MessageService],
  templateUrl: './asignacion-rol.component.html',
  styleUrls: ['./asignacion-rol.component.css']
})
export class AsignacionRolComponent implements OnInit {
  rolUsuarios: RolUsuarioDTO[] = [];
  personas: PersonaDTO[] = [];
  roles: RolDTO[] = [];
  loading = false;

  rolUsuarioDialog = false;
  rolUsuario: RolUsuarioDTO = { persona: {} as PersonaDTO, rol: {} as RolDTO };
  isEdit = false;

  selectedPersona: PersonaDTO | undefined = undefined;
  selectedRol: RolDTO | undefined = undefined;
  filteredPersonas: PersonaDTO[] = [];
  filteredRoles: RolDTO[] = [];

  constructor(
    private personaService: PersonaService,
    private rolUsuarioService: RolUsuarioService,
    private rolService: RolService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loading = true;
    forkJoin({
      personas: this.personaService.getPersonas(),
      roles: this.rolService.getRoles(),
      rolUsuarios: this.rolUsuarioService.getRolUsuarios()
    }).subscribe({
      next: (results) => {
        this.personas = results.personas;
        this.roles = results.roles;
        this.rolUsuarios = results.rolUsuarios;
        // Populate persona and rol objects
        this.rolUsuarios.forEach(ru => {
          if ((ru as any).idPersona) {
            ru.persona = this.personas.find(p => p.idPersona === (ru as any).idPersona);
          }
          if ((ru as any).idRol) {
            ru.rol = this.roles.find(r => r.idRol === (ru as any).idRol);
          }
        });
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar datos' });
      }
    });
  }

  loadRolUsuarios() {
    this.loading = true;
    this.rolUsuarioService.getRolUsuarios().subscribe({
      next: (data: RolUsuarioDTO[]) => {
        this.rolUsuarios = data;
        // Populate persona and rol objects
        this.rolUsuarios.forEach(ru => {
          if ((ru as any).idPersona) {
            ru.persona = this.personas.find(p => p.idPersona === (ru as any).idPersona);
          }
          if ((ru as any).idRol) {
            ru.rol = this.roles.find(r => r.idRol === (ru as any).idRol);
          }
        });
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar asignaciones' });
      }
    });
  }

  loadPersonas() {
    this.personaService.getPersonas().subscribe({
      next: (data: PersonaDTO[]) => this.personas = data,
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar personas' })
    });
  }

  loadRoles() {
    this.rolService.getRoles().subscribe({
      next: (data: RolDTO[]) => this.roles = data,
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar roles' })
    });
  }

  openNewRolUsuarioDialog() {
    this.rolUsuario = { persona: {} as PersonaDTO, rol: {} as RolDTO };
    this.selectedPersona = undefined;
    this.selectedRol = undefined;
    this.isEdit = false;
    this.rolUsuarioDialog = true;
  }

  editRolUsuario(ru: RolUsuarioDTO) {
    this.rolUsuario = { ...ru };
    this.selectedPersona = ru.persona;
    this.selectedRol = ru.rol;
    this.isEdit = true;
    this.rolUsuarioDialog = true;
  }

  hideRolUsuarioDialog() {
    this.rolUsuarioDialog = false;
  }

  saveRolUsuario() {
    const payload = {
      rolUsuario: {
        idRol: this.selectedRol?.idRol,
        idPersona: this.selectedPersona?.idPersona
      }
    };
    if (this.isEdit) {
      (payload.rolUsuario as any).idRolUsuario = this.rolUsuario.idRolUsuario;
      this.rolUsuarioService.updateRolUsuario(payload as any).subscribe({
        next: () => {
          this.loadRolUsuarios();
          this.hideRolUsuarioDialog();
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Asignación actualizada' });
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar asignación' })
      });
    } else {
      this.rolUsuarioService.createRolUsuario(payload as any).subscribe({
        next: () => {
          this.loadRolUsuarios();
          this.hideRolUsuarioDialog();
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Asignación creada' });
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al crear asignación' })
      });
    }
  }

  deleteRolUsuario(ru: RolUsuarioDTO) {
    if (confirm('¿Está seguro de eliminar esta asignación?')) {
      this.rolUsuarioService.deleteRolUsuario(ru.idRolUsuario!).subscribe({
        next: () => {
          this.loadRolUsuarios();
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Asignación eliminada' });
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar asignación' })
      });
    }
  }

  filterPersonas(event: any) {
    const query = event.query.toLowerCase();
    this.filteredPersonas = this.personas.filter(persona =>
      `${persona.primerNombre} ${persona.segundoNombre} ${persona.primerApellido} ${persona.segundoApellido} ${persona.idTipoDocumento} ${persona.documento}`.toLowerCase().includes(query)
    );
  }

  filterRoles(event: any) {
    const query = event.query.toLowerCase();
    this.filteredRoles = this.roles.filter(rol =>
      rol.detalle?.toLowerCase().includes(query)
    );
  }
}