import { Component } from '@angular/core';
import { AsignacionRolComponent } from './asignacion-rol/asignacion-rol.component';

@Component({
  selector: 'app-persona',
  standalone: true,
  imports: [AsignacionRolComponent],
  templateUrl: './persona.component.html',
  styleUrls: ['./persona.component.css']
})
export class PersonaComponent {}