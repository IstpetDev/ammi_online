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
    isLoading: boolean = false;
    currentYear: number = new Date().getFullYear();

    // Resultado de la validación exitosa
    resultadoRecuperacion: {
        username: string;
        claveTemporal: string;
        mensaje: string;
    } | null = null;

    copiado: boolean = false;

    private fb = inject(FormBuilder);
    private authService = inject(AuthService);
    private themeService = inject(ThemeService);
    private router = inject(Router);

    logoSrc = computed(() => this.themeService.layoutConfig().darkTheme ? 'assets/shared/Logo-sin-fondo-oscuro.png' : 'assets/shared/Logo-sin-fondo.png');

    constructor() {
        this.forgotForm = this.fb.group({
            documento: ['', [Validators.required, Validators.minLength(5)]],
            fechaNacimiento: ['', [Validators.required]]
        });
    }

    onSubmit() {
        if (this.forgotForm.valid) {
            const { documento, fechaNacimiento } = this.forgotForm.value;
            this.isLoading = true;
            this.error = '';
            this.resultadoRecuperacion = null;
            this.copiado = false;

            this.authService.recuperarClaveValidacion(documento.trim(), fechaNacimiento).subscribe({
                next: (response) => {
                    this.isLoading = false;
                    if (response && response.isSuccess && response.data) {
                        this.resultadoRecuperacion = {
                            username: response.data.username,
                            claveTemporal: response.data.claveTemporal,
                            mensaje: response.data.mensaje || 'Identidad validada con éxito.'
                        };
                    } else {
                        this.error = response?.message || 'No se pudo generar la contraseña temporal.';
                    }
                },
                error: (err) => {
                    this.isLoading = false;
                    this.error = err.error?.message || err.message || 'Error al validar los datos proporcionados.';
                }
            });
        }
    }

    copiarClave() {
        if (!this.resultadoRecuperacion?.claveTemporal) return;
        navigator.clipboard.writeText(this.resultadoRecuperacion.claveTemporal).then(() => {
            this.copiado = true;
            setTimeout(() => {
                this.copiado = false;
            }, 3000);
        });
    }

    irALogin() {
        this.router.navigate(['/login']);
    }

    reiniciarFormulario() {
        this.resultadoRecuperacion = null;
        this.error = '';
        this.forgotForm.reset();
    }
}
