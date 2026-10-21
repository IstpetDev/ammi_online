import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, Subscription, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';

import { MatriculaService } from '../../../../core/services/postulaciones/matricula.service';
import { NotasAlumnoService } from '../../../../core/services/infrastructure/notas-alumno.service';
import { PlantillaEstructuraService } from '../../../../core/services/infrastructure/plantilla-estructura.service';
import { DetalleMallaService } from '../../../../core/services/infrastructure/detalle-malla.service';
import { PlantillaEstructuraDTO } from '../../../../data/models/notas/plantilla-estructura.model';
import { NotasAlumnoDTO, NotasMasivasDTO, NotaAlumnoItemDTO } from '../../../../data/models/notas';
import { CalificacionesStateService } from '../calificaciones.state.service';
import { SharedEmptyStateComponent } from '../../../../shared/shared-empty-state/shared-empty-state.component';
import { SharedToastComponent } from '../../../../shared/shared-toast/shared-toast.component';

interface NotaAlumnoEditable {
  idDetalleMatricula: number | null;
  idMatricula: number;
  nombreAlumno: string;
  documentoAlumno: string;
  idUsuario?: number | null;
  notas: { [idEstructura: number]: number | null };
  observaciones: { [idEstructura: number]: string };
  notaFinal?: number | null;
  notaRemedial?: number | null;
  guardandoRemedial?: boolean;
  notaFinalPersistida?: boolean;
}

interface GrupoHeaderNodo {
  id: number;
  nombre: string;
  peso: number;
  hojas: PlantillaEstructuraDTO[];
}

@Component({
  selector: 'app-calificaciones-ingreso',
  standalone: true,
  imports: [CommonModule, FormsModule,
    TableModule, ButtonModule, InputNumberModule,
    TagModule, TooltipModule, ProgressSpinnerModule, SharedEmptyStateComponent, SharedToastComponent],
  providers: [MessageService],
  templateUrl: './calificaciones-ingreso.component.html',
  styleUrls: ['./calificaciones-ingreso.component.css']
})
export class CalificacionesIngresoComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private matriculaService = inject(MatriculaService);
  private notasService = inject(NotasAlumnoService);
  private estructuraService = inject(PlantillaEstructuraService);
  private detalleMallaService = inject(DetalleMallaService);
  private messageService = inject(MessageService);
  private stateService = inject(CalificacionesStateService);

  idMallaParalelo = 0;
  idDetalleMalla = 0;
  asignacion: any = null;

  alumnos: NotaAlumnoEditable[] = [];
  estructuraArbol: PlantillaEstructuraDTO[] = [];
  nodosHoja: PlantillaEstructuraDTO[] = [];
  gruposHeaderNodos: GrupoHeaderNodo[] = [];
  pesoEfectivoPorNodo: { [idEstructura: number]: number } = {};
  rutaPorNodo: { [idEstructura: number]: string } = {};

  loading = false;
  guardando = false;
  notasBloqueadas = false;
  statusPeriodo: string = 'InProgress';
  diasRestantes: number = 0;
  fechaLimite: string = '';
  mensajePlazo: string = '';
  paralelosDisponibles: any[] = [];
  estadoAutoguardado: 'guardado' | 'guardando' | 'pendiente' | 'error' = 'guardado';
  searchTermAlumno = '';

  // Modal de Retroalimentación / Observaciones
  modalObsVisible = false;
  modalObsAlumno: NotaAlumnoEditable | null = null;
  modalObsNodo: PlantillaEstructuraDTO | null = null;
  modalObsTexto = '';
  private autoSaveSubject = new Subject<void>();
  private autoSaveSub?: Subscription;
  private paramsSub?: Subscription;

  ngOnInit(): void {
    this.autoSaveSub = this.autoSaveSubject.pipe(
      debounceTime(1500)
    ).subscribe(() => {
      this.ejecutarAutoguardado();
    });

    this.paramsSub = this.route.params.subscribe(params => {
      this.idMallaParalelo = +params['idMallaParalelo'];
      this.idDetalleMalla = +params['idDetalleMalla'];
      this.asignacion = this.stateService.asignacion;
      if (!this.asignacion || this.asignacion.idMallaParalelo !== this.idMallaParalelo) {
        this.asignacion = { idMallaParalelo: this.idMallaParalelo, idDetalleMalla: this.idDetalleMalla };
      }
      this.paralelosDisponibles = this.asignacion?.paralelosMateria || [];
      this.cargarDatos();
    });
  }

  ngOnDestroy(): void {
    this.paramsSub?.unsubscribe();
    this.autoSaveSub?.unsubscribe();
  }

  get nombreMateria(): string {
    return this.asignacion?.nombreMateria || `Materia #${this.idDetalleMalla}`;
  }

  get nombreParalelo(): string {
    return this.asignacion?.nombreParalelo || `Paralelo #${this.idMallaParalelo}`;
  }

  get nombrePlantilla(): string {
    return this.asignacion?.nombrePlantilla || '';
  }

  cargarDatos(): void {
    this.loading = true;
    this.alumnos = [];
    this.nodosHoja = [];
    this.gruposHeaderNodos = [];
    this.pesoEfectivoPorNodo = {};
    this.rutaPorNodo = {};

    const cargarConPlantilla = (idPlantilla: number) => {
      this.estructuraService.getArbol(idPlantilla).subscribe({
        next: (arbol) => {
          this.estructuraArbol = arbol;
          const metadata = this.construirMetadatosNodos(arbol);
          this.nodosHoja = metadata.hojas;
          this.gruposHeaderNodos = this.construirGruposHeaderNodos(arbol);
          this.pesoEfectivoPorNodo = metadata.pesosEfectivos;
          this.rutaPorNodo = metadata.rutas;
          this.cargarAlumnosYNotas();
        },
        error: () => {
          this.nodosHoja = [];
          this.cargarAlumnosYNotas();
        }
      });
    };

    // Always fetch DetalleMalla to get dates and grace days
    this.detalleMallaService.getById(this.idDetalleMalla).subscribe({
      next: (dm) => {
        if (dm) {
          this.asignacion = {
            ...this.asignacion,
            nombreMateria: dm.nombreMateria || this.asignacion?.nombreMateria,
            idPlantillaEvaluacion: dm.idPlantillaEvaluacion || this.asignacion?.idPlantillaEvaluacion
          };

          const fechaInicio = dm.fechaInicio ? new Date(dm.fechaInicio) : null;
          const fechaFin = dm.fechaFin ? new Date(dm.fechaFin) : null;
          const diasGracia = dm.diasGracia ?? 5;
          const hoy = new Date();
          hoy.setHours(0,0,0,0);

          if (fechaInicio) {
            const inicio = new Date(fechaInicio);
            inicio.setHours(0,0,0,0);
            if (hoy < inicio) {
              this.statusPeriodo = 'NotStarted';
              this.notasBloqueadas = true;
              this.mensajePlazo = `El período de calificaciones aún no ha iniciado (Abre el ${inicio.toLocaleDateString('es-EC')}).`;
            }
          }

          if (this.statusPeriodo !== 'NotStarted') {
            if (!fechaFin) {
              this.statusPeriodo = 'InProgress';
              this.notasBloqueadas = false;
            } else {
              const fin = new Date(fechaFin);
              fin.setHours(0,0,0,0);
              const limite = new Date(fin);
              limite.setDate(limite.getDate() + diasGracia);

              if (hoy < fin) {
                this.statusPeriodo = 'InProgress';
                this.notasBloqueadas = false;
              } else if (hoy <= limite) {
                this.statusPeriodo = 'GracePeriod';
                this.diasRestantes = Math.ceil((limite.getTime() - hoy.getTime()) / (1000*60*60*24));
                this.fechaLimite = limite.toLocaleDateString('es-EC');
                this.notasBloqueadas = false;
              } else {
                this.statusPeriodo = 'Closed';
                this.notasBloqueadas = true;
                this.mensajePlazo = 'Plazo de calificaciones vencido.';
              }
            }
          }
        }
        if (this.asignacion?.idPlantillaEvaluacion > 0) {
          cargarConPlantilla(this.asignacion.idPlantillaEvaluacion);
        } else {
          this.cargarAlumnosYNotas();
        }
      },
      error: () => {
        if (this.asignacion?.idPlantillaEvaluacion > 0) {
          cargarConPlantilla(this.asignacion.idPlantillaEvaluacion);
        } else {
          this.cargarAlumnosYNotas();
        }
      }
    });
  }

  cargarAlumnosYNotas(): void {
    if (!this.idMallaParalelo) {
      this.loading = false;
      this.messageService.add({ severity: 'warn', summary: 'Paralelo inválido', detail: 'No se encontró idMallaParalelo' });
      return;
    }
    this.matriculaService.getDetallesMatriculaByMallaParaleloYMateria(this.idMallaParalelo, this.idDetalleMalla).subscribe({
      next: (detallesMatricula) => {
        this.alumnos = detallesMatricula.map(dm => ({
          idDetalleMatricula: dm.idDetalleMatricula,
          idMatricula: dm.idMatricula,
          nombreAlumno: dm.nombreAlumno,
          documentoAlumno: dm.documentoAlumno,
          idUsuario: dm.idUsuario ?? (dm as any).idUsuarioAlumno ?? null,
          notas: {},
          observaciones: {},
          notaFinal: null,
          notaRemedial: null,
          notaFinalPersistida: false
        }));
        this.notasService.getByMallaParalelo(this.idMallaParalelo, { idDetalleMalla: this.idDetalleMalla }).subscribe({
          next: (notas) => {
            this.aplicarNotasAAlumnos(notas);
            this.loading = false;
          },
          error: () => this.loading = false
        });
      },
      error: () => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los alumnos del paralelo' });
      }
    });
  }

  private aplicarNotasAAlumnos(notas: NotasAlumnoDTO[]): void {
    if (!Array.isArray(this.alumnos) || this.alumnos.length === 0 || !Array.isArray(notas)) return;
    const porDetalleMatricula = new Map<number, NotaAlumnoEditable>();
    const porMatricula = new Map<number, NotaAlumnoEditable>();
    this.alumnos.forEach(a => {
      if (a.idDetalleMatricula != null) porDetalleMatricula.set(a.idDetalleMatricula, a);
      porMatricula.set(a.idMatricula, a);
    });
    notas.forEach(nota => {
      const alumno = (nota.idDetalleMatricula != null ? porDetalleMatricula.get(nota.idDetalleMatricula) : undefined) ||
        (nota.idMatricula != null ? porMatricula.get(nota.idMatricula) : undefined);
      if (!alumno) return;
      if (nota.idPlantillaEstructura != null) {
        alumno.notas[nota.idPlantillaEstructura] = nota.valorNota;
        if (nota.observacion) alumno.observaciones[nota.idPlantillaEstructura] = nota.observacion;
      }
      if (nota.examenRemedial != null) alumno.notaRemedial = nota.examenRemedial;
    });
    this.alumnos.forEach(a => { this.calcularNotaFinal(a); if (a.notaFinal != null) a.notaFinalPersistida = true; });
  }

  calcularNotaFinal(alumno: NotaAlumnoEditable): void {
    if (alumno.notaRemedial != null && alumno.notaRemedial >= 7) { alumno.notaFinal = 7; return; }
    if (!this.nodosHoja || this.nodosHoja.length === 0) return;
    const sumaTotalPesos = this.nodosHoja.reduce((t, n) => t + (this.pesoEfectivoPorNodo[n.idPlantillaEstructura] ?? n.peso), 0);
    let sumaPonderada = 0;
    let hayNotasIngresadas = false;
    this.nodosHoja.forEach(nodo => {
      const nota = alumno.notas[nodo.idPlantillaEstructura];
      if (nota !== null && nota !== undefined && nota >= 0) {
        hayNotasIngresadas = true;
        const pesoEfectivo = this.pesoEfectivoPorNodo[nodo.idPlantillaEstructura] ?? nodo.peso;
        sumaPonderada += (nota * pesoEfectivo) / 100;
      }
    });
    if (!hayNotasIngresadas || sumaTotalPesos === 0) alumno.notaFinal = null;
    else alumno.notaFinal = Math.round((sumaPonderada / (sumaTotalPesos / 100)) * 100) / 100;
  }

  onNotaChange(alumno: NotaAlumnoEditable): void {
    this.calcularNotaFinal(alumno);
    this.estadoAutoguardado = 'pendiente';
    this.autoSaveSubject.next();
  }

  ejecutarAutoguardado(): void {
    if (this.guardando || !this.alumnos.length || !this.nodosHoja.length) return;
    this.estadoAutoguardado = 'guardando';

    let totalNotasParaGuardar = 0;
    this.nodosHoja.forEach(nodo => {
      totalNotasParaGuardar += this.alumnos.filter(a =>
        a.notas[nodo.idPlantillaEstructura] !== null && a.notas[nodo.idPlantillaEstructura] !== undefined
      ).length;
    });

    if (totalNotasParaGuardar === 0) {
      this.estadoAutoguardado = 'guardado';
      return;
    }

    const observables = this.nodosHoja.map(nodo =>
      this.notasService.createMasivo({
        idPlantillaEstructura: nodo.idPlantillaEstructura,
        notas: this.alumnos.filter(a => !!a.idDetalleMatricula && a.notas[nodo.idPlantillaEstructura] !== null && a.notas[nodo.idPlantillaEstructura] !== undefined)
          .map(a => ({ idDetalleMatricula: a.idDetalleMatricula!, valorNota: a.notas[nodo.idPlantillaEstructura]!, observacion: a.observaciones[nodo.idPlantillaEstructura] || null }))
      })
    );

    forkJoin(observables).subscribe({
      next: () => {
        this.estadoAutoguardado = 'guardado';
        this.alumnos.forEach(a => { if (a.notaFinal != null) a.notaFinalPersistida = true; });
      },
      error: () => {
        this.estadoAutoguardado = 'error';
      }
    });
  }

  onKeyDown(event: KeyboardEvent, rowIndex: number, colIndex: number): void {
    let targetRow = rowIndex;
    let targetCol = colIndex;

    if (event.key === 'Enter' || event.key === 'ArrowDown') {
      event.preventDefault();
      targetRow = rowIndex + 1;
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      targetRow = rowIndex - 1;
    } else {
      return;
    }

    const nextEl = document.getElementById(`nota-cell-${targetRow}-${targetCol}`);
    if (nextEl) {
      const input = nextEl.querySelector('input') || nextEl;
      (input as HTMLElement).focus();
      if (input instanceof HTMLInputElement) {
        input.select();
      }
    }
  }

  guardarTodasLasNotas(): void {
    this.guardando = true;
    let totalNotasParaGuardar = 0;
    this.nodosHoja.forEach(nodo => {
      totalNotasParaGuardar += this.alumnos.filter(a =>
        a.notas[nodo.idPlantillaEstructura] !== null && a.notas[nodo.idPlantillaEstructura] !== undefined
      ).length;
    });
    if (totalNotasParaGuardar === 0) {
      this.messageService.add({ severity: 'warn', summary: 'Aviso', detail: 'No hay notas para guardar' });
      this.guardando = false;
      return;
    }
    const observables = this.nodosHoja.map(nodo =>
      this.notasService.createMasivo({
        idPlantillaEstructura: nodo.idPlantillaEstructura,
        notas: this.alumnos.filter(a => !!a.idDetalleMatricula && a.notas[nodo.idPlantillaEstructura] !== null && a.notas[nodo.idPlantillaEstructura] !== undefined)
          .map(a => ({ idDetalleMatricula: a.idDetalleMatricula!, valorNota: a.notas[nodo.idPlantillaEstructura]!, observacion: a.observaciones[nodo.idPlantillaEstructura] || null }))
      })
    );
    forkJoin(observables).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: `Todas las notas se guardaron correctamente (${totalNotasParaGuardar} notas)` });
        this.alumnos.forEach(a => { this.calcularNotaFinal(a); if (a.notaFinal != null) a.notaFinalPersistida = true; });
        this.notasBloqueadas = true;
        this.guardando = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron guardar todas las notas' });
        this.guardando = false;
      }
    });
  }

  guardarNotasNodo(idPlantillaEstructura: number): void {
    this.guardando = true;
    const notasParaGuardar: NotaAlumnoItemDTO[] = this.alumnos
      .filter(a => !!a.idDetalleMatricula && a.notas[idPlantillaEstructura] !== null && a.notas[idPlantillaEstructura] !== undefined)
      .map(a => ({ idDetalleMatricula: a.idDetalleMatricula!, valorNota: a.notas[idPlantillaEstructura]!, observacion: a.observaciones[idPlantillaEstructura] || null }));
    if (notasParaGuardar.length === 0) {
      this.messageService.add({ severity: 'warn', summary: 'Aviso', detail: 'No hay notas para guardar' });
      this.guardando = false;
      return;
    }
    this.notasService.createMasivo({ idPlantillaEstructura, notas: notasParaGuardar }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: `${notasParaGuardar.length} notas guardadas correctamente` });
        this.alumnos.forEach(a => { this.calcularNotaFinal(a); if (a.notaFinal != null) a.notaFinalPersistida = true; });
        this.guardando = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron guardar las notas' });
        this.guardando = false;
      }
    });
  }

  getEstadoAlumno(alumno: NotaAlumnoEditable): 'aprobado' | 'remedial' | 'reprobado' | 'sin-nota' {
    if (alumno.notaRemedial != null) return alumno.notaRemedial >= 7 ? 'aprobado' : 'reprobado';
    if (alumno.notaFinal === null || alumno.notaFinal === undefined) return 'sin-nota';
    if (alumno.notaFinal >= 7) return 'aprobado';
    if (alumno.notaFinal > 5) return 'remedial';
    return 'reprobado';
  }

  guardarRemedialAlumno(alumno: NotaAlumnoEditable): void {
    if (!alumno.idDetalleMatricula) {
      this.messageService.add({ severity: 'warn', summary: 'Datos incompletos', detail: 'No se encontró el idDetalleMatricula para registrar remedial' });
      return;
    }
    if (alumno.notaRemedial === null || alumno.notaRemedial === undefined) {
      this.messageService.add({ severity: 'warn', summary: 'Aviso', detail: 'Ingresa la nota del examen remedial' });
      return;
    }
    if (alumno.notaRemedial < 0 || alumno.notaRemedial > 10) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'La nota debe estar entre 0 y 10' });
      return;
    }
    alumno.guardandoRemedial = true;
    this.matriculaService.registrarRemedial(alumno.idDetalleMatricula, alumno.notaRemedial).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Remedial registrado', detail: `${alumno.nombreAlumno}: nota remedial ${alumno.notaRemedial} guardada` });
        this.cargarAlumnosYNotas();
        alumno.guardandoRemedial = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo registrar el remedial' });
        alumno.guardandoRemedial = false;
      }
    });
  }

  cambiarParalelo(paralelo: any): void {
    if (paralelo.idMallaParalelo === this.idMallaParalelo) return;
    this.stateService.setAsignacion({ ...this.asignacion, ...paralelo });
    this.router.navigate(['/dashboard/calificaciones/ingreso', paralelo.idMallaParalelo, this.idDetalleMalla]);
  }

  volver(): void {
    this.router.navigate(['/dashboard/calificaciones/seleccion']);
  }

  validarNota(valor: number | null): boolean {
    if (valor === null || valor === undefined) return true;
    return valor >= 0 && valor <= 10;
  }

  esNotaBaja(valor: number | null): boolean {
    if (valor === null || valor === undefined) return false;
    return valor >= 0.01 && valor < 7;
  }

  getAlumnosFiltrados(): NotaAlumnoEditable[] {
    if (!this.searchTermAlumno || !this.searchTermAlumno.trim()) return this.alumnos;
    const search = this.searchTermAlumno.toLowerCase().trim();
    return this.alumnos.filter(a =>
      (a.nombreAlumno || '').toLowerCase().includes(search) ||
      (a.documentoAlumno || '').toLowerCase().includes(search)
    );
  }

  // ─── Modal de Retroalimentación / Observaciones ─────────────

  abrirModalObservacion(alumno: NotaAlumnoEditable, nodo: PlantillaEstructuraDTO): void {
    if (this.notasBloqueadas) return;
    this.modalObsAlumno = alumno;
    this.modalObsNodo = nodo;
    this.modalObsTexto = alumno.observaciones[nodo.idPlantillaEstructura] || '';
    this.modalObsVisible = true;
  }

  guardarObservacionModal(): void {
    if (this.modalObsAlumno && this.modalObsNodo) {
      const idEstructura = this.modalObsNodo.idPlantillaEstructura;
      this.modalObsAlumno.observaciones[idEstructura] = this.modalObsTexto.trim();
      this.onNotaChange(this.modalObsAlumno);
    }
    this.cerrarModalObservacion();
  }

  cerrarModalObservacion(): void {
    this.modalObsVisible = false;
    this.modalObsAlumno = null;
    this.modalObsNodo = null;
    this.modalObsTexto = '';
  }

  // ─── Estructura tree helpers ──────────────────────────────

  extraerNodosHojaFromArray(nodos: PlantillaEstructuraDTO[]): PlantillaEstructuraDTO[] {
    const hojas: PlantillaEstructuraDTO[] = [];
    const recorrer = (n: PlantillaEstructuraDTO) => {
      if (!n.hijos || n.hijos.length === 0) hojas.push(n);
      else n.hijos.forEach(hijo => recorrer(hijo));
    };
    nodos.forEach(nodo => recorrer(nodo));
    return hojas;
  }

  private construirMetadatosNodos(arbol: PlantillaEstructuraDTO[]) {
    const hojas = this.extraerNodosHojaFromArray(arbol);
    const index = new Map<number, PlantillaEstructuraDTO>();
    const stack: PlantillaEstructuraDTO[] = [...(arbol || [])];
    while (stack.length > 0) { const actual = stack.pop()!; index.set(actual.idPlantillaEstructura, actual); if (actual.hijos?.length) stack.push(...actual.hijos); }
    const pesosEfectivos: { [idEstructura: number]: number } = {};
    const rutas: { [idEstructura: number]: string } = {};
    hojas.forEach(hoja => {
      const id = hoja.idPlantillaEstructura;
      rutas[id] = this.construirRutaNodo(hoja, index);
      pesosEfectivos[id] = this.calcularPesoEfectivoNodo(hoja, index);
    });
    return { hojas, pesosEfectivos, rutas };
  }

  private construirGruposHeaderNodos(arbol: PlantillaEstructuraDTO[]): GrupoHeaderNodo[] {
    if (!Array.isArray(arbol) || arbol.length === 0) return [];
    return arbol.map(nodoRaiz => ({
      id: nodoRaiz.idPlantillaEstructura,
      nombre: nodoRaiz.nodoNombre,
      peso: nodoRaiz.peso,
      hojas: this.extraerNodosHojaFromArray([nodoRaiz])
    }));
  }

  private construirRutaNodo(nodo: PlantillaEstructuraDTO, index: Map<number, PlantillaEstructuraDTO>): string {
    const nombres: string[] = [nodo.nodoNombre];
    let parentId = nodo.idNodoPadre;
    while (parentId != null) { const parent = index.get(parentId); if (!parent) break; nombres.unshift(parent.nodoNombre); parentId = parent.idNodoPadre; }
    if (nombres.length === 1) return `${nombres[0]} / ${nombres[0]}`;
    return nombres.join(' / ');
  }

  private calcularPesoEfectivoNodo(nodo: PlantillaEstructuraDTO, index: Map<number, PlantillaEstructuraDTO>): number {
    let pesoEfectivo = Number(nodo.peso || 0);
    let parentId = nodo.idNodoPadre;
    while (parentId != null) { const parent = index.get(parentId); if (!parent) break; pesoEfectivo = (pesoEfectivo * Number(parent.peso || 0)) / 100; parentId = parent.idNodoPadre; }
    return Math.round(pesoEfectivo * 10000) / 10000;
  }

  getNombreHojaVisible(nodo: PlantillaEstructuraDTO): string { return nodo.nodoNombre; }
  getPesoNodoVisible(nodo: PlantillaEstructuraDTO): number {
    const peso = this.pesoEfectivoPorNodo[nodo.idPlantillaEstructura];
    return Math.round(((peso ?? nodo.peso) as number) * 100) / 100;
  }
}
