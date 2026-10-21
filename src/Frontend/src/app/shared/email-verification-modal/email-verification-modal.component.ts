import { Component, EventEmitter, Input, OnInit, Output, inject, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EmailVerificationService } from '../../core/services/postulaciones/email-verification.service';

@Component({
  selector: 'app-email-verification-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './email-verification-modal.component.html',
  styleUrls: ['./email-verification-modal.component.css']
})
export class EmailVerificationModalComponent implements OnInit, OnChanges, OnDestroy {
  @Input() isOpen = false;
  @Input() email: string = '';
  @Input() nombrePostulante: string = '';
  @Output() onClose = new EventEmitter<void>();
  @Output() onVerified = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private emailVerificationService = inject(EmailVerificationService);

  verificationForm!: FormGroup;
  
  // Estados del modal
  currentStep: 'sending' | 'waiting' | 'verified' | 'error' = 'sending';
  errorMessage = '';
  successMessage = '';
  
  // Datos OTP
  otpExpirationDate: Date | null = null;
  
  // Cooldown para reenvío
  canResend = false;
  resendCooldownSeconds = 0;
  private resendInterval: any;
  
  // Polling para verificación
  private verificationPollingInterval: any;
  private pollingAttempts = 0;
  private maxPollingAttempts = 120; // 10 minutos (cada 5 segundos)

  ngOnInit(): void {
    this.verificationForm = this.fb.group({
      codigo: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen && this.email && this.nombrePostulante) {
      this.sendOtp();
    }
  }

  sendOtp(): void {
    this.currentStep = 'sending';
    this.errorMessage = '';

    this.emailVerificationService.sendOtp({
      email: this.email,
      nombrePostulante: this.nombrePostulante
    }).subscribe({
      next: (response) => {
        this.currentStep = 'waiting';
        this.successMessage = response.mensaje;
        this.otpExpirationDate = new Date(response.fechaExpiracion);
        this.startResendCooldown(60); // 60 segundos de cooldown
        
        // Iniciar polling para detectar verificación
        this.startVerificationPolling();
      },
      error: (error) => {
        this.currentStep = 'error';
        this.errorMessage = error.error?.message || 'Error al enviar el email de verificación';
      }
    });
  }

  /**
   * Inicia el polling para verificar si el email fue verificado
   */
  startVerificationPolling(): void {
    this.pollingAttempts = 0;
    
    // Limpiar polling anterior si existe
    if (this.verificationPollingInterval) {
      clearInterval(this.verificationPollingInterval);
    }
    
    // Verificar cada 5 segundos
    this.verificationPollingInterval = setInterval(() => {
      this.pollingAttempts++;
      
      // Si supera el máximo de intentos (10 minutos), detener
      if (this.pollingAttempts > this.maxPollingAttempts) {
        this.stopVerificationPolling();
        return;
      }
      
      // Llamar al endpoint is-verified
      this.emailVerificationService.isEmailVerified(this.email).subscribe({
        next: (isVerified) => {
          if (isVerified) {
            // Email verificado!
            this.onEmailVerifiedDetected();
          }
        },
        error: (error) => {
          console.error('Error al verificar estado:', error);
        }
      });
    }, 5000); // Cada 5 segundos
  }
  
  /**
   * Detiene el polling de verificación
   */
  stopVerificationPolling(): void {
    if (this.verificationPollingInterval) {
      clearInterval(this.verificationPollingInterval);
      this.verificationPollingInterval = null;
    }
  }
  
  /**
   * Se ejecuta cuando se detecta que el email fue verificado
   */
  onEmailVerifiedDetected(): void {
    this.stopVerificationPolling();
    this.currentStep = 'verified';
    this.successMessage = '¡Email verificado exitosamente!';
    
    // Guardar en sessionStorage solo si está disponible
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('emailVerified', 'true');
      sessionStorage.setItem('verifiedEmail', this.email);
      sessionStorage.setItem('verificationTimestamp', new Date().toISOString());
    }
    
    // Emitir evento de verificación exitosa después de 1.5 segundos
    setTimeout(() => {
      this.onVerified.emit();
      this.closeModal();
    }, 1500);
  }

  resendOtp(): void {
    if (!this.canResend) {
      return;
    }

    this.sendOtp();
  }

  startResendCooldown(seconds: number): void {
    this.canResend = false;
    this.resendCooldownSeconds = seconds;

    if (this.resendInterval) {
      clearInterval(this.resendInterval);
    }

    this.resendInterval = setInterval(() => {
      this.resendCooldownSeconds--;
      
      if (this.resendCooldownSeconds <= 0) {
        this.canResend = true;
        clearInterval(this.resendInterval);
      }
    }, 1000);
  }

  closeModal(): void {
    if (this.resendInterval) {
      clearInterval(this.resendInterval);
    }
    this.stopVerificationPolling();
    this.onClose.emit();
  }

  ngOnDestroy(): void {
    if (this.resendInterval) {
      clearInterval(this.resendInterval);
    }
    this.stopVerificationPolling();
  }
}
