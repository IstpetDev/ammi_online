import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ManageApprovedComponent } from '../../shared-actions/postulaciones/manage-aproved/manage-approved.component';
import { CostosExtrasComponent } from '../../shared-actions/matricula/costos-extras/costos-extras.component';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-matriculas',
  standalone: true,
  imports: [CommonModule, ManageApprovedComponent, CostosExtrasComponent],
  templateUrl: './matriculas.component.html',
  styleUrls: ['./matriculas.component.css']
})
export class MatriculasComponent implements OnInit {
  private authService = inject(AuthService);

  activeTab: 'matriculas' | 'costos-extras' = 'matriculas';
  esAdmin: boolean = false;
  esSecretaria: boolean = false;
  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    const roles = user?.roles.map(r => r.nombre) || [];
    this.esAdmin = roles.includes('ADMINISTRADOR') || roles.includes('ADMIN');
    this.esSecretaria = roles.includes('SECRETARIA-GENERAL');
  }

  get mostrarCostosExtras(): boolean {
    return this.esAdmin || this.esSecretaria;
  }
}