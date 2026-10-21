import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd, NavigationSkipped } from '@angular/router';
import { Subscription } from 'rxjs';
import { SharedDrawerComponent } from '../../../shared/shared-drawer/shared-drawer.component';
import { SharedHeaderComponent } from '../../../shared/shared-header/shared-header.component';
import { SharedNewButtonComponent } from '../../../shared/shared-new-button/shared-new-button.component';
import { CreatePostulationManualComponent } from '../../shared-actions/postulaciones/create-manual/create-postulation-manual.component';
import { CreatePostulationRapidaComponent } from '../../shared-actions/postulaciones/create-rapido/create-postulation-rapida.component';
import { RequisitosPostulacionComponent } from '../../shared-actions/postulaciones/requisitos-postulacion/requisitos-postulacion.component';
import { MessageService } from 'primeng/api';
import { PostulacionesStateService } from '../../shared-actions/postulaciones/postulaciones-state.service';
import { SharedToastComponent } from '../../../shared/shared-toast/shared-toast.component';

@Component({
  selector: 'app-postulaciones',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SharedDrawerComponent, SharedHeaderComponent, SharedNewButtonComponent,
    CreatePostulationManualComponent, CreatePostulationRapidaComponent, RequisitosPostulacionComponent, SharedToastComponent],
  providers: [MessageService],
  templateUrl: './postulaciones.component.html',
  styleUrls: ['./postulaciones.component.css']
})
export class PostulacionesComponent implements OnInit, OnDestroy {
  drawerVisible = false;
  drawerRapidoVisible = false;
  drawerRequisitosVisible = false;
  private navSub: Subscription;

  private readonly stateService = inject(PostulacionesStateService);

  constructor(
    private readonly router: Router
  ) {
    this.stateService.openDrawer$.subscribe(() => {
      this.drawerVisible = true;
    });
    this.navSub = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd || event instanceof NavigationSkipped) {
        const url = (event instanceof NavigationEnd ? event.url : (event as any).url) || '';
        if (url.includes('/manage-postulations') && this.drawerVisible) {
          this.drawerVisible = false;
        }
      }
    });
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.navSub?.unsubscribe();
  }

  isManageRoute(): boolean {
    return this.router.url.includes('/manage-postulations');
  }

  abrirNuevaPostulacion(): void {
    this.drawerVisible = true;
  }

  cerrarDrawer(): void {
    this.drawerVisible = false;
  }

  abrirPostulacionRapida(): void {
    this.drawerRapidoVisible = true;
  }

  cerrarDrawerRapido(): void {
    this.drawerRapidoVisible = false;
  }

  abrirGestionRequisitos(): void {
    this.drawerRequisitosVisible = true;
  }

  cerrarDrawerRequisitos(): void {
    this.drawerRequisitosVisible = false;
  }
}
