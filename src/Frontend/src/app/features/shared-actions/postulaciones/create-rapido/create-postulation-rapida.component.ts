import { Component, OnInit, inject, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Subject, Subscription, debounceTime } from 'rxjs';
import {
  validarCedulaEcuatoriana,
  validarRucEcuatoriano,
  validarPasaporteEcuatoriano,
  getDocumentoPlaceholder,
  getDocumentoMaxLength
} from '../../../../core/validators/documento-ecuatoriano.validator';
import { TipoDocumentoDTO, TipoDatoContactoDTO, PersonaPostulacionDTO, DatosContactoPostulacionDTO } from '../../../../data/models/Entities';
import {
  TipoDocumentoService,
  TipoDatoContactoService,
  PostulacionService,
  EmailVerificationService
} from '../../../../core/services/postulaciones';
import { EmailVerificationModalComponent } from '../../../../shared/email-verification-modal/email-verification-modal.component';
import { SharedToastComponent } from '../../../../shared/shared-toast/shared-toast.component';
import { SharedDrawerComponent } from '../../../../shared/shared-drawer/shared-drawer.component';
import { ToastService } from '../../../../shared/toast.service';

const LOCAL_STORAGE_KEY = 'draft_postulacion_rapida';

@Component({
  selector: 'app-create-postulation-rapida',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    EmailVerificationModalComponent,
    SharedToastComponent,
    SharedDrawerComponent
  ],
  templateUrl: './create-postulation-rapida.component.html',
  styleUrls: ['./create-postulation-rapida.component.css']
})
export class CreatePostulationRapidaComponent implements OnInit, OnDestroy {
  @Input() visible: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() close = new EventEmitter<void>();
  @Output() postulacionCompleted = new EventEmitter<{ success: boolean; message: string }>();

  postulacionForm!: FormGroup;
  tiposDocumento: TipoDocumentoDTO[] = [];
  tiposDatoContactoObligatorios: TipoDatoContactoDTO[] = [];

  isSubmitting = false;
  isVerifyingEmail = false;

  // Verificación de email
  showVerificationModal = false;
  emailToVerify = '';
  private emailVerificationSubject = new Subject<string>();
  private emailVerificationSubscription?: Subscription;
  private formValueSubscription?: Subscription;

  private fb = inject(FormBuilder);
  private tipoDocumentoService = inject(TipoDocumentoService);
  private tipoDatoContactoService = inject(TipoDatoContactoService);
  private postulacionService = inject(PostulacionService);
  private emailVerificationService = inject(EmailVerificationService);
  public toastService = inject(ToastService);

  ngOnInit(): void {
    this.initForm();
    this.loadCatalogos();
    this.setupEmailVerification();
  }

  ngOnDestroy(): void {
    this.emailVerificationSubscription?.unsubscribe();
    this.formValueSubscription?.unsubscribe();
  }

  private initForm(): void {
    this.postulacionForm = this.fb.group({
      idTipoDocumento: [null, [Validators.required]],
      documento: ['', [Validators.required]],
      primerNombre: ['', [Validators.required, Validators.maxLength(45)]],
      segundoNombre: ['', [Validators.maxLength(45)]],
      primerApellido: ['', [Validators.required, Validators.maxLength(45)]],
      segundoApellido: ['', [Validators.maxLength(45)]],
      fechaNacimiento: ['', [Validators.required]],
      observacionesPostulante: ['', [Validators.maxLength(500)]],
      website: [''] // Honeypot trap field (debe permanecer vacío)
    });

    this.postulacionForm.get('idTipoDocumento')?.valueChanges.subscribe(tipoDocId => {
      const docControl = this.postulacionForm.get('documento');
      if (docControl) {
        docControl.setValidators(this.getDocumentoValidators(tipoDocId));
        docControl.updateValueAndValidity();
      }
    });

    this.postulacionForm.get('documento')?.valueChanges.subscribe(val => {
      if (val) {
        const clean = val.replace(/[^0-9]/g, '');
        if (clean !== val) {
          this.postulacionForm.get('documento')?.setValue(clean, { emitEvent: false });
        }
      }
      this.validarUnicidadDocumento();
    });

    const nameFields = ['primerNombre', 'segundoNombre', 'primerApellido', 'segundoApellido'];
    nameFields.forEach(field => {
      this.postulacionForm.get(field)?.valueChanges.subscribe(val => {
        if (val) {
          const clean = val.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '');
          const upper = clean.toUpperCase();
          if (upper !== val) {
            this.postulacionForm.get(field)?.setValue(upper, { emitEvent: false });
          }
        }
      });
    });

    this.formValueSubscription = this.postulacionForm.valueChanges.subscribe(() => {
      this.saveDraftToLocalStorage();
    });
  }

  private getDocumentoValidators(tipoDocId: number | null): any[] {
    const validators = [Validators.required];
    if (!tipoDocId) return validators;

    const tipoDoc = this.tiposDocumento.find(t => t.idTipoDocumento === tipoDocId);
    if (!tipoDoc) return validators;

    const nombreDoc = (tipoDoc.nombre || '').toLowerCase();
    if (nombreDoc.includes('cédula') || nombreDoc.includes('cedula')) {
      validators.push(this.cedulaEcuatorianaValidator);
    } else if (nombreDoc.includes('ruc')) {
      validators.push(this.rucEcuatorianoValidator);
    } else if (nombreDoc.includes('pasaporte')) {
      validators.push(this.pasaporteEcuatorianoValidator);
    }
    return validators;
  }

  private cedulaEcuatorianaValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    return validarCedulaEcuatoriana(control.value) ? null : { cedulaInvalida: true };
  }

  private rucEcuatorianoValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    return validarRucEcuatoriano(control.value) ? null : { rucInvalido: true };
  }

  private pasaporteEcuatorianoValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    return validarPasaporteEcuatoriano(control.value) ? null : { pasaporteInvalido: true };
  }

  private loadCatalogos(): void {
    this.tipoDocumentoService.getTiposDocumento().subscribe({
      next: (res: any) => {
        const list = Array.isArray(res) ? res : (res?.data || []);
        this.tiposDocumento = list;
        const cedulaType = this.tiposDocumento.find(t => (t.nombre || '').toLowerCase().includes('cédula') || (t.nombre || '').toLowerCase().includes('cedula'));
        if (cedulaType && cedulaType.idTipoDocumento && !this.postulacionForm.get('idTipoDocumento')?.value) {
          this.postulacionForm.get('idTipoDocumento')?.setValue(cedulaType.idTipoDocumento, { emitEvent: false });
        }
      }
    });

    this.tipoDatoContactoService.getTiposDatoContactoObligatorios().subscribe({
      next: (res: any) => {
        const list = Array.isArray(res) ? res : (res?.data || []);
        this.tiposDatoContactoObligatorios = list;
        this.buildContactFormControls();
        // Cargar borrador una vez construidos los controles de contacto
        this.loadDraftFromLocalStorage();
      }
    });
  }

  private buildContactFormControls(): void {
    this.tiposDatoContactoObligatorios.forEach(tipo => {
      const fieldName = this.getContactControlName(tipo.idTipoDatoContacto);
      if (!this.postulacionForm.contains(fieldName)) {
        const validators = [Validators.required];
        const detalleUpper = (tipo.detalle || '').toUpperCase();
        const isPhone = detalleUpper.includes('CELULAR') || detalleUpper.includes('TELÉFONO') || detalleUpper.includes('TELEFONO');
        if (detalleUpper.includes('CORREO') || detalleUpper.includes('EMAIL')) {
          validators.push(Validators.email);
        } else if (isPhone) {
          validators.push(Validators.pattern(/^[0-9]{9,10}$/));
        }
        this.postulacionForm.addControl(fieldName, this.fb.control('', validators));

        if (detalleUpper.includes('CORREO') || detalleUpper.includes('EMAIL')) {
          this.postulacionForm.get(fieldName)?.valueChanges.subscribe(val => {
            if (val && this.postulacionForm.get(fieldName)?.valid) {
              this.emailVerificationSubject.next(val);
            }
          });
        } else if (isPhone) {
          this.postulacionForm.get(fieldName)?.valueChanges.subscribe(val => {
            if (val) {
              const clean = val.replace(/[^0-9]/g, '');
              if (clean !== val) {
                this.postulacionForm.get(fieldName)?.setValue(clean, { emitEvent: false });
              }
            }
          });
        }
      }
    });
  }

  getContactControlName(idTipoDatoContacto?: number): string {
    return `contacto_${idTipoDatoContacto}`;
  }

  private setupEmailVerification(): void {
    this.emailVerificationSubscription = this.emailVerificationSubject
      .pipe(debounceTime(700))
      .subscribe(email => {
        this.checkEmailAvailability(email);
      });
  }

  private checkEmailAvailability(email: string): void {
    // Si no hay método de validación previa en el servicio, omitimos o llamamos a un check simple
  }

  private getEmailControlName(): string | null {
    const emailTipo = this.tiposDatoContactoObligatorios.find(t => (t.detalle || '').toUpperCase().includes('CORREO') || (t.detalle || '').toUpperCase().includes('EMAIL'));
    return emailTipo ? this.getContactControlName(emailTipo.idTipoDatoContacto) : null;
  }

  private validarUnicidadDocumento(): void {
    // Se valida en backend al momento de enviar
  }

  onSubmit(): void {
    if (this.postulacionForm.invalid) {
      this.postulacionForm.markAllAsTouched();
      this.toastService.showError('Por favor complete correctamente los datos requeridos');
      return;
    }

    // Validación Honeypot (Anti-Bots)
    const honeypotVal = this.postulacionForm.get('website')?.value;
    if (honeypotVal && honeypotVal.trim() !== '') {
      // Es un bot automatizado: simular respuesta exitosa sin guardar nada en BD
      this.isSubmitting = true;
      setTimeout(() => {
        this.isSubmitting = false;
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        this.postulacionForm.reset();
        this.toastService.showSuccess('¡Tu postulación ha sido enviada exitosamente! Nos contactaremos contigo a la brevedad.');
        this.postulacionCompleted.emit({ success: true, message: 'Postulación procesada.' });
        this.closeDrawer();
      }, 500);
      return;
    }

    // Bypass temporal de verificación OTP: Enviar directamente
    this.enviarPostulacionFinal();
  }

  private solicitarVerificacionEmail(email: string): void {
    const primerNombre = this.postulacionForm.get('primerNombre')?.value || 'Postulante';
    this.isVerifyingEmail = true;
    this.emailVerificationService.sendOtp({
      email: email,
      nombrePostulante: primerNombre
    }).subscribe({
      next: (res: any) => {
        this.isVerifyingEmail = false;
        this.showVerificationModal = true;
      },
      error: (err: any) => {
        this.isVerifyingEmail = false;
        this.toastService.showError(err?.error?.message || 'Error al solicitar el código de verificación.');
      }
    });
  }

  onEmailVerified(): void {
    this.showVerificationModal = false;
    this.enviarPostulacionFinal();
  }

  private sanitizeInput(value: string | null | undefined): string | null {
    if (!value) return null;
    let cleaned = value.toString().trim();
    // Eliminar etiquetas HTML / scripts (<script>, <iframe>, eventos inline)
    cleaned = cleaned.replace(/<[^>]*>?/gm, '');
    // Eliminar caracteres de control no imprimibles
    cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    return cleaned || null;
  }

  private enviarPostulacionFinal(): void {
    this.isSubmitting = true;
    const formVal = this.postulacionForm.value;

    const contactos: DatosContactoPostulacionDTO[] = this.tiposDatoContactoObligatorios.map(tipo => ({
      IdTipoDatoContacto: tipo.idTipoDatoContacto,
      Detalle: this.sanitizeInput(formVal[this.getContactControlName(tipo.idTipoDatoContacto)]) || '',
      EsPrincipal: true
    }));

    const personaPostulacion: PersonaPostulacionDTO = {
      IdTipoDocumento: formVal.idTipoDocumento,
      Documento: this.sanitizeInput(formVal.documento) || '',
      PrimerNombre: this.sanitizeInput(formVal.primerNombre)?.toUpperCase() || '',
      SegundoNombre: this.sanitizeInput(formVal.segundoNombre)?.toUpperCase() ?? undefined,
      PrimerApellido: this.sanitizeInput(formVal.primerApellido)?.toUpperCase() || '',
      SegundoApellido: this.sanitizeInput(formVal.segundoApellido)?.toUpperCase() ?? undefined,
      FechaNacimiento: formVal.fechaNacimiento || null,
      IdGenero: null,
      IdProvincia: null,
      IdMalla: null,
      EsPostulacionRapida: true,
      ObservacionesPostulante: this.sanitizeInput(formVal.observacionesPostulante) || 'Postulación rápida enviada desde la web.',
      DatosContactos: contactos
    };

    this.postulacionService.crearPostulacionExterna(personaPostulacion).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        if (res && res.isSuccess === false) {
          const errorMsg = res.message || 'No se pudo enviar la postulación. Verifique los datos e intente nuevamente.';
          this.toastService.showError(errorMsg);
          this.postulacionCompleted.emit({ success: false, message: errorMsg });
          return;
        }
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        this.postulacionForm.reset();
        this.toastService.showSuccess('¡Tu postulación ha sido enviada exitosamente! Nos contactaremos contigo a la brevedad.');
        this.postulacionCompleted.emit({ success: true, message: res?.message || 'Postulación rápida exitosa' });
        this.closeDrawer();
      },
      error: (err: any) => {
        this.isSubmitting = false;
        const errorMsg = err?.error?.message || err?.message || 'Error en el servidor al enviar la postulación rápida.';
        this.toastService.showError(errorMsg);
        this.postulacionCompleted.emit({ success: false, message: errorMsg });
      }
    });
  }

  closeDrawer(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.close.emit();
  }

  onlyNumbers(event: KeyboardEvent): boolean {
    const charCode = event.key;
    return /^[0-9]$/.test(charCode);
  }

  onlyLetters(event: KeyboardEvent): boolean {
    const charCode = event.key;
    return /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]$/.test(charCode);
  }

  onContactKeypress(event: KeyboardEvent, detalle?: string): boolean {
    const d = (detalle || '').toUpperCase();
    if (d.includes('CELULAR') || d.includes('TELÉFONO') || d.includes('TELEFONO')) {
      return this.onlyNumbers(event);
    }
    return true;
  }

  limpiarFormulario(): void {
    this.postulacionForm.reset({
      idTipoDocumento: this.tiposDocumento.length > 0 ? this.tiposDocumento[0].idTipoDocumento : null,
      documento: '',
      primerNombre: '',
      segundoNombre: '',
      primerApellido: '',
      segundoApellido: '',
      fechaNacimiento: '',
      observacionesPostulante: ''
    });
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    this.toastService.showSuccess('Formulario limpiado correctamente.');
  }

  private saveDraftToLocalStorage(): void {
    if (this.postulacionForm) {
      const value = this.postulacionForm.value;
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(value));
    }
  }

  private loadDraftFromLocalStorage(): void {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.postulacionForm.patchValue(parsed, { emitEvent: false });
      } catch (e) {
        console.error('Error al cargar borrador de postulación rápida:', e);
      }
    }
  }

  getDocumentoPlaceholder(): string {
    const tipoDocId = this.postulacionForm.get('idTipoDocumento')?.value;
    const tipoDoc = this.tiposDocumento.find(t => t.idTipoDocumento === tipoDocId);
    return getDocumentoPlaceholder(tipoDoc?.nombre || null);
  }

  getDocumentoMaxLength(): number {
    const tipoDocId = this.postulacionForm.get('idTipoDocumento')?.value;
    const tipoDoc = this.tiposDocumento.find(t => t.idTipoDocumento === tipoDocId);
    return getDocumentoMaxLength(tipoDoc?.nombre || null);
  }

  getContactIcon(detalle?: string): string {
    const d = (detalle || '').toUpperCase();
    if (d.includes('CORREO') || d.includes('EMAIL')) return 'pi pi-envelope';
    if (d.includes('CELULAR') || d.includes('TELÉFONO') || d.includes('TELEFONO')) return 'pi pi-mobile';
    return 'pi pi-phone';
  }
}
