import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { RolService } from '../../../../../core/services/seguridad';
import { RolDTO } from '../../../../../data/models/Entities';
import { SharedToastComponent } from '../../../../../shared/shared-toast/shared-toast.component';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule, SharedToastComponent],
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.css']
})
export class RolesComponent implements OnInit {
  roles: RolDTO[] = [];
  loading = false;

  roleDialog = false;
  role: RolDTO = { detalle: '' };
  isEdit = false;

  constructor(
    private rolService: RolService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles() {
    this.loading = true;
    this.rolService.getRoles().subscribe({
      next: (data: RolDTO[]) => {
        this.roles = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar roles' });
      }
    });
  }

  openNewRoleDialog() {
    this.role = { detalle: '' };
    this.isEdit = false;
    this.roleDialog = true;
  }

  editRole(role: RolDTO) {
    this.role = { ...role };
    this.isEdit = true;
    this.roleDialog = true;
  }

  hideRoleDialog() {
    this.roleDialog = false;
  }

  saveRole() {
    if (this.isEdit) {
      this.rolService.updateRol(this.role).subscribe({
        next: () => {
          this.loadRoles();
          this.hideRoleDialog();
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Rol actualizado' });
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar rol' })
      });
    } else {
      this.rolService.createRol(this.role).subscribe({
        next: () => {
          this.loadRoles();
          this.hideRoleDialog();
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Rol creado' });
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al crear rol' })
      });
    }
  }

  deleteRole(role: RolDTO) {
    if (confirm('¿Está seguro de eliminar este rol?')) {
      this.rolService.deleteRol(role.idRol!).subscribe({
        next: () => {
          this.loadRoles();
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Rol eliminado' });
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar rol' })
      });
    }
  }
}