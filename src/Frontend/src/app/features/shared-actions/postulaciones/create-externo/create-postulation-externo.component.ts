import { Component, OnInit, inject, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { DatePickerModule } from 'primeng/datepicker';
import { AutoCompleteModule } from 'primeng/autocomplete';
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
  RequisitosService
} from '../../../../core/services/postulaciones';
import { ConfirmationModalComponent } from '../../../../shared/modal-confirmation/confirmation-modal.component';

interface Step {
  id: number;
  title: string;
  icon: string;
  completed: boolean;
  active: boolean;
}

@Component({
  selector: 'app-create-postulation-externo',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ConfirmationModalComponent, ToastModule, DatePickerModule, AutoCompleteModule],
  providers: [MessageService],
  templateUrl: './create-postulation-externo.component.html',
  styleUrls: ['./create-postulation-externo.component.css']
})
export class CreatePostulationExternoComponent implements OnInit, OnChanges {
  @Input() tipoOfertaAcademica: 'acelerado-virtual' | 'formal-virtual' | null = null;
  @Output() postulacionCompleted = new EventEmitter<{ success: boolean; message: string }>();

  currentStep = 1;
  postulacionForm!: FormGroup;

  steps: Step[] = [
    { id: 1, title: 'Datos Personales', icon: 'pi pi-user', completed: false, active: true },
    { id: 2, title: 'Datos de Contacto', icon: 'pi pi-phone', completed: false, active: false },
    { id: 3, title: 'Curso al que aspira', icon: 'pi pi-graduation-cap', completed: false, active: false }
  ];

  // Datos para selects
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

  // Opciones de instrucción recibida y rezago educativo
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

  // Contactos opcionales agregados
  contactosOpcionalesAgregados: TipoDatoContactoDTO[] = [];

  // Helper para obtener idTipoOferta desde el tipo de oferta académica
  private getIdTipoOfertaFromTipoAcademico(): number | null {
    if (this.tipoOfertaAcademica === 'acelerado-virtual') {
      return 1;
    } else if (this.tipoOfertaAcademica === 'formal-virtual') {
      return 2;
    }
    return null;
  }

  // Método para cargar mallas filtradas por tipo de oferta
  private loadMallasByTipoOferta(): void {
    const idTipoOferta = this.getIdTipoOfertaFromTipoAcademico();
    
    if (idTipoOferta) {
      this.mallaService.getMallasByTipoOferta(idTipoOferta).subscribe({
        next: (data) => {
          this.mallas = data;
          this.todasLasMallas = data;
        },
        error: () => {}
      });
    } else {
      // Si no hay tipo de oferta especificado, cargar todas las mallas
      this.mallaService.getMallas().subscribe({
        next: (data) => {
          this.mallas = data;
          this.todasLasMallas = data;
        },
        error: () => {}
      });
    }
  }

  // Modal de confirmación
  showConfirmationModal: boolean = false;
  modalTitle: string = '¿Desea crear esta postulación?';
  modalMessage: string = 'Por favor confirme que los datos ingresados son correctos.';

  // Edad display
  ageDisplay: string | null = null;

  // Propiedades para validación de documento
  documentoPlaceholder: string = 'Ingrese su documento';
  documentoMaxLength: number = 20;
  documentoErrorMessage: string = '';
  tipoDocumentoSeleccionado: string | null = null;

  // Propiedades para edad
  edadUsuario: number = 0;
  fechaNacimientoUsuario: Date | null = null;

  // MessageService usando inject
  private messageService = inject(MessageService);

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
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    // Detectar cambios en tipoOfertaAcademica y recargar las mallas
    if (changes['tipoOfertaAcademica'] && !changes['tipoOfertaAcademica'].firstChange) {
      console.log('tipoOfertaAcademica changed:', changes['tipoOfertaAcademica'].currentValue);
      this.loadMallasByTipoOferta();
    }
  }

  ngOnInit(): void {
    console.log('CreatePostulationComponent ngOnInit called, tipoOfertaAcademica:', this.tipoOfertaAcademica);
    this.initializeForm();
    this.loadInitialData();
  }

  private initializeForm(): void {
    this.postulacionForm = this.fb.group({
      // Paso 1: Datos Personales
      idTipoDocumento: ['', Validators.required],
      documento: ['', [Validators.required, this.documentoValidator.bind(this)]],
      idGenero: ['', Validators.required],
      primerNombre: ['', Validators.required],
      segundoNombre: [''],
      primerApellido: ['', Validators.required],
      segundoApellido: [''],
      fechaNacimiento: ['', Validators.required],

      // Paso 3: Malla Curricular
      idMalla: ['', Validators.required]
    });

    // Suscribirse a cambios del tipo de documento para actualizar validación
    this.postulacionForm.get('idTipoDocumento')?.valueChanges.subscribe(value => {
      this.onTipoDocumentoChange(value);
    });

    this.postulacionForm.get('fechaNacimiento')?.valueChanges.subscribe(value => {
      this.calculateAge(value);
    });

    // Suscribirse a cambios en la malla para cargar requisitos
    this.postulacionForm.get('idMalla')?.valueChanges.subscribe(value => {
      if (value) {
        this.loadRequisitos();
      } else {
        this.requisitos = [];
      }
    });

    // Suscribirse a cambios en campos de nombre para aplicar title case
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
    
    // Cargar todas las provincias de Ecuador
    this.paisService.getPaises().subscribe({
      next: (paises) => {
        const ecuador = paises.find(p => p.esEcuador);
        if (ecuador && ecuador.idPais) {
          this.provinciaService.getProvinciasByPais(ecuador.idPais).subscribe({
            next: (data) => {
              this.provincias = data;
              this.filteredProvincias = data.slice();
            },
            error: () => {}
          });
        }
      },
      error: () => {}
    });

    // Cargar mallas filtradas por tipo de oferta académica
    this.loadMallasByTipoOferta();

    // Cargar tipos de contacto y separarlos en obligatorios/opcionales
    this.tipoDatoContactoService.getTiposDatoContacto().subscribe({
      next: (data) => {
        this.tiposDatoContacto = data;
        this.tiposDatoContactoObligatorios = data.filter(t => t.esObligatorio);
        this.tiposDatoContactoOpcionales = data.filter(t => !t.esObligatorio);
        // Agregar controles de contacto después de cargar los tipos
        this.loadContactControls();
      },
      error: () => {}
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
      case 'RUC':
      case 'PASAPORTE':
      default:
        // Para todos los tipos de documento, validar que solo contenga caracteres alfanuméricos
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
  }

  /**
   * Convierte un string completamente a mayúsculas
   */
  private toTitleCase(str: string): string {
    if (!str) return str;
    return str.toUpperCase();
  }

  /**
   * Filtra las provincias para el autocomplete
   */
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
  /**
   * Maneja la selección de provincia en el autocomplete
   */
  onProvinciaSelect(event: any): void {
    this.postulacionForm.get('idProvincia')?.setValue(event.idProvincia);
  }

  /**
   * Maneja el clear de provincia en el autocomplete
   */
  onProvinciaClear(): void {
    this.selectedProvincia = null;
    this.postulacionForm.get('idProvincia')?.setValue('');
  }

  /**
   * Obtiene el detalle de la malla seleccionada
   */
  getMallaDetalle(): string {
    const id = this.postulacionForm.get('idMalla')?.value;
    return this.mallas.find(m => m.idMalla == id)?.detalle || '';
  }

  /**
   * Carga los requisitos de la malla seleccionada
   */
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

  /**
   * Formatea una fecha a string yyyy-MM-dd
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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

  setStep(stepId: number): void {
    if (stepId <= this.getMaxAccessibleStep()) {
      this.currentStep = stepId;
      this.updateStepsState();
    }
  }

  nextStep(): void {
    if (this.currentStep < this.steps.length) {
      // Validar el paso actual antes de continuar
      if (!this.isStepValid(this.currentStep)) {
        this.showMessage('error', 'Campos requeridos', 'Por favor complete todos los campos requeridos antes de continuar.');
        return;
      }

      this.steps[this.currentStep - 1].completed = true;
      this.currentStep++;
      this.updateStepsState();
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
      case 1:
        // Validar paso 1: Datos personales
        const paso1Fields = ['idTipoDocumento', 'documento', 'idGenero', 'primerNombre', 'primerApellido', 'fechaNacimiento'];
        const formValid = paso1Fields.every(field => {
          const control = this.postulacionForm.get(field);
          return control && control.valid;
        });
        return formValid && !!this.selectedProvincia;

      case 2:
        // Validar paso 2: Datos de contacto
        // Verificar que todos los contactos obligatorios estén llenos y válidos
        const contactosObligatoriosValidos = this.tiposDatoContactoObligatorios.every(tipo => {
          if (tipo.idTipoDatoContacto) {
            const controlName = `contacto_${tipo.idTipoDatoContacto}`;
            const control = this.postulacionForm.get(controlName);
            return control && control.valid && control.value && control.value.trim() !== '';
          }
          return true;
        });

        // Verificar que los contactos opcionales agregados también sean válidos
        const contactosOpcionalesValidos = this.contactosOpcionalesAgregados.every(tipo => {
          if (tipo.idTipoDatoContacto) {
            const controlName = `contacto_opcional_${tipo.idTipoDatoContacto}`;
            const control = this.postulacionForm.get(controlName);
            return control && control.valid;
          }
          return true;
        });

        return contactosObligatoriosValidos && contactosOpcionalesValidos;

      case 3:
        // Validar paso 3: Malla curricular
        const mallaControl = this.postulacionForm.get('idMalla');
        return mallaControl && mallaControl.valid && mallaControl.value;

      default:
        return true;
    }
  }

  onSubmit(): void {

    if (!this.selectedProvincia) {
      this.showMessage('error', 'Error', 'Debe seleccionar una provincia.');
      return;
    }

    if (this.postulacionForm.valid) {
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
    const formData = this.postulacionForm.getRawValue();

    // Validar que se haya seleccionado una malla
    const idMalla = formData.idMalla ? +formData.idMalla : 0;
    if (!idMalla || idMalla <= 0) {
      this.showMessage('error', 'Error', 'Debe seleccionar una malla curricular.');
      this.showConfirmationModal = false;
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
      FechaNacimiento: formData.fechaNacimiento ? this.formatDate(formData.fechaNacimiento) : '',
      IdProvincia: this.selectedProvincia?.idProvincia || 0,
      IdMalla: idMalla,
      DatosContactos: this.buildDatosContactos(formData)
    };


    this.postulacionService.crearPostulacionExterna(personaPostulacion).subscribe({
      next: (response) => {
        console.log('Postulación externa creada exitosamente:', response);
        this.showConfirmationModal = false;
        this.postulacionCompleted.emit({ 
          success: true, 
          message: '¡Postulación enviada exitosamente! Nos pondremos en contacto contigo pronto.' 
        });
      },
      error: (error) => {
        console.error('Error al crear postulación externa:', error);
        this.showConfirmationModal = false;
        const errorMessage = error?.error?.message || 'Error al enviar la postulación. Por favor, intente nuevamente.';
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
          validators.push(Validators.pattern(/^(09|08|07|06)[0-9]{8}$/));
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
        return 'Ingrese un número de celular válido (ej: 0999999999)';
      }
    }
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

  removeOptionalContact(idTipo: number | undefined): void {
    this.contactosOpcionalesAgregados = this.contactosOpcionalesAgregados.filter(c => c.idTipoDatoContacto !== idTipo);
    this.postulacionForm.removeControl(`contacto_opcional_${idTipo}`);
  }

  hasOptionalContact(idTipo: number | undefined): boolean {
    return this.contactosOpcionalesAgregados.some(c => c.idTipoDatoContacto === idTipo);
  }

  addOptionalContact(tipo: TipoDatoContactoDTO): void {
    if (tipo.idTipoDatoContacto && !this.hasOptionalContact(tipo.idTipoDatoContacto)) {
      this.contactosOpcionalesAgregados.push(tipo);
      
      const validators = [];
      
      // Si es tipo email, agregar validador de email
      if (this.isEmailContact(tipo.detalle)) {
        validators.push(Validators.email);
      }
      
      // Si es tipo teléfono, agregar validador de patrón numérico
      if (this.isPhoneContact(tipo.detalle)) {
        validators.push(Validators.pattern(/^(09|08|07|06)[0-9]{8}$/));
      }
      
      this.postulacionForm.addControl(
        `contacto_opcional_${tipo.idTipoDatoContacto}`,
        this.fb.control('', validators)
      );
    }
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

  private buildDatosContactos(formData: any): DatosContactoPostulacionDTO[] {
    const datosContactos: DatosContactoPostulacionDTO[] = [];

    // Agregar contactos obligatorios
    this.tiposDatoContactoObligatorios.forEach(tipo => {
      if (tipo.idTipoDatoContacto) {
        const controlName = `contacto_${tipo.idTipoDatoContacto}`;
        const value = formData[controlName];
        if (value) {
          datosContactos.push({
            IdTipoDatoContacto: +tipo.idTipoDatoContacto, // Convertir a número
            Detalle: value,
            EsPrincipal: tipo.esObligatorio // Asumiendo que el obligatorio es principal
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
            IdTipoDatoContacto: +tipo.idTipoDatoContacto, // Convertir a número
            Detalle: value,
            EsPrincipal: false
          });
        }
      }
    });

    return datosContactos;
  }
}
