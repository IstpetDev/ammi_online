import { Component, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ThemeToggleComponent } from '../theme/theme-toggle.component';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [ThemeToggleComponent, RouterLink],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  constructor(private readonly themeService: ThemeService) {}

  logoSrc = computed(() => {
    return this.themeService.isDarkTheme()
      ? 'assets/shared/Logo-sin-fondo-oscuro.png'
      : 'assets/shared/Logo-sin-fondo.png';
  });
}
