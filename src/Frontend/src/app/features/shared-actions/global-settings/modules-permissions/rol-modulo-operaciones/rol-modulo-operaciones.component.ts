import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { RolService, ModuloOperacionService, RolOperacionService, ModuloService } from '../../../../../core/services/seguridad';
import { RolDTO, ModuloOperacionDTO, RolOperacionDTO, ModuloDTO } from '../../../../../data/models/Entities';

@Component({
  selector: 'app-rol-modulo-operaciones',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    AutoCompleteModule,
    ToggleButtonModule,
    ToastModule
  ],
  templateUrl: './rol-modulo-operaciones.component.html',
  styleUrls: ['./rol-modulo-operaciones.component.css']
})
export class RolModuloOperacionesComponent implements OnInit {
  roles: RolDTO[] = [];
  modulos: ModuloDTO[] = [];
  moduloOperaciones: ModuloOperacionDTO[] = [];
  rolOperaciones: RolOperacionDTO[] = [];
  loading = false;

  rolOperacionDialog = false;
  rolOperacion: RolOperacionDTO = { idRol: 0, idModuloOperacion: 0, esActivo: true };
  isEdit = false;

  selectedRol: RolDTO | null = null;
  filteredRoles: RolDTO[] = [];
  permissions: { [key: string]: boolean } = {};
  operaciones = [
    { id: 1, name: 'CREAR' },
    { id: 2, name: 'LEER' },
    { id: 3, name: 'MODIFICAR' },
    { id: 4, name: 'ELIMINAR' }
  ];

  constructor(
    private rolService: RolService,
    private moduloService: ModuloService,
    private moduloOperacionService: ModuloOperacionService,
    private rolOperacionService: RolOperacionService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadRoles();
    this.loadModulos();
    this.loadModuloOperaciones();
    this.loadRolOperaciones();
  }

  getRolName(idRol?: number): string {
    const rol = this.roles.find(r => r.idRol === idRol);
    return rol?.detalle || '';
  }

  getModuloName(idModulo?: number): string {
    const modulo = this.modulos.find(m => m.idModulo === idModulo);
    return modulo?.detalle || '';
  }

  getModuloOperacionName(idModuloOperacion?: number): string {
    const mo = this.moduloOperaciones.find(m => m.idModuloOperacion === idModuloOperacion);
    return `${this.getModuloName(mo?.idModulo)} - ${this.getOperacionName(mo?.idOperacion)}` || '';
  }

  getOperacionName(idOperacion?: number): string {
    const operaciones = ['CREAR', 'LEER', 'MODIFICAR', 'ELIMINAR'];
    return operaciones[(idOperacion || 1) - 1] || '';
  }

  filterRoles(event: any) {
    this.filteredRoles = this.roles.filter(r => r.detalle?.toLowerCase().includes(event.query.toLowerCase()));
  }

  onRolChange() {
    if (this.selectedRol) {
      this.loadPermissions();
    }
  }

  loadPermissions() {
    this.permissions = {};
    this.rolOperaciones.filter(ro => ro.idRol === this.selectedRol!.idRol).forEach(ro => {
      const mo = this.moduloOperaciones.find(m => m.idModuloOperacion === ro.idModuloOperacion);
      if (mo) {
        this.permissions[mo.idModulo + '-' + mo.idOperacion] = ro.esActivo || false;
      }
    });
  }

  loadRoles() {
    this.rolService.getRoles().subscribe({
      next: (data: RolDTO[]) => this.roles = data,
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar roles' })
    });
  }

  loadModulos() {
    this.moduloService.getModulos().subscribe({
      next: (data: ModuloDTO[]) => this.modulos = data,
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar módulos' })
    });
  }

  loadModuloOperaciones() {
    this.moduloOperacionService.getModuloOperaciones().subscribe({
      next: (data: ModuloOperacionDTO[]) => this.moduloOperaciones = data,
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar operaciones' })
    });
  }

  loadRolOperaciones() {
    this.loading = true;
    this.rolOperacionService.getRolOperaciones().subscribe({
      next: (data: RolOperacionDTO[]) => {
        this.rolOperaciones = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar asignaciones' });
      }
    });
  }

  openNewRolOperacionDialog() {
    this.rolOperacion = { idRol: 0, idModuloOperacion: 0, esActivo: true };
    this.isEdit = false;
    this.selectedRol = null;
    this.rolOperacionDialog = true;
  }

  editRolOperacion(ro: RolOperacionDTO) {
    this.rolOperacion = { ...ro };
    this.isEdit = true;
    this.selectedRol = this.roles.find(r => r.idRol === ro.idRol) || null;
    this.rolOperacionDialog = true;
  }

  hideRolOperacionDialog() {
    this.rolOperacionDialog = false;
  }

  saveRolOperacion() {
    this.rolOperacion.idRol = this.selectedRol?.idRol || 0;
    if (this.isEdit) {
      this.rolOperacionService.updateRolOperacion(this.rolOperacion).subscribe({
        next: () => {
          this.loadRolOperaciones();
          this.hideRolOperacionDialog();
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Asignación actualizada' });
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar asignación' })
      });
    } else {
      this.rolOperacionService.createRolOperacion(this.rolOperacion).subscribe({
        next: () => {
          this.loadRolOperaciones();
          this.hideRolOperacionDialog();
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Asignación creada' });
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al crear asignación' })
      });
    }
  }

  deleteRolOperacion(ro: RolOperacionDTO) {
    if (confirm('¿Está seguro de eliminar esta asignación?')) {
      this.rolOperacionService.deleteRolOperacion(ro.idRolOperacion!).subscribe({
        next: () => {
          this.loadRolOperaciones();
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Asignación eliminada' });
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar asignación' })
      });
    }
  }
}