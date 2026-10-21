import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-shared-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="es-container" [style.min-height]="minHeight">
      @if (materialIcon) {
        <div class="es-icon-wrapper">
          <i class="material-icons">{{ materialIcon }}</i>
        </div>
      } @else if (icon) {
        <div class="es-icon-wrapper">
          <i [class]="icon"></i>
        </div>
      }
      <h3 class="es-title">{{ title }}</h3>
      @if (description) {
        <p class="es-description">{{ description }}</p>
      }
      <div class="es-actions">
        <ng-content></ng-content>
        @if (actionText) {
          <button class="es-btn" (click)="action.emit()">
            @if (materialActionIcon) {
              <i class="material-icons">{{ materialActionIcon }}</i>
            } @else if (actionIcon) {
              <i [class]="actionIcon"></i>
            }
            {{ actionText }}
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; }
    .es-container {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 2rem 1.5rem; text-align: center;
      background: var(--surface-card); border: 2px dashed var(--surface-border);
      border-radius: 12px; width: 100%;
      font-family: 'Poppins', sans-serif;
    }
    .es-icon-wrapper {
      width: 48px; height: 48px; border-radius: 50%;
      background: rgba(233, 185, 2, 0.1); border: 2px solid rgba(233, 185, 2, 0.2);
      display: flex; align-items: center; justify-content: center; margin-bottom: 0.5rem;
    }
    .es-icon-wrapper i {
      font-size: 1.4rem; color: var(--brand-yellow-dark);
    }
    .es-title {
      margin: 0 0 0.25rem 0; font-size: 1rem; font-weight: 700;
      color: var(--text-color);
    }
    .es-description {
      margin: 0 0 0.75rem 0; font-size: 0.8rem;
      color: var(--text-color-secondary); max-width: 360px; line-height: 1.5;
    }
    .es-btn {
      display: inline-flex; align-items: center; gap: 0.5rem;
      padding: 0.65rem 1.5rem;
      background: var(--brand-yellow-dark); border: none; border-radius: 10px;
      color: var(--brand-black); font-weight: 700; font-size: 0.85rem;
      cursor: pointer; transition: all 0.2s ease; font-family: inherit;
    }
    .es-btn:hover { background: var(--brand-yellow); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(233,185,2,0.3); }
    .es-actions { display: flex; gap: 0.75rem; margin-top: 0.5rem; flex-wrap: wrap; justify-content: center; }
    :host-context(.app-dark) .es-container { background: var(--surface-card); border-color: var(--surface-border); }
  `]
})
export class SharedEmptyStateComponent {
  @Input() icon: string = '';
  @Input() materialIcon: string = '';
  @Input() title: string = 'Sin datos';
  @Input() description: string = '';
  @Input() actionText: string = '';
  @Input() actionIcon: string = '';
  @Input() materialActionIcon: string = '';
  @Input() minHeight: string = '320px';
  @Output() action = new EventEmitter<void>();
}
