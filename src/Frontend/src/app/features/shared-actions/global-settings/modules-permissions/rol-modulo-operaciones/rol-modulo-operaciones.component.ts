import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService } from 'primeng/api';
import { RolService, ModuloOperacionService, RolOperacionService, ModuloService } from '../../../../../core/services/seguridad';
import { RolDTO, ModuloOperacionDTO, RolOperacionDTO, ModuloDTO } from '../../../../../data/models/Entities';
import { SharedToastComponent } from '../../../../../shared/shared-toast/shared-toast.component';

@Component({
  selector: 'app-rol-modulo-operaciones',
  standalone: true,
  imports: [CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    ToggleButtonModule,
    CheckboxModule, SharedToastComponent],
  templateUrl: './rol-modulo-operaciones.component.html',
  styleUrls: ['./rol-modulo-operaciones.component.css']
})
export class RolModuloOperacionesComponent implements OnInit {
    permisosPendientes: Array<{ permission: any; operacionName: string }> = [];
  roles: RolDTO[] = [];
  modulos: ModuloDTO[] = [];
  moduloOperaciones: ModuloOperacionDTO[] = [];
  rolOperaciones: RolOperacionDTO[] = [];
  loading = false;

  selectedRolId: number | null = null;
  
  // Estructura agrupada por rol y módulo
  groupedPermissions: any[] = [];

  
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

  groupPermissions() {
    if (!this.selectedRolId) {
      this.groupedPermissions = [];
      return;
    }

    const grouped = new Map<number, any>();

    // Inicializar todos los módulos con sus operaciones
    this.modulos.forEach(modulo => {
      const moduloOps = this.moduloOperaciones.filter(mo => mo.idModulo === modulo.idModulo);
      const permissions: any = {
        idRol: this.selectedRolId!,
        idModulo: modulo.idModulo,
        moduloNombre: modulo.detalle,
        operaciones: {}
      };

      this.operaciones.forEach(op => {
        const moduloOp = moduloOps.find(mo => mo.idOperacion === op.id);
        const rolOp = this.rolOperaciones.find(
          ro => ro.idRol === this.selectedRolId! && ro.idModuloOperacion === moduloOp?.idModuloOperacion
        );

        permissions.operaciones[op.name] = {
          enabled: rolOp?.esActivo || false,
          idRolOperacion: rolOp?.idRolOperacion,
          idModuloOperacion: moduloOp?.idModuloOperacion
        };
      });

      grouped.set(modulo.idModulo!, permissions);
    });

    this.groupedPermissions = Array.from(grouped.values());
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

  onRolChange() {
    if (this.selectedRolId) {
      this.groupPermissions();
    }
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
        if (this.selectedRolId) {
          this.groupPermissions();
        }
      },
      error: () => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar asignaciones' });
      }
    });
  }
    enviarPermisos() {
      if (this.permisosPendientes.length === 0) {
        this.messageService.add({ severity: 'info', summary: 'Sin cambios', detail: 'No hay permisos pendientes por guardar.' });
        return;
      }
      let successCount = 0;
      let errorCount = 0;
      const total = this.permisosPendientes.length;
      let finished = 0;
      const onFinish = () => {
        finished++;
        if (finished === total) {
          if (errorCount === 0) {
            this.messageService.add({
              severity: 'success',
              summary: 'Permisos actualizados',
              detail: 'Todos los permisos fueron guardados correctamente.'
            });
            this.loadRolOperaciones();
          }
          // Limpiar cache
          this.permisosPendientes = [];
        }
      };
      this.permisosPendientes.forEach(({ permission, operacionName }) => {
        const op = permission.operaciones[operacionName];
        if (op.idRolOperacion) {
          // Actualizar existente
          const rolOp: RolOperacionDTO = {
            idRolOperacion: op.idRolOperacion,
            idRol: permission.idRol,
            idModuloOperacion: op.idModuloOperacion,
            esActivo: op.enabled
          };
          this.rolOperacionService.updateRolOperacion(rolOp).subscribe({
            next: () => {
              successCount++;
              onFinish();
            },
            error: () => {
              op.enabled = !op.enabled;
              errorCount++;
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudo actualizar el permiso'
              });
              onFinish();
            }
          });
        } else {
          // Crear nuevo
          const rolOp: RolOperacionDTO = {
            idRol: permission.idRol,
            idModuloOperacion: op.idModuloOperacion,
            esActivo: op.enabled
          };
          this.rolOperacionService.createRolOperacion(rolOp).subscribe({
            next: () => {
              successCount++;
              onFinish();
            },
            error: () => {
              op.enabled = !op.enabled;
              errorCount++;
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudo crear el permiso'
              });
              onFinish();
            }
          });
        }
      });
    }

  onPermissionChange(permission: any, operacionName: string) {
    const op = permission.operaciones[operacionName];
    if (!op.idModuloOperacion) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Esta operación no está configurada para este módulo'
      });
      return;
    }
    // Guardar en cache
    const index = this.permisosPendientes.findIndex(
      (p: { permission: any; operacionName: string }) => p.permission.idModulo === permission.idModulo && p.operacionName === operacionName
    );
    if (index > -1) {
      this.permisosPendientes[index] = { permission, operacionName };
    } else {
      this.permisosPendientes.push({ permission, operacionName });
    }
  }
}