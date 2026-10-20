import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../shared/header/header.component';
import { FooterComponent } from '../../shared/footer/footer.component';
import { WhatsappSocialIconComponent } from '../../shared/social-media/whatsapp-social-icon.component';
import { PRIMENG_MODULES } from '../../shared/primeng-imports';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [HeaderComponent, FooterComponent, WhatsappSocialIconComponent, RouterLink, ...PRIMENG_MODULES],
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css']
})
export class LandingPageComponent {
  scrollToModalidades() {
    document.getElementById('modalidades')?.scrollIntoView({ behavior: 'smooth' });
  }
}
