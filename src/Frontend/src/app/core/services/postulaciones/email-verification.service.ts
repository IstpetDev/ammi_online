import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface SendOtpRequest {
  email: string;
  nombrePostulante: string;
}

export interface OtpResponse {
  enviado: boolean;
  mensaje: string;
  fechaExpiracion: string;
  intentosRestantes: number;
}

export interface VerifyOtpRequest {
  email: string;
  codigo: string;
}

export interface VerifyOtpResponse {
  verificado: boolean;
  mensaje: string;
}

export interface ApiResponse<T> {
  data: T;
  isSuccess: boolean;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class EmailVerificationService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/EmailVerification`;

  /**
   * Envía un código OTP al email especificado
   */
  sendOtp(request: SendOtpRequest): Observable<OtpResponse> {
    return this.http
      .post<ApiResponse<OtpResponse>>(`${this.baseUrl}/send-otp`, request)
      .pipe(map(res => res.data));
  }

  /**
   * Verifica un token de email (cuando el usuario hace clic en el enlace del correo)
   */
  verifyEmailToken(token: string): Observable<VerifyOtpResponse> {
    const params = new HttpParams().set('token', token);
    return this.http
      .get<ApiResponse<VerifyOtpResponse>>(`${this.baseUrl}/verify-email-token`, { params })
      .pipe(map(res => res.data));
  }

  /**
   * Verifica un código OTP ingresado manualmente
   */
  verifyOtp(request: VerifyOtpRequest): Observable<VerifyOtpResponse> {
    return this.http
      .post<ApiResponse<VerifyOtpResponse>>(`${this.baseUrl}/verify-otp`, request)
      .pipe(map(res => res.data));
  }

  /**
   * Reenvía el código OTP al email especificado
   */
  resendOtp(email: string): Observable<OtpResponse> {
    const params = new HttpParams().set('email', email);
    return this.http
      .post<ApiResponse<OtpResponse>>(`${this.baseUrl}/resend-otp`, null, { params })
      .pipe(map(res => res.data));
  }

  /**
   * Verifica si un email ya está verificado
   */
  isEmailVerified(email: string): Observable<boolean> {
    const params = new HttpParams().set('email', email);
    return this.http
      .get<ApiResponse<boolean>>(`${this.baseUrl}/is-verified`, { params })
      .pipe(map(res => res.data));
  }
}
