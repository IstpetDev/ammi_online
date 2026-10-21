import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PostulacionesStateService {
  private openDrawerSource = new Subject<void>();
  openDrawer$ = this.openDrawerSource.asObservable();

  openDrawer(): void {
    this.openDrawerSource.next();
  }
}
