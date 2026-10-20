import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ManageApprovedComponent } from '../../shared-actions/postulaciones/manage-aproved/manage-approved.component';

@Component({
  selector: 'app-matriculas',
  standalone: true,
  imports: [CommonModule, ManageApprovedComponent],
  templateUrl: './matriculas.component.html',
  styleUrls: ['./matriculas.component.css']
})
export class MatriculasComponent {

}