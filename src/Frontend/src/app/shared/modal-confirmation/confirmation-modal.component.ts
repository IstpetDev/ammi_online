import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [CommonModule, DialogModule, ButtonModule],
  templateUrl: './confirmation-modal.component.html',
  styleUrls: ['./confirmation-modal.component.css']
})
export class ConfirmationModalComponent {
  @Input() visible: boolean = false;
  @Input() title: string = '';
  @Input() message: string = '';
  @Input() acceptLabel: string = 'Aceptar';
  @Input() rejectLabel: string = 'Rechazar';
  @Input() loading: boolean = false;

  @Output() accept = new EventEmitter<void>();
  @Output() reject = new EventEmitter<void>();
  @Output() hide = new EventEmitter<void>();
  @Output() visibleChange = new EventEmitter<boolean>();

  onAccept(): void {
    this.accept.emit();
  }

  onReject(): void {
    this.reject.emit();
  }

  onHide(): void {
    this.hide.emit();
    this.visibleChange.emit(false);
  }
}
