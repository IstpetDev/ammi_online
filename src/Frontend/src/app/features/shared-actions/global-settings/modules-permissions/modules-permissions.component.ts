import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RolesComponent } from './roles/roles.component';
import { RolModuloOperacionesComponent } from './rol-modulo-operaciones/rol-modulo-operaciones.component';

@Component({
  selector: 'app-modules-permissions',
  standalone: true,
  imports: [
    CommonModule,
    RolesComponent,
    RolModuloOperacionesComponent
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