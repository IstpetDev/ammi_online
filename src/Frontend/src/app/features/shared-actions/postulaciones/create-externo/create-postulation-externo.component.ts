import { Component, OnInit, inject, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, Subscription, debounceTime } from 'rxjs';
import {
  validarCedulaEcuatoriana,
  validarRucEcuatoriano,
  validarPasaporteEcuatoriano,
  getDocumentoPlaceholder,
  getDocumentoMaxLength,
  getDocumentoErrorMessage
} from '../../../../core/validators/documento-ecuatoriano.validator';
import { TipoDocumentoDTO, GeneroDTO, EstadoCivilDTO, EtniaDTO, NacionalidadEtnicaDTO, PaisDTO, ProvinciaDTO, CantonDTO, ParroquiaDTO, CicloDTO, CursoDTO, MallaDTO, TipoDatoContactoDTO, TipoOfertaDTO, PersonaPostulacionDTO, DatosContactoPostulacionDTO, CrearPostulacionRequestDTO, RequisitosDTO } from '../../../../data/models/Entities';
import {
  TipoDocumentoService,
  GeneroService,
  EstadoCivilService,
  EtniaService,
  NacionalidadEtnicaService,
  PaisService,
  ProvinciaService,
  CantonService,
  ParroquiaService,
  CicloService,
  CursoService,
  MallaService,
  TipoDatoContactoService,
  TipoOfertaService,
  PostulacionService,
  RequisitosService,
  EmailVerificationService
} from '../../../../core/services/postulaciones';
import { ConfirmationModalComponent } from '../../../../shared/modal-confirmation/confirmation-modal.component';
import { EmailVerificationModalComponent } from '../../../../shared/email-verification-modal/email-verification-modal.component';
import { PostulacionDraftService, PostulacionDraft } from '../../../../core/services/postulaciones/postulacion-draft.service';
import { SharedToastComponent } from '../../../../shared/shared-toast/shared-toast.component';
import { SharedDrawerComponent } from '../../../../shared/shared-drawer/shared-drawer.component';
import { ToastService } from '../../../../shared/toast.service';

interface Step {
  id: number;
  title: string;
  icon: string;
  completed: boolean;
  active: boolean;
}

interface CountryDialOption {
  name: string;
  dialCode: string;
  flag: string;
}

@Component({
  selector: 'app-create-postulation-externo',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ConfirmationModalComponent, EmailVerificationModalComponent, SharedToastComponent, SharedDrawerComponent],
  templateUrl: './create-postulation-externo.component.html',
  styleUrls: ['./create-postulation-externo.component.css']
})
export class CreatePostulationExternoComponent implements OnInit, OnChanges, OnDestroy {
  @Input() tipoOfertaAcademica: 'acelerado-virtual' | 'formal-virtual' | null = null;
  @Input() visible: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() close = new EventEmitter<void>();
  @Output() postulacionCompleted = new EventEmitter<{ success: boolean; message: string }>();

  currentStep = 1;
  postulacionForm!: FormGroup;

  steps: Step[] = [
    { id: 1, title: 'Datos Personales', icon: 'pi pi-user', completed: false, active: true },
    { id: 2, title: 'Curso al que aspira', icon: 'pi pi-graduation-cap', completed: false, active: false }
  ];

  esDeEcuador: boolean | null = true;

  tiposDocumento: TipoDocumentoDTO[] = [];
  generos: GeneroDTO[] = [];
  estadosCiviles: EstadoCivilDTO[] = [];
  etnias: EtniaDTO[] = [];
  nacionalidadesEtnicas: NacionalidadEtnicaDTO[] = [];
  paises: PaisDTO[] = [];
  provincias: ProvinciaDTO[] = [];
  filteredProvincias: ProvinciaDTO[] = [];
  selectedProvincia: ProvinciaDTO | null = null;
  cantones: CantonDTO[] = [];
  parroquias: ParroquiaDTO[] = [];
  ciclos: CicloDTO[] = [];
  cursos: CursoDTO[] = [];
  mallas: MallaDTO[] = [];
  todasLasMallas: MallaDTO[] = [];
  tiposDatoContacto: TipoDatoContactoDTO[] = [];
  tiposDatoContactoObligatorios: TipoDatoContactoDTO[] = [];
  tiposDatoContactoOpcionales: TipoDatoContactoDTO[] = [];
  tiposOferta: TipoOfertaDTO[] = [];
  requisitos: RequisitosDTO[] = [];
  ofertaAcademicaNombre: string | null = null;

  opcionesInstruccion: string[] = [
    'Primaria',
    'Educación Básica',
    'Centro de Alfabetización',
    'Educación Básica para Adultos',
    'Secundaria',
    'Ninguna'
  ];

  opcionesAnosRezago: string[] = [
    '1',
    '2',
    '3',
    'Más de 3',
    'Desconozco'
  ];

  contactosOpcionalesAgregados: TipoDatoContactoDTO[] = [];

  get mallasDisponibles(): MallaDTO[] {
    return this.mallas;
  }

  get todasMallasSinConfigurar(): boolean {
    return this.mallas.length === 0;
  }

  private normalizeText(value: string | null | undefined): string {
    return (value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private getTipoOfertaSearchTokens(): string[] {
    if (!this.tipoOfertaAcademica) return [];
    const normalizedTipo = this.normalizeText(this.tipoOfertaAcademica);
    switch (normalizedTipo) {
      case 'acelerado-virtual':
        return ['acelerado', 'virtual'];
      case 'formal-virtual':
        return ['formal', 'virtual'];
      default:
        return normalizedTipo
          .split('-')
          .map(token => token.trim())
          .filter(token => !!token);
    }
  }

  private getIdTipoOfertaFromTipoAcademico(): number | null {
    const tokens = this.getTipoOfertaSearchTokens();
    if (!tokens.length || !this.tiposOferta?.length) {
      return null;
    }

    const oferta = this.tiposOferta.find(o => {
      const detalleNormalizado = this.normalizeText(o.detalle);
      return tokens.every(token => detalleNormalizado.includes(token));
    });

    return oferta?.idtipoOferta ?? null;
  }

  getContactConfirmControlName(idTipo: number | undefined): string {
    return `contacto_confirm_${idTipo || 0}`;
  }

  private emailConfirmationValidator(originalControlName: string) {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.parent) return null;
      const original = control.parent.get(originalControlName)?.value;
      if (control.value !== original) {
        return { emailMismatch: true };
      }
      return null;
    };
  }

  getContactError(controlName: string, detalle: string | undefined, isConfirm?: boolean): string {
    const control = this.postulacionForm.get(controlName);
    if (!control || !control.errors || !control.touched) return '';

    if (control.hasError('required')) {
      return isConfirm ? 'Confirme su correo electrónico' : 'Este campo es requerido';
    }
    if (control.hasError('email')) {
      return 'Ingrese un correo electrónico válido';
    }
    if (control.hasError('pattern')) {
      if (this.isPhoneContact(detalle)) {
        return 'Ingrese un número de celular válido';
      }
    }
    if (control.hasError('emailMismatch')) {
      return 'El correo no coincide';
    }
    return '';
  }

  private setOfertaAcademicaNombre(): void {
    const idTipoOferta = this.getIdTipoOfertaFromTipoAcademico();
    if (idTipoOferta && this.tiposOferta?.length) {
      const oferta = this.tiposOferta.find(o => o.idtipoOferta === idTipoOferta);
      this.ofertaAcademicaNombre = oferta?.detalle || null;
    } else {
      this.ofertaAcademicaNombre = null;
    }
  }

  private loadMallasByTipoOferta(): void {
    const idTipoOferta = this.getIdTipoOfertaFromTipoAcademico();

    if (idTipoOferta) {
      this.mallaService.getMallasByTipoOferta(idTipoOferta).subscribe({
        next: (data) => {
          this.mallas = data;
          this.todasLasMallas = data;
        },
        error: () => { }
      });
    } else {
      this.mallaService.getMallas().subscribe({
        next: (data) => {
          this.mallas = data;
          this.todasLasMallas = data;
        },
        error: () => { }
      });
    }
  }

  showConfirmationModal: boolean = false;
  isSubmitting: boolean = false;
  modalTitle: string = '¿Desea crear esta postulación?';
  modalMessage: string = 'Por favor confirme que los datos ingresados son correctos.';

  ageDisplay: string | null = null;

  mostrarAlertaEdad = false;
  mensajeAlertaEdad = '';

  private pendingDraftData: PostulacionDraft | null = null;

  documentoPlaceholder: string = 'Ingrese su documento';
  documentoMaxLength: number = 20;
  documentoErrorMessage: string = '';
  tipoDocumentoSeleccionado: string | null = null;

  countryDialOptions: CountryDialOption[] = [
    { name: 'Ecuador', dialCode: '+593', flag: '🇪🇨' }
  ];
  defaultCountryDialCode: string = '+593';

  edadUsuario: number = 0;
  fechaNacimientoUsuario: Date | null = null;

  showEmailVerificationModal = false;
  isEmailVerified = true; // TODO: restaurar a false cuando el envío de email esté funcionando
  emailIdTipoDatoContacto: number | null = null;

  private toastService = inject(ToastService);
  private draftService = inject(PostulacionDraftService);
  private emailVerificationService = inject(EmailVerificationService);
  private autoSaveSubscription: Subscription | null = null;
  private readonly DRAFT_KEY = 'ammi_postulacion_draft_externo';

  constructor(
    private fb: FormBuilder,
    private tipoDocumentoService: TipoDocumentoService,
    private generoService: GeneroService,
    private estadoCivilService: EstadoCivilService,
    private etniaService: EtniaService,
    private nacionalidadEtnicaService: NacionalidadEtnicaService,
    private paisService: PaisService,
    private provinciaService: ProvinciaService,
    private cantonService: CantonService,
    private parroquiaService: ParroquiaService,
    private cicloService: CicloService,
    private cursoService: CursoService,
    private tipoDatoContactoService: TipoDatoContactoService,
    private tipoOfertaService: TipoOfertaService,
    private postulacionService: PostulacionService,
    private mallaService: MallaService,
    private requisitosService: RequisitosService,
    private router: Router
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tipoOfertaAcademica'] && !changes['tipoOfertaAcademica'].firstChange) {
      this.loadMallasByTipoOferta();
    }
    if (changes['visible'] && changes['visible'].currentValue === true) {
      this.loadDraftFromStorage();
    }
  }

  ngOnInit(): void {
    this.initializeForm();
    this.loadCountryDialOptions();
    this.loadInitialData();
    this.checkEmailVerificationStatus();

    let recheckCount = 0;
    const recheckInterval = setInterval(() => {
      recheckCount++;
      this.checkEmailVerificationStatus();
      if (recheckCount >= 20 || this.isEmailVerified) {
        clearInterval(recheckInterval);
      }
    }, 3000);

    const draft = this.draftService.load();
    if (draft) {
      this.pendingDraftData = draft;
    }

    this.loadDraftFromStorage();
    this.setupAutoSave();
  }

  ngOnDestroy(): void {
    this.saveDraftToStorage();
    this.autoSaveSubscription?.unsubscribe();
  }

  private setupAutoSave(): void {
    this.autoSaveSubscription = this.postulacionForm.valueChanges
      .pipe(debounceTime(2000))
      .subscribe(() => this.saveDraftToStorage());
  }

  private saveDraftToStorage(): void {
    try {
      const draft = {
        formValues: this.postulacionForm.getRawValue(),
        selectedProvincia: this.selectedProvincia,
        contactosOpcionalesAgregados: this.contactosOpcionalesAgregados,
        currentStep: this.currentStep,
        esDeEcuador: this.esDeEcuador,
        tipoOfertaAcademica: this.tipoOfertaAcademica
      };
      localStorage.setItem(this.DRAFT_KEY, JSON.stringify(draft));
    } catch { }
  }

  private loadDraftFromStorage(): void {
    try {
      const saved = localStorage.getItem(this.DRAFT_KEY);
      if (!saved) return;
      const draft = JSON.parse(saved);

      if (draft.tipoOfertaAcademica && draft.tipoOfertaAcademica !== this.tipoOfertaAcademica) {
        return;
      }

      if (draft.formValues) {
        const { idMalla, ...restValues } = draft.formValues;
        this.postulacionForm.patchValue(restValues);
      }
      if (draft.selectedProvincia) {
        this.selectedProvincia = draft.selectedProvincia;
      }
      if (draft.contactosOpcionalesAgregados) {
        draft.contactosOpcionalesAgregados.forEach((tipo: TipoDatoContactoDTO) => {
          if (!this.hasOptionalContact(tipo.idTipoDatoContacto)) {
            this.addOptionalContact(tipo);
          }
        });
      }
      if (draft.currentStep) {
        this.currentStep = draft.currentStep;
        this.updateStepsState();
      }
      if (draft.esDeEcuador !== undefined) {
        this.esDeEcuador = draft.esDeEcuador;
      }
    } catch { }
  }

  clearDraftFromStorage(): void {
    try {
      localStorage.removeItem(this.DRAFT_KEY);
    } catch { }
  }

  onDrawerClose(): void {
    this.saveDraftToStorage();
    this.close.emit();
    this.visibleChange.emit(false);
  }

  private initializeForm(): void {
    this.postulacionForm = this.fb.group({
      idTipoDocumento: ['', Validators.required],
      documento: ['', [Validators.required, this.documentoValidator.bind(this)]],
      idGenero: ['', Validators.required],
      primerNombre: ['', Validators.required],
      segundoNombre: [''],
      primerApellido: ['', Validators.required],
      segundoApellido: [''],
      fechaNacimiento: ['', Validators.required],
      idMalla: ['', Validators.required],
      aceptaTerminos: [false, Validators.requiredTrue]
    });

    this.postulacionForm.get('idTipoDocumento')?.valueChanges.subscribe(value => {
      this.onTipoDocumentoChange(value);
    });

    this.postulacionForm.get('fechaNacimiento')?.valueChanges.subscribe(value => {
      this.calculateAge(value);
    });

    this.postulacionForm.get('idMalla')?.valueChanges.subscribe(value => {
      if (value) {
        this.loadRequisitos();
      } else {
        this.requisitos = [];
      }
    });

    this.postulacionForm.get('primerNombre')?.valueChanges.subscribe(value => {
      if (value) {
        const titleCaseValue = this.toTitleCase(value);
        if (value !== titleCaseValue) {
          this.postulacionForm.get('primerNombre')?.setValue(titleCaseValue, { emitEvent: false });
        }
      }
    });

    this.postulacionForm.get('segundoNombre')?.valueChanges.subscribe(value => {
      if (value) {
        const titleCaseValue = this.toTitleCase(value);
        if (value !== titleCaseValue) {
          this.postulacionForm.get('segundoNombre')?.setValue(titleCaseValue, { emitEvent: false });
        }
      }
    });

    this.postulacionForm.get('primerApellido')?.valueChanges.subscribe(value => {
      if (value) {
        const titleCaseValue = this.toTitleCase(value);
        if (value !== titleCaseValue) {
          this.postulacionForm.get('primerApellido')?.setValue(titleCaseValue, { emitEvent: false });
        }
      }
    });

    this.postulacionForm.get('segundoApellido')?.valueChanges.subscribe(value => {
      if (value) {
        const titleCaseValue = this.toTitleCase(value);
        if (value !== titleCaseValue) {
          this.postulacionForm.get('segundoApellido')?.setValue(titleCaseValue, { emitEvent: false });
        }
      }
    });
  }

  private async loadCountryDialOptions(): Promise<void> {
    try {
      const response = await fetch('https://restcountries.com/v3.1/all?fields=name,idd,flag,cca2');
      if (!response.ok) {
        return;
      }

      const countries = await response.json();
      const options = this.mapCountryDialOptions(countries);

      if (options.length > 0) {
        this.countryDialOptions = options;
      }
    } catch { }
  }

  private mapCountryDialOptions(countries: any[]): CountryDialOption[] {
    const mapped = countries
      .map((country: any) => {
        const root = country?.idd?.root ?? '';
        const suffix = country?.idd?.suffixes?.[0] ?? '';
        const dialCode = `${root}${suffix}`;
        const cca2 = (country?.cca2 ?? '').toUpperCase();

        return {
          name: country?.name?.common ?? 'País',
          dialCode,
          flag: country?.flag ?? this.flagFromIsoCode(cca2)
        } as CountryDialOption;
      })
      .filter((item: CountryDialOption) => /^\+\d+$/.test(item.dialCode));

    const deduplicated = mapped.filter((item, index, self) =>
      index === self.findIndex(x => x.dialCode === item.dialCode)
    );

    return deduplicated.sort((a, b) => a.name.localeCompare(b.name));
  }

  private flagFromIsoCode(isoCode: string): string {
    if (!/^[A-Z]{2}$/.test(isoCode)) {
      return '🌍';
    }
    return isoCode
      .split('')
      .map(char => String.fromCodePoint(127397 + char.charCodeAt(0)))
      .join('');
  }

  private loadInitialData(): void {
    this.tipoDocumentoService.getTiposDocumento().subscribe({
      next: (data) => {
        this.tiposDocumento = data;
        if (data && data.length > 0) {
          this.postulacionForm.patchValue({ idTipoDocumento: data[0].idTipoDocumento });
        }
      },
      error: () => { }
    });

    this.generoService.getGeneros().subscribe({
      next: (data) => {
        this.generos = data;
        if (data && data.length > 0) {
          this.postulacionForm.patchValue({ idGenero: data[0].idGenero });
        }
      },
      error: () => { }
    });

    this.paisService.getPaises().subscribe({
      next: (paises) => {
        const ecuador = paises.find(p => p.esEcuador);
        if (ecuador && ecuador.idPais) {
          this.provinciaService.getProvinciasByPais(ecuador.idPais).subscribe({
            next: (data) => {
              this.provincias = data;
              this.filteredProvincias = data.slice();
            },
            error: () => { }
          });
        }
      },
      error: () => { }
    });

    this.loadMallasByTipoOferta();

    this.tipoDatoContactoService.getTiposDatoContacto().subscribe({
      next: (data) => {
        this.tiposDatoContacto = data;
        this.tiposDatoContactoObligatorios = data.filter(t => t.esObligatorio);
        this.tiposDatoContactoOpcionales = data.filter(t => !t.esObligatorio);
        this.loadContactControls();
        this.tipoOfertaService.getTiposOferta().subscribe({
          next: (ofertas) => {
            this.tiposOferta = ofertas;
            this.loadMallasByTipoOferta();
            this.setOfertaAcademicaNombre();
          },
          error: () => { this.ofertaAcademicaNombre = null; }
        });
      },
      error: () => { }
    });
  }

  private documentoValidator(control: AbstractControl): ValidationErrors | null {
    const documento = control.value;
    if (!documento) {
      return null;
    }

    if (!this.tipoDocumentoSeleccionado) {
      return null;
    }

    const tipoNombre = this.tipoDocumentoSeleccionado.toUpperCase();

    switch (tipoNombre) {
      case 'CEDULA':
      case 'CÉDULA':
      case 'CEDULA DE IDENTIDAD':
      case 'CÉDULA DE IDENTIDAD':
      case 'RUC':
      case 'PASAPORTE':
      default:
        if (!/^[A-Z0-9]+$/i.test(documento)) {
          return { documentoInvalido: { message: 'El documento solo debe contener letras y números.' } };
        }
    }

    return null;
  }

  onTipoDocumentoChange(idTipoDocumento: number | string): void {
    const tipoDoc = this.tiposDocumento.find(t => t.idTipoDocumento == idTipoDocumento);
    this.tipoDocumentoSeleccionado = tipoDoc?.nombre || null;

    this.documentoPlaceholder = getDocumentoPlaceholder(this.tipoDocumentoSeleccionado);
    this.documentoMaxLength = getDocumentoMaxLength(this.tipoDocumentoSeleccionado);
    this.documentoErrorMessage = getDocumentoErrorMessage(this.tipoDocumentoSeleccionado);

    const documentoControl = this.postulacionForm.get('documento');
    if (documentoControl) {
      documentoControl.setValue('');
      documentoControl.updateValueAndValidity();
    }
  }

  getDocumentoError(): string {
    const documentoControl = this.postulacionForm.get('documento');
    if (documentoControl?.hasError('required')) {
      return 'El documento es requerido';
    }
    if (documentoControl?.hasError('documentoInvalido')) {
      return documentoControl.getError('documentoInvalido').message;
    }
    return '';
  }

  private calculateAge(fechaNacimiento: string): void {
    if (!fechaNacimiento) {
      this.ageDisplay = null;
      this.edadUsuario = 0;
      this.fechaNacimientoUsuario = null;
      return;
    }

    const birthDate = new Date(fechaNacimiento);
    this.fechaNacimientoUsuario = birthDate;
    const today = new Date();

    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    let days = today.getDate() - birthDate.getDate();

    if (days < 0) {
      months--;
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, birthDate.getDate());
      days += Math.floor((today.getTime() - lastMonth.getTime()) / (1000 * 60 * 60 * 24));
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    this.edadUsuario = years;

    if (years > 1 && years < 99) {
      this.ageDisplay = `${years} años, ${months} meses y ${days} días`;
    } else {
      this.ageDisplay = null;
    }

    this.validarEdadParaOferta(years);
  }

  private validarEdadParaOferta(edad: number): void {
    if (!this.tipoOfertaAcademica) return;

    const control = this.postulacionForm.get('fechaNacimiento');
    if (!control) return;

    if (this.tipoOfertaAcademica === 'acelerado-virtual' && edad < 18) {
      const msg = 'Para Acelerado Virtual debe tener 18 años o más. La oferta Bachillerato Formal Virtual es para menores de 18 años.';
      if (!control.hasError('edadInvalida')) {
        control.setErrors({ ...(control.errors || {}), edadInvalida: true, mensaje: 'Para Acelerado Virtual, debe ser mayor de edad (18 años o más).' });
      }
      this.mostrarAlertaEdad = true;
      this.mensajeAlertaEdad = msg;
    } else if (this.tipoOfertaAcademica === 'formal-virtual' && edad >= 18) {
      const msg = 'Para Bachillerato Formal Virtual debe tener menos de 18 años. La oferta Acelerado Virtual es para mayores de edad.';
      if (!control.hasError('edadInvalida')) {
        control.setErrors({ ...(control.errors || {}), edadInvalida: true, mensaje: 'Para Formal Virtual, debe ser menor a 17 años.' });
      }
      this.mostrarAlertaEdad = true;
      this.mensajeAlertaEdad = msg;
    } else {
      this.mostrarAlertaEdad = false;
      this.mensajeAlertaEdad = '';
      if (control.hasError('edadInvalida')) {
        const errors = { ...control.errors };
        delete errors['edadInvalida'];
        delete errors['mensaje'];
        control.setErrors(Object.keys(errors).length > 0 ? errors : null);
      }
    }
  }

  irAOfertaAlternativa(): void {
    const ofertaAlternativa = this.tipoOfertaAcademica === 'acelerado-virtual' ? 'formal-virtual' : 'acelerado-virtual';
    this.draftService.save({
      tipoOfertaOrigen: this.tipoOfertaAcademica!,
      formValues: this.postulacionForm.value,
      selectedProvincia: this.selectedProvincia,
      contactosOpcionalesAgregados: [...this.contactosOpcionalesAgregados],
    });
    this.router.navigate(['/' + ofertaAlternativa]);
  }

  private applyDraft(draft: PostulacionDraft): void {
    const { idMalla, ...restValues } = draft.formValues;
    this.postulacionForm.patchValue(restValues);
    this.selectedProvincia = draft.selectedProvincia;

    if (draft.contactosOpcionalesAgregados?.length) {
      draft.contactosOpcionalesAgregados.forEach(tipo => {
        if (!this.hasOptionalContact(tipo.idTipoDatoContacto)) {
          this.addOptionalContact(tipo);
        }
      });
      this.postulacionForm.patchValue(restValues);
    }
  }

  private toTitleCase(str: string): string {
    if (!str) return str;
    return str.toUpperCase();
  }

  filterProvincias(event: any): void {
    let filtered: ProvinciaDTO[] = [];
    let query = event.query;

    for (let i = 0; i < this.provincias.length; i++) {
      let provincia = this.provincias[i];
      if (provincia.nombre && provincia.nombre.toLowerCase().indexOf(query.toLowerCase()) == 0) {
        filtered.push(provincia);
      }
    }

    this.filteredProvincias = filtered;
  }

  onProvinciaSelect(event: any): void {
    this.postulacionForm.get('idProvincia')?.setValue(event.idProvincia);
  }

  onProvinciaClear(): void {
    this.selectedProvincia = null;
    this.postulacionForm.get('idProvincia')?.setValue('');
  }

  getMallaDetalle(): string {
    const id = this.postulacionForm.get('idMalla')?.value;
    return this.mallas.find(m => m.idMalla == id)?.detalle || '';
  }

  private loadRequisitos(): void {
    const idMalla = this.postulacionForm.get('idMalla')?.value;
    if (idMalla) {
      this.requisitosService.getRequisitosByMalla(idMalla).subscribe({
        next: (requisitos) => {
          this.requisitos = requisitos;
        },
        error: () => {
          this.requisitos = [];
        }
      });
    } else {
      this.requisitos = [];
    }
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatDateForDisplay(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T12:00:00');
    if (isNaN(date.getTime())) return dateStr;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  setStep(stepId: number): void {
    if (stepId <= this.getMaxAccessibleStep()) {
      this.currentStep = stepId;
      this.updateStepsState();
    }
  }

  nextStep(): void {
    if (this.currentStep < this.steps.length) {
      if (!this.isStepValid(this.currentStep)) {
        this.markCurrentStepAsTouched();
        this.toastService.showWarning('Por favor complete todos los campos requeridos antes de continuar.', 'Campos requeridos');
        return;
      }

      this.steps[this.currentStep - 1].completed = true;
      this.currentStep++;
      this.updateStepsState();
    }
  }

  private markCurrentStepAsTouched(): void {
    switch (this.currentStep) {
      case 1: {
        const step1Fields = ['idTipoDocumento', 'documento', 'idGenero', 'primerNombre', 'primerApellido', 'fechaNacimiento'];
        step1Fields.forEach(field => this.postulacionForm.get(field)?.markAsTouched());
        this.tiposDatoContactoObligatorios.forEach(tipo => {
          if (tipo.idTipoDatoContacto) {
            this.postulacionForm.get(`contacto_${tipo.idTipoDatoContacto}`)?.markAsTouched();
          }
        });
        break;
      }
      case 2: {
        this.postulacionForm.get('idMalla')?.markAsTouched();
        this.postulacionForm.get('aceptaTerminos')?.markAsTouched();
        break;
      }
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.updateStepsState();
    }
  }

  private updateStepsState(): void {
    this.steps.forEach(step => {
      step.active = step.id === this.currentStep;
    });
  }

  getMaxAccessibleStep(): number {
    let maxStep = 1;
    for (let i = 0; i < this.steps.length; i++) {
      if (this.steps[i].completed || i === 0) {
        maxStep = this.steps[i].id;
      } else {
        break;
      }
    }
    return maxStep;
  }

  isStepValid(stepId: number): boolean {
    switch (stepId) {
      case 1: {
        const paso1Fields = ['idTipoDocumento', 'documento', 'idGenero', 'primerNombre', 'primerApellido', 'fechaNacimiento'];
        const formValid = paso1Fields.every(field => {
          const control = this.postulacionForm.get(field);
          return control && control.valid;
        });
        if (!formValid) return false;

        if (this.esDeEcuador === null) return false;

        if (this.esDeEcuador === true && !this.selectedProvincia) return false;

        const contactosValidos = this.tiposDatoContactoObligatorios.every(tipo => {
          if (tipo.idTipoDatoContacto) {
            const controlName = `contacto_${tipo.idTipoDatoContacto}`;
            const control = this.postulacionForm.get(controlName);
            return control && control.valid && control.value && control.value.trim() !== '';
          }
          return true;
        });
        if (!contactosValidos) return false;

        const opcValidos = this.contactosOpcionalesAgregados.every(tipo => {
          if (tipo.idTipoDatoContacto) {
            const control = this.postulacionForm.get(`contacto_opcional_${tipo.idTipoDatoContacto}`);
            return control && control.valid;
          }
          return true;
        });
        return opcValidos;
      }

      case 2: {
        const mallaControl = this.postulacionForm.get('idMalla');
        return !!(mallaControl && mallaControl.valid && mallaControl.value);
      }

      default:
        return true;
    }
  }

  onDrawerSubmit(): void {
    this.onSubmit();
  }

  onSubmit(): void {
    if (!this.validateEmailVerification()) {
      return;
    }

    if (this.esDeEcuador === true && !this.selectedProvincia) {
      this.toastService.showError('Debe seleccionar una provincia de residencia.', 'Error');
      return;
    }

    if (this.postulacionForm.valid) {
      const formData = this.postulacionForm.getRawValue();
      const nombreCompleto = `${formData.primerNombre || ''} ${formData.segundoNombre || ''} ${formData.primerApellido || ''} ${formData.segundoApellido || ''}`.trim();

      const contactosInfo = this.buildContactosInfo(formData);

      this.modalTitle = '¿Desea crear esta postulación?';
      this.modalMessage = `
        <div style="text-align: left;">
          <p style="margin-bottom: 1.5rem; color: var(--primary-color); font-size: 1.1rem; font-weight: 600;">
            <i class="pi pi-check-circle" style="margin-right: 0.5rem;"></i>
            Por favor confirme que los datos ingresados son correctos:
          </p>
          <ul style="list-style: none; padding-left: 0; margin: 0;">
            <li style="margin-bottom: 0.75rem;">
              <strong style="color: var(--text-color-secondary);">Nombre:</strong>
              <span style="color: var(--text-color); font-weight: 500;">${nombreCompleto}</span>
            </li>
            <li style="margin-bottom: 0.75rem;">
              <strong style="color: var(--text-color-secondary);">Documento:</strong>
              <span style="color: var(--text-color); font-weight: 500;">${formData.documento || ''}</span>
            </li>
            <li style="margin-bottom: 0.75rem;">
              <strong style="color: var(--text-color-secondary);">Curso al que aspira:</strong>
              <span style="color: var(--text-color); font-weight: 500;">${this.getMallaDetalle()}</span>
            </li>
            ${contactosInfo}
          </ul>
          <div style="margin-top: 1.5rem; padding: 1rem; background-color: var(--surface-ground); border-radius: 0.5rem; border-left: 4px solid var(--success-color);">
            <p style="margin: 0; font-size: 0.9rem; color: var(--text-color-secondary);">
              <i class="pi pi-info-circle" style="margin-right: 0.5rem;"></i>
              Una vez creada la postulación, podrá revisar el estado de su solicitud en la sección de "Mis Postulaciones" , su usuario sera creado con su numero de cedula de usuario y contraseña.
            </p>
          </div>
        </div>
      `;
      this.showConfirmationModal = true;
    } else {
      this.modalTitle = 'Errores de Validación';
      const errors = this.getFormValidationErrors();
      this.modalMessage = `
        <div style="text-align: center;">
          <i class="pi pi-exclamation-triangle" style="font-size: 3rem; color: var(--error-color); margin-bottom: 1rem;"></i>
          <p style="font-size: 1.1rem; font-weight: 600; color: var(--error-color); margin-bottom: 1rem;">
            Por favor complete todos los campos requeridos antes de continuar.
          </p>
          <ul style="color: var(--text-color-secondary); text-align: left; display: inline-block; margin: 0; padding-left: 1rem;">
            ${errors.map(error => `<li>${error}</li>`).join('')}
          </ul>
        </div>
      `;
      this.showConfirmationModal = true;
    }
  }

  onConfirmAccept(): void {
    this.isSubmitting = true;
    const formData = this.postulacionForm.getRawValue();

    const idMalla = formData.idMalla ? +formData.idMalla : 0;
    if (!idMalla || idMalla <= 0) {
      this.toastService.showError('Debe seleccionar una malla curricular.', 'Error');
      this.showConfirmationModal = false;
      this.isSubmitting = false;
      return;
    }

    const personaPostulacion: any = {
      IdTipoDocumento: formData.idTipoDocumento ? +formData.idTipoDocumento : 0,
      Documento: formData.documento || '',
      IdGenero: formData.idGenero ? +formData.idGenero : 0,
      PrimerNombre: formData.primerNombre || '',
      SegundoNombre: formData.segundoNombre || '',
      PrimerApellido: formData.primerApellido || '',
      SegundoApellido: formData.segundoApellido || '',
      FechaNacimiento: formData.fechaNacimiento ? this.formatDate(new Date(formData.fechaNacimiento + 'T12:00:00')) : '',
      IdProvincia: (this.esDeEcuador === true ? (this.selectedProvincia?.idProvincia ?? null) : null),
      IdMalla: idMalla,
      EsPostulacionRapida: false,
      DatosContactos: this.buildDatosContactos(formData)
    };

    this.postulacionService.crearPostulacionExterna(personaPostulacion).subscribe({
      next: (response) => {
        const isSuccess = response?.isSuccess === true;
        if (!isSuccess) {
          const backendMessage = this.formatBackendValidationMessage(
            response?.message || 'No se pudo enviar la postulación. Verifique los datos e intente nuevamente.'
          );
          this.showConfirmationModal = false;
          this.isSubmitting = false;
          this.postulacionCompleted.emit({
            success: false,
            message: backendMessage
          });
          return;
        }

        this.showConfirmationModal = false;
        this.isSubmitting = false;
        this.clearDraftFromStorage();
        this.postulacionCompleted.emit({
          success: true,
          message: '¡Postulación enviada exitosamente! Nos pondremos en contacto contigo pronto.'
        });
        this.resetForm();
        this.onDrawerClose();
      },
      error: (error) => {
        this.showConfirmationModal = false;
        this.isSubmitting = false;
        const errorMessage = this.formatBackendValidationMessage(
          error?.error?.message || 'Error al enviar la postulación. Por favor, intente nuevamente.'
        );
        this.postulacionCompleted.emit({
          success: false,
          message: errorMessage
        });
      }
    });
  }

  onConfirmReject(): void {
    this.showConfirmationModal = false;
  }

  onModalHide(): void {
    this.showConfirmationModal = false;
  }

  getFormValidationErrors(): string[] {
    const errors: string[] = [];
    Object.keys(this.postulacionForm.controls).forEach(key => {
      const control = this.postulacionForm.get(key);
      if (control && control.errors) {
        errors.push(`${key}: ${JSON.stringify(control.errors)}`);
      }
    });
    return errors;
  }

  private loadContactControls(): void {
    this.tiposDatoContactoObligatorios.forEach(tipo => {
      if (tipo.idTipoDatoContacto) {
        const validators = [Validators.required];
        if (this.isEmailContact(tipo.detalle)) {
          validators.push(Validators.email);
        }
        if (this.isPhoneContact(tipo.detalle)) {
          validators.push(Validators.pattern(/^[0-9]{7,15}$/));
          this.postulacionForm.addControl(
            `prefix_contacto_${tipo.idTipoDatoContacto}`,
            this.fb.control(this.defaultCountryDialCode, [Validators.required, Validators.pattern(/^\+\d{1,4}$/)])
          );
        }
        this.postulacionForm.addControl(
          `contacto_${tipo.idTipoDatoContacto}`,
          this.fb.control('', validators)
        );
        if (this.isEmailContact(tipo.detalle)) {
          this.postulacionForm.addControl(
            `contacto_confirm_${tipo.idTipoDatoContacto}`,
            this.fb.control('', [Validators.required, Validators.email, this.emailConfirmationValidator(`contacto_${tipo.idTipoDatoContacto}`)])
          );
        }
      }
    });

    if (this.pendingDraftData) {
      this.applyDraft(this.pendingDraftData);
      this.pendingDraftData = null;
    }
  }

  isEmailContact(detalle: string | undefined): boolean {
    if (!detalle) return false;
    const nombreLower = detalle.toLowerCase();
    return nombreLower.includes('email') || nombreLower.includes('correo');
  }

  isPhoneContact(detalle: string | undefined): boolean {
    if (!detalle) return false;
    const nombreLower = detalle.toLowerCase();
    return nombreLower.includes('teléfono') || nombreLower.includes('telefono') ||
      nombreLower.includes('celular') || nombreLower.includes('móvil') ||
      nombreLower.includes('movil') || nombreLower.includes('whatsapp');
  }

  hasContactError(controlName: string): boolean {
    const control = this.postulacionForm.get(controlName);
    return control ? control.invalid && control.touched : false;
  }

  getContactIcon(detalle: string | undefined): string {
    if (!detalle) return 'pi pi-user';
    const nombreLower = detalle.toLowerCase();
    if (nombreLower.includes('email') || nombreLower.includes('correo')) {
      return 'pi pi-envelope';
    } else if (nombreLower.includes('teléfono') || nombreLower.includes('celular') || nombreLower.includes('móvil')) {
      return 'pi pi-phone';
    } else if (nombreLower.includes('whatsapp')) {
      return 'pi pi-whatsapp';
    } else {
      return 'pi pi-user';
    }
  }

  getContactPlaceholder(detalle: string | undefined): string {
    if (!detalle) return 'Ingrese información de contacto';
    const nombreLower = detalle.toLowerCase();
    if (nombreLower.includes('email') || nombreLower.includes('correo')) {
      return 'ejemplo@correo.com';
    } else if (nombreLower.includes('teléfono') || nombreLower.includes('celular')) {
      return '0999999999';
    } else if (nombreLower.includes('whatsapp')) {
      return '0999999999';
    } else {
      return `Ingrese ${nombreLower}`;
    }
  }

  getContactControlName(idTipo: number | undefined): string {
    return `contacto_${idTipo || 0}`;
  }

  getOptionalContactControlName(idTipo: number | undefined): string {
    return `contacto_opcional_${idTipo || 0}`;
  }

  getContactPrefixControlName(idTipo: number | undefined): string {
    return `prefix_contacto_${idTipo || 0}`;
  }

  getFieldError(fieldName: string): string {
    const control = this.postulacionForm.get(fieldName);
    if (!control || !control.errors || !control.touched) return '';
    if (control.hasError('required')) return 'Este campo es requerido';
    if (control.hasError('minlength')) return `Mínimo ${control.errors['minlength'].requiredLength} caracteres`;
    if (control.hasError('maxlength')) return `Máximo ${control.errors['maxlength'].requiredLength} caracteres`;
    if (control.hasError('email')) return 'Ingrese un correo electrónico válido';
    if (control.hasError('pattern')) return 'Formato inválido';
    return '';
  }

  getFechaNacimientoError(): string {
    const control = this.postulacionForm.get('fechaNacimiento');
    if (!control || !control.errors) return '';
    if (control.hasError('required')) return 'La fecha de nacimiento es requerida';
    if (control.hasError('edadInvalida')) return control.getError('mensaje') || 'Edad no permitida para esta oferta';
    return '';
  }

  getOptionalContactPrefixControlName(idTipo: number | undefined): string {
    return `prefix_contacto_opcional_${idTipo || 0}`;
  }

  removeOptionalContact(idTipo: number | undefined): void {
    const tipoRemoved = this.contactosOpcionalesAgregados.find(c => c.idTipoDatoContacto === idTipo);
    this.contactosOpcionalesAgregados = this.contactosOpcionalesAgregados.filter(c => c.idTipoDatoContacto !== idTipo);
    this.postulacionForm.removeControl(`contacto_opcional_${idTipo}`);
    if (tipoRemoved && this.isPhoneContact(tipoRemoved.detalle)) {
      this.postulacionForm.removeControl(`prefix_contacto_opcional_${idTipo}`);
    }
  }

  hasOptionalContact(idTipo: number | undefined): boolean {
    return this.contactosOpcionalesAgregados.some(c => c.idTipoDatoContacto === idTipo);
  }

  addOptionalContact(tipo: TipoDatoContactoDTO): void {
    if (tipo.idTipoDatoContacto && !this.hasOptionalContact(tipo.idTipoDatoContacto)) {
      this.contactosOpcionalesAgregados.push(tipo);

      const validators = [];

      if (this.isEmailContact(tipo.detalle)) {
        validators.push(Validators.email);
      }

      if (this.isPhoneContact(tipo.detalle)) {
        validators.push(Validators.pattern(/^[0-9]{7,15}$/));
        this.postulacionForm.addControl(
          `prefix_contacto_opcional_${tipo.idTipoDatoContacto}`,
          this.fb.control(this.defaultCountryDialCode, [Validators.required, Validators.pattern(/^\+\d{1,4}$/)])
        );
      }

      this.postulacionForm.addControl(
        `contacto_opcional_${tipo.idTipoDatoContacto}`,
        this.fb.control('', validators)
      );
    }
  }

  private buildContactosInfo(formData: any): string {
    let contactosInfo = '';

    this.tiposDatoContactoObligatorios.forEach(tipo => {
      if (tipo.idTipoDatoContacto) {
        const controlName = `contacto_${tipo.idTipoDatoContacto}`;
        const value = formData[controlName];
        if (value) {
          let formattedValue = value;
          if (this.isPhoneContact(tipo.detalle) && !value.toString().startsWith('+')) {
            const prefixControlName = `prefix_contacto_${tipo.idTipoDatoContacto}`;
            const prefix = formData[prefixControlName] || this.defaultCountryDialCode;
            const cleanNumber = value.toString().replace(/\s+/g, '').replace(/^0+/, '');
            formattedValue = `${prefix} ${cleanNumber}`;
          }

          contactosInfo += `
            <li style="margin-bottom: 0.75rem;">
              <strong style="color: var(--text-color-secondary);">${tipo.detalle}:</strong>
              <span style="color: var(--text-color); font-weight: 500;">${formattedValue}</span>
            </li>
          `;
        }
      }
    });

    this.contactosOpcionalesAgregados.forEach(tipo => {
      if (tipo.idTipoDatoContacto) {
        const controlName = `contacto_opcional_${tipo.idTipoDatoContacto}`;
        const value = formData[controlName];
        if (value) {
          let formattedValue = value;
          if (this.isPhoneContact(tipo.detalle) && !value.toString().startsWith('+')) {
            const prefixControlName = `prefix_contacto_opcional_${tipo.idTipoDatoContacto}`;
            const prefix = formData[prefixControlName] || this.defaultCountryDialCode;
            const cleanNumber = value.toString().replace(/\s+/g, '').replace(/^0+/, '');
            formattedValue = `${prefix} ${cleanNumber}`;
          }

          contactosInfo += `
            <li style="margin-bottom: 0.75rem;">
              <strong style="color: var(--text-color-secondary);">${tipo.detalle}:</strong>
              <span style="color: var(--text-color); font-weight: 500;">${formattedValue}</span>
            </li>
          `;
        }
      }
    });

    return contactosInfo;
  }

  private buildDatosContactos(formData: any): DatosContactoPostulacionDTO[] {
    const datosContactos: DatosContactoPostulacionDTO[] = [];

    this.tiposDatoContactoObligatorios.forEach(tipo => {
      if (tipo.idTipoDatoContacto) {
        const controlName = `contacto_${tipo.idTipoDatoContacto}`;
        const value = formData[controlName];
        if (value) {
          let formattedValue = value;
          if (this.isPhoneContact(tipo.detalle) && !value.toString().startsWith('+')) {
            const prefixControlName = `prefix_contacto_${tipo.idTipoDatoContacto}`;
            const prefix = formData[prefixControlName] || this.defaultCountryDialCode;
            const cleanNumber = value.toString().replace(/\s+/g, '').replace(/^0+/, '');
            formattedValue = `${prefix} ${cleanNumber}`;
          }

          datosContactos.push({
            IdTipoDatoContacto: +tipo.idTipoDatoContacto,
            Detalle: formattedValue,
            EsPrincipal: tipo.esObligatorio
          });
        }
      }
    });

    this.contactosOpcionalesAgregados.forEach(tipo => {
      if (tipo.idTipoDatoContacto) {
        const controlName = `contacto_opcional_${tipo.idTipoDatoContacto}`;
        const value = formData[controlName];
        if (value) {
          let formattedValue = value;
          if (this.isPhoneContact(tipo.detalle) && !value.toString().startsWith('+')) {
            const prefixControlName = `prefix_contacto_opcional_${tipo.idTipoDatoContacto}`;
            const prefix = formData[prefixControlName] || this.defaultCountryDialCode;
            const cleanNumber = value.toString().replace(/\s+/g, '').replace(/^0+/, '');
            formattedValue = `${prefix} ${cleanNumber}`;
          }

          datosContactos.push({
            IdTipoDatoContacto: +tipo.idTipoDatoContacto,
            Detalle: formattedValue,
            EsPrincipal: false
          });
        }
      }
    });

    return datosContactos;
  }

  private resetForm(): void {
    this.postulacionForm.reset();
    this.currentStep = 1;
    this.selectedProvincia = null;
    this.filteredProvincias = [];
    this.contactosOpcionalesAgregados = [];
    this.ageDisplay = null;
    this.edadUsuario = 0;
    this.fechaNacimientoUsuario = null;
    this.documentoPlaceholder = 'Ingrese su documento';
    this.documentoMaxLength = 20;
    this.documentoErrorMessage = '';
    this.tipoDocumentoSeleccionado = null;

    this.steps.forEach(step => {
      step.completed = false;
      step.active = false;
    });
    this.steps[0].active = true;

    this.tiposDatoContactoObligatorios.forEach(tipo => {
      if (tipo.idTipoDatoContacto) {
        this.postulacionForm.removeControl(`contacto_${tipo.idTipoDatoContacto}`);
        if (this.isPhoneContact(tipo.detalle)) {
          this.postulacionForm.removeControl(`prefix_contacto_${tipo.idTipoDatoContacto}`);
        }
      }
    });

    this.contactosOpcionalesAgregados.forEach(tipo => {
      if (tipo.idTipoDatoContacto) {
        this.postulacionForm.removeControl(`contacto_opcional_${tipo.idTipoDatoContacto}`);
        if (this.isPhoneContact(tipo.detalle)) {
          this.postulacionForm.removeControl(`prefix_contacto_opcional_${tipo.idTipoDatoContacto}`);
        }
      }
    });

    this.loadContactControls();
  }

  private formatBackendValidationMessage(rawMessage: string): string {
    if (!rawMessage) return 'No se pudo enviar la postulación. Verifique los datos e intente nuevamente.';

    const normalized = rawMessage
      .replace(/\s+/g, ' ')
      .replace(/\s*\.\s*/g, '. ')
      .trim();

    const parts = normalized
      .split('. ')
      .map(part => part.trim())
      .filter(Boolean)
      .map(part => part.endsWith('.') ? part.slice(0, -1) : part);

    if (parts.length <= 1) {
      return `• ${normalized.endsWith('.') ? normalized.slice(0, -1) : normalized}`;
    }

    return parts.map(part => `• ${part}`).join('\n');
  }

  checkEmailVerificationStatus(): void {
    if (typeof sessionStorage === 'undefined') {
      return;
    }

    const emailVerified = sessionStorage.getItem('emailVerified');
    const verifiedEmail = sessionStorage.getItem('verifiedEmail');

    setTimeout(() => {
      const currentEmail = this.getEmailValue();

      if (emailVerified === 'true' && verifiedEmail && currentEmail) {
        const verifiedEmailNormalized = verifiedEmail.trim().toLowerCase();
        const currentEmailNormalized = currentEmail.trim().toLowerCase();

        if (verifiedEmailNormalized === currentEmailNormalized) {
          this.isEmailVerified = true;
        }
      }
    }, 1000);
  }

  getEmailValue(): string | null {
    const emailContactType = this.tiposDatoContactoObligatorios.find(t =>
      this.isEmailContact(t.detalle)
    );

    if (!emailContactType || !emailContactType.idTipoDatoContacto) {
      return null;
    }

    this.emailIdTipoDatoContacto = emailContactType.idTipoDatoContacto;
    const controlName = `contacto_${emailContactType.idTipoDatoContacto}`;
    return this.postulacionForm.get(controlName)?.value || null;
  }

  getNombrePostulante(): string {
    const primerNombre = this.postulacionForm.get('primerNombre')?.value || '';
    const segundoNombre = this.postulacionForm.get('segundoNombre')?.value || '';
    const primerApellido = this.postulacionForm.get('primerApellido')?.value || '';
    const segundoApellido = this.postulacionForm.get('segundoApellido')?.value || '';
    return `${primerNombre} ${segundoNombre} ${primerApellido} ${segundoApellido}`.trim() || 'Postulante';
  }

  requestEmailVerification(): void {
    const email = this.getEmailValue();

    if (!email) {
      this.toastService.showWarning('Por favor ingresa tu correo electrónico antes de verificar', 'Email requerido');
      return;
    }

    const emailControlName = `contacto_${this.emailIdTipoDatoContacto}`;
    const emailControl = this.postulacionForm.get(emailControlName);

    if (emailControl && emailControl.invalid) {
      emailControl.markAsTouched();
      this.toastService.showWarning('Por favor ingresa un correo electrónico válido', 'Email inválido');
      return;
    }

    const nombre = this.getNombrePostulante();
    if (nombre === 'Postulante') {
      this.toastService.showWarning('Por favor ingresa tu nombre y apellido antes de verificar el email', 'Datos incompletos');
      return;
    }

    this.showEmailVerificationModal = true;
  }

  onEmailVerified(): void {
    this.isEmailVerified = true;
    this.toastService.showSuccess('Tu correo electrónico ha sido verificado correctamente', 'Email verificado');

    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('emailVerified', 'true');
      sessionStorage.setItem('verifiedEmail', this.getEmailValue() || '');
      sessionStorage.setItem('verificationTimestamp', new Date().toISOString());
    }
  }

  private validateEmailVerification(): boolean {
    // TODO: Reactivar cuando el envío de email esté resuelto (cuenta SMTP / SPF-DKIM)
    // if (!this.isEmailVerified) {
    //   this.toastService.showError('Debes verificar tu correo electrónico antes de continuar con la postulación', 'Email no verificado');
    //   const emailElement = document.querySelector(`[formControlName="contacto_${this.emailIdTipoDatoContacto}"]`);
    //   if (emailElement) {
    //     emailElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    //   }
    //   return false;
    // }
    return true;
  }

  private async validateBeforeSubmit(): Promise<boolean> {
    if (!this.validateEmailVerification()) {
      return false;
    }
    return true;
  }
}
