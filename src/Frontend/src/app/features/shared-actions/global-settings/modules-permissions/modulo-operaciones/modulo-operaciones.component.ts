import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ModuloService, ModuloOperacionService } from '../../../../../core/services/seguridad';
import { ModuloDTO, ModuloOperacionDTO } from '../../../../../data/models/Entities';

@Component({
  selector: 'app-modulo-operaciones',
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
  templateUrl: './modulo-operaciones.component.html',
  styleUrls: ['./modulo-operaciones.component.css']
})
export class ModuloOperacionesComponent implements OnInit {
  modulos: ModuloDTO[] = [];
  moduloOperaciones: ModuloOperacionDTO[] = [];
  loading = false;

  moduloOperacionDialog = false;
  moduloOperacion: ModuloOperacionDTO = { idModulo: 0, idOperacion: 0 };
  isEdit = false;

  constructor(
    private moduloService: ModuloService,
    private moduloOperacionService: ModuloOperacionService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadModulos();
    this.loadModuloOperaciones();
  }

  getModuloName(idModulo?: number): string {
    const modulo = this.modulos.find(m => m.idModulo === idModulo);
    return modulo?.detalle || '';
  }

  getOperacionName(idOperacion?: number): string {
    const operaciones = ['CREAR', 'LEER', 'MODIFICAR', 'ELIMINAR'];
    return operaciones[(idOperacion || 1) - 1] || '';
  }

  loadModulos() {
    this.moduloService.getModulos().subscribe({
      next: (data: ModuloDTO[]) => this.modulos = data,
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar módulos' })
    });
  }

  loadModuloOperaciones() {
    this.loading = true;
    this.moduloOperacionService.getModuloOperaciones().subscribe({
      next: (data: ModuloOperacionDTO[]) => {
        this.moduloOperaciones = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar operaciones' });
      }
    });
  }

  openNewModuloOperacionDialog() {
    this.moduloOperacion = { idModulo: 0, idOperacion: 0 };
    this.isEdit = false;
    this.moduloOperacionDialog = true;
  }

  editModuloOperacion(mo: ModuloOperacionDTO) {
    this.moduloOperacion = { ...mo };
    this.isEdit = true;
    this.moduloOperacionDialog = true;
  }

  hideModuloOperacionDialog() {
    this.moduloOperacionDialog = false;
  }

  saveModuloOperacion() {
    if (this.isEdit) {
      this.moduloOperacionService.updateModuloOperacion(this.moduloOperacion).subscribe({
        next: () => {
          this.loadModuloOperaciones();
          this.hideModuloOperacionDialog();
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Operación actualizada' });
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar operación' })
      });
    } else {
      this.moduloOperacionService.createModuloOperacion(this.moduloOperacion).subscribe({
        next: () => {
          this.loadModuloOperaciones();
          this.hideModuloOperacionDialog();
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Operación creada' });
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al crear operación' })
      });
    }
  }

  deleteModuloOperacion(mo: ModuloOperacionDTO) {
    if (confirm('¿Está seguro de eliminar esta operación?')) {
      this.moduloOperacionService.deleteModuloOperacion(mo.idModuloOperacion!).subscribe({
        next: () => {
          this.loadModuloOperaciones();
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Operación eliminada' });
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar operación' })
      });
    }
  }
}