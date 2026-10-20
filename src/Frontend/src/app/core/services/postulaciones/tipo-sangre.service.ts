import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { TipoSangreDTO } from '../../../data/models/Entities';

@Injectable({
  providedIn: 'root'
})
export class TipoSangreService {

  // Datos mock de tipos de sangre
  private mockTiposSangre: TipoSangreDTO[] = [
    { idTipoSangre: 1, detalle: 'A+' },
    { idTipoSangre: 2, detalle: 'A-' },
    { idTipoSangre: 3, detalle: 'B+' },
    { idTipoSangre: 4, detalle: 'B-' },
    { idTipoSangre: 5, detalle: 'AB+' },
    { idTipoSangre: 6, detalle: 'AB-' },
    { idTipoSangre: 7, detalle: 'O+' },
    { idTipoSangre: 8, detalle: 'O-' }
  ];

  constructor() { }

  // Obtener todos los tipos de sangre
  getTiposSangre(): Observable<TipoSangreDTO[]> {
    return of(this.mockTiposSangre);
  }

  // Obtener tipo de sangre por ID
  getTipoSangreById(id: number): Observable<TipoSangreDTO | undefined> {
    const tipoSangre = this.mockTiposSangre.find(t => t.idTipoSangre === id);
    return of(tipoSangre);
  }
}