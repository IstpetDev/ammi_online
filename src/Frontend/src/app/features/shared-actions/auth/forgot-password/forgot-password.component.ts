import { Component, inject, computed } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/index';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ThemeService } from '../../../../core/services/theme.service';

@Component({
    selector: 'app-forgot-password',
    standalone: true,
    imports: [ReactiveFormsModule, CommonModule, RouterLink, ProgressSpinnerModule],
    templateUrl: './forgot-password.component.html',
    styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
    forgotForm: FormGroup;
    error: string = '';
    success: string = '';
    isLoading: boolean = false;
    currentYear: number = new Date().getFullYear();

    private fb = inject(FormBuilder);
    private authService = inject(AuthService);
    private themeService = inject(ThemeService);

    logoSrc = computed(() => this.themeService.layoutConfig().darkTheme ? 'assets/shared/Logo-sin-fondo-oscuro.png' : 'assets/shared/Logo-sin-fondo.png');

    constructor() {
        this.forgotForm = this.fb.group({
            username: ['', [Validators.required]]
        });
    }

    onSubmit() {
        if (this.forgotForm.valid) {
            const { username } = this.forgotForm.value;
            this.isLoading = true;
            this.error = '';
            this.success = '';

            this.authService.forgotPassword(username).subscribe({
                next: (response) => {
                    this.isLoading = false;
                    this.success = response.message;
                    this.forgotForm.reset();
                },
                error: (error) => {
                    this.isLoading = false;
                    this.error = error.message;
                }
            });
        }
    }
}
