import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';

export interface SeoConfig {
  title: string;
  description: string;
  keywords?: string;
  ogImage?: string;
  ogUrl?: string;
  canonical?: string;
}

/**
 * SeoService — Gestión centralizada de SEO para AMMI Online
 * Inyecta dinámicamente:
 *  - <title> y <meta> tags por ruta
 *  - JSON-LD Schema.org (EducationalOrganization, LocalBusiness, WebSite, FAQPage)
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly meta = inject(Meta);
  private readonly titleService = inject(Title);
  private readonly document = inject(DOCUMENT);

  private readonly BASE_URL = 'https://ammionline.ammi.edu.ec';
  private readonly OG_IMAGE = `${this.BASE_URL}/assets/shared/og-ammi-online.jpg`;

  // ─── Datos estructurados base de la organización ──────────────────────────

  private readonly FAQ_ITEMS = [
    {
      question: '¿El título de bachiller de AMMI Online es válido en Ecuador?',
      answer: 'Sí. El título de Bachiller otorgado por AMMI Online está avalado y registrado por el Ministerio de Educación del Ecuador (MINEDUC), con plena validez legal para acceder a estudios universitarios, trabajo formal y trámites del Estado.'
    },
    {
      question: '¿Cuánto tiempo dura el bachillerato acelerado en AMMI Online?',
      answer: 'La modalidad Acelerada Virtual tiene una duración de 6 meses. Está diseñada para personas mayores de edad con al menos 2 años de rezago educativo que necesitan obtener su título de bachiller en el menor tiempo posible.'
    },
    {
      question: '¿Qué diferencia hay entre el Bachillerato Formal y el Acelerado?',
      answer: 'El Bachillerato Formal Virtual tiene una duración de 10 meses y sigue el currículo oficial completo del Ministerio de Educación, ideal para quienes desean una formación integral. El Acelerado Virtual dura 6 meses y está pensado para personas con rezago educativo de al menos 2 años que quieren terminar rápidamente.'
    },
    {
      question: '¿Puedo estudiar desde cualquier ciudad o provincia del Ecuador?',
      answer: 'Sí. Al ser 100% virtual, puedes estudiar desde cualquier ciudad del Ecuador e incluso desde el exterior. Solo necesitas acceso a internet. Las clases están disponibles grabadas y también hay sesiones en vivo con tutores.'
    },
    {
      question: '¿El bachillerato virtual me permite entrar a la universidad?',
      answer: 'Absolutamente. El título de Bachiller de AMMI Online tiene la misma validez que cualquier bachillerato presencial. Puedes usar tu título para rendir el examen de admisión del SNNA (Ser Bachiller) y acceder a cualquier universidad pública o privada del Ecuador.'
    },
    {
      question: '¿Cuáles son los requisitos para inscribirse en AMMI Online?',
      answer: 'Para el Bachillerato Acelerado: ser mayor de edad y tener mínimo 2 años de rezago educativo (haber dejado de estudiar antes de terminar el bachillerato). Para el Bachillerato Formal: haber completado la Educación General Básica (10mo año aprobado). En ambos casos, contacta con nosotros por WhatsApp para asesoría personalizada.'
    },
    {
      question: '¿Cómo son las clases en AMMI Online y qué necesito para estudiar?',
      answer: 'Las clases son 100% virtuales: combinan videos grabados disponibles las 24 horas con tutorías en vivo con docentes expertos. Solo necesitas un dispositivo con internet (computadora, tablet o celular). La plataforma es interactiva y el aprendizaje se evalúa mediante proyectos prácticos, no exámenes memorísticos.'
    }
  ];

  // ─── Método principal: configurar SEO de una página ───────────────────────

  setPageSeo(config: SeoConfig): void {
    // Title
    this.titleService.setTitle(config.title);

    // Meta description
    this.meta.updateTag({ name: 'description', content: config.description });

    // Keywords
    if (config.keywords) {
      this.meta.updateTag({ name: 'keywords', content: config.keywords });
    }

    // Canonical
    const canonical = config.canonical ?? `${this.BASE_URL}/`;
    this.setCanonical(canonical);

    // Open Graph
    this.meta.updateTag({ property: 'og:title', content: config.title });
    this.meta.updateTag({ property: 'og:description', content: config.description });
    this.meta.updateTag({ property: 'og:url', content: canonical });
    this.meta.updateTag({ property: 'og:image', content: config.ogImage ?? this.OG_IMAGE });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:locale', content: 'es_EC' });
    this.meta.updateTag({ property: 'og:site_name', content: 'AMMI Online' });

    // Twitter Card
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: config.title });
    this.meta.updateTag({ name: 'twitter:description', content: config.description });
    this.meta.updateTag({ name: 'twitter:image', content: config.ogImage ?? this.OG_IMAGE });
  }

  // ─── Inyectar JSON-LD para la landing page ────────────────────────────────

  injectLandingPageSchema(): void {
    this.removeExistingSchemas();

    const schemas = [
      this.getOrganizationSchema(),
      this.getLocalBusinessSchema(),
      this.getWebSiteSchema(),
      this.getFaqPageSchema()
    ];

    schemas.forEach(schema => this.injectJsonLd(schema));
  }

  // ─── Schemas individuales ─────────────────────────────────────────────────

  private getOrganizationSchema(): object {
    return {
      '@context': 'https://schema.org',
      '@type': ['EducationalOrganization', 'Organization'],
      '@id': `${this.BASE_URL}/#organization`,
      name: 'AMMI Online',
      alternateName: 'AMMI Online Ecuador',
      url: this.BASE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${this.BASE_URL}/assets/shared/logo_ico.png`,
        width: 512,
        height: 512
      },
      image: this.OG_IMAGE,
      description: 'Plataforma de educación virtual ecuatoriana que ofrece Bachillerato Formal y Acelerado avalado por el Ministerio de Educación del Ecuador.',
      telephone: '+593961181942',
      email: 'info@ammi-online.com',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Quito',
        addressRegion: 'Pichincha',
        addressCountry: 'EC'
      },
      sameAs: [],
      foundingDate: '2020',
      areaServed: {
        '@type': 'Country',
        name: 'Ecuador'
      },
      hasCredential: {
        '@type': 'EducationalOccupationalCredential',
        name: 'Título de Bachiller',
        credentialCategory: 'degree',
        recognizedBy: {
          '@type': 'GovernmentOrganization',
          name: 'Ministerio de Educación del Ecuador',
          alternateName: 'MINEDUC'
        }
      }
    };
  }

  private getLocalBusinessSchema(): object {
    return {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      '@id': `${this.BASE_URL}/#localbusiness`,
      name: 'AMMI Online',
      description: 'Bachillerato virtual acelerado y formal avalado por el Ministerio de Educación del Ecuador. Clases 100% en línea, ',
      url: this.BASE_URL,
      telephone: '+593961181942',
      email: 'info@ammi-online.com',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Quito',
        addressRegion: 'Pichincha',
        postalCode: '170150',
        addressCountry: 'EC'
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: '-0.1807',
        longitude: '-78.4678'
      },
      openingHoursSpecification: [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          opens: '08:00',
          closes: '18:00'
        }
      ],
      priceRange: '$$',
      currenciesAccepted: 'USD',
      paymentAccepted: 'Cash, Credit Card, Bank Transfer',
      image: this.OG_IMAGE
    };
  }

  private getWebSiteSchema(): object {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${this.BASE_URL}/#website`,
      url: this.BASE_URL,
      name: 'AMMI Online',
      description: 'Plataforma de bachillerato virtual en Ecuador avalada por el MINEDUC',
      inLanguage: 'es-EC',
      publisher: {
        '@id': `${this.BASE_URL}/#organization`
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${this.BASE_URL}/?q={search_term_string}`
        },
        'query-input': 'required name=search_term_string'
      }
    };
  }

  private getFaqPageSchema(): object {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      '@id': `${this.BASE_URL}/#faqpage`,
      mainEntity: this.FAQ_ITEMS.map(item => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer
        }
      }))
    };
  }

  // ─── Utilidades ───────────────────────────────────────────────────────────

  private setCanonical(url: string): void {
    let link: HTMLLinkElement | null = this.document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  private injectJsonLd(schema: object): void {
    const script = this.document.createElement('script');
    script.type = 'application/ld+json';
    script.id = `schema-${(schema as any)['@type']}`;
    script.text = JSON.stringify(schema, null, 2);
    this.document.head.appendChild(script);
  }

  private removeExistingSchemas(): void {
    const existing = this.document.querySelectorAll('script[id^="schema-"]');
    existing.forEach(el => el.remove());
  }
}
