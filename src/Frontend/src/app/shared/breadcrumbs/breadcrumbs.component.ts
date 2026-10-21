import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { BreadcrumbsService, BreadcrumbItem } from './breadcrumbs.service';

@Component({
  selector: 'app-breadcrumbs',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './breadcrumbs.component.html',
  styleUrls: ['./breadcrumbs.component.css']
})
export class BreadcrumbsComponent implements OnInit, OnDestroy {
  breadcrumbs: BreadcrumbItem[] = [];
  private customBreadcrumbs: BreadcrumbItem[] = [];
  private routerSubscription?: Subscription;
  private customSubscription?: Subscription;

  private routeLabels: { [key: string]: string } = {
    'dashboard': 'Inicio',
    'create-postulation-externo': 'Crear Postulación (Externo)',
    'create-postulation-manual': 'Crear Postulación (Manual)',
    'manage-postulations': 'Gestión de Postulaciones',
    'manage-approved': 'Postulaciones Aprobadas',
    'postulacion': 'Detalle de Postulación',
    'mi-postulacion': 'Mi Postulación',
    'upload-requisitos': 'Subir Requisitos',
    'postulaciones': 'Postulaciones',
    'matriculas': 'Matrículas',
    'pagos': 'Pagos',
    'calificaciones': 'Calificaciones',
    'mis-pagos': 'Mis Pagos',
    'mis-calificaciones': 'Mis Calificaciones',
    'mis-materias': 'Mis Materias',
    'distributivo': 'Distributivo',
    'distributivo-docente': 'Distributivo Docente',
    'parametrizacion': 'Parametrización',
    'planificacion': 'Planificación de Materias',
    'requisitos': 'Planificación de Requisitos',
    'configuraciones': 'Configuraciones',
    'reportes': 'Reportes',
    'seasons': 'Temporadas',
    'periodos': 'Periodos',
    'regimenes': 'Regímenes',
    'ciclos': 'Ciclos',
    'species': 'Especies',
    'modules-permissions': 'Módulos y Permisos',
    'users': 'Usuarios / Personas',
    'study-areas': 'Áreas de Estudio',
    'grades': 'Calificaciones / Niveles',
    'teaching': 'Docencia',
    'cyclic-configurations': 'Configuraciones Cíclicas',
    'crear-malla-completa': 'Crear Malla Completa',
    'historial-pagos': 'Historial de Pagos',
    'historial-por-alumno': 'Historial por Alumno',
    'apertura-ciclo': 'Apertura de Ciclo',
    're-matriculacion': 'Re-matriculación',
    'configurar-cursos-postulacion': 'Configurar Cursos para Postulaciones'
  };

  constructor(
    private readonly router: Router,
    private readonly activatedRoute: ActivatedRoute,
    private readonly breadcrumbsService: BreadcrumbsService
  ) {}

  ngOnInit(): void {
    // Escuchar cambios de ruta de navegación
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      // Limpiar migas de pan personalizadas al cambiar de ruta
      this.breadcrumbsService.clearCustomBreadcrumbs();
      this.updateBreadcrumbs();
    });

    // Escuchar migas de pan lógicas/personalizadas
    this.customSubscription = this.breadcrumbsService.customBreadcrumbs$.subscribe(customItems => {
      this.customBreadcrumbs = customItems;
      this.updateBreadcrumbs();
    });

    this.updateBreadcrumbs();
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    if (this.customSubscription) {
      this.customSubscription.unsubscribe();
    }
  }

  onBreadcrumbClick(item: BreadcrumbItem): void {
    const currentUrl = this.router.url;
    if (typeof item.url === 'string' && (currentUrl === item.url || currentUrl.split('?')[0] === item.url)) {
      this.breadcrumbsService.clearCustomBreadcrumbs();
      this.breadcrumbsService.triggerReset();
    }
  }

  onHomeClick(): void {
    const currentUrl = this.router.url;
    if (currentUrl === '/dashboard' || currentUrl.split('?')[0] === '/dashboard') {
      this.breadcrumbsService.clearCustomBreadcrumbs();
      this.breadcrumbsService.triggerReset();
    }
  }

  get canGoBack(): boolean {
    const currentUrl = this.router.url;
    if (currentUrl.includes('/dashboard/postulacion/') || currentUrl.startsWith('/dashboard/postulacion')) {
      return false;
    }
    return this.customBreadcrumbs.length > 0 || this.breadcrumbs.length > 1;
  }

  goBack(): void {
    if (this.customBreadcrumbs.length > 0) {
      this.breadcrumbsService.clearCustomBreadcrumbs();
      this.breadcrumbsService.triggerReset();
    } else if (this.breadcrumbs.length > 1) {
      const previousIndex = this.breadcrumbs.length - 2;
      const previousItem = this.breadcrumbs[previousIndex];
      if (typeof previousItem.url === 'string') {
        this.router.navigateByUrl(previousItem.url);
      }
    }
  }

  private updateBreadcrumbs(): void {
    const baseBreadcrumbs = this.buildBreadcrumbs(this.activatedRoute.root);
    this.breadcrumbs = [...baseBreadcrumbs, ...this.customBreadcrumbs];
  }

  private buildBreadcrumbs(route: ActivatedRoute, url: string = '', breadcrumbs: BreadcrumbItem[] = []): BreadcrumbItem[] {
    const children: ActivatedRoute[] = route.children;

    if (children.length === 0) {
      return breadcrumbs;
    }

    for (const child of children) {
      let routeURL: string = child.snapshot.url.map(segment => segment.path).join('/');
      if (routeURL !== '') {
        url += `/${routeURL}`;
      }

      let label = '';
      if (routeURL !== '') {
        label = this.routeLabels[routeURL.toLowerCase()] || this.formatLabel(routeURL);
      }

      // Si tiene parámetros dinámicos (como un ID), podemos ajustar la etiqueta
      const params = child.snapshot.params;
      const paramKeys = Object.keys(params);
      if (paramKeys.length > 0 && routeURL !== '') {
        const idParam = params['id'];
        if (idParam) {
          // Cambiar el label dinámicamente o añadir el ID
          if (routeURL === `postulacion/${idParam}` || routeURL.endsWith(`/${idParam}`)) {
            label = `${this.routeLabels['postulacion'] || 'Postulación'} #${idParam}`;
          } else {
            label = `${label} (#${idParam})`;
          }
        }
      }

      if (label && label !== '') {
        // Evitamos meter 'Inicio' dos veces
        const alreadyHasHome = breadcrumbs.some(b => b.label === 'Inicio');
        if (label === 'Inicio' && alreadyHasHome) {
          // No hacer nada
        } else {
          breadcrumbs.push({
            label: label,
            url: url
          });
        }
      }

      return this.buildBreadcrumbs(child, url, breadcrumbs);
    }

    return breadcrumbs;
  }

  private formatLabel(segment: string): string {
    // Si es un número (por ejemplo, id)
    if (!isNaN(Number(segment))) {
      return `#${segment}`;
    }
    // Si no está traducido, poner en mayúsculas y quitar guiones
    return segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
