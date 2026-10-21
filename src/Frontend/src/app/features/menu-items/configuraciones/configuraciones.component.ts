import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModulesPermissionsComponent } from '../../shared-actions/global-settings/modules-permissions/modules-permissions.component';
import { MallasComponent } from '../../shared-actions/settings/mallas/mallas.component';
import { PersonaComponent } from '../../shared-actions/global-settings/persona/persona.component';
import { CuentaBancariaComponent } from '../../shared-actions/settings/payment-settings/cuenta-bancaria/cuenta-bancaria.component';
import { BreadcrumbsService } from '../../../shared/breadcrumbs/breadcrumbs.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-configuraciones',
  standalone: true,
  imports: [CommonModule, ModulesPermissionsComponent, MallasComponent, PersonaComponent, CuentaBancariaComponent],
  templateUrl: './configuraciones.component.html',
  styleUrls: ['./configuraciones.component.css']
})
export class ConfiguracionesComponent implements OnInit, OnDestroy {
  showModulesPermissionsComponent: boolean = false;
  showCyclicConfigurationsComponent: boolean = false;
  showMallasComponent: boolean = false;
  showPersonaComponent: boolean = false;
  showCuentaBancariaComponent: boolean = false;
  private resetSubscription?: Subscription;

  constructor(private readonly breadcrumbsService: BreadcrumbsService) {}

  ngOnInit(): void {
    this.resetSubscription = this.breadcrumbsService.reset$.subscribe(() => {
      this.hideComponents();
    });
  }

  ngOnDestroy(): void {
    this.breadcrumbsService.clearCustomBreadcrumbs();
    if (this.resetSubscription) {
      this.resetSubscription.unsubscribe();
    }
  }

  showModulesPermissions() {
    this.showModulesPermissionsComponent = true;
    this.showCyclicConfigurationsComponent = false;
    this.showMallasComponent = false;
    this.showPersonaComponent = false;
    this.breadcrumbsService.setCustomBreadcrumbs([{ label: 'Módulos y Permisos', url: '' }]);
  }

  showMallas() {
    this.showMallasComponent = true;
    this.showModulesPermissionsComponent = false;
    this.showCyclicConfigurationsComponent = false;
    this.showPersonaComponent = false;
    this.breadcrumbsService.setCustomBreadcrumbs([{ label: 'Estructuras Académicas', url: '' }]);
  }

  showPersona() {
    this.showPersonaComponent = true;
    this.showModulesPermissionsComponent = false;
    this.showCyclicConfigurationsComponent = false;
    this.showMallasComponent = false;
    this.showCuentaBancariaComponent = false;
    this.breadcrumbsService.setCustomBreadcrumbs([{ label: 'Administración de Usuarios', url: '' }]);
  }

  showCuentaBancaria() {
    this.showCuentaBancariaComponent = true;
    this.showModulesPermissionsComponent = false;
    this.showCyclicConfigurationsComponent = false;
    this.showMallasComponent = false;
    this.showPersonaComponent = false;
    this.breadcrumbsService.setCustomBreadcrumbs([{ label: 'Cuentas Bancarias', url: '' }]);
  }

  hideComponents() {
    this.showModulesPermissionsComponent = false;
    this.showCyclicConfigurationsComponent = false;
    this.showMallasComponent = false;
    this.showPersonaComponent = false;
    this.showCuentaBancariaComponent = false;
    this.breadcrumbsService.clearCustomBreadcrumbs();
  }
}