import { Component, inject, computed } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/index';
import { ThemeService } from '../../../../core/services/theme.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  registerForm: FormGroup;
  registerError: string = '';
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;
  currentYear: number = new Date().getFullYear();

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  private themeService = inject(ThemeService);

  logoSrc = computed(() => this.themeService.layoutConfig().darkTheme ? 'assets/shared/Logo-sin-fondo-oscuro.png' : 'assets/shared/Logo-sin-fondo.png');

  constructor() {
    this.registerForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      nombre: ['', [Validators.required]],
      apellido: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ mismatch: true });
      return { mismatch: true };
    }
    return null;
  }

  onSubmit() {
    if (this.registerForm.valid) {
      const { username, password, email, nombre, apellido } = this.registerForm.value;

      this.authService.register({ username, password, email, nombre, apellido }).subscribe({
        next: (user: any) => {
          this.router.navigate(['/dashboard']);
        },
        error: (error: any) => {
          this.registerError = error.message;
        }
      });
    }
  }
}