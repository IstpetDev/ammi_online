import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { RadioButtonModule } from 'primeng/radiobutton';
import { DividerModule } from 'primeng/divider';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';
import { of, from, Subject } from 'rxjs';
import { mergeMap, catchError, map, takeUntil } from 'rxjs/operators';
import { CicloDTO, MallaDTO, PeriodoLectivoDTO } from '../../../../data/models/Entities';
import { CicloService } from '../../../../core/services/postulaciones/ciclo.service';
import { EstadoMatriculaService } from '../../../../core/services/postulaciones/estado-matricula.service';
import { ReMatriculacionService } from '../../../../core/services/postulaciones/rematriculacion.service';
import { MallaService } from '../../../../core/services/postulaciones/malla.service';
import { MatriculaService } from '../../../../core/services/postulaciones/matricula.service';
import { PeriodoLectivoService } from '../../../../core/services/postulaciones/periodo-lectivo.service';
import {
  ApiResponse,
  EstadoMatriculaDTO,
  MotivoReMatricula,
  ParaleloDisponible,
  ReMatriculaInfo,
  ReMatricularResult
} from '../../../../data/models/rematricula.model';
import { AperturaCicloComponent } from '../../global-settings/cyclic-configurations/apertura-ciclo/apertura-ciclo.component';
import { SharedToastComponent } from '../../../../shared/shared-toast/shared-toast.component';
import { CustomSelectComponent } from '../../../../shared/custom-select/custom-select.component';

@Component({
  selector: 'app-re-matriculacion',
  standalone: true,
  imports: [CommonModule,
    FormsModule,
    RouterModule,
    CardModule,
    TableModule,
    TagModule,
    InputTextModule,
    ProgressSpinnerModule,
    TooltipModule,
    RadioButtonModule,
    DividerModule,
    DialogModule,
    AperturaCicloComponent, SharedToastComponent, CustomSelectComponent],
  providers: [MessageService],
  templateUrl: './re-matriculacion.component.html',
  styleUrls: ['./re-matriculacion.component.css']
})
export class ReMatriculacionComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  activeTab: 'individual' | 'masiva' = 'masiva'; // Por defecto masiva ya que es la mejora solicitada

  periodosLectivos: PeriodoLectivoDTO[] = [];

  // Lote (Masiva) period variables
  idPeriodoOrigen: number | null = null;
  idPeriodoDestino: number | null = null;
  ciclosOrigenFiltrados: CicloDTO[] = [];
  ciclosDestinoFiltrados: CicloDTO[] = [];

  // Individual period variables
  idPeriodoDestinoInd: number | null = null;
  ciclosDestinoIndFiltrados: CicloDTO[] = [];

  // Individual variables
  numeroDocumento: string | null = null;
  idCicloDestino: number | null = null;
  idMallaParalelo: number | null = null;
  cerrarMatriculaAnterior = true;
  idEstadoMatriculaCompletado: number | null = null;

  ciclosActivos: CicloDTO[] = [];
  estadosCompletado: EstadoMatriculaDTO[] = [];
  diagnostico: ReMatriculaInfo | null = null;
  resultado: ReMatricularResult | null = null;
  loading = false;
  loadingConfirmar = false;

  showAperturaCicloDialog = false;

  // Bulk (Masiva) variables
  idCicloOrigen: number | null = null;
  mallasOrigen: MallaDTO[] = [];
  idMallaOrigen: number | null = null;
  loadingAlumnos = false;
  alumnosBulk: any[] = [];
  procesandoMasivo = false;
  progresoBulk = 0;
  totalBulk = 0;
  progresoDiagnostico = 0;
  totalDiagnostico = 0;
  filtroBusqueda = '';

  readonly MotivoReMatricula = MotivoReMatricula;

  constructor(
    private cicloService: CicloService,
    private estadoMatriculaService: EstadoMatriculaService,
    private reMatriculacionService: ReMatriculacionService,
    private mallaService: MallaService,
    private matriculaService: MatriculaService,
    private messageService: MessageService,
    private periodoService: PeriodoLectivoService
  ) {}

  ngOnInit(): void {
    this.periodoService.getPeriodosLectivos().pipe(takeUntil(this.destroy$)).subscribe({
      next: (d: PeriodoLectivoDTO[]) => this.periodosLectivos = d
    });
    this.cicloService.getActivos().pipe(takeUntil(this.destroy$)).subscribe({
      next: (d: CicloDTO[]) => this.ciclosActivos = d
    });
    this.estadoMatriculaService.getCompletados().pipe(takeUntil(this.destroy$)).subscribe({
      next: (d: EstadoMatriculaDTO[]) => this.estadosCompletado = d
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onPeriodoOrigenChange(): void {
    this.idCicloOrigen = null;
    this.idMallaOrigen = null;
    this.mallasOrigen = [];
    if (this.idPeriodoOrigen) {
      this.ciclosOrigenFiltrados = this.ciclosActivos.filter(c => c.idPeriodo === this.idPeriodoOrigen);
    } else {
      this.ciclosOrigenFiltrados = [];
    }
  }

  onPeriodoDestinoChange(): void {
    this.idCicloDestino = null;
    if (this.idPeriodoDestino) {
      this.ciclosDestinoFiltrados = this.ciclosActivos.filter(c => c.idPeriodo === this.idPeriodoDestino);
    } else {
      this.ciclosDestinoFiltrados = [];
    }
  }

  onPeriodoDestinoIndChange(): void {
    this.idCicloDestino = null;
    this.diagnostico = null;
    this.resultado = null;
    this.idMallaParalelo = null;
    if (this.idPeriodoDestinoInd) {
      this.ciclosDestinoIndFiltrados = this.ciclosActivos.filter(c => c.idPeriodo === this.idPeriodoDestinoInd);
    } else {
      this.ciclosDestinoIndFiltrados = [];
    }
  }

  // Cargar mallas del ciclo origen seleccionado
  onCicloOrigenChange(): void {
    this.idMallaOrigen = null;
    this.mallasOrigen = [];
    if (this.idCicloOrigen) {
      this.mallaService.getMallasByParams({ IdCiclo: this.idCicloOrigen }).pipe(takeUntil(this.destroy$)).subscribe({
        next: (mallas) => {
          this.mallasOrigen = mallas;
        }
      });
    }
  }

  // Cargar y diagnosticar alumnos en lote
  cargarAlumnos(): void {
    if (!this.idCicloOrigen || !this.idCicloDestino) {
      this.messageService.add({ severity: 'warn', summary: 'Datos incompletos', detail: 'Seleccione el ciclo origen y destino.' });
      return;
    }
    this.loadingAlumnos = true;
    this.alumnosBulk = [];
    this.progresoDiagnostico = 0;
    this.totalDiagnostico = 0;

    this.matriculaService.getAllMatriculas(1000, 1, this.idCicloOrigen).pipe(takeUntil(this.destroy$)).subscribe({
      next: (matriculas) => {
        let filtradas = matriculas.filter(m => m.numeroDocumento != null);
        if (this.idMallaOrigen) {
          filtradas = filtradas.filter(m => m.idMalla === this.idMallaOrigen);
        }

        if (filtradas.length === 0) {
          this.loadingAlumnos = false;
          this.messageService.add({ severity: 'info', summary: 'Sin resultados', detail: 'No se encontraron alumnos matriculados con los filtros indicados.' });
          return;
        }

        this.totalDiagnostico = filtradas.length;

        // Diagnosticar de a 6 concurrentes
        from(filtradas).pipe(
          mergeMap((m) => {
            return this.reMatriculacionService.getDiagnostico(m.numeroDocumento!, this.idCicloDestino!).pipe(
              map(diag => {
                this.progresoDiagnostico++;
                return {
                  matricula: m,
                  diagnostico: diag,
                  seleccionado: diag.puedeReMatricular,
                  yaMatriculado: diag.motivo === MotivoReMatricula.YA_MATRICULADO,
                  puedeReMatricular: diag.puedeReMatricular,
                  paraleloSeleccionado: diag.paralelosDisponibles?.length > 0 ? diag.paralelosDisponibles[0].idMallaParalelo : null,
                  procesado: false,
                  exito: false,
                  mensajeError: ''
                };
              }),
              catchError(err => {
                this.progresoDiagnostico++;
                return of({
                  matricula: m,
                  diagnostico: {
                    idPersona: m.idUsuarioAlumno,
                    puedeReMatricular: false,
                    motivo: MotivoReMatricula.SIN_MATRICULA_PREVIA,
                    mensajeDiagnostico: err?.error?.message || 'Error al obtener diagnóstico.',
                    idMatriculaActual: m.idMatricula,
                    idMallaOrigen: m.idMalla,
                    detalleMallaOrigen: m.detalleMalla,
                    idCursosOrigen: null,
                    ordenCursosOrigen: null,
                    idMallaDestino: null,
                    detalleMallaDestino: null,
                    paralelosDisponibles: []
                  } as ReMatriculaInfo,
                  seleccionado: false,
                  yaMatriculado: false,
                  puedeReMatricular: false,
                  paraleloSeleccionado: null,
                  procesado: false,
                  exito: false,
                  mensajeError: err?.error?.message || 'Error de diagnóstico'
                });
              })
            );
          }, 6),
          takeUntil(this.destroy$)
        ).subscribe({
          next: (res) => {
            this.alumnosBulk.push(res);
          },
          error: () => {
            this.loadingAlumnos = false;
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Ocurrió un error al procesar el diagnóstico de alumnos.' });
          },
          complete: () => {
            this.loadingAlumnos = false;
            this.alumnosBulk.sort((a, b) => {
              const nameA = `${a.matricula.primerApellido} ${a.matricula.primerNombre}`.toLowerCase();
              const nameB = `${b.matricula.primerApellido} ${b.matricula.primerNombre}`.toLowerCase();
              return nameA.localeCompare(nameB);
            });
            this.messageService.add({ severity: 'success', summary: 'Carga completa', detail: `Se diagnosticaron ${this.alumnosBulk.length} alumnos.` });
          }
        });
      },
      error: (err) => {
        this.loadingAlumnos = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron obtener las matrículas del ciclo origen.' });
      }
    });
  }

  // Ejecutar el proceso masivo para los seleccionados
  ejecutarMasivo(): void {
    const seleccionados = this.alumnosBulk.filter(a => a.seleccionado && a.puedeReMatricular && !a.procesado);
    if (seleccionados.length === 0) {
      this.messageService.add({ severity: 'warn', summary: 'Sin selección', detail: 'No hay alumnos seleccionados aptos para procesar.' });
      return;
    }

    if (this.cerrarMatriculaAnterior && !this.idEstadoMatriculaCompletado) {
      this.messageService.add({ severity: 'warn', summary: 'Datos incompletos', detail: 'Seleccione el estado de cierre de la matrícula anterior.' });
      return;
    }

    this.procesandoMasivo = true;
    this.progresoBulk = 0;
    this.totalBulk = seleccionados.length;

    from(seleccionados).pipe(
      mergeMap((item) => {
        return this.reMatriculacionService.reMatricular({
          idPersona: item.diagnostico.idPersona,
          idCicloDestino: this.idCicloDestino!,
          idMallaParalelo: item.paraleloSeleccionado,
          cerrarMatriculaAnterior: this.cerrarMatriculaAnterior,
          idEstadoMatriculaCompletado: this.cerrarMatriculaAnterior ? this.idEstadoMatriculaCompletado ?? undefined : undefined
        }).pipe(
          map(res => {
            item.procesado = true;
            if (res.isSuccess) {
              item.exito = true;
              item.seleccionado = false;
            } else {
              item.exito = false;
              item.mensajeError = res.message || 'Error al re-matricular.';
            }
            this.progresoBulk++;
            return item;
          }),
          catchError(err => {
            item.procesado = true;
            item.exito = false;
            item.mensajeError = err?.error?.message || 'Error del servidor.';
            this.progresoBulk++;
            return of(item);
          })
        );
      }, 2), // Procesar de a 2 en paralelo
      takeUntil(this.destroy$)
    ).subscribe({
      complete: () => {
        this.procesandoMasivo = false;
        const exitosos = seleccionados.filter(s => s.exito).length;
        const fallidos = seleccionados.length - exitosos;
        this.messageService.add({
          severity: exitosos > 0 ? 'success' : 'error',
          summary: 'Proceso finalizado',
          detail: `Re-matriculados con éxito: ${exitosos}. Fallidos: ${fallidos}.`
        });
      }
    });
  }

  // Toggle de todos los checkboxes seleccionables
  toggleSeleccionarTodos(event: any): void {
    const checked = event.target ? event.target.checked : event;
    this.alumnosFiltradosBulk.forEach(a => {
      if (a.puedeReMatricular && !a.procesado) {
        a.seleccionado = checked;
      }
    });
  }

  getSelectedEligibleCount(): number {
    return this.alumnosBulk.filter(a => a.seleccionado && a.puedeReMatricular && !a.procesado).length;
  }

  get todosSeleccionados(): boolean {
    const aptos = this.alumnosFiltradosBulk.filter(a => a.puedeReMatricular && !a.procesado);
    if (aptos.length === 0) return false;
    return aptos.every(a => a.seleccionado);
  }

  get alumnosFiltradosBulk(): any[] {
    if (!this.filtroBusqueda || !this.filtroBusqueda.trim()) {
      return this.alumnosBulk;
    }
    const query = this.filtroBusqueda.trim().toLowerCase();
    return this.alumnosBulk.filter(a => {
      const nombreCompleto = `${a.matricula.primerApellido} ${a.matricula.segundoApellido || ''} ${a.matricula.primerNombre} ${a.matricula.segundoNombre || ''}`.toLowerCase();
      const doc = (a.matricula.numeroDocumento || '').toLowerCase();
      return nombreCompleto.includes(query) || doc.includes(query);
    });
  }

  // Métodos heredados para diagnóstico individual
  diagnosticar(): void {
    this.diagnostico = null;
    this.resultado = null;
    this.idMallaParalelo = null;

    if (!this.numeroDocumento?.trim() || !this.idCicloDestino) {
      this.messageService.add({ severity: 'warn', summary: 'Datos incompletos', detail: 'Ingrese el número de documento del alumno y seleccione el ciclo destino.' });
      return;
    }

    this.loading = true;
    this.reMatriculacionService.getDiagnostico(this.numeroDocumento.trim(), this.idCicloDestino).pipe(takeUntil(this.destroy$)).subscribe({
      next: (info: ReMatriculaInfo) => {
        this.loading = false;
        this.diagnostico = info;
      },
      error: (err: any) => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'No se pudo obtener el diagnóstico.' });
      }
    });
  }

  confirmar(): void {
    if (!this.diagnostico?.idPersona || !this.idCicloDestino || !this.idMallaParalelo) {
      this.messageService.add({ severity: 'warn', summary: 'Datos incompletos', detail: 'Seleccione un paralelo antes de confirmar.' });
      return;
    }

    if (this.cerrarMatriculaAnterior && !this.idEstadoMatriculaCompletado) {
      this.messageService.add({ severity: 'warn', summary: 'Datos incompletos', detail: 'Seleccione el estado de cierre de la matrícula anterior.' });
      return;
    }

    this.loadingConfirmar = true;
    this.reMatriculacionService.reMatricular({
      idPersona: this.diagnostico.idPersona,
      idCicloDestino: this.idCicloDestino,
      idMallaParalelo: this.idMallaParalelo,
      cerrarMatriculaAnterior: this.cerrarMatriculaAnterior,
      idEstadoMatriculaCompletado: this.cerrarMatriculaAnterior ? this.idEstadoMatriculaCompletado ?? undefined : undefined
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: ApiResponse<ReMatricularResult>) => {
        this.loadingConfirmar = false;
        if (res.isSuccess && res.data) {
          this.resultado = res.data;
          this.diagnostico = null;
          this.messageService.add({ severity: 'success', summary: 'Re-matriculación exitosa', detail: `Matrícula #${res.data.idMatriculaNueva} generada correctamente.` });
        } else {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: res.message || 'No se pudo completar la re-matriculación.' });
        }
      },
      error: (err: any) => {
        this.loadingConfirmar = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Error al ejecutar la re-matriculación.' });
      }
    });
  }

  nueva(): void {
    this.numeroDocumento = null;
    this.idPeriodoDestinoInd = null;
    this.idCicloDestino = null;
    this.ciclosDestinoIndFiltrados = [];
    this.idMallaParalelo = null;
    this.cerrarMatriculaAnterior = true;
    this.idEstadoMatriculaCompletado = null;
    this.diagnostico = null;
    this.resultado = null;
  }

  get cicloSeleccionado(): CicloDTO | undefined {
    return this.ciclosActivos.find(c => c.idCiclo === this.idCicloDestino);
  }

  getMotivoLabel(motivo: MotivoReMatricula): string {
    const map: Record<MotivoReMatricula, string> = {
      [MotivoReMatricula.REPETIR]: 'Repetición de nivel',
      [MotivoReMatricula.AVANZAR]: 'Progresión al siguiente nivel',
      [MotivoReMatricula.SIN_CALIFICACIONES]: 'Faltan calificaciones',
      [MotivoReMatricula.YA_MATRICULADO]: 'Ya está matriculado',
      [MotivoReMatricula.SIN_MATRICULA_PREVIA]: 'Sin historial de matrículas',
      [MotivoReMatricula.MALLA_DESTINO_NO_ENCONTRADA]: 'Malla destino no encontrada',
      [MotivoReMatricula.SIN_PARALELOS_DISPONIBLES]: 'Sin cupo disponible',
      [MotivoReMatricula.DEUDA_PENDIENTE]: 'Deuda pendiente de pago',
    };
    return map[motivo] ?? 'Desconocido';
  }

  getMotivoSeverity(motivo: MotivoReMatricula): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
    const map: Record<MotivoReMatricula, 'success' | 'warn' | 'danger' | 'info' | 'secondary'> = {
      [MotivoReMatricula.REPETIR]: 'warn',
      [MotivoReMatricula.AVANZAR]: 'success',
      [MotivoReMatricula.SIN_CALIFICACIONES]: 'secondary',
      [MotivoReMatricula.YA_MATRICULADO]: 'info',
      [MotivoReMatricula.SIN_MATRICULA_PREVIA]: 'secondary',
      [MotivoReMatricula.MALLA_DESTINO_NO_ENCONTRADA]: 'danger',
      [MotivoReMatricula.SIN_PARALELOS_DISPONIBLES]: 'danger',
      [MotivoReMatricula.DEUDA_PENDIENTE]: 'danger',
    };
    return map[motivo] ?? 'secondary';
  }

  getMotivoIcon(motivo: MotivoReMatricula): string {
    const map: Record<MotivoReMatricula, string> = {
      [MotivoReMatricula.REPETIR]: 'pi pi-exclamation-triangle',
      [MotivoReMatricula.AVANZAR]: 'pi pi-arrow-up-right',
      [MotivoReMatricula.SIN_CALIFICACIONES]: 'pi pi-clock',
      [MotivoReMatricula.YA_MATRICULADO]: 'pi pi-check-circle',
      [MotivoReMatricula.SIN_MATRICULA_PREVIA]: 'pi pi-info-circle',
      [MotivoReMatricula.MALLA_DESTINO_NO_ENCONTRADA]: 'pi pi-times-circle',
      [MotivoReMatricula.SIN_PARALELOS_DISPONIBLES]: 'pi pi-ban',
      [MotivoReMatricula.DEUDA_PENDIENTE]: 'pi pi-dollar',
    };
    return map[motivo] ?? 'pi pi-question-circle';
  }

  getCupoLabel(paralelo: ParaleloDisponible): string {
    return paralelo.cupoMaximo === 2147483647 ? '∞' : paralelo.cupoMaximo.toString();
  }

  getDisponibleLabel(paralelo: ParaleloDisponible): string {
    if (paralelo.cupoMaximo === 2147483647) return 'Sin límite';
    return paralelo.cupoDisponible.toString();
  }
}
