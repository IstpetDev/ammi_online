import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ThemeToggleComponent } from '../theme/theme-toggle.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [ThemeToggleComponent, CommonModule, RouterLink],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  showModalidades = false;
  mobileMenuOpen = false;
  private hideTimeout: any;

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
  }

  showModalidadesDropdown() {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }
    this.showModalidades = true;
  }

  hideModalidadesDropdown() {
    this.hideTimeout = setTimeout(() => {
      this.showModalidades = false;
    }, 300); // 300ms delay
  }
}
