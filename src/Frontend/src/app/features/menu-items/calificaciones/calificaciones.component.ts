import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// PrimeNG
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';

// Services
import { AuthService } from '../../../core/auth/auth.service';
import { DistributivoService } from '../../../core/services/infrastructure/distributivo.service';
import { MatriculaService } from '../../../core/services/postulaciones/matricula.service';
import { NotasAlumnoService } from '../../../core/services/infrastructure/notas-alumno.service';
import { PlantillaEstructuraService } from '../../../core/services/infrastructure/plantilla-estructura.service';
import { DetalleMallaService } from '../../../core/services/infrastructure/detalle-malla.service';

// Models
import { AsignacionDocenteDTO, DistributivoDTO } from '../../../data/models/distributivo';
import { DetalleMallaDTO } from '../../../data/models/detalle-malla/detalle-malla.model';
import { AlumnoParaleloDTO } from '../../../data/models/matricula';
import {
  NotasAlumnoDTO,
  NotasAlumnoCreateDTO,
  NotasMasivasDTO,
  NotaAlumnoItemDTO
} from '../../../data/models/notas';
import { PlantillaEstructuraDTO } from '../../../data/models/notas/plantilla-estructura.model';

interface NotaAlumnoEditable {
  idDetalleMatricula: number;
  idMatricula: number;
  nombreAlumno: string;
  documentoAlumno: string;
  notas: { [idEstructura: number]: number | null };
  observaciones: { [idEstructura: number]: string };
  notaFinal?: number | null;
}

@Component({
  selector: 'app-calificaciones',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    InputNumberModule,
    ToastModule,
    CardModule,
    ProgressSpinnerModule,
    TagModule,
    TooltipModule
  ],
  providers: [MessageService],
  templateUrl: './calificaciones.component.html',
  styleUrls: ['./calificaciones.component.css']
})
export class CalificacionesComponent implements OnInit {
  // Services
  private authService = inject(AuthService);
  private distributivoService = inject(DistributivoService);
  private matriculaService = inject(MatriculaService);
  private notasService = inject(NotasAlumnoService);
  private estructuraService = inject(PlantillaEstructuraService);
  private detalleMallaService = inject(DetalleMallaService);
  private messageService = inject(MessageService);

  // User state
  esDocente = false;
  esAdmin = false;
  idUsuarioActual = 0;
  nombreUsuario = '';

  // Data
  asignaciones: AsignacionDocenteDTO[] = [];
  asignacionSeleccionada: any = null;
  alumnos: NotaAlumnoEditable[] = [];
  estructuraArbol: PlantillaEstructuraDTO[] = [];
  nodosHoja: PlantillaEstructuraDTO[] = [];

  // Admin data
  distributivos: DistributivoDTO[] = [];
  distributivosFiltrados: DistributivoDTO[] = [];

  // UI state
  loading = false;
  loadingNotas = false;
  guardando = false;
  error = '';
  vistaActual: 'seleccion' | 'ingreso-notas' | 'admin-resumen' = 'seleccion';

  // Filters for admin
  filtroMalla: number | null = null;
  filtroCiclo: number | null = null;

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.idUsuarioActual = user.id;
      this.nombreUsuario = user.username;
      this.esDocente = this.authService.hasRole('PROFESOR');
      this.esAdmin = this.authService.hasRole('ADMINISTRADOR');

      if (this.esDocente && !this.esAdmin) {
        this.cargarAsignacionesDocente();
      } else if (this.esAdmin) {
        this.cargarTodosDistributivos();
      }
    }
  }

  /**
   * Cargar asignaciones del docente actual
   */
  cargarAsignacionesDocente(): void {
    this.loading = true;
    this.error = '';
    this.distributivoService.getAsignacionesByDocente(this.idUsuarioActual)
      .subscribe({
        next: (data) => {
          this.asignaciones = data;
          this.loading = false;
          if (data.length === 0) {
            this.error = 'No tienes asignaciones de materias/paralelos activas.';
          }
        },
        error: (err) => {
          this.error = 'Error al cargar asignaciones. Por favor intenta nuevamente.';
          this.loading = false;
          console.error('Error cargando asignaciones:', err);
        }
      });
  }

  /**
   * Cargar todos los distributivos (para admin)
   */
  cargarTodosDistributivos(): void {
    this.loading = true;
    this.distributivoService.getAll()
      .subscribe({
        next: (data) => {
          this.distributivos = data;
          this.distributivosFiltrados = data;
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Error al cargar distributivos';
          this.loading = false;
          console.error(err);
        }
      });
  }

  /**
   * Seleccionar una asignacion para ingresar notas
   */
  seleccionarAsignacion(item: any): void {
    console.log('=== seleccionarAsignacion llamado ===');
    console.log('¿Es docente?', this.esDocente);
    console.log('¿Es admin?', this.esAdmin);
    console.log('Seleccionando asignación:', item);
    console.log('¿Tiene idPlantillaEvaluacion?', 'idPlantillaEvaluacion' in item);
    console.log('Valor idPlantillaEvaluacion:', item.idPlantillaEvaluacion);
    
    // Para administradores, siempre buscar información de plantilla desde DetalleMalla
    // ya que el endpoint getAll() puede no incluirla
    if (this.esAdmin) {
      console.log('🔵 Admin detectado, obteniendo DetalleMalla ID:', item.idDetalleMalla);
      this.loadingNotas = true;
      this.detalleMallaService.getById(item.idDetalleMalla)
        .subscribe({
          next: (detalleMalla) => {
            

            if (detalleMalla && detalleMalla.idPlantillaEvaluacion && detalleMalla.idPlantillaEvaluacion > 0) {
              const asignacionCompleta = {
                ...item,
                idPlantillaEvaluacion: detalleMalla.idPlantillaEvaluacion,
                nombrePlantilla: detalleMalla.nombrePlantilla || ''
              };

              this.asignacionSeleccionada = asignacionCompleta;
              this.vistaActual = 'ingreso-notas';
              this.cargarDatosParaNotas(asignacionCompleta);
            } else {
              // No hay plantilla configurada
              this.asignacionSeleccionada = {
                ...item,
                idPlantillaEvaluacion: 0,
                nombrePlantilla: ''
              };
              console.log('❌ asignacionSeleccionada SIN plantilla:', this.asignacionSeleccionada);
              this.vistaActual = 'ingreso-notas';
              this.loadingNotas = false;
            }
          },
          error: (err) => {
            console.error('🔴 ERROR en detalleMallaService.getById');
            console.error('🔴 Error completo:', err);
            console.error('🔴 Status:', err.status);
            console.error('🔴 URL:', err.url);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Error al cargar la información de la materia'
            });
            this.loadingNotas = false;
          }
        });
    } else {
      // Para docentes, verificar si ya tienen la información completa
      const tienePlantillaValida = item.idPlantillaEvaluacion !== undefined && item.idPlantillaEvaluacion > 0;
      console.log('¿Es docente con plantilla válida?', tienePlantillaValida);
      
      if (tienePlantillaValida) {
        console.log('✅ Docente con datos completos');
        this.asignacionSeleccionada = item;
        this.vistaActual = 'ingreso-notas';
        this.cargarDatosParaNotas(item);
      } else {
        console.log('⚠️ Docente sin datos completos, fallback a DetalleMalla');
        // Fallback por si acaso
        this.loadingNotas = true;
        this.detalleMallaService.getById(item.idDetalleMalla)
          .subscribe({
            next: (detalleMalla) => {
              if (detalleMalla && detalleMalla.idPlantillaEvaluacion && detalleMalla.idPlantillaEvaluacion > 0) {
                const asignacionCompleta = {
                  ...item,
                  idPlantillaEvaluacion: detalleMalla.idPlantillaEvaluacion,
                  nombrePlantilla: detalleMalla.nombrePlantilla || ''
                };
                this.asignacionSeleccionada = asignacionCompleta;
                this.vistaActual = 'ingreso-notas';
                this.cargarDatosParaNotas(asignacionCompleta);
              } else {
                this.asignacionSeleccionada = {
                  ...item,
                  idPlantillaEvaluacion: 0,
                  nombrePlantilla: ''
                };
                this.vistaActual = 'ingreso-notas';
                this.loadingNotas = false;
              }
            },
            error: (err) => {
              console.error('Error obteniendo detalle malla para docente:', err);
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Error al cargar la información de la materia'
              });
              this.loadingNotas = false;
            }
          });
      }
    }
  }
  cargarDatosParaNotas(asignacion: any): void {
    this.loadingNotas = true;
    this.alumnos = [];
    this.nodosHoja = [];

    // Cargar estructura de la plantilla
    if (asignacion.idPlantillaEvaluacion > 0) {
      this.estructuraService.getArbol(asignacion.idPlantillaEvaluacion)
        .subscribe({
          next: (arbol) => {
            console.log('=== Estructura de plantilla cargada ===');
            console.log('Árbol completo:', arbol);
            this.estructuraArbol = arbol;
            this.nodosHoja = this.extraerNodosHojaFromArray(arbol);
            console.log('Nodos hoja extraídos:', this.nodosHoja);
            console.log('=== Fin estructura ===');
            this.cargarAlumnosYNotas(asignacion.idParalelo, asignacion.idDetalleMalla);
          },
          error: (err) => {
            console.error('Error cargando estructura:', err);
            this.cargarAlumnosYNotas(asignacion.idParalelo, asignacion.idDetalleMalla);
          }
        });
    } else {
      this.cargarAlumnosYNotas(asignacion.idParalelo, asignacion.idDetalleMalla);
    }
  }

  /**
   * Extraer nodos hoja de un array de estructuras (donde se ingresan notas)
   */
  extraerNodosHojaFromArray(nodos: PlantillaEstructuraDTO[]): PlantillaEstructuraDTO[] {
    const hojas: PlantillaEstructuraDTO[] = [];

    const recorrer = (n: PlantillaEstructuraDTO) => {
      if (!n.hijos || n.hijos.length === 0) {
        hojas.push(n);
      } else {
        n.hijos.forEach(hijo => recorrer(hijo));
      }
    };

    nodos.forEach(nodo => recorrer(nodo));

    return hojas;
  }

  /**
   * Cargar alumnos del paralelo para una materia específica y sus notas
   */
  cargarAlumnosYNotas(idParalelo: number, idDetalleMalla: number): void {
    this.matriculaService.getDetallesMatriculaByParaleloYMateria(idParalelo, idDetalleMalla)
      .subscribe({
        next: (detallesMatricula) => {
          this.alumnos = detallesMatricula.map(dm => ({
            idDetalleMatricula: dm.idDetalleMatricula,
            idMatricula: dm.idMatricula,
            nombreAlumno: dm.nombreAlumno,
            documentoAlumno: dm.documentoAlumno,
            notas: {},
            observaciones: {},
            notaFinal: null
          }));

          // Cargar notas existentes para cada alumno
          this.alumnos.forEach(alumno => {
            this.notasService.getByDetalleMatricula(alumno.idDetalleMatricula)
              .subscribe({
                next: (response: any) => {
                  // Handle potential response wrappers (APIResponse<T>)
                  const notasList = Array.isArray(response) ? response : (response.data || []);
                  
                  if (!Array.isArray(notasList)) {
                    // Si retorna un objeto vacío o nulo, solo loguear si es un error real
                    // console.warn('Formato de respuesta inesperado:', response);
                    return;
                  }

                  notasList.forEach((nota: any) => {
                    // Cast to any to handle potential capitalization mismatches from backend
                    const n = nota;
                    const idEstructura = n.idPlantillaEstructura || n.IdPlantillaEstructura;
                    
                    // Check for value (careful with 0 being falsy)
                    const valor = n.valorNota !== undefined && n.valorNota !== null 
                      ? n.valorNota 
                      : (n.ValorNota !== undefined && n.ValorNota !== null ? n.ValorNota : null);
                    
                    const obs = n.observacion || n.Observacion;

                    if (idEstructura) {
                      alumno.notas[idEstructura] = valor;
                      if (obs) {
                        alumno.observaciones[idEstructura] = obs;
                      }
                    }
                  });

                  // Calcular nota final después de cargar todas las notas del alumno
                  console.log('Calculando nota final para alumno después de cargar notas:', alumno.nombreAlumno);
                  this.calcularNotaFinal(alumno);
                },
                error: (err) => console.error('Error cargando notas:', err)
              });
          });

          this.loadingNotas = false;
        },
        error: (err) => {
          console.error('Error cargando alumnos:', err);
          this.loadingNotas = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron cargar los alumnos del paralelo'
          });
        }
      });
  }

  /**
   * Calcular la nota final de un alumno basada en los pesos de los componentes
   */
  calcularNotaFinal(alumno: NotaAlumnoEditable): void {
    console.log('🔄 calcularNotaFinal llamado para:', alumno.nombreAlumno);
    console.log('Nodos hoja:', this.nodosHoja);
    console.log('Nodos hoja con pesos:', this.nodosHoja.map(n => ({id: n.idPlantillaEstructura, nombre: n.nodoNombre, peso: n.peso})));
    console.log('Notas del alumno:', alumno.notas);
    
    if (!this.nodosHoja || this.nodosHoja.length === 0) {
      console.log('No hay nodos hoja, nota final = null');
      alumno.notaFinal = null;
      return;
    }

    // Calcular suma total de pesos de todos los componentes existentes
    const sumaTotalPesos = this.nodosHoja.reduce((total, nodo) => total + nodo.peso, 0);
    console.log('Suma total de pesos de todos los componentes:', sumaTotalPesos);
    
    let sumaPonderada = 0;
    
    // Calcular contribución solo de componentes que tienen nota
    this.nodosHoja.forEach(nodo => {
      const nota = alumno.notas[nodo.idPlantillaEstructura];
      console.log(`Componente ${nodo.nodoNombre} (ID: ${nodo.idPlantillaEstructura}, Peso: ${nodo.peso}%): nota = ${nota}`);
      
      if (nota !== null && nota !== undefined && nota >= 0) {
        const contribucion = (nota * nodo.peso) / 100;
        sumaPonderada += contribucion;
        console.log(`  Contribución: ${nota} * ${nodo.peso}/100 = ${contribucion}`);
      } else {
        console.log(`  Sin nota para este componente`);
      }
    });

    console.log(`Suma ponderada: ${sumaPonderada}, Suma total pesos: ${sumaTotalPesos}`);

    // Si no hay pesos o no hay contribuciones, nota final es null
    if (sumaTotalPesos === 0) {
      console.log('No hay componentes, nota final = null');
      alumno.notaFinal = null;
    } else if (sumaPonderada === 0) {
      console.log('No hay notas válidas, nota final = null');
      alumno.notaFinal = null;
    } else {
      // Calcular promedio ponderado
      const notaFinalCalculada = sumaPonderada / (sumaTotalPesos / 100);
      alumno.notaFinal = Math.round(notaFinalCalculada * 100) / 100;
      console.log(`Nota final calculada: ${sumaPonderada} / (${sumaTotalPesos}/100) = ${notaFinalCalculada} -> ${alumno.notaFinal}`);
    }
    console.log('=== Fin cálculo nota final ===');
  }



  /**
   * Guardar notas de un nodo especifico para todos los alumnos
   */
  guardarNotasNodo(idPlantillaEstructura: number): void {
    this.guardando = true;

    const notasParaGuardar: NotaAlumnoItemDTO[] = this.alumnos
      .filter(a => a.notas[idPlantillaEstructura] !== null && a.notas[idPlantillaEstructura] !== undefined)
      .map(a => ({
        idDetalleMatricula: a.idDetalleMatricula,
        valorNota: a.notas[idPlantillaEstructura]!,
        observacion: a.observaciones[idPlantillaEstructura] || null
      }));

    if (notasParaGuardar.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Aviso',
        detail: 'No hay notas para guardar'
      });
      this.guardando = false;
      return;
    }

    const data: NotasMasivasDTO = {
      idPlantillaEstructura,
      notas: notasParaGuardar
    };

    this.notasService.createMasivo(data)
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Exito',
            detail: `${notasParaGuardar.length} notas guardadas correctamente`
          });
          
          // Recalcular notas finales para todos los alumnos después de guardar
          this.alumnos.forEach(alumno => this.calcularNotaFinal(alumno));
          
          this.guardando = false;
        },
        error: (err) => {
          console.error('Error guardando notas:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron guardar las notas'
          });
          this.guardando = false;
        }
      });
  }

  /**
   * Guardar todas las notas de todos los nodos
   */
  guardarTodasLasNotas(): void {
    this.nodosHoja.forEach(nodo => {
      this.guardarNotasNodo(nodo.idPlantillaEstructura);
    });
  }

  /**
   * Volver a la vista de seleccion
   */
  volverASeleccion(): void {
    this.vistaActual = 'seleccion';
    this.asignacionSeleccionada = null;
    this.alumnos = [];
    this.estructuraArbol = [];
    this.nodosHoja = [];
  }

  /**
   * Validar nota (0-10)
   */
  validarNota(valor: number | null): boolean {
    if (valor === null) return true;
    return valor >= 0 && valor <= 10;
  }

  /**
   * Obtener color de la nota segun escala ecuatoriana
   */
  getColorNota(nota: number | null): string {
    if (nota === null) return 'secondary';
    if (nota >= 9) return 'success';
    if (nota >= 7) return 'info';
    if (nota >= 4.01) return 'warning';
    return 'danger';
  }

  /**
   * Obtener estado de la nota
   */
  getEstadoNota(nota: number | null): string {
    if (nota === null) return 'Sin nota';
    if (nota >= 9) return 'Domina';
    if (nota >= 7) return 'Alcanza';
    if (nota >= 4.01) return 'Proximo';
    return 'No alcanza';
  }
}
