import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_ENDPOINTS } from '../../constants/app.constants';

export interface EmailRequest {
  destinatario: string;
  asunto: string;
  cuerpo: string;
  esHtml: boolean;
}

export interface EmailResponse {
  enviado: boolean;
  mensaje: string;
}

@Injectable({ providedIn: 'root' })
export class EmailService {
  private http = inject(HttpClient);

  sendEmail(request: EmailRequest): Observable<EmailResponse> {
    return this.http
      .post<{ data: EmailResponse; isSuccess: boolean }>(API_ENDPOINTS.email.send, request)
      .pipe(map(res => res.data));
  }
}
