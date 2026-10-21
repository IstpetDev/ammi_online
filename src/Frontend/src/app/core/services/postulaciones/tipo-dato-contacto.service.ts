import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { TipoDatoContactoDTO } from '../../../data/models/Entities';
import { IResponse } from '../../../data/models/IResponse';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../constants/app.constants';

@Injectable({
  providedIn: 'root'
})
export class TipoDatoContactoService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Obtener todos los tipos de dato de contacto
  getTiposDatoContacto(): Observable<TipoDatoContactoDTO[]> {
    return this.http.get<IResponse<TipoDatoContactoDTO[]>>(`${this.apiUrl}${API_ENDPOINTS.postulaciones.tipoDatoContacto.getAll}`).pipe(
      map(response => response.data)
    );
  }

  // Obtener tipo de dato de contacto por ID
  getTipoDatoContactoById(id: number): Observable<TipoDatoContactoDTO | undefined> {
    return this.getTiposDatoContacto().pipe(
      map(tipos => tipos.find(t => t.idTipoDatoContacto === id))
    );
  }

  // Obtener tipos de dato de contacto obligatorios
  getTiposDatoContactoObligatorios(): Observable<TipoDatoContactoDTO[]> {
    return this.getTiposDatoContacto().pipe(
      map(tipos => tipos.filter(t => t.esObligatorio))
    );
  }

  create(data: Partial<TipoDatoContactoDTO>): Observable<TipoDatoContactoDTO> {
    return this.http.post<IResponse<TipoDatoContactoDTO>>(`${this.apiUrl}${API_ENDPOINTS.postulaciones.tipoDatoContacto.create}`, data).pipe(
      map(response => response.data)
    );
  }
}

