import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../../shared/header/header.component';
import { FooterComponent } from '../../../shared/footer/footer.component';
import { WhatsappSocialIconComponent } from '../../../shared/social-media/whatsapp-social-icon.component';
import { CreatePostulationExternoComponent } from '../../shared-actions/postulaciones/create-externo/create-postulation-externo.component';
import { SharedToastComponent } from '../../../shared/shared-toast/shared-toast.component';
import { PostulacionDraftService } from '../../../core/services/postulaciones/postulacion-draft.service';
import { ToastService } from '../../../shared/toast.service';

@Component({
  selector: 'app-formal-virtual',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent, WhatsappSocialIconComponent, CreatePostulationExternoComponent, SharedToastComponent],
  providers: [],
  templateUrl: './formal-virtual.html',
  styleUrls: ['./formal-virtual.component.css'],
})
export class FormalVirtualComponent implements OnInit {
  showPostulationDialog: boolean = false;

  constructor(
    private toastService: ToastService,
    private draftService: PostulacionDraftService
  ) {}

  ngOnInit(): void {
    if (this.draftService.has()) {
      this.showPostulationDialog = true;
    }
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
