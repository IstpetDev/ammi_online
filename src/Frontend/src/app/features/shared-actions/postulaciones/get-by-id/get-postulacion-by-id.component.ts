import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { PostulacionService, EstadoPostulacion } from '../../../../core/services/postulaciones';
import { RequisitosService } from '../../../../core/services/postulaciones/requisitos.service';
import { PersonaDTO, MallaParaleloDTO, DetalleCreditoDTO, CreditoConDetallesDTO, MallaDTO } from '../../../../data/models/Entities';
import { AuthService } from '../../../../core/auth/index';
import { MessageService } from 'primeng/api';
import { PersonaService } from '../../../../core/services/postulaciones/persona.service';
import { CreditoService } from '../../../../core/services/pagos/credito.service';
import { MallaParaleloService } from '../../../../core/services/infrastructure/malla-paralelo.service';
import { EmailService } from '../../../../core/services/postulaciones/email.service';
import { PagoEstudiante, Especie } from '../../../../shared/models/pagos.model';
import { VerDetallesComponent } from '../../../menu-items/pagos/ver-detalles/ver-detalles';
import { PaginatedPostulacionesResponse } from '../../../../core/services/postulaciones/postulacion.service';
import { CreatePostulationManualComponent } from '../create-manual/create-postulation-manual.component';
import { SharedDrawerComponent } from '../../../../shared/shared-drawer/shared-drawer.component';
import { EmailTemplatesService, EmailTemplateData } from '../../../../shared/email-templates.service';
import { DetalleMallaService } from '../../../../core/services/infrastructure/detalle-malla.service';
import { EspecieCicloService } from '../../../../core/services/infrastructure/especie-ciclo.service';
import { MallaService } from '../../../../core/services/postulaciones/malla.service';
import { forkJoin } from 'rxjs';
import { SharedToastComponent } from '../../../../shared/shared-toast/shared-toast.component';
import { SharedModalComponent } from '../../../../shared/shared-modal/shared-modal.component';

// Importación de subcomponentes modulares
import { PostulanteInfoComponent } from './components/postulante-info/postulante-info.component';
import { RequisitosListComponent, RequisitoExtendido } from './components/requisitos-list/requisitos-list.component';
import { AccionesPostulacionComponent } from './components/acciones-postulacion/acciones-postulacion.component';
import { DocumentoPreviewComponent } from './components/documento-preview/documento-preview.component';

@Component({
  selector: 'app-get-postulacion-by-id',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    ConfirmDialogModule,
    DialogModule,
    ProgressSpinnerModule,
    VerDetallesComponent,
    SharedToastComponent,
    SharedModalComponent,
    SharedDrawerComponent,
    CreatePostulationManualComponent,
    PostulanteInfoComponent,
    RequisitosListComponent,
    AccionesPostulacionComponent,
    DocumentoPreviewComponent
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './get-postulacion-by-id.component.html',
  styleUrls: ['./get-postulacion-by-id.component.css']
})
export class GetPostulacionByidComponent implements OnInit, OnDestroy {
  mostrarDialogAprobarPostulacion: boolean = false;
  mostrarDialogRechazarPostulacion: boolean = false;
  motivoRechazoPostulacion: string = '';

  // Paralelo selection for approval
  mallaParalelos: MallaParaleloDTO[] = [];
  loadingParalelos = false;
  selectedIdMallaParalelo: number | null = null;

  // Dialog de ver detalles tras aprobación
  mostrarDialogVerDetalles: boolean = false;
  estudianteDetalles: PagoEstudiante | null = null;
  detallesCreditoDialog: DetalleCreditoDTO[] = [];
  loadingDetalles: boolean = false;
  ocultarAccionesPostulacion: boolean = false;

  // Para modal de edición ligera de postulante
  mostrarModalEdicionBasica: boolean = false;
  guardandoEdicionBasica: boolean = false;
  formEdicionBasica = {
    primerNombre: '',
    segundoNombre: '',
    primerApellido: '',
    segundoApellido: '',
    documento: '',
    fechaNacimiento: '',
    idGenero: null as number | null
  };

  // Para modal de eliminación de postulante
  mostrarDialogEliminarPostulacion: boolean = false;
  eliminandoPostulacion: boolean = false;

  // Para drawer de contacto manual (completar registro)
  mostrarDrawerContactoManual: boolean = false;
  contactoIdPersona: number | null = null;
  contactoIdPostulacion: number | null = null;

  // Para dialog de contacto
  mostrarDialogContacto: boolean = false;
  contactoResultadoTexto: string = '';
  guardandoObservaciones: boolean = false;

  documento: string | null = null;
  postulacionByDocumento: PaginatedPostulacionesResponse | null = null;
  persona: PersonaDTO | null = null;
  requisitos: RequisitoExtendido[] = [];
  documentosPersonales: any[] = [];
  loading = true;
  
  // Datos de previsualización
  previewUrl: string | null = null;
  previewFileName: string | null = null;
  previewFileType: string | null = null;

  aprobandoPostulacion: boolean = false;
  validandoConfiguracionAprobacion: boolean = false;
  configuracionAcademicaValida: boolean | null = null;
  mensajeBloqueoConfiguracionAprobacion: string = '';
  detalleDiagnosticoConfiguracionAprobacion: string = '';

  /**
   * Devuelve los datos de contacto del postulante si existen
   */
  get datosContacto(): any[] {
    if (
      this.postulacionByDocumento &&
      this.postulacionByDocumento.items &&
      this.postulacionByDocumento.items[0]?.personasimple?.pcontacto
    ) {
      const pcontacto = this.postulacionByDocumento.items[0].personasimple.pcontacto;
      return Array.isArray(pcontacto) ? pcontacto : [pcontacto];
    }
    return [];
  }

  /**
   * Retorna true si existen datos de contacto válidos
   */
  get tieneDatosContacto(): boolean {
    const pcontacto = this.postulacionByDocumento?.items?.[0]?.personasimple?.pcontacto;
    if (!pcontacto) return false;

    if (Array.isArray(pcontacto)) {
      return pcontacto.some(c => c && (c.tipocontacto?.detalle?.trim() || c.detalle?.trim()));
    }
    return pcontacto.tipocontacto?.detalle?.trim() || pcontacto.detalle?.trim();
  }

  /**
   * Retorna true si la postulación está en estado 'CONTACTO PERSONA' (o idTipoEstadoAprobacion === 8)
   */
  get esEstadoContactoPersona(): boolean {
    const item: any = this.postulacionByDocumento?.items?.[0];
    if (!item) return false;
    const idEstado = item.tipoestadoaprobacion?.idTipoEstadoAprobacion ?? item.idTipoEstadoAprobacion;
    const detalle = item.tipoestadoaprobacion?.detalle?.toUpperCase() || '';
    return idEstado === 8 || detalle.includes('CONTACTO PERSONA') || detalle.includes('CONTACTO');
  }

  // ── Contacto ────────────────────────────────────────────────────────────
  get contactoObservaciones(): string {
    return this.postulacionByDocumento?.items?.[0]?.observacionesRevision ?? '';
  }
  get observacionesEsDefault(): boolean {
    return this.contactoObservaciones === 'No se ha contactado con el alumno';
  }
  get mostrarTextareaResultado(): boolean {
    return !this.observacionesEsDefault && this.contactoObservaciones.length > 0;
  }

  /**
   * Retorna true si TODOS los requisitos obligatorios (ADJUNTO y BOOL):
   * - están subidos/completados
   * - están aprobados (estado === true para ADJUNTO, valorBool === true para BOOL)
   * - ninguno está rechazado (estado === false para ADJUNTO, valorBool === false para BOOL)
   */
  get adjuntosObligatoriosAprobados(): boolean {
    // ADJUNTO obligatorios
    const adjuntosOk = this.requisitos
      .filter(r => r.tipoDato === 'ADJUNTO' && r.esObligatorio)
      .every(r => r.completado && r.documentoExistente?.estado === true);

    // BOOL obligatorios
    const boolOk = this.requisitos
      .filter(r => r.tipoDato === 'BOOL' && r.esObligatorio)
      .every(r => {
        const doc = this.documentosPersonales.find(d => d.codigoRequisito === (r.idRequisitos || 0).toString());
        return doc && doc.valorDato === true;
      });

    return adjuntosOk && boolOk;
  }

  get puedeIntentarAprobacion(): boolean {
    return this.adjuntosObligatoriosAprobados;
  }

  get motivoBloqueoAprobacion(): string {
    if (!this.adjuntosObligatoriosAprobados) {
      return 'Faltan documentos u obligaciones por aprobar.';
    }
    return '';
  }

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private postulacionService = inject(PostulacionService);
  private requisitosService = inject(RequisitosService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private personaService = inject(PersonaService);
  private creditoService = inject(CreditoService);
  private mallaParaleloService = inject(MallaParaleloService);
  private detalleMallaService = inject(DetalleMallaService);
  private especieCicloService = inject(EspecieCicloService);
  private mallaService = inject(MallaService);
  private emailService = inject(EmailService);
  private emailTemplatesService = inject(EmailTemplatesService);

  private getIdMallaActual(): number | null {
    const idMalla = this.postulacionByDocumento?.items?.[0]?.malla?.idMalla;
    return typeof idMalla === 'number' && idMalla > 0 ? idMalla : null;
  }

  private getIdCicloActual(): number | null {
    const item: any = this.postulacionByDocumento?.items?.[0];
    const idCiclo =
      item?.malla?.mallaCiclo?.idCiclo ??
      item?.malla?.mallaCiclo?.ciclo?.idCiclo ??
      item?.malla?.mallaCiclo?.ciclo?.id ??
      item?.malla?.idCiclo ??
      item?.idCiclo;

    return typeof idCiclo === 'number' && idCiclo > 0 ? idCiclo : null;
  }

  private setEstadoBloqueoConfiguracion(mensaje: string, diagnostico: string = ''): void {
    this.configuracionAcademicaValida = false;
    this.mensajeBloqueoConfiguracionAprobacion = mensaje;
    this.detalleDiagnosticoConfiguracionAprobacion = '';
  }

  private resolverIdCicloParaValidacion(
    idMalla: number,
    onResolved: (resultado: { idCiclo: number | null; fuenteCiclo: string; malla: MallaDTO | null }) => void
  ): void {
    const idCicloActual = this.getIdCicloActual();
    if (idCicloActual) {
      onResolved({ idCiclo: idCicloActual, fuenteCiclo: 'postulacion', malla: null });
      return;
    }

    this.mallaService.getMallasByParams({ IdMalla: idMalla }).subscribe({
      next: (mallas) => {
        const malla = Array.isArray(mallas) ? mallas.find(m => m.idMalla === idMalla) ?? mallas[0] : null;
        const idCicloMalla = malla?.idCiclo;
        onResolved({
          idCiclo: typeof idCicloMalla === 'number' && idCicloMalla > 0 ? idCicloMalla : null,
          fuenteCiclo: 'malla-por-id',
          malla: malla ?? null
        });
      },
      error: () => onResolved({ idCiclo: null, fuenteCiclo: 'sin-datos', malla: null })
    });
  }

  private validarConfiguracionPreviaAprobacion(onValid: () => void): void {
    const idMalla = this.getIdMallaActual();
    if (!idMalla) {
      this.aprobandoPostulacion = false;
      this.setEstadoBloqueoConfiguracion('No se pudo determinar la malla de la postulación para validar la aprobación.');
      this.messageService.add({
        severity: 'error',
        summary: 'Configuración incompleta',
        detail: `${this.mensajeBloqueoConfiguracionAprobacion} ${this.detalleDiagnosticoConfiguracionAprobacion}`.trim()
      });
      return;
    }

    this.resolverIdCicloParaValidacion(idMalla, ({ idCiclo, fuenteCiclo, malla }) => {
      if (!idCiclo) {
        this.aprobandoPostulacion = false;
        this.setEstadoBloqueoConfiguracion('No se pudo determinar el ciclo de la malla seleccionada para validar la aprobación.');
        this.messageService.add({
          severity: 'error',
          summary: 'Configuración incompleta',
          detail: `${this.mensajeBloqueoConfiguracionAprobacion} ${this.detalleDiagnosticoConfiguracionAprobacion}`.trim()
        });
        return;
      }

      forkJoin({
        detallesMalla: this.detalleMallaService.getByMalla(idMalla, 1, 800),
        especiesCiclo: this.especieCicloService.getByMalla(idMalla)
      }).subscribe({
        next: ({ detallesMalla, especiesCiclo }) => {
          const tieneDetalleMalla = Array.isArray(detallesMalla) && detallesMalla.length > 0;
          const tieneEspecieCiclo = Array.isArray(especiesCiclo) && especiesCiclo.length > 0;

          if (!tieneDetalleMalla || !tieneEspecieCiclo) {
            this.aprobandoPostulacion = false;

            this.setEstadoBloqueoConfiguracion(
              'No se han configurado asignaturas para esta malla o especies para esta malla.',
              ''
            );

            this.messageService.add({
              severity: 'warn',
              summary: 'Aprobación bloqueada',
              detail: `${this.mensajeBloqueoConfiguracionAprobacion} ${this.detalleDiagnosticoConfiguracionAprobacion}`.trim()
            });
            return;
          }

          onValid();
        },
        error: () => {
          this.aprobandoPostulacion = false;
          this.setEstadoBloqueoConfiguracion('No se pudo validar la configuración de Detalle Malla y Especie Ciclo.');
          this.messageService.add({
            severity: 'error',
            summary: 'Error de validación',
            detail: `${this.mensajeBloqueoConfiguracionAprobacion} ${this.detalleDiagnosticoConfiguracionAprobacion}`.trim()
          });
        }
      });
    });
  }

  private evaluarConfiguracionAprobacionVisual(): void {
    const idMalla = this.getIdMallaActual();

    if (!idMalla) {
      this.setEstadoBloqueoConfiguracion('No se pudo identificar la malla de la postulación para validar la aprobación.');
      return;
    }

    this.validandoConfiguracionAprobacion = true;
    this.configuracionAcademicaValida = null;
    this.mensajeBloqueoConfiguracionAprobacion = '';
    this.detalleDiagnosticoConfiguracionAprobacion = '';

    this.resolverIdCicloParaValidacion(idMalla, ({ idCiclo, fuenteCiclo, malla }) => {
      if (!idCiclo) {
        this.setEstadoBloqueoConfiguracion(
          'No se pudo determinar el ciclo de la malla seleccionada para validar la aprobación.'
        );
        this.validandoConfiguracionAprobacion = false;
        return;
      }

      forkJoin({
        detallesMalla: this.detalleMallaService.getByMalla(idMalla, 1, 800),
        especiesCiclo: this.especieCicloService.getByMalla(idMalla)
      }).subscribe({
        next: ({ detallesMalla, especiesCiclo }) => {
          const tieneDetalleMalla = Array.isArray(detallesMalla) && detallesMalla.length > 0;
          const tieneEspecieCiclo = Array.isArray(especiesCiclo) && especiesCiclo.length > 0;

          this.configuracionAcademicaValida = tieneDetalleMalla && tieneEspecieCiclo;

          if (!this.configuracionAcademicaValida) {
            const faltantes: string[] = [];
            if (!tieneDetalleMalla) faltantes.push('Asignaturas para la malla');
            if (!tieneEspecieCiclo) faltantes.push('Valores de las especies para la malla');
            this.mensajeBloqueoConfiguracionAprobacion = `Falta configuración requerida: ${faltantes.join(' y ')}.`;
            this.detalleDiagnosticoConfiguracionAprobacion = '';
          }

          this.validandoConfiguracionAprobacion = false;
        },
        error: () => {
          this.setEstadoBloqueoConfiguracion(
            'No se pudo validar la configuración de Detalle Malla y Especie Ciclo.'
          );
          this.validandoConfiguracionAprobacion = false;
        }
      });
    });
  }

  private ejecutarAprobacionPostulacion(currentUserId: number): void {
    this.configuracionAcademicaValida = true;
    this.mensajeBloqueoConfiguracionAprobacion = '';
    this.postulacionService.cambiarEstadoPostulacion(
      this.postulacionByDocumento!.items[0].idPostulacion!,
      EstadoPostulacion.APROBADO,
      'Postulación aprobada',
      currentUserId,
      this.selectedIdMallaParalelo || undefined
    ).subscribe({
      next: (response: any) => {
        this.aprobandoPostulacion = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Postulación aprobada y matrícula generada correctamente'
        });
        this.ocultarAccionesPostulacion = true;
        this.mostrarDialogAprobarPostulacion = false;
        this.router.navigate(['/dashboard/postulaciones/manage-postulations']);
        this.enviarEmailAprobacion();
      },
      error: (err) => {
        console.error('Error al aprobar postulación:', err);
        this.aprobandoPostulacion = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo aprobar la postulación'
        });
        this.mostrarDialogAprobarPostulacion = false;
      }
    });
  }

  private getEmailDestinatario(): string | null {
    const pcontacto = this.postulacionByDocumento?.items?.[0]?.personasimple?.pcontacto;
    if (!pcontacto) return null;
    if (Array.isArray(pcontacto)) {
      const emailContact = pcontacto.find((c: any) =>
        c &&
        c.tipocontacto?.detalle?.toUpperCase().includes('CORREO') &&
        c.detalle?.trim()
      );
      return emailContact?.detalle?.trim() ?? null;
    }
    return pcontacto.detalle?.includes('@') ? pcontacto.detalle : null;
  }

  public getNombreEstudiante(): string {
    const p = this.postulacionByDocumento?.items?.[0]?.personasimple;
    if (!p) return 'Estimado/a estudiante';
    return [p.primerNombre, p.segundoNombre, p.primerApellido, p.segundoApellido]
      .filter(name => name != null && name.trim() !== 'null' && name.trim() !== '')
      .join(' ');
  }

  private enviarEmailSilencioso(destinatario: string, asunto: string, cuerpo: string): void {
    this.emailService.sendEmail({ destinatario, asunto, cuerpo, esHtml: true }).subscribe({
      error: (err) => console.warn('No se pudo enviar el correo de notificación:', err)
    });
  }

  ngOnInit(): void {
    const documentoParam = this.route.snapshot.paramMap.get('id');

    if (documentoParam) {
      this.documento = documentoParam;
      this.loadPostulacionDetails();
    }
  }

  loadPostulacionDetails(): void {
    if (!this.documento) return;

    this.loading = true;
    this.loadPostulacionGeneral();
  }

  private loadPostulacionGeneral(): void {
    this.postulacionService.getPostulacionByDocumento(this.documento!).subscribe({
      next: (postulacion) => {
        this.postulacionByDocumento = postulacion;
        this.contactoResultadoTexto = postulacion.items?.[0]?.observacionesRevision ?? '';
        this.evaluarConfiguracionAprobacionVisual();
        this.loadDataPerson();
        this.loadRequisitos();
      },
      error: (err) => {
        console.error('Error al cargar postulación:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar la postulación'
        });
        this.loading = false;
      }
    });
  }

  loadRequisitos(): void {
    if (!this.postulacionByDocumento?.items[0]?.malla?.idMalla) {
      this.loading = false;
      return;
    }

    const idMalla = this.postulacionByDocumento.items[0].malla.idMalla;

    this.requisitosService.getRequisitosByMalla(idMalla).subscribe({
      next: (requisitos) => {
        this.requisitos = requisitos || [];
        if (this.documentosPersonales && this.documentosPersonales.length > 0) {
          this.sincronizarRequisitosConDocumentos();
        }
        this.loadDocumentosPersonalesByPersona();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar requisitos:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los requisitos'
        });
        this.loading = false;
      }
    });
  }

  loadDocumentosPersonalesByPersona(): void {
    const idPersona = this.persona?.idPersona ??
      (this.postulacionByDocumento?.items?.[0]?.personasimple as any)?.idPersona ??
      this.postulacionByDocumento?.items?.[0]?.idPersona;

    if (!idPersona) return;

    this.postulacionService.getDocumentosPersonalesByPersona(idPersona).subscribe({
      next: (documentos) => {
        let rawDocs: any[] = [];
        if (documentos && documentos.isSuccess === false) {
          rawDocs = [];
        } else if (documentos?.data !== undefined) {
          rawDocs = Array.isArray(documentos.data) ? documentos.data : (documentos.data ? Object.values(documentos.data) : []);
        } else if (Array.isArray(documentos)) {
          rawDocs = documentos;
        } else if (documentos && typeof documentos === 'object') {
          rawDocs = Object.values(documentos);
        }
        this.documentosPersonales = rawDocs;
        this.sincronizarRequisitosConDocumentos();
      },
      error: () => {
        this.documentosPersonales = [];
        this.sincronizarRequisitosConDocumentos();
      }
    });
  }

  private sincronizarRequisitosConDocumentos(): void {
    if (!this.requisitos || this.requisitos.length === 0) return;

    this.requisitos.forEach(requisito => {
      const reqIdStr = requisito.idRequisitos != null ? String(requisito.idRequisitos).trim() : '';
      const documentoExistente = this.documentosPersonales.find(
        doc => doc.codigoRequisito != null && String(doc.codigoRequisito).trim() === reqIdStr
      );
      requisito.completado = !!documentoExistente;
      requisito.documentoExistente = documentoExistente;
    });
  }

  loadDataPerson(): void {
    if (!this.documento) return;

    this.personaService.getPersonaByDocumento(this.documento).subscribe({
      next: (personas) => {
        if (personas && personas.length > 0) {
          this.persona = personas[0];
          this.loadDocumentosPersonalesByPersona();
        }
      },
      error: (err) => {
        console.error('Error al cargar datos de persona:', err);
      }
    });
  }

  volver(): void {
    this.router.navigate(['/dashboard/postulaciones/manage-postulations']);
  }

  // ── Auto-transiciones de estado de postulación ──────────────────────────

  private getPostulacionId(): number | null {
    return this.postulacionByDocumento?.items?.[0]?.idPostulacion ?? null;
  }

  private getEstadoActual(): string {
    return (this.postulacionByDocumento?.items?.[0]?.tipoestadoaprobacion?.detalle || '').toUpperCase().trim();
  }

  private esEstadoFinal(): boolean {
    const estado = this.getEstadoActual();
    return estado === 'APROBADO' || estado === 'RECHAZADO' || estado === 'FINALIZADO';
  }

  private getCurrentUser(): { id: number } | null {
    return this.authService.getCurrentUser();
  }

  private actualizarEstadoLocal(nuevoEstado: string): void {
    if (this.postulacionByDocumento?.items?.[0]?.tipoestadoaprobacion) {
      this.postulacionByDocumento.items[0].tipoestadoaprobacion.detalle = nuevoEstado;
    }
  }

  /** Al subir un documento: si está en ESPERA_DOCUMENTOS → DOCUMENTOS_REVISION */
  private transicionADocumentosRevision(): void {
    const idPostulacion = this.getPostulacionId();
    const currentUser = this.getCurrentUser();
    if (!idPostulacion || !currentUser) return;
    if (this.esEstadoFinal()) return;
    if (this.getEstadoActual() !== 'ESPERA DOCUMENTOS' && this.getEstadoActual() !== 'CONTACTO PERSONA') return;

    this.postulacionService.cambiarEstadoPostulacion(
      idPostulacion,
      EstadoPostulacion.DOCUMENTOS_REVISION,
      'Documentos subidos, pendientes de revisión',
      currentUser.id
    ).subscribe({
      next: () => this.actualizarEstadoLocal('DOCUMENTOS REVISION'),
      error: () => { }
    });
  }

  /** Al aprobar un documento: si todos los obligatorios están OK → ESPERA_APROBACION */
  private evaluarTransicionPostAprobacionDocumento(): void {
    const idPostulacion = this.getPostulacionId();
    const currentUser = this.getCurrentUser();
    if (!idPostulacion || !currentUser) return;
    if (this.esEstadoFinal()) return;
    if (!this.adjuntosObligatoriosAprobados) return;

    this.postulacionService.cambiarEstadoPostulacion(
      idPostulacion,
      EstadoPostulacion.ESPERA_APROBACION,
      'Todos los documentos obligatorios aprobados',
      currentUser.id
    ).subscribe({
      next: () => this.actualizarEstadoLocal('ESPERA APROBACIÓN'),
      error: () => { }
    });
  }

  /** Al rechazar un documento: si está en DOCUMENTOS_REVISION → ESPERA_DOCUMENTOS */
  private transicionAEstadoEsperaDocumentos(): void {
    const idPostulacion = this.getPostulacionId();
    const currentUser = this.getCurrentUser();
    if (!idPostulacion || !currentUser) return;
    if (this.esEstadoFinal()) return;
    if (this.getEstadoActual() !== 'DOCUMENTOS REVISION') return;

    this.postulacionService.cambiarEstadoPostulacion(
      idPostulacion,
      EstadoPostulacion.ESPERA_DOCUMENTOS,
      'Documento rechazado, se requieren correcciones',
      currentUser.id
    ).subscribe({
      next: () => this.actualizarEstadoLocal('ESPERA DOCUMENTOS'),
      error: () => { }
    });
  }

  // ── Contacto ──────────────────────────────────────────────────────────────
  abrirDialogContacto(): void {
    const idPostulacion = this.postulacionByDocumento?.items?.[0]?.idPostulacion;
    if (!idPostulacion) return;

    const nombre = this.getNombreEstudiante();
    const fecha = new Date().toLocaleDateString('es-EC');
    const obsActual = this.postulacionByDocumento!.items[0].observacionesRevision;
    if (obsActual && obsActual !== 'No se ha contactado con el alumno') {
      this.contactoResultadoTexto = obsActual;
    } else {
      this.contactoResultadoTexto = `Se contactó con ${nombre} a la fecha ${fecha} y se le dio toda la información. Queda a la espera de completar sus datos.`;
    }

    this.mostrarDialogContacto = true;
  }

  abrirCompletarRegistro(): void {
    const idPostulacion = this.postulacionByDocumento?.items?.[0]?.idPostulacion;
    const documento = this.postulacionByDocumento?.items?.[0]?.personasimple?.documento;
    if (!idPostulacion || !documento) return;

    this.personaService.getPersonaByDocumento(documento).subscribe({
      next: (personas) => {
        const persona = Array.isArray(personas) ? personas[0] : personas;
        if (persona?.idPersona) {
          this.contactoIdPersona = persona.idPersona;
          this.contactoIdPostulacion = idPostulacion;
          this.mostrarDrawerContactoManual = true;
        }
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron recuperar los datos de la persona'
        });
      }
    });
  }

  onContactoManualCompleted(): void {
    this.mostrarDrawerContactoManual = false;
    this.contactoIdPersona = null;
    this.contactoIdPostulacion = null;
    this.loadPostulacionGeneral();
  }

  abrirEdicionPostulante(): void {
    const p = this.postulacionByDocumento?.items?.[0]?.personasimple;
    if (!p) return;

    this.formEdicionBasica = {
      primerNombre: p.primerNombre || '',
      segundoNombre: p.segundoNombre || '',
      primerApellido: p.primerApellido || '',
      segundoApellido: p.segundoApellido || '',
      documento: p.documento || '',
      fechaNacimiento: p.pinfo?.fechaNacimiento ? p.pinfo.fechaNacimiento.substring(0, 10) : '',
      idGenero: null
    };
    this.mostrarModalEdicionBasica = true;
  }

  cancelarEdicionBasica(): void {
    this.mostrarModalEdicionBasica = false;
  }

  guardarEdicionBasica(): void {
    const idPostulacion = this.getPostulacionId();
    if (!idPostulacion) return;

    if (!this.formEdicionBasica.primerNombre?.trim() || !this.formEdicionBasica.primerApellido?.trim() || !this.formEdicionBasica.documento?.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campos requeridos',
        detail: 'El primer nombre, primer apellido y documento son obligatorios.'
      });
      return;
    }

    this.guardandoEdicionBasica = true;
    this.postulacionService.actualizarDatosBasicosPostulante(idPostulacion, {
      primerNombre: this.formEdicionBasica.primerNombre.trim(),
      segundoNombre: this.formEdicionBasica.segundoNombre?.trim() || undefined,
      primerApellido: this.formEdicionBasica.primerApellido.trim(),
      segundoApellido: this.formEdicionBasica.segundoApellido?.trim() || undefined,
      documento: this.formEdicionBasica.documento.trim(),
      fechaNacimiento: this.formEdicionBasica.fechaNacimiento || undefined,
      idGenero: this.formEdicionBasica.idGenero || undefined
    }).subscribe({
      next: () => {
        this.guardandoEdicionBasica = false;
        this.mostrarModalEdicionBasica = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Datos del postulante actualizados correctamente'
        });

        // Actualizar datos locales
        const p = this.postulacionByDocumento?.items?.[0]?.personasimple;
        if (p) {
          p.primerNombre = this.formEdicionBasica.primerNombre.trim();
          p.segundoNombre = this.formEdicionBasica.segundoNombre?.trim() || '';
          p.primerApellido = this.formEdicionBasica.primerApellido.trim();
          p.segundoApellido = this.formEdicionBasica.segundoApellido?.trim() || '';
          if (!p.pinfo) p.pinfo = {} as any;
          if (p.pinfo) {
            p.pinfo.fechaNacimiento = this.formEdicionBasica.fechaNacimiento;
          }
        }
      },
      error: (err: any) => {
        this.guardandoEdicionBasica = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.message || 'No se pudieron actualizar los datos del postulante'
        });
      }
    });
  }

  abrirDialogEliminarPostulacion(): void {
    this.mostrarDialogEliminarPostulacion = true;
  }

  cancelarDialogEliminarPostulacion(): void {
    this.mostrarDialogEliminarPostulacion = false;
  }

  confirmarEliminarPostulacion(): void {
    const idPostulacion = this.getPostulacionId();
    if (!idPostulacion) return;

    this.eliminandoPostulacion = true;
    this.postulacionService.eliminarPostulacion(idPostulacion).subscribe({
      next: () => {
        this.eliminandoPostulacion = false;
        this.mostrarDialogEliminarPostulacion = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Postulante eliminado',
          detail: 'La postulación y toda la información asociada han sido eliminadas correctamente'
        });
        setTimeout(() => {
          this.router.navigate(['/dashboard/postulaciones/manage-postulations']);
        }, 1000);
      },
      error: (err) => {
        this.eliminandoPostulacion = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.message || 'No se pudo eliminar la postulación'
        });
      }
    });
  }

  confirmarContacto(): void {
    if (!this.postulacionByDocumento) return;
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    const textoContacto = this.contactoResultadoTexto?.trim() || 'Se contactó al postulante.';

    this.postulacionService.cambiarEstadoPostulacion(
      this.postulacionByDocumento.items[0].idPostulacion!,
      EstadoPostulacion.CONTACTO_PERSONA,
      textoContacto,
      currentUser.id
    ).subscribe({
      next: () => {
        this.actualizarEstadoLocal('CONTACTO PERSONA');
        if (this.postulacionByDocumento?.items?.[0]) {
          this.postulacionByDocumento.items[0].observacionesRevision = textoContacto;
        }
        this.mostrarDialogContacto = false;
        this.messageService.add({
          severity: 'success', summary: 'Contacto registrado',
          detail: 'Se registró el contacto y las observaciones correctamente.'
        });
        this.loadPostulacionGeneral();
      },
      error: () => {
        this.messageService.add({
          severity: 'error', summary: 'Error',
          detail: 'No se pudo registrar el contacto'
        });
        this.mostrarDialogContacto = false;
      }
    });
  }

  cancelarDialogContacto(): void {
    this.mostrarDialogContacto = false;
  }

  getCuposDisponibles(mallaParalelo: MallaParaleloDTO): number {
    const cupoMaximo = mallaParalelo.cupoMaximo ?? 0;
    const matriculados = mallaParalelo.alumnosMatriculados ?? 0;
    return Math.max(0, cupoMaximo - matriculados);
  }

  recargarParalelos(): void {
    const idMalla = this.postulacionByDocumento?.items[0]?.malla?.idMalla;
    if (idMalla) {
      this.loadingParalelos = true;
      this.mallaParaleloService.getByMalla(idMalla).subscribe({
        next: (data) => {
          this.mallaParalelos = data.filter(mp => mp.esActivo);
          const primerParaleloConCupo = this.mallaParalelos.find(mp => this.getCuposDisponibles(mp) > 0);
          this.selectedIdMallaParalelo = primerParaleloConCupo?.idMallaParalelo ?? null;
          this.loadingParalelos = false;
        },
        error: () => {
          this.loadingParalelos = false;
        }
      });
    }
  }

  abrirConfiguracionCursos(): void {
    window.open('/#/dashboard/configurar-cursos-postulacion', '_blank');
  }

  aprobarPostulacion(): void {
    this.selectedIdMallaParalelo = null;
    this.mallaParalelos = [];
    this.recargarParalelos();
    this.mostrarDialogAprobarPostulacion = true;
  }

  confirmarAprobarPostulacion(): void {
    if (!this.postulacionByDocumento) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No hay postulación seleccionada'
      });
      this.mostrarDialogAprobarPostulacion = false;
      return;
    }
    if (!this.selectedIdMallaParalelo) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atención',
        detail: 'Debe seleccionar un paralelo para matricular al estudiante'
      });
      return;
    }
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Usuario no autenticado'
      });
      this.mostrarDialogAprobarPostulacion = false;
      return;
    }

    this.aprobandoPostulacion = true;
    this.validarConfiguracionPreviaAprobacion(() => {
      this.ejecutarAprobacionPostulacion(currentUser.id);
    });
  }

  private enviarEmailAprobacion(): void {
    const emailDest = this.getEmailDestinatario();
    if (emailDest) {
      const nombre = this.getNombreEstudiante();
      const cedula = this.postulacionByDocumento?.items?.[0]?.personasimple?.documento || '';
      const malla = this.postulacionByDocumento?.items?.[0]?.malla?.detalle || '';
      const ciclo = this.postulacionByDocumento?.items?.[0]?.malla?.mallaCiclo?.ciclo?.detalle || '';
      const emailData: EmailTemplateData = { nombreEstudiante: nombre, cedula, malla, ciclo };
      const template = this.emailTemplatesService.getPostulacionAprobadaTemplate(emailData);
      this.enviarEmailSilencioso(emailDest, template.subject, template.body);
    }
  }

  cancelarDialogAprobarPostulacion(): void {
    this.mostrarDialogAprobarPostulacion = false;
    this.selectedIdMallaParalelo = null;
    this.mallaParalelos = [];
  }

  abrirDetallesTrasAprobacion(idMatricula: number): void {
    this.loadingDetalles = true;
    this.mostrarDialogVerDetalles = true;

    const p = this.postulacionByDocumento?.items[0];
    const pagoBase: PagoEstudiante = {
      idMatricula,
      cedula: p?.personasimple?.documento || '',
      nombreEstudiante: [
        p?.personasimple?.primerNombre,
        p?.personasimple?.segundoNombre,
        p?.personasimple?.primerApellido,
        p?.personasimple?.segundoApellido
      ].filter(Boolean).join(' '),
      modalidad: p?.malla?.detalle || '',
      detalleCiclo: p?.malla?.mallaCiclo?.ciclo?.detalle || '',
      totalDeuda: 0,
      totalPagado: 0,
      especies: []
    };

    this.creditoService.getCreditosConDetallesByMatricula(idMatricula).subscribe({
      next: (creditos: CreditoConDetallesDTO[]) => {
        const especies: Especie[] = creditos.map((credito: CreditoConDetallesDTO) => {
          const detalleEspecie = credito.detalleEspecie || 'Especie';
          const esPension = detalleEspecie.toUpperCase().includes('PENSION') ||
            detalleEspecie.toUpperCase().includes('PENSIÓN');
          const montoOriginal = credito.montoOriginal ?? credito.montoFinal ?? 0;
          const montoFinal = credito.montoFinal ?? 0;
          const montoBeneficio = credito.montoBeneficio ?? 0;
          const esPendienteDiferir = credito.estado === 'PENDIENTE_DIFERIR';

          let valorPagado = 0;
          if (!esPendienteDiferir && credito.detallesCredito && credito.detallesCredito.length > 0) {
            valorPagado = credito.detallesCredito.reduce((s, d) => {
              if (d.estado?.toUpperCase() === 'PENDIENTE_APROBACION') {
                return s + (d.valorOriginal ?? 0);
              }
              return s + ((d.valorOriginal ?? 0) - (d.saldoCuota ?? 0));
            }, 0);
          }

          const primeraFecha = credito.detallesCredito?.[0]?.fechaLimite ?? null;

          const todasCuotasLiquidadas = !esPendienteDiferir &&
            (credito.detallesCredito?.length ?? 0) > 0 &&
            (credito.detallesCredito ?? []).every(
              d => d.pagado === true || d.estado?.toUpperCase() === 'PENDIENTE_APROBACION'
            );

          return {
            idEspecie: credito.idCredito ?? 0,
            idCredito: credito.idCredito ?? 0,
            nombre: detalleEspecie,
            tipo: (esPension ? 'pension' : 'matricula') as 'matricula' | 'pension',
            estado: credito.estado ?? 'ACTIVO',
            ciclo: pagoBase.detalleCiclo || 'Sin ciclo',
            valor: montoOriginal,
            montoFinal: montoFinal,
            montoBeneficio: montoBeneficio,
            valorPagado: valorPagado,
            pagado: todasCuotasLiquidadas,
            fechaLimite: primeraFecha ?? (esPendienteDiferir ? 'Por definir al diferir' : 'Sin fecha'),
            detallesCredito: (credito.detallesCredito ?? []).map(d => ({
              idDetalleCredito: d.idDetalleCredito ?? 0,
              numeroCuota: d.numeroCuota ?? 0,
              valorOriginal: d.valorOriginal ?? 0,
              saldoCuota: d.saldoCuota ?? 0,
              fechaLimite: d.fechaLimite ?? null,
              estado: d.estado ?? 'PENDIENTE',
              pagado: d.pagado ?? false
            })),
            esPensionNoDiferida: esPendienteDiferir
          } as Especie;
        });

        const totalDeuda = creditos.reduce((s, c) => s + (c.montoOriginal ?? c.montoFinal ?? 0), 0);

        let totalPagado = 0;
        let tienePagosEnRevision = false;
        creditos.forEach(c => {
          if (c.estado === 'PENDIENTE_DIFERIR' || !c.detallesCredito || c.detallesCredito.length === 0) return;
          c.detallesCredito.forEach(d => {
            if (d.estado?.toUpperCase() === 'PENDIENTE_APROBACION') {
              totalPagado += (d.valorOriginal ?? 0);
              tienePagosEnRevision = true;
            } else {
              totalPagado += (d.valorOriginal ?? 0) - (d.saldoCuota ?? 0);
            }
          });
        });

        this.estudianteDetalles = { ...pagoBase, totalDeuda, totalPagado, tienePagosEnRevision, especies };
        this.loadingDetalles = false;
      },
      error: () => {
        this.estudianteDetalles = pagoBase;
        this.loadingDetalles = false;
      }
    });
  }

  rechazarPostulacion(): void {
    this.motivoRechazoPostulacion = '';
    this.mostrarDialogRechazarPostulacion = true;
  }

  confirmarRechazarPostulacion(): void {
    if (!this.postulacionByDocumento) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No hay postulación seleccionada'
      });
      this.mostrarDialogRechazarPostulacion = false;
      return;
    }
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Usuario no autenticado'
      });
      this.mostrarDialogRechazarPostulacion = false;
      return;
    }
    const razonRechazo = this.motivoRechazoPostulacion?.trim() || 'Postulación rechazada';
    this.postulacionService.cambiarEstadoPostulacion(
      this.postulacionByDocumento.items[0].idPostulacion!,
      EstadoPostulacion.RECHAZADO,
      razonRechazo,
      currentUser.id
    ).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Postulación rechazada correctamente'
        });
        this.ocultarAccionesPostulacion = true;
        const emailDest = this.getEmailDestinatario();
        if (emailDest) {
          const nombre = this.getNombreEstudiante();
          const cedula = this.postulacionByDocumento?.items?.[0]?.personasimple?.documento || '';
          const malla = this.postulacionByDocumento?.items?.[0]?.malla?.detalle || '';
          const ciclo = this.postulacionByDocumento?.items?.[0]?.malla?.mallaCiclo?.ciclo?.detalle || '';

          const emailData: EmailTemplateData = {
            nombreEstudiante: nombre,
            cedula: cedula,
            malla: malla,
            ciclo: ciclo,
            motivoRechazo: this.motivoRechazoPostulacion?.trim() || undefined
          };

          const template = this.emailTemplatesService.getPostulacionRechazadaTemplate(emailData);
          this.enviarEmailSilencioso(emailDest, template.subject, template.body);
        }
        this.motivoRechazoPostulacion = '';
        setTimeout(() => {
          this.volver();
        }, 2000);
        this.mostrarDialogRechazarPostulacion = false;
      },
      error: (err) => {
        console.error('Error al rechazar postulación:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo rechazar la postulación'
        });
        this.mostrarDialogRechazarPostulacion = false;
      }
    });
  }

  cancelarDialogRechazarPostulacion(): void {
    this.mostrarDialogRechazarPostulacion = false;
    this.motivoRechazoPostulacion = '';
  }

  onCerrarDetallesPago(): void {
    this.mostrarDialogVerDetalles = false;
    this.ocultarAccionesPostulacion = true;
    this.router.navigate(['/dashboard/postulaciones/manage-postulations']);
  }

  mostrarDrawerPreviewMobile = false;

  // Manejadores de eventos de subcomponentes modulares
  onViewDocument(event: { url: string, fileName: string, fileType: string }): void {
    if (this.previewUrl && this.previewUrl.startsWith('blob:') && this.previewUrl !== event.url) {
      URL.revokeObjectURL(this.previewUrl);
    }
    this.previewUrl = event.url;
    this.previewFileName = event.fileName;
    this.previewFileType = event.fileType;

    if (window.innerWidth <= 1024) {
      this.mostrarDrawerPreviewMobile = true;
    }
  }

  onRequirementsChanged(event: { type: 'upload' | 'approve' | 'reject' | 'delete' | 'bool' }): void {
    // Recargar documentos para sincronizar
    this.loadDocumentosPersonalesByPersona();

    // Transiciones automáticas de estado
    if (event.type === 'upload') {
      this.transicionADocumentosRevision();
    } else if (event.type === 'approve') {
      this.evaluarTransitionDespuesDeAprobacion();
    } else if (event.type === 'reject') {
      this.transicionAEstadoEsperaDocumentos();
    }
  }

  private evaluarTransitionDespuesDeAprobacion(): void {
    // Esperar a que se actualicen localmente los requisitos y documentos cargados por loadDocumentosPersonalesByPersona
    setTimeout(() => {
      this.evaluarTransicionPostAprobacionDocumento();
    }, 300);
  }

  ngOnDestroy(): void {
    if (this.previewUrl && this.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(this.previewUrl);
    }
  }
}
