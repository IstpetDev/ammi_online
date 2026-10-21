import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { SharedDrawerComponent } from '../../../../../shared/shared-drawer/shared-drawer.component';
import { CustomSelectComponent } from '../../../../../shared/custom-select/custom-select.component';
import { SharedTableComponent, SharedTableColTemplateDirective, PageEvent, TableColumn } from '../../../../../shared/shared-table/shared-table.component';
import { ConfirmationModalComponent } from '../../../../../shared/modal-confirmation/confirmation-modal.component';
import { PersonaService, RolUsuarioService, RolService, UsuarioService } from '../../../../../core/services/seguridad';
import { TipoDocumentoService, GeneroService } from '../../../../../core/services/postulaciones';
import { PersonaDTO, RolUsuarioDTO, RolDTO, UsuarioDTO, TipoDocumentoDTO, GeneroDTO } from '../../../../../data/models/Entities';
import { forkJoin } from 'rxjs';
import { SharedToastComponent } from '../../../../../shared/shared-toast/shared-toast.component';

@Component({
  selector: 'app-asignacion-rol',
  standalone: true,
  imports: [CommonModule,
    FormsModule,
    SharedDrawerComponent,
    CustomSelectComponent,
    SharedTableComponent,
    SharedTableColTemplateDirective,
    ConfirmationModalComponent, SharedToastComponent],
  providers: [PersonaService, RolUsuarioService, RolService, UsuarioService, TipoDocumentoService, GeneroService, MessageService],
  templateUrl: './asignacion-rol.component.html',
  styleUrls: ['./asignacion-rol.component.css']
})
export class AsignacionRolComponent implements OnInit {
  rolUsuarios: RolUsuarioDTO[] = [];
  personas: PersonaDTO[] = [];
  roles: RolDTO[] = [];
  tiposDocumento: TipoDocumentoDTO[] = [];
  generos: GeneroDTO[] = [];
  loading = false;

  drawerVisible = false;
  isEdit = false;
  editRolUsuarioData: RolUsuarioDTO | null = null;

  selectedTipoDocumentoId: number | undefined = undefined;
  selectedGeneroId: number | undefined = undefined;
  selectedRolId: number | undefined = undefined;
  documentoBusqueda = '';
  buscando = false;
  personaEncontrada: PersonaDTO | null = null;
  modoCreacion = false;

  nuevaPersona: PersonaDTO = { documento: '', primerNombre: '', segundoNombre: '', primerApellido: '', segundoApellido: '' };
  username = '';
  contrasenia = '';

  filterNombre = '';
  filterDocumento = '';

  confirmModalVisible = false;
  rolAEliminar: RolUsuarioDTO | null = null;
  confirmLoading = false;

  page = 1;
  rowsPerPage = 10;

  columns: TableColumn[] = [
    { field: 'documento', header: 'N° Documento' },
    { field: 'nombre', header: 'Nombre' },
    { field: 'rolLabel', header: 'Rol' },
    { field: 'acciones', header: 'Acciones', width: '90px', align: 'center' }
  ];

  constructor(
    private personaService: PersonaService,
    private rolUsuarioService: RolUsuarioService,
    private rolService: RolService,
    private usuarioService: UsuarioService,
    private tipoDocumentoService: TipoDocumentoService,
    private generoService: GeneroService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loading = true;
    forkJoin({
      personas: this.personaService.getPersonas(),
      roles: this.rolService.getRoles(),
      rolUsuarios: this.rolUsuarioService.getRolUsuarios(),
      tiposDocumento: this.tipoDocumentoService.getTiposDocumento(),
      generos: this.generoService.getGeneros()
    }).subscribe({
      next: (results) => {
        this.personas = results.personas;
        this.tiposDocumento = results.tiposDocumento;
        this.generos = results.generos;
        this.roles = results.roles.filter(r => r.idRol !== 1 && r.idRol !== 4);
        this.rolUsuarios = results.rolUsuarios.filter(ru => {
          const idRol = (ru as any).idRol;
          return idRol !== 1 && idRol !== 4;
        });
        this.populateRelations();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar datos' });
      }
    });
  }

  private populateRelations(): void {
    this.rolUsuarios.forEach(ru => {
      if ((ru as any).idPersona) {
        ru.persona = this.personas.find(p => p.idPersona === (ru as any).idPersona);
      }
      if ((ru as any).idRol) {
        ru.rol = this.roles.find(r => r.idRol === (ru as any).idRol);
      }
    });
  }

  get filteredRolUsuarios(): RolUsuarioDTO[] {
    return this.rolUsuarios.filter(ru => {
      const nombre = this.getNombreCompleto(ru.persona).toLowerCase();
      const doc = (ru.persona?.documento || '').toLowerCase();
      if (this.filterNombre && !nombre.includes(this.filterNombre.toLowerCase().trim())) return false;
      if (this.filterDocumento && !doc.includes(this.filterDocumento.toLowerCase().trim())) return false;
      return true;
    });
  }

  get totalRecords(): number {
    return this.tablaData.length;
  }

  get tablaData(): any[] {
    return this.filteredRolUsuarios.map(ru => ({
      idRolUsuario: ru.idRolUsuario,
      documento: ru.persona?.documento || '',
      nombre: this.getNombreCompleto(ru.persona),
      rolLabel: ru.rol?.detalle || '',
      ru
    }));
  }

  trackById(index: number, item: any): number {
    return item.idRolUsuario ?? index;
  }

  get paginatedData(): any[] {
    const start = (this.page - 1) * this.rowsPerPage;
    return this.tablaData.slice(start, start + this.rowsPerPage);
  }

  onFilterNombre(value: string): void {
    this.filterNombre = value;
    this.page = 1;
  }

  onFilterDocumento(value: string): void {
    this.filterDocumento = value;
    this.page = 1;
  }

  private getNombreCompleto(p: PersonaDTO | undefined): string {
    if (!p) return '';
    return [p.primerNombre, p.segundoNombre, p.primerApellido, p.segundoApellido].filter(Boolean).join(' ');
  }

  loadRolUsuarios(): void {
    this.loading = true;
    this.rolUsuarioService.getRolUsuarios().subscribe({
      next: (data: RolUsuarioDTO[]) => {
        this.rolUsuarios = data.filter(ru => {
          const idRol = (ru as any).idRol;
          return idRol !== 1 && idRol !== 4;
        });
        this.populateRelations();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar asignaciones' });
      }
    });
  }

  loadPersonas(): void {
    this.personaService.getPersonas().subscribe({
      next: (data: PersonaDTO[]) => this.personas = data,
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar personas' })
    });
  }

  onPageChange(event: PageEvent): void {
    this.page = event.page;
  }

  openNewRolUsuarioDrawer(): void {
    this.resetDrawerState();
    this.isEdit = false;
    this.editRolUsuarioData = null;
    this.drawerVisible = true;
  }

  editRolUsuario(ru: RolUsuarioDTO): void {
    this.resetDrawerState();
    this.isEdit = true;
    this.editRolUsuarioData = ru;
    this.personaEncontrada = ru.persona || null;
    this.selectedRolId = ru.rol?.idRol;
    if (ru.persona) {
      this.selectedTipoDocumentoId = ru.persona.idTipoDocumento;
      this.selectedGeneroId = ru.persona.idGenero;
      this.nuevaPersona = {
        idPersona: ru.persona.idPersona,
        idTipoDocumento: ru.persona.idTipoDocumento,
        documento: ru.persona.documento,
        idGenero: ru.persona.idGenero,
        primerNombre: ru.persona.primerNombre,
        segundoNombre: ru.persona.segundoNombre,
        primerApellido: ru.persona.primerApellido,
        segundoApellido: ru.persona.segundoApellido
      };
    }
    this.drawerVisible = true;
  }

  private resetDrawerState(): void {
    this.selectedTipoDocumentoId = undefined;
    this.selectedGeneroId = undefined;
    this.selectedRolId = undefined;
    this.documentoBusqueda = '';
    this.buscando = false;
    this.personaEncontrada = null;
    this.modoCreacion = false;
    this.nuevaPersona = { documento: '', primerNombre: '', segundoNombre: '', primerApellido: '', segundoApellido: '' };
    this.username = '';
    this.contrasenia = '';
    this.isEdit = false;
    this.editRolUsuarioData = null;
  }

  buscarPersonaPorDocumento(): void {
    if (!this.selectedTipoDocumentoId || !this.documentoBusqueda?.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Advertencia', detail: 'Seleccione tipo documento e ingrese número' });
      return;
    }

    this.buscando = true;
    const doc = this.documentoBusqueda.trim();
    const encontrada = this.personas.find(
      p => p.idTipoDocumento === this.selectedTipoDocumentoId && p.documento?.trim() === doc
    );

    setTimeout(() => {
      this.buscando = false;
      if (encontrada) {
        this.personaEncontrada = encontrada;
        this.modoCreacion = false;
        this.nuevaPersona.documento = '';
        if (!this.username) this.username = doc;
        this.messageService.add({
          severity: 'success',
          summary: 'Persona encontrada',
          detail: `${encontrada.primerNombre} ${encontrada.primerApellido}`
        });
      } else {
        this.personaEncontrada = null;
        this.modoCreacion = true;
        this.nuevaPersona.documento = doc;
        if (this.selectedTipoDocumentoId != null) {
          this.nuevaPersona.idTipoDocumento = this.selectedTipoDocumentoId;
        }
        this.messageService.add({
          severity: 'info',
          summary: 'Nueva persona',
          detail: 'No se encontró la persona. Complete los datos para registrarla.'
        });
      }
    }, 300);
  }

  get confirmDisabled(): boolean {
    if (!this.selectedRolId) return true;
    if (this.isEdit) {
      return !this.nuevaPersona.primerNombre || !this.nuevaPersona.primerApellido || !this.selectedGeneroId;
    }
    if (!this.username || !this.contrasenia) return true;
    if (this.modoCreacion) {
      return !this.nuevaPersona.primerNombre || !this.nuevaPersona.primerApellido || !this.selectedGeneroId;
    }
    return false;
  }

  onDrawerConfirm(): void {
    if (this.confirmDisabled) return;
    this.loading = true;
    this.confirmLoading = true;

    if (this.isEdit) {
      this.updateRolUsuario();
    } else if (this.personaEncontrada) {
      this.createUsuarioYAsignarRol(this.personaEncontrada.idPersona!);
    } else if (this.modoCreacion) {
      this.crearPersonaUsuarioRol();
    } else {
      this.loading = false;
      this.confirmLoading = false;
    }
  }

  onDrawerCancel(): void {
    this.drawerVisible = false;
  }

  private updateRolUsuario(): void {
    this.nuevaPersona.idGenero = this.selectedGeneroId;

    this.personaService.updatePersona(this.nuevaPersona).subscribe({
      next: () => {
        const payload = {
          rolUsuario: {
            idRolUsuario: this.editRolUsuarioData!.idRolUsuario,
            idRol: this.selectedRolId,
            idPersona: this.personaEncontrada?.idPersona
          }
        };
        this.rolUsuarioService.updateRolUsuario(payload as any).subscribe({
          next: () => {
            this.loading = false;
            this.confirmLoading = false;
            this.loadRolUsuarios();
            this.loadPersonas();
            this.drawerVisible = false;
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Asignación actualizada' });
          },
          error: (err) => {
            this.loading = false;
            this.confirmLoading = false;
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar asignación' });
          }
        });
      },
      error: (err) => {
        this.loading = false;
        this.confirmLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar persona' });
      }
    });
  }

  private createUsuarioYAsignarRol(idPersona: number): void {
    const usuario: UsuarioDTO = {
      idPersona,
      Username: this.username,
      Contrasenia: this.contrasenia
    };

    this.usuarioService.createUsuario(usuario).subscribe({
      next: () => {
        this.asignarRol(idPersona);
      },
      error: (err) => {
        if (err.error?.message?.includes('duplicado')) {
          this.asignarRol(idPersona);
        } else {
          this.loading = false;
          this.confirmLoading = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al crear usuario' });
        }
      }
    });
  }

  private asignarRol(idPersona: number): void {
    const payload = {
      rolUsuario: {
        idRol: this.selectedRolId,
        idPersona
      }
    };

    this.rolUsuarioService.createRolUsuario(payload as any).subscribe({
      next: () => {
        this.loading = false;
        this.confirmLoading = false;
        this.loadRolUsuarios();
        this.loadPersonas();
        this.drawerVisible = false;
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario y rol asignados exitosamente' });
      },
      error: (err) => {
        this.loading = false;
        this.confirmLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al asignar rol' });
      }
    });
  }

  private crearPersonaUsuarioRol(): void {
    this.nuevaPersona.idTipoDocumento = this.selectedTipoDocumentoId;
    this.nuevaPersona.idGenero = this.selectedGeneroId;

    this.personaService.createPersona(this.nuevaPersona).subscribe({
      next: (responsePersona) => {
        let idPersonaCreada: number = 0;
        if (typeof responsePersona === 'number') {
          idPersonaCreada = responsePersona;
        } else if (responsePersona && typeof responsePersona === 'object') {
          idPersonaCreada = (responsePersona as any).idPersona || (responsePersona as any).data || 0;
        }

        if (!idPersonaCreada) {
          this.loading = false;
          this.confirmLoading = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se obtuvo el ID de la persona' });
          return;
        }

        const usuario: UsuarioDTO = {
          idPersona: idPersonaCreada,
          Username: this.username,
          Contrasenia: this.contrasenia
        };

        this.usuarioService.createUsuario(usuario).subscribe({
          next: () => {
            this.asignarRol(idPersonaCreada);
          },
          error: (err) => {
            this.loading = false;
            this.confirmLoading = false;
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al crear usuario' });
          }
        });
      },
      error: (err) => {
        this.loading = false;
        this.confirmLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al crear persona' });
      }
    });
  }

  confirmDeleteRolUsuario(ru: RolUsuarioDTO): void {
    this.rolAEliminar = ru;
    this.confirmModalVisible = true;
  }

  onConfirmDelete(): void {
    if (!this.rolAEliminar) return;
    this.confirmLoading = true;

    this.rolUsuarioService.deleteRolUsuario(this.rolAEliminar.idRolUsuario!).subscribe({
      next: () => {
        this.confirmLoading = false;
        this.confirmModalVisible = false;
        this.rolAEliminar = null;
        this.loadRolUsuarios();
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Rol removido correctamente' });
      },
      error: () => {
        this.confirmLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al remover el rol' });
      }
    });
  }

  onCancelDelete(): void {
    this.confirmModalVisible = false;
    this.rolAEliminar = null;
  }
}
