import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-shared-chip',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="sc-chip" [title]="titleText">
      @if (icon) {
        <i class="sc-icon {{ icon }}"></i>
      }
      <div class="sc-content">
        <span class="sc-label">{{ label }}</span>
        @if (sublabel) {
          <span class="sc-sublabel">{{ sublabel }}</span>
        }
      </div>
    </div>
  `,
  styles: [`
    .sc-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.25rem 0.5rem;
      background: #e3e8f0;
      border: 1px solid #b6c2d9;
      border-radius: 8px;
      color: #2a4365;
      font-family: inherit;
      font-size: 0.75rem;
      font-weight: 600;
      line-height: 1;
      max-width: 100%;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      transition: all 0.2s ease;
      cursor: pointer;
    }
    .sc-chip:hover {
      background: #cbd5e1;
      transform: translateY(-0.5px);
    }
    .sc-icon {
      font-size: 0.75rem;
      color: #4a5568;
    }
    .sc-content {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      line-height: 1.1;
    }
    .sc-label {
      font-weight: 700;
      color: #1a365d;
    }
    .sc-sublabel {
      font-size: 0.65rem;
      font-weight: 400;
      color: #4a5568;
      margin-top: 1px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 140px;
    }
  `]
})
export class SharedChipComponent {
  @Input() label: string = '';
  @Input() sublabel: string = '';
  @Input() icon: string = '';
  @Input() titleText: string = '';
}
