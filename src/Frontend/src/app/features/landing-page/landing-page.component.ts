import { Component, OnInit } from '@angular/core';
import { NgClass } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HeaderComponent } from '../../shared/header/header.component';
import { FooterComponent } from '../../shared/footer/footer.component';
import { WhatsappSocialIconComponent } from '../../shared/social-media/whatsapp-social-icon.component';
import { PRIMENG_MODULES } from '../../shared/primeng-imports';
import { SeoService } from '../../core/services/seo.service';
import { CreatePostulationRapidaComponent } from '../shared-actions/postulaciones/create-rapido/create-postulation-rapida.component';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [HeaderComponent, FooterComponent, WhatsappSocialIconComponent, RouterLink, NgClass, CreatePostulationRapidaComponent, ...PRIMENG_MODULES],
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css']
})
export class LandingPageComponent implements OnInit {
  isPostulacionModalVisible: boolean = false;

  constructor(
    private router: Router,
    private seoService: SeoService
  ) { }

  abrirPostulacion() {
    this.isPostulacionModalVisible = true;
  }

  ngOnInit(): void {
    this.seoService.setPageSeo({
      title: 'Bachillerato Virtual Ecuador | AMMI Online — Avalado MINEDUC',
      description: 'Obtén tu título de bachiller 100% online en Ecuador. Bachillerato Acelerado (6 meses) y Formal Virtual avalados por el Ministerio de Educación. ¡Inscríbete hoy!',
      keywords: 'bachillerato virtual ecuador, bachillerato acelerado, bachillerato online mineduc, educación secundaria virtual, título bachiller ecuador, AMMI Online',
      canonical: 'https://ammionline.ammi.edu.ec/',
      ogUrl: 'https://ammionline.ammi.edu.ec/'
    });

    this.seoService.injectLandingPageSchema();
  }

  scrollToModalidades() {
    document.getElementById('modalidades')?.scrollIntoView({ behavior: 'smooth' });
  }

  inscribirse() {
    this.router.navigate(['/acelerado-virtual'], { queryParams: { openPostulation: 'true' } });
  }

  // Control de acordeón para FAQ
  activeFaq: number | null = null;
  toggleFaq(index: number): void {
    this.activeFaq = this.activeFaq === index ? null : index;
  }
}

