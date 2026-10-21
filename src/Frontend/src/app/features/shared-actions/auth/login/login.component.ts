import { Component, OnInit, inject, computed } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/index';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastService } from '../../../../shared/toast.service';
import { ThemeService } from '../../../../core/services/theme.service';
import { SharedToastComponent } from '../../../../shared/shared-toast/shared-toast.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink, ProgressSpinnerModule, SharedToastComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading: boolean = false;
  showPassword: boolean = false;
  currentYear: number = new Date().getFullYear();
  
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private themeService = inject(ThemeService);

  logoSrc = computed(() => this.themeService.layoutConfig().darkTheme ? 'assets/shared/Logo-sin-fondo-oscuro.png' : 'assets/shared/Logo-sin-fondo.png');


  constructor() {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    // Si el usuario ya está autenticado, redirigir al dashboard
    // Solo si está en la ruta /login explícitamente
    if (this.authService.isAuthenticated() && this.router.url === '/login') {
      console.log('🔄 Usuario ya autenticado en /login, redirigiendo al dashboard...');
      this.router.navigate(['/dashboard']);
    }
  }

  onSubmit() {
    if (this.loginForm.valid) {
      const { username, password } = this.loginForm.value;
      this.isLoading = true;

      this.authService.login(username, password).subscribe({
        next: (user) => {
          this.isLoading = false;
          if (user.requiereCambioContrasenia) {
            this.router.navigate(['/cambiar-contrasenia']);
          } else {
            this.router.navigate(['/dashboard']);
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.toastService.showError(error.message || 'Credenciales incorrectas o error en el servidor', 'Error de Autenticación');
        }
      });
    }
  }
}
