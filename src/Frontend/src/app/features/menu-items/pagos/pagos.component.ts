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
import { DatePickerModule } from 'primeng/datepicker';
import { MultiSelectModule } from 'primeng/multiselect';
import { ProgressBarModule } from 'primeng/progressbar';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CreditoService } from '../../../core/services/pagos/credito.service';
import { PagoService } from '../../../core/services/pagos/pago.service';
import { MatriculaService } from '../../../core/services/postulaciones/matricula.service';
import { DetalleCreditoDTO, TipoPagoDTO, MatriculaDTO } from '../../../data/models/Entities';

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
  selector: 'app-pagos',
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
    DatePickerModule,
    MultiSelectModule,
    ProgressBarModule,
    DialogModule,
    InputNumberModule,
    MessageModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './pagos.component.html',
  styleUrls: ['./pagos.component.css']
})
export class PagosComponent implements OnInit {
  @ViewChild('dt') dt!: Table;
  
  // Inyección de servicios
  private creditoService = inject(CreditoService);
  private pagoService = inject(PagoService);
  private matriculaService = inject(MatriculaService);
  private messageService = inject(MessageService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  private setTableLoading(value: boolean): void {
    this.ngZone.run(() => {
      this.loading = value;
      this.cdr.detectChanges();
    });
  }

  private setTiposLoading(value: boolean): void {
    this.ngZone.run(() => {
      this.loadingTiposPago = value;
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
  
  // Datos de matrículas
  pagos: PagoEstudiante[] = [];
  
  // Caché de progresos ya cargados (evita repetir peticiones)
  private progresoCache = new Map<number, { totalDeuda: number; totalPagado: number }>();
  
  // Control de paginación
  private filaInicio: number = 0;
  private filasPorPagina: number = 10;
  
  // Datos del API
  detallesCreditoAPI: DetalleCreditoDTO[] = [];
  
  // Modal de pago
  mostrarModalPago: boolean = false;
  especieSeleccionada: Especie | null = null;
  montoPago: number = 0;
  tipoPagoSeleccionado: number | null = null;
  
  // Tipos de pago desde el API
  tiposPago: TipoPagoDTO[] = [];
  loadingTiposPago: boolean = false;
  
  // Modal de diferir pensión
  mostrarModalDiferir: boolean = false;
  creditoPensionPorDiferir: any = null;
  numeroCuotasDiferir: number = 1;
  
  modalidades = [
    { label: 'Formal virtual', value: 'Formal virtual' },
    { label: 'Acelerado', value: 'Acelerado' }
  ];

  estados = [
    { label: 'Pagado', value: 'Pagado' },
    { label: 'Parcial', value: 'Parcial' },
    { label: 'Pendiente', value: 'Pendiente' }
  ];

  ngOnInit(): void {
    this.cargarTiposPago();
    this.cargarMatriculas();
  }

  cargarTiposPago(): void {
    this.setTiposLoading(true);
    this.pagoService.getTiposPago()
      .subscribe({
        next: (tipos) => {
          this.ngZone.run(() => {
            this.tiposPago = tipos;
          });
          this.setTiposLoading(false);
        },
        error: (err) => {
          console.error('Error al cargar tipos de pago:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron cargar los tipos de pago'
          });
          this.setTiposLoading(false);
        }
      });
  }

  cargarMatriculas(): void {
    this.setTableLoading(true);
    this.matriculaService.getAllMatriculas()
      .subscribe({
        next: (matriculas) => {
          // Mapear matrículas a PagoEstudiante (sin progreso aún)
          const pagosBase = matriculas.map(m => this.mapMatriculaToPagoEstudiante(m));
          
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
            detail: 'No se pudieron cargar las matrículas'
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
    const pendiente = totalDeuda - totalPagado;
    const porcentajePagado = (totalDeuda > 0) ? (totalPagado / totalDeuda) * 100 : 0;
    
    if (porcentajePagado === 100) return 'success';
    if (porcentajePagado >= 50) return 'info';
    if (porcentajePagado >= 25) return 'warn';
    return 'danger';
  }

  getEstadoLabel(totalDeuda: number, totalPagado: number): string {
    const pendiente = totalDeuda - totalPagado;
    if (pendiente === 0) return 'Pagado';
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
          
          // Buscar pensión que necesita diferirse (sin detalles de crédito creados)
          // Una pensión necesita diferirse si:
          // 1. Es de tipo PENSION
          // 2. No tiene detalles de crédito (cuotas) creados aún
          const pensionSinCuotas = creditos.find(c => {
            const nombreEspecie = c.detalleEspecie?.toUpperCase() || '';
            const esPension = nombreEspecie.includes('PENSION') || nombreEspecie.includes('PENSIÓN');
            // Sin detalles si el array está vacío o no existe
            const sinDetalles = !c.detallesCredito || c.detallesCredito.length === 0;
            console.log(`Crédito ${c.idCredito}: especie=${c.detalleEspecie}, esPension=${esPension}, diferido=${c.diferido}, sinDetalles=${sinDetalles}, detallesLength=${c.detallesCredito?.length}`);
            return esPension && sinDetalles;
          });
          
          console.log('Pensión sin cuotas encontrada:', pensionSinCuotas);

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

                  // Verificar si la matrícula está pagada (primer registro)
                  const matriculaPagada = especies.length > 0 && especies[0].tipo === 'matricula' && especies[0].pagado;

                  // Solo agregar card de pensión para diferir si la matrícula está pagada
                  if (pensionSinCuotas && matriculaPagada) {
                    especies.push({
                      idEspecie: -1, // ID especial para identificarla
                      nombre: 'Pensión',
                      tipo: 'pension',
                      ciclo: pago.detalleCiclo || 'Sin ciclo',
                      valor: pensionSinCuotas.valorEspecie || 0,
                      valorPagado: 0,
                      pagado: false,
                      fechaLimite: 'Por definir al diferir',
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
                  
                  // Verificar cuotas vencidas y mostrar notificaciones
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
            detail: 'No se pudieron cargar los créditos del estudiante'
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
    hoy.setHours(0, 0, 0, 0); // Normalizar a inicio del día
    
    const cuotasVencidas = especies.filter(especie => {
      // Solo verificar cuotas no pagadas completamente
      if (especie.pagado) return false;
      
      // Ignorar las que no tienen fecha válida
      if (!especie.fechaLimite || especie.fechaLimite === 'Sin fecha' || especie.fechaLimite === 'Por definir al diferir') {
        return false;
      }
      
      // Parsear la fecha límite
      const fechaLimite = new Date(especie.fechaLimite);
      if (isNaN(fechaLimite.getTime())) return false;
      
      fechaLimite.setHours(0, 0, 0, 0); // Normalizar a inicio del día
      
      // Verificar si la fecha ya pasó
      return fechaLimite < hoy;
    });

    // Mostrar notificaciones para cada cuota vencida
    if (cuotasVencidas.length > 0) {
      // Pequeño delay para que las notificaciones aparezcan después de cargar la vista
      setTimeout(() => {
        cuotasVencidas.forEach((cuota, index) => {
          // Delay escalonado para que las notificaciones no se apilen todas juntas
          setTimeout(() => {
            const pendiente = cuota.valor - cuota.valorPagado;
            this.messageService.add({
              severity: 'warn',
              summary: 'Pago Vencido',
              detail: `${cuota.nombre} venció el ${this.formatearFecha(cuota.fechaLimite)}. Pendiente: $${pendiente.toFixed(2)}`,
              life: 8000,
              sticky: false
            });
          }, index * 300); // 300ms de delay entre cada notificación
        });
      }, 500);
    }
  }

  /**
   * Formatea una fecha a formato legible
   */
  private formatearFecha(fecha: string): string {
    try {
      const date = new Date(fecha);
      if (isNaN(date.getTime())) return fecha;
      
      return date.toLocaleDateString('es-EC', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return fecha;
    }
  }

  pagarEspecie(especie: Especie): void {
    this.especieSeleccionada = especie;
    this.montoPago = especie.valor - especie.valorPagado; // Valor pendiente por defecto
    this.tipoPagoSeleccionado = null;
    this.mostrarModalPago = true;
    
    // Mostrar mensaje informativo
    this.messageService.add({
      severity: 'info',
      summary: 'Realizar Pago',
      detail: `Seleccione el tipo de pago y el monto para ${especie.nombre}`,
      life: 3000
    });
  }

  cerrarModalPago(): void {
    this.mostrarModalPago = false;
    this.especieSeleccionada = null;
    this.montoPago = 0;
    this.tipoPagoSeleccionado = null;
  }

  // Obtiene el monto pendiente de la especie actual
  getMontoPendienteEspecie(): number {
    if (!this.especieSeleccionada) return 0;
    return this.especieSeleccionada.valor - this.especieSeleccionada.valorPagado;
  }

  // Obtiene el total pendiente de todas las especies no pagadas (incluyendo siguientes)
  getTotalPendienteRestante(): number {
    if (!this.estudianteSeleccionado || !this.especieSeleccionada) return 0;
    
    const especiesNoPagadas = this.estudianteSeleccionado.especies.filter(e => !e.pagado);
    const indiceActual = especiesNoPagadas.findIndex(e => e.idEspecie === this.especieSeleccionada!.idEspecie);
    
    // Suma el pendiente desde la especie actual hasta la última
    let totalPendiente = 0;
    for (let i = indiceActual; i < especiesNoPagadas.length; i++) {
      totalPendiente += especiesNoPagadas[i].valor - especiesNoPagadas[i].valorPagado;
    }
    
    return totalPendiente;
  }

  // Verifica si es la última especie pendiente
  esUltimaEspecie(): boolean {
    if (!this.estudianteSeleccionado || !this.especieSeleccionada) return true;
    
    const especiesNoPagadas = this.estudianteSeleccionado.especies.filter(e => !e.pagado);
    const indiceActual = especiesNoPagadas.findIndex(e => e.idEspecie === this.especieSeleccionada!.idEspecie);
    
    return indiceActual === especiesNoPagadas.length - 1;
  }

  // Obtiene el monto máximo permitido
  getMontoMaximo(): number {
    return this.getTotalPendienteRestante();
  }

  // Valida si el pago es válido
  isPagoValido(): boolean {
    if (!this.tipoPagoSeleccionado) return false;
    if (this.montoPago <= 0) return false;
    // Solo bloquear si es la última especie y quiere pagar más del pendiente
    if (this.esUltimaEspecie() && this.montoPago > this.getMontoPendienteEspecie()) return false;
    return true;
  }

  // Mensaje de validación
  getMensajeValidacion(): string {
    if (!this.tipoPagoSeleccionado) {
      return 'Seleccione un tipo de pago';
    }
    if (this.montoPago <= 0) {
      return 'El monto debe ser mayor a $0.00';
    }
    // Solo mostrar error si es la última especie y quiere pagar más
    if (this.esUltimaEspecie() && this.montoPago > this.getMontoPendienteEspecie()) {
      return `No puede pagar más del saldo pendiente ($${this.getMontoPendienteEspecie().toFixed(2)})`;
    }
    return '';
  }

  // Calcula cómo se distribuirá el pago
  getDistribucionPago(): { especie: string; monto: number }[] {
    if (!this.estudianteSeleccionado || !this.especieSeleccionada || this.montoPago <= 0) return [];
    
    const distribucion: { especie: string; monto: number }[] = [];
    const especiesNoPagadas = this.estudianteSeleccionado.especies.filter(e => !e.pagado);
    const indiceActual = especiesNoPagadas.findIndex(e => e.idEspecie === this.especieSeleccionada!.idEspecie);
    
    let montoRestante = this.montoPago;
    
    for (let i = indiceActual; i < especiesNoPagadas.length && montoRestante > 0; i++) {
      const especie = especiesNoPagadas[i];
      const pendienteEspecie = especie.valor - especie.valorPagado;
      const montoAplicar = Math.min(montoRestante, pendienteEspecie);
      
      if (montoAplicar > 0) {
        distribucion.push({
          especie: especie.nombre,
          monto: montoAplicar
        });
        montoRestante -= montoAplicar;
      }
    }
    
    return distribucion;
  }

  // Confirmar pago
  confirmarPago(): void {
    // Validar y mostrar mensaje específico si no es válido
    if (!this.tipoPagoSeleccionado) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campos Requeridos',
        detail: 'Por favor seleccione un tipo de pago'
      });
      return;
    }
    
    if (this.montoPago <= 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Monto Inválido',
        detail: 'El monto a pagar debe ser mayor a $0.00'
      });
      return;
    }
    
    if (this.esUltimaEspecie() && this.montoPago > this.getMontoPendienteEspecie()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Monto Excedido',
        detail: `No puede pagar más del saldo pendiente ($${this.getMontoPendienteEspecie().toFixed(2)})`
      });
      return;
    }
    
    if (!this.especieSeleccionada || !this.estudianteSeleccionado) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se ha seleccionado una especie o estudiante'
      });
      return;
    }
    
    // Obtener el idCredito desde los detalles de la especie
    const idCredito = this.obtenerIdCreditoDeLaEspecie(this.especieSeleccionada);
    if (!idCredito) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo obtener la información del crédito'
      });
      return;
    }

    // Construir los datos de pagos (distribución entre cuotas)
    const datosPagosCredito = this.construirDatosPagoCredito();
    
    // Construir el request
    const request: any = {
      pagoCredito: {
        idCredito: idCredito,
        idTipoPago: this.tipoPagoSeleccionado,
        fechaPago: new Date().toISOString().split('T')[0], // Formato YYYY-MM-DD
        valorPago: this.montoPago,
        esValidado: true,
        datosPagosCredito: datosPagosCredito
      },
      distribuirExcedente: true
    };

    console.log('=== PROCESANDO PAGO ===');
    console.log('Request:', request);

    // Llamar al servicio para procesar el pago
    this.pagoService.crearPagoCredito(request).subscribe({
      next: (response) => {
        console.log('Pago procesado exitosamente:', response);
        if (response.isSuccess) {
          this.messageService.add({
            severity: 'success',
            summary: 'Pago Exitoso',
            detail: 'El pago se ha procesado correctamente'
          });
          
          this.cerrarModalPago();
          
          // Verificar si se pagó la matrícula para diferir pensión
          const esPagoMatricula = this.especieSeleccionada?.tipo === 'matricula';
          if (esPagoMatricula) {
            this.verificarYDiferirPension();
          } else {
            // Recargar los detalles del estudiante
            this.verDetalle(this.estudianteSeleccionado!);
          }
        } else {
          console.error('Error en el pago:', response.message);
          this.messageService.add({
            severity: 'error',
            summary: 'Error en el Pago',
            detail: response.message || 'No se pudo procesar el pago'
          });
        }
      },
      error: (err) => {
        console.error('Error al procesar el pago:', err);
        const errorMessage = err.error?.message || err.error?.errores || err.message || 'Error al procesar el pago. Por favor intente nuevamente.';
        this.messageService.add({
          severity: 'error',
          summary: 'Error del Servidor',
          detail: typeof errorMessage === 'object' ? JSON.stringify(errorMessage) : errorMessage
        });
      }
    });
  }

  // Obtener el idCredito desde los detalles de crédito del API
  private obtenerIdCreditoDeLaEspecie(especie: Especie): number | null {
    // Buscar en detallesCreditoAPI el idCredito correspondiente
    const detalle = this.detallesCreditoAPI.find(d => d.idDetalleCredito === especie.idEspecie);
    return detalle?.idCredito || null;
  }

  // Construir los datos de pago crédito con la distribución
  private construirDatosPagoCredito(): any[] {
    if (!this.estudianteSeleccionado || !this.especieSeleccionada) return [];
    
    const datosPagos: any[] = [];
    const especiesNoPagadas = this.estudianteSeleccionado.especies.filter(e => !e.pagado);
    const indiceActual = especiesNoPagadas.findIndex(e => e.idEspecie === this.especieSeleccionada!.idEspecie);
    
    let montoRestante = this.montoPago;
    const fechaPago = new Date().toISOString().split('T')[0];
    
    // Distribuir el pago entre las cuotas
    for (let i = indiceActual; i < especiesNoPagadas.length && montoRestante > 0; i++) {
      const especie = especiesNoPagadas[i];
      const pendienteEspecie = especie.valor - especie.valorPagado;
      const montoAplicar = Math.min(montoRestante, pendienteEspecie);
      
      if (montoAplicar > 0) {
        const estaPagado = montoAplicar >= pendienteEspecie;
        
        datosPagos.push({
          idDetalleCredito: especie.idEspecie,
          valorCancelado: montoAplicar,
          pagado: estaPagado,
          fechaPagoCredito: fechaPago
        });
        
        montoRestante -= montoAplicar;
      }
    }
    
    return datosPagos;
  }

  // Verificar y diferir pensión después de pagar matrícula
  private verificarYDiferirPension(): void {
    if (!this.estudianteSeleccionado) return;

    this.creditoService.getCreditosConDetallesByMatricula(this.estudianteSeleccionado.idMatricula)
      .subscribe({
        next: (creditos) => {
          console.log('Créditos obtenidos:', creditos);
          
          // Buscar crédito de pensión sin cuotas creadas
          const creditoPension = creditos.find(c => {
            const nombreEspecie = c.detalleEspecie?.toUpperCase() || '';
            const esPension = nombreEspecie.includes('PENSION') || nombreEspecie.includes('PENSIÓN');
            const sinDetalles = !c.detallesCredito || c.detallesCredito.length === 0;
            return esPension && sinDetalles;
          });

          if (creditoPension) {
            // Mostrar modal para diferir pensión
            this.creditoPensionPorDiferir = creditoPension;
            this.numeroCuotasDiferir = 1;
            this.mostrarModalDiferir = true;
            
            // Mostrar mensaje informativo
            this.messageService.add({
              severity: 'info',
              summary: 'Diferir Pensión',
              detail: 'Ahora puede diferir el pago de la pensión en cuotas',
              life: 4000
            });
          } else {
            // No hay pensión por diferir, solo recargar detalles
            this.verDetalle(this.estudianteSeleccionado!);
          }
        },
        error: (err) => {
          console.error('Error al obtener créditos:', err);
          this.messageService.add({
            severity: 'warn',
            summary: 'Advertencia',
            detail: 'No se pudo verificar si hay pensión por diferir'
          });
          // Recargar detalles aunque haya error
          this.verDetalle(this.estudianteSeleccionado!);
        }
      });
  }

  // Mostrar modal para diferir pensión manualmente
  mostrarModalDiferirPension(especie: Especie): void {
    if (!this.estudianteSeleccionado) return;

    // Obtener los créditos para encontrar el crédito de pensión
    this.creditoService.getCreditosConDetallesByMatricula(this.estudianteSeleccionado.idMatricula)
      .subscribe({
        next: (creditos) => {
          // Buscar el crédito de pensión correspondiente a esta especie (sin cuotas creadas)
          const creditoPension = creditos.find(c => {
            const nombreEspecie = c.detalleEspecie?.toUpperCase() || '';
            const esPension = nombreEspecie.includes('PENSION') || nombreEspecie.includes('PENSIÓN');
            const sinDetalles = !c.detallesCredito || c.detallesCredito.length === 0;
            return esPension && sinDetalles;
          });

          if (creditoPension) {
            this.creditoPensionPorDiferir = creditoPension;
            this.numeroCuotasDiferir = 1;
            this.mostrarModalDiferir = true;
            
            // Mostrar mensaje informativo
            this.messageService.add({
              severity: 'info',
              summary: 'Diferir Pago',
              detail: 'Seleccione en cuántas cuotas desea diferir la pensión',
              life: 3000
            });
          } else {
            this.messageService.add({
              severity: 'warn',
              summary: 'Advertencia',
              detail: 'No se encontró crédito de pensión para diferir'
            });
          }
        },
        error: (err) => {
          console.error('Error al obtener créditos:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al obtener información del crédito'
          });
        }
      });
  }

  // Confirmar diferimiento de pensión
  confirmarDiferimiento(): void {
    if (!this.creditoPensionPorDiferir) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se ha seleccionado un crédito para diferir'
      });
      return;
    }
    
    if (this.numeroCuotasDiferir < 1) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Número Inválido',
        detail: 'El número de cuotas debe ser al menos 1'
      });
      return;
    }

    const request = {
      idCredito: this.creditoPensionPorDiferir.idCredito,
      numeroCuotas: this.numeroCuotasDiferir
    };

    console.log('=== DIFERIR CRÉDITO ===');
    console.log('Request:', request);
    console.log('Crédito completo:', this.creditoPensionPorDiferir);

    this.creditoService.diferirCredito(request).subscribe({
      next: (response) => {
        console.log('Respuesta diferir:', response);
        if (response.isSuccess) {
          this.messageService.add({
            severity: 'success',
            summary: 'Diferimiento Exitoso',
            detail: `La pensión se ha diferido en ${this.numeroCuotasDiferir} cuota(s)`
          });
          this.cerrarModalDiferir();
          // Recargar detalles del estudiante
          this.verDetalle(this.estudianteSeleccionado!);
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error del Servidor',
            detail: response.message || 'No se pudo diferir la pensión'
          });
        }
      },
      error: (err) => {
        console.error('Error al diferir pensión:', err);
        // Extraer mensaje de error del backend
        let errorMessage = 'Error al diferir la pensión. Por favor intente nuevamente.';
        if (err.error?.message) {
          errorMessage = err.error.message;
        } else if (err.error?.errores) {
          errorMessage = typeof err.error.errores === 'object' 
            ? Object.values(err.error.errores).flat().join(', ') 
            : err.error.errores;
        } else if (err.message) {
          errorMessage = err.message;
        }
        
        this.messageService.add({
          severity: 'error',
          summary: 'Error del Servidor',
          detail: errorMessage
        });
      }
    });
  }

  // Cerrar modal de diferir
  cerrarModalDiferir(): void {
    this.mostrarModalDiferir = false;
    this.creditoPensionPorDiferir = null;
    this.numeroCuotasDiferir = 1;
  }

  // Omitir diferimiento y recargar
  omitirDiferimiento(): void {
    this.cerrarModalDiferir();
    this.verDetalle(this.estudianteSeleccionado!);
  }
}