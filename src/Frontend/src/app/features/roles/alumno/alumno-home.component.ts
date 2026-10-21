import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin, catchError, of } from 'rxjs';
import { AuthService, User } from '../../../core/auth/index';
import { PersonaService } from '../../../core/services/postulaciones/persona.service';
import { MatriculaService } from '../../../core/services/postulaciones/matricula.service';
import { CreditoService } from '../../../core/services/pagos/credito.service';
import {
  HistorialAcademicoDTO,
  MallaHistorialDTO,
  CicloHistorialDTO,
  MateriaHistorialDTO
} from '../../../data/models/matricula';

export interface ProximoPagoInfo {
  concepto: string;
  monto: number;
  fechaLimite: Date | null;
  diasRestantes: number | null;
  estaVencida: boolean;
}

export interface AvisoInstitucional {
  id: number;
  tag: string;
  tagClass: 'badge-blue' | 'badge-amber' | 'badge-green' | 'badge-purple';
  titulo: string;
  descripcion: string;
  fecha: string;
}

@Component({
  selector: 'app-alumno-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './alumno-home.component.html',
  styleUrls: ['./alumno-home.component.css']
})
export class AlumnoHomeComponent implements OnInit {
  user: User | null = null;
  userName: string = '';
  loading = true;

  private authService = inject(AuthService);
  private personaService = inject(PersonaService);
  private matriculaService = inject(MatriculaService);
  private creditoService = inject(CreditoService);

  // Contexto Académico
  carreraActual: string = '';
  periodoActual: string = '';
  cicloActual: string = '';
  paraleloActual: string = '';
  estadoMatricula: string = 'Activo';

  // Datos Académicos
  materiasEnCurso: MateriaHistorialDTO[] = [];
  promedioCiclo: number | null = null;
  totalMateriasAprobadas: number = 0;
  totalMateriasMalla: number = 0;
  porcentajeAvanceMalla: number = 0;

  // KPIs
  kpis = {
    matriculasActivas: 0,
    cuotasPendientes: 0,
    cuotasVencidas: 0,
    totalDeuda: 0,
    totalMateriasEnCurso: 0
  };

  // Próximo Pago Destacado
  proximoPago: ProximoPagoInfo | null = null;

  // Avisos y Comunicados (Configurables y escalables)
  avisos: AvisoInstitucional[] = [
    {
      id: 1,
      tag: 'Académico',
      tagClass: 'badge-blue',
      titulo: 'Periodo Lectivo en Curso',
      descripcion: 'Recuerda revisar semanalmente el material y tareas asignadas por tus docentes en cada materia.',
      fecha: 'Activo'
    },
    {
      id: 2,
      tag: 'Calificaciones',
      tagClass: 'badge-amber',
      titulo: 'Registro Continuo de Notas',
      descripcion: 'Consulta tus aportes parciales y retroalimentación docente en el módulo de calificaciones.',
      fecha: 'Permanente'
    },
    {
      id: 3,
      tag: 'Atención',
      tagClass: 'badge-green',
      titulo: 'Soporte y Secretaría en Línea',
      descripcion: '¿Tienes dudas sobre certificados o pagos? Nuestro equipo de atención estudiantil está disponible.',
      fecha: 'Lun - Vie'
    }
  ];

  // Enlace WhatsApp soporte
  readonly whatsappSupportUrl = 'https://wa.me/593961181942?text=Hola%2C%20necesito%20asistencia%20estudiantil%20en%20AMMI%20Online';

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
      if (user) {
        this.loadUserName();
        this.loadDashboardData();
      }
    });
  }

  private loadUserName(): void {
    if (this.user?.id) {
      this.personaService.getPersonaByIdPersona(this.user.id).subscribe({
        next: (persona: any) => {
          if (persona && persona.length > 0) {
            const p = persona[0];
            this.userName = `${p.primerNombre || ''} ${p.primerApellido || ''}`.trim();
          } else {
            this.userName = this.user?.username || 'Estudiante';
          }
        },
        error: () => {
          this.userName = this.user?.username || 'Estudiante';
        }
      });
    } else {
      this.userName = this.user?.username || 'Estudiante';
    }
  }

  private loadDashboardData(): void {
    if (!this.user) return;
    this.loading = true;

    // Ejecutamos en paralelo la carga de matrículas, historial académico completo y estado de cuenta
    const matriculas$ = this.matriculaService.getMatriculasByAlumno(this.user.id).pipe(
      catchError(() => of([]))
    );
    const historial$ = this.matriculaService.getHistorialCompleto(this.user.id).pipe(
      catchError(() => of(null as HistorialAcademicoDTO | null))
    );

    forkJoin({
      matriculas: matriculas$,
      historial: historial$
    }).subscribe({
      next: ({ matriculas, historial }) => {
        const activas = matriculas.filter(m => !m.esFinalizada);
        this.kpis.matriculasActivas = activas.length > 0 ? activas.length : matriculas.length;
        this.estadoMatricula = activas.length > 0 ? 'Matriculado Activo' : (matriculas.length > 0 ? 'Finalizado' : 'Sin Matrícula');

        // Procesar Historial Académico
        this.procesarHistorialAcademico(historial, activas.length > 0 ? activas[0] : matriculas[0]);

        // Si no hay matrículas, finalizamos loading
        if (matriculas.length === 0) {
          this.loading = false;
          return;
        }

        // Cargar cuotas/créditos de las matrículas
        const matriculasConsultar = activas.length > 0 ? activas : matriculas;
        const creditoRequests = matriculasConsultar.map(m =>
          this.creditoService.getDetallesCreditoByMatricula(m.idMatricula!).pipe(
            catchError(() => of([]))
          )
        );

        forkJoin(creditoRequests).subscribe({
          next: (resultados) => {
            this.procesarEstadoFinanciero(resultados);
            this.loading = false;
          },
          error: () => {
            this.loading = false;
          }
        });
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  private procesarHistorialAcademico(historial: HistorialAcademicoDTO | null, matriculaActiva: any): void {
    if (!historial || !historial.mallas || historial.mallas.length === 0) {
      this.carreraActual = 'Educación Online';
      this.cicloActual = 'Nivel Actual';
      return;
    }

    const mallaPrincipal = historial.mallas[0];
    this.carreraActual = mallaPrincipal.nombreMalla || mallaPrincipal.tipoOferta || 'Bachillerato Acelerado';

    // Calcular avance de toda la malla
    let totalMaterias = 0;
    let aprobadas = 0;
    let todasLasMaterias: MateriaHistorialDTO[] = [];

    mallaPrincipal.ciclos.forEach(ciclo => {
      if (ciclo.materias) {
        ciclo.materias.forEach(m => {
          totalMaterias++;
          todasLasMaterias.push(m);
          if (m.estado === 'Aprobado' || (m.notaFinal !== null && m.notaFinal >= 7)) {
            aprobadas++;
          }
        });
      }
    });

    this.totalMateriasMalla = totalMaterias;
    this.totalMateriasAprobadas = aprobadas;
    this.porcentajeAvanceMalla = totalMaterias > 0 ? Math.round((aprobadas / totalMaterias) * 100) : 0;

    // Buscar el ciclo activo correspondiente a la matrícula
    let cicloActivo: CicloHistorialDTO | undefined;
    if (matriculaActiva?.idMatricula) {
      cicloActivo = mallaPrincipal.ciclos.find(c => c.idMatricula === matriculaActiva.idMatricula);
    }

    // Si no coincide por ID de matrícula, tomar el último ciclo con materias o el primero
    if (!cicloActivo) {
      cicloActivo = mallaPrincipal.ciclos[mallaPrincipal.ciclos.length - 1] || mallaPrincipal.ciclos[0];
    }

    if (cicloActivo) {
      this.cicloActual = cicloActivo.nombreCiclo || 'Ciclo Actual';
      this.paraleloActual = cicloActivo.nombreParalelo ? `Paralelo "${cicloActivo.nombreParalelo}"` : '';
      this.materiasEnCurso = cicloActivo.materias || [];
      this.kpis.totalMateriasEnCurso = this.materiasEnCurso.length;

      // Calcular promedio del ciclo actual
      if (cicloActivo.promedioGeneral !== undefined && cicloActivo.promedioGeneral !== null && cicloActivo.promedioGeneral > 0) {
        this.promedioCiclo = cicloActivo.promedioGeneral;
      } else {
        const materiasConNota = this.materiasEnCurso.filter(m => m.notaFinal !== null && m.notaFinal !== undefined && m.notaFinal > 0);
        if (materiasConNota.length > 0) {
          const suma = materiasConNota.reduce((acc, m) => acc + (m.notaFinal || 0), 0);
          this.promedioCiclo = Number((suma / materiasConNota.length).toFixed(2));
        } else {
          this.promedioCiclo = null;
        }
      }
    }
  }

  private procesarEstadoFinanciero(resultados: any[][]): void {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    let pendientes = 0;
    let vencidas = 0;
    let totalDeuda = 0;
    let proximaCuota: any = null;
    let menorFechaLimite: Date | null = null;

    resultados.forEach(detalles => {
      detalles.forEach((d: any) => {
        if (!d.pagado) {
          const valorPendiente = (d.valor || 0) - (d.valorCancelado || 0);
          if (valorPendiente > 0) {
            totalDeuda += valorPendiente;
            pendientes++;

            if (d.fechaLimite) {
              try {
                const fecha = new Date(d.fechaLimite);
                fecha.setHours(0, 0, 0, 0);

                if (fecha < hoy) {
                  vencidas++;
                }

                // Determinar la cuota más próxima a vencer o la primera vencida
                if (!menorFechaLimite || fecha < menorFechaLimite) {
                  menorFechaLimite = fecha;
                  proximaCuota = {
                    concepto: d.nombreRubro || d.concepto || `Cuota #${d.numeroCuota || pendientes}`,
                    monto: valorPendiente,
                    fechaLimite: fecha,
                    estaVencida: fecha < hoy
                  };
                }
              } catch {
                /* Formato de fecha no estándar */
              }
            }
          }
        }
      });
    });

    this.kpis.cuotasPendientes = pendientes;
    this.kpis.cuotasVencidas = vencidas;
    this.kpis.totalDeuda = totalDeuda;

    if (proximaCuota) {
      let diasRestantes: number | null = null;
      if (proximaCuota.fechaLimite) {
        const diffTime = proximaCuota.fechaLimite.getTime() - hoy.getTime();
        diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      this.proximoPago = {
        concepto: proximaCuota.concepto,
        monto: proximaCuota.monto,
        fechaLimite: proximaCuota.fechaLimite,
        diasRestantes: diasRestantes,
        estaVencida: proximaCuota.estaVencida
      };
    } else {
      this.proximoPago = null;
    }
  }

  getNotaBadgeClass(nota: number | null | undefined): string {
    if (nota === null || nota === undefined) return 'badge-neutral';
    if (nota >= 7) return 'badge-success';
    if (nota >= 5) return 'badge-warning';
    return 'badge-danger';
  }

  getIniciales(nombre: string | null | undefined): string {
    if (!nombre) return 'DOC';
    return nombre
      .split(' ')
      .filter(p => p.length > 0)
      .slice(0, 2)
      .map(p => p[0].toUpperCase())
      .join('');
  }
}
