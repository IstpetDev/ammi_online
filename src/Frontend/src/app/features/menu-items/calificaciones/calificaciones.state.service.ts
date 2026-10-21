import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CalificacionesStateService {
  // Saved filters state
  public savedPeriodoId: number | null = null;
  public savedCicloId: number | null = null;
  public savedMallaId: number | null = null;
  public savedMateriaId: number | null = null;

  private asignacionSource = new BehaviorSubject<any>(null);
  asignacion$ = this.asignacionSource.asObservable();

  get asignacion(): any {
    return this.asignacionSource.getValue();
  }

  private refreshSource = new Subject<void>();
  refresh$ = this.refreshSource.asObservable();

  setAsignacion(asignacion: any): void {
    this.asignacionSource.next(asignacion);
  }

  triggerRefresh(): void {
    this.refreshSource.next();
  }
}
