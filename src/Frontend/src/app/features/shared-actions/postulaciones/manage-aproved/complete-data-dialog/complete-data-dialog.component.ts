import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AccordionModule } from 'primeng/accordion';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import { TagModule } from 'primeng/tag';
import { ImageModule } from 'primeng/image';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';

import { PersonaService } from '../../../../../core/services/postulaciones/persona.service';
import { PersonaInfoService } from '../../../../../core/services/postulaciones/persona-info.service';
import { PersonaDireccionService } from '../../../../../core/services/postulaciones/persona-direccion.service';
import { DatosContactoService, DatosContactoDTO } from '../../../../../core/services/postulaciones/datos-contacto.service';
import { PersonaActividadEconomicaService } from '../../../../../core/services/postulaciones/persona-actividad-economica.service';
import { PersonaNacionalidadService } from '../../../../../core/services/postulaciones/persona-nacionalidad.service';
import { PostulacionService } from '../../../../../core/services/postulaciones/postulacion.service';
import { MallaRequisitosService } from '../../../../../core/services/postulaciones/malla-requisitos.service';
import { EstadoCivilService } from '../../../../../core/services/postulaciones/estado-civil.service';
import { TipoSangreService } from '../../../../../core/services/postulaciones/tipo-sangre.service';
import { NacionalidadEtnicaService } from '../../../../../core/services/postulaciones/nacionalidad-etnica.service';
import { TipoDatoContactoService } from '../../../../../core/services/postulaciones/tipo-dato-contacto.service';
import { TipoActividadEconomicaService } from '../../../../../core/services/postulaciones/tipo-actividad-economica.service';
import { EtniaService } from '../../../../../core/services/postulaciones/etnia.service';
import { PaisService } from '../../../../../core/services/postulaciones/pais.service';
import { ProvinciaService } from '../../../../../core/services/postulaciones/provincia.service';
import { CantonService } from '../../../../../core/services/postulaciones/canton.service';
import { ParroquiaService } from '../../../../../core/services/postulaciones/parroquia.service';

import { SharedToastComponent } from '../../../../../shared/shared-toast/shared-toast.component';

import {
  PersonaDTO, MatriculaDTO, PersonaInfoDTO, PersonaDireccionDTO,
  PersonaNacionalidadDTO, PersonaActividadEconomicaDTO, MallaRequisitosDTO,
  EstadoCivilDTO, NacionalidadEtnicaDTO, EtniaDTO,
  TipoDatoContactoDTO, TipoActividadEconomicaDTO, PaisDTO,
  ProvinciaDTO, CantonDTO, ParroquiaDTO
} from '../../../../../data/models/Entities';

@Component({
  selector: 'app-complete-data-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    ToastModule,
    ProgressSpinnerModule,
    AccordionModule,
    InputTextModule,
    SelectModule,
    InputNumberModule,
    DatePickerModule,
    CheckboxModule,
    TagModule,
    ImageModule,
    TooltipModule,
    SharedToastComponent
  ],
  providers: [MessageService],
  templateUrl: './complete-data-dialog.component.html',
  styleUrls: ['./complete-data-dialog.component.css']
})
export class CompleteDataDialogComponent implements OnChanges {

  // Navigation
  activeSection: 'personales' | 'direccion' | 'contacto' | 'requisitos' = 'personales';
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Input() matricula: MatriculaDTO | null = null;
  @Output() onDataSaved = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  @ViewChild('requisitoFileInput') requisitoFileInput!: ElementRef<HTMLInputElement>;

  // Upload state
  uploadingRequisito: { [idRequisitos: number]: boolean } = {};
  selectedRequisitoForUpload: MallaRequisitosDTO | null = null;

  // Services
  private personaService = inject(PersonaService);
  private personaInfoService = inject(PersonaInfoService);
  private personaDireccionService = inject(PersonaDireccionService);
  private datosContactoService = inject(DatosContactoService);
  private personaActividadEconomicaService = inject(PersonaActividadEconomicaService);
  private personaNacionalidadService = inject(PersonaNacionalidadService);
  private postulacionService = inject(PostulacionService);
  private mallaRequisitosService = inject(MallaRequisitosService);
  private estadoCivilService = inject(EstadoCivilService);
  private tipoSangreService = inject(TipoSangreService);
  private nacionalidadEtnicaService = inject(NacionalidadEtnicaService);
  private etniaService = inject(EtniaService);
  private tipoDatoContactoService = inject(TipoDatoContactoService);
  private tipoActividadEconomicaService = inject(TipoActividadEconomicaService);
  private paisService = inject(PaisService);
  private provinciaService = inject(ProvinciaService);
  private cantonService = inject(CantonService);
  private parroquiaService = inject(ParroquiaService);
  private messageService = inject(MessageService);

  // Data
  persona: PersonaDTO | null = null;
  personaInfoData: PersonaInfoDTO | null = null;
  personaDireccionData: PersonaDireccionDTO | null = null;
  contactosData: DatosContactoDTO[] = [];
  actividadEconomicaData: PersonaActividadEconomicaDTO[] = [];
  nacionalidadData: PersonaNacionalidadDTO[] = [];
  documentosPersonalesData: any[] = [];
  mallaRequisitosData: MallaRequisitosDTO[] = [];
  adjuntosCache: { [idAdjunto: number]: string } = {};
  loadingAdjunto: { [idAdjunto: number]: boolean } = {};

  // Flags to determine create vs update
  hasPersonaInfo = false;
  hasPersonaDireccion = false;

  // Catalogs
  estadosCiviles: EstadoCivilDTO[] = [];
  etnias: EtniaDTO[] = [];
  nacionalidadesEtnicas: NacionalidadEtnicaDTO[] = [];
  filteredNacionalidadesEtnicas: NacionalidadEtnicaDTO[] = [];
  tiposDatoContacto: TipoDatoContactoDTO[] = [];
  tiposActividadEconomica: TipoActividadEconomicaDTO[] = [];
  paises: PaisDTO[] = [];
  provincias: ProvinciaDTO[] = [];
  cantones: CantonDTO[] = [];
  parroquias: ParroquiaDTO[] = [];
  allParroquias: ParroquiaDTO[] = [];
  nacioCantones: CantonDTO[] = [];
  nacioParroquias: ParroquiaDTO[] = [];

  // States
  loading = false;
  loadingSections: { [key: string]: boolean } = {};
  loadedSections: { [key: string]: boolean } = {};
  todasLasParroquias: ParroquiaDTO[] = [];
  savingSection: string | null = null;
  activeAccordionPanels: string[] = ['requisitos'];
  selectedCantonId: number | null = null;

  // Edit modes
  editMode: { [key: string]: boolean } = {
    personales: false,
    direccion: false,
    contacto: false,
    actividad: false,
    nacionalidad: false,
    nacio: false
  };

  // Edit data
  editData: any = {
    personales: {},
    direccion: {},
    contacto: {},
    actividad: {},
    nacionalidad: {},
    nacio: {}
  };

  editingContactoIndex = -1;
  editingActividadIndex = -1;

  get idPersona(): number | undefined {
    return (this.matricula as any)?.idPersona || this.matricula?.idUsuarioAlumno;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['matricula']) {
      if (this.matricula) {
        this.resetState();
        this.loadBasicData();
        this.loadCatalogos();
      } else {
        this.resetState();
      }
    }
  }

  // ========== Data Loading ==========

  private loadCatalogos(): void {
    forkJoin({
      estadosCiviles: this.estadoCivilService.getEstadosCiviles().pipe(catchError(() => of([]))),
      etnias: this.etniaService.getEtnias().pipe(catchError(() => of([]))),
      tiposDatoContacto: this.tipoDatoContactoService.getTiposDatoContacto().pipe(catchError(() => of([]))),
      tiposActividadEconomica: this.tipoActividadEconomicaService.getTiposActividadEconomica().pipe(catchError(() => of([]))),
      paises: this.paisService.getPaises().pipe(catchError(() => of([]))),
      provincias: this.provinciaService.getProvincias().pipe(catchError(() => of([]))),
      cantones: this.cantonService.getCantones().pipe(catchError(() => of([])))
    }).subscribe({
      next: (result: any) => {
        this.estadosCiviles = result.estadosCiviles || [];
        this.etnias = result.etnias || [];
        this.tiposDatoContacto = result.tiposDatoContacto || [];
        this.tiposActividadEconomica = result.tiposActividadEconomica || [];
        this.paises = result.paises || [];
        this.provincias = result.provincias || [];
        this.cantones = result.cantones || [];
      },
      error: (err) => console.error('Error cargando catálogos:', err)
    });
  }

  private loadBasicData(): void {
    const idPersona = this.idPersona;
    if (!idPersona) return;

    this.loading = true;
    this.personaService.getPersonaByIdPersona(idPersona).subscribe({
      next: (res) => {
        if (Array.isArray(res) && res.length > 0) {
          this.persona = res[0];
        }
        this.loading = false;
        // Load all sections simultaneously for unified single screen
        this.loadSectionData('personales');
        this.loadSectionData('direccion');
        this.loadSectionData('contacto');
        this.loadSectionData('requisitos');
      },
      error: () => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la información básica' });
      }
    });
  }

  loadSectionData(section: string, forceReload: boolean = false): void {
    const idPersona = this.idPersona;
    if (!idPersona || (!forceReload && (this.loadedSections[section] || this.loadingSections[section]))) return;

    this.loadingSections[section] = true;

    switch (section) {
      case 'personales':
        this.personaInfoService.getByPersona(idPersona).subscribe({
          next: (res) => {
            this.personaInfoData = res;
            this.hasPersonaInfo = !!res;

            // Si tiene nacionalidad étnica, cargar su detalle
            if (this.personaInfoData?.idNacionalidadEtnica) {
              this.nacionalidadEtnicaService.getNacionalidadEtnicaById(this.personaInfoData.idNacionalidadEtnica).subscribe(nac => {
                if (nac) {
                  // Agregar al catálogo local para que getNacionalidadEtnicaNombre lo encuentre
                  if (!this.nacionalidadesEtnicas.find(n => n.idnacionalidadEtnica === nac.idnacionalidadEtnica)) {
                    this.nacionalidadesEtnicas.push(nac);
                  }
                }
                this.finalizeSectionLoad(section);
              });
            } else {
              this.finalizeSectionLoad(section);
            }
          },
          error: () => this.handleSectionError(section)
        });
        break;

      case 'direccion':
        this.personaDireccionService.getByPersona(idPersona).subscribe({
          next: (res) => {
            this.personaDireccionData = res;
            this.hasPersonaDireccion = !!(res && res.idPersonaDireccion);
            if (res?.idParroquia) {
              this.parroquiaService.getParroquiaById(res.idParroquia).subscribe({
                next: (parroquia) => {
                  if (parroquia) this.parroquias = [parroquia];
                  this.finalizeSectionLoad(section);
                },
                error: () => this.finalizeSectionLoad(section)
              });
            } else {
              this.finalizeSectionLoad(section);
            }
          },
          error: () => this.handleSectionError(section)
        });
        break;

      case 'contacto':
        this.datosContactoService.getByPersona(idPersona).subscribe({
          next: (res) => {
            this.contactosData = res || [];
            this.finalizeSectionLoad(section);
          },
          error: () => this.handleSectionError(section)
        });
        break;

      case 'requisitos':
        if (this.matricula?.idMalla) {
          this.mallaRequisitosService.getMallaRequisitosByMalla(this.matricula.idMalla).pipe(
            catchError(() => of([]))
          ).subscribe({
            next: (malla) => {
              this.mallaRequisitosData = malla || [];

              // Cargar documentos personales después de los requisitos de la malla
              this.postulacionService.getDocumentosPersonalesByPersona(idPersona).pipe(
                catchError(() => of({ data: [] }))
              ).subscribe({
                next: (res: any) => {
                  // Manejar si docs.data es un objeto en lugar de un array
                  let rawDocs = res?.data || res;
                  if (rawDocs && typeof rawDocs === 'object' && !Array.isArray(rawDocs)) {
                    this.documentosPersonalesData = Object.values(rawDocs);
                  } else {
                    this.documentosPersonalesData = rawDocs || [];
                  }
                  this.finalizeSectionLoad(section);
                },
                error: () => this.handleSectionError(section)
              });
            },
            error: () => this.handleSectionError(section)
          });
        } else {
          this.handleSectionError(section);
        }
        break;
    }
  }

  private finalizeSectionLoad(section: string): void {
    this.loadingSections[section] = false;
    this.loadedSections[section] = true;
  }

  private handleSectionError(section: string): void {
    this.loadingSections[section] = false;
    this.messageService.add({ severity: 'error', summary: 'Error', detail: `Error al cargar datos de ${section}` });
  }

  private loadAllData(): void {
    // This is now replaced by loadSectionData but kept for reference or bulk updates if needed
    this.loadBasicData();
  }

  // ========== Name Resolution Helpers ==========

  getEstadoCivilNombre(id?: number | null): string {
    if (!id) return 'No registrado';
    const item = this.estadosCiviles.find(e => e.idEstadoCivil === id);
    return item?.nombre || 'No registrado';
  }

  getNacionalidadEtnicaNombre(id?: number | null): string {
    if (!id) return 'No registrada';
    // Buscamos en todas las nacionales étnicas (si las tenemos cargadas)
    // O mejor, el componente debería haber cargado el catálogo completo al inicio o por demanda.
    // Como ahora se filtra, necesitamos tener una referencia.
    const item = this.nacionalidadesEtnicas.find(n => n.idnacionalidadEtnica === id);
    return item?.nombre || 'No registrada';
  }

  getTipoDatoContactoNombre(idOrContacto?: number | DatosContactoDTO | null): string {
    if (!idOrContacto) return 'Contacto';
    if (typeof idOrContacto === 'number') {
      const item = this.tiposDatoContacto.find(t => t.idTipoDatoContacto === idOrContacto);
      return item?.detalle || 'Contacto';
    }
    if (idOrContacto.idTipoDatoContacto) {
      const item = this.tiposDatoContacto.find(t => t.idTipoDatoContacto === idOrContacto.idTipoDatoContacto);
      if (item?.detalle) return item.detalle;
    }
    if (idOrContacto.tipocontacto?.detalle) {
      return idOrContacto.tipocontacto.detalle.trim();
    }
    return 'Contacto';
  }

  getTipoActividadEconomicaNombre(id?: number): string {
    if (!id) return '-';
    const item = this.tiposActividadEconomica.find(t => t.idtipoActividadEconomica === id);
    return item?.nombre || '-';
  }

  getPaisNombre(id?: number): string {
    if (!id) return '-';
    const item = this.paises.find(p => p.idPais === id);
    return item?.nombre || '-';
  }

  getParroquiaNombre(id?: number): string {
    if (!id) return 'No registrada';
    // Si la parroquia actual no está en el listado filtrado, intentar buscarla por ID
    const current = this.parroquias.find(p => p.idParroquia === id);
    if (current) return current.nombre || 'No registrada';

    // Como no cargamos todas las parroquias, si no la encontramos, devolvemos el nombre que traiga el DTO o 'Cargando...'
    return this.personaDireccionData?.nombreParroquia || 'Cargando...';
  }

  onCantonChange(event: any): void {
    const idCanton = event?.value || event;
    this.editData.direccion.idParroquia = null;
    this.parroquias = [];

    if (idCanton) {
      this.parroquiaService.getParroquiasByCanton(idCanton).subscribe({
        next: (parroquias) => {
          this.parroquias = parroquias || [];
        },
        error: (err) => console.error('Error cargando parroquias por cantón:', err)
      });
    }
  }

  private loadInitialAddressSelection(idParroquia: number): void {
    // Buscar la parroquia para saber su cantón
    this.parroquiaService.getParroquiaById(idParroquia).subscribe(parroquia => {
      if (parroquia && parroquia.idCanton) {
        this.selectedCantonId = parroquia.idCanton;
        this.editData.direccion.idCanton = parroquia.idCanton;

        // Cargar las parroquias de ese cantón para poblar el dropdown
        this.parroquiaService.getParroquiasByCanton(parroquia.idCanton).subscribe(res => {
          this.parroquias = res || [];
          this.editData.direccion.idParroquia = idParroquia;
        });
      }
    });
  }

  private loadCantones(idProvincia: number, auto: boolean = false): void {
    this.cantonService.getCantonesByProvincia(idProvincia).subscribe({
      next: (cantones) => {
        this.cantones = cantones || [];
        if (!auto) this.editData.direccion.idCanton = null;
      },
      error: (err) => console.error('Error cargando cantones:', err)
    });
  }

  private loadParroquias(idCanton: number, auto: boolean = false): void {
    this.parroquiaService.getParroquiasByCanton(idCanton).subscribe({
      next: (parroquias) => {
        this.parroquias = parroquias || [];
        if (!auto) this.editData.direccion.idParroquia = null;
      },
      error: (err) => console.error('Error cargando parroquias:', err)
    });
  }

  // ========== Edit Methods ==========

  startEdit(section: string): void {
    this.editMode[section] = true;
    this.initEditData(section);
  }

  cancelEdit(section: string): void {
    this.editMode[section] = false;
    this.editData[section] = {};
    if (section === 'contacto') this.editingContactoIndex = -1;
    if (section === 'actividad') this.editingActividadIndex = -1;
    if (section === 'nacio' || section === 'nacionalidad') {
      this.nacioCantones = [];
      this.nacioParroquias = [];
    }
  }

  private initEditData(section: string): void {
    switch (section) {
      case 'personales':
        this.editData.personales = {
          fechaNacimiento: this.personaInfoData?.fechaNacimiento ? new Date(this.personaInfoData.fechaNacimiento) : null,
          idEstadoCivil: this.personaInfoData?.idEstadoCivil || null,
          idEtnia: null,
          idNacionalidadEtnica: this.personaInfoData?.idNacionalidadEtnica || null
        };
        // Si ya tiene nacionalidad étnica, intentar cargar etnia
        if (this.editData.personales.idNacionalidadEtnica) {
          this.loadEtniaFromNacionalidad(this.editData.personales.idNacionalidadEtnica);
        }
        break;
      case 'direccion':
        this.editData.direccion = {
          idCanton: null,
          idParroquia: this.personaDireccionData?.idParroquia || null,
          direccionDomiciliaria: this.personaDireccionData?.direccionDomiciliaria || ''
        };

        if (this.editData.direccion.idParroquia) {
          this.loadInitialAddressSelection(this.editData.direccion.idParroquia);
        }
        break;
      case 'contacto':
        this.editData.contacto = {
          idDatosContacto: null,
          idTipoDatoContacto: null,
          detalle: '',
          esPrincipal: false
        };
        this.editingContactoIndex = -1;
        break;
      case 'actividad':
        this.editData.actividad = {
          idPersonaActividadEconomica: null,
          idTipoActividadEconomica: null,
          valor: 0,
          esPrincipal: true,
          activo: true
        };
        this.editingActividadIndex = -1;
        break;
      case 'nacionalidad':
        this.editData.nacionalidad = {
          idPais: null,
          idNacioProvincia: null,
          idNacioCanton: null,
          idNacioParroquia: null
        };
        this.nacioCantones = [];
        this.nacioParroquias = [];
        this.loadProvinciasForStudentNationality();
        break;
      case 'nacio':
        this.editData.nacio = {
          idNacioProvincia: null,
          idNacioCanton: null,
          idNacioParroquia: null
        };
        this.nacioCantones = [];
        this.nacioParroquias = [];
        this.loadProvinciasForStudentNationality();
        break;
    }
  }

  editContacto(index: number): void {
    const contacto = this.contactosData[index];
    this.editMode['contacto'] = true;
    this.editingContactoIndex = index;
    this.editData.contacto = {
      idDatosContacto: contacto.idDatosContacto,
      idTipoDatoContacto: contacto.idTipoDatoContacto,
      detalle: contacto.detalle,
      esPrincipal: contacto.esPrincipal
    };
  }

  editActividad(index: number): void {
    const actividad = this.actividadEconomicaData[index];
    this.editMode['actividad'] = true;
    this.editingActividadIndex = index;
    this.editData.actividad = {
      idPersonaActividadEconomica: actividad.idPersonaActividadEconomica,
      idTipoActividadEconomica: actividad.idTipoActividadEconomica,
      valor: actividad.valor,
      esPrincipal: actividad.esPrincipal ?? true,
      activo: actividad.activo ?? true
    };
  }

  // ========== Save Methods ==========

  savePersonaInfo(): void {
    if (!this.idPersona) return;
    this.savingSection = 'personales';

    const request = {
      idPersona: this.idPersona,
      fechaNacimiento: this.editData.personales.fechaNacimiento
        ? this.formatDate(this.editData.personales.fechaNacimiento)
        : undefined,
      idEstadoCivil: this.editData.personales.idEstadoCivil,
      idNacionalidadEtnica: this.editData.personales.idNacionalidadEtnica
    };

    const operation = this.hasPersonaInfo
      ? this.personaInfoService.update(request)
      : this.personaInfoService.create(request);

    operation.subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Información personal actualizada' });
        this.editMode['personales'] = false;
        this.savingSection = null;
        this.reloadPersonaInfo();
      },
      error: (err) => {
        console.error('Error guardando persona info:', err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la información personal' });
        this.savingSection = null;
      }
    });
  }

  savePersonaDireccion(): void {
    if (!this.idPersona) return;
    this.savingSection = 'direccion';

    const idPersonaDireccion = this.personaDireccionData?.idPersonaDireccion || 0;
    const request = {
      idPersonaDireccion: idPersonaDireccion,
      idPersona: this.idPersona,
      idParroquia: this.editData.direccion.idParroquia,
      direccionDomiciliaria: this.editData.direccion.direccionDomiciliaria,
      activo: true
    };

    // Use update if it exists, otherwise create
    const operation = (this.hasPersonaDireccion && idPersonaDireccion > 0)
      ? this.personaDireccionService.update(request)
      : this.personaDireccionService.create(request);

    operation.subscribe({
      next: () => this.onDireccionSaved(this.hasPersonaDireccion ? 'Dirección actualizada' : 'Dirección registrada'),
      error: (err) => this.onDireccionError(err)
    });
  }

  private onDireccionSaved(detail: string): void {
    this.messageService.add({ severity: 'success', summary: 'Guardado', detail });
    this.editMode['direccion'] = false;
    this.savingSection = null;
    this.reloadPersonaDireccion();
  }

  private onDireccionError(err: any): void {
    console.error('Error guardando dirección:', err);
    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la dirección' });
    this.savingSection = null;
  }

  saveDatosContacto(): void {
    if (!this.idPersona) return;

    // 1. Validaciones de campos obligatorios
    if (!this.editData.contacto.idTipoDatoContacto) {
      this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Debe seleccionar el tipo de contacto' });
      return;
    }

    if (!this.editData.contacto.detalle || !this.editData.contacto.detalle.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Debe ingresar el detalle (correo o número)' });
      return;
    }

    this.savingSection = 'contacto';

    const contactoData = {
      idDatosContacto: this.editData.contacto.idDatosContacto || 0,
      idPersona: this.idPersona,
      idTipoDatoContacto: this.editData.contacto.idTipoDatoContacto,
      detalle: this.editData.contacto.detalle.trim(),
      esPrincipal: this.editData.contacto.esPrincipal
    };

    // 2. Validaciones de formato según el tipo
    const tipoDato = this.getTipoDatoContactoNombre(contactoData.idTipoDatoContacto).toLowerCase();

    if (tipoDato.includes('mail') || tipoDato.includes('correo')) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
      if (!emailRegex.test(contactoData.detalle)) {
        this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'El formato de correo no es válido' });
        this.savingSection = null;
        return;
      }
    } else if (tipoDato.includes('celular') || tipoDato.includes('móvil') || tipoDato.includes('movil') || tipoDato.includes('teléfono')) {
      // Validar que sean solo números y longitud correcta (ej. 10 para celular Ecuador)
      const isCelular = tipoDato.includes('celular') || tipoDato.includes('móvil') || tipoDato.includes('movil');
      if (isCelular) {
        const phoneRegex = /^09\d{8}$/;
        if (!phoneRegex.test(contactoData.detalle)) {
          this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'El celular debe empezar con 09 y tener 10 dígitos' });
          this.savingSection = null;
          return;
        }
      }
    }

    // SIEMPRE envolver en { datosContactos: [ ... ] } para create y update si el backend lo requiere así
    const requestPayload = { datosContactos: [contactoData] };

    const operation = this.editingContactoIndex >= 0
      ? this.datosContactoService.update(contactoData)
      : this.datosContactoService.create(requestPayload);

    // Si el update también falla, probar envolverlo también. Pero usualmente PUT /{id} no lleva wrap.
    // Sin embargo, si el usuario dice que no guarda, tal vez el update sea masivo también?
    // Verificaremos.

    operation.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success', summary: 'Guardado',
          detail: this.editingContactoIndex >= 0 ? 'Contacto actualizado' : 'Contacto agregado'
        });
        this.editMode['contacto'] = false;
        this.savingSection = null;
        this.editingContactoIndex = -1;
        this.reloadContactos();
      },
      error: (err) => {
        console.error('Error guardando contacto:', err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el contacto' });
        this.savingSection = null;
      }
    });
  }

  saveActividadEconomica(): void {
    if (!this.idPersona) return;
    this.savingSection = 'actividad';

    // El usuario pidió: elimina el dato valor visualmente y pasa en null a backend,
    // elimina es principal y activo y pasa es principal como falso y activo como activado
    const requestBase: any = {
      idPersona: this.idPersona,
      idTipoActividadEconomica: this.editData.actividad.idTipoActividadEconomica,
      valor: null,
      esPrincipal: false,
      activo: true
    };

    if (this.editingActividadIndex >= 0) {
      const request = {
        ...requestBase,
        idPersonaActividadEconomica: this.editData.actividad.idPersonaActividadEconomica
      };
      this.personaActividadEconomicaService.update(request).subscribe({
        next: () => this.onActividadSaved('Actividad económica actualizada'),
        error: (err) => this.onActividadError(err)
      });
    } else {
      this.personaActividadEconomicaService.create(requestBase).subscribe({
        next: () => this.onActividadSaved('Actividad económica agregada'),
        error: (err) => this.onActividadError(err)
      });
    }
  }

  private onActividadSaved(detail: string): void {
    this.messageService.add({ severity: 'success', summary: 'Guardado', detail });
    this.editMode['actividad'] = false;
    this.savingSection = null;
    this.editingActividadIndex = -1;
    this.reloadActividadEconomica();
  }

  private onActividadError(err: any): void {
    console.error('Error guardando actividad económica:', err);
    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la actividad económica' });
    this.savingSection = null;
  }

  saveNacio(): void {
    if (!this.idPersona) return;
    const nac = this.nacionalidadData[0];
    if (!nac?.idPersonaNacionalidad) return;
    this.savingSection = 'nacio';

    const nacioStr = this.buildNacioString('nacio');
    const request = {
      idPersonaNacionalidad: nac.idPersonaNacionalidad,
      idPersona: this.idPersona!,
      idPais: nac.idPais!,
      nacio: nacioStr
    };

    this.personaNacionalidadService.update(request).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Lugar de nacimiento registrado correctamente' });
        this.editMode['nacio'] = false;
        this.editData.nacio = {};
        this.nacioCantones = [];
        this.nacioParroquias = [];
        this.savingSection = null;
        this.reloadNacionalidad();
      },
      error: (err) => {
        console.error('Error guardando nacio:', err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo registrar el lugar de nacimiento' });
        this.savingSection = null;
      }
    });
  }

  buildNacioString(section: string = 'nacionalidad'): string {
    const parts: string[] = [];
    const data = this.editData[section];
    const pais = this.paises.find(p => p.idPais === data.idNacioPais);
    if (pais?.nombre) parts.push(pais.nombre);
    const prov = this.provincias.find(p => p.idProvincia === data.idNacioProvincia);
    if (prov?.nombre) parts.push(prov.nombre);
    const canton = this.nacioCantones.find(c => c.idCanton === data.idNacioCanton);
    if (canton?.nombre) parts.push(canton.nombre);
    const parr = this.nacioParroquias.find(p => p.idParroquia === data.idNacioParroquia);
    if (parr?.nombre) parts.push(parr.nombre);
    return parts.join(', ');
  }

  onNacioProvinciaChange(event: any, section: string = 'nacionalidad'): void {
    const idProvincia = event?.value || event;
    this.editData[section].idNacioCanton = null;
    this.editData[section].idNacioParroquia = null;
    this.nacioCantones = [];
    this.nacioParroquias = [];
    if (idProvincia) {
      this.cantonService.getCantonesByProvincia(idProvincia).subscribe({
        next: (cantones) => this.nacioCantones = cantones || [],
        error: (err) => console.error('Error cargando cantones nacio:', err)
      });
    }
  }

  onNacioCantonChange(event: any, section: string = 'nacionalidad'): void {
    const idCanton = event?.value || event;
    this.editData[section].idNacioParroquia = null;
    this.nacioParroquias = [];
    if (idCanton) {
      this.parroquiaService.getParroquiasByCanton(idCanton).subscribe({
        next: (parroquias) => this.nacioParroquias = parroquias || [],
        error: (err) => console.error('Error cargando parroquias nacio:', err)
      });
    }
  }

  onEtniaChange(event: any): void {
    const idEtnia = event?.value || event;
    this.editData.personales.idNacionalidadEtnica = null;
    this.filteredNacionalidadesEtnicas = [];
    if (idEtnia) {
      this.nacionalidadEtnicaService.getNacionalidadesEtnicasByEtnia(idEtnia).subscribe({
        next: (res) => {
          const list = res || [];
          // Intentar filtrar por esNinguna === false
          let filtered = list.filter(n => n.esNinguna === false);
          // Si no hay ninguno que no sea "ninguna" (ej. solo hay "NO APLICA"), mostrar todos o los que tengan esNinguna true
          if (filtered.length === 0) {
            filtered = list;
          }
          this.filteredNacionalidadesEtnicas = filtered;

          // Si solo hay un elemento, seleccionarlo automáticamente
          if (this.filteredNacionalidadesEtnicas.length === 1) {
            this.editData.personales.idNacionalidadEtnica = this.filteredNacionalidadesEtnicas[0].idnacionalidadEtnica;
          }
        },
        error: (err) => console.error('Error cargando nacionalidades étnicas:', err)
      });
    }
  }

  private loadEtniaFromNacionalidad(idNacionalidad: number): void {
    // Primero necesitamos saber a qué etnia pertenece esta nacionalidad.
    // Si no tenemos el catálogo completo de nacionalidades, podrímos llamar a un servicio
    // o si el DTO de personaInfo ya lo trajera... pero parece que no.
    // Usaremos el servicio para obtener todas una vez para tener la referencia si es necesario,
    // o simplemente buscamos en el catálogo si ya lo cargamos.
    if (this.nacionalidadesEtnicas.length === 0) {
      this.nacionalidadEtnicaService.getNacionalidadesEtnicas().subscribe(res => {
        this.nacionalidadesEtnicas = res || [];
        this.setEtniaFromCatalog(idNacionalidad);
      });
    } else {
      this.setEtniaFromCatalog(idNacionalidad);
    }
  }

  private setEtniaFromCatalog(idNacionalidad: number): void {
    const nac = this.nacionalidadesEtnicas.find(n => n.idnacionalidadEtnica === idNacionalidad);
    if (nac?.idEtnia) {
      this.editData.personales.idEtnia = nac.idEtnia;
      // Cargar las opciones filtradas para el segundo combo
      this.onEtniaChange(nac.idEtnia);
      // Restaurar el valor original después de que se cargue la lista (aunque onEtniaChange lo limpia)
      setTimeout(() => {
        this.editData.personales.idNacionalidadEtnica = idNacionalidad;
      }, 500);
    }
  }

  saveNacionalidad(): void {
    if (!this.idPersona) return;
    this.savingSection = 'nacionalidad';

    const request = {
      idPersona: this.idPersona,
      idPais: this.editData.nacionalidad.idPais,
      nacio: this.buildNacioString('nacionalidad') || undefined
    };

    this.personaNacionalidadService.create(request).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Nacionalidad registrada correctamente' });
        this.editMode['nacionalidad'] = false;
        this.savingSection = null;
        this.reloadNacionalidad();
      },
      error: (err) => {
        console.error('Error guardando nacionalidad:', err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo registrar la nacionalidad' });
        this.savingSection = null;
      }
    });
  }

  // ========== Reload Methods ==========

  private reloadPersonaInfo(): void {
    if (!this.idPersona) return;
    this.personaInfoService.getByPersona(this.idPersona).subscribe(data => {
      this.personaInfoData = data;
      this.hasPersonaInfo = !!data;
    });
  }

  private reloadPersonaDireccion(): void {
    if (!this.idPersona) return;
    this.personaDireccionService.getByPersona(this.idPersona).subscribe(data => {
      this.personaDireccionData = data;
      this.hasPersonaDireccion = !!(data && data.idPersonaDireccion);
    });
  }

  private reloadContactos(): void {
    if (!this.idPersona) return;
    this.datosContactoService.getByPersona(this.idPersona).subscribe(data => {
      this.contactosData = data || [];
    });
  }

  private reloadActividadEconomica(): void {
    if (!this.idPersona) return;
    this.personaActividadEconomicaService.getByPersona(this.idPersona).subscribe(data => {
      this.actividadEconomicaData = data || [];
    });
  }

  private reloadNacionalidad(): void {
    if (!this.idPersona) return;
    this.personaNacionalidadService.getByPersona(this.idPersona).subscribe(data => {
      this.nacionalidadData = data || [];
    });
  }

  // ========== Documentos & Requisitos ==========

  getRequisitoStatus(requisito: MallaRequisitosDTO): 'cumplido' | 'pendiente' {
    const doc = this.documentosPersonalesData.find(
      (d: any) => Number(d.codigoRequisito) === requisito.idRequisitos
    );
    return doc ? 'cumplido' : 'pendiente';
  }

  getDocumentoForRequisito(requisito: MallaRequisitosDTO): any | null {
    return this.documentosPersonalesData.find(
      (d: any) => Number(d.codigoRequisito) === requisito.idRequisitos
    ) || null;
  }

  get requisitosCumplidos(): number {
    return this.mallaRequisitosData.filter(r => this.getRequisitoStatus(r) === 'cumplido').length;
  }

  get requisitosObligatoriosPendientes(): number {
    return this.mallaRequisitosData.filter(
      r => r.esObligatorio && this.getRequisitoStatus(r) === 'pendiente'
    ).length;
  }

  previewAdjunto(idAdjunto: number): void {
    if (!idAdjunto) return;

    // Si ya está en cache, abrir directamente
    if (this.adjuntosCache[idAdjunto]) {
      window.open(this.adjuntosCache[idAdjunto], '_blank');
      return;
    }

    this.loadingAdjunto[idAdjunto] = true;
    this.postulacionService.getAdjunto(idAdjunto).subscribe({
      next: (adjunto) => {
        const url = URL.createObjectURL(adjunto.blob);
        this.adjuntosCache[idAdjunto] = url;
        this.loadingAdjunto[idAdjunto] = false;
        window.open(url, '_blank');
      },
      error: (err) => {
        console.error('Error al obtener adjunto:', err);
        this.loadingAdjunto[idAdjunto] = false;
        this.messageService.add({
          severity: 'error', summary: 'Error',
          detail: 'No se pudo cargar el archivo adjunto'
        });
      }
    });
  }

  // ========== Requisito Upload ==========

  triggerRequisitoUpload(requisito: MallaRequisitosDTO): void {
    this.selectedRequisitoForUpload = requisito;
    this.requisitoFileInput.nativeElement.value = '';
    this.requisitoFileInput.nativeElement.click();
  }

  async onRequisitoFileSelected(event: any): Promise<void> {
    let file: File = event.target.files?.[0];
    if (!file || !this.selectedRequisitoForUpload || !this.idPersona) {
      this.selectedRequisitoForUpload = null;
      return;
    }

    const requisito = this.selectedRequisitoForUpload;
    this.selectedRequisitoForUpload = null;
    this.uploadingRequisito[requisito.idRequisitos] = true;

    const documentos = [{
      documentoPersonal: {
        idPersona: this.idPersona,
        idTipoDocumentoPersonal: 1,
        codigoRequisito: requisito.idRequisitos.toString(),
        estado: true,
        valorDato: true,
        observacion: requisito.detalleRequisito,
        tieneArchivo: true
      },
      file: file
    }];

    this.postulacionService.createDocumentosPersonalesConArchivos(documentos).subscribe({
      next: () => {
        this.uploadingRequisito[requisito.idRequisitos] = false;
        this.messageService.add({
          severity: 'success', summary: 'Subido',
          detail: `Documento "${requisito.detalleRequisito}" subido correctamente`
        });
        this.reloadDocumentosPersonales();
      },
      error: () => {
        this.uploadingRequisito[requisito.idRequisitos] = false;
        this.messageService.add({
          severity: 'error', summary: 'Error',
          detail: 'No se pudo subir el documento'
        });
      }
    });
  }

  saveBoolRequisito(requisito: MallaRequisitosDTO, valor: boolean): void {
    if (!this.idPersona) return;
    this.uploadingRequisito[requisito.idRequisitos] = true;

    this.postulacionService.createDocumentoPersonalSinArchivo({
      idPersona: this.idPersona,
      idTipoDocumentoPersonal: 1,
      idAdjunto: null,
      codigoRequisito: requisito.idRequisitos.toString(),
      estado: valor,
      valorDato: valor,
      observacion: requisito.detalleRequisito
    }).subscribe({
      next: () => {
        this.uploadingRequisito[requisito.idRequisitos] = false;
        this.messageService.add({
          severity: 'success', summary: 'Guardado',
          detail: `Requisito "${requisito.detalleRequisito}" registrado`
        });
        this.reloadDocumentosPersonales();
      },
      error: () => {
        this.uploadingRequisito[requisito.idRequisitos] = false;
        this.messageService.add({
          severity: 'error', summary: 'Error',
          detail: 'No se pudo guardar el requisito'
        });
      }
    });
  }

  private reloadDocumentosPersonales(): void {
    if (!this.idPersona) return;
    this.postulacionService.getDocumentosPersonalesByPersona(this.idPersona).subscribe({
      next: (response: any) => {
        this.documentosPersonalesData = response?.data || response || [];
        if (!Array.isArray(this.documentosPersonalesData)) {
          this.documentosPersonalesData = [];
        }
      },
      error: () => {
        this.documentosPersonalesData = [];
      }
    });
  }

  // ========== Geographic Cascading ==========

  private loadProvinciasForStudentNationality(): void {
    // Obtener el idPais de la nacionalidad del estudiante
    const idPais = this.nacionalidadData?.[0]?.idPais;
    if (!idPais) {
      console.warn('No se encontró nacionalidad del estudiante');
      return;
    }

    this.provinciaService.getProvinciasByPais(idPais).subscribe({
      next: (provincias) => {
        this.provincias = provincias || [];
      },
      error: (err) => console.error('Error cargando provincias:', err)
    });
  }

  // No redundant methods here, removed duplicates in previous step or below

  // ========== Finalización ==========

  finishDataCompletion(): void {
    if (this.tieneDatosFaltantes) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Información incompleta',
        detail: 'Aún existen requisitos/documentos pendientes por completar.'
      });
      return;
    }

    this.messageService.add({
      severity: 'success',
      summary: 'Gestión completada',
      detail: 'Se completaron los datos correctamente.'
    });

    this.onDataSaved.emit();
  }

  private resetState(): void {
    this.activeSection = 'personales';
    this.persona = null;
    this.personaInfoData = null;
    this.personaDireccionData = null;
    this.contactosData = [];
    this.actividadEconomicaData = [];
    this.nacionalidadData = [];
    this.documentosPersonalesData = [];
    this.mallaRequisitosData = [];
    // Revocar URLs de adjuntos en cache
    Object.values(this.adjuntosCache).forEach(url => URL.revokeObjectURL(url));
    this.adjuntosCache = {};
    this.loadingAdjunto = {};
    this.uploadingRequisito = {};
    this.selectedRequisitoForUpload = null;
    this.hasPersonaInfo = false;
    this.hasPersonaDireccion = false;
    this.loadedSections = {};
    this.loadingSections = {};
    this.loading = false;
    this.savingSection = null;
    this.editMode = { personales: false, direccion: false, contacto: false, actividad: false, nacionalidad: false };
    this.editData = { personales: {}, direccion: {}, contacto: {}, actividad: {}, nacionalidad: {} };
    this.editingContactoIndex = -1;
    this.editingActividadIndex = -1;
    this.cantones = [];
    this.parroquias = [];
  }

  // ========== Helpers ==========

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  calcularEdad(fechaNacimiento?: string | null): string {
    if (!fechaNacimiento) return 'No disponible';
    const nacimiento = new Date(fechaNacimiento);
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
    return `${edad} años`;
  }

  setSection(section: 'personales' | 'direccion' | 'contacto' | 'requisitos'): void {
    this.activeSection = section;
    this.loadSectionData(section, true);
  }

  // ========== Getters for Completeness ==========

  get datosFaltantesPersonales(): boolean {
    return !this.personaInfoData?.fechaNacimiento || !this.personaInfoData?.idNacionalidadEtnica;
  }

  get datosFaltantesDireccion(): boolean {
    return !this.personaDireccionData?.direccionDomiciliaria;
  }

  get datosFaltantesContacto(): boolean {
    return this.contactosData.length === 0;
  }

  get datosFaltantesNacionalidad(): boolean {
    // If we have idNacionalidadEtnica in personaInfo, we can consider it "sufficient" 
    // for this phase, or keep it if strictly required. 
    // Relaxing it to not block if info is in personaInfo.
    return !this.personaInfoData?.idNacionalidadEtnica;
  }

  get datosFaltantesRequisitos(): boolean {
    return this.requisitosObligatoriosPendientes > 0;
  }

  get tieneDatosFaltantes(): boolean {
    // Only lock completion based on requirements as per user request
    return this.datosFaltantesRequisitos;
  }

  get contactoPlaceholder(): string {
    const tipo = this.getTipoDatoContactoNombre(this.editData.contacto?.idTipoDatoContacto).toLowerCase();
    if (tipo.includes('celular') || tipo.includes('móvil') || tipo.includes('movil')) return 'Ej: 0987654321';
    if (tipo.includes('teléfono') || tipo.includes('telefono') || tipo.includes('fijo')) return 'Ej: 022345678';
    if (tipo.includes('mail') || tipo.includes('correo')) return 'Ej: usuario@correo.com';
    return 'Ingrese el valor';
  }

  get listaCamposFaltantes(): string[] {
    const faltantes: string[] = [];
    if (this.datosFaltantesRequisitos) faltantes.push('Requisitos/Documentos Obligatorios');
    return faltantes;
  }
}
