import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { PersonasComponent } from './personas/personas.component';
import { AsignacionRolComponent } from './asignacion-rol/asignacion-rol.component';
import { RouterModule } from '@angular/router';
import { PRIMENG_MODULES } from '../../../../shared/primeng-imports';

@Component({
  selector: 'app-persona',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    PersonasComponent,
    AsignacionRolComponent,
    RouterModule,
    ...PRIMENG_MODULES
  ],
  templateUrl: './persona.component.html',
  styleUrls: ['./persona.component.css']
})
export class PersonaComponent {
  activeTab: string = 'personas';

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }
}