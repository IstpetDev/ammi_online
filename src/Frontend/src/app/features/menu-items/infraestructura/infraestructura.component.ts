import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SeasonsComponent } from '../../shared-actions/settings/seasons/seasons.component';
import { StudyAreasComponent } from '../../shared-actions/settings/study-areas/study-areas.component';
import { CyclicConfigurationsComponent } from '../../shared-actions/global-settings/cyclic-configurations/cyclic-configurations.component';
import { GradesComponent } from '../../shared-actions/settings/grades/grades.component';
import { MallasComponent } from '../../shared-actions/settings/mallas/mallas.component';
import { BreadcrumbsService } from '../../../shared/breadcrumbs/breadcrumbs.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-infraestructura',
  standalone: true,
  imports: [CommonModule,  SeasonsComponent, StudyAreasComponent, CyclicConfigurationsComponent, GradesComponent, MallasComponent],
  templateUrl: './infraestructura.component.html',
  styleUrls: ['./infraestructura.component.css']
})
export class InfraestructuraComponent implements OnInit, OnDestroy {
  private resetSubscription?: Subscription;

  constructor(
    private readonly router: Router,
    private readonly breadcrumbsService: BreadcrumbsService
  ) {}

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

  goToCrearMallaCompleta(): void {
    this.router.navigate(['/dashboard/crear-malla-completa']);
  }

  showSeasonsComponent: boolean = false;
  showStudyAreasComponent: boolean = false;
  showCyclicConfigurationsComponent: boolean = false;
  showGradesComponent: boolean = false;
  showMallasComponent: boolean = false;

  goToPlanificacion(): void {
    this.router.navigate(['/dashboard/planificacion']);
  }

  goToRequisitos(): void {
    this.router.navigate(['/dashboard/requisitos']);
  }


  showSeasons() {
    this.showSeasonsComponent = true;
    this.showStudyAreasComponent = false;
    this.showCyclicConfigurationsComponent = false;
    this.showGradesComponent = false;
    this.showMallasComponent = false;
    this.breadcrumbsService.setCustomBreadcrumbs([{ label: 'Configuración de Ciclos', url: '' }]);
  }

  showStudyAreas() {
    this.showStudyAreasComponent = true;
    this.showSeasonsComponent = false;
    this.showCyclicConfigurationsComponent = false;
    this.showGradesComponent = false;
    this.showMallasComponent = false;
    this.breadcrumbsService.setCustomBreadcrumbs([{ label: 'Áreas de Estudio', url: '' }]);
  }

  showCyclicConfigurations() {
    this.showCyclicConfigurationsComponent = true;
    this.showSeasonsComponent = false;
    this.showStudyAreasComponent = false;
    this.showGradesComponent = false;
    this.showMallasComponent = false;
    this.breadcrumbsService.setCustomBreadcrumbs([{ label: 'Configuración de Mallas Académicas', url: '' }]);
  }

  showGrades() {
    this.showGradesComponent = true;
    this.showSeasonsComponent = false;
    this.showStudyAreasComponent = false;
    this.showCyclicConfigurationsComponent = false;
    this.showMallasComponent = false;
    this.breadcrumbsService.setCustomBreadcrumbs([{ label: 'Plantillas de Evaluación', url: '' }]);
  }

  
  showMallas() {
    this.showMallasComponent = true;
    this.showGradesComponent = false;
    this.showSeasonsComponent = false;
    this.showCyclicConfigurationsComponent = false;
    this.showStudyAreasComponent = false;
    this.breadcrumbsService.setCustomBreadcrumbs([{ label: 'Estructuras Académicas', url: '' }]);
  }


  hideComponents() {
    this.showSeasonsComponent = false;
    this.showStudyAreasComponent = false;
    this.showCyclicConfigurationsComponent = false;
    this.showGradesComponent = false;
    this.showMallasComponent = false;
    this.breadcrumbsService.clearCustomBreadcrumbs();
  }
}