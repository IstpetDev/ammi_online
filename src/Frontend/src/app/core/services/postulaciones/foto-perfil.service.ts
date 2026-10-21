import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../constants/app.constants';

@Injectable({
    providedIn: 'root'
})
export class FotoPerfilService {
    private apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) { }

    getByPersonaId(idPersona: number): Observable<any> {
        // Si la ruta en app.constants.ts incluye /api/FotoPerfil..., pero environment.apiUrl lo repite o no, 
        // asumimos que environment.apiUrl apunta a https://localhost:7267 basado en otras implementaciones
        return this.http.get<any>(`${this.apiUrl}${API_ENDPOINTS.postulaciones.fotoPerfil.getByPersona(idPersona)}`);
    }
}
