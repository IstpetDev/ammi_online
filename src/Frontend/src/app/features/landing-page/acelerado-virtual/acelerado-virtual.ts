import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HeaderComponent } from '../../../shared/header/header.component';
import { FooterComponent } from '../../../shared/footer/footer.component';
import { WhatsappSocialIconComponent } from '../../../shared/social-media/whatsapp-social-icon.component';
import { CreatePostulationExternoComponent } from '../../shared-actions/postulaciones/create-externo/create-postulation-externo.component';
import { SharedToastComponent } from '../../../shared/shared-toast/shared-toast.component';
import { PostulacionDraftService } from '../../../core/services/postulaciones/postulacion-draft.service';
import { ToastService } from '../../../shared/toast.service';

@Component({
  selector: 'app-acelerado-virtual',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent, WhatsappSocialIconComponent, CreatePostulationExternoComponent, SharedToastComponent],
  providers: [],
  templateUrl: './acelerado-virtual.html',
  styleUrls: ['./acelerado-virtual.component.css'],
})
export class AceleradoVirtualComponent implements OnInit {
  showPostulationDialog: boolean = false;

  constructor(
    private toastService: ToastService,
    private draftService: PostulacionDraftService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    if (this.draftService.has()) {
      this.showPostulationDialog = true;
    }

    this.route.queryParams.subscribe(params => {
      if (params['openPostulation'] === 'true') {
        this.showPostulationDialog = true;
      }
    });
  }

  openPostulationDialog(): void {
    this.showPostulationDialog = true;
  }

  closePostulationDialog(): void {
    this.showPostulationDialog = false;
  }

  onPostulacionCompleted(result: { success: boolean; message: string }): void {
    if (result.success) {
      this.showPostulationDialog = false;
      this.toastService.showSuccess(result.message, 'Éxito');
    } else {
      this.showPostulationDialog = true;
      this.toastService.showError(result.message, 'Revisa estos datos');
    }
  }
}
