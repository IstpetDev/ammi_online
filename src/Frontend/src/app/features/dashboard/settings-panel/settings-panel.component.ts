import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { AuthService, User } from '../../../core/auth/index';
import { ThemeToggleComponent } from '../../../shared/theme/theme-toggle.component';
import { UserProfileComponent } from './user-profile/user-profile.component';

@Component({
  selector: 'app-settings-panel',
  standalone: true,
  imports: [CommonModule, ThemeToggleComponent, ButtonModule, DividerModule, TagModule, UserProfileComponent],
  templateUrl: './settings-panel.component.html',
  styleUrl: './settings-panel.component.css'
})
export class SettingsPanelComponent {
  @Input() visible = false;
  @Input() user: User | null = null;
  @Input() fotoPerfilUrl: string | null = null;
  @Input() isPdf = false;
  @Output() close = new EventEmitter<void>();
  @Output() logoutRequested = new EventEmitter<void>();

  showProfileView = false;

  private authService = inject(AuthService);

  getRoleLabel(roles: { idRol: number; nombre: string }[]): string {
    if (!roles?.length) return 'Sin Rol';
    return roles.map(r => r.nombre).join(', ');
  }
}
