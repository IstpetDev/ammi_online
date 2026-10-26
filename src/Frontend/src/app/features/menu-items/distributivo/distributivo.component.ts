
import { Component, OnInit, inject } from '@angular/core';
import { lastValueFrom, forkJoin, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';
import { PasswordModule } from 'primeng/password';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService, ConfirmationService } from 'primeng/api';

// Servicios
import { DistributivoService } from '../../../core/services/infrastructure/distributivo.service';
import { MallaService } from '../../../core/services/infrastructure/malla.service';
import { DetalleMallaService } from '../../../core/services/infrastructure/detalle-malla.service';
import { CicloService } from '../../../core/services/postulaciones/ciclo.service';
import { ParaleloService } from '../../../core/services/postulaciones/paralelo.service';
import { TipoOfertaService } from '../../../core/services/infrastructure/tipo-oferta.service';
import { MallaParaleloService } from '../../../core/services/infrastructure/malla-paralelo.service';

// Modelos
import {
  DistributivoDTO,
  DocenteDisponibleDTO,
  CargaDocenteDTO
} from '../../../data/models/distributivo/distributivo.model';
import { MallaDTO, CicloDTO, ParaleloDTO, TipoOfertaDTO, RegimenDTO, PeriodoLectivoDTO } from '../../../data/models/Entities';
import { PersonaDTO, RolDTO, UsuarioDTO, TipoDocumentoDTO, GeneroDTO } from '../../../data/models/Entities';

// Componentes hijos
import { TablaDistributivoComponent } from './components/tabla-distributivo/tabla-distributivo.component';
import { ModalAsignacionComponent } from './components/modal-asignacion/modal-asignacion.component';
import { ModalAsignacionMasivaComponent } from './components/modal-asignacion-masiva/modal-asignacion-masiva.component';
import { ModalCrearDocenteComponent } from './components/modal-crear-docente/modal-crear-docente.component';
import { ModalCrearParaleloMallaComponent } from './components/modal-crear-paralelo-malla/modal-crear-paralelo-malla.component';
import { GeneroService, PeriodoLectivoService, TipoDocumentoService } from '../../../core/services/postulaciones';
import { PersonaService, RolService, RolUsuarioService, UsuarioService } from '../../../core/services/seguridad';
import { SharedEmptyStateComponent } from '../../../shared/shared-empty-state/shared-empty-state.component';
import { CustomSelectComponent } from '../../../shared/custom-select/custom-select.component';
import { SharedToastComponent } from '../../../shared/shared-toast/shared-toast.component';
import { SharedDrawerComponent } from '../../../shared/shared-drawer/shared-drawer.component';

@Component({
  selector: 'app-distributivo',
  standalone: true,
  imports: [CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TablaDistributivoComponent,
    ModalAsignacionComponent,
    ModalAsignacionMasivaComponent,
    ModalCrearDocenteComponent,
    ModalCrearParaleloMallaComponent,
    SharedEmptyStateComponent,
    CustomSelectComponent,
    SharedDrawerComponent,
    ButtonModule,
    TooltipModule,
    ConfirmDialogModule,
    DialogModule,
    CheckboxModule,
    PasswordModule,
    InputTextModule, SharedToastComponent],
  providers: [MessageService, ConfirmationService, PersonaService, RolUsuarioService, RolService, UsuarioService, TipoDocumentoService, GeneroService],
  templateUrl: './distributivo.component.html',
  styleUrls: ['./distributivo.component.css']
})
export class DistributivoComponent implements OnInit {
  // Servicios
  private router = inject(Router);
  private distributivoService = inject(DistributivoService);
  private mallaService = inject(MallaService);
  private detalleMallaService = inject(DetalleMallaService);
  private cicloService = inject(CicloService);
  private paraleloService = inject(ParaleloService);
  private tipoOfertaService = inject(TipoOfertaService);
  private messageService = inject(MessageService);
  private periodLectivoService = inject(PeriodoLectivoService)
  private mallaParaleloService = inject(MallaParaleloService);
  private confirmationService = inject(ConfirmationService);
  private personaService = inject(PersonaService);
  private rolUsuarioService = inject(RolUsuarioService);
  private rolService = inject(RolService);
  private usuarioService = inject(UsuarioService);
  private tipoDocumentoService = inject(TipoDocumentoService);
  private generoService = inject(GeneroService);

  // Datos
  distributivos: DistributivoDTO[] = [];
  distributivosFiltrados: DistributivoDTO[] = [];
  todosLosDistributivos: DistributivoDTO[] = [];
  mallas: MallaDTO[] = [];
  mallasFiltradas: MallaDTO[] = [];
  mallasPorCiclo: MallaDTO[] = [];  // mallas del ciclo actualmente seleccionado
  todosLosCiclos: CicloDTO[] = [];
  peridoLectivo: PeriodoLectivoDTO[] = [];
  ciclos: CicloDTO[] = [];
  paralelos: ParaleloDTO[] = [];
  tiposOferta: TipoOfertaDTO[] = [];
  docentes: DocenteDisponibleDTO[] = [];

  selectedPeriodo: PeriodoLectivoDTO | null = null;
  selectedCiclo: CicloDTO | null = null;

  get periodosOptions() {
    return this.peridoLectivo.map(p => ({ label: p.detalle || '', value: p.idPeriodoLectivo }));
  }

  get ciclosOptions() {
    return this.ciclos.map(c => ({
      label: `${c.detalle} — ${c.nombreRegimen || c.nombrePeriodo || ''}`,
      value: c.idCiclo
    }));
  }

  get paralelosOptionsFilter() {
    return [
      { label: 'Todos los paralelos', value: null },
      ...this.paralelos.map(p => ({ label: p.nombreParalelo || p.detalle || '', value: p.idParalelo }))
    ];
  }

  get mallasPorCicloFiltradas(): MallaDTO[] {
    if (!this.filtros.curso) return this.mallasPorCiclo;
    const busqueda = this.filtros.curso.toLowerCase().trim();
    return this.mallasPorCiclo.filter(m => (m.detalle || '').toLowerCase().includes(busqueda));
  }

  onPeriodoSelect(idPeriodo: number | null): void {
    this.selectedPeriodo = this.peridoLectivo.find(p => p.idPeriodoLectivo === idPeriodo) || null;
    this.onPeriodoChange();
  }

  onCicloSelect(idCiclo: number | null): void {
    this.selectedCiclo = this.ciclos.find(c => c.idCiclo === idCiclo) || null;
    this.onCicloChange();
  }

  onParaleloFilterSelect(idParalelo: number | null): void {
    this.filtros.idParalelo = idParalelo;
    this.onFiltroInput();
  }



  // Filtros
  filtros = {
    idTipoOferta: null as number | null,
    idCiclo: null as number | null,
    idParalelo: null as number | null,
    docente: '',
    materia: '',
    curso: ''
  };

  // Estado UI
  loading = false;
  error = '';
  vistaActual: 'tabla' | 'carga-docente' = 'tabla';
  tipoVisualizacion: 'docente' | 'curso' = 'curso';

  // Modales
  showModalAsignacion = false;
  showModalMasivo = false;
  showModalCrearDocente = false;
  showModalCrearParaleloMalla = false;
  showModalFechasNotas = false;
  materiaFechasEditar: DistributivoDTO | null = null;
  savingFechas = false;
  fechaInicioNotas = '';
  fechaFinNotas = '';
  diasGraciaNotas = 0;
  minFechaCiclo = '';
  maxFechaCiclo = '';
  errorFechasModal = '';
  distributivoEditar: DistributivoDTO | null = null;
  expandedCards: { [id: number]: boolean } = {};

  // Dialog Nuevo Profesor
  showDialogNuevoProfesor = false;
  loadingProfesor = false;
  tiposDocumento: TipoDocumentoDTO[] = [];
  generos: GeneroDTO[] = [];
  rolProfesor: RolDTO | null = null;
  // Datos para nueva persona profesor
  nuevoProfesor: PersonaDTO = { documento: '', primerNombre: '', segundoNombre: '', primerApellido: '', segundoApellido: '' };
  profesorTipoDocumento: TipoDocumentoDTO | undefined = undefined;
  profesorGenero: GeneroDTO | undefined = undefined;
  profesorUsername: string = '';
  profesorContrasenia: string = '';
  profesorYaRegistrado: boolean = false;
  profesorDocumentoBusqueda: string = '';
  profesorSeleccionado: PersonaDTO | undefined = undefined;
  personas: PersonaDTO[] = [];

  // Vista carga docente
  cargaDocenteSeleccionado: CargaDocenteDTO | null = null;

  private filtroSubject = new Subject<void>();

  ngOnInit(): void {
    this.cargarDatosIniciales();
    this.filtroSubject.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => this.aplicarFiltros());
  }



  async cargarDatosIniciales(): Promise<void> {
    this.loading = true;
    try {
      // Cargar ofertas académicas, ciclos, paralelos, mallas y docentes (NO distributivos inicialmente)
      forkJoin({
        tiposOferta: this.tipoOfertaService.getAll(),
        ciclos: this.cicloService.getAll(),
        paralelos: this.paraleloService.getParalelos(),
        mallas: this.mallaService.getAll(),
        docentes: this.distributivoService.getDocentesDisponibles(),
        periodos: this.periodLectivoService.getPeriodosLectivos()
      }).subscribe({
        next: ({ tiposOferta, ciclos, paralelos, mallas, docentes, periodos }) => {
          this.tiposOferta = tiposOferta || [];
          this.todosLosCiclos = ciclos || [];
          this.paralelos = paralelos || [];
          const mallasOrdenadas = (mallas || []).slice().sort((a, b) => (a.ordenCurso ?? 0) - (b.ordenCurso ?? 0));
          this.mallas = mallasOrdenadas;
          this.mallasFiltradas = mallasOrdenadas.slice();
          this.docentes = docentes || [];
          this.peridoLectivo = periodos || [];

          // Auto-seleccionar primer período y primer ciclo
          if (this.peridoLectivo.length > 0) {
            this.selectedPeriodo = this.peridoLectivo[0];
            this.ciclos = this.todosLosCiclos.filter(
              c => c.idPeriodo === this.selectedPeriodo!.idPeriodoLectivo && c.esActivo === true
            );
          } else {
            this.ciclos = this.todosLosCiclos.filter(c => c.esActivo === true);
          }

          if (this.ciclos.length > 0) {
            this.selectedCiclo = this.ciclos[0];
            this.loading = false;
            this.onCicloChange();
          } else {
            // NO mostrar distributivos hasta que se seleccionen los filtros
            this.distributivos = [];
            this.distributivosFiltrados = [];
            this.loading = false;
          }
        },
        error: (err) => {
          this.error = 'Error al cargar datos';
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron cargar los datos del distributivo'
          });
          console.error(err);
          this.loading = false;
        }
      });
    } catch (err) {
      this.error = 'Error al cargar datos';
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar los datos del distributivo'
      });
      console.error(err);
      this.loading = false;
    }
  }

  onPeriodoChange(): void {
    if (this.selectedPeriodo?.idPeriodoLectivo) {
      this.ciclos = this.todosLosCiclos.filter(
        c => c.idPeriodo === this.selectedPeriodo!.idPeriodoLectivo && c.esActivo === true
      );
      if (this.ciclos.length > 0) {
        this.selectedCiclo = this.ciclos[0];
      } else {
        this.selectedCiclo = null;
      }
    } else {
      this.ciclos = this.todosLosCiclos.filter(c => c.esActivo === true);
      this.selectedCiclo = null;
    }
    this.onCicloChange();
  }

  clearMainFilters(): void {
    this.selectedPeriodo = null;
    this.selectedCiclo = null;
    this.ciclos = this.todosLosCiclos.filter(c => c.esActivo === true);
    this.distributivos = [];
    this.distributivosFiltrados = [];
    this.todosLosDistributivos = [];
    this.mallasPorCiclo = [];
    this.limpiarFiltrosBusqueda();
  }

  limpiarFiltrosBusqueda(): void {
    this.filtros = {
      idTipoOferta: null,
      idCiclo: null,
      idParalelo: null,
      docente: '',
      materia: '',
      curso: ''
    };
    this.aplicarFiltros();
  }

  onFiltroInput(): void {
    this.filtroSubject.next();
  }

  onCicloChange(): void {
    if (this.selectedCiclo) {
      const idCiclo = this.selectedCiclo.idCiclo!;
      this.loading = true;

      // Cargar mallas del ciclo para los modales de asignación
      this.mallaService.getByCiclo(idCiclo).subscribe({
        next: (mallas) => { this.mallasPorCiclo = (mallas || []).slice().sort((a, b) => (a.ordenCurso ?? 0) - (b.ordenCurso ?? 0)); },
        error: (err) => { console.error('Error cargando mallas del ciclo:', err); this.mallasPorCiclo = []; }
      });

      this.distributivoService.getByCiclo(idCiclo)
        .subscribe({
          next: (data) => {
            this.todosLosDistributivos = data;
            this.distributivos = data;
            this.distributivosFiltrados = data;
            this.aplicarFiltros();
            this.loading = false;
          },
          error: (err) => {
            this.error = 'Error al cargar distributivos';
            this.distributivos = [];
            this.distributivosFiltrados = [];
            this.todosLosDistributivos = [];
            this.loading = false;
            console.error(err);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudieron cargar los distributivos'
            });
          }
        });
    } else {
      this.distributivos = [];
      this.distributivosFiltrados = [];
      this.todosLosDistributivos = [];
      this.mallasPorCiclo = [];
    }
  }



  /**
   * Manejar cambio del checkbox de ciclos inactivos
   * @deprecated - Eliminado. Se muestran todos los ciclos.
   */

  onMostrarCiclosInactivosChange(): void { }

  onFiltrosChange(filtros: typeof this.filtros): void {
    this.filtros = filtros;
    this.filtrarMallas();
    this.aplicarFiltros();
  }

  filtrarMallas(): void {
    const tipoOfertaSeleccionada = this.tiposOferta.find(t => t.idtipoOferta === this.filtros.idTipoOferta)?.detalle?.toLowerCase() || null;
    this.mallasFiltradas = this.mallas.filter(m => {
      if (this.filtros.idTipoOferta && tipoOfertaSeleccionada) {
        const tipoOfertaMalla = (m.nombreTipoOferta || '').toLowerCase();
        if (tipoOfertaMalla !== tipoOfertaSeleccionada) return false;
      }
      if (this.filtros.idCiclo && m.idCiclo !== this.filtros.idCiclo) return false;
      return true;
    });
  }

  aplicarFiltros(): void {
    this.distributivosFiltrados = this.distributivos.filter(d => {
      if (this.filtros.idTipoOferta && d.tipoOferta) {
        const tipoOferta = this.tiposOferta.find(t => t.detalle === d.tipoOferta);
        if (!tipoOferta || tipoOferta.idtipoOferta !== this.filtros.idTipoOferta) return false;
      }
      if (this.filtros.idCiclo && d.idCiclo !== this.filtros.idCiclo) return false;
      if (this.filtros.idParalelo && d.idParalelo !== this.filtros.idParalelo) return false;
      if (this.filtros.materia) {
        if (!d.nombreMateria.toLowerCase().includes(this.filtros.materia.toLowerCase())) return false;
      }
      if (this.filtros.docente) {
        if (!d.nombreDocente.toLowerCase().includes(this.filtros.docente.toLowerCase())) return false;
      }
      if (this.filtros.curso) {
        if (!d.nombreMalla.toLowerCase().includes(this.filtros.curso.toLowerCase())) return false;
      }
      return true;
    });
  }

  // Acciones
  abrirModalNuevo(): void {
    this.distributivoEditar = null;
    this.showModalAsignacion = true;
  }

  abrirModalEditar(distributivo: DistributivoDTO): void {
    this.distributivoEditar = distributivo;
    this.showModalAsignacion = true;
  }

  abrirModalMasivo(): void {
    this.showModalMasivo = true;
  }

  navegarAConfigurarCursos(): void {
    this.router.navigate(['/dashboard/configurar-cursos-postulacion']);
  }

  cerrarModales(): void {
    this.showModalAsignacion = false;
    this.showModalMasivo = false;
    this.distributivoEditar = null;
  }

  /** Recarga solo los distributivos del ciclo seleccionado, sin tocar periodo/ciclo/mallas */
  private async recargarDistributivos(): Promise<void> {
    if (!this.selectedCiclo?.idCiclo) return;
    try {
      const data = await lastValueFrom(this.distributivoService.getByCiclo(this.selectedCiclo.idCiclo));
      this.todosLosDistributivos = data;
      this.distributivos = data;
      this.distributivosFiltrados = data;
      this.aplicarFiltros();
    } catch (err) {
      console.error('Error recargando distributivos:', err);
    }
  }

  onMallaCreada(): void {
    this.mallaService.getAll().subscribe({
      next: (mallas) => {
        const mallasOrdenadas = (mallas || []).slice().sort((a, b) => (a.ordenCurso ?? 0) - (b.ordenCurso ?? 0));
        this.mallas = mallasOrdenadas;
        this.mallasFiltradas = mallasOrdenadas.slice();
        this.filtrarMallas();
      }
    });

    if (this.selectedCiclo) {
      this.mallaService.getByCiclo(this.selectedCiclo.idCiclo!).subscribe({
        next: (mallas) => {
          this.mallasPorCiclo = (mallas || []).slice().sort((a, b) => (a.ordenCurso ?? 0) - (b.ordenCurso ?? 0));
        }
      });
    }
  }

  async onGuardarAsignacion(data: { idDetalleMalla: number; idPersona: number; idMallaParalelo: number }): Promise<void> {
    try {
      const slotExistente = this.todosLosDistributivos.find(
        d => d.idDetalleMalla === data.idDetalleMalla && d.idMallaParalelo === data.idMallaParalelo && (d.idDistributivo ?? 0) > 0
      );
      const rawId = this.distributivoEditar?.idDistributivo ?? slotExistente?.idDistributivo;
      const idDistributivo = (rawId ?? 0) > 0 ? rawId : null;

      if (idDistributivo) {
        await lastValueFrom(this.distributivoService.update({
          idDistributivo,
          ...data
        }));
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Asignación actualizada correctamente'
        });
      } else {
        await lastValueFrom(this.distributivoService.create(data));
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Asignación creada correctamente'
        });
      }
      this.cerrarModales();
      await this.recargarDistributivos();
    } catch (err: any) {
      console.error('Error al guardar:', err);
      const mensaje = err?.message || 'No se pudo guardar la asignación';
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: mensaje
      });
    }
  }

  async onGuardarMasivo(distributivos: any[]): Promise<void> {
    try {
      const promises = distributivos.map(d => {
        const slotExistente = this.todosLosDistributivos.find(
          e => e.idDetalleMalla === d.idDetalleMalla && e.idMallaParalelo === d.idMallaParalelo && (e.idDistributivo ?? 0) > 0
        );

        if (slotExistente?.idDistributivo && slotExistente.idDistributivo > 0) {
          return lastValueFrom(this.distributivoService.update({
            idDistributivo: slotExistente.idDistributivo,
            idDetalleMalla: d.idDetalleMalla,
            idPersona: d.idPersona,
            idMallaParalelo: d.idMallaParalelo
          }));
        }

        return lastValueFrom(this.distributivoService.create({
          idDetalleMalla: d.idDetalleMalla,
          idPersona: d.idPersona,
          idMallaParalelo: d.idMallaParalelo
        }));
      });

      await Promise.all(promises);

      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: `Se replicaron ${distributivos.length} asignaciones correctamente`
      });
      this.cerrarModales();
      await this.recargarDistributivos();
    } catch (err: any) {
      console.error('Error al guardar masivo:', err);
      const mensaje = err?.message || 'No se pudo realizar la replicación masiva';
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: mensaje
      });
    }
  }

  onEliminar(id: number): void {
    this.confirmationService.confirm({
      message: '¿Está seguro de eliminar esta asignación?',
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        try {
          await lastValueFrom(this.distributivoService.delete(id));
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Asignación eliminada correctamente'
          });
          await this.cargarDatosIniciales();
        } catch (err) {
          console.error('Error al eliminar:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo eliminar la asignación'
          });
        }
      }
    });
  }

  async verCargaDocente(idPersona: number): Promise<void> {
    try {
      this.cargaDocenteSeleccionado = await lastValueFrom(this.distributivoService.getCargaDocente(idPersona)) || null;
      this.vistaActual = 'carga-docente';
    } catch (err) {
      console.error('Error al cargar carga docente:', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo cargar la información del docente'
      });
    }
  }

  volverATabla(): void {
    this.vistaActual = 'tabla';
    this.cargaDocenteSeleccionado = null;
  }

  cambiarVisualizacion(tipo: 'docente' | 'curso'): void {
    this.tipoVisualizacion = tipo;
  }

  abrirModalCrearDocente(): void {
    this.showModalCrearDocente = true;
  }

  onDocenteCreado(): void {
    this.distributivoService.getDocentesDisponibles().subscribe({
      next: (docentes) => { this.docentes = docentes || []; }
    });
    this.messageService.add({
      severity: 'success',
      summary: 'Docente creado',
      detail: 'El docente fue registrado exitosamente y está disponible para asignación.'
    });
  }

  abrirModalCrearParaleloMalla(): void {
    this.showModalCrearParaleloMalla = true;
  }

  onParaleloMallaCreado(): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Paralelo configurado',
      detail: 'El paralelo fue asignado a la malla. Ahora puede agregar asignaciones de docentes.'
    });
    if (this.selectedCiclo) {
      this.onCicloChange();
    }
  }

  formatToDateString(val: string | Date | undefined | null): string {
    if (!val) return '';
    if (typeof val === 'string') return val.split('T')[0];
    const d = new Date(val);
    return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
  }

  get fechasFueraDeCiclo(): boolean {
    if (!this.fechaInicioNotas || !this.fechaFinNotas) return false;
    const fueraInicio = !!(this.minFechaCiclo && this.fechaInicioNotas < this.minFechaCiclo);
    const fueraFin = !!(this.maxFechaCiclo && this.fechaFinNotas > this.maxFechaCiclo);
    return fueraInicio || fueraFin;
  }

  abrirModalFechasNotas(materia: DistributivoDTO): void {
    this.materiaFechasEditar = materia;
    this.errorFechasModal = '';

    if (this.selectedCiclo) {
      this.minFechaCiclo = this.formatToDateString(this.selectedCiclo.fechaInicioEstimada);
      this.maxFechaCiclo = this.formatToDateString(this.selectedCiclo.fechaFinEstimada);
    } else {
      this.minFechaCiclo = '';
      this.maxFechaCiclo = '';
    }

    this.fechaInicioNotas = this.formatToDateString(materia.fechaInicio);
    this.fechaFinNotas = this.formatToDateString(materia.fechaFin);
    this.diasGraciaNotas = materia.diasGracia ?? 0;

    this.showModalFechasNotas = true;
  }

  cerrarModalFechasNotas(): void {
    this.showModalFechasNotas = false;
    this.materiaFechasEditar = null;
    this.errorFechasModal = '';
  }

  async guardarFechasNotas(): Promise<void> {
    if (!this.materiaFechasEditar || !this.materiaFechasEditar.idDetalleMalla) {
      this.errorFechasModal = 'No se encontró la información de la materia en la malla';
      return;
    }

    if (!this.fechaInicioNotas || !this.fechaFinNotas) {
      this.errorFechasModal = 'Debe ingresar tanto la fecha de inicio como la fecha de fin';
      return;
    }

    if (this.fechaInicioNotas > this.fechaFinNotas) {
      this.errorFechasModal = 'La fecha de inicio no puede ser posterior a la fecha de fin';
      return;
    }

    if (this.diasGraciaNotas < 0) {
      this.errorFechasModal = 'Los días de gracia no pueden ser negativos';
      return;
    }

    this.savingFechas = true;
    this.errorFechasModal = '';

    try {
      await lastValueFrom(this.detalleMallaService.actualizarFechasNotas(this.materiaFechasEditar.idDetalleMalla, {
        idDetalleMalla: this.materiaFechasEditar.idDetalleMalla,
        fechaInicio: this.fechaInicioNotas,
        fechaFin: this.fechaFinNotas,
        diasGracia: this.diasGraciaNotas
      }));

      this.messageService.add({
        severity: 'success',
        summary: 'Fechas actualizadas',
        detail: `Fechas de notas guardadas para "${this.materiaFechasEditar.nombreMateria}"`
      });

      this.cerrarModalFechasNotas();
      await this.recargarDistributivos();
    } catch (err: any) {
      console.error('Error al actualizar fechas de notas:', err);
      this.errorFechasModal = err?.error?.message || err?.message || 'Error al guardar las fechas de notas';
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: this.errorFechasModal
      });
    } finally {
      this.savingFechas = false;
    }
  }
}