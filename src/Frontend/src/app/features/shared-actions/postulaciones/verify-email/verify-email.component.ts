import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { EmailVerificationService } from '../../../../core/services/postulaciones/email-verification.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="verify-email-container">
      <div class="verify-card">
        <!-- Loading State -->
        <div *ngIf="isVerifying" class="verification-state">
          <div class="spinner"></div>
          <h2>Verificando tu email...</h2>
          <p>Por favor espera un momento</p>
        </div>

        <!-- Success State -->
        <div *ngIf="!isVerifying && isSuccess" class="verification-state success">
          <div class="icon-container success-icon">
            <i class="pi pi-check-circle"></i>
          </div>
          <h2>¡Email verificado exitosamente!</h2>
          <p>{{ message }}</p>
          <div class="success-instructions">
            <p class="highlight">✅ Tu email ha sido verificado</p>
            <p>Puedes cerrar esta pestaña y volver al formulario para continuar con tu postulación.</p>
          </div>
          <button class="btn-close-tab" (click)="closeTab()">
            <i class="pi pi-times"></i>
            Cerrar esta pestaña
          </button>
        </div>

        <!-- Error State -->
        <div *ngIf="!isVerifying && !isSuccess" class="verification-state error">
          <div class="icon-container error-icon">
            <i class="pi pi-times-circle"></i>
          </div>
          <h2>Error en la verificación</h2>
          <p>{{ message }}</p>
          <div class="action-buttons">
            <button class="btn-secondary" (click)="goToHome()">
              <i class="pi pi-home"></i>
              Volver al inicio
            </button>
            <button class="btn-primary" (click)="retryVerification()">
              <i class="pi pi-refresh"></i>
              Intentar de nuevo
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .verify-email-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .verify-card {
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      padding: 60px 40px;
      max-width: 500px;
      width: 100%;
      text-align: center;
    }

    .verification-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
    }

    .spinner {
      width: 60px;
      height: 60px;
      border: 5px solid #f3f3f3;
      border-top: 5px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .icon-container {
      font-size: 80px;
      margin-bottom: 10px;
    }

    .success-icon {
      color: #4caf50;
    }

    .error-icon {
      color: #f44336;
    }

    h2 {
      font-size: 28px;
      font-weight: 600;
      color: #333;
      margin: 0;
    }

    p {
      font-size: 16px;
      color: #666;
      margin: 10px 0 30px 0;
      line-height: 1.6;
    }

    .btn-continue,
    .btn-primary,
    .btn-secondary,
    .btn-close-tab {
      padding: 15px 35px;
      border: none;
      border-radius: 50px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: inline-flex;
      align-items: center;
      gap: 10px;
    }

    .btn-continue,
    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .btn-close-tab {
      background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
      color: white;
    }

    .btn-continue:hover,
    .btn-primary:hover,
    .btn-close-tab:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
    }

    .btn-secondary {
      background: #f5f5f5;
      color: #666;
    }

    .btn-secondary:hover {
      background: #e0e0e0;
      transform: translateY(-2px);
    }

    .action-buttons {
      display: flex;
      gap: 15px;
      justify-content: center;
      flex-wrap: wrap;
      margin-top: 20px;
    }

    .success {
      animation: fadeInScale 0.5s ease-out;
    }

    .error {
      animation: shake 0.5s ease-out;
    }

    @keyframes fadeInScale {
      0% {
        opacity: 0;
        transform: scale(0.9);
      }
      100% {
        opacity: 1;
        transform: scale(1);
      }
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-10px); }
      75% { transform: translateX(10px); }
    }

    @media (max-width: 600px) {
      .verify-card {
        padding: 40px 20px;
      }

      h2 {
        font-size: 24px;
      }

      .action-buttons {
        flex-direction: column;
      }

      .btn-continue,
      .btn-primary,
      .btn-secondary,
      .btn-close-tab {
        width: 100%;
      }
    }

    .success-instructions {
      background: #e8f5e9;
      border-left: 4px solid #4caf50;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      text-align: left;
    }

    .success-instructions p {
      margin: 10px 0;
      font-size: 15px;
      color: #2e7d32;
    }

    .success-instructions .highlight {
      font-weight: 600;
      font-size: 16px;
      color: #1b5e20;
    }
  `]
})
export class VerifyEmailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private emailVerificationService = inject(EmailVerificationService);

  isVerifying = true;
  isSuccess = false;
  message = '';
  private token = '';

  ngOnInit(): void {
    // Obtener el token de los query params
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      
      if (!this.token) {
        this.isVerifying = false;
        this.isSuccess = false;
        this.message = 'Token de verificación no encontrado. Por favor, revisa el enlace del correo.';
        return;
      }

      this.verifyToken();
    });
  }

  verifyToken(): void {
    this.isVerifying = true;
    
    this.emailVerificationService.verifyEmailToken(this.token).subscribe({
      next: (response) => {
        this.isVerifying = false;
        this.isSuccess = response.verificado;
        this.message = response.mensaje;

        // Si la verificación fue exitosa, almacenar en sessionStorage
        if (response.verificado) {
          // Decodificar el token para obtener el email
          try {
            const decodedToken = atob(this.token);
            const tokenParts = decodedToken.split(':');
            const email = tokenParts[0];
            
            sessionStorage.setItem('emailVerified', 'true');
            sessionStorage.setItem('verifiedEmail', email);
            sessionStorage.setItem('verificationTimestamp', new Date().toISOString());
            
            console.log('✅ Email verificado y guardado en sessionStorage:', email);
          } catch (error) {
            console.error('Error al decodificar token:', error);
            sessionStorage.setItem('emailVerified', 'true');
            sessionStorage.setItem('verificationTimestamp', new Date().toISOString());
          }
        }
      },
      error: (error) => {
        this.isVerifying = false;
        this.isSuccess = false;
        this.message = error.error?.message || 
                      'Error al verificar el email. El enlace puede haber expirado o ser inválido.';
      }
    });
  }

  continueToForm(): void {
    // Redirigir al formulario de postulación externa
    this.router.navigate(['/dashboard/create-postulation-externo']);
  }

  closeTab(): void {
    // Intentar cerrar la pestaña/ventana
    window.close();
    
    // Si window.close() no funciona (algunas restricciones del navegador),
    // mostrar un mensaje alternativo
    setTimeout(() => {
      // Si la ventana sigue abierta, el usuario no pudo cerrarla automáticamente
      alert('Por favor, cierra esta pestaña manualmente y vuelve al formulario.');
    }, 500);
  }

  retryVerification(): void {
    this.verifyToken();
  }

  goToHome(): void {
    this.router.navigate(['/']);
  }
}
