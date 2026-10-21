import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-shared-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="sh-container">
      <div class="sh-left">
        @if (materialIcon) {
          <div class="sh-icon-wrapper">
            <i class="material-icons">{{ materialIcon }}</i>
          </div>
        } @else if (icon) {
          <div class="sh-icon-wrapper">
            <i [class]="icon"></i>
          </div>
        }
        <div>
          <h1 class="sh-title">{{ title }}</h1>
          @if (subtitle) {
            <p class="sh-subtitle">{{ subtitle }}</p>
          }
        </div>
      </div>
      @if (showActions) {
        <div class="sh-actions">
          <ng-content select="[header-actions]"></ng-content>
        </div>
      }
    </div>
  `,
  styles: [`
    .sh-container {
      display: flex; justify-content: space-between; align-items: center;
      flex-wrap: wrap; gap: 1rem;
      padding: 1rem 1rem 1rem 1.5rem; margin-bottom: 1rem;
      border-left: 3px solid var(--brand-yellow-dark);
      font-family: 'Poppins', sans-serif;
    }
    .sh-left { display: flex; align-items: center; gap: 0.75rem; }
    .sh-icon-wrapper {
      width: 36px; height: 36px;
      background: var(--brand-yellow-dark); border-radius: 8px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .sh-icon-wrapper i { font-size: 1.1rem; color: var(--brand-black); }
    .sh-title { margin: 0; font-size: 1.25rem; font-weight: 700; color: var(--text-color); }
    .sh-subtitle { margin: 0.15rem 0 0 0; font-size: 0.75rem; color: var(--text-color-secondary); }
    .sh-actions { display: flex; gap: 0.5rem; align-items: center; }
    @media (max-width: 768px) {
      .sh-container { padding: 0.75rem; border-radius: 6px; }
      .sh-left { flex-direction: column; align-items: flex-start; }
      .sh-actions { width: 100%; }
    }
  `]
})
export class SharedHeaderComponent {
  @Input() icon: string = '';
  @Input() materialIcon: string = '';
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() showActions: boolean = true;
}
