import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService, LayoutConfig } from '../core/services/theme.service';

@Component({
    selector: 'app-theme-toggle',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './theme/theme-toggle.component.html',
    styleUrls: ['./theme/theme-toggle.component.css']
})
export class ThemeToggleComponent {
    constructor(private readonly themeService: ThemeService) {}

    isDarkTheme = computed(() => this.themeService.layoutConfig().darkTheme);

    toggleDarkMode() {
        this.themeService.layoutConfig.update((state: LayoutConfig) => ({ 
            ...state, 
            darkTheme: !state.darkTheme 
        }));
    }
}
