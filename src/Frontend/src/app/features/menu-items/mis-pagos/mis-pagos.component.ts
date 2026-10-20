import { Component, ViewChild, inject, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { Table } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { ProgressBarModule } from 'primeng/progressbar';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CreditoService } from '../../../core/services/pagos/credito.service';
import { MatriculaService } from '../../../core/services/postulaciones/matricula.service';
import { AuthService, UserRole } from '../../../core/auth/auth.service';
import { DetalleCreditoDTO, MatriculaDTO } from '../../../data/models/Entities';

interface DetalleCredito {
  idDetalleCredito: number;
  valorCancelado: number;
  pagado: boolean;
  fechaPagoCredito: string | null;
}

interface Especie {
  idEspecie: number;
  nombre: string;
  tipo: 'matricula' | 'pension';
  ciclo: string;
  valor: number;
  valorPagado: number;
  pagado: boolean;
  fechaLimite: string;
  detallesCredito: DetalleCredito[];
  esPensionNoDiferida?: boolean;
}

interface PagoEstudiante {
  idMatricula: number;
  cedula: string;
  nombreEstudiante: string;
  modalidad: string;
  detalleCiclo: string;
  totalDeuda: number;
  totalPagado: number;
  especies: Especie[];
}

@Component({
  selector: 'app-mis-pagos',
  standalone: true,
  imports: [
    CommonModule, 
    TableModule, 
    ButtonModule, 
    CardModule, 
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    TooltipModule,
    TagModule,
    FormsModule,
    SelectModule,
    MultiSelectModule,
    ProgressBarModule,
    MessageModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './mis-pagos.component.html',
  styleUrls: ['./mis-pagos.component.css']
})
export class MisPagosComponent implements OnInit {
  @ViewChild('dt') dt!: Table;
  
  // Inyección de servicios
  private creditoService = inject(CreditoService);
  private matriculaService = inject(MatriculaService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  private setTableLoading(value: boolean): void {
    this.ngZone.run(() => {
      this.loading = value;
      this.cdr.detectChanges();
    });
  }

  private setDetalleLoading(value: boolean): void {
    this.ngZone.run(() => {
      this.loadingDetalle = value;
      this.cdr.detectChanges();
    });
  }

  searchValue: string = '';
  estudianteSeleccionado: PagoEstudiante | null = null;
  mostrarDetalle: boolean = false;
  loading: boolean = false;
  loadingDetalle: boolean = false;
  
  // Datos de matrículas del alumno
  pagos: PagoEstudiante[] = [];
  
  // Info del alumno logueado
  nombreAlumno: string = '';
  cedulaAlumno: string = '';
  
  // Caché de progresos ya cargados (evita repetir peticiones)
  private progresoCache = new Map<number, { totalDeuda: number; totalPagado: number }>();
  
  // Control de paginación
  private filaInicio: number = 0;
  private filasPorPagina: number = 10;
  
  // Datos del API
  detallesCreditoAPI: DetalleCreditoDTO[] = [];
  
  modalidades = [
    { label: 'Formal virtual', value: 'Formal virtual' },
    { label: 'Acelerado', value: 'Acelerado' }
  ];

  ngOnInit(): void {
    this.cargarMisMatriculas();
  }

  cargarMisMatriculas(): void {
    // Obtener el usuario actual
    const currentUser = this.authService.getCurrentUser();
    
    if (!currentUser) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo obtener la información del usuario'
      });
      return;
    }

    // Verificar que sea un alumno
    const esAlumno = currentUser.roles.some(r => r.nombre === UserRole.ALUMNO);
    if (!esAlumno) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Acceso restringido',
        detail: 'Esta sección es solo para alumnos'
      });
      return;
    }

    this.setTableLoading(true);
    
    // Usar el idPersona del usuario logueado para obtener sus matrículas
    const idPersona = currentUser.id;
    
    this.matriculaService.getMatriculasByAlumno(idPersona)
      .subscribe({
        next: (matriculas) => {
          // Mapear matrículas a PagoEstudiante (sin progreso aún)
          const pagosBase = matriculas.map(m => this.mapMatriculaToPagoEstudiante(m));
          
          // Guardar info del alumno
          if (matriculas.length > 0) {
            const m = matriculas[0];
            this.nombreAlumno = [m.primerNombre, m.segundoNombre, m.primerApellido, m.segundoApellido]
              .filter(Boolean).join(' ');
            this.cedulaAlumno = m.numeroDocumento || '';
          }
          
          this.ngZone.run(() => {
            this.pagos = pagosBase;
          });
          this.setTableLoading(false);
          
          // Cargar progreso solo de las filas visibles (primera página)
          this.cargarProgresoFilasVisibles();
        },
        error: (err) => {
          console.error('Error al cargar matrículas:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron cargar tus matrículas'
          });
          this.ngZone.run(() => {
            this.pagos = [];
          });
          this.setTableLoading(false);
        }
      });
  }

  /**
   * Evento cuando cambia la página o se aplica filtro
   * Solo carga el progreso de las filas visibles
   */
  onPageChange(event: any): void {
    this.filaInicio = event.first;
    this.filasPorPagina = event.rows;
    this.cargarProgresoFilasVisibles();
  }

  /**
   * Carga el progreso SOLO de las filas actualmente visibles
   * Usa caché para no repetir peticiones
   */
  private cargarProgresoFilasVisibles(): void {
    // Obtener las filas visibles según paginación actual
    const filasVisibles = this.pagos.slice(this.filaInicio, this.filaInicio + this.filasPorPagina);
    
    // Filtrar solo las que NO están en caché
    const filasSinProgreso = filasVisibles.filter(p => !this.progresoCache.has(p.idMatricula));
    
    if (filasSinProgreso.length === 0) {
      // Todas ya están en caché, solo actualizar desde caché
      this.actualizarDesdeCache(filasVisibles);
      return;
    }

    // Crear peticiones solo para las que faltan
    const requests = filasSinProgreso.map(pago =>
      this.creditoService.getDetallesCreditoByMatricula(pago.idMatricula).pipe(
        catchError(() => of([]))
      )
    );

    forkJoin(requests).subscribe({
      next: (resultados) => {
        resultados.forEach((detalles, index) => {
          const pago = filasSinProgreso[index];
          const detallesArr = detalles as DetalleCreditoDTO[];
          
          let totalDeuda = 0;
          let totalPagado = 0;
          
          if (detallesArr && detallesArr.length > 0) {
            totalDeuda = detallesArr.reduce((sum, d) => sum + (d.valor || 0), 0);
            totalPagado = detallesArr.reduce((sum, d) => sum + (d.valorCancelado || 0), 0);
          }
          
          // Guardar en caché
          this.progresoCache.set(pago.idMatricula, { totalDeuda, totalPagado });
        });
        
        // Actualizar todas las filas visibles desde caché
        this.actualizarDesdeCache(filasVisibles);
      },
      error: (err) => {
        console.error('Error al cargar progreso:', err);
      }
    });
  }

  /**
   * Actualiza los datos de las filas desde el caché
   */
  private actualizarDesdeCache(filas: PagoEstudiante[]): void {
    this.ngZone.run(() => {
      filas.forEach(pago => {
        const cached = this.progresoCache.get(pago.idMatricula);
        if (cached) {
          pago.totalDeuda = cached.totalDeuda;
          pago.totalPagado = cached.totalPagado;
        }
      });
      this.cdr.detectChanges();
    });
  }

  mapMatriculaToPagoEstudiante(matricula: MatriculaDTO): PagoEstudiante {
    const nombreCompleto = [
      matricula.primerNombre,
      matricula.segundoNombre,
      matricula.primerApellido,
      matricula.segundoApellido
    ].filter(Boolean).join(' ');

    return {
      idMatricula: matricula.idMatricula || 0,
      cedula: matricula.numeroDocumento || '',
      nombreEstudiante: nombreCompleto,
      modalidad: matricula.detalleTipoOferta || '',
      detalleCiclo: matricula.detalleCiclo || '',
      totalDeuda: 0,
      totalPagado: 0,
      especies: []
    };
  }

  getSeverity(totalDeuda: number, totalPagado: number): 'success' | 'info' | 'warn' | 'danger' {
    const porcentajePagado = (totalDeuda > 0) ? (totalPagado / totalDeuda) * 100 : 0;
    
    if (porcentajePagado === 100) return 'success';
    if (porcentajePagado >= 50) return 'info';
    if (porcentajePagado >= 25) return 'warn';
    return 'danger';
  }

  getEstadoLabel(totalDeuda: number, totalPagado: number): string {
    const pendiente = totalDeuda - totalPagado;
    if (pendiente === 0 && totalDeuda > 0) return 'Pagado';
    if (totalPagado === 0) return 'Pendiente';
    return 'Parcial';
  }

  getProgreso(totalDeuda: number, totalPagado: number): number {
    if (totalDeuda === 0) return 0;
    return Math.round((totalPagado / totalDeuda) * 100);
  }

  clearFilters(): void {
    this.dt.clear();
    this.searchValue = '';
  }

  onGlobalFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.dt.filterGlobal(value, 'contains');
  }

  verDetalle(pago: PagoEstudiante): void {
    this.setDetalleLoading(true);
    this.mostrarDetalle = true;
    
    // Obtener créditos completos para detectar pensiones no diferidas
    this.creditoService.getCreditosConDetallesByMatricula(pago.idMatricula)
      .subscribe({
        next: (creditos) => {
          console.log('Créditos completos:', creditos);
          
          // Buscar pensión sin cuotas
          const pensionSinCuotas = creditos.find(c => {
            const nombreEspecie = c.detalleEspecie?.toUpperCase() || '';
            const esPension = nombreEspecie.includes('PENSION') || nombreEspecie.includes('PENSIÓN');
            const sinDetalles = !c.detallesCredito || c.detallesCredito.length === 0;
            return esPension && sinDetalles;
          });

          // Llamar al servicio para obtener detalles de crédito
          this.creditoService.getDetallesCreditoByMatricula(pago.idMatricula)
            .subscribe({
              next: (detalles) => {
                console.log('Detalles de crédito desde API:', detalles);
                this.ngZone.run(() => {
                  this.detallesCreditoAPI = detalles;
                  
                  // Calcular totales desde el API
                  const totalDeuda = detalles.reduce((sum, d) => sum + (d.valor || 0), 0);
                  const totalPagado = detalles.reduce((sum, d) => sum + (d.valorCancelado || 0), 0);
                  
                  // Procesar especies: primer registro es matrícula, los demás son pensiones
                  const especies: Especie[] = detalles.map((detalle, index) => {
                    const esMatricula = index === 0;
                    const pendiente = (detalle.valor || 0) - (detalle.valorCancelado || 0);
                    const estaPagado = detalle.pagado || pendiente === 0;
                    
                    return {
                      idEspecie: detalle.idDetalleCredito || index + 1,
                      nombre: esMatricula ? 'Matrícula' : `Cuota ${index}`,
                      tipo: esMatricula ? 'matricula' : 'pension',
                      ciclo: pago.detalleCiclo || 'Sin ciclo',
                      valor: detalle.valor || 0,
                      valorPagado: detalle.valorCancelado || 0,
                      pagado: estaPagado,
                      fechaLimite: detalle.fechaLimite || 'Sin fecha',
                      detallesCredito: [{
                        idDetalleCredito: detalle.idDetalleCredito || 0,
                        valorCancelado: detalle.valorCancelado || 0,
                        pagado: detalle.pagado || false,
                        fechaPagoCredito: detalle.fechaPago || null
                      }],
                      esPensionNoDiferida: false
                    };
                  });

                  // Verificar si la matrícula está pagada
                  const matriculaPagada = especies.length > 0 && especies[0].tipo === 'matricula' && especies[0].pagado;

                  // Agregar card de pensión sin diferir si aplica
                  if (pensionSinCuotas && matriculaPagada) {
                    especies.push({
                      idEspecie: -1,
                      nombre: 'Pensión',
                      tipo: 'pension',
                      ciclo: pago.detalleCiclo || 'Sin ciclo',
                      valor: pensionSinCuotas.valorEspecie || 0,
                      valorPagado: 0,
                      pagado: false,
                      fechaLimite: 'Por definir',
                      detallesCredito: [],
                      esPensionNoDiferida: true
                    });
                  }
                  
                  // Actualizar estudiante seleccionado con datos del API
                  this.estudianteSeleccionado = {
                    ...pago,
                    totalDeuda: totalDeuda + (pensionSinCuotas?.valorEspecie || 0),
                    totalPagado: totalPagado,
                    especies: especies
                  };
                  
                  // Verificar cuotas vencidas
                  this.verificarCuotasVencidas(especies);
                });
                this.setDetalleLoading(false);
              },
              error: (err) => {
                console.error('Error al obtener detalles de crédito:', err);
                this.messageService.add({
                  severity: 'error',
                  summary: 'Error',
                  detail: 'No se pudieron cargar los detalles del crédito'
                });
                this.ngZone.run(() => {
                  this.estudianteSeleccionado = pago;
                });
                this.setDetalleLoading(false);
              }
            });
        },
        error: (err) => {
          console.error('Error al obtener créditos completos:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron cargar los créditos'
          });
          this.setDetalleLoading(false);
        }
      });
  }

  volverALista(): void {
    this.estudianteSeleccionado = null;
    this.mostrarDetalle = false;
  }

  getEspecieSeverity(especie: Especie): 'success' | 'warn' | 'danger' {
    if (especie.pagado) return 'success';
    const porcentaje = (especie.valorPagado / especie.valor) * 100;
    if (porcentaje > 0) return 'warn';
    return 'danger';
  }

  getEspecieEstado(especie: Especie): string {
    if (especie.pagado) return 'Pagado';
    if (especie.valorPagado > 0) return 'Parcial';
    return 'Pendiente';
  }

  /**
   * Verifica si hay cuotas vencidas y no pagadas, y muestra notificaciones toast
   */
  private verificarCuotasVencidas(especies: Especie[]): void {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const cuotasVencidas = especies.filter(especie => {
      if (especie.pagado) return false;
      if (!especie.fechaLimite || especie.fechaLimite === 'Sin fecha' || especie.fechaLimite === 'Por definir') return false;
      
      try {
        const fechaLimite = new Date(especie.fechaLimite);
        fechaLimite.setHours(0, 0, 0, 0);
        return fechaLimite < hoy;
      } catch {
        return false;
      }
    });

    if (cuotasVencidas.length > 0) {
      cuotasVencidas.forEach(cuota => {
        this.messageService.add({
          severity: 'warn',
          summary: '⚠️ Cuota Vencida',
          detail: `${cuota.nombre} - Fecha límite: ${this.formatearFecha(cuota.fechaLimite)} - Pendiente: $${(cuota.valor - cuota.valorPagado).toFixed(2)}`,
          life: 10000,
          sticky: true
        });
      });
    }
  }

  /**
   * Formatea una fecha a formato legible
   */
  private formatearFecha(fecha: string): string {
    try {
      const date = new Date(fecha);
      return date.toLocaleDateString('es-EC', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return fecha;
    }
  }
}