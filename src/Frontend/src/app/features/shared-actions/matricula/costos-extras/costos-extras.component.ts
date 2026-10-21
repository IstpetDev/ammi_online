import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService, UserRole } from '../../../../core/auth/auth.service';
import { CreditoService } from '../../../../core/services/pagos/credito.service';
import { EspecieService } from '../../../../core/services/infrastructure/especie.service';
import { MatriculaService } from '../../../../core/services/postulaciones/matricula.service';
import { PeriodoLectivoService } from '../../../../core/services/postulaciones/periodo-lectivo.service';
import { CicloService } from '../../../../core/services/postulaciones/ciclo.service';
import { MallaService } from '../../../../core/services/infrastructure/malla.service';
import { EspecieDTO, MatriculaDTO, PeriodoLectivoDTO, CicloDTO, MallaDTO } from '../../../../data/models/Entities';
import { CustomSelectComponent } from '../../../../shared/custom-select/custom-select.component';
import { SharedModalComponent } from '../../../../shared/shared-modal/shared-modal.component';
import { SharedToastComponent } from '../../../../shared/shared-toast/shared-toast.component';
import { ConfirmationModalComponent } from '../../../../shared/modal-confirmation/confirmation-modal.component';
import { ToastService } from '../../../../shared/toast.service';

export interface CreditoExtraItem {
  idCredito: number;
  idMatricula: number;
  idDetalleCredito: number;
  alumnoNombre: string;
  documento: string;
  curso: string;
  paralelo: string;
  ciclo: string;
  idEspecie: number;
  especieDetalle: string;
  montoOriginal: number;
  saldoPendiente: number;
  valorCancelado: number;
  estado: string;
  fechaGeneracion?: string;
  fechaLimite?: string;
  pagado: boolean;
  tienePagos: boolean;
}

@Component({
  selector: 'app-costos-extras',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CustomSelectComponent,
    SharedModalComponent,
    SharedToastComponent,
    ConfirmationModalComponent
  ],
  templateUrl: './costos-extras.component.html',
  styleUrls: ['./costos-extras.component.css']
})
export class CostosExtrasComponent implements OnInit {
  private creditoService = inject(CreditoService);
  private especieService = inject(EspecieService);
  private matriculaService = inject(MatriculaService);
  private periodoService = inject(PeriodoLectivoService);
  private cicloService = inject(CicloService);
  private mallaService = inject(MallaService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  // Permisos
  esAdmin: boolean = false;
  esSecretaria: boolean = false;
  puedeAsignar: boolean = false;

  // Sub-vista
  vistaActual: 'asignaciones' | 'catalogo' = 'asignaciones';

  // Datos
  creditosExtras: CreditoExtraItem[] = [];
  catalogoEspecies: EspecieDTO[] = [];
  catalogoExtras: EspecieDTO[] = [];
  loading: boolean = false;
  busquedaTexto: string = '';
  filtroEstado: string = 'TODOS';

  // Modal Asignar Costo Extra Individual
  mostrarModalAsignar: boolean = false;
  guardandoAsignacion: boolean = false;
  busquedaAlumno: string = '';
  buscandoAlumno: boolean = false;
  alumnosEncontrados: MatriculaDTO[] = [];
  matriculaSeleccionada: MatriculaDTO | null = null;
  especieSeleccionadaId: number | null = null;
  montoAsignacion: number = 0;
  fechaLimiteAsignacion: string = '';
  observacionesAsignacion: string = '';

  // Modal Asignación Masiva
  mostrarModalMasivo: boolean = false;
  guardandoMasivo: boolean = false;
  cargandoCursosMasivo: boolean = false;
  periodos: PeriodoLectivoDTO[] = [];
  todosLosCiclos: CicloDTO[] = [];
  masivoPeriodoId: number | null = null;
  masivoCiclos: CicloDTO[] = [];
  masivoCicloId: number | null = null;
  masivoCursos: MallaDTO[] = [];
  masivoCursosSeleccionados: { [idMalla: number]: boolean } = {};
  masivoSeleccionarTodosCursos: boolean = true;
  masivoEspecieId: number | null = null;
  masivoMonto: number = 0;
  masivoFechaLimite: string = '';
  masivoObservaciones: string = '';

  // Modal Resultado Masivo
  mostrarModalResultadoMasivo: boolean = false;
  resultadoMasivo: { totalMatriculasEvaluadas: number; totalAsignados: number; totalOmitidosDuplicados: number; mensaje: string } | null = null;

  // Modal Catálogo Especie
  mostrarModalCatalogo: boolean = false;
  guardandoCatalogo: boolean = false;
  especieEnEdicion: EspecieDTO | null = null;
  nombreNuevaEspecie: string = '';

  // Modal Confirmación Anular
  mostrarModalAnular: boolean = false;
  creditoAAnular: CreditoExtraItem | null = null;
  anulandoCredito: boolean = false;

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    const roles = user?.roles.map(r => r.nombre) || [];
    this.esAdmin = roles.includes('ADMINISTRADOR') || roles.includes('ADMIN');
    this.esSecretaria = roles.includes('SECRETARIA-GENERAL');
    this.puedeAsignar = this.esAdmin || this.esSecretaria;

    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargarCreditosExtras();
    this.cargarCatalogoEspecies();
    this.cargarEstructuraAcademica();
  }

  cargarEstructuraAcademica(): void {
    this.periodoService.getPeriodosLectivos().subscribe({
      next: (periodos) => {
        this.periodos = periodos || [];
      },
      error: () => {}
    });
    this.cicloService.getAll().subscribe({
      next: (ciclos) => {
        this.todosLosCiclos = ciclos || [];
      },
      error: () => {}
    });
  }

  cargarCreditosExtras(): void {
    this.loading = true;
    this.creditoService.getCreditosExtras().subscribe({
      next: (res) => {
        this.loading = false;
        if (res.isSuccess && res.data) {
          this.creditosExtras = res.data;
        } else {
          this.creditosExtras = [];
        }
      },
      error: (err) => {
        this.loading = false;
        console.error('Error al cargar costos extras:', err);
        this.toastService.showError('No se pudieron cargar los costos extras', 'Error');
      }
    });
  }

  cargarCatalogoEspecies(): void {
    this.especieService.getAll().subscribe({
      next: (data) => {
        this.catalogoEspecies = data || [];
        this.catalogoExtras = this.catalogoEspecies.filter(e => !e.esMatricula && !e.esPension && e.activo !== false);
      },
      error: (err) => {
        console.error('Error al cargar catálogo de especies:', err);
      }
    });
  }

  getNombreCompleto(al: MatriculaDTO): string {
    const nombres = `${al.primerApellido || ''} ${al.segundoApellido || ''} ${al.primerNombre || ''} ${al.segundoNombre || ''}`.trim();
    return nombres || `Estudiante #${al.idMatricula}`;
  }

  get creditosFiltrados(): CreditoExtraItem[] {
    let list = this.creditosExtras;
    if (this.filtroEstado === 'PENDIENTE') {
      list = list.filter(c => !c.pagado && c.estado !== 'CANCELADO');
    } else if (this.filtroEstado === 'PAGADO') {
      list = list.filter(c => c.pagado);
    }

    if (this.busquedaTexto.trim()) {
      const term = this.busquedaTexto.toLowerCase().trim();
      list = list.filter(c =>
        (c.alumnoNombre && c.alumnoNombre.toLowerCase().includes(term)) ||
        (c.documento && c.documento.toLowerCase().includes(term)) ||
        (c.especieDetalle && c.especieDetalle.toLowerCase().includes(term)) ||
        (c.curso && c.curso.toLowerCase().includes(term))
      );
    }
    return list;
  }

  // ─── Modal Asignación ─────────────────────────────────────────────

  abrirModalAsignar(): void {
    this.matriculaSeleccionada = null;
    this.busquedaAlumno = '';
    this.alumnosEncontrados = [];
    this.especieSeleccionadaId = null;
    this.montoAsignacion = 0;
    this.fechaLimiteAsignacion = '';
    this.observacionesAsignacion = '';
    this.guardandoAsignacion = false;
    this.mostrarModalAsignar = true;
  }

  cerrarModalAsignar(): void {
    this.mostrarModalAsignar = false;
  }

  buscarEstudiante(): void {
    const term = this.busquedaAlumno.trim();
    if (!term || term.length < 3) {
      this.toastService.showWarning('Ingrese al menos 3 caracteres para buscar', 'Búsqueda');
      return;
    }

    this.buscandoAlumno = true;
    this.matriculaService.getAllMatriculas(20, 1, undefined, undefined, term).subscribe({
      next: (items: MatriculaDTO[]) => {
        this.buscandoAlumno = false;
        this.alumnosEncontrados = items || [];
        if (this.alumnosEncontrados.length === 0) {
          this.toastService.showInfo('No se encontraron matrículas con ese criterio', 'Sin resultados');
        }
      },
      error: (err: any) => {
        this.buscandoAlumno = false;
        console.error('Error al buscar alumnos:', err);
        this.toastService.showError('Error al realizar la búsqueda de alumnos', 'Error');
      }
    });
  }

  seleccionarMatricula(mat: MatriculaDTO): void {
    this.matriculaSeleccionada = mat;
    this.alumnosEncontrados = [];
  }

  cambiarMatricula(): void {
    this.matriculaSeleccionada = null;
    this.alumnosEncontrados = [];
  }

  guardarAsignacion(): void {
    if (!this.matriculaSeleccionada || !this.matriculaSeleccionada.idMatricula) {
      this.toastService.showWarning('Debe seleccionar un alumno con matrícula activa', 'Atención');
      return;
    }
    if (!this.especieSeleccionadaId) {
      this.toastService.showWarning('Debe seleccionar un tipo de costo extra', 'Atención');
      return;
    }
    if (this.montoAsignacion <= 0) {
      this.toastService.showWarning('El monto debe ser mayor a 0', 'Monto Inválido');
      return;
    }

    this.guardandoAsignacion = true;
    const payload = {
      idMatricula: this.matriculaSeleccionada.idMatricula,
      idEspecie: this.especieSeleccionadaId,
      monto: this.montoAsignacion,
      fechaLimite: this.fechaLimiteAsignacion || null,
      observaciones: this.observacionesAsignacion.trim() || null
    };

    this.creditoService.asignarCreditoExtra(payload).subscribe({
      next: (res) => {
        this.guardandoAsignacion = false;
        if (res.isSuccess) {
          this.toastService.showSuccess('Costo extra asignado correctamente al estudiante', 'Éxito');
          this.cerrarModalAsignar();
          this.cargarCreditosExtras();
        } else {
          this.toastService.showError(res.message || 'No se pudo asignar el costo extra', 'Error');
        }
      },
      error: (err) => {
        this.guardandoAsignacion = false;
        console.error('Error al asignar costo extra:', err);
        this.toastService.showError(err.error?.message || err.message || 'Error al procesar la asignación', 'Error');
      }
    });
  }

  // ─── Anulación ───────────────────────────────────────────────────

  confirmarAnular(item: CreditoExtraItem): void {
    if (item.tienePagos || item.valorCancelado > 0) {
      this.toastService.showWarning('Este costo extra ya registra pagos y no puede ser anulado.', 'Operación No Permitida');
      return;
    }
    this.creditoAAnular = item;
    this.mostrarModalAnular = true;
  }

  ejecutarAnulacion(): void {
    if (!this.creditoAAnular) return;
    this.anulandoCredito = true;
    const idCredito = this.creditoAAnular.idCredito;

    this.creditoService.anularCreditoExtra(idCredito).subscribe({
      next: (res) => {
        this.anulandoCredito = false;
        if (res.isSuccess) {
          this.toastService.showSuccess('Costo extra anulado exitosamente', 'Éxito');
          this.mostrarModalAnular = false;
          this.creditoAAnular = null;
          this.cargarCreditosExtras();
        } else {
          this.toastService.showError(res.message || 'No se pudo anular el costo extra', 'Error');
        }
      },
      error: (err) => {
        this.anulandoCredito = false;
        console.error('Error al anular costo extra:', err);
        this.toastService.showError(err.error?.message || err.message || 'Error al anular', 'Error');
      }
    });
  }

  // ─── Modal Catálogo ───────────────────────────────────────────────

  abrirModalNuevoCatalogo(): void {
    this.especieEnEdicion = null;
    this.nombreNuevaEspecie = '';
    this.guardandoCatalogo = false;
    this.mostrarModalCatalogo = true;
  }

  editarEspecieCatalogo(esp: EspecieDTO): void {
    this.especieEnEdicion = esp;
    this.nombreNuevaEspecie = esp.detalle || '';
    this.guardandoCatalogo = false;
    this.mostrarModalCatalogo = true;
  }

  cerrarModalCatalogo(): void {
    this.mostrarModalCatalogo = false;
  }

  guardarEspecieCatalogo(): void {
    const nombre = this.nombreNuevaEspecie.trim().toUpperCase();
    if (!nombre) {
      this.toastService.showWarning('Ingrese el nombre del arancel / costo extra', 'Campo Requerido');
      return;
    }

    this.guardandoCatalogo = true;
    if (this.especieEnEdicion) {
      const updateData: EspecieDTO = {
        idEspecie: this.especieEnEdicion.idEspecie,
        detalle: nombre,
        esMatricula: false,
        esPension: false,
        activo: true
      };
      this.especieService.update(updateData).subscribe({
        next: () => {
          this.guardandoCatalogo = false;
          this.toastService.showSuccess('Costo extra actualizado en catálogo', 'Éxito');
          this.cerrarModalCatalogo();
          this.cargarCatalogoEspecies();
        },
        error: (err) => {
          this.guardandoCatalogo = false;
          console.error('Error al actualizar catálogo:', err);
          this.toastService.showError('No se pudo actualizar el costo extra', 'Error');
        }
      });
    } else {
      const createData: EspecieDTO = {
        idEspecie: 0,
        detalle: nombre,
        esMatricula: false,
        esPension: false,
        activo: true
      };
      this.especieService.create(createData).subscribe({
        next: () => {
          this.guardandoCatalogo = false;
          this.toastService.showSuccess('Nuevo costo extra añadido al catálogo', 'Éxito');
          this.cerrarModalCatalogo();
          this.cargarCatalogoEspecies();
        },
        error: (err) => {
          this.guardandoCatalogo = false;
          console.error('Error al crear costo extra:', err);
          this.toastService.showError('No se pudo crear el costo extra', 'Error');
        }
      });
    }
  }

  toggleEstadoEspecie(esp: EspecieDTO): void {
    const nuevoEstado = !esp.activo;
    const updateData: EspecieDTO = {
      ...esp,
      activo: nuevoEstado
    };
    this.especieService.update(updateData).subscribe({
      next: () => {
        esp.activo = nuevoEstado;
        this.toastService.showSuccess(`Costo extra ${nuevoEstado ? 'activado' : 'desactivado'}`, 'Actualizado');
        this.cargarCatalogoEspecies();
      },
      error: () => {
        this.toastService.showError('No se pudo cambiar el estado', 'Error');
      }
    });
  }

  // ─── Modal Asignación Masiva ──────────────────────────────────────

  abrirModalMasivo(): void {
    this.masivoEspecieId = null;
    this.masivoMonto = 0;
    this.masivoFechaLimite = '';
    this.masivoObservaciones = '';
    this.masivoCursosSeleccionados = {};
    this.masivoSeleccionarTodosCursos = true;

    this.masivoPeriodoId = this.periodos.length > 0 ? this.periodos[0].idPeriodoLectivo! : null;
    if (this.masivoPeriodoId) {
      this.masivoCiclos = this.todosLosCiclos.filter(c => c.idPeriodo === this.masivoPeriodoId && c.esActivo === true);
      this.masivoCicloId = this.masivoCiclos.length > 0 ? this.masivoCiclos[0].idCiclo! : null;
    } else {
      this.masivoCiclos = [];
      this.masivoCicloId = null;
    }

    if (this.masivoCicloId) {
      this.cargarCursosMasivo(this.masivoCicloId);
    } else {
      this.masivoCursos = [];
    }

    this.mostrarModalMasivo = true;
  }

  cerrarModalMasivo(): void {
    this.mostrarModalMasivo = false;
  }

  onMasivoPeriodoChange(): void {
    this.masivoCiclos = [];
    this.masivoCicloId = null;
    this.masivoCursos = [];
    this.masivoCursosSeleccionados = {};

    if (this.masivoPeriodoId) {
      this.masivoCiclos = this.todosLosCiclos.filter(c => c.idPeriodo === this.masivoPeriodoId && c.esActivo === true);
      if (this.masivoCiclos.length > 0) {
        this.masivoCicloId = this.masivoCiclos[0].idCiclo!;
        this.onMasivoCicloChange();
      }
    }
  }

  onMasivoCicloChange(): void {
    this.masivoCursos = [];
    this.masivoCursosSeleccionados = {};
    if (this.masivoCicloId) {
      this.cargarCursosMasivo(this.masivoCicloId);
    }
  }

  private cargarCursosMasivo(idCiclo: number): void {
    this.cargandoCursosMasivo = true;
    this.mallaService.getByCiclo(idCiclo).subscribe({
      next: (cursos) => {
        this.cargandoCursosMasivo = false;
        this.masivoCursos = (cursos || []).sort((a, b) => (a.detalle || '').localeCompare(b.detalle || ''));
        this.masivoCursosSeleccionados = {};
        this.masivoCursos.forEach(c => {
          if (c.idMalla) {
            this.masivoCursosSeleccionados[c.idMalla] = true;
          }
        });
        this.masivoSeleccionarTodosCursos = true;
      },
      error: (err) => {
        this.cargandoCursosMasivo = false;
        console.error('Error al cargar cursos para asignación masiva:', err);
        this.toastService.showError('No se pudieron cargar los cursos del ciclo', 'Error');
      }
    });
  }

  toggleTodosCursosMasivo(event: any): void {
    const checked = event.target ? event.target.checked : !!event;
    this.masivoSeleccionarTodosCursos = checked;
    this.masivoCursos.forEach(c => {
      if (c.idMalla) {
        this.masivoCursosSeleccionados[c.idMalla] = checked;
      }
    });
  }

  onCursoMasivoCheckChange(): void {
    const seleccionados = this.getCursosSeleccionadosIds();
    this.masivoSeleccionarTodosCursos = (seleccionados.length === this.masivoCursos.length && this.masivoCursos.length > 0);
  }

  isCursoSeleccionado(idMalla?: number): boolean {
    return !!(idMalla && this.masivoCursosSeleccionados[idMalla]);
  }

  setCursoSeleccionado(idMalla: number | undefined, checked: boolean): void {
    if (idMalla) {
      this.masivoCursosSeleccionados[idMalla] = checked;
      this.onCursoMasivoCheckChange();
    }
  }

  getCursosSeleccionadosIds(): number[] {
    return Object.keys(this.masivoCursosSeleccionados)
      .filter(id => this.masivoCursosSeleccionados[+id])
      .map(id => +id);
  }

  getCursosSeleccionadosCount(): number {
    return this.getCursosSeleccionadosIds().length;
  }

  ejecutarAsignacionMasiva(): void {
    const idsMallas = this.getCursosSeleccionadosIds();
    if (idsMallas.length === 0) {
      this.toastService.showWarning('Debe seleccionar al menos un curso para la asignación', 'Validación');
      return;
    }
    if (!this.masivoEspecieId) {
      this.toastService.showWarning('Debe seleccionar un arancel o concepto', 'Validación');
      return;
    }
    if (!this.masivoMonto || this.masivoMonto <= 0) {
      this.toastService.showWarning('El monto debe ser mayor a 0', 'Validación');
      return;
    }

    this.guardandoMasivo = true;
    const payload = {
      idsMallas: idsMallas,
      idEspecie: this.masivoEspecieId,
      monto: Number(this.masivoMonto),
      fechaLimite: this.masivoFechaLimite ? this.masivoFechaLimite : null,
      observaciones: this.masivoObservaciones?.trim() ? this.masivoObservaciones.trim() : null
    };

    this.creditoService.asignarCreditoExtraMasivo(payload).subscribe({
      next: (res) => {
        this.guardandoMasivo = false;
        if (res.isSuccess && res.data) {
          this.resultadoMasivo = res.data;
          this.mostrarModalMasivo = false;
          this.mostrarModalResultadoMasivo = true;
          this.cargarCreditosExtras();
        } else {
          this.toastService.showError(res.message || 'No se pudo completar la asignación masiva', 'Error');
        }
      },
      error: (err) => {
        this.guardandoMasivo = false;
        console.error('Error en asignación masiva:', err);
        const msg = err?.error?.message || 'Ocurrió un error al procesar la asignación masiva';
        this.toastService.showError(msg, 'Error');
      }
    });
  }

  cerrarModalResultadoMasivo(): void {
    this.mostrarModalResultadoMasivo = false;
    this.resultadoMasivo = null;
  }
}
