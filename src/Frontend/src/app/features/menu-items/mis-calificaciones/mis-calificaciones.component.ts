import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { Select } from 'primeng/select';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { AccordionModule } from 'primeng/accordion';
import { TreeModule } from 'primeng/tree';
import { ToastModule } from 'primeng/toast';
import { MessageService, TreeNode } from 'primeng/api';

// Services
import { AuthService } from '../../../core/auth/auth.service';
import { MatriculaService } from '../../../core/services/postulaciones/matricula.service';
import { NotasAlumnoService } from '../../../core/services/infrastructure/notas-alumno.service';
import { DetalleMallaService } from '../../../core/services/infrastructure/detalle-malla.service';

// Models
import {
  HistorialAcademicoDTO,
  MallaHistorialDTO,
  CicloHistorialDTO,
  MateriaHistorialDTO
} from '../../../data/models/matricula';
import { BoletinAlumnoDTO, BoletinMateriaDTO, NotaArbolDTO } from '../../../data/models/notas';
import { DetalleMallaDTO } from '../../../data/models/detalle-malla/detalle-malla.model';

@Component({
  selector: 'app-mis-calificaciones',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    Select,
    CardModule,
    ButtonModule,
    ProgressSpinnerModule,
    TagModule,
    AccordionModule,
    TreeModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './mis-calificaciones.component.html',
  styleUrls: ['./mis-calificaciones.component.css']
})
export class MisCalificacionesComponent implements OnInit {
  // Services
  private authService = inject(AuthService);
  private matriculaService = inject(MatriculaService);
  private notasService = inject(NotasAlumnoService);
  private detalleMallaService = inject(DetalleMallaService);
  private messageService = inject(MessageService);

  // User state
  idUsuarioActual = 0;
  nombreAlumno = '';

  // Data
  historial: HistorialAcademicoDTO | null = null;
  mallaSeleccionada: MallaHistorialDTO | null = null;
  cicloSeleccionado: CicloHistorialDTO | null = null;
  boletinActual: BoletinAlumnoDTO | null = null;
  materiaDetalle: BoletinMateriaDTO | null = null;
  detallesMalla: DetalleMallaDTO[] = [];
  notasTree: TreeNode[] = [];

  // UI state
  loading = false;
  loadingBoletin = false;
  error = '';
  vistaActual: 'historial' | 'detalle-materia' = 'historial';

  // Dropdown options
  mallasOptions: { label: string; value: MallaHistorialDTO }[] = [];
  ciclosOptions: { label: string; value: CicloHistorialDTO }[] = [];

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.idUsuarioActual = user.id;
      this.nombreAlumno = user.username;
      this.cargarHistorial();
    }
  }

  /**
   * Cargar historial academico del alumno
   */
  cargarHistorial(): void {
    this.loading = true;
    this.error = '';

    this.matriculaService.getHistorialCompleto(this.idUsuarioActual)
      .subscribe({
        next: (data) => {
          this.historial = data;
          this.loading = false;

          if (data && data.mallas.length > 0) {
            // Configurar opciones de dropdown
            this.mallasOptions = data.mallas.map(m => ({
              label: m.nombreMalla,
              value: m
            }));

            // Seleccionar primera malla por defecto
            this.seleccionarMalla(data.mallas[0]);
          } else {
            this.error = 'No tienes matriculas registradas en el sistema.';
          }
        },
        error: (err) => {
          this.error = 'Error al cargar tu historial academico. Por favor intenta nuevamente.';
          this.loading = false;
          console.error('Error cargando historial:', err);
        }
      });
  }

  /**
   * Seleccionar una malla
   */
  seleccionarMalla(malla: MallaHistorialDTO): void {
    this.mallaSeleccionada = malla;
    this.boletinActual = null;
    this.cicloSeleccionado = null;

    // Configurar opciones de ciclos
    this.ciclosOptions = malla.ciclos.map(c => ({
      label: c.nombreCiclo,
      value: c
    }));

    // Seleccionar ultimo ciclo por defecto
    if (malla.ciclos.length > 0) {
      this.seleccionarCiclo(malla.ciclos[malla.ciclos.length - 1]);
    }
  }

  /**
   * Seleccionar un ciclo
   */
  seleccionarCiclo(ciclo: CicloHistorialDTO): void {
    this.cicloSeleccionado = ciclo;
    this.boletinActual = null;
    this.detallesMalla = [];
    this.cargarBoletin(ciclo.idMatricula);
  }

  /**
   * Cargar boletin de una matricula
   */
  cargarBoletin(idMatricula: number): void {
    this.loadingBoletin = true;
    this.boletinActual = null;

    this.notasService.getBoletin(idMatricula)
      .subscribe({
        next: (boletin) => {
          this.boletinActual = boletin;
          this.loadingBoletin = false;
          
          // Cargar detalles malla para la matricula
          this.cargarDetallesMalla(idMatricula);
        },
        error: (err) => {
          console.error('Error cargando boletin:', err);
          this.loadingBoletin = false;
          this.messageService.add({
            severity: 'warn',
            summary: 'Aviso',
            detail: 'No se encontraron notas para este periodo'
          });
        }
      });
  }

  /**
   * Cargar detalles malla para la matricula
   */
  cargarDetallesMalla(idMatricula: number): void {
    // Primero obtener los detalles de la matricula para saber qué materias tiene
    this.matriculaService.getByIdConDetalle(idMatricula).subscribe({
      next: (matricula) => {
        if (!matricula || !matricula.materias || matricula.materias.length === 0) {
          this.detallesMalla = [];
          console.log('⚠️ No hay materias en la matricula');
          return;
        }
        
        console.log('🔍 Cargando detalles malla para matricula:', matricula);
        // Obtener IDs únicos de detalle malla
        const idsDetalleMalla = [...new Set(matricula.materias.map(m => m.idDetalleMalla))];
        
        // Cargar cada detalle malla
        this.detallesMalla = [];
        let loadedCount = 0;
        
        idsDetalleMalla.forEach(id => {
          this.detalleMallaService.getById(id).subscribe({
            next: (detalle) => {
              if (detalle) {
                this.detallesMalla.push(detalle);
              }
              loadedCount++;
              
              // Cuando se cargan todos, mostrar mensaje de éxito
              if (loadedCount === idsDetalleMalla.length) {
                console.log('✅ Todos los detalles malla cargados:', this.detallesMalla);
                this.messageService.add({
                  severity: 'success',
                  summary: 'Detalles cargados',
                  detail: `Se cargaron ${this.detallesMalla.length} detalles de malla`
                });
              }
            },
            error: (err) => {
              console.error(`Error cargando detalle malla ${id}:`, err);
              loadedCount++;
            }
          });
        });
      },
      error: (err) => {
        console.error('Error obteniendo detalles de matricula:', err);
        this.detallesMalla = [];
      }
    });
  }

  /**
   * Ver detalle de notas de una materia
   */
  verDetalleMateria(materia: BoletinMateriaDTO): void {
    this.materiaDetalle = materia;
    this.notasTree = this.convertirATreeNodes(materia.estructuraNotas);
    this.vistaActual = 'detalle-materia';
  }

  /**
   * Volver a vista de historial
   */
  volverAHistorial(): void {
    this.vistaActual = 'historial';
    this.materiaDetalle = null;
    this.notasTree = [];
  }

  /**
   * Convertir estructura de notas a TreeNode para PrimeNG
   */
  convertirATreeNodes(notas: NotaArbolDTO[]): TreeNode[] {
    return notas.map(nota => this.notaToTreeNode(nota));
  }

  private notaToTreeNode(nota: NotaArbolDTO): TreeNode {
    return {
      label: nota.nombreComponente,
      data: nota,
      expanded: true,
      children: nota.hijos ? nota.hijos.map(h => this.notaToTreeNode(h)) : [],
      type: nota.hijos && nota.hijos.length > 0 ? 'parent' : 'leaf'
    };
  }

  /**
   * Obtener color de la nota segun escala ecuatoriana
   */
  getColorNota(nota: number | null): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    if (nota === null) return 'secondary';
    if (nota >= 9) return 'success';
    if (nota >= 7) return 'info';
    if (nota >= 4.01) return 'warn';
    return 'danger';
  }

  /**
   * Obtener severidad del tag segun estado
   */
  getSeverityEstado(estado: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (estado?.toLowerCase()) {
      case 'aprobado': return 'success';
      case 'reprobado': return 'danger';
      case 'recuperacion': return 'warn';
      case 'en curso': return 'info';
      default: return 'secondary';
    }
  }

  /**
   * Formatear nota
   */
  formatearNota(nota: number | null): string {
    if (nota === null) return '--';
    return nota.toFixed(2);
  }

  /**
   * Obtener descripcion de la nota
   */
  getDescripcionNota(nota: number | null): string {
    if (nota === null) return 'Sin calificar';
    if (nota >= 9) return 'Domina los aprendizajes';
    if (nota >= 7) return 'Alcanza los aprendizajes';
    if (nota >= 4.01) return 'Proximo a alcanzar';
    return 'No alcanza los aprendizajes';
  }
}
