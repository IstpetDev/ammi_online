import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/index';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink, ProgressSpinnerModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loginError: string = '';
  isLoading: boolean = false;
  
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);


  constructor() {
    this.loginForm = this.fb.group({
      username: ['admin', [Validators.required]],
      password: ['Admin123!', [Validators.required, Validators.minLength(6)]]
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
      this.loginError = '';

      this.authService.login(username, password).subscribe({
        next: (user) => {
          this.isLoading = false;
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.isLoading = false;
          this.loginError = error.message;
        }
      });
    }
  }
}
