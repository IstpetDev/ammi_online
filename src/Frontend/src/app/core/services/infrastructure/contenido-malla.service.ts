import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { IResponse } from '../../../data/models/IResponse';

export interface ContenidoMallaDTO {
  idContenidoMalla: number;
  idDetalleMalla: number;
  contenido: string;
  fechaRegistro: string;
  esActivo: boolean;
  nombreMateria: string;
}

@Injectable({
  providedIn: 'root'
})
export class ContenidoMallaService {
  private apiUrl = `${environment.apiUrl}/ContenidoMalla`;
  readonly baseUrl = environment.apiUrl.replace('/api', '');

  constructor(private http: HttpClient) {}

  /**
   * Obtener contenidos por detalle de malla
   * GET /api/ContenidoMalla/ByDetalleMalla/{idDetalleMalla}
   */
  getByDetalleMalla(idDetalleMalla: number): Observable<ContenidoMallaDTO[]> {
    return this.http.get<ContenidoMallaDTO[]>(
      `${this.apiUrl}/ByDetalleMalla/${idDetalleMalla}`
    );
  }

  /**
   * Subir contenido de malla con archivo
   * POST /api/ContenidoMalla
   * Request body: IdDetalleMalla (int) + Contenido (binary)
   */
  create(idDetalleMalla: number, archivo: File): Observable<any> {
    const formData = new FormData();
    formData.append('IdDetalleMalla', idDetalleMalla.toString());
    formData.append('Contenido', archivo, archivo.name);

    return this.http.post(this.apiUrl, formData);
  }

  /**
   * Descargar archivo usando la ruta almacenada en contenido
   */
  downloadFile(contenido: string): Observable<Blob> {
    // Construir URL completa: https://localhost:7267/uploads/contenido-malla/archivo.pdf
    const fileUrl = `${this.baseUrl}/${contenido}`;
    return this.http.get(fileUrl, {
      responseType: 'blob'
    });
  }

  /**
   * Eliminar contenido de malla
   */
  delete(id: number): Observable<boolean> {
    return this.http.delete<IResponse<boolean>>(`${this.apiUrl}/${id}`)
      .pipe(map(r => r.isSuccess));
  }
}
