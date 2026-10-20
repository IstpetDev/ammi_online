import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { CursoDTO } from '../../../data/models/Entities';

@Injectable({
  providedIn: 'root'
})
export class CursoService {

  // Datos mock de cursos
  private mockCursos: CursoDTO[] = [
    {
      idCursos: 1,
      idEspecialidad: 2,
      detalle: 'OCTAVO BÁSICA'
    },
    {
      idCursos: 2,
      idEspecialidad: 2,
      detalle: 'NOVENO BÁSICA'
    },
    {
      idCursos: 3,
      idEspecialidad: 2,
      detalle: 'DECIMO BÁSICA'
    },
    {
      idCursos: 4,
      idEspecialidad: 1,
      detalle: 'PRIMERO BACHILLERATO'
    },
    {
      idCursos: 5,
      idEspecialidad: 1,
      detalle: 'SEGUNDO BACHILLERATO'
    },
    {
      idCursos: 6,
      idEspecialidad: 1,
      detalle: 'TERCERO BACHILLERATO'
    },
    {
      idCursos: 8,
      idEspecialidad: 2,
      detalle: 'SEPTIMO BASICA'
    },
    {
      idCursos: 9,
      idEspecialidad: 2,
      detalle: 'SEXTO BASICA'
    },
    {
      idCursos: 10,
      idEspecialidad: 2,
      detalle: 'QUINTO BASICA'
    },
    {
      idCursos: 11,
      idEspecialidad: 2,
      detalle: 'CUARTO BASICA'
    },
    {
      idCursos: 12,
      idEspecialidad: 2,
      detalle: 'TERCERO BASICA'
    },
    {
      idCursos: 13,
      idEspecialidad: 2,
      detalle: 'SEGUNDO BASICA'
    },
    {
      idCursos: 14,
      idEspecialidad: 1,
      detalle: 'PRIMERO BASICA'
    }
  ];

  constructor() { }

  // Obtener todos los cursos
  getCursos(): Observable<CursoDTO[]> {
    // Simulación de llamada a API
    return of(this.mockCursos);
  }

  // Obtener curso por ID
  getCursoById(id: number): Observable<CursoDTO | undefined> {
    const curso = this.mockCursos.find(c => c.idCursos === id);
    return of(curso);
  }

  // Obtener cursos por especialidad
  getCursosByEspecialidad(idEspecialidad: number): Observable<CursoDTO[]> {
    const cursos = this.mockCursos.filter(c => c.idEspecialidad === idEspecialidad);
    return of(cursos);
  }
}

