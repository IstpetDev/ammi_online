import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-shared-new-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button class="nb-btn" [disabled]="disabled" (click)="click.emit()" [title]="label">
      <svg class="nb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
      </svg>
      {{ label }}
    </button>
  `,
  styles: [`
    .nb-btn {
      display: inline-flex; align-items: center; gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: var(--brand-yellow-dark); border: none; border-radius: 10px;
      color: var(--brand-black); font-weight: 700; font-size: 0.9rem;
      cursor: pointer; transition: all 0.2s ease; font-family: 'Poppins', sans-serif;
      white-space: nowrap; box-shadow: 0 2px 6px rgba(233,185,2,0.25);
    }
    .nb-btn:hover { background: var(--brand-yellow); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(233,185,2,0.35); }
    .nb-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; box-shadow: none; }
    .nb-icon { width: 18px; height: 18px; flex-shrink: 0; }
  `]
})
export class SharedNewButtonComponent {
  @Input() label: string = 'Nuevo';
  @Input() disabled: boolean = false;
  @Output() click = new EventEmitter<void>();
}
