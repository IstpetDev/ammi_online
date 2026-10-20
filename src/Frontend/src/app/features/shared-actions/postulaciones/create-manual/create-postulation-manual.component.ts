import { Component, OnInit, inject } from '@angular/core';
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
import { ToastModule } from 'primeng/toast';
import { TipoDocumentoDTO, GeneroDTO, EstadoCivilDTO, EtniaDTO, NacionalidadEtnicaDTO, PaisDTO, ProvinciaDTO, CantonDTO, ParroquiaDTO, CicloDTO, CursoDTO, TipoDatoContactoDTO, TipoOfertaDTO, RequisitosDTO, PostulacionesManualesDTO, DatosContactoPostulacionManualDTO, DocumentoPersonalDTO, TipoSangreDTO, TipoActividadEconomicaDTO, TipoDiscapacidadDTO, MallaDTO, ParaleloDTO } from '../../../../data/models/Entities';
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
  TipoSangreService,
  TipoActividadEconomicaService,
  TipoDiscapacidadService,
  MallaService,
  ParaleloService
} from '../../../../core/services/postulaciones';
import { forkJoin, Observable } from 'rxjs';
import { PRIMENG_MODULES } from '../../../../shared/primeng-imports';
import { ConfirmationModalComponent } from '../../../../shared/modal-confirmation/confirmation-modal.component';
interface Step {
  id: number;
  title: string;
  icon: string;
  completed: boolean;
  active: boolean;
}

@Component({
  selector: 'app-create-postulation-manual',
   standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ConfirmationModalComponent, ToastModule, ...PRIMENG_MODULES],
  providers: [MessageService],
  templateUrl: './create-postulation-manual.component.html',
  styleUrls: ['./create-postulation-manual.component.css']
})
export class CreatePostulationManualComponent implements OnInit {
  // MessageService usando inject
  private messageService = inject(MessageService);
  
  currentStep = 1;
  postulacionForm!: FormGroup;

  steps: Step[] = [
    { id: 1, title: 'Datos Personales', icon: 'pi pi-user', completed: false, active: true },
    { id: 2, title: 'Datos Geográficos', icon: 'pi pi-map-marker', completed: false, active: false },
    { id: 3, title: 'Datos de Contacto', icon: 'pi pi-phone', completed: false, active: false },
    { id: 4, title: 'Datos Académicos', icon: 'pi pi-graduation-cap', completed: false, active: false },
    { id: 5, title: 'Datos Ayudas Económicas', icon: 'pi pi-money-bill', completed: false, active: false }
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
  tiposSangre: TipoSangreDTO[] = [];
  tiposActividadEconomica: TipoActividadEconomicaDTO[] = [];
  tiposDiscapacidad: TipoDiscapacidadDTO[] = [];

  // Mallas curriculares (se cargan dinámicamente desde el servicio)
  mallas: MallaDTO[] = [];

  // Paralelos disponibles
  paralelos: ParaleloDTO[] = [];

  // Propiedades para p-autocomplete
  selectedProvincia: ProvinciaDTO | null = null;
  selectedCanton: CantonDTO | null = null;
  selectedParroquia: ParroquiaDTO | null = null;
  filteredProvincias: ProvinciaDTO[] = [];
  filteredCantones: CantonDTO[] = [];
  filteredParroquias: ParroquiaDTO[] = [];

  // Contactos opcionales agregados
  contactosOpcionalesAgregados: TipoDatoContactoDTO[] = [];

  // Modal de confirmación
  showConfirmationModal: boolean = false;
  modalTitle: string = '¿Desea crear esta postulación?';
  modalMessage: string = '';
  requisitosBloqueantes: RequisitosDTO[] = [];
  documentosFaltantes: RequisitosDTO[] = [];

  // Edad display
  ageDisplay: string | null = null;

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
    private tipoSangreService: TipoSangreService,
    private tipoActividadEconomicaService: TipoActividadEconomicaService,
    private tipoDiscapacidadService: TipoDiscapacidadService,
    private mallaService: MallaService,
    private paraleloService: ParaleloService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // console.log('CreatePostulationComponent ngOnInit called');
    this.initializeForm();
    this.loadInitialData();
  }

  private initializeForm(): void {
    this.postulacionForm = this.fb.group({
      // Paso 1: Datos Personales
      esExtranjero: [false],
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
      idNacionalidadEtnica: [''],
      idPais: [''],
      idProvincia: [''],
      idCanton: [''],
      idParroquia: ['', Validators.required],
      direccionDomiciliaria: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(200), this.uppercaseValidator]],
      idTipoSangre: [''],

      // Paso 2: Datos de Contacto (se agregarán dinámicamente)
      // contactos: this.fb.array([]),

      //Paso 3: Datos de Ayuda Económica
        trabaja: [false],
        idTipoActividadEconomica: [''],
        valor: [''],
        esPrincipal: [true],
        activo: [true],
        tieneDiscapacidad: [false],
        porcentaje: [''],
        recomendaciones: ['', [Validators.maxLength(500), this.uppercaseValidator]],
        idTipoDiscapacidad: [''],
        archivoDiscapacidad: [''],
      // Paso 4: Datos Académicos
      idTipoOferta: ['', Validators.required],
      idMalla: ['', Validators.required],
      idParalelo: ['', Validators.required],

      // Paso 5: Documentación
      documentos: this.fb.array([])
    });

    // Suscribirse a cambios para mostrar/ocultar campos
    this.postulacionForm.get('esExtranjero')?.valueChanges.subscribe(value => {
      this.onExtranjeroChange(value);
    });

    // Suscribirse a cambios del tipo de documento para actualizar validación
    this.postulacionForm.get('idTipoDocumento')?.valueChanges.subscribe(value => {
      this.onTipoDocumentoChange(value);
    });

    // Etnia subscription will be set up after data is loaded
    // this.postulacionForm.get('idEtnia')?.valueChanges.subscribe(value => {
    //   this.onEtniaChange(value);
    // });

    this.postulacionForm.get('fechaNacimiento')?.valueChanges.subscribe(value => {
      this.calculateAge(value);
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
    // Validador condicional para tipo de actividad económica
    this.postulacionForm.get('trabaja')?.valueChanges.subscribe(trabaja => {
      const actividadControl = this.postulacionForm.get('idTipoActividadEconomica');
      if (trabaja) {
        actividadControl?.setValidators([Validators.required]);
      } else {
        actividadControl?.clearValidators();
      }
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
      next: (data) => this.tiposDocumento = data,
      error: () => {} // Silenciar errores
    });
    this.generoService.getGeneros().subscribe({
      next: (data) => this.generos = data,
      error: () => {}
    });
    this.estadoCivilService.getEstadosCiviles().subscribe({
      next: (data) => this.estadosCiviles = data,
      error: () => {}
    });
    this.etniaService.getEtnias().subscribe({
      next: (data) => {
        this.etnias = data;
        // Set up etnia change subscription after data is loaded
        this.setupEtniaSubscription();
      },
      error: () => {}
    });
    this.paisService.getPaises().subscribe({
      next: (data) => {
        this.paises = data;
        // Aplicar lógica inicial de extranjero
        this.onExtranjeroChange(this.postulacionForm.get('esExtranjero')?.value);
      },
      error: () => {}
    });
    this.cicloService.getAll().subscribe({
      next: (data) => this.ciclos = data,
      error: () => {}
    });
    this.cursoService.getCursos().subscribe({
      next: (data) => this.cursos = data,
      error: () => {}
    });
    this.tipoOfertaService.getTiposOfertaActivos().subscribe({
      next: (data) => this.tiposOferta = data,
      error: () => {}
    });
    
    this.tipoDatoContactoService.getTiposDatoContacto().subscribe({
      next: (data) => {
        this.tiposDatoContacto = data;
        // Filtrar contactos según el campo esObligatorio de la base de datos
        this.tiposDatoContactoObligatorios = data.filter(t => t.esObligatorio === true);
        this.tiposDatoContactoOpcionales = data.filter(t => t.esObligatorio === false || t.esObligatorio === undefined);
        this.loadContactControls();
        },
        error: () => {}
    });

    // Cargar nuevos datos para ayudas económicas
    this.tipoSangreService.getTiposSangre().subscribe({
      next: (data) => this.tiposSangre = data,
      error: () => {}
    });
    this.tipoActividadEconomicaService.getTiposActividadEconomica().subscribe({
      next: (data) => {
        this.tiposActividadEconomica = data;
      },
      error: () => {}
    });
    this.tipoDiscapacidadService.getTiposDiscapacidad().subscribe({
      next: (data) => this.tiposDiscapacidad = data,
      error: () => {}
    });

    // Cargar paralelos
    this.paraleloService.getParalelos().subscribe({
      next: (data) => this.paralelos = data,
      error: () => {}
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
        this.loadRequisitos();
      } else {
        this.requisitos = [];
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
    if (!etniaId) return;
    
    const id = typeof etniaId === 'string' ? parseInt(etniaId, 10) : etniaId;
    const nacionalidadControl = this.postulacionForm.get('idNacionalidadEtnica');

    // Siempre buscar nacionalidades étnicas para la etnia seleccionada
    this.nacionalidadEtnicaService.getNacionalidadesEtnicasByEtnia(id).subscribe({
      next: (data) => {
        this.nacionalidadesEtnicas = data;
        // Seleccionar la primera nacionalidad étnica automáticamente si hay datos
        if (data && data.length > 0) {
          // El backend devuelve la propiedad como 'idnacionalidadEtnica' (todo minúsculas)
          const valorAAsignar = (data[0] as any).idnacionalidadEtnica;
          nacionalidadControl?.setValue(valorAAsignar);
          nacionalidadControl?.markAsDirty();
          nacionalidadControl?.markAsTouched();
          nacionalidadControl?.setValidators(Validators.required);
        } else {
          nacionalidadControl?.setValue(null);
          nacionalidadControl?.clearValidators();
        }
        nacionalidadControl?.updateValueAndValidity();
      },
      error: () => {
        this.nacionalidadesEtnicas = [];
        nacionalidadControl?.setValue(null);
        nacionalidadControl?.clearValidators();
        nacionalidadControl?.updateValueAndValidity();
      }
    });
  }

  onCursoChange(idCurso: number | undefined): void {
    this.loadRequisitos();
  }

  onTrabajaChange(trabaja: boolean): void {
    const actividadControl = this.postulacionForm.get('idTipoActividadEconomica');
    const valorControl = this.postulacionForm.get('valor');
    const esPrincipalControl = this.postulacionForm.get('esPrincipal');
    const activoControl = this.postulacionForm.get('activo');

    if (trabaja) {
      actividadControl?.setValidators(Validators.required);
      valorControl?.setValidators([Validators.required, Validators.min(0)]);
      esPrincipalControl?.setValidators(Validators.required);
      activoControl?.setValidators(Validators.required);
    } else {
      actividadControl?.clearValidators();
      valorControl?.clearValidators();
      esPrincipalControl?.clearValidators();
      activoControl?.clearValidators();

      // Limpiar valores
      this.postulacionForm.patchValue({
        idTipoActividadEconomica: '',
        valor: '',
        esPrincipal: true,
        activo: true
      });
    }

    actividadControl?.updateValueAndValidity();
    valorControl?.updateValueAndValidity();
    esPrincipalControl?.updateValueAndValidity();
    activoControl?.updateValueAndValidity();
  }

  onTieneDiscapacidadChange(tieneDiscapacidad: boolean): void {
    const tipoDiscapacidadControl = this.postulacionForm.get('idTipoDiscapacidad');
    const porcentajeControl = this.postulacionForm.get('porcentaje');

    if (tieneDiscapacidad) {
      tipoDiscapacidadControl?.setValidators(Validators.required);
      porcentajeControl?.setValidators([Validators.required, Validators.min(0), Validators.max(100)]);
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
          this.requisitos = requisitos;

          // Inicializar valores booleanos para requisitos de tipo BOOL
          this.requisitos.forEach(req => {
            if (req.tipoDato === 'BOOL' && req.idRequisitos) {
              this.booleanRequisitos[req.idRequisitos] = false; // Valor por defecto
            }
          });
        },
        error: (err) => {}
      });
    } else {
      this.requisitos = [];
    }
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
      const paisSeleccionado = this.paises.find(p => p.idPais == paisId);
      const esEcuador = paisSeleccionado?.esEcuador || false;

      this.provinciaService.getProvinciasByPais(paisId).subscribe({
        next: (data) => {
          this.provincias = data;
          
          if (!esEcuador && data.length > 0) {
            // Para extranjeros, auto-seleccionar la primera provincia
            const provinciaId = data[0].idProvincia;
            this.postulacionForm.get('idProvincia')?.setValue(provinciaId);
            
            // Cargar cantones automáticamente
            if (provinciaId) {
              this.cantonService.getCantonesByProvincia(provinciaId).subscribe({
                next: (cantones) => {
                  this.cantones = cantones;
                  if (cantones.length > 0) {
                    const cantonId = cantones[0].idCanton;
                    this.postulacionForm.get('idCanton')?.setValue(cantonId);
                    
                    // Cargar parroquias automáticamente
                    if (cantonId) {
                      this.parroquiaService.getParroquiasByCanton(cantonId).subscribe({
                        next: (parroquias) => {
                          this.parroquias = parroquias;
                          if (parroquias.length > 0) {
                            this.postulacionForm.get('idParroquia')?.setValue(parroquias[0].idParroquia);
                          }
                        }
                      });
                    }
                  }
                }
              });
            }
          } else {
            // Para Ecuador, limpiar los campos
            this.postulacionForm.patchValue({ idProvincia: '', idCanton: '', idParroquia: '' });
            this.cantones = [];
            this.parroquias = [];
            // Limpiar selected para autocomplete
            this.selectedProvincia = null;
            this.selectedCanton = null;
            this.selectedParroquia = null;
          }
        },
        error: () => {}
      });
    }
  }

  onProvinciaChange(): void {
    const provinciaId = this.postulacionForm.get('idProvincia')?.value;
    if (provinciaId) {
      // Setear selectedProvincia para el autocomplete
      this.selectedProvincia = this.provincias.find(p => p.idProvincia == provinciaId) || null;
      
      this.cantonService.getCantonesByProvincia(provinciaId).subscribe({
        next: (data) => {
          this.cantones = data;
          this.postulacionForm.patchValue({ idCanton: '', idParroquia: '' });
          this.parroquias = [];
          // Limpiar selected para autocomplete
          this.selectedCanton = null;
          this.selectedParroquia = null;
        },
        error: () => {}
      });
    }
  }

  onCantonChange(): void {
    const cantonId = this.postulacionForm.get('idCanton')?.value;
    if (cantonId) {
      // Setear selectedCanton para el autocomplete
      this.selectedCanton = this.cantones.find(c => c.idCanton == cantonId) || null;
      
      this.parroquiaService.getParroquiasByCanton(cantonId).subscribe({
        next: (data) => {
          this.parroquias = data;
          this.postulacionForm.patchValue({ idParroquia: '' });
          // Limpiar selected para autocomplete
          this.selectedParroquia = null;
        },
        error: () => {}
      });
    }
  }

  /**
   * Filtra las provincias para el autocomplete
   */
  filterProvincias(event: any): void {
    let filtered: ProvinciaDTO[] = [];
    let query = event.query || '';

    // Si no hay query, mostrar todas las provincias
    if (!query.trim()) {
      this.filteredProvincias = this.provincias;
      return;
    }

    for (let i = 0; i < this.provincias.length; i++) {
      let provincia = this.provincias[i];
      if (provincia.nombre && provincia.nombre.toLowerCase().indexOf(query.toLowerCase()) == 0) {
        filtered.push(provincia);
      }
    }

    this.filteredProvincias = filtered;
  }

  /**
   * Filtra los cantones para el autocomplete
   */
  filterCantones(event: any): void {
    let filtered: CantonDTO[] = [];
    let query = event.query || '';

    // Si no hay query, mostrar todos los cantones
    if (!query.trim()) {
      this.filteredCantones = this.cantones;
      return;
    }

    for (let i = 0; i < this.cantones.length; i++) {
      let canton = this.cantones[i];
      if (canton.nombre && canton.nombre.toLowerCase().indexOf(query.toLowerCase()) == 0) {
        filtered.push(canton);
      }
    }

    this.filteredCantones = filtered;
  }

  /**
   * Filtra las parroquias para el autocomplete
   */
  filterParroquias(event: any): void {
    let filtered: ParroquiaDTO[] = [];
    let query = event.query || '';

    // Si no hay query, mostrar todas las parroquias
    if (!query.trim()) {
      this.filteredParroquias = this.parroquias;
      return;
    }

    for (let i = 0; i < this.parroquias.length; i++) {
      let parroquia = this.parroquias[i];
      if (parroquia.nombre && parroquia.nombre.toLowerCase().indexOf(query.toLowerCase()) == 0) {
        filtered.push(parroquia);
      }
    }

    this.filteredParroquias = filtered;
  }

  /**
   * Maneja la selección de provincia en el autocomplete
   */
  onProvinciaSelect(event: any): void {
    console.log('onProvinciaSelect event:', event);
    console.log('selectedProvincia:', this.selectedProvincia);
    const provincia = event.value || event;
    this.postulacionForm.get('idProvincia')?.setValue(provincia.idProvincia);
    // Limpiar cantón y parroquia
    this.selectedCanton = null;
    this.selectedParroquia = null;
    this.postulacionForm.patchValue({ idCanton: '', idParroquia: '' });
    this.cantones = [];
    this.parroquias = [];
    // Cargar cantones de la provincia seleccionada usando el evento directamente
    if (provincia && provincia.idProvincia) {
      console.log('Cargando cantones para provincia:', provincia.idProvincia);
      this.cantonService.getCantonesByProvincia(provincia.idProvincia).subscribe({
        next: (data) => {
          this.cantones = data;
          console.log('Cantones cargados:', data);
        },
        error: (err) => {
          console.error('Error cargando cantones:', err);
        }
      });
    }
  }

  /**
   * Maneja la selección de cantón en el autocomplete
   */
  onCantonSelect(event: any): void {
    const canton = event.value || event;
    this.postulacionForm.get('idCanton')?.setValue(canton.idCanton);
    // Limpiar parroquia
    this.selectedParroquia = null;
    this.postulacionForm.patchValue({ idParroquia: '' });
    this.parroquias = [];
    // Cargar parroquias del cantón seleccionado usando el evento directamente
    if (canton && canton.idCanton) {
      console.log('Cargando parroquias para cantón:', canton.idCanton);
      this.parroquiaService.getParroquiasByCanton(canton.idCanton).subscribe({
        next: (data) => {
          this.parroquias = data;
          console.log('Parroquias cargadas:', data);
        },
        error: (err) => {
          console.error('Error cargando parroquias:', err);
        }
      });
    }
  }

  /**
   * Maneja la selección de parroquia en el autocomplete
   */
  onParroquiaSelect(event: any): void {
    const parroquia = event.value || event;
    this.postulacionForm.get('idParroquia')?.setValue(parroquia.idParroquia);
  }

  onParroquiaChange(): void {
    const parroquiaId = this.postulacionForm.get('idParroquia')?.value;
    if (parroquiaId) {
      // Setear selectedParroquia para el autocomplete
      this.selectedParroquia = this.parroquias.find(p => p.idParroquia == parroquiaId) || null;
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
        
        // Si se completa el paso 5, mostrar modal de confirmación en lugar de ir al paso 6
        if (this.currentStep === 5) {
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
    const form = this.postulacionForm;

    switch (this.currentStep) {
      case 1: // Datos Personales
        isValid = this.validateStep1();
        break;
      case 2: // Datos Geográficos
        isValid = this.validateStep2();
        break;
      case 3: // Datos de Contacto
        isValid = this.validateStep3();
        break;
      case 4: // Datos Académicos
        isValid = this.validateStep4();
        break;
      case 5: // Datos Ayudas Económicas
        isValid = this.validateStep5();
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
    const controls = [
      'idTipoDocumento',
      'documento',
      'primerNombre',
      'primerApellido'
    ];

    return this.validateControls(controls);
  }

  private validateStep2(): boolean {
    // Paso 2: Datos geográficos - mínimo validación
    return true;
  }

  private validateStep3(): boolean {
    // Paso 3: Datos de contacto - validar al menos un contacto obligatorio
    const contactosObligatorios = this.tiposDatoContactoObligatorios;
    for (const contacto of contactosObligatorios) {
      const controlName = `contacto_${contacto.idTipoDatoContacto}`;
      const control = this.postulacionForm.get(controlName);
      if (control && control.value) {
        return true; // Al menos uno tiene valor
      }
    }
    return false; // Ninguno tiene valor
  }

  private validateStep4(): boolean {
    const controls = [
      'idTipoOferta'
    ];

    return this.validateControls(controls);
  }

  private validateStep5(): boolean {
    // Paso 5: Datos ayudas económicas - no requiere validación
    return true;
  }

  private validateControls(controlNames: string[]): boolean {
    for (const controlName of controlNames) {
      const control = this.postulacionForm.get(controlName);
      if (control && control.invalid) {
        control.markAsTouched();
        console.log(`Campo inválido: ${controlName}`, control.errors);
        return false;
      }
      if (control && !control.value) {
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
    // Implementar validación por paso
    return true;
  }

  onFileSelected(event: any, req: RequisitosDTO): void {
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

  private buildConfirmationMessage(): void {
    const formData = this.postulacionForm.getRawValue();
    const nombreCompleto = `${formData.primerNombre || ''} ${formData.segundoNombre || ''} ${formData.primerApellido || ''} ${formData.segundoApellido || ''}`.trim();

    // Construir información de contactos
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
  }

  private buildContactosInfo(formData: any): string {
    let contactosInfo = '';

    // Agregar contactos obligatorios
    this.tiposDatoContactoObligatorios.forEach(tipo => {
      if (tipo.idTipoDatoContacto) {
        const controlName = `contacto_${tipo.idTipoDatoContacto}`;
        const value = formData[controlName];
        if (value) {
          contactosInfo += `
            <li style="margin-bottom: 0.75rem;">
              <strong style="color: var(--text-color-secondary);">${tipo.detalle}:</strong>
              <span style="color: var(--text-color); font-weight: 500;">${value}</span>
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
          contactosInfo += `
            <li style="margin-bottom: 0.75rem;">
              <strong style="color: var(--text-color-secondary);">${tipo.detalle}:</strong>
              <span style="color: var(--text-color); font-weight: 500;">${value}</span>
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

    // Verificar requisitos booleanos que bloquean inscripción
    const requisitosBooleanosInvalidos = this.requisitos.filter(req =>
      req.tipoDato === 'BOOL' && req.bloqueaInscripcion && !this.getBooleanValue(req)
    );

    const hasValidationErrors = this.documentosFaltantes.length > 0 || requisitosBooleanosInvalidos.length > 0;

    // Validar selección de ubicación para no extranjeros
    const esExtranjero = this.postulacionForm.get('esExtranjero')?.value;
    const ubicacionValida = esExtranjero || !!this.selectedProvincia;

    if (this.postulacionForm.valid && !hasValidationErrors && ubicacionValida) {
      // Filtrar requisitos que bloquean inscripción
      this.requisitosBloqueantes = this.requisitos.filter(r => r.bloqueaInscripcion);
      this.modalTitle = 'Confirmación de Postulación';
      
      const formData = this.postulacionForm.getRawValue();
      let message = 'Por favor revise los datos de la postulación:\n\n';
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
        message += '\nLa postulación será creada pero deberá cargar estos documentos posteriormente.\n\n';
      }
      
      message += 'Para que el alumno sea inscrito, debe ingresar los datos obligatorios.\n\n¿Desea continuar?';
      this.modalMessage = message;
      this.showConfirmationModal = true;
    } else {
      this.modalTitle = 'Errores de Validación';
      let message = 'Por favor complete todos los campos requeridos antes de continuar.';
      if (requisitosBooleanosInvalidos.length > 0) {
        message += '\n\nRequisitos booleanos no cumplidos:';
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
    const payload = {
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
      idTipoSangre: toNumberOrNull(formData.idTipoSangre),
      idProvincia: this.selectedProvincia?.idProvincia || null,
      idCanton: this.selectedCanton?.idCanton || null,
      idParroquia: toNumberOrNull(formData.idParroquia),
      direccionDomiciliaria: toNullIfEmpty(formData.direccionDomiciliaria),
      idTipoActividadEconomica: toNumberOrNull(formData.idTipoActividadEconomica),
      valor: formData.valor ? parseFloat(formData.valor) : null,
      esPrincipal: formData.esPrincipal ?? true,
      activo: formData.activo ?? true,
      porcentaje: formData.porcentaje ? parseInt(formData.porcentaje, 10) : null,
      recomendaciones: toNullIfEmpty(formData.recomendaciones),
      idTipoDiscapacidad: toNumberOrNull(formData.idTipoDiscapacidad),
      idPais: toNumberOrNull(formData.idPais),
      realizarPagoInicial: formData.realizarPagoInicial ?? false,
      idMalla: toNumberOrNull(formData.idMalla),
      idParalelo: toNumberOrNull(formData.idParalelo),
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

    this.postulacionService.crearPostulacionManual(formDataToSend).subscribe({
      next: (response) => {
        this.showConfirmationModal = false;
        
        // Verificar si la respuesta tiene la estructura esperada del servidor
        if (response && typeof response === 'object') {
          if (response.isSuccess === true) {
            // Éxito
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: response.message || 'Postulación creada exitosamente',
              life: 5000
            });
            
            // Mostrar advertencia de documentos faltantes si los hay
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
            
            // Navegar después de mostrar el mensaje
            setTimeout(() => {
              this.router.navigate(['/postulacion/success', response.data?.idPostulacion || response.idPostulacion]);
            }, 2000);
          } else {
            // Respuesta del servidor indica error (isSuccess: false)
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: response.message || 'Error al crear la postulación',
              life: 5000
            });
          }
        } else {
          // Respuesta sin estructura esperada - asumir éxito
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Postulación creada exitosamente',
            life: 5000
          });
          
          setTimeout(() => {
            this.router.navigate(['/postulacion/success', response?.idPostulacion]);
          }, 2000);
        }
      },
      error: (error) => {
        this.showConfirmationModal = false;
        
        // Verificar si el error tiene la estructura de respuesta del servidor
        if (error.error && typeof error.error === 'object') {
          const errorResponse = error.error;
          
          this.messageService.add({
            severity: 'error',
            summary: `Error ${errorResponse.statusCode || error.status || ''}`,
            detail: errorResponse.message || 'Error al crear la postulación. Por favor revise los datos e intente nuevamente.',
            life: 6000
          });
          
          // Si hay errores específicos, mostrarlos
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
          // Error genérico sin estructura de respuesta
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.message || 'Error al crear la postulación. Por favor revise los datos e intente nuevamente.',
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
        
        // Si es tipo email, agregar validador de email
        if (this.isEmailContact(tipo.detalle)) {
          validators.push(Validators.email);
        }
        
        // Si es tipo teléfono, agregar validador de patrón numérico
        if (this.isPhoneContact(tipo.detalle)) {
          validators.push(Validators.pattern(/^[0-9]{10}$/));
        }
        
        this.postulacionForm.addControl(
          `contacto_${tipo.idTipoDatoContacto}`,
          this.fb.control('', validators)
        );
      }
    });
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

  /**
   * Obtiene el mensaje de error para un campo de contacto
   */
  getContactError(controlName: string, detalle: string | undefined): string {
    const control = this.postulacionForm.get(controlName);
    if (!control || !control.errors || !control.touched) return '';
    
    if (control.hasError('required')) {
      return 'Este campo es requerido';
    }
    if (control.hasError('email')) {
      return 'Ingrese un correo electrónico válido';
    }
    if (control.hasError('pattern')) {
      if (this.isPhoneContact(detalle)) {
        return 'Ingrese un número de 10 dígitos';
      }
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
    } else if (nombreLower.includes('teléfono') || nombreLower.includes('celular')) {
      return '0999999999';
    } else if (nombreLower.includes('whatsapp')) {
      return '0999999999';
    } else if (nombreLower.includes('telegram')) {
      return '@usuario o número';
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

  hasOptionalContact(idTipo: number | undefined): boolean {
    return this.contactosOpcionalesAgregados.some(c => c.idTipoDatoContacto === idTipo);
  }

  removeOptionalContact(idTipo: number | undefined): void {
    this.contactosOpcionalesAgregados = this.contactosOpcionalesAgregados.filter(c => c.idTipoDatoContacto !== idTipo);
    this.postulacionForm.removeControl(`contacto_opcional_${idTipo}`);
  }

  addOptionalContact(tipo: TipoDatoContactoDTO): void {
    if (tipo.idTipoDatoContacto && !this.hasOptionalContact(tipo.idTipoDatoContacto)) {
      this.contactosOpcionalesAgregados.push(tipo);
      this.postulacionForm.addControl(
        `contacto_opcional_${tipo.idTipoDatoContacto}`,
        this.fb.control('')
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
          datosContactos.push({
            idTipoDatoContacto: tipo.idTipoDatoContacto,
            detalle: value,
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
          datosContactos.push({
            idTipoDatoContacto: tipo.idTipoDatoContacto,
            detalle: value,
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
}