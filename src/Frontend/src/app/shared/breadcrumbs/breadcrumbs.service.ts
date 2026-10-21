import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

export interface BreadcrumbItem {
  label: string;
  url: string | any[];
}

@Injectable({
  providedIn: 'root'
})
export class BreadcrumbsService {
  private readonly customBreadcrumbsSubject = new BehaviorSubject<BreadcrumbItem[]>([]);
  public readonly customBreadcrumbs$: Observable<BreadcrumbItem[]> = this.customBreadcrumbsSubject.asObservable();

  private readonly resetSubject = new Subject<void>();
  public readonly reset$: Observable<void> = this.resetSubject.asObservable();

  setCustomBreadcrumbs(items: BreadcrumbItem[]): void {
    this.customBreadcrumbsSubject.next(items);
  }

  clearCustomBreadcrumbs(): void {
    this.customBreadcrumbsSubject.next([]);
  }

  triggerReset(): void {
    this.resetSubject.next();
  }
}
