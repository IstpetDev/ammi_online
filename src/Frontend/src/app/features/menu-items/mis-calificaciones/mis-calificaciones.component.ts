import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, catchError, of } from 'rxjs';

// Services
import { AuthService } from '../../../core/auth/auth.service';
import { MatriculaService } from '../../../core/services/postulaciones/matricula.service';
import { CreditoService } from '../../../core/services/pagos/credito.service';
import { ToastService } from '../../../shared/toast.service';
import { NotasAlumnoService } from '../../../core/services/infrastructure/notas-alumno.service';
import { PlantillaEstructuraService } from '../../../core/services/infrastructure/plantilla-estructura.service';
import { DetalleMallaService } from '../../../core/services/infrastructure/detalle-malla.service';

// Components
import { SharedHeaderComponent } from '../../../shared/shared-header/shared-header.component';
import { CustomSelectComponent } from '../../../shared/custom-select/custom-select.component';
import { SharedToastComponent } from '../../../shared/shared-toast/shared-toast.component';

// Models
import {
  HistorialAcademicoDTO,
  MallaHistorialDTO,
  CicloHistorialDTO,
  MateriaHistorialDTO
} from '../../../data/models/matricula';
import {
  PlantillaEstructuraDTO,
  NotasAlumnoDTO
} from '../../../data/models/notas';

export interface ActividadDesglose {
  idPlantillaEstructura: number;
  nombre: string;
  ruta: string;
  pesoEnGrupo: number;
  pesoEfectivo: number;
  valorNota: number | null;
  observacion: string | null;
}

export interface GrupoDesglose {
  idPlantillaEstructura: number;
  nombre: string;
  peso: number;
  subtotal: number | null;
  aporteFinal: number | null;
  actividades: ActividadDesglose[];
}

export interface DesgloseMateria {
  idDetalleMalla: number;
  tienePlantilla: boolean;
  nombrePlantilla?: string;
  grupos: GrupoDesglose[];
  notaFinalCalculada: number | null;
  notaFinalOficial: number | null;
  examenRemedial: number | null;
  estado: string;
  totalActividades: number;
  actividadesCalificadas: number;
}

@Component({
  selector: 'app-mis-calificaciones',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SharedHeaderComponent,
    CustomSelectComponent,
    SharedToastComponent
  ],
  templateUrl: './mis-calificaciones.component.html',
  styleUrls: ['./mis-calificaciones.component.css']
})
export class MisCalificacionesComponent implements OnInit {
  private authService = inject(AuthService);
  private matriculaService = inject(MatriculaService);
  private creditoService = inject(CreditoService);
  private toastService = inject(ToastService);
  private notasService = inject(NotasAlumnoService);
  private estructuraService = inject(PlantillaEstructuraService);
  private detalleMallaService = inject(DetalleMallaService);

  // Data
  historial: HistorialAcademicoDTO | null = null;
  mallaSeleccionada: MallaHistorialDTO | null = null;

  // Dropdown options
  mallasOptions: { label: string; value: MallaHistorialDTO }[] = [];

  // UI state
  loading = false;
  error = '';

  // Payment block
  bloqueadoPorPago = false;
  cuotasVencidas: { nombre: string; fechaLimite: string; pendiente: number }[] = [];

  // Cycle Accordion state
  ciclosExpandidos: { [key: number]: boolean } = {};

  // Subject Detailed Grades Breakdown State
  materiasExpandidas: { [key: number]: boolean } = {};
  loadingDesglose: { [key: number]: boolean } = {};
  errorDesglose: { [key: number]: string } = {};
  desglosePorMateria: { [key: number]: DesgloseMateria } = {};

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.loading = true;
      this.verificarPagos(user.id);
    }
  }

  /**
   * Verifica si el alumno tiene cuotas vencidas sin pagar.
   * Si las tiene, bloquea el acceso a calificaciones.
   */
  private verificarPagos(idUsuario: number): void {
    this.matriculaService.getMatriculasByAlumno(idUsuario).subscribe({
      next: (matriculas) => {
        if (!matriculas || matriculas.length === 0) {
          // Sin matrículas, no hay pagos que verificar
          this.cargarHistorial(idUsuario);
          return;
        }

        // Obtener detalles de crédito de todas las matrículas
        const requests = matriculas.map(m =>
          this.creditoService.getDetallesCreditoByMatricula(m.idMatricula!).pipe(
            catchError(() => of([]))
          )
        );

        forkJoin(requests).subscribe({
          next: (resultados) => {
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            const vencidas: { nombre: string; fechaLimite: string; pendiente: number }[] = [];

            resultados.forEach((detalles, idx) => {
              const modalidad = matriculas[idx].detalleTipoOferta || matriculas[idx].detalleMalla || '';
              detalles.forEach((d, i) => {
                if (d.pagado) return;
                if (!d.fechaLimite) return;

                try {
                  const fecha = new Date(d.fechaLimite);
                  fecha.setHours(0, 0, 0, 0);
                  if (fecha < hoy) {
                    const pendiente = (d.valor || 0) - (d.valorCancelado || 0);
                    vencidas.push({
                      nombre: i === 0 ? `Matrícula - ${modalidad}` : `Cuota ${i} - ${modalidad}`,
                      fechaLimite: d.fechaLimite,
                      pendiente
                    });
                  }
                } catch { /* fecha inválida, ignorar */ }
              });
            });

            if (vencidas.length > 0) {
              this.bloqueadoPorPago = true;
              this.cuotasVencidas = vencidas;
              this.loading = false;
            } else {
              this.cargarHistorial(idUsuario);
            }
          },
          error: () => {
            // Si falla la verificación de pagos, igual dejar pasar
            this.cargarHistorial(idUsuario);
          }
        });
      },
      error: () => {
        // Si falla obtener matrículas, igual cargar historial
        this.cargarHistorial(idUsuario);
      }
    });
  }

  cargarHistorial(idUsuario?: number): void {
    const id = idUsuario || this.authService.getCurrentUser()?.id;
    if (!id) return;

    this.loading = true;
    this.error = '';

    this.matriculaService.getHistorialCompleto(id).subscribe({
      next: (data) => {
        this.historial = data;
        this.loading = false;

        if (data && data.mallas.length > 0) {
          this.mallasOptions = data.mallas.map(m => ({
            label: `${m.nombreMalla} - ${m.tipoOferta}`,
            value: m
          }));
          this.seleccionarMalla(data.mallas[0]);
        } else {
          this.error = 'No tienes matrículas registradas en el sistema.';
        }
      },
      error: () => {
        this.error = 'Error al cargar tu historial académico. Intenta nuevamente.';
        this.loading = false;
      }
    });
  }

  seleccionarMalla(malla: MallaHistorialDTO): void {
    this.mallaSeleccionada = malla;
    this.ciclosExpandidos = {};
    this.materiasExpandidas = {};
  }

  toggleCiclo(idCiclo: number): void {
    this.ciclosExpandidos[idCiclo] = !this.ciclosExpandidos[idCiclo];
  }

  isCicloExpandido(idCiclo: number): boolean {
    if (this.ciclosExpandidos[idCiclo] === undefined) {
      const index = this.ciclos.findIndex(c => c.idCiclo === idCiclo);
      this.ciclosExpandidos[idCiclo] = index === 0; // Expand first cycle by default
    }
    return this.ciclosExpandidos[idCiclo];
  }

  isMateriaVisible(materia: any): boolean {
    if (materia.notaFinal !== null && materia.notaFinal !== undefined) return true;
    if (materia.estado?.toLowerCase() === 'aprobado') return true;

    if (materia.periodoActivo !== undefined) {
      return materia.periodoActivo;
    }

    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    if (materia.fechaInicio) {
      const inicio = new Date(materia.fechaInicio); inicio.setHours(0, 0, 0, 0);
      if (hoy < inicio) return false;
    }
    if (materia.fechaFin) {
      const fin = new Date(materia.fechaFin); fin.setHours(0, 0, 0, 0);
      const gracia = materia.diasGracia ?? 5;
      const limite = new Date(fin); limite.setDate(limite.getDate() + gracia);
      if (hoy > limite) return false;
    }
    return true;
  }

  getMateriasCiclo(ciclo: CicloHistorialDTO): MateriaHistorialDTO[] {
    return (ciclo.materias || []).filter(m => this.isMateriaVisible(m));
  }

  // ========== Detailed Grades Breakdown Logic ==========

  toggleMateria(materia: MateriaHistorialDTO, idMatricula: number): void {
    const key = materia.idDetalleMalla;
    this.materiasExpandidas[key] = !this.materiasExpandidas[key];

    if (this.materiasExpandidas[key] && !this.desglosePorMateria[key]) {
      this.cargarDesgloseMateria(materia, idMatricula);
    }
  }

  isMateriaExpandida(idDetalleMalla: number): boolean {
    return !!this.materiasExpandidas[idDetalleMalla];
  }

  expandirTodasMaterias(ciclo: CicloHistorialDTO): void {
    ciclo.materias.forEach(m => {
      this.materiasExpandidas[m.idDetalleMalla] = true;
      if (!this.desglosePorMateria[m.idDetalleMalla]) {
        this.cargarDesgloseMateria(m, ciclo.idMatricula);
      }
    });
  }

  colapsarTodasMaterias(ciclo: CicloHistorialDTO): void {
    ciclo.materias.forEach(m => {
      this.materiasExpandidas[m.idDetalleMalla] = false;
    });
  }

  cargarDesgloseMateria(materia: MateriaHistorialDTO, idMatricula: number): void {
    const key = materia.idDetalleMalla;
    if (this.desglosePorMateria[key]) return;

    this.loadingDesglose[key] = true;
    this.errorDesglose[key] = '';

    // Step 1: Ensure we have plantilla info
    const fetchPlantilla$ = (materia.idPlantillaEvaluacion && materia.idPlantillaEvaluacion > 0)
      ? of({ idPlantillaEvaluacion: materia.idPlantillaEvaluacion, nombrePlantilla: '' })
      : this.detalleMallaService.getById(materia.idDetalleMalla).pipe(
          catchError(() => of(null))
        );

    // Step 2: Fetch notes
    const fetchNotas$ = materia.idDetalleMatricula
      ? this.notasService.getByDetalleMatricula(materia.idDetalleMatricula).pipe(
          catchError(() => of([] as NotasAlumnoDTO[]))
        )
      : this.notasService.getByMatriculaYMateria(idMatricula, materia.idDetalleMalla).pipe(
          catchError(() => of([] as NotasAlumnoDTO[]))
        );

    forkJoin({
      dmInfo: fetchPlantilla$,
      notas: fetchNotas$
    }).subscribe({
      next: ({ dmInfo, notas }) => {
        const idPlantilla = materia.idPlantillaEvaluacion || dmInfo?.idPlantillaEvaluacion;
        if (idPlantilla && idPlantilla > 0) {
          this.estructuraService.getArbol(idPlantilla).subscribe({
            next: (arbol) => {
              this.procesarDesglose(key, arbol, notas, materia);
              this.loadingDesglose[key] = false;
            },
            error: () => {
              this.procesarDesgloseSinPlantilla(key, notas, materia);
              this.loadingDesglose[key] = false;
            }
          });
        } else {
          this.procesarDesgloseSinPlantilla(key, notas, materia);
          this.loadingDesglose[key] = false;
        }
      },
      error: () => {
        this.errorDesglose[key] = 'No se pudo cargar el desglose detallado de calificaciones.';
        this.loadingDesglose[key] = false;
      }
    });
  }

  private procesarDesglose(
    key: number,
    arbol: PlantillaEstructuraDTO[],
    notas: NotasAlumnoDTO[],
    materia: MateriaHistorialDTO
  ): void {
    if (!Array.isArray(arbol) || arbol.length === 0) {
      this.procesarDesgloseSinPlantilla(key, notas, materia);
      return;
    }

    const index = new Map<number, PlantillaEstructuraDTO>();
    const stack: PlantillaEstructuraDTO[] = [...arbol];
    while (stack.length > 0) {
      const actual = stack.pop()!;
      index.set(actual.idPlantillaEstructura, actual);
      if (actual.hijos?.length) stack.push(...actual.hijos);
    }

    const notasMap = new Map<number, { valorNota: number | null; observacion: string | null }>();
    notas.forEach(n => {
      if (n.idPlantillaEstructura != null) {
        notasMap.set(n.idPlantillaEstructura, {
          valorNota: n.valorNota,
          observacion: n.observacion || null
        });
      }
    });

    let totalActividades = 0;
    let actividadesCalificadas = 0;
    let sumaPonderadaGlobal = 0;
    let sumaPesosGlobal = 0;
    let hayNotasIngresadas = false;

    const grupos: GrupoDesglose[] = arbol.map(nodoRaiz => {
      const hojas = this.extraerHojas(nodoRaiz);
      let sumaPonderadaGrupo = 0;
      let sumaPesosGrupo = 0;
      let hayNotasGrupo = false;

      const actividades: ActividadDesglose[] = hojas.map(hoja => {
        totalActividades++;
        const notaInfo = notasMap.get(hoja.idPlantillaEstructura);
        const valorNota = notaInfo?.valorNota ?? null;
        const observacion = notaInfo?.observacion ?? null;

        if (valorNota !== null && valorNota !== undefined && valorNota >= 0) {
          actividadesCalificadas++;
          hayNotasGrupo = true;
          hayNotasIngresadas = true;
          sumaPonderadaGrupo += (valorNota * (hoja.peso || 0)) / 100;
        }
        sumaPesosGrupo += hoja.peso || 0;

        // Peso efectivo global
        const pesoEfectivo = this.calcularPesoEfectivoNodo(hoja, index);
        if (valorNota !== null && valorNota !== undefined && valorNota >= 0) {
          sumaPonderadaGlobal += (valorNota * pesoEfectivo) / 100;
        }
        sumaPesosGlobal += pesoEfectivo;

        return {
          idPlantillaEstructura: hoja.idPlantillaEstructura,
          nombre: hoja.nodoNombre,
          ruta: this.construirRutaNodo(hoja, index),
          pesoEnGrupo: hoja.peso,
          pesoEfectivo: Math.round(pesoEfectivo * 100) / 100,
          valorNota,
          observacion
        };
      });

      // Subtotal del grupo (en escala 0-10)
      let subtotal: number | null = null;
      let aporteFinal: number | null = null;

      if (hayNotasGrupo && sumaPesosGrupo > 0) {
        subtotal = Math.round(((sumaPonderadaGrupo / (sumaPesosGrupo / 100))) * 100) / 100;
        aporteFinal = Math.round(((subtotal * (nodoRaiz.peso || 0)) / 100) * 100) / 100;
      }

      return {
        idPlantillaEstructura: nodoRaiz.idPlantillaEstructura,
        nombre: nodoRaiz.nodoNombre,
        peso: nodoRaiz.peso,
        subtotal,
        aporteFinal,
        actividades
      };
    });

    let notaFinalCalculada: number | null = null;
    if (hayNotasIngresadas && sumaPesosGlobal > 0) {
      notaFinalCalculada = Math.round((sumaPonderadaGlobal / (sumaPesosGlobal / 100)) * 100) / 100;
    }

    // Si tiene remedial aprobado
    if (materia.examenRemedial !== null && materia.examenRemedial !== undefined && materia.examenRemedial >= 7) {
      notaFinalCalculada = 7.00;
    }

    this.desglosePorMateria[key] = {
      idDetalleMalla: key,
      tienePlantilla: true,
      grupos,
      notaFinalCalculada: notaFinalCalculada ?? materia.notaFinal,
      notaFinalOficial: materia.notaFinal,
      examenRemedial: materia.examenRemedial,
      estado: this.getEstadoMostrar(materia),
      totalActividades,
      actividadesCalificadas
    };
  }

  private procesarDesgloseSinPlantilla(
    key: number,
    notas: NotasAlumnoDTO[],
    materia: MateriaHistorialDTO
  ): void {
    const actividades: ActividadDesglose[] = notas.map(n => ({
      idPlantillaEstructura: n.idPlantillaEstructura || 0,
      nombre: n.nombreComponente || 'Calificación General',
      ruta: n.nombreComponente || 'Calificación General',
      pesoEnGrupo: n.pesoComponente || 100,
      pesoEfectivo: n.pesoComponente || 100,
      valorNota: n.valorNota,
      observacion: n.observacion || null
    }));

    const grupos: GrupoDesglose[] = actividades.length > 0 ? [{
      idPlantillaEstructura: 0,
      nombre: 'Evaluación General',
      peso: 100,
      subtotal: materia.notaFinal,
      aporteFinal: materia.notaFinal,
      actividades
    }] : [];

    this.desglosePorMateria[key] = {
      idDetalleMalla: key,
      tienePlantilla: false,
      grupos,
      notaFinalCalculada: materia.notaFinal,
      notaFinalOficial: materia.notaFinal,
      examenRemedial: materia.examenRemedial,
      estado: this.getEstadoMostrar(materia),
      totalActividades: actividades.length,
      actividadesCalificadas: actividades.filter(a => a.valorNota !== null && a.valorNota !== undefined).length
    };
  }

  private extraerHojas(nodo: PlantillaEstructuraDTO): PlantillaEstructuraDTO[] {
    const hojas: PlantillaEstructuraDTO[] = [];
    const recorrer = (n: PlantillaEstructuraDTO) => {
      if (!n.hijos || n.hijos.length === 0) hojas.push(n);
      else n.hijos.forEach(hijo => recorrer(hijo));
    };
    recorrer(nodo);
    return hojas;
  }

  private calcularPesoEfectivoNodo(nodo: PlantillaEstructuraDTO, index: Map<number, PlantillaEstructuraDTO>): number {
    let pesoEfectivo = Number(nodo.peso || 0);
    let parentId = nodo.idNodoPadre;
    while (parentId != null) {
      const parent = index.get(parentId);
      if (!parent) break;
      pesoEfectivo = (pesoEfectivo * Number(parent.peso || 0)) / 100;
      parentId = parent.idNodoPadre;
    }
    return pesoEfectivo;
  }

  private construirRutaNodo(nodo: PlantillaEstructuraDTO, index: Map<number, PlantillaEstructuraDTO>): string {
    const nombres: string[] = [nodo.nodoNombre];
    let parentId = nodo.idNodoPadre;
    while (parentId != null) {
      const parent = index.get(parentId);
      if (!parent) break;
      nombres.unshift(parent.nodoNombre);
      parentId = parent.idNodoPadre;
    }
    return nombres.join(' > ');
  }

  // ========== Computed ==========

  get ciclos(): CicloHistorialDTO[] {
    return this.mallaSeleccionada?.ciclos || [];
  }

  get allMaterias(): MateriaHistorialDTO[] {
    return this.ciclos.reduce<MateriaHistorialDTO[]>((acc, c) => acc.concat(c.materias), []);
  }

  get totalMaterias(): number {
    return this.allMaterias.length;
  }

  get materiasAprobadas(): number {
    return this.allMaterias.filter(m => this.getEstadoMostrar(m).toLowerCase() === 'aprobado').length;
  }

  get materiasEnCurso(): number {
    return this.allMaterias.filter(m => this.getEstadoMostrar(m).toLowerCase() === 'en curso').length;
  }

  get materiasReprobadas(): number {
    return this.allMaterias.filter(m => this.getEstadoMostrar(m).toLowerCase() === 'reprobado').length;
  }

  // ========== Helpers ==========

  formatNota(nota: number | null | undefined): string {
    if (nota === null || nota === undefined) return '--';
    return Number(nota).toFixed(2);
  }

  getNotaSeverity(nota: number | null | undefined): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    if (nota === null || nota === undefined) return 'secondary';
    const num = Number(nota);
    if (num >= 9) return 'success';
    if (num >= 7) return 'info';
    if (num >= 4.01) return 'warn';
    return 'danger';
  }

  getEstadoSeverity(estado: string | null | undefined): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (estado?.toLowerCase()) {
      case 'aprobado': return 'success';
      case 'reprobado': return 'danger';
      case 'recuperación':
      case 'recuperacion':
      case 'remedial': return 'warn';
      case 'en curso': return 'info';
      case 'pendiente': return 'secondary';
      default: return 'secondary';
    }
  }

  getNotaDescripcion(nota: number | null | undefined): string {
    if (nota === null || nota === undefined) return 'Sin calificar';
    const num = Number(nota);
    if (num >= 9) return 'Domina los aprendizajes';
    if (num >= 7) return 'Alcanza los aprendizajes';
    if (num >= 4.01) return 'Próximo a alcanzar';
    return 'No alcanza los aprendizajes';
  }

  getNotaClass(nota: number | null | undefined): string {
    if (nota === null || nota === undefined) return 'nota-sin';
    const num = Number(nota);
    if (num >= 9) return 'nota-domina';
    if (num >= 7) return 'nota-alcanza';
    if (num >= 4.01) return 'nota-proximo';
    return 'nota-no-alcanza';
  }

  /**
   * Determina el estado a mostrar en la UI para una materia.
   * Si no hay notaFinal ni examenRemedial, mostramos "En curso" aunque el campo estado diga "Reprobado".
   */
  getEstadoMostrar(materia: any): string {
    if (!materia) return 'En curso';
    const nf = materia.notaFinal;
    const rem = materia.examenRemedial;

    if ((nf === null || nf === undefined) && (rem === null || rem === undefined)) {
      return 'En curso';
    }

    if (materia.estado) return materia.estado;

    if (nf !== null && nf !== undefined) {
      return nf >= 7 ? 'Aprobado' : 'Reprobado';
    }

    return 'En curso';
  }
}
