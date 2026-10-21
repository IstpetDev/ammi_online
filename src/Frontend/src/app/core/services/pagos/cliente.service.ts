import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ClienteDTO } from '../../../data/models/Entities';
import { API_BASE_URL, API_ENDPOINTS } from '../../constants/app.constants';
import { IResponse } from '../../../data/models/IResponse';

@Injectable({
    providedIn: 'root'
})
export class ClienteService {

    constructor(private http: HttpClient) { }

    /**
     * Buscar un cliente por documento
     * Endpoint: GET /api/Cliente/GetClientes?Documento={documento}
     */
    getClienteByDocumento(documento: string): Observable<IResponse<ClienteDTO[]>> {
        return this.http.get<IResponse<ClienteDTO[]>>(
            `${API_BASE_URL}${API_ENDPOINTS.pagos.cliente.getByDocumento(documento)}`
        );
    }

    /**
     * Buscar un cliente por ID
     * Endpoint: GET /api/Cliente/GetClientes?IdCliente={idCliente}
     */
    getClienteById(idCliente: number): Observable<IResponse<ClienteDTO[]>> {
        return this.http.get<IResponse<ClienteDTO[]>>(
            `${API_BASE_URL}${API_ENDPOINTS.pagos.cliente.getById(idCliente)}`
        );
    }

    /**
     * Crear un nuevo cliente
     * Endpoint: POST /api/Cliente/CreateCliente
     * Body: { cliente: ClienteDTO }
     */
    crearCliente(cliente: ClienteDTO): Observable<IResponse<number>> {
        const payload = { cliente };
        return this.http.post<IResponse<number>>(
            `${API_BASE_URL}${API_ENDPOINTS.pagos.cliente.create}`,
            payload
        );
    }
}
