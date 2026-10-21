import { Component, OnInit, inject, computed } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../../core/auth/index';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ThemeService } from '../../../../core/services/theme.service';

@Component({
    selector: 'app-reset-password',
    standalone: true,
    imports: [ReactiveFormsModule, CommonModule, RouterLink, ProgressSpinnerModule],
    templateUrl: './reset-password.component.html',
    styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
    resetForm: FormGroup;
    error: string = '';
    success: string = '';
    isLoading: boolean = false;
    token: string = '';
    showNewPassword: boolean = false;
    showConfirmNewPassword: boolean = false;
    currentYear: number = new Date().getFullYear();

    private fb = inject(FormBuilder);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private authService = inject(AuthService);
    private themeService = inject(ThemeService);

    logoSrc = computed(() => this.themeService.layoutConfig().darkTheme ? 'assets/shared/Logo-sin-fondo-oscuro.png' : 'assets/shared/Logo-sin-fondo.png');

    constructor() {
        this.resetForm = this.fb.group({
            newPassword: ['', [Validators.required, Validators.minLength(8)]],
            confirmNewPassword: ['', [Validators.required]]
        }, { validators: this.passwordMatchValidator });
    }

    ngOnInit(): void {
        this.token = (this.route.snapshot.queryParamMap.get('token') || '').trim();
        if (!this.token) {
            this.error = 'Token de recuperación no encontrado. Por favor solicita un nuevo enlace.';
        }
    }

    passwordMatchValidator(g: FormGroup) {
        return g.get('newPassword')?.value === g.get('confirmNewPassword')?.value
            ? null : { 'mismatch': true };
    }

    onSubmit() {
        if (this.resetForm.valid && this.token) {
            const { newPassword, confirmNewPassword } = this.resetForm.value;
            this.isLoading = true;
            this.error = '';
            this.success = '';

            this.authService.resetPassword({
                token: this.token,
                newPassword,
                confirmNewPassword
            }).subscribe({
                next: (response) => {
                    this.isLoading = false;
                    this.success = 'Contraseña restablecida correctamente. Serás redirigido al inicio de sesión en 3 segundos.';
                    setTimeout(() => {
                        this.router.navigate(['/login']);
                    }, 3000);
                },
                error: (err) => {
                    this.isLoading = false;
                    this.error = err?.error?.message || err?.message || 'Error al restablecer la contraseña. El token puede haber expirado o ya fue usado.';
                }
            });
        }
    }
}
