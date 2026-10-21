import { Component, inject, computed } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/auth/index';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ThemeService } from '../../../../core/services/theme.service';

@Component({
    selector: 'app-cambiar-contrasenia-primer-ingreso',
    standalone: true,
    imports: [ReactiveFormsModule, CommonModule, ProgressSpinnerModule],
    templateUrl: './cambiar-contrasenia-primer-ingreso.component.html',
    styleUrls: ['./cambiar-contrasenia-primer-ingreso.component.css']
})
export class CambiarContraseniaPrimerIngresoComponent {
    cambiarForm: FormGroup;
    error: string = '';
    isLoading: boolean = false;
    showNuevaContrasenia: boolean = false;
    showConfirmarNuevaContrasenia: boolean = false;
    currentYear: number = new Date().getFullYear();

    private fb = inject(FormBuilder);
    private authService = inject(AuthService);
    private router = inject(Router);
    private themeService = inject(ThemeService);

    logoSrc = computed(() => this.themeService.layoutConfig().darkTheme ? 'assets/shared/Logo-sin-fondo-oscuro.png' : 'assets/shared/Logo-sin-fondo.png');

    constructor() {
        this.cambiarForm = this.fb.group({
            nuevaContrasenia: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[A-Z])(?=.*\d).*$/)]],
            confirmarNuevaContrasenia: ['', [Validators.required]]
        }, { validators: this.passwordsMatchValidator });
    }

    passwordsMatchValidator(group: FormGroup) {
        const pass = group.get('nuevaContrasenia')?.value;
        const confirmPass = group.get('confirmarNuevaContrasenia')?.value;
        return (pass && confirmPass && pass === confirmPass) ? null : { 'mismatch': true };
    }

    onSubmit() {
        if (this.cambiarForm.valid) {
            this.isLoading = true;
            this.error = '';

            const { nuevaContrasenia, confirmarNuevaContrasenia } = this.cambiarForm.value;

            this.authService.cambiarContraseniaPrimerIngreso(nuevaContrasenia, confirmarNuevaContrasenia).subscribe({
                next: () => {
                    this.isLoading = false;
                    this.router.navigate(['/dashboard']);
                },
                error: (error) => {
                    this.isLoading = false;
                    this.error = error.message || 'Error al actualizar la contraseña.';
                }
            });
        } else {
            this.cambiarForm.markAllAsTouched();
        }
    }

    logout() {
        this.authService.logout();
    }
}
