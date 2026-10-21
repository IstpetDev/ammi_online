// Limita el input a 10 dígitos numéricos

import { Component, OnInit, inject, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, FormsModule } from '@angular/forms';
import {
  validarCedulaEcuatoriana,
  validarRucEcuatoriano,
  validarPasaporteEcuatoriano,
  getDocumentoPlaceholder,
  getDocumentoMaxLength,
  getDocumentoErrorMessage
} from '../../../../core/validators/documento-ecuatoriano.validator';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { TipoDocumentoDTO, GeneroDTO, EstadoCivilDTO, EtniaDTO, NacionalidadEtnicaDTO, PaisDTO, ProvinciaDTO, CantonDTO, ParroquiaDTO, CicloDTO, CursoDTO, TipoDatoContactoDTO, TipoOfertaDTO, RequisitosDTO, PostulacionesManualesDTO, DatosContactoPostulacionManualDTO, DocumentoPersonalDTO, TipoActividadEconomicaDTO, TipoDiscapacidadDTO, MallaDTO, ParaleloDTO } from '../../../../data/models/Entities';
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
  TipoDatoContactoService,
  TipoOfertaService,
  RequisitosService,
  PostulacionService,
  TipoActividadEconomicaService,
  TipoDiscapacidadService,
  MallaService,
  ParaleloService
} from '../../../../core/services/postulaciones';
import { PersonaService } from '../../../../core/services/postulaciones/persona.service';
import { PersonaInfoService } from '../../../../core/services/postulaciones/persona-info.service';
import { forkJoin, Observable } from 'rxjs';
import { PRIMENG_MODULES } from '../../../../shared/primeng-imports';
import { ConfirmationModalComponent } from '../../../../shared/modal-confirmation/confirmation-modal.component';
import { CustomSelectComponent } from '../../../../shared/custom-select/custom-select.component';
import { CustomSelectPlusComponent } from '../../../../shared/custom-select/custom-select-plus.component';
import { SharedToastComponent } from '../../../../shared/shared-toast/shared-toast.component';
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

interface AreaCodeOption {
  name: string;
  code: string;
}

@Component({
  selector: 'app-create-postulation-manual',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ConfirmationModalComponent, CustomSelectComponent, CustomSelectPlusComponent, ...PRIMENG_MODULES, SharedToastComponent],
  providers: [MessageService],
  templateUrl: './create-postulation-manual.component.html',
  styleUrls: ['./create-postulation-manual.component.css']
})
export class CreatePostulationManualComponent implements OnInit {
  // MessageService usando inject
  private messageService = inject(MessageService);

  @Input() idPersona: number | null = null;
  @Input() idPostulacion: number | null = null;
  /** Datos completos de la postulación existente (item[0] de GetPostulacionBy) */
  @Input() postulacionData: any = null;
  @Output() completed = new EventEmitter<void>();

  get isEditing(): boolean {
    return this.idPersona !== null && this.idPostulacion !== null;
  }

  /** IDs de tipos de contacto que ya existen en la postulación y están pre-cargados (deshabilitados) */
  contactosExistentesIds = new Set<number>();

  /** Variable para evitar que auto-guardemos un borrador vacío durante la carga inicial de datos */
  isInitialDataLoaded = false;

  currentStep = 1;
  postulacionForm!: FormGroup;

  steps: Step[] = [
    { id: 1, title: 'Datos Personales', icon: 'pi pi-user', completed: false, active: true },
    { id: 2, title: 'Contacto y Ayudas', icon: 'pi pi-phone', completed: false, active: false },
    { id: 3, title: 'Datos Académicos', icon: 'pi pi-graduation-cap', completed: false, active: false }
  ];

  // Datos para selects
  tiposDocumento: TipoDocumentoDTO[] = [];
  generos: GeneroDTO[] = [];
  estadosCiviles: EstadoCivilDTO[] = [];
  etnias: EtniaDTO[] = [];
  nacionalidadesEtnicas: NacionalidadEtnicaDTO[] = [];
  paises: PaisDTO[] = [];
  provincias: ProvinciaDTO[] = [];
  cantones: CantonDTO[] = [];
  parroquias: ParroquiaDTO[] = [];
  ciclos: CicloDTO[] = [];
  cursos: CursoDTO[] = [];
  tiposDatoContacto: TipoDatoContactoDTO[] = [];
  tiposDatoContactoObligatorios: TipoDatoContactoDTO[] = [];
  tiposDatoContactoOpcionales: TipoDatoContactoDTO[] = [];
  tiposOferta: TipoOfertaDTO[] = [];
  requisitos: RequisitosDTO[] = [];

  // Nuevos arrays para datos económicos y adicionales
  tiposActividadEconomica: TipoActividadEconomicaDTO[] = [];
  tiposDiscapacidad: TipoDiscapacidadDTO[] = [];

  // Mallas curriculares (se cargan dinámicamente desde el servicio)
  mallas: MallaDTO[] = [];

  // Paralelos disponibles
  paralelos: ParaleloDTO[] = [];

  selectedProvincia: ProvinciaDTO | null = null;
  selectedCanton: CantonDTO | null = null;
  selectedParroquia: ParroquiaDTO | null = null;

  // Contactos opcionales agregados
  contactosOpcionalesAgregados: TipoDatoContactoDTO[] = [];

  // Modal de confirmación
  showConfirmationModal: boolean = false;
  isSubmitting: boolean = false;
  modalTitle: string = '¿Desea crear esta postulación?';
  modalMessage: string = '';
  requisitosBloqueantes: RequisitosDTO[] = [];
  documentosFaltantes: RequisitosDTO[] = [];

  // Edad display
  ageDisplay: string | null = null;
  underAgeBlockedCourseName: string | null = null;

  // Getter para mallas disponibles (solo las que tienen detalle de malla configurado)
  get mallasDisponibles(): MallaDTO[] {
    return this.mallas.filter(malla => malla.tieneDetalleMalla === true);
  }

  // Verificar si todas las mallas están sin configurar
  get todasMallasSinConfigurar(): boolean {
    return this.mallas.length > 0 && this.mallas.every(malla => malla.tieneDetalleMalla === false);
  }

  // Archivos subidos para requisitos
  uploadedFiles: { [key: number]: File } = {};

  // Archivo de discapacidad
  archivoDiscapacidadFile: File | null = null;

  // Valores booleanos para requisitos de tipo BOOL
  booleanRequisitos: { [key: number]: boolean } = {};

  // Estado de drag and drop
  isDragOver: boolean = false;

  // Estados de accordion personalizado
  trabajaExpanded: boolean = false;
  discapacidadExpanded: boolean = false;

  // Propiedades para validación de documento
  documentoPlaceholder: string = 'Ingrese su documento';
  documentoMaxLength: number = 20;
  documentoErrorMessage: string = '';
  tipoDocumentoSeleccionado: string | null = null;

  // Códigos telefónicos internacionales
  countryDialOptions: CountryDialOption[] = [
    { name: 'Ecuador', dialCode: '+593', flag: '🇪🇨' }
  ];
  defaultCountryDialCode: string = '+593';
  conventionalAreaCodeOptions: AreaCodeOption[] = [
    { name: 'Azuay', code: '07' },
    { name: 'Bolívar', code: '03' },
    { name: 'Cañar', code: '07' },
    { name: 'Carchi', code: '06' },
    { name: 'Chimborazo', code: '03' },
    { name: 'Cotopaxi', code: '03' },
    { name: 'El Oro', code: '07' },
    { name: 'Esmeraldas', code: '06' },
    { name: 'Galápagos', code: '05' },
    { name: 'Guayas', code: '04' },
    { name: 'Imbabura', code: '06' },
    { name: 'Loja', code: '07' },
    { name: 'Los Ríos', code: '05' },
    { name: 'Manabí', code: '05' },
    { name: 'Morona Santiago', code: '07' },
    { name: 'Napo', code: '06' },
    { name: 'Orellana', code: '06' },
    { name: 'Pastaza', code: '03' },
    { name: 'Pichincha', code: '02' },
    { name: 'Santa Elena', code: '04' },
    { name: 'Santo Domingo de los Tsáchilas', code: '02' },
    { name: 'Sucumbíos', code: '06' },
    { name: 'Tungurahua', code: '03' },
    { name: 'Zamora Chinchipe', code: '07' }
  ];
  defaultConventionalAreaCode: string = '02';

  get uniqueConventionalAreaCodeOptions(): AreaCodeOption[] {
    const seen = new Set<string>();
    return this.conventionalAreaCodeOptions.filter(item => {
      if (seen.has(item.code)) {
        return false;
      }
      seen.add(item.code);
      return true;
    });
  }

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
    private requisitosService: RequisitosService,
    private postulacionService: PostulacionService,
    private tipoActividadEconomicaService: TipoActividadEconomicaService,
    private tipoDiscapacidadService: TipoDiscapacidadService,
    private mallaService: MallaService,
    private paraleloService: ParaleloService,
    private router: Router,
    private personaService: PersonaService,
    private personaInfoService: PersonaInfoService
  ) { }

  private readonly SESSION_KEY = 'postulacion_manual_form';
  private get EDITING_DRAFT_KEY(): string {
    return `postulacion_manual_editing_${this.idPersona ?? 'unknown'}`;
  }

  ngOnInit(): void {
    this.initializeForm();
    if (!this.isEditing) {
      this.restoreFormFromSession();
    }
    this.loadCountryDialOptions();
    this.loadInitialData();

    if (this.isEditing) {
      setTimeout(() => {
        this.cargarDatosPersonaExistente();
      }, 500);
    }

    this.postulacionForm.valueChanges.subscribe(() => {
      if (!this.isEditing) {
        this.saveFormToSession();
      } else {
        // En modo edición solo guardamos si ya se cargaron los datos iniciales
        if (this.isInitialDataLoaded) {
          this.saveEditingDraft();
        }
      }
    });
  }

  private cargarDatosPersonaExistente(): void {
    if (!this.idPersona) return;

    // 1. Cargar datos desde la API
    forkJoin({
      personas: this.personaService.getPersonaByIdPersona(this.idPersona),
      personaInfo: this.personaInfoService.getByPersona(this.idPersona)
    }).subscribe({
      next: ({ personas, personaInfo }) => {
        const persona = Array.isArray(personas) ? personas[0] : personas;
        if (!persona) {
          this.isInitialDataLoaded = true;
          return;
        }

        const documentoValue = persona.documento ?? '';

        // 2. Poblar datos básicos del sistema desde la API
        this.postulacionForm.patchValue({
          idTipoDocumento: persona.idTipoDocumento ?? '',
          documento: documentoValue,
          idGenero: persona.idGenero ?? '',
          primerNombre: (persona.primerNombre ?? '').toUpperCase(),
          segundoNombre: (persona.segundoNombre ?? '').toUpperCase(),
          primerApellido: (persona.primerApellido ?? '').toUpperCase(),
          segundoApellido: (persona.segundoApellido ?? '').toUpperCase(),
          fechaNacimiento: personaInfo?.fechaNacimiento
            ? new Date(personaInfo.fechaNacimiento).toISOString().split('T')[0]
            : '',
          idEstadoCivil: personaInfo?.idEstadoCivil ?? '',
          idNacionalidadEtnica: personaInfo?.idNacionalidadEtnica ?? ''
        });

        if (persona.idTipoDocumento) this.onTipoDocumentoChange(persona.idTipoDocumento);
        // Re-setear documento porque onTipoDocumentoChange lo limpia
        this.postulacionForm.patchValue({ documento: documentoValue });

        // 3. Si existe un borrador guardado en localStorage, aplicarlo encima del formulario
        // de forma que si el usuario modificó manualmente campos como el género o dirección, se mantengan sus cambios.
        this.loadEditingDraft();

        // 4. Pre-cargar contactos existentes de la postulación
        this.preCargarContactosExistentes();

        // Habilitar el auto-guardado en localStorage para cambios futuros
        setTimeout(() => {
          this.isInitialDataLoaded = true;
        }, 100);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los datos de la persona', life: 3000 });
        this.loadEditingDraft();
        this.preCargarContactosExistentes();
        this.isInitialDataLoaded = true;
      }
    });
  }



  /**
   * Pre-carga los datos de contacto existentes desde postulacionData.personasimple.pcontacto
   * y los deshabilita para evitar edición/duplicación.
   * Se reintenta hasta 5 veces con 300ms de espera si los controles aún no existen.
   */
  private preCargarContactosExistentes(intento: number = 0): void {
    const pcontacto: any[] = this.postulacionData?.personasimple?.pcontacto;
    if (!pcontacto || !Array.isArray(pcontacto) || pcontacto.length === 0) return;

    // Verificar que los controles de contacto ya existen (creados por loadContactControls)
    const primeraId = pcontacto[0]?.idTipoDatoContacto ?? pcontacto[0]?.tipocontacto?.idTipoDatoContacto;
    const primerControl = primeraId ? this.postulacionForm.get(`contacto_${primeraId}`) : null;

    if (!primerControl && intento < 5) {
      // Controles aún no creados, reintentar en 300ms
      setTimeout(() => this.preCargarContactosExistentes(intento + 1), 300);
      return;
    }

    this.contactosExistentesIds.clear();

    pcontacto.forEach((contacto: any) => {
      const idTipo: number | undefined = contacto?.idTipoDatoContacto ?? contacto?.tipocontacto?.idTipoDatoContacto;
      const detalle: string = (contacto?.detalle ?? '').trim();
      if (!idTipo || !detalle) return;

      const controlName = `contacto_${idTipo}`;
      const control = this.postulacionForm.get(controlName);

      if (control) {
        // Parchear valor y deshabilitar
        control.setValue(detalle, { emitEvent: false });
        control.disable({ emitEvent: false });
        this.contactosExistentesIds.add(idTipo);

        // Si hay control de confirmación de correo, también rellenarlo y deshabilitarlo
        const confirmName = this.getEmailConfirmationControlName(idTipo);
        const confirmControl = this.postulacionForm.get(confirmName);
        if (confirmControl) {
          confirmControl.setValue(detalle, { emitEvent: false });
          confirmControl.disable({ emitEvent: false });
        }

        // Si hay prefijo de teléfono, no modificarlo (mantener valor por defecto)
      }
    });
  }

  private saveFormToSession(): void {
    try {
      const raw = this.postulacionForm.getRawValue();
      sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(raw));
    } catch { }
  }

  private restoreFormFromSession(): void {
    try {
      const saved = sessionStorage.getItem(this.SESSION_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        this.postulacionForm.patchValue(data, { emitEvent: false });

        const idTipoOferta = data.idTipoOferta;
        if (idTipoOferta) {
          this.postulacionForm.get('idMalla')?.setValue('');
          this.mallas = [];
          this.mallaService.getMallasByTipoOferta(+idTipoOferta).subscribe({
            next: (mallas) => this.mallas = mallas,
            error: () => this.mallas = []
          });
        }
      }
    } catch { }
  }

  private clearFormSession(): void {
    try {
      sessionStorage.removeItem(this.SESSION_KEY);
    } catch { }
  }

  /** Guarda el borrador del formulario en localStorage (modo edición) */
  private saveEditingDraft(): void {
    try {
      const raw = this.postulacionForm.getRawValue();
      localStorage.setItem(this.EDITING_DRAFT_KEY, JSON.stringify(raw));
    } catch { }
  }

  /** Carga el borrador del formulario desde localStorage (modo edición) */
  private loadEditingDraft(): boolean {
    try {
      const saved = localStorage.getItem(this.EDITING_DRAFT_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        
        // Verificar si el borrador realmente contiene datos útiles modificados por el usuario
        // y no es solo el objeto vacío inicial.
        const tieneDatosUtiles = 
          (data.primerNombre && data.primerNombre.trim() !== '') ||
          (data.documento && data.documento.trim() !== '') ||
          (data.idMalla && data.idMalla !== '') ||
          (data.idTipoOferta && data.idTipoOferta !== '') ||
          data.trabaja === true ||
          data.tieneDiscapacidad === true ||
          (data.direccionDomiciliaria && data.direccionDomiciliaria.trim() !== '');

        if (tieneDatosUtiles) {
          this.postulacionForm.patchValue(data, { emitEvent: false });
          return true;
        }
      }
    } catch { }
    return false;
  }

  /** Elimina el borrador del localStorage al completar exitosamente */
  private clearEditingDraft(): void {
    try {
      localStorage.removeItem(this.EDITING_DRAFT_KEY);
    } catch { }
  }

  /**
   * Restaura del borrador (localStorage) SOLO los campos que el admin ingresó manualmente:
   * ubicación, datos académicos y datos económicos.
   * Los datos de persona (nombre, documento, etc.) siempre vienen de la API y NO se restauran del draft.
   */
  private restoreEditingDraftForManualFields(): void {
    try {
      const saved = localStorage.getItem(this.EDITING_DRAFT_KEY);
      if (!saved) return;
      const data = JSON.parse(saved);

      // Campos de ubicación/domicilio (el admin puede haber completado algunos)
      const camposUbicacion = ['idPais', 'idProvincia', 'idCanton', 'idParroquia', 'nacio', 'direccionDomiciliaria'];
      // Campos académicos
      const camposAcademicos = ['idTipoOferta', 'idMalla', 'idParalelo'];
      // Campos económicos/ayudas
      const camposEconomicos = ['trabaja', 'idTipoActividadEconomica', 'esPrincipal', 'activo',
        'tieneDiscapacidad', 'porcentaje', 'recomendaciones', 'idTipoDiscapacidad'];
      // Etnia (puede no estar en la API)
      const camposEtnia = ['idEtnia'];

      const camposARestaurar = [...camposUbicacion, ...camposAcademicos, ...camposEconomicos, ...camposEtnia];

      const parche: any = {};
      for (const campo of camposARestaurar) {
        if (data[campo] !== undefined && data[campo] !== null && data[campo] !== '') {
          parche[campo] = data[campo];
        }
      }

      if (Object.keys(parche).length > 0) {
        this.postulacionForm.patchValue(parche, { emitEvent: false });

        // Si hay tipo de oferta en el draft, recargar las mallas
        if (parche.idTipoOferta) {
          this.mallaService.getMallasByTipoOferta(+parche.idTipoOferta).subscribe({
            next: (mallas) => {
              this.mallas = mallas;
            },
            error: () => this.mallas = []
          });
        }
      }
    } catch { }
  }

  onPhoneInput(event: any, detalle?: string): void {
    const input = event.target as HTMLInputElement;
    if (input) {
      let value = input.value.replace(/[^0-9]/g, '');
      const maxLength = this.getPhoneMaxLength(detalle);
      if (value.length > maxLength) {
        value = value.slice(0, maxLength);
      }
      input.value = value;
    }
  }

  getPhoneMaxLength(detalle: string | undefined): number {
    return this.isConventionalPhoneContact(detalle) ? 7 : 10;
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
    } catch {
      // Si la API falla, se mantiene el valor por defecto de Ecuador
    }
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

  private initializeForm(): void {
    this.postulacionForm = this.fb.group({
      // Paso 1: Datos Personales
      idTipoDocumento: ['', Validators.required],
      documento: ['', [Validators.required, this.documentoValidator.bind(this)]],
      idGenero: ['', Validators.required],
      primerNombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50), this.uppercaseValidator]],
      segundoNombre: ['', [Validators.minLength(2), Validators.maxLength(50), this.uppercaseValidator]],
      primerApellido: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50), this.uppercaseValidator]],
      segundoApellido: ['', [Validators.minLength(2), Validators.maxLength(50), this.uppercaseValidator]],
      fechaNacimiento: ['', [Validators.required, this.fechaNacimientoValidator.bind(this)]],
      idEstadoCivil: ['', Validators.required],
      idEtnia: ['', Validators.required],
      idNacionalidadEtnica: ['', Validators.required],
      idPais: ['', Validators.required],
      idProvincia: ['', Validators.required],
      idCanton: ['', Validators.required],
      idParroquia: ['', Validators.required],
      nacio: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150), this.uppercaseValidator]],
      direccionDomiciliaria: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(200), this.uppercaseValidator]],

      // Paso 2: Datos de Contacto (se agregarán dinámicamente)
      // contactos: this.fb.array([]),

      //Paso 3: Datos de Ayuda Económica
      trabaja: [false],
      idTipoActividadEconomica: [''],
      esPrincipal: [true],
      activo: [true],
      tieneDiscapacidad: [false],
      porcentaje: ['', [Validators.min(1), Validators.max(100)]],
      recomendaciones: ['', [Validators.maxLength(500), this.uppercaseValidator]],
      idTipoDiscapacidad: [''],
      archivoDiscapacidad: [''],
      // Paso 4: Datos Académicos
      idTipoOferta: ['', Validators.required],
      idMalla: ['', Validators.required],
      idParalelo: [1], // Valor fijo

      // Paso 5: Documentación
      documentos: this.fb.array([])
    });

    // Inicialmente deshabilitado hasta que la etnia sea indígena
    this.postulacionForm.get('idNacionalidadEtnica')?.disable({ emitEvent: false });

    // Suscribirse a cambios para mostrar/ocultar campos
    this.postulacionForm.get('idTipoDocumento')?.valueChanges.subscribe(value => {
      this.onTipoDocumentoChange(value);
    });

    // Etnia subscription will be set up after data is loaded
    // this.postulacionForm.get('idEtnia')?.valueChanges.subscribe(value => {
    //   this.onEtniaChange(value);
    // });

    this.postulacionForm.get('fechaNacimiento')?.valueChanges.subscribe(value => {
      this.calculateAge(value);
      this.handleAgeDependentRules();
    });

    this.postulacionForm.get('trabaja')?.valueChanges.subscribe(value => {
      this.onTrabajaChange(value);
    });

    this.postulacionForm.get('idTipoActividadEconomica')?.valueChanges.subscribe(value => {
      // Track changes for tipo actividad economica
    });

    this.postulacionForm.get('tieneDiscapacidad')?.valueChanges.subscribe(value => {
      this.onTieneDiscapacidadChange(value);
    });

    // Agregar validadores condicionales
    this.setupConditionalValidators();
  }

  private setupConditionalValidators(): void {
    // Tipo de actividad económica NO bloquea flujo (sin required)
    this.postulacionForm.get('trabaja')?.valueChanges.subscribe(() => {
      const actividadControl = this.postulacionForm.get('idTipoActividadEconomica');
      actividadControl?.clearValidators();
      actividadControl?.updateValueAndValidity();
    });

    // Validador condicional para tipo de discapacidad
    this.postulacionForm.get('tieneDiscapacidad')?.valueChanges.subscribe(tieneDiscapacidad => {
      const discapacidadControl = this.postulacionForm.get('idTipoDiscapacidad');
      if (tieneDiscapacidad) {
        discapacidadControl?.setValidators([Validators.required]);
      } else {
        discapacidadControl?.clearValidators();
      }
      discapacidadControl?.updateValueAndValidity();
    });
  }

  private loadInitialData(): void {
    // Cargar datos iniciales con manejo de errores silencioso
    this.tipoDocumentoService.getTiposDocumento().subscribe({
      next: (data) => {
        this.tiposDocumento = data;
        // Pre-poblar con el primer tipo de documento
        if (data && data.length > 0) {
          this.postulacionForm.patchValue({ idTipoDocumento: data[0].idTipoDocumento });
        }
      },
      error: () => { } // Silenciar errores
    });
    this.generoService.getGeneros().subscribe({
      next: (data) => {
        this.generos = data;
        // Pre-poblar con el primer género
        if (data && data.length > 0) {
          this.postulacionForm.patchValue({ idGenero: data[0].idGenero });
        }
      },
      error: () => { }
    });
    this.estadoCivilService.getEstadosCiviles().subscribe({
      next: (data) => {
        this.estadosCiviles = data;
        // Pre-poblar con el primer estado civil
        if (data && data.length > 0) {
          this.postulacionForm.patchValue({ idEstadoCivil: data[0].idEstadoCivil });
        }
      },
      error: () => { }
    });
    this.etniaService.getEtnias().subscribe({
      next: (data) => {
        this.etnias = data;
        // Pre-poblar con el primer etnia (excepto como pidió el usuario)
        // El usuario dijo "excepto etnia", así que no pre-poblamos etnia
        // Set up etnia change subscription after data is loaded
        this.setupEtniaSubscription();
      },
      error: () => { }
    });
    this.paisService.getPaises().subscribe({
      next: (data) => {
        this.paises = data;
        // Pre-poblar con Ecuador por defecto
        const ecuador = data.find(p => p.nombre?.toLowerCase().includes('ecuador'));
        if (ecuador && ecuador.idPais) {
          this.postulacionForm.patchValue({ idPais: ecuador.idPais });
          // Cargar las provincias de Ecuador para que estén disponibles
          this.provinciaService.getProvinciasByPais(ecuador.idPais).subscribe({
            next: (provincias) => {
              this.provincias = provincias;
              // Para Ecuador, NO preseleccionar automáticamente
              // El usuario debe elegir manualmente
            },
            error: () => { }
          });
        }
      },
      error: () => { }
    });
    this.cicloService.getAll().subscribe({
      next: (data) => this.ciclos = data,
      error: () => { }
    });

    this.tipoOfertaService.getTiposOferta().subscribe({
      next: (data) => {
        this.tiposOferta = data;
        if (data.length > 0 && !this.postulacionForm.get('idTipoOferta')?.value) {
          const first = data[0];
          const id = first.idtipoOferta;
          if (id != null) {
            this.postulacionForm.patchValue({ idTipoOferta: id }, { emitEvent: false });
            this.onTipoOfertaChange(+id);
          }
        }
      },
      error: () => { }
    });

    this.tipoDatoContactoService.getTiposDatoContacto().subscribe({
      next: (data) => {
        this.tiposDatoContacto = data;
        // Filtrar contactos según el campo esObligatorio de la base de datos
        this.tiposDatoContactoObligatorios = data.filter(t => t.esObligatorio === true);
        this.tiposDatoContactoOpcionales = data.filter(t => t.esObligatorio === false || t.esObligatorio === undefined);
        this.loadContactControls();
      },
      error: () => { }
    });

    // Cargar nuevos datos para ayudas económicas
    this.tipoActividadEconomicaService.getTiposActividadEconomica().subscribe({
      next: (data) => {
        this.tiposActividadEconomica = data;
      },
      error: () => { }
    });
    this.tipoDiscapacidadService.getTiposDiscapacidad().subscribe({
      next: (data) => this.tiposDiscapacidad = data,
      error: () => { }
    });

    // Cargar paralelos
    this.paraleloService.getParalelos().subscribe({
      next: (data) => this.paralelos = data,
      error: () => { }
    });

    // Suscribirse a cambios en el tipo de oferta para cargar mallas
    this.setupTipoOfertaSubscription();
    // Suscribirse a cambios en la malla para cargar requisitos
    this.setupMallaSubscription();
  }

  private setupTipoOfertaSubscription(): void {
    this.postulacionForm.get('idTipoOferta')?.valueChanges.subscribe(idTipoOferta => {
      if (idTipoOferta) {
        this.onTipoOfertaChange(idTipoOferta);
      } else {
        this.mallas = [];
        this.postulacionForm.get('idMalla')?.setValue('');
      }
    });
  }

  private setupMallaSubscription(): void {
    this.postulacionForm.get('idMalla')?.valueChanges.subscribe(idMalla => {
      if (idMalla) {
        this.onMallaChange(+idMalla);
      } else {
        this.clearRequisitosState();
      }
    });
  }

  private onMallaChange(idMalla: number): void {
    this.validateMallaByAge(idMalla);
  }

  private validateMallaByAge(idMalla: number): void {
    if (!this.isMinorAge) {
      this.underAgeBlockedCourseName = null;
      this.loadRequisitos();
      return;
    }

    this.requisitosService.getRequisitosByMalla(idMalla).subscribe({
      next: (requisitos) => {
        const bloqueaPorMayorEdad = requisitos.some(req => req.esMayorEdad === true && req.bloqueaInscripcion === true);

        if (bloqueaPorMayorEdad) {
          const mallaSeleccionada = this.mallas.find(m => m.idMalla == idMalla);
          const nombreCurso = mallaSeleccionada?.detalle || 'el curso seleccionado';

          this.underAgeBlockedCourseName = null;
          this.showMessage(
            'info',
            'Excepción por edad (Administrador)',
            `El curso "${nombreCurso}" requiere mayoría de edad, pero como administrador se permite asignar la matrícula por excepción.`
          );
        } else {
          this.underAgeBlockedCourseName = null;
        }

        this.setRequisitos(requisitos);
      },
      error: () => {
        this.showMessage('error', 'Error', 'No se pudieron validar los requisitos del curso seleccionado');
        this.postulacionForm.get('idMalla')?.setValue('', { emitEvent: false });
        this.clearRequisitosState();
      }
    });
  }

  onTipoOfertaChange(idTipoOferta: number): void {
    // Limpiar el campo de malla si ya había algo seleccionado
    this.postulacionForm.get('idMalla')?.setValue('');

    // Limpiar mallas actuales
    this.mallas = [];

    if (!idTipoOferta) {
      return;
    }

    // Cargar mallas por tipo de oferta desde el backend
    this.mallaService.getMallasByTipoOferta(idTipoOferta).subscribe({
      next: (data) => {
        this.mallas = data;
      },
      error: (err) => {
        this.showMessage('error', 'Error', 'No se pudieron cargar las mallas curriculares');
        this.mallas = [];
      }
    });
  }

  private setupEtniaSubscription(): void {
    this.postulacionForm.get('idEtnia')?.valueChanges.subscribe(value => {
      this.onEtniaChange(value);
    });
  }

  /**
   * Validador personalizado para documento ecuatoriano
   */
  private documentoValidator(control: AbstractControl): ValidationErrors | null {
    const documento = control.value;
    if (!documento) {
      return null; // El required se maneja por separado
    }

    if (!this.tipoDocumentoSeleccionado) {
      return null; // Si no hay tipo seleccionado, no validar formato específico
    }

    const tipoNombre = this.tipoDocumentoSeleccionado.toUpperCase();

    switch (tipoNombre) {
      case 'CEDULA':
      case 'CÉDULA':
      case 'CEDULA DE IDENTIDAD':
      case 'CÉDULA DE IDENTIDAD':
        if (!validarCedulaEcuatoriana(documento)) {
          return { documentoInvalido: { message: 'La cédula ecuatoriana no es válida. Debe tener 10 dígitos.' } };
        }
        break;

      case 'RUC':
        if (!validarRucEcuatoriano(documento)) {
          return { documentoInvalido: { message: 'El RUC ecuatoriano no es válido. Debe tener 13 dígitos.' } };
        }
        break;

      case 'PASAPORTE':
        if (!validarPasaporteEcuatoriano(documento)) {
          return { documentoInvalido: { message: 'El pasaporte no tiene un formato válido.' } };
        }
        break;

      default:
        // Para otros tipos de documento, validar que solo contenga caracteres alfanuméricos
        if (!/^[A-Z0-9]+$/i.test(documento)) {
          return { documentoInvalido: { message: 'El documento solo debe contener letras y números.' } };
        }
    }

    return null;
  }

  /**
   * Manejador de cambio de tipo de documento
   */
  onTipoDocumentoChange(idTipoDocumento: number | string): void {
    // Buscar el tipo de documento seleccionado
    const tipoDoc = this.tiposDocumento.find(t => t.idTipoDocumento == idTipoDocumento);
    this.tipoDocumentoSeleccionado = tipoDoc?.nombre || null;

    // Actualizar placeholder y maxlength según el tipo
    this.documentoPlaceholder = getDocumentoPlaceholder(this.tipoDocumentoSeleccionado);
    this.documentoMaxLength = getDocumentoMaxLength(this.tipoDocumentoSeleccionado);
    this.documentoErrorMessage = getDocumentoErrorMessage(this.tipoDocumentoSeleccionado);

    // Limpiar el campo de documento si cambia el tipo
    const documentoControl = this.postulacionForm.get('documento');
    if (documentoControl) {
      documentoControl.setValue('');
      documentoControl.updateValueAndValidity();
    }
  }

  /**
   * Obtener el mensaje de error del documento
   */
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

  onExtranjeroChange(esExtranjero: boolean): void {
    const paisControl = this.postulacionForm.get('idPais');
    const provinciaControl = this.postulacionForm.get('idProvincia');
    const cantonControl = this.postulacionForm.get('idCanton');
    const parroquiaControl = this.postulacionForm.get('idParroquia');

    if (esExtranjero) {
      // Si es extranjero, solo requiere país
      paisControl?.setValidators(Validators.required);
      provinciaControl?.clearValidators();
      cantonControl?.clearValidators();
      parroquiaControl?.clearValidators();

      // Habilitar selección de país
      paisControl?.enable();

      // Limpiar valores
      this.postulacionForm.patchValue({
        idPais: '',
        idProvincia: '',
        idCanton: '',
        idParroquia: ''
      });
      this.provincias = [];
      this.cantones = [];
      this.parroquias = [];
    } else {
      // Si es ecuatoriano, autocolocar Ecuador y requerir provincia y cantón
      const ecuador = this.paises.find(p => p.esEcuador);
      if (ecuador) {
        paisControl?.setValue(ecuador.idPais);
        paisControl?.disable();
        this.onPaisChange();
      }

      provinciaControl?.setValidators(Validators.required);
      cantonControl?.setValidators(Validators.required);
      parroquiaControl?.clearValidators();
    }

    // Actualizar validadores
    paisControl?.updateValueAndValidity();
    provinciaControl?.updateValueAndValidity();
    cantonControl?.updateValueAndValidity();
    parroquiaControl?.updateValueAndValidity();
  }

  onEtniaChange(etniaId: number | string): void {
    const nacionalidadControl = this.postulacionForm.get('idNacionalidadEtnica');
    if (!nacionalidadControl) return;

    if (!etniaId) {
      // No limpiar el id, solo deshabilitar
      nacionalidadControl.clearValidators();
      nacionalidadControl.disable();
      nacionalidadControl.updateValueAndValidity();
      return;
    }

    const etniaSeleccionada = this.etnias.find(e => e.idEtnia == etniaId);
    const etniaNombre = (etniaSeleccionada?.nombre || '').toLowerCase();
    const esIndigena = etniaNombre.includes('indígena') || etniaNombre.includes('indigena');

    const id = typeof etniaId === 'string' ? parseInt(etniaId, 10) : etniaId;

    // Buscar nacionalidades de la etnia seleccionada y autocolocar
    this.nacionalidadEtnicaService.getNacionalidadesEtnicasByEtnia(id).subscribe({
      next: (data) => {
        this.nacionalidadesEtnicas = data;

        if (esIndigena) {
          // Solo para indígena: habilitado y requerido
          nacionalidadControl.enable();
          nacionalidadControl.setValidators(Validators.required);

          // Autocolocar primera opción disponible
          if (data && data.length > 0) {
            const valorAAsignar = (data[0] as any).idnacionalidadEtnica;
            nacionalidadControl.setValue(valorAAsignar);
            nacionalidadControl.markAsDirty();
            nacionalidadControl.markAsTouched();
          }
        } else {
          // No indígena: autocolocar "No aplica" y deshabilitar
          nacionalidadControl.clearValidators();
          const noAplica = data.find(item => item.esNinguna === true);
          if (noAplica && noAplica.idnacionalidadEtnica != null) {
            nacionalidadControl.setValue(noAplica.idnacionalidadEtnica, { emitEvent: false });
          } else if (data && data.length > 0) {
            const valorAAsignar = (data[0] as any).idnacionalidadEtnica;
            nacionalidadControl.setValue(valorAAsignar, { emitEvent: false });
          }
          nacionalidadControl.disable();
        }

        nacionalidadControl.updateValueAndValidity();
      },
      error: () => {
        if (esIndigena) {
          nacionalidadControl.enable();
          nacionalidadControl.setValidators(Validators.required);
        } else {
          nacionalidadControl.clearValidators();
          nacionalidadControl.disable();
        }
        nacionalidadControl.updateValueAndValidity();
      }
    });
  }

  onCursoChange(idCurso: number | undefined): void {
    this.loadRequisitos();
  }

  onTrabajaChange(trabaja: boolean): void {
    if (trabaja && this.isMinorAge) {
      this.postulacionForm.patchValue({ trabaja: false }, { emitEvent: false });
      this.showMessage('warn', 'Restricción por edad', 'Si el estudiante es menor de 18 años no puede marcar que trabaja.');
      trabaja = false;
    }

    const actividadControl = this.postulacionForm.get('idTipoActividadEconomica');
    const esPrincipalControl = this.postulacionForm.get('esPrincipal');
    const activoControl = this.postulacionForm.get('activo');

    if (!trabaja) {
      actividadControl?.clearValidators();
      esPrincipalControl?.clearValidators();
      activoControl?.clearValidators();

      // Limpiar valores
      this.postulacionForm.patchValue({
        idTipoActividadEconomica: '',
        esPrincipal: true,
        activo: true
      });
    }

    actividadControl?.updateValueAndValidity();
    esPrincipalControl?.updateValueAndValidity();
    activoControl?.updateValueAndValidity();
  }

  onTieneDiscapacidadChange(tieneDiscapacidad: boolean): void {
    const tipoDiscapacidadControl = this.postulacionForm.get('idTipoDiscapacidad');
    const porcentajeControl = this.postulacionForm.get('porcentaje');

    if (tieneDiscapacidad) {
      tipoDiscapacidadControl?.setValidators(Validators.required);
      porcentajeControl?.setValidators([Validators.required, Validators.min(1), Validators.max(100)]);
    } else {
      tipoDiscapacidadControl?.clearValidators();
      porcentajeControl?.clearValidators();

      // Limpiar valores
      this.postulacionForm.patchValue({
        idTipoDiscapacidad: '',
        porcentaje: '',
        archivoDiscapacidad: '',
        recomendaciones: ''
      });
    }

    tipoDiscapacidadControl?.updateValueAndValidity();
    porcentajeControl?.updateValueAndValidity();
  }

  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Guardar el archivo completo
      this.archivoDiscapacidadFile = file;
      // Guardar el nombre del archivo como string en el formulario
      this.postulacionForm.patchValue({
        archivoDiscapacidad: file.name
      });
    } else {
      this.archivoDiscapacidadFile = null;
      this.postulacionForm.patchValue({
        archivoDiscapacidad: ''
      });
    }
  }

  private loadRequisitos(): void {
    const idMallaValue = this.postulacionForm.get('idMalla')?.value;
    const idMalla = idMallaValue ? +idMallaValue : undefined;

    if (idMalla) {
      this.requisitosService.getRequisitosByMalla(idMalla).subscribe({
        next: (requisitos) => {
          this.setRequisitos(requisitos);
        },
        error: (err) => { }
      });
    } else {
      this.clearRequisitosState();
    }
  }

  private setRequisitos(requisitos: RequisitosDTO[]): void {
    this.requisitos = requisitos;
    this.booleanRequisitos = {};

    this.requisitos.forEach(req => {
      if (req.tipoDato === 'BOOL' && req.idRequisitos) {
        this.booleanRequisitos[req.idRequisitos] = false;
      }
    });
  }

  private clearRequisitosState(): void {
    this.requisitos = [];
    this.booleanRequisitos = {};
  }

  private combineRequisitos(tipoOfertaReqs: RequisitosDTO[], cursoReqs: RequisitosDTO[]): void {
    // Combinar y eliminar duplicados por idRequisitos
    const combined = [...tipoOfertaReqs, ...cursoReqs];
    const unique = combined.filter((req, index, self) =>
      index === self.findIndex(r => r.idRequisitos === req.idRequisitos)
    );
    this.requisitos = unique;
  }

  onPaisChange(): void {
    const paisId = this.postulacionForm.get('idPais')?.value;
    if (paisId) {
      // Verificar si el país seleccionado es Ecuador
      const paisSeleccionado = this.paises.find(p => p.idPais == paisId);
      const esEcuador = paisSeleccionado?.nombre?.toLowerCase().includes('ecuador');

      this.provinciaService.getProvinciasByPais(paisId).subscribe({
        next: (data) => {
          this.provincias = data;
          // Clear selections
          this.postulacionForm.patchValue({ idProvincia: '', idCanton: '', idParroquia: '' });
          this.cantones = [];
          this.parroquias = [];
          // Clear selected for autocomplete
          this.selectedProvincia = null;
          this.selectedCanton = null;
          this.selectedParroquia = null;

          // Si NO es Ecuador, preseleccionar automáticamente la primera provincia
          if (!esEcuador && data && data.length > 0) {
            const primeraProvincia = data[0];
            if (primeraProvincia && primeraProvincia.idProvincia) {
              this.selectedProvincia = primeraProvincia;
              this.postulacionForm.patchValue({ idProvincia: primeraProvincia.idProvincia });

              // Cargar cantones de la primera provincia
              this.cantonService.getCantonesByProvincia(primeraProvincia.idProvincia).subscribe({
                next: (cantonesData) => {
                  this.cantones = cantonesData;
                  if (cantonesData && cantonesData.length > 0) {
                    const primerCanton = cantonesData[0];
                    if (primerCanton && primerCanton.idCanton) {
                      this.selectedCanton = primerCanton;
                      this.postulacionForm.patchValue({ idCanton: primerCanton.idCanton });

                      // Cargar parroquias del primer cantón
                      this.parroquiaService.getParroquiasByCanton(primerCanton.idCanton).subscribe({
                        next: (parroquiasData) => {
                          this.parroquias = parroquiasData;
                          if (parroquiasData && parroquiasData.length > 0) {
                            const primeraParroquia = parroquiasData[0];
                            if (primeraParroquia && primeraParroquia.idParroquia) {
                              this.selectedParroquia = primeraParroquia;
                              this.postulacionForm.patchValue({ idParroquia: primeraParroquia.idParroquia });
                            }
                          }
                        },
                        error: () => { }
                      });
                    }
                  }
                },
                error: () => { }
              });
            }
          }
        },
        error: () => { }
      });
    }
  }

  onProvinciaChange(): void {
    const provinciaId = this.postulacionForm.get('idProvincia')?.value;
    if (provinciaId) {
      // Setear selectedProvincia
      this.selectedProvincia = this.provincias.find(p => p.idProvincia == provinciaId) || null;

      this.cantonService.getCantonesByProvincia(provinciaId).subscribe({
        next: (data) => {
          this.cantones = data;
          this.postulacionForm.patchValue({ idCanton: '', idParroquia: '' });
          this.parroquias = [];
          this.selectedCanton = null;
          this.selectedParroquia = null;
        },
        error: () => { }
      });
    } else {
      this.selectedProvincia = null;
      this.selectedCanton = null;
      this.selectedParroquia = null;
      this.cantones = [];
      this.parroquias = [];
      this.postulacionForm.patchValue({ idCanton: '', idParroquia: '' });
    }
  }

  onCantonChange(): void {
    const cantonId = this.postulacionForm.get('idCanton')?.value;
    if (cantonId) {
      // Setear selectedCanton
      this.selectedCanton = this.cantones.find(c => c.idCanton == cantonId) || null;

      this.parroquiaService.getParroquiasByCanton(cantonId).subscribe({
        next: (data) => {
          this.parroquias = data;
          this.postulacionForm.patchValue({ idParroquia: '' });
          this.selectedParroquia = null;
        },
        error: () => { }
      });
    } else {
      this.selectedCanton = null;
      this.selectedParroquia = null;
      this.parroquias = [];
      this.postulacionForm.patchValue({ idParroquia: '' });
    }
  }

  onProvinciaChangeFromSelect(provinciaId: number): void {
    this.postulacionForm.patchValue({ idProvincia: provinciaId, idCanton: '', idParroquia: '' });
    this.cantones = [];
    this.parroquias = [];
    this.selectedCanton = null;
    this.selectedParroquia = null;
    if (provinciaId) {
      this.cantonService.getCantonesByProvincia(provinciaId).subscribe({
        next: (data) => this.cantones = data,
        error: () => { }
      });
    }
  }

  onCantonChangeFromSelect(cantonId: number): void {
    this.postulacionForm.patchValue({ idCanton: cantonId, idParroquia: '' });
    this.parroquias = [];
    this.selectedParroquia = null;
    if (cantonId) {
      this.parroquiaService.getParroquiasByCanton(cantonId).subscribe({
        next: (data) => this.parroquias = data,
        error: () => { }
      });
    }
  }

  onParroquiaChange(): void {
    const parroquiaId = this.postulacionForm.get('idParroquia')?.value;
    if (parroquiaId) {
      // Setear selectedParroquia
      this.selectedParroquia = this.parroquias.find(p => p.idParroquia == parroquiaId) || null;
    } else {
      this.selectedParroquia = null;
    }
  }

  private calculateAge(fechaNacimiento: string): void {
    if (!fechaNacimiento) {
      this.ageDisplay = null;
      return;
    }

    const birthDate = new Date(fechaNacimiento);
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

    if (years > 1 && years < 99) {
      this.ageDisplay = `${years} años, ${months} meses y ${days} días`;
    } else {
      this.ageDisplay = null;
    }
  }

  setStep(stepId: number): void {
    if (stepId <= this.getMaxAccessibleStep()) {
      this.currentStep = stepId;
      this.updateStepsState();
    }
  }

  nextStep(): void {
    if (this.validateCurrentStep()) {
      if (this.currentStep <= this.steps.length) {
        this.steps[this.currentStep - 1].completed = true;

        if (this.currentStep === this.steps.length) {
          this.buildConfirmationMessage();
          return;
        }

        this.currentStep++;
        this.updateStepsState();
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

  private validateCurrentStep(): boolean {
    let isValid = true;

    switch (this.currentStep) {
      case 1: // Datos Personales (Identificación + Información Personal + Ubicación)
        if (!this.validateStep1()) {
          this.markStep1ControlsAsTouched();
          isValid = false;
          break;
        }
        if (!this.validateStep2()) {
          this.markStep2ControlsAsTouched();
          isValid = false;
        }
        break;
      case 2: // Contacto y Ayudas
        if (!this.validateStep3()) {
          this.markStep3ControlsAsTouched();
          isValid = false;
          break;
        }
        if (!this.validateStep5()) {
          this.markStep5ControlsAsTouched();
          isValid = false;
        }
        break;
      case 3: // Datos Académicos
        isValid = this.validateStep4();
        if (!isValid) {
          this.markStep4ControlsAsTouched();
        }
        break;
    }

    if (!isValid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Validación',
        detail: 'Por favor complete todos los campos obligatorios del paso actual.'
      });
    }

    return isValid;
  }

  private validateStep1(): boolean {
    // Validar campos del formulario reactivo del paso 1
    const formControls = [
      'idTipoDocumento',
      'documento',
      'primerNombre',
      'primerApellido',
      'fechaNacimiento',
      'idEstadoCivil',
      'idEtnia',
      'idNacionalidadEtnica',
      'idGenero'
    ];

    return this.validateControls(formControls);
  }

  private validateStep2(): boolean {
    const provinciaVal = this.postulacionForm.get('idProvincia')?.value;
    const cantonVal = this.postulacionForm.get('idCanton')?.value;
    const parroquiaVal = this.postulacionForm.get('idParroquia')?.value;

    if (!provinciaVal) {
      console.log('Provincia no seleccionada en paso 2');
      return false;
    }

    if (!cantonVal) {
      console.log('Cantón no seleccionado en paso 2');
      return false;
    }

    if (!parroquiaVal) {
      console.log('Parroquia no seleccionada en paso 2');
      return false;
    }

    return this.validateControls(['nacio', 'direccionDomiciliaria']);
  }

  private validateStep3(): boolean {
    // Paso 3: Datos de contacto - validar que TODOS los contactos obligatorios estén completos
    const contactosObligatorios = this.tiposDatoContactoObligatorios;
    const rawValues = this.postulacionForm.getRawValue(); // Incluye controles deshabilitados
    for (const contacto of contactosObligatorios) {
      const controlName = `contacto_${contacto.idTipoDatoContacto}`;
      const control = this.postulacionForm.get(controlName);
      // Para controles deshabilitados (pre-cargados), leer el raw value
      const val = rawValues[controlName] ?? control?.value;
      if (!control || !val || val.toString().trim() === '') {
        console.log(`Contacto obligatorio faltante: ${contacto.detalle}`);
        return false;
      }
      // Solo verificar invalid si NO está deshabilitado
      if (!control.disabled && control.invalid) {
        console.log(`Contacto obligatorio inválido: ${contacto.detalle}`);
        return false;
      }

      if (this.isEmailContact(contacto.detalle)) {
        // Si el contacto ya existe (deshabilitado), no requerir campo de confirmación
        if (this.contactosExistentesIds.has(contacto.idTipoDatoContacto!)) continue;
        const confirmControlName = this.getEmailConfirmationControlName(contacto.idTipoDatoContacto);
        const confirmControl = this.postulacionForm.get(confirmControlName);
        const confirmVal = rawValues[confirmControlName] ?? confirmControl?.value;
        if (!confirmControl || !confirmVal || confirmVal.toString().trim() === '' || confirmControl.invalid) {
          console.log(`Confirmación de correo inválida: ${contacto.detalle}`);
          return false;
        }
      }
    }
    return true; // Todos los contactos obligatorios están completos
  }


  private validateStep4(): boolean {
    const controls = [
      'idTipoOferta',
      'idMalla'
    ];

    return this.validateControls(controls);
  }

  private validateStep5(): boolean {
    // No bloquear avance por actividad económica
    return true;
  }

  private markStep1ControlsAsTouched(): void {
    const controls = [
      'idTipoDocumento', 'documento', 'primerNombre', 'primerApellido',
      'fechaNacimiento', 'idEstadoCivil', 'idEtnia', 'idNacionalidadEtnica', 'idGenero'
    ];
    controls.forEach(controlName => {
      const control = this.postulacionForm.get(controlName);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  private markStep2ControlsAsTouched(): void {
    // Marcar lugar de nacimiento y dirección domiciliaria como touched
    const nacioControl = this.postulacionForm.get('nacio');
    if (nacioControl) {
      nacioControl.markAsTouched();
    }
    const direccionControl = this.postulacionForm.get('direccionDomiciliaria');
    if (direccionControl) {
      direccionControl.markAsTouched();
    }
  }

  private markStep3ControlsAsTouched(): void {
    // Marcar todos los controles de contacto obligatorio como touched
    this.tiposDatoContactoObligatorios.forEach(tipo => {
      const controlName = `contacto_${tipo.idTipoDatoContacto}`;
      const control = this.postulacionForm.get(controlName);
      if (control) {
        control.markAsTouched();
      }

      if (this.isEmailContact(tipo.detalle)) {
        const confirmControlName = this.getEmailConfirmationControlName(tipo.idTipoDatoContacto);
        const confirmControl = this.postulacionForm.get(confirmControlName);
        if (confirmControl) {
          confirmControl.markAsTouched();
        }
      }
    });
  }

  private markStep4ControlsAsTouched(): void {
    const controls = ['idTipoOferta', 'idMalla'];
    controls.forEach(controlName => {
      const control = this.postulacionForm.get(controlName);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  private markStep5ControlsAsTouched(): void {
    // Si trabaja, marcar el control de tipo actividad económica
    if (this.postulacionForm.get('trabaja')?.value) {
      const control = this.postulacionForm.get('idTipoActividadEconomica');
      if (control) {
        control.markAsTouched();
      }
    }
  }

  private validateControls(controlNames: string[]): boolean {
    for (const controlName of controlNames) {
      const control = this.postulacionForm.get(controlName);
      if (control && control.invalid) {
        control.markAsTouched();
        console.log(`Campo inválido: ${controlName}`, control.errors);
        return false;
      }
      if (control && (control.value === null || control.value === undefined || control.value === '')) {
        console.log(`Campo vacío: ${controlName}`);
        control.markAsTouched();
        return false;
      }
    }
    return true;
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
      case 1:
        return this.validateStep1() && this.validateStep2();
      case 2:
        return this.validateStep3() && this.validateStep5();
      case 3:
        return this.validateStep4();
      default:
        return true;
    }
  }

  async onFileSelected(event: any, req: RequisitosDTO): Promise<void> {
    const file = event.target.files[0];
    if (file && req.idRequisitos) {
      this.uploadedFiles[req.idRequisitos] = file;
    }
  }

  getUploadedFile(req: RequisitosDTO): File | undefined {
    return req.idRequisitos ? this.uploadedFiles[req.idRequisitos] : undefined;
  }

  onBooleanChange(req: RequisitosDTO, value: boolean): void {
    if (req.idRequisitos) {
      this.booleanRequisitos[req.idRequisitos] = value;
    }
  }

  getBooleanValue(req: RequisitosDTO): boolean {
    return req.idRequisitos ? this.booleanRequisitos[req.idRequisitos] || false : false;
  }

  clearFile(req: RequisitosDTO): void {
    if (req.idRequisitos) {
      delete this.uploadedFiles[req.idRequisitos];
    }
  }

  clearDiscapacidadFile(): void {
    this.archivoDiscapacidadFile = null;
  }

  get uploadedCount(): number {
    return Object.keys(this.uploadedFiles).length;
  }

  get missingCount(): number {
    return this.requisitos.length - this.uploadedCount;
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent, req: RequisitosDTO): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.onFileSelected({ target: { files: [files[0]] } }, req);
    }
  }

  onDropDiscapacidad(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.onFileChange({ target: { files: [files[0]] } });
    }
  }

  private buildConfirmationMessage(): void {
    const formData = this.postulacionForm.getRawValue();
    const nombreCompleto = `${formData.primerNombre || ''} ${formData.segundoNombre || ''} ${formData.primerApellido || ''} ${formData.segundoApellido || ''}`.trim();

    // Construir información de contactos
    const contactosInfo = this.buildContactosInfo(formData);

    // Información adicional
    const paisNombre = this.paises.find(p => p.idPais == formData.idPais)?.nombre || 'N/A';
    const generoNombre = this.generos.find(g => g.idGenero == formData.idGenero)?.nombre || 'N/A';
    const estadoCivilNombre = this.estadosCiviles.find(e => e.idEstadoCivil == formData.idEstadoCivil)?.nombre || 'N/A';
    const etniaNombre = this.etnias.find(e => e.idEtnia == formData.idEtnia)?.nombre || 'N/A';
    const nacionalidadEtnicaNombre = this.nacionalidadesEtnicas.find(n => n.idnacionalidadEtnica == formData.idNacionalidadEtnica)?.nombre || 'N/A';

    const fechaNacimientoFormateada = this.formatDateForDisplay(formData.fechaNacimiento);
    const edadAnios = this.calculateAgeYears(formData.fechaNacimiento);

    const requisitosBoolNoCumplidos = this.requisitos.filter(req =>
      req.tipoDato === 'BOOL' && req.esObligatorio === true && !this.getBooleanValue(req)
    );

    const infoExtra = [
      `Lugar de nacimiento: ${formData.nacio || 'N/A'}`,
      `Documento: ${formData.documento || 'N/A'}`,
      `Estado civil: ${estadoCivilNombre}`,
      `Etnia: ${etniaNombre}`,
      `Nacionalidad étnica: ${nacionalidadEtnicaNombre}`,
      `Género: ${generoNombre}`,
      `País de nacimiento: ${paisNombre}`,
      `Dirección domiciliaria: ${formData.direccionDomiciliaria || 'N/A'}`
    ].join('&#10;');

    this.modalTitle = '¿Desea crear esta cuenta de postulación?';
    this.modalMessage = `
      <div style="text-align: left;">
        <p style="margin-bottom: 1.2rem; color: var(--primary-color); font-size: 1.1rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
          <i class="pi pi-info-circle" style="cursor: help;" title="${infoExtra}" aria-label="Ver información adicional"></i>
          Por favor confirme que los datos principales del postulante:
        </p>

        ${requisitosBoolNoCumplidos.length > 0 ? `
        <div style="margin-bottom: 1rem; padding: 0.75rem; background-color: #fff3cd; border-left: 4px solid #f59e0b; border-radius: 0.35rem; color: #7a4e00;">
          <strong>Advertencia:</strong> El postulante no cumple estos requisitos obligatorios:<br/>
          ${requisitosBoolNoCumplidos.map(r => `• ${r.detalle}`).join('<br/>')}<br/>
          ¿Está seguro de continuar?
        </div>` : ''}

        <div style="background-color: var(--surface-section); padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem;">
          <h4 style="margin-top: 0; color: var(--primary-color);">Resumen</h4>
          <ul style="list-style: none; padding-left: 0; margin: 0;">
            <li style="margin-bottom: 0.5rem;">
              <strong style="color: var(--text-color-secondary);">Nombre:</strong>
              <span style="color: var(--text-color); font-weight: 500;">${nombreCompleto}</span>
            </li>
            <li style="margin-bottom: 0.5rem;">
              <strong style="color: var(--text-color-secondary);">Edad / Fecha de Nacimiento:</strong>
              <span style="color: var(--text-color); font-weight: 500;">${edadAnios !== null ? `${edadAnios} años` : 'N/A'} · ${fechaNacimientoFormateada}</span>
            </li>
            <li style="margin-bottom: 0.5rem;">
              <strong style="color: var(--text-color-secondary);">Curso al que aspira:</strong>
              <span style="color: var(--text-color); font-weight: 500;">${this.getMallaDetalle()}</span>
            </li>
          </ul>
        </div>

        ${contactosInfo ? `<div style="background-color: var(--surface-section); padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem;">
          <h4 style="margin-top: 0; color: var(--primary-color);">Información de Contacto</h4>
          <ul style="list-style: none; padding-left: 0; margin: 0;">
            ${contactosInfo}
          </ul>
        </div>` : ''}
        <div style="margin-top: 1.5rem; padding: 1rem; background-color: var(--surface-ground); border-radius: 0.5rem; border-left: 4px solid var(--success-color);">
          <p style="margin: 0; font-size: 0.9rem; color: var(--text-color-secondary);">
            <i class="pi pi-info-circle" style="margin-right: 0.5rem;"></i>
            Una vez creada la cuenta, el postulante podrá acceder al sistema con su número de cédula como nombre de usuario y su número de cédula como contraseña inicial. 
            El postulante podrá revisar el estado de su postulación en la sección de "Mis Postulaciones" y cambiar su contraseña una vez ingrese al sistema.
          </p>
        </div>
      </div>
    `;
    this.showConfirmationModal = true;
  }

  private formatDateForDisplay(dateValue: any): string {
    if (!dateValue) return 'N/A';
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('es-EC', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  }

  private calculateAgeYears(dateValue: any): number | null {
    if (!dateValue) return null;
    const birth = new Date(dateValue);
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age >= 0 ? age : null;
  }

  private buildContactosInfo(formData: any): string {
    let contactosInfo = '';

    // Agregar contactos obligatorios
    this.tiposDatoContactoObligatorios.forEach(tipo => {
      if (tipo.idTipoDatoContacto) {
        const controlName = `contacto_${tipo.idTipoDatoContacto}`;
        const value = formData[controlName];
        if (value) {
          let formattedValue = value;
          if (this.isPhoneContact(tipo.detalle)) {
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

    // Agregar contactos opcionales agregados
    this.contactosOpcionalesAgregados.forEach(tipo => {
      if (tipo.idTipoDatoContacto) {
        const controlName = `contacto_opcional_${tipo.idTipoDatoContacto}`;
        const value = formData[controlName];
        if (value) {
          let formattedValue = value;
          if (this.isPhoneContact(tipo.detalle)) {
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

  onSubmit(): void {
    // Verificar documentos obligatorios (solo para tipo ADJUNTO)
    this.documentosFaltantes = this.requisitos.filter(req =>
      req.tipoDato === 'ADJUNTO' && req.esObligatorio && !this.getUploadedFile(req)
    );

    // Verificar requisitos booleanos que bloquean inscripción (ahora solo advertencia)
    const requisitosBooleanosInvalidos = this.requisitos.filter(req =>
      req.tipoDato === 'BOOL' && req.bloqueaInscripcion && !this.getBooleanValue(req)
    );

    const hasValidationErrors = this.documentosFaltantes.length > 0;

    const esExtranjero = this.postulacionForm.get('esExtranjero')?.value;
    const ubicacionValida = esExtranjero || !!this.postulacionForm.get('idProvincia')?.value;

    if (this.postulacionForm.valid && !hasValidationErrors && ubicacionValida) {
      // Filtrar requisitos que bloquean inscripción
      this.requisitosBloqueantes = this.requisitos.filter(r => r.bloqueaInscripcion);
      this.modalTitle = 'Confirmación de Creación de Cuenta';

      const formData = this.postulacionForm.getRawValue();
      let message = 'Por favor revise los datos del postulante:\n\n';
      message += `DATOS PERSONALES:\n`;
      message += `• Nombres: ${formData.primerNombre} ${formData.segundoNombre || ''}\n`;
      message += `• Apellidos: ${formData.primerApellido} ${formData.segundoApellido || ''}\n`;
      message += `• Documento: ${formData.documento}\n`;
      message += `• Fecha de Nacimiento: ${formData.fechaNacimiento}\n\n`;

      message += `UBICACIÓN (Lugar de Nacimiento):\n`;
      const paisNombre = this.paises.find(p => p.idPais == formData.idPais)?.nombre || 'N/A';
      message += `• País: ${paisNombre}\n`;
      message += `\nDIRECCIÓN ACTUAL:\n`;
      message += `• ${formData.direccionDomiciliaria}\n\n`;

      message += `DATOS ACADÉMICOS:\n`;
      const mallaNombre = this.mallas.find(m => m.idMalla == formData.idMalla)?.detalle || 'N/A';
      message += `• Malla: ${mallaNombre}\n\n`;

      if (this.documentosFaltantes.length > 0) {
        message += 'DOCUMENTOS FALTANTES:\n';
        this.documentosFaltantes.forEach(doc => {
          message += `• ${doc.detalle}\n`;
        });
        message += '\nLa cuenta será creada pero el postulante deberá cargar estos documentos posteriormente.\n\n';
      }

      message += 'Para que el postulante pueda ser inscrito, debe ingresar los datos obligatorios.\n\n¿Desea continuar?';
      this.modalMessage = message;
      this.showConfirmationModal = true;
    } else {
      this.modalTitle = 'Errores de Validación';
      let message = 'Por favor complete todos los campos requeridos antes de continuar.';
      if (requisitosBooleanosInvalidos.length > 0) {
        message += '\n\nAdvertencia (no bloqueante) - requisitos no cumplidos:';
        requisitosBooleanosInvalidos.forEach(req => {
          message += `\n- ${req.detalle}`;
        });
      }
      this.modalMessage = message;
      this.requisitosBloqueantes = [];
      this.showConfirmationModal = true;
    }
  }

  onConfirmAccept(): void {
    this.isSubmitting = true;
    const formData = this.postulacionForm.getRawValue();

    // Función helper para convertir valores undefined/null/"undefined" a null
    const toNullIfEmpty = (value: any): any => {
      if (value === null || value === undefined || value === '' || value === 'undefined' || value === 'null') {
        return null;
      }
      return value;
    };

    // Función helper para convertir strings numéricos a números o null si está vacío
    const toNumberOrNull = (value: any): number | null => {
      if (value === null || value === undefined || value === '' || value === 'undefined' || value === 'null') {
        return null;
      }
      const num = typeof value === 'string' ? parseInt(value, 10) : value;
      return isNaN(num) ? null : num;
    };

    // Función helper para formatear fecha como YYYY-MM-DD (sin hora)
    const formatDateOnly = (dateValue: any): string | null => {
      if (!dateValue || dateValue === '' || dateValue === 'undefined' || dateValue === 'null') {
        return null;
      }
      try {
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) {
          return null;
        }
        return date.toISOString().split('T')[0]; // YYYY-MM-DD
      } catch {
        return null;
      }
    };

    // Construir objeto JSON según nueva estructura
    const payload: any = {
      idTipoDocumento: toNumberOrNull(formData.idTipoDocumento),
      documento: toNullIfEmpty(formData.documento),
      idGenero: toNumberOrNull(formData.idGenero),
      primerNombre: toNullIfEmpty(formData.primerNombre),
      segundoNombre: toNullIfEmpty(formData.segundoNombre),
      primerApellido: toNullIfEmpty(formData.primerApellido),
      segundoApellido: toNullIfEmpty(formData.segundoApellido),
      fechaNacimiento: formatDateOnly(formData.fechaNacimiento),
      idEstadoCivil: toNumberOrNull(formData.idEstadoCivil),
      idNacionalidadEtnica: toNumberOrNull(formData.idNacionalidadEtnica),
      idProvincia: toNumberOrNull(formData.idProvincia),
      idCanton: toNumberOrNull(formData.idCanton),
      idParroquia: toNumberOrNull(formData.idParroquia),
      direccionDomiciliaria: toNullIfEmpty(formData.direccionDomiciliaria),
      idTipoActividadEconomica: toNumberOrNull(formData.idTipoActividadEconomica),
      esPrincipal: formData.esPrincipal ?? true,
      activo: formData.activo ?? true,
      porcentaje: formData.porcentaje ? parseInt(formData.porcentaje, 10) : null,
      recomendaciones: toNullIfEmpty(formData.recomendaciones),
      idTipoDiscapacidad: toNumberOrNull(formData.idTipoDiscapacidad),
      idPais: toNumberOrNull(formData.idPais),
      realizarPagoInicial: formData.realizarPagoInicial ?? false,
      idMalla: toNumberOrNull(formData.idMalla),
      idParalelo: toNumberOrNull(formData.idParalelo),
      nacio: toNullIfEmpty(formData.nacio),
      ...(this.isEditing ? {
        idPersona: this.idPersona,
        idPostulacion: this.idPostulacion
      } : {}),
      datosContactos: this.buildDatosContactosManual(formData).map(contacto => ({
        idTipoDatoContacto: toNumberOrNull(contacto.idTipoDatoContacto),
        detalle: contacto.detalle,
        esPrincipal: contacto.esPrincipal
      })),
      // Incluir todos los requisitos: ADJUNTO y BOOL
      documentosPersonales: this.requisitos.map(req => {
        const hasFile = !!this.getUploadedFile(req);
        const isBool = req.tipoDato === 'BOOL';
        const isAdjunto = req.tipoDato === 'ADJUNTO';

        return {
          idTipoDocumentoPersonal: isAdjunto ? 1 : isBool ? 2 : 2,
          codigoRequisito: req.idRequisitos?.toString() || null,
          estado: null,
          valorDato: isBool ? (this.booleanRequisitos[req.idRequisitos!] || false) : true,
          observacion: req.detalle || null,
          tieneArchivo: isAdjunto ? hasFile : false
        };
      })
    };

    console.log('Enviando payload JSON:', payload);
    console.log('Payload JSON stringificado:', JSON.stringify(payload));

    // Crear FormData para enviar JSON + archivos
    const formDataToSend = new FormData();

    // 1. Agregar el JSON como string con el nombre correcto
    const jsonString = JSON.stringify(payload);
    formDataToSend.append('PersonaPostulacionManualJson', jsonString);

    // 2. Agregar archivo de discapacidad si existe
    if (this.archivoDiscapacidadFile) {
      formDataToSend.append('ArchivoDiscapacidad', this.archivoDiscapacidadFile, this.archivoDiscapacidadFile.name);
    }

    // 3. Agregar archivos de documentos (requisitos tipo ADJUNTO)
    const archivosDocumentos: File[] = [];
    this.requisitos.forEach(req => {
      if (req.tipoDato === 'ADJUNTO') {
        const file = this.getUploadedFile(req);
        if (file) {
          archivosDocumentos.push(file);
        }
      }
    });

    // Agregar cada archivo con el mismo nombre de campo (array)
    archivosDocumentos.forEach(file => {
      formDataToSend.append('ArchivosDocumentos', file, file.name);
    });

    const apiCall = this.isEditing
      ? this.postulacionService.actualizarPostulacionContacto(formDataToSend)
      : this.postulacionService.crearPostulacionManual(formDataToSend);

    const successMessage = this.isEditing
      ? 'Postulación actualizada correctamente'
      : 'Postulación creada exitosamente';

    apiCall.subscribe({
      next: (response) => {
        this.showConfirmationModal = false;
        this.isSubmitting = false;

        if (response && typeof response === 'object') {
          if (response.isSuccess === true) {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: response.message || successMessage,
              life: 5000
            });

            if (this.documentosFaltantes.length > 0) {
              setTimeout(() => {
                this.messageService.add({
                  severity: 'warn',
                  summary: 'Documentos Pendientes',
                  detail: `No olvide cargar estos documentos: ${this.documentosFaltantes.map(d => d.detalle).join(', ')}`,
                  life: 7000
                });
              }, 500);
            }

            if (this.isEditing) {
              this.clearEditingDraft();
              this.completed.emit();
              setTimeout(() => {
                this.router.navigate(['/dashboard/postulacion', this.idPostulacion]);
              }, 2000);
            } else {
              this.clearFormSession();
              setTimeout(() => {
                this.router.navigate(['/dashboard/postulaciones/manage-postulations']);
              }, 2000);
            }
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: response.message || 'Error al procesar la postulación',
              life: 5000
            });
          }
        } else {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: successMessage,
            life: 5000
          });

          if (this.isEditing) {
            this.clearEditingDraft();
            this.completed.emit();
            setTimeout(() => {
              this.router.navigate(['/dashboard/postulacion', this.idPostulacion]);
            }, 2000);
          } else {
            this.clearFormSession();
            setTimeout(() => {
              this.router.navigate(['/dashboard/postulaciones/manage-postulations']);
            }, 2000);
          }
        }
      },
      error: (error) => {
        this.showConfirmationModal = false;
        this.isSubmitting = false;

        if (error.error && typeof error.error === 'object') {
          const errorResponse = error.error;

          this.messageService.add({
            severity: 'error',
            summary: `Error ${errorResponse.statusCode || error.status || ''}`,
            detail: errorResponse.message || 'Error al procesar la postulación. Por favor revise los datos e intente nuevamente.',
            life: 6000
          });

          if (errorResponse.errores && Object.keys(errorResponse.errores).length > 0) {
            const erroresDetalle = Object.entries(errorResponse.errores)
              .map(([key, value]) => `${key}: ${value}`)
              .join(', ');

            setTimeout(() => {
              this.messageService.add({
                severity: 'error',
                summary: 'Detalles del Error',
                detail: erroresDetalle,
                life: 7000
              });
            }, 500);
          }
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.message || 'Error al procesar la postulación. Por favor revise los datos e intente nuevamente.',
            life: 5000
          });
        }
      }
    });
  }

  onConfirmReject(): void {
    this.showConfirmationModal = false;
  }

  onModalHide(): void {
    this.showConfirmationModal = false;
  }

  /**
   * Muestra un mensaje toast usando PrimeNG
   */
  showMessage(severity: string, summary: string, detail: string): void {
    this.messageService.add({
      severity: severity,
      summary: summary,
      detail: detail,
      life: 5000
    });
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

  getTipoOfertaDetalle(): string {
    const id = this.postulacionForm.get('idTipoOferta')?.value;
    return this.tiposOferta.find(t => t.idtipoOferta == id)?.detalle || '';
  }

  getCursoDetalle(): string {
    const id = this.postulacionForm.get('idCursos')?.value;
    return this.cursos.find(c => c.idCursos == id)?.detalle || '';
  }

  getMallaDetalle(): string {
    const id = this.postulacionForm.get('idMalla')?.value;
    return this.mallas.find(m => m.idMalla == id)?.detalle || '';
  }

  getCicloDetalle(): string {
    const id = this.postulacionForm.get('idCiclo')?.value;
    return this.ciclos.find(c => c.idCiclo == id)?.detalle || '';
  }

  private loadContactControls(): void {
    // Agregar controles para contactos obligatorios
    this.tiposDatoContactoObligatorios.forEach(tipo => {
      if (tipo.idTipoDatoContacto) {
        const validators = [Validators.required];

        // Si es tipo email, agregar validador de email más complejo y lowercase
        if (this.isEmailContact(tipo.detalle)) {
          validators.push(Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/));
          validators.push(this.lowercaseValidator);
        }

        // Si es celular, validar 10 dígitos; si es convencional, 7 dígitos
        if (this.isMobilePhoneContact(tipo.detalle)) {
          validators.push(Validators.pattern(/^[0-9]{10}$/));
          this.postulacionForm.addControl(
            `prefix_contacto_${tipo.idTipoDatoContacto}`,
            this.fb.control(this.defaultCountryDialCode, [Validators.required, Validators.pattern(/^\+\d{1,4}$/)])
          );
        } else if (this.isConventionalPhoneContact(tipo.detalle)) {
          validators.push(Validators.pattern(/^[0-9]{7}$/));
          this.postulacionForm.addControl(
            `prefix_contacto_${tipo.idTipoDatoContacto}`,
            this.fb.control(this.defaultConventionalAreaCode, [Validators.required, Validators.pattern(/^(02|03|04|05|06|07)$/)])
          );
        }

        this.postulacionForm.addControl(
          `contacto_${tipo.idTipoDatoContacto}`,
          this.fb.control('', validators)
        );

        if (this.isEmailContact(tipo.detalle)) {
          const originalControlName = `contacto_${tipo.idTipoDatoContacto}`;
          const confirmControlName = this.getEmailConfirmationControlName(tipo.idTipoDatoContacto);

          this.postulacionForm.addControl(
            confirmControlName,
            this.fb.control('', [
              Validators.required,
              Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/),
              this.lowercaseValidator,
              this.createEmailMatchValidator(originalControlName)
            ])
          );

          this.postulacionForm.get(originalControlName)?.valueChanges.subscribe(() => {
            this.postulacionForm.get(confirmControlName)?.updateValueAndValidity({ emitEvent: false });
          });
        }
      }
    });
  }

  private createEmailMatchValidator(originalControlName: string) {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const originalControl = this.postulacionForm?.get(originalControlName);
      if (!originalControl) return null;

      return control.value === originalControl.value ? null : { emailMismatch: true };
    };
  }

  /**
   * Verifica si el tipo de contacto es un email
   */
  isEmailContact(detalle: string | undefined): boolean {
    if (!detalle) return false;
    const nombreLower = detalle.toLowerCase();
    return nombreLower.includes('email') || nombreLower.includes('correo');
  }

  /**
   * Verifica si el tipo de contacto es un teléfono
   */
  isPhoneContact(detalle: string | undefined): boolean {
    if (!detalle) return false;
    const nombreLower = detalle.toLowerCase();
    return nombreLower.includes('teléfono') || nombreLower.includes('telefono') ||
      nombreLower.includes('celular') || nombreLower.includes('móvil') ||
      nombreLower.includes('movil') || nombreLower.includes('whatsapp');
  }

  isConventionalPhoneContact(detalle: string | undefined): boolean {
    if (!detalle) return false;
    const nombreLower = detalle.toLowerCase();
    const isMobile = nombreLower.includes('celular') || nombreLower.includes('móvil') ||
      nombreLower.includes('movil') || nombreLower.includes('whatsapp');
    const hasPhoneWord = nombreLower.includes('teléfono') || nombreLower.includes('telefono');
    return !isMobile && (nombreLower.includes('convencional') || nombreLower.includes('fijo') || hasPhoneWord);
  }

  isMobilePhoneContact(detalle: string | undefined): boolean {
    if (!detalle) return false;
    const nombreLower = detalle.toLowerCase();
    return nombreLower.includes('celular') || nombreLower.includes('móvil') ||
      nombreLower.includes('movil') || nombreLower.includes('whatsapp');
  }

  /**
   * Obtiene el mensaje de error para un campo de contacto
   */
  getContactError(controlName: string, detalle: string | undefined): string {
    const control = this.postulacionForm.get(controlName);
    if (!control || !control.errors || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Este campo es requerido';
    }
    if (control.hasError('pattern')) {
      if (this.isEmailContact(detalle)) {
        return 'Ingrese un correo electrónico válido (ejemplo@dominio.com)';
      }
      if (this.isConventionalPhoneContact(detalle)) {
        return 'Ingrese un teléfono convencional válido (7 dígitos)';
      }
      if (this.isMobilePhoneContact(detalle)) {
        return 'Ingrese un número de teléfono válido (10 dígitos)';
      }
    }
    if (control.hasError('emailMismatch')) {
      return 'Los correos no coinciden';
    }
    return '';
  }

  // Validadores personalizados
  private uppercaseValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;

    const uppercased = control.value.toUpperCase();
    if (control.value !== uppercased) {
      control.setValue(uppercased, { emitEvent: false });
    }

    return null;
  }

  private lowercaseValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;

    const lowercased = control.value.toLowerCase();
    if (control.value !== lowercased) {
      control.setValue(lowercased, { emitEvent: false });
    }

    return null;
  }

  private fechaNacimientoValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;

    const fecha = new Date(control.value);
    const hoy = new Date();
    const edadMinima = 10;
    const edadMaxima = 100;

    if (fecha > hoy) {
      return { futureDate: true };
    }

    const edad = hoy.getFullYear() - fecha.getFullYear();
    if (edad < edadMinima || edad > edadMaxima) {
      return { invalidAge: true };
    }

    return null;
  }

  // Método genérico para obtener errores de campos
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

  /**
   * Verifica si un campo de contacto tiene error
   */
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
    } else if (nombreLower.includes('telegram')) {
      return 'pi pi-send';
    } else {
      return 'pi pi-user';
    }
  }

  getContactPlaceholder(detalle: string | undefined): string {
    if (!detalle) return 'Ingrese información de contacto';
    const nombreLower = detalle.toLowerCase();
    if (nombreLower.includes('email') || nombreLower.includes('correo')) {
      return 'ejemplo@correo.com';
    } else if (this.isConventionalPhoneContact(detalle)) {
      return '3014175';
    } else if (nombreLower.includes('teléfono') || nombreLower.includes('celular')) {
      return '0999999999';
    } else if (nombreLower.includes('whatsapp')) {
      return '0999999999';
    } else if (nombreLower.includes('telegram')) {
      return '@usuario o número';
    } else {
      return `Ej: Ingrese su ${nombreLower}`;
    }
  }

  getContactControlName(idTipo: number | undefined): string {
    return `contacto_${idTipo || 0}`;
  }

  getOptionalContactControlName(idTipo: number | undefined): string {
    return `contacto_opcional_${idTipo || 0}`;
  }

  getPhonePrefixControlName(idTipo: number | undefined): string {
    return `prefix_contacto_${idTipo || 0}`;
  }

  getOptionalPhonePrefixControlName(idTipo: number | undefined): string {
    return `prefix_contacto_opcional_${idTipo || 0}`;
  }

  getEmailConfirmationControlName(idTipo: number | undefined): string {
    return `confirmacion_contacto_${idTipo || 0}`;
  }

  get isMinorAge(): boolean {
    const fechaNacimiento = this.postulacionForm?.get('fechaNacimiento')?.value;
    if (!fechaNacimiento) {
      return false;
    }

    const edad = this.calculateAgeYears(fechaNacimiento);
    return edad !== null && edad < 18;
  }

  private handleAgeDependentRules(): void {
    if (this.isMinorAge && this.postulacionForm.get('trabaja')?.value) {
      this.postulacionForm.patchValue({ trabaja: false }, { emitEvent: true });
      this.showMessage('warn', 'Restricción por edad', 'Al ser menor de 18 años no puede registrar que el estudiante trabaja.');
    }

    const mallaActual = this.postulacionForm.get('idMalla')?.value;
    if (this.isMinorAge && mallaActual) {
      this.validateMallaByAge(+mallaActual);
    } else if (!this.isMinorAge) {
      this.underAgeBlockedCourseName = null;
    }
  }

  hasOptionalContact(idTipo: number | undefined): boolean {
    return this.contactosOpcionalesAgregados.some(c => c.idTipoDatoContacto === idTipo);
  }

  removeOptionalContact(idTipo: number | undefined): void {
    const tipoRemoved = this.contactosOpcionalesAgregados.find(c => c.idTipoDatoContacto === idTipo);
    this.contactosOpcionalesAgregados = this.contactosOpcionalesAgregados.filter(c => c.idTipoDatoContacto !== idTipo);
    this.postulacionForm.removeControl(`contacto_opcional_${idTipo}`);
    if (tipoRemoved && this.isPhoneContact(tipoRemoved.detalle)) {
      this.postulacionForm.removeControl(`prefix_contacto_opcional_${idTipo}`);
    }
  }

  addOptionalContact(tipo: TipoDatoContactoDTO): void {
    if (tipo.idTipoDatoContacto && !this.hasOptionalContact(tipo.idTipoDatoContacto)) {
      this.contactosOpcionalesAgregados.push(tipo);

      const validators = [];

      // Si es tipo email, agregar validador de email más complejo y lowercase
      if (this.isEmailContact(tipo.detalle)) {
        validators.push(Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/));
        validators.push(this.lowercaseValidator);
      }

      // Si es celular, validar 10 dígitos; si es convencional, 7 dígitos
      if (this.isMobilePhoneContact(tipo.detalle)) {
        validators.push(Validators.pattern(/^[0-9]{10}$/));
        this.postulacionForm.addControl(
          `prefix_contacto_opcional_${tipo.idTipoDatoContacto}`,
          this.fb.control(this.defaultCountryDialCode, [Validators.required, Validators.pattern(/^\+\d{1,4}$/)])
        );
      } else if (this.isConventionalPhoneContact(tipo.detalle)) {
        validators.push(Validators.pattern(/^[0-9]{7}$/));
        this.postulacionForm.addControl(
          `prefix_contacto_opcional_${tipo.idTipoDatoContacto}`,
          this.fb.control(this.defaultConventionalAreaCode, [Validators.required, Validators.pattern(/^(02|03|04|05|06|07)$/)])
        );
      }

      this.postulacionForm.addControl(
        `contacto_opcional_${tipo.idTipoDatoContacto}`,
        this.fb.control('', validators)
      );
    }
  }

  private buildDatosContactosManual(formData: any): DatosContactoPostulacionManualDTO[] {
    const datosContactos: DatosContactoPostulacionManualDTO[] = [];

    // Agregar contactos obligatorios
    this.tiposDatoContactoObligatorios.forEach(tipo => {
      if (tipo.idTipoDatoContacto) {
        const controlName = `contacto_${tipo.idTipoDatoContacto}`;
        const value = formData[controlName];
        if (value) {
          let formattedValue = value;
          if (this.isMobilePhoneContact(tipo.detalle)) {
            const prefixControlName = `prefix_contacto_${tipo.idTipoDatoContacto}`;
            const prefix = formData[prefixControlName] || this.defaultCountryDialCode;
            const cleanNumber = value.toString().replace(/\s+/g, '').replace(/^0+/, '');
            formattedValue = `${prefix} ${cleanNumber}`;
          } else if (this.isConventionalPhoneContact(tipo.detalle)) {
            const prefixControlName = `prefix_contacto_${tipo.idTipoDatoContacto}`;
            const prefix = formData[prefixControlName] || this.defaultConventionalAreaCode;
            const cleanNumber = value.toString().replace(/\s+/g, '').replace(/[^0-9]/g, '');
            formattedValue = `${prefix}${cleanNumber}`;
          }

          datosContactos.push({
            idTipoDatoContacto: tipo.idTipoDatoContacto,
            detalle: formattedValue,
            esPrincipal: tipo.esObligatorio // Asumiendo que el obligatorio es principal
          });
        }
      }
    });

    // Agregar contactos opcionales agregados
    this.contactosOpcionalesAgregados.forEach(tipo => {
      if (tipo.idTipoDatoContacto) {
        const controlName = `contacto_opcional_${tipo.idTipoDatoContacto}`;
        const value = formData[controlName];
        if (value) {
          let formattedValue = value;
          if (this.isMobilePhoneContact(tipo.detalle)) {
            const prefixControlName = `prefix_contacto_opcional_${tipo.idTipoDatoContacto}`;
            const prefix = formData[prefixControlName] || this.defaultCountryDialCode;
            const cleanNumber = value.toString().replace(/\s+/g, '').replace(/^0+/, '');
            formattedValue = `${prefix} ${cleanNumber}`;
          } else if (this.isConventionalPhoneContact(tipo.detalle)) {
            const prefixControlName = `prefix_contacto_opcional_${tipo.idTipoDatoContacto}`;
            const prefix = formData[prefixControlName] || this.defaultConventionalAreaCode;
            const cleanNumber = value.toString().replace(/\s+/g, '').replace(/[^0-9]/g, '');
            formattedValue = `${prefix}${cleanNumber}`;
          }

          datosContactos.push({
            idTipoDatoContacto: tipo.idTipoDatoContacto,
            detalle: formattedValue,
            esPrincipal: false
          });
        }
      }
    });

    return datosContactos;
  }

  // Método para obtener mensaje de error de fecha de nacimiento
  getFechaNacimientoError(): string {
    const control = this.postulacionForm.get('fechaNacimiento');
    if (!control || !control.errors) return '';

    if (control.hasError('required')) return 'La fecha de nacimiento es requerida';
    if (control.hasError('futureDate')) return 'La fecha no puede ser futura';
    if (control.hasError('invalidAge')) return 'La edad debe estar entre 10 y 100 años';

    return '';
  }

  toggleTrabaja(): void {
    this.trabajaExpanded = !this.trabajaExpanded;
  }

  toggleDiscapacidad(): void {
    this.discapacidadExpanded = !this.discapacidadExpanded;
  }

  onCreateEtnia(data: Record<string, any>): void {
    this.etniaService.create(data).subscribe({
      next: (res: any) => {
        const idEtnia = typeof res === 'object' && res ? (res.idEtnia ?? res.id) : res;
        const nuevo: EtniaDTO = {
          idEtnia: idEtnia,
          nombre: data['nombre'],
          default: false
        };
        this.etnias = [...this.etnias, nuevo];
        this.postulacionForm.patchValue({ idEtnia: idEtnia });
        this.onEtniaChange(idEtnia);
        this.messageService.add({ severity: 'success', summary: 'Creado', detail: 'Etnia creada' });
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear la etnia' })
    });
  }

  onCreateCanton(data: Record<string, any>): void {
    const idProvincia = this.postulacionForm.get('idProvincia')?.value;
    if (!idProvincia) {
      this.messageService.add({ severity: 'warn', summary: 'Advertencia', detail: 'Seleccione primero una provincia' });
      return;
    }
    this.cantonService.create({ ...data, idProvincia }).subscribe({
      next: (res: any) => {
        const idCanton = typeof res === 'object' && res ? (res.idCanton ?? res.id) : res;
        const nuevo: CantonDTO = {
          idCanton: idCanton,
          nombre: data['nombre'],
          idProvincia: idProvincia
        };
        this.cantones = [...this.cantones, nuevo];
        this.postulacionForm.patchValue({ idCanton: idCanton });
        this.onCantonChangeFromSelect(idCanton);
        this.messageService.add({ severity: 'success', summary: 'Creado', detail: 'Cantón creado' });
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear el cantón' })
    });
  }

  onCreateParroquia(data: Record<string, any>): void {
    const idCanton = this.postulacionForm.get('idCanton')?.value;
    if (!idCanton) {
      this.messageService.add({ severity: 'warn', summary: 'Advertencia', detail: 'Seleccione primero un cantón' });
      return;
    }
    this.parroquiaService.create({ ...data, idCanton }).subscribe({
      next: (res: any) => {
        const idParroquia = typeof res === 'object' && res ? (res.idParroquia ?? res.id) : res;
        const nuevo: ParroquiaDTO = {
          idParroquia: idParroquia,
          nombre: data['nombre'],
          idCanton: idCanton
        };
        this.parroquias = [...this.parroquias, nuevo];
        this.postulacionForm.patchValue({ idParroquia: idParroquia });
        this.messageService.add({ severity: 'success', summary: 'Creado', detail: 'Parroquia creada' });
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear la parroquia' })
    });
  }

  onCreateNacionalidadEtnica(data: Record<string, any>): void {
    const idEtnia = this.postulacionForm.get('idEtnia')?.value;
    if (!idEtnia) {
      this.messageService.add({ severity: 'warn', summary: 'Advertencia', detail: 'Seleccione primero una etnia' });
      return;
    }
    const payload = { ...data, idEtnia, esNinguna: false };
    this.nacionalidadEtnicaService.create(payload).subscribe({
      next: (res: any) => {
        const idnacionalidadEtnica = typeof res === 'object' && res ? (res.idnacionalidadEtnica ?? res.id) : res;
        const nuevo: NacionalidadEtnicaDTO = {
          idnacionalidadEtnica: idnacionalidadEtnica,
          nombre: data['nombre'],
          idEtnia: idEtnia,
          esNinguna: false
        };
        this.nacionalidadesEtnicas = [...this.nacionalidadesEtnicas, nuevo];
        this.postulacionForm.patchValue({ idNacionalidadEtnica: idnacionalidadEtnica });
        this.messageService.add({ severity: 'success', summary: 'Creado', detail: 'Nacionalidad étnica creada' });
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear la nacionalidad étnica' })
    });
  }

  onCreateTipoActividadEconomica(data: Record<string, any>): void {
    this.tipoActividadEconomicaService.create(data).subscribe({
      next: (res: any) => {
        const idtipoActividadEconomica = typeof res === 'object' && res ? (res.idtipoActividadEconomica ?? res.id) : res;
        const nuevo: TipoActividadEconomicaDTO = {
          idtipoActividadEconomica: idtipoActividadEconomica,
          nombre: data['nombre'],
          esFormal: data['esFormal'] ?? true
        };
        this.tiposActividadEconomica = [...this.tiposActividadEconomica, nuevo];
        this.postulacionForm.patchValue({ idTipoActividadEconomica: idtipoActividadEconomica });
        this.messageService.add({ severity: 'success', summary: 'Creado', detail: 'Actividad económica creada' });
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear la actividad económica' })
    });
  }

  onCreateTipoDiscapacidad(data: Record<string, any>): void {
    this.tipoDiscapacidadService.create(data).subscribe({
      next: (res: any) => {
        const idTipoDiscapacidad = typeof res === 'object' && res ? (res.idTipoDiscapacidad ?? res.id) : res;
        const nuevo: TipoDiscapacidadDTO = {
          idTipoDiscapacidad: idTipoDiscapacidad,
          nombre: data['nombre']
        };
        this.tiposDiscapacidad = [...this.tiposDiscapacidad, nuevo];
        this.postulacionForm.patchValue({ idTipoDiscapacidad: idTipoDiscapacidad });
        this.messageService.add({ severity: 'success', summary: 'Creado', detail: 'Tipo de discapacidad creado' });
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear el tipo de discapacidad' })
    });
  }

  get isEtniaIndigena(): boolean {
    const etniaId = this.postulacionForm?.get('idEtnia')?.value;
    if (!etniaId) return false;
    const etnia = this.etnias.find(e => e.idEtnia == etniaId);
    if (!etnia) return false;
    const nombre = (etnia.nombre || '').toLowerCase();
    return nombre.includes('indígena') || nombre.includes('indigena');
  }

  get noHayCursos(): boolean {
    const idTipoOferta = this.postulacionForm.get('idTipoOferta')?.value;
    return !!idTipoOferta && (this.mallas.length === 0 || this.todasMallasSinConfigurar);
  }

  openParametrizacion(): void {
    this.saveFormToSession();
    window.open('/#/dashboard/configurar-cursos-postulacion', '_blank');
  }
}