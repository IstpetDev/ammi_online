import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../../shared/header/header.component';
import { FooterComponent } from '../../../shared/footer/footer.component';
import { WhatsappSocialIconComponent } from '../../../shared/social-media/whatsapp-social-icon.component';
import { DialogModule } from 'primeng/dialog';
import { CreatePostulationExternoComponent } from '../../shared-actions/postulaciones/create-externo/create-postulation-externo.component';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-acelerado-virtual',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent, WhatsappSocialIconComponent, DialogModule, CreatePostulationExternoComponent, ToastModule],
  providers: [MessageService],
  templateUrl: './acelerado-virtual.html',
  styleUrls: ['./acelerado-virtual.component.css'],
})
export class AceleradoVirtualComponent {
  showPostulationDialog: boolean = false;

  constructor(private messageService: MessageService) {}

  openPostulationDialog(): void {
    this.showPostulationDialog = true;
  }

  closePostulationDialog(): void {
    this.showPostulationDialog = false;
  }

  onPostulacionCompleted(result: { success: boolean; message: string }): void {
    this.showPostulationDialog = false;
    
    if (result.success) {
      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: result.message,
        life: 5000
      });
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: result.message,
        life: 5000
      });
    }
  }
}

