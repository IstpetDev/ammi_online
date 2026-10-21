import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { SharedHeaderComponent } from '../../../shared/shared-header/shared-header.component';
import { AuthService } from '../../../core/auth/auth.service';
import { SharedToastComponent } from '../../../shared/shared-toast/shared-toast.component';

@Component({
  selector: 'app-calificaciones',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SharedHeaderComponent, SharedToastComponent],
  providers: [MessageService],
  templateUrl: './calificaciones.component.html',
  styleUrls: ['./calificaciones.component.css']
})
export class CalificacionesComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  esDocente = false;
  esAdmin = false;
  nombreUsuario = '';

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.nombreUsuario = user.username;
      this.esDocente = this.authService.hasRole('PROFESOR');
      this.esAdmin = this.authService.hasRole('ADMINISTRADOR');
    }
  }

  get subtitle(): string {
    if (this.esDocente && !this.esAdmin) {
      return 'Ingresa las notas de tus alumnos asignados';
    }
    return 'Administra las calificaciones de todos los paralelos';
  }
}
