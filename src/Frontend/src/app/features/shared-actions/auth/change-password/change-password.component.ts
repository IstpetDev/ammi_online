import { Component, inject, computed } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/index';
import { ThemeService } from '../../../../core/services/theme.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css']
})
export class ChangePasswordComponent {
  changePasswordForm: FormGroup;
  changePasswordError: string = '';
  changePasswordSuccess: string = '';
  showCurrentPassword: boolean = false;
  showNewPassword: boolean = false;
  showConfirmNewPassword: boolean = false;
  currentYear: number = new Date().getFullYear();

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  private themeService = inject(ThemeService);

  logoSrc = computed(() => this.themeService.layoutConfig().darkTheme ? 'assets/shared/Logo-sin-fondo-oscuro.png' : 'assets/shared/Logo-sin-fondo.png');

  constructor() {
    this.changePasswordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmNewPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmNewPassword = form.get('confirmNewPassword');
    if (newPassword && confirmNewPassword && newPassword.value !== confirmNewPassword.value) {
      confirmNewPassword.setErrors({ mismatch: true });
      return { mismatch: true };
    }
    return null;
  }

  onSubmit() {
    if (this.changePasswordForm.valid) {
      const { currentPassword, newPassword } = this.changePasswordForm.value;

      this.authService.changePassword({ currentPassword, newPassword }).subscribe({
        next: (response: any) => {
          this.changePasswordSuccess = 'Contraseña cambiada exitosamente';
          this.changePasswordForm.reset();
        },
        error: (error: any) => {
          this.changePasswordError = error.message;
        }
      });
    }
  }
}