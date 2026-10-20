import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { RolesComponent } from './roles/roles.component';
import { ModuloOperacionesComponent } from './modulo-operaciones/modulo-operaciones.component';
import { RolModuloOperacionesComponent } from './rol-modulo-operaciones/rol-modulo-operaciones.component';
import { ToastModule } from 'primeng/toast';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-modules-permissions',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    RolesComponent,
    ModuloOperacionesComponent,
    RolModuloOperacionesComponent,
    ToastModule,
    RouterModule
  ],
  templateUrl: './modules-permissions.component.html',
  styleUrls: ['./modules-permissions.component.css']
})
export class ModulesPermissionsComponent {
  activeTab: string = 'roles';

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }
}