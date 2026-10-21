import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, inject, Input, NgZone, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../../../core/auth/auth.service';
import { API_BASE_URL } from '../../../../core/constants/app.constants';
import { ClienteService } from '../../../../core/services/pagos/cliente.service';
import { CreditoService } from '../../../../core/services/pagos/credito.service';
import { CuentaBancariaService } from '../../../../core/services/pagos/cuenta-bancaria.service';
import { TipoCuentaService } from '../../../../core/services/pagos/tipo-cuenta.service';
import { PagoService } from '../../../../core/services/pagos/pago.service';
import { DatosContactoService } from '../../../../core/services/postulaciones/datos-contacto.service';
import { PersonaDireccionService } from '../../../../core/services/postulaciones/persona-direccion.service';
import { ClienteDTO, CuentaBancariaDTO, TipoPagoDTO, TipoCuentaDTO } from '../../../../data/models/Entities';
import { DetalleCredito, Especie, HistorialPago, PagoEstudiante } from '../../../../shared/models/pagos.model';
import { SharedDrawerComponent } from '../../../../shared/shared-drawer/shared-drawer.component';
import { SharedModalComponent } from '../../../../shared/shared-modal/shared-modal.component';
import { SharedTableComponent } from '../../../../shared/shared-table/shared-table.component';
import { SharedToastComponent } from '../../../../shared/shared-toast/shared-toast.component';
import { SharedRevertToastComponent } from '../../../../shared/shared-revert-toast/shared-revert-toast.component';
import { ConfirmationModalComponent } from '../../../../shared/modal-confirmation/confirmation-modal.component';
import { CustomSelectComponent } from '../../../../shared/custom-select/custom-select.component';
import { ToastService } from '../../../../shared/toast.service';

@Component({
  selector: 'app-ver-detalles',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SharedDrawerComponent,
    SharedModalComponent,
    SharedTableComponent,
    SharedToastComponent,
    SharedRevertToastComponent,
    ConfirmationModalComponent,
    CustomSelectComponent
  ],
  templateUrl: './ver-detalles.html',
  styleUrls: ['./ver-detalles.css']
})
export class VerDetallesComponent implements OnChanges {
  @Input() estudianteSeleccionado!: PagoEstudiante;
  @Input() detallesCreditoAPI: any[] = [];
  @Output() volver = new EventEmitter<void>();
  @Output() volverYRecargar = new EventEmitter<void>();
  @Output() recargarEstudiante = new EventEmitter<PagoEstudiante>();

  private creditoService = inject(CreditoService);
  private pagoService = inject(PagoService);
  private cuentaBancariaService = inject(CuentaBancariaService);
  private tipoCuentaService = inject(TipoCuentaService);
  private authService = inject(AuthService);
  private clienteService = inject(ClienteService);
  private datosContactoService = inject(DatosContactoService);
  private personaDireccionService = inject(PersonaDireccionService);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  // Control de vista en detalle
  vistaDetalle: 'especies' | 'historial' = 'especies';
  historialPagos: HistorialPago[] = [];
  loadingHistorial: boolean = false;

  // Modal de Observación de Pago individual en Historial
  mostrarModalObservacion: boolean = false;
  pagoObservacionSeleccionado: HistorialPago | null = null;
  textoObservacion: string = '';
  guardandoObservacion: boolean = false;

  // Modal de Anulación de Arancel / Costo Extra
  mostrarModalAnularEspecie: boolean = false;
  especieAAnular: Especie | null = null;
  anulandoEspecie: boolean = false;

  // Panel lateral de cuotas
  cuotasExpandidas: Especie | null = null;

  // Edición de fecha límite de cuota
  cuotaEnEdicion: number | null = null;
  fechaEdicion: string | null = null;
  maxFechaEdicion: Date | null = null;
  guardandoFecha: boolean = false;
  readonly hoy: Date = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();

  // Modal de pago
  mostrarModalPago: boolean = false;
  especieSeleccionada: Especie | null = null;
  // Estados del modal de pago (2 pasos)
  pasoPago: number = 2;
  documentoBusqueda: string = '';
  documentoInvalido: boolean = false;
  buscandoCliente: boolean = false;
  clienteSeleccionado: ClienteDTO | null = null;
  clienteTitularTipo: 'alumno' | 'anterior' | 'otro' = 'alumno';
  mostrarFormularioCliente: boolean = false;
  guardandoCliente: boolean = false;
  nuevoCliente: ClienteDTO = {
    documento: '', nombres: '', apellidos: '', correo: '', celular: '', direccion: ''
  };

  montoPago: number = 0;
  tipoPagoSeleccionado: number | null = null;
  cuentaSeleccionada: number | null = null;
  numeroDeposito: string = '';
  comprobanteFile: File | undefined = undefined;
  fechaDepositoDate: string | null = null;  // fecha de depósito seleccionada por el usuario (ISO string)
  tieneObservacionEspecial: boolean = false;
  observacionesPago: string = '';
  tiposPago: TipoPagoDTO[] = [];
  cuentasBancarias: CuentaBancariaDTO[] = [];
  loadingTiposPago: boolean = false;
  loadingCuentas: boolean = false;

  // Gestión de cuentas bancarias desde el drawer
  mostrarGestionCuentas: boolean = false;
  cuentasBancariasTemp: CuentaBancariaDTO[] = [];
  tiposCuenta: TipoCuentaDTO[] = [];
  editandoCuenta: boolean = false;
  cuentaFormData: { banco: string; numeroCuenta: string; idTipoCuenta: number | null } = { banco: '', numeroCuenta: '', idTipoCuenta: null };
  cuentaEnEdicion: CuentaBancariaDTO | null = null;
  guardandoCuenta: boolean = false;
  // Revert
  mostrarRevertCuenta: boolean = false;
  revertCuentaAccion: string = '';
  revertCuentaData: any = null;

  // Modal de diferir pensión
  mostrarModalDiferir: boolean = false;
  creditoPensionPorDiferir: any = null;
  numeroCuotasDiferir: number = 1;

  // Confirmación
  mostrarConfirmacion: boolean = false;
  confirmacionTitulo: string = '';
  confirmacionMensaje: string = '';

  // Saldo a favor del estudiante
  saldoFavor: number = 0;

  // Columnas de la tabla de cuotas
  cuotaColumnas = [
    { field: 'numeroCuota', header: '#', width: '55px' },
    { field: 'valor', header: 'Valor' },
    { field: 'valorCancelado', header: 'Pagado' },
    { field: 'saldoCuota', header: 'Saldo' },
    { field: 'fechaLimite', header: 'Vencimiento' },
    { field: 'estado', header: 'Estado', width: '110px', align: 'center' as const }
  ];

  Math = Math;

  get hoyISO(): string {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  }

  formatDateForInput(d: Date): string {
    const dd = new Date(d);
    dd.setMinutes(dd.getMinutes() - dd.getTimezoneOffset());
    return dd.toISOString().slice(0, 10);
  }

  onConfirmacionAccept(): void {
    this.mostrarConfirmacion = false;
  }

  onConfirmacionReject(): void {
    this.mostrarConfirmacion = false;
  }

  onConfirmacionHide(): void {
    this.mostrarConfirmacion = false;
  }

  /** Parsea valores que pueden venir como objeto { source, parsedValue } o número plano */
  parseMonto(val: any): number {
    if (val && typeof val === 'object' && val.parsedValue !== undefined) {
      return Number(val.parsedValue) || 0;
    }
    return Number(val) || 0;
  }

  /** Calcula el saldo a diferir: saldoCuota del primer detalleCredito del crédito */
  get saldoADiferir(): number {
    if (!this.creditoPensionPorDiferir) return 0;
    const detalles = this.creditoPensionPorDiferir.detallesCredito;
    if (detalles && detalles.length > 0) {
      return this.parseMonto(detalles[0].saldoCuota);
    }
    // Fallback: montoFinal o valorEspecie
    return this.parseMonto(this.creditoPensionPorDiferir.montoFinal) ||
      this.parseMonto(this.creditoPensionPorDiferir.valorEspecie) || 0;
  }

  /** Suma el total de todos los beneficios de las especies del estudiante */
  get totalBeneficio(): number {
    if (!this.estudianteSeleccionado?.especies) return 0;
    return this.estudianteSeleccionado.especies.reduce((acc, especie) =>
      acc + (this.parseMonto(especie.montoBeneficio) || 0), 0);
  }

  /** Calcula el saldo pendiente total restando el beneficio acumulado */
  get saldoPendienteTotal(): number {
    if (!this.estudianteSeleccionado) return 0;
    // Saldo = Total Deuda - Total Beneficio (ya aplicado en deuda según requerimiento) - Total Pagado
    // Nota: El requerimiento dice: "el saldo pendiente muéstralo tomando en cuenta el beneficio"
    // Actualmente totalDeuda parece ser la suma de los valores originales.
    return this.estudianteSeleccionado.totalDeuda - this.totalBeneficio - this.estudianteSeleccionado.totalPagado;
  }

  /** Calcula el valor ya pagado (valorCancelado) del primer detalleCredito */
  getValorPagadoCredito(credito: any): number {
    const detalles = credito?.detallesCredito;
    if (detalles && detalles.length > 0) {
      return this.parseMonto(detalles[0].valorCancelado);
    }
    return 0;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['estudianteSeleccionado'] && this.estudianteSeleccionado) {
      // Ordenar cuotas de cada especie por numeroCuota
      this.estudianteSeleccionado.especies.forEach(e => {
        if (e.detallesCredito?.length) {
          e.detallesCredito.sort((a, b) => a.numeroCuota - b.numeroCuota);
        }
      });
      this.cargarTiposPago();
      this.cargarCuentasBancarias();
      this.verificarCuotasVencidas(this.estudianteSeleccionado.especies);
      this.cuotasExpandidas = null;
      this.cargarSaldoFavor();

      if (this.vistaDetalle === 'historial') {
        this.cargarHistorialPagos(this.estudianteSeleccionado.idMatricula);
      }
    }
  }

  cargarSaldoFavor(): void {
    const idPersona = this.estudianteSeleccionado?.idPersona;
    if (!idPersona) return;
    this.pagoService.getSaldoFavor(idPersona).subscribe({
      next: (res) => {
        if (res.isSuccess && res.data) {
          this.saldoFavor = this.parseMonto(res.data.saldo);
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error al cargar saldo a favor:', err);
      }
    });
  }

  cargarTiposPago(): void {
    if (this.tiposPago.length > 0) return;
    this.loadingTiposPago = true;
    this.pagoService.getTiposPago().subscribe({
      next: (tipos) => {
        this.ngZone.run(() => {
          this.tiposPago = tipos;
          this.loadingTiposPago = false;
        });
      },
      error: (err) => {
        console.error('Error al cargar tipos de pago:', err);
        this.toastService.showError('No se pudieron cargar los tipos de pago', 'Error');
        this.ngZone.run(() => { this.loadingTiposPago = false; });
      }
    });
  }

  cargarCuentasBancarias(): void {
    if (this.cuentasBancarias.length > 0) return;
    this.loadingCuentas = true;
    this.cuentaBancariaService.getAll().subscribe({
      next: (cuentas) => {
        this.ngZone.run(() => {
          this.cuentasBancarias = cuentas;
          this.loadingCuentas = false;
        });
      },
      error: (err) => {
        console.error('Error al cargar cuentas bancarias:', err);
        this.ngZone.run(() => { this.loadingCuentas = false; });
      }
    });
  }

  // ─── Gestión de Cuentas Bancarias ────────────────────────────────

  abrirGestionCuentas(): void {
    this.mostrarGestionCuentas = true;
    this.cargarCuentasGestion();
    this.cancelarEdicionCuenta();
    if (this.tiposCuenta.length === 0) {
      this.cargarTiposCuentaGestion();
    }
  }

  cerrarGestionCuentas(): void {
    this.mostrarGestionCuentas = false;
    this.cancelarEdicionCuenta();
  }

  private cargarCuentasGestion(): void {
    this.cuentaBancariaService.getAll().subscribe({
      next: (cuentas) => {
        this.cuentasBancariasTemp = cuentas.filter(c => c.activo !== false);
        this.cdr.detectChanges();
      },
      error: () => this.toastService.showError('Error al cargar cuentas bancarias', 'Error')
    });
  }

  private cargarTiposCuentaGestion(): void {
    this.tipoCuentaService.getAll().subscribe({
      next: (tipos) => { this.tiposCuenta = tipos; },
      error: () => this.toastService.showError('Error al cargar tipos de cuenta', 'Error')
    });
  }

  nuevaCuentaGestion(): void {
    this.editandoCuenta = true;
    this.cuentaEnEdicion = null;
    this.cuentaFormData = { banco: '', numeroCuenta: '', idTipoCuenta: null };
  }

  editarCuentaGestion(cuenta: CuentaBancariaDTO): void {
    this.editandoCuenta = true;
    this.cuentaEnEdicion = cuenta;
    this.cuentaFormData = {
      banco: cuenta.banco || '',
      numeroCuenta: cuenta.numeroCuenta || '',
      idTipoCuenta: cuenta.idTipoCuenta ?? null
    };
  }

  cancelarEdicionCuenta(): void {
    this.editandoCuenta = false;
    this.cuentaEnEdicion = null;
    this.cuentaFormData = { banco: '', numeroCuenta: '', idTipoCuenta: null };
  }

  guardarCuentaGestion(): void {
    const { banco, numeroCuenta, idTipoCuenta } = this.cuentaFormData;
    if (!banco?.trim() || !numeroCuenta?.trim() || !idTipoCuenta) {
      this.toastService.showWarning('Complete todos los campos requeridos', 'Validación');
      return;
    }
    this.guardandoCuenta = true;
    const data: CuentaBancariaDTO = { banco: banco.trim(), numeroCuenta: numeroCuenta.trim(), idTipoCuenta, activo: true };

    if (this.editandoCuenta && this.cuentaEnEdicion?.idCuentaBancaria) {
      data.idCuentaBancaria = this.cuentaEnEdicion.idCuentaBancaria;
      this.cuentaBancariaService.update(data).subscribe({
        next: () => {
          this.guardandoCuenta = false;
          this.toastService.showSuccess('Cuenta actualizada correctamente', 'Éxito');
          this.cargarCuentasGestion();
          this.cargarCuentasBancarias();
          this.cancelarEdicionCuenta();
          this.mostrarRevertCuentaToast('update', { ...this.cuentaEnEdicion });
        },
        error: () => {
          this.guardandoCuenta = false;
          this.toastService.showError('Error al actualizar cuenta', 'Error');
        }
      });
    } else {
      this.cuentaBancariaService.create(data).subscribe({
        next: (nueva) => {
          this.guardandoCuenta = false;
          this.toastService.showSuccess('Cuenta creada correctamente', 'Éxito');
          this.cargarCuentasGestion();
          this.cargarCuentasBancarias();
          this.cancelarEdicionCuenta();
          this.mostrarRevertCuentaToast('create', nueva);
        },
        error: () => {
          this.guardandoCuenta = false;
          this.toastService.showError('Error al crear cuenta', 'Error');
        }
      });
    }
  }

  eliminarCuentaGestion(cuenta: CuentaBancariaDTO): void {
    if (!cuenta.idCuentaBancaria) return;
    this.cuentaBancariaService.delete(cuenta.idCuentaBancaria).subscribe({
      next: () => {
        this.toastService.showSuccess('Cuenta desactivada correctamente', 'Éxito');
        this.cargarCuentasGestion();
        this.cargarCuentasBancarias();
        if (this.cuentaSeleccionada === cuenta.idCuentaBancaria) {
          this.cuentaSeleccionada = null;
        }
        this.mostrarRevertCuentaToast('delete', { ...cuenta });
      },
      error: (err) => this.toastService.showError(err.error?.message || 'Error al desactivar cuenta', 'Error')
    });
  }

  seleccionarCuentaGestion(cuenta: CuentaBancariaDTO): void {
    this.cuentaSeleccionada = cuenta.idCuentaBancaria ?? null;
    this.cerrarGestionCuentas();
  }

  private mostrarRevertCuentaToast(accion: string, data: any): void {
    this.revertCuentaAccion = accion;
    this.revertCuentaData = data;
    this.mostrarRevertCuenta = true;
  }

  revertirOperacionCuenta(): void {
    this.mostrarRevertCuenta = false;
    const data = this.revertCuentaData;
    if (!data) return;

    if (this.revertCuentaAccion === 'create' && data.idCuentaBancaria) {
      this.cuentaBancariaService.delete(data.idCuentaBancaria).subscribe({
        next: () => {
          this.toastService.showSuccess('Creación revertida', 'Revertido');
          this.cargarCuentasGestion();
          this.cargarCuentasBancarias();
          this.cancelarEdicionCuenta();
        }
      });
    } else if (this.revertCuentaAccion === 'update' && this.cuentaEnEdicion?.idCuentaBancaria) {
      const restore: CuentaBancariaDTO = {
        idCuentaBancaria: this.cuentaEnEdicion.idCuentaBancaria,
        banco: data.banco,
        numeroCuenta: data.numeroCuenta,
        idTipoCuenta: data.idTipoCuenta,
        activo: true
      };
      this.cuentaBancariaService.update(restore).subscribe({
        next: () => {
          this.toastService.showSuccess('Actualización revertida', 'Revertido');
          this.cargarCuentasGestion();
          this.cargarCuentasBancarias();
        }
      });
    } else if (this.revertCuentaAccion === 'delete' && data.idCuentaBancaria) {
      const restore: CuentaBancariaDTO = { ...data, activo: true };
      this.cuentaBancariaService.update(restore).subscribe({
        next: () => {
          this.toastService.showSuccess('Eliminación revertida', 'Revertido');
          this.cargarCuentasGestion();
          this.cargarCuentasBancarias();
        }
      });
    }
  }

  volverALista(): void {
    this.volverYRecargar.emit();
    this.volver.emit();
  }

  cambiarVistaDetalle(vista: 'especies' | 'historial'): void {
    this.vistaDetalle = vista;
    if (vista === 'historial' && this.estudianteSeleccionado && this.historialPagos.length === 0) {
      this.cargarHistorialPagos(this.estudianteSeleccionado.idMatricula);
    }
  }

  cargarHistorialPagos(idMatricula: number): void {
    this.loadingHistorial = true;
    this.historialPagos = [];
    this.pagoService.getHistorialPagos(idMatricula).subscribe({
      next: (response) => {
        if (response.isSuccess && response.data && response.data.length > 0) {
          this.historialPagos = response.data.map(pago => ({
            ...pago,
            cuotasPagadas: pago.cuotasPagadas
              ? [...pago.cuotasPagadas].sort((a, b) => a.numeroCuota - b.numeroCuota)
              : []
          }));

          // Cargar datos extra del cliente por cada pago asyncronamente
          this.historialPagos.forEach(pago => {
            // Backend está enviando "IdCliente" en mayúsculas a veces
            const idC = pago.idCliente ?? (pago as any).IdCliente;

            if (idC) {
              this.clienteService.getClienteById(idC).subscribe({
                next: (resCliente) => {
                  if (resCliente.isSuccess && resCliente.data && resCliente.data.length > 0) {
                    const c = resCliente.data[0];
                    pago.clienteNombre = `${c.nombres} ${c.apellidos}`.trim();
                    pago.clienteDocumento = c.documento;
                    this.cdr.detectChanges();
                  }
                }
              });
            }
          });


        } else {
          this.toastService.showInfo('No hay pagos registrados para esta matrícula', 'Sin Historial');
        }
        this.loadingHistorial = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar historial de pagos:', err);
        this.toastService.showError('No se pudo cargar el historial de pagos', 'Error');
        this.loadingHistorial = false;
        this.historialPagos = [];
        this.cdr.detectChanges();
      }
    });
  }

  // ─── Panel lateral de cuotas ─────────────────────────────────────

  toggleCuotas(especie: Especie): void {
    if (this.cuotasExpandidas?.idCredito === especie.idCredito) {
      this.cuotasExpandidas = null;
    } else {
      this.cuotasExpandidas = especie;
    }
  }

  cerrarCuotasPanel(): void {
    this.cuotasExpandidas = null;
    this.cuotaEnEdicion = null;
    this.fechaEdicion = null;
  }

  // ─── Edición de fecha límite de cuota ────────────────────────────

  get puedeEditarFechas(): boolean {
    return this.authService.hasAnyRole(['ADMINISTRADOR', 'SUPERVISOR']);
  }

  /** Parsea una cadena YYYY-MM-DD como fecha LOCAL para evitar el desfase UTC */
  private parseLocalDate(dateStr: string): Date {
    const clean = dateStr.split('T')[0];
    const [y, m, d] = clean.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  private formatDateInput(dateStr: string): string {
    const d = this.parseLocalDate(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  iniciarEdicionFecha(cuota: DetalleCredito): void {
    this.cuotaEnEdicion = cuota.idDetalleCredito;
    this.fechaEdicion = cuota.fechaLimite ? this.formatDateInput(cuota.fechaLimite) : new Date().toISOString().split('T')[0];
    this.maxFechaEdicion = this.calcularMaxDateForCuota(cuota);
  }

  cancelarEdicionFecha(): void {
    this.cuotaEnEdicion = null;
    this.fechaEdicion = null;
    this.maxFechaEdicion = null;
  }

  private calcularMaxDateForCuota(cuota: DetalleCredito): Date | null {
    if (!this.cuotasExpandidas) return null;
    const siguiente = this.cuotasExpandidas.detallesCredito
      .find(c => c.numeroCuota === cuota.numeroCuota + 1);
    if (!siguiente?.fechaLimite) return null;
    const maxDate = this.parseLocalDate(siguiente.fechaLimite);
    maxDate.setDate(maxDate.getDate() - 1);
    if (maxDate < this.hoy) return null;
    return maxDate;
  }

  guardarFechaLimite(cuota: DetalleCredito): void {
    if (!this.fechaEdicion) return;

    const nuevaFechaLimite = this.fechaEdicion;
    this.guardandoFecha = true;

    this.creditoService.actualizarFechaLimiteCuota(cuota.idDetalleCredito, nuevaFechaLimite).subscribe({
      next: (response) => {
        this.guardandoFecha = false;
        if (response.isSuccess) {
          cuota.fechaLimite = nuevaFechaLimite;
          this.cancelarEdicionFecha();
          this.toastService.showSuccess('La fecha límite se actualizó correctamente.', 'Fecha actualizada');
        } else {
          this.toastService.showError(response.message || 'No se pudo actualizar la fecha.', 'Error');
        }
      },
      error: (err) => {
        this.guardandoFecha = false;
        const msg = err.error?.message || err.message || 'Error al actualizar la fecha.';
        this.toastService.showError(msg, 'Error del Servidor');
      }
    });
  }

  // ─── Estado y badge ──────────────────────────────────────────────

  getEspecieSeverity(especie: Especie): 'success' | 'warn' | 'danger' | 'secondary' {
    if (especie.pagado) return 'success';
    // Pendiente de aprobación: considerado pagado pero aún sin validar
    if (this.especiePendienteAprobacion(especie)) return 'warn';
    if (especie.esPensionNoDiferida || especie.estado === 'PENDIENTE_DIFERIR') return 'secondary';
    const base = especie.montoFinal > 0 ? especie.montoFinal : especie.valor;
    const porcentaje = base > 0 ? (especie.valorPagado / base) * 100 : 0;
    if (porcentaje > 0) return 'warn';
    return 'danger';
  }

  getEspecieEstado(especie: Especie): string {
    if (especie.pagado) return 'Pagado';
    if (this.especiePendienteAprobacion(especie)) return 'Pago en Revisión';
    if (especie.esPensionNoDiferida || especie.estado === 'PENDIENTE_DIFERIR') return 'Pendiente Diferir';
    if (especie.valorPagado > 0) return 'Parcial';
    return 'Pendiente';
  }

  /** Retorna true si la especie tiene cuotas con estado PENDIENTE_APROBACION */
  especiePendienteAprobacion(especie: Especie): boolean {
    if (!especie.detallesCredito || especie.detallesCredito.length === 0) return false;
    return especie.detallesCredito.some(
      d => d.estado?.toUpperCase() === 'PENDIENTE_APROBACION'
    );
  }

  getEstadoCuotaSeverity(estado: string): 'success' | 'warn' | 'danger' | 'secondary' {
    switch (estado?.toUpperCase()) {
      case 'PAGADO': return 'success';
      case 'PAGADA': return 'success';
      case 'PENDIENTE_APROBACION': return 'warn';
      case 'PENDIENTE': return 'danger';
      case 'PARCIAL': return 'warn';
      default: return 'secondary';
    }
  }

  // ─── Verificar si matrícula está pagada ──────────────────────────

  get matriculaPagada(): boolean {
    if (!this.estudianteSeleccionado) return false;
    const especieMatricula = this.estudianteSeleccionado.especies.find(e => e.tipo === 'matricula');
    if (!especieMatricula) return true; // Si no hay matrícula, no bloquear
    // Consideramos pagada si está marcada como pagada O si tiene cuotas en PENDIENTE_APROBACION
    return especieMatricula.pagado || this.especiePendienteAprobacion(especieMatricula);
  }

  /** Verdadero si alguna especie tiene cuotas en PENDIENTE_APROBACION */
  get hayPagosEnRevision(): boolean {
    if (!this.estudianteSeleccionado) return false;
    return this.estudianteSeleccionado.especies.some(e => this.especiePendienteAprobacion(e));
  }

  /** Retorna el monto total de cuotas pendientes de validación por contabilidad */
  get montoEnRevision(): number {
    if (!this.estudianteSeleccionado?.especies) return 0;
    let total = 0;
    this.estudianteSeleccionado.especies.forEach(e => {
      total += this.getMontoEnRevisionEspecie(e);
    });
    return total;
  }

  /** Retorna el monto pendiente de validación para una especie específica */
  getMontoEnRevisionEspecie(especie: Especie): number {
    if (!especie?.detallesCredito) return 0;
    return especie.detallesCredito
      .filter(d => d.estado?.toUpperCase() === 'PENDIENTE_APROBACION')
      .reduce((sum, d) => sum + (this.parseMonto(d.valorCancelado) || this.parseMonto(d.valor) || 0), 0);
  }

  mostrarToastDiferirBloqueado(): void {
    this.toastService.showWarning('Primero debe completar el pago de matrícula para poder diferir la pensión.', 'Pago de Matrícula Requerido');
  }

  private verificarCuotasVencidas(especies: Especie[]): void {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const cuotasVencidas: DetalleCredito[] = [];

    especies.forEach(especie => {
      // Ignorar matrículas o especies ya pagadas por completo
      if (especie.pagado || !especie.detallesCredito) return;

      especie.detallesCredito.forEach(cuota => {
        if (cuota.pagado) return;
        if (!cuota.fechaLimite || cuota.fechaLimite === 'Sin fecha' || cuota.fechaLimite === 'Por definir al diferir') return;

        const fechaLimite = new Date(cuota.fechaLimite);
        if (isNaN(fechaLimite.getTime())) return;

        fechaLimite.setHours(0, 0, 0, 0);

        if (fechaLimite < hoy) {
          cuotasVencidas.push(cuota);
        }
      });
    });

    if (cuotasVencidas.length > 0) {
      setTimeout(() => {
        cuotasVencidas.forEach((cuota, index) => {
          setTimeout(() => {
            const pendiente = cuota.saldoCuota;
            this.toastService.showWarning(`Cuota ${cuota.numeroCuota} venció el ${this.formatearFecha(cuota.fechaLimite)}. Pendiente: $${pendiente.toFixed(2)}`, 'Cuota Vencida');
          }, index * 300);
        });
      }, 500);
    }
  }

  private formatearFecha(fecha: string | null): string {
    if (!fecha) return 'Sin fecha';
    try {
      const date = new Date(fecha);
      if (isNaN(date.getTime())) return fecha;
      return date.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return fecha;
    }
  }

  // ─── Modal de pago individual ────────────────────────────────────

  pagarEspecie(especie: Especie): void {
    this.especieSeleccionada = especie;
    const pendiente = (especie.montoFinal || especie.valor) - especie.valorPagado;
    this.montoPago = pendiente > 0 ? pendiente : 0;

    // Reset de estado del formulario de pago
    this.tipoPagoSeleccionado = null;
    this.cuentaSeleccionada = null;
    this.numeroDeposito = '';
    this.comprobanteFile = undefined;
    this.fechaDepositoDate = null;
    this.mostrarFormularioCliente = false;

    // Abrir directamente en el paso de pago mientras se cargan los datos del cliente
    this.pasoPago = 2;
    this.mostrarModalPago = true;

    // Resolver y predeterminar el cliente para la facturación
    this.resolverClientePredeterminado();
  }

  /**
   * Resuelve los datos del cliente a facturar:
   * 1. Si ya tiene pagos anteriores registrados con un cliente, usa el último cliente registrado.
   * 2. Si no, busca si el estudiante ya está registrado como cliente en la BD de clientes.
   * 3. Si no existe como cliente, recupera los datos de la persona (contacto/dirección) para registrarlo/usarlo automáticamente.
   */
  private resolverClientePredeterminado(): void {
    if (!this.estudianteSeleccionado) return;

    // Caso 1: Verificar si hay historial de pagos previos con cliente registrado
    if (this.historialPagos && this.historialPagos.length > 0) {
      const ultimoPagoConCliente = [...this.historialPagos].reverse().find(p => p.idCliente || (p as any).IdCliente);
      const idClienteAnterior = ultimoPagoConCliente?.idCliente ?? (ultimoPagoConCliente as any)?.IdCliente;

      if (idClienteAnterior) {
        this.clienteService.getClienteById(idClienteAnterior).subscribe({
          next: (res) => {
            if (res.isSuccess && res.data && res.data.length > 0) {
              this.clienteSeleccionado = res.data[0];
              const esMismoAlumno = String(this.clienteSeleccionado.documento).trim() === String(this.estudianteSeleccionado.cedula).trim();
              this.clienteTitularTipo = esMismoAlumno ? 'alumno' : 'anterior';
              this.documentoBusqueda = this.clienteSeleccionado.documento || '';
              this.cdr.detectChanges();
              return;
            }
            this.buscarOcrearClienteDesdeAlumno();
          },
          error: () => this.buscarOcrearClienteDesdeAlumno()
        });
        return;
      }
    }

    // Caso 2 y 3: No hay pagos previos o no se encontró cliente anterior -> usar datos del alumno
    this.buscarOcrearClienteDesdeAlumno();
  }

  private buscarOcrearClienteDesdeAlumno(): void {
    const cedula = this.estudianteSeleccionado?.cedula;
    if (!cedula) return;

    this.clienteService.getClienteByDocumento(cedula).subscribe({
      next: (res) => {
        let clienteExacto = null;
        if (res.isSuccess && res.data && res.data.length > 0) {
          clienteExacto = res.data.find(c =>
            String(c.documento).trim() === String(cedula).trim() ||
            String((c as any).identificacion).trim() === String(cedula).trim()
          );
        }

        if (clienteExacto) {
          this.clienteSeleccionado = clienteExacto;
          this.clienteTitularTipo = 'alumno';
          this.documentoBusqueda = clienteExacto.documento || '';
          this.cdr.detectChanges();
        } else {
          // Si el alumno no existe aún en la tabla de clientes, recopilamos sus datos de contacto y dirección
          this.autoRegistrarAlumnoComoCliente();
        }
      },
      error: () => {
        this.autoRegistrarAlumnoComoCliente();
      }
    });
  }

  private autoRegistrarAlumnoComoCliente(): void {
    const idPersona = this.estudianteSeleccionado?.idPersona;
    const nombresSeparados = this.estudianteSeleccionado?.nombreEstudiante?.split(' ') || [];
    const mitad = Math.ceil(nombresSeparados.length / 2);
    const nombres = nombresSeparados.slice(0, mitad).join(' ') || this.estudianteSeleccionado?.nombreEstudiante || '';
    const apellidos = nombresSeparados.slice(mitad).join(' ') || '';

    const clienteBase: ClienteDTO = {
      documento: this.estudianteSeleccionado?.cedula || '',
      nombres: nombres,
      apellidos: apellidos,
      correo: 'info@estudiante.com',
      celular: '0999999999',
      direccion: 'Ecuador'
    };

    if (idPersona) {
      // Cargar contactos y dirección reales de la persona
      this.datosContactoService.getByPersona(idPersona).subscribe({
        next: (contactos) => {
          if (contactos && contactos.length > 0) {
            const correoContacto = contactos.find(c => c.detalle?.includes('@'))?.detalle;
            const telfContacto = contactos.find(c => !c.detalle?.includes('@') && /^\d+$/.test(c.detalle?.trim() || ''))?.detalle;
            if (correoContacto) clienteBase.correo = correoContacto;
            if (telfContacto) clienteBase.celular = telfContacto;
          }

          this.personaDireccionService.getByPersona(idPersona).subscribe({
            next: (dir) => {
              if (dir?.direccionDomiciliaria) {
                clienteBase.direccion = dir.direccionDomiciliaria;
              }
              this.guardarYSeleccionarClienteAlumno(clienteBase);
            },
            error: () => this.guardarYSeleccionarClienteAlumno(clienteBase)
          });
        },
        error: () => this.guardarYSeleccionarClienteAlumno(clienteBase)
      });
    } else {
      this.guardarYSeleccionarClienteAlumno(clienteBase);
    }
  }

  private guardarYSeleccionarClienteAlumno(cliente: ClienteDTO): void {
    this.clienteService.crearCliente(cliente).subscribe({
      next: (res) => {
        if (res.isSuccess) {
          this.clienteSeleccionado = { ...cliente, idCliente: res.data };
          this.clienteTitularTipo = 'alumno';
          this.documentoBusqueda = cliente.documento || '';
          this.cdr.detectChanges();
        } else {
          this.clienteSeleccionado = cliente;
          this.clienteTitularTipo = 'alumno';
          this.documentoBusqueda = cliente.documento || '';
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.clienteSeleccionado = cliente;
        this.clienteTitularTipo = 'alumno';
        this.documentoBusqueda = cliente.documento || '';
        this.cdr.detectChanges();
      }
    });
  }

  facturarAOtroNombre(): void {
    this.pasoPago = 1;
    this.documentoBusqueda = '';
    this.documentoInvalido = false;
    this.mostrarFormularioCliente = false;
    this.nuevoCliente = { documento: '', nombres: '', apellidos: '', correo: '', celular: '', direccion: '' };
  }

  volverAPasoPago(): void {
    if (this.clienteSeleccionado) {
      this.pasoPago = 2;
    }
  }

  restaurarClienteAlumno(): void {
    this.buscarOcrearClienteDesdeAlumno();
    this.pasoPago = 2;
  }

  cerrarModalPago(): void {
    this.mostrarModalPago = false;
    this.especieSeleccionada = null;
    this.montoPago = 0;
    this.pasoPago = 2;
    this.limpiarCliente();
    this.tipoPagoSeleccionado = null;
    this.cuentaSeleccionada = null;
    this.numeroDeposito = '';
    this.comprobanteFile = undefined;
    this.fechaDepositoDate = null;
  }

  // --- LÓGICA DE CLIENTES ---

  soloNumeros(event: any): void {
    const pattern = /[0-9\+\-\ ]/;
    let inputChar = String.fromCharCode(event.charCode);
    if (event.keyCode != 8 && !pattern.test(inputChar)) {
      event.preventDefault();
    }
  }

  /**
   * Valida el algoritmo de la cédula/RUC de Ecuador
   * Soporta Cédula (10 dígitos) y RUC Persona Natural (13 dígitos)
   */
  validarDocumentoEcuatoriano(doc: string): boolean {
    // 1. Validar longitud básica y que sean solo números
    if (!/^\d{10}(\d{3})?$/.test(doc)) return false;

    // 2. Validar código de provincia (01 al 24, o 30 para residentes en el exterior)
    const provincia = parseInt(doc.substring(0, 2), 10);
    if (provincia < 1 || (provincia > 24 && provincia !== 30)) return false;

    // 3. Validar el tercer dígito (debe ser menor a 6 para cédulas y RUC natural)
    const tercerDigito = parseInt(doc.substring(2, 3), 10);
    if (tercerDigito >= 6) return false;

    // 4. Algoritmo de Wilson (Módulo 10) sobre los primeros 9 dígitos
    const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
    const verificador = parseInt(doc.substring(9, 10), 10);
    let suma = 0;

    for (let i = 0; i < coeficientes.length; i++) {
      let paso = parseInt(doc[i], 10) * coeficientes[i];
      suma += paso > 9 ? paso - 9 : paso;
    }

    const residuo = suma % 10;
    const resultado = residuo === 0 ? 0 : 10 - residuo;

    return resultado === verificador;
  }

  buscarCliente(): void {
    // 1. Validación de campo vacío
    if (!this.documentoBusqueda || this.documentoBusqueda.trim().length === 0) {
      this.toastService.showWarning('Ingrese un documento para buscar.', 'Atención');
      return;
    }

    // 2. Validación de estructura Ecuatoriana
    const esValido = this.validarDocumentoEcuatoriano(this.documentoBusqueda.trim());
    this.documentoInvalido = !esValido;

    if (!esValido) {
      this.toastService.showError('El número ingresado no tiene un formato de cédula o RUC válido en Ecuador.', 'Documento Inválido');
      return;
    }

    // 3. Flujo normal de búsqueda
    this.buscandoCliente = true;
    this.mostrarFormularioCliente = false;
    this.clienteSeleccionado = null;

    this.clienteService.getClienteByDocumento(this.documentoBusqueda).subscribe({
      next: (res) => {
        this.buscandoCliente = false;
        let clienteExacto = null;

        if (res.isSuccess && res.data && res.data.length > 0) {
          clienteExacto = res.data.find(c =>
            String(c.documento) === String(this.documentoBusqueda) ||
            String((c as any).identificacion) === String(this.documentoBusqueda)
          );
        }

        if (clienteExacto) {
          this.clienteSeleccionado = clienteExacto;
          this.toastService.showSuccess(`Se seleccionó a ${this.clienteSeleccionado.nombres} ${this.clienteSeleccionado.apellidos}`, 'Cliente Encontrado');
          this.avanzarPasoPago();
        } else {
          this.mostrarFormularioCliente = true;
          this.nuevoCliente = {
            documento: this.documentoBusqueda,
            nombres: '',
            apellidos: '',
            correo: '',
            celular: '',
            direccion: ''
          };
          this.toastService.showInfo('El cliente no existe, por favor regístrelo.', 'No registrado');
        }
      },
      error: (err) => {
        this.buscandoCliente = false;
        this.toastService.showError('Hubo un error al buscar el cliente.', 'Error');
      }
    });
  }

  crearCliente(): void {
    if (!this.nuevoCliente.nombres || !this.nuevoCliente.apellidos || !this.nuevoCliente.documento) {
      this.toastService.showWarning('Nombres, apellidos y documento son obligatorios.', 'Campos requeridos');
      return;
    }

    this.guardandoCliente = true;
    this.clienteService.crearCliente(this.nuevoCliente).subscribe({
      next: (res) => {
        this.guardandoCliente = false;
        if (res.isSuccess) {
          this.clienteSeleccionado = { ...this.nuevoCliente, idCliente: res.data };
          this.mostrarFormularioCliente = false;
          this.toastService.showSuccess('Cliente registrado correctamente.', 'Éxito');
        } else {
          this.toastService.showError(res.message || 'No se pudo crear el cliente.', 'Error');
        }
      },
      error: () => {
        this.guardandoCliente = false;
        this.toastService.showError('Ocurrió un error en el servidor.', 'Error');
      }
    });
  }

  limpiarCliente(): void {
    this.documentoBusqueda = '';
    this.clienteSeleccionado = null;
    this.mostrarFormularioCliente = false;
    this.nuevoCliente = { documento: '', nombres: '', apellidos: '', correo: '', celular: '', direccion: '' };
  }

  avanzarPasoPago(): void {
    if (!this.clienteSeleccionado) {
      this.toastService.showWarning('Debe buscar o crear un cliente antes de continuar.', 'Requerido');
      return;
    }
    this.pasoPago = 2;
  }

  // --------------------------

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.comprobanteFile = file;
    } else {
      this.comprobanteFile = undefined;
    }
  }

  clearComprobante(): void {
    this.comprobanteFile = undefined;
  }

  getMontoPendienteEspecie(): number {
    if (!this.especieSeleccionada) return 0;
    const base = this.especieSeleccionada.montoFinal || this.especieSeleccionada.valor;
    return base - this.especieSeleccionada.valorPagado;
  }

  getTotalPendiente(): number {
    if (!this.estudianteSeleccionado) return 0;
    return this.estudianteSeleccionado.totalDeuda - this.estudianteSeleccionado.totalPagado;
  }

  isPagoValido(): boolean {
    if (!this.tipoPagoSeleccionado) return false;
    if (!this.cuentaSeleccionada) return false;  // Siempre requerida
    if (this.montoPago <= 0) return false;
    if (!this.comprobanteFile) return false;
    return true;
  }

  private construirCuotas(): { idDetalleCredito: number; valorAplicado: number; }[] {
    if (!this.especieSeleccionada) return [];

    // Si es PENDIENTE_DIFERIR (no tiene detallesCredito aún), mandamos un item con id=0
    if (this.especieSeleccionada.esPensionNoDiferida || this.especieSeleccionada.estado === 'PENDIENTE_DIFERIR') {
      return [{ idDetalleCredito: 0, valorAplicado: 0 }];
    }

    // Buscar la primer cuota que sea PARCIAL (mayor prioridad). Si no, usar la primera PENDIENTE
    let cuotaSeleccionada = this.especieSeleccionada.detallesCredito.find(
      detalle => detalle.estado?.toUpperCase() === 'PARCIAL'
    );

    if (!cuotaSeleccionada) {
      cuotaSeleccionada = this.especieSeleccionada.detallesCredito.find(
        detalle => !detalle.pagado
      );
    }

    if (cuotaSeleccionada) {
      // Enviar SOLAMENTE esta cuota; si enviamos de más o de una diferente, el backend no procesa bien el excedente a cuota inicial.
      return [{ idDetalleCredito: cuotaSeleccionada.idDetalleCredito, valorAplicado: 0 }];
    }

    // Si no hay cuotas específicas, enviamos id=0 (backend maneja)
    return [{ idDetalleCredito: 0, valorAplicado: 0 }];
  }

  confirmarPago(): void {
    if (!this.tipoPagoSeleccionado) {
      this.toastService.showWarning('Seleccione un tipo de pago', 'Campos Requeridos');
      return;
    }
    if (!this.cuentaSeleccionada) {
      this.toastService.showWarning('Seleccione una cuenta bancaria', 'Campos Requeridos');
      return;
    }
    if (this.montoPago <= 0) {
      this.toastService.showWarning('El monto debe ser mayor a $0.00', 'Monto Inválido');
      return;
    }
    if (!this.estudianteSeleccionado) return;

    const cuotas = this.construirCuotas();
    const ahora = new Date().toISOString();
    const fechaDeposito = this.fechaDepositoDate
      ? new Date(this.fechaDepositoDate).toISOString()
      : ahora;  // si no seleccionaron fecha usamos la actual

    // Reemplaza el idCliente Hardcoded por el id o documento real si existe:
    const clientId = this.clienteSeleccionado?.idCliente ?? 1;

    const request = {
      pago: {
        idTipoPago: this.tipoPagoSeleccionado,
        fechaPago: ahora,
        valorPago: this.montoPago,
        idCliente: clientId,
        fechaDeposito: fechaDeposito,
        idCuentaBancaria: this.cuentaSeleccionada,
        numeroDeposito: this.numeroDeposito || undefined,
        observaciones: this.tieneObservacionEspecial && this.observacionesPago?.trim() 
          ? this.observacionesPago.trim() 
          : undefined,
        esValidado: null,   // null = pendiente de validación por contabilidad
        usuarioRegistro: this.authService.getCurrentUser()?.id || 1,
        cuotas
      },
      distribuirExcedente: true
    };

    this.pagoService.crearPagoCredito(request, this.comprobanteFile).subscribe({
      next: (response) => {
        if (response.isSuccess) {
          this.toastService.showSuccess('El pago se ha registrado correctamente. Pendiente de validación por contabilidad.', 'Pago Exitoso');
          this.cerrarModalPago();
          // Resetear campos de observación
          this.tieneObservacionEspecial = false;
          this.observacionesPago = '';
          // Solo recargar datos del estudiante, sin abrir popup de diferir
          this.recargarEstudiante.emit(this.estudianteSeleccionado!);
          this.cargarSaldoFavor();
        } else {
          this.toastService.showError(response.message || 'No se pudo procesar el pago', 'Error en el Pago');
        }
      },
      error: (err) => {
        console.error('Error al procesar el pago:', err);
        const msg = err.error?.message || err.error?.errores || err.message || 'Error al procesar el pago.';
        this.toastService.showError(typeof msg === 'object' ? JSON.stringify(msg) : msg, 'Error del Servidor');
      }
    });
  }

  // ─── Verificar y diferir pensión ─────────────────────────────────

  private verificarYDiferirPension(): void {
    if (!this.estudianteSeleccionado) return;

    this.creditoService.getCreditosConDetallesByMatricula(this.estudianteSeleccionado.idMatricula)
      .subscribe({
        next: (creditos) => {
          const creditoPension = creditos.find(c =>
            (c.estado === 'PENDIENTE_DIFERIR') ||
            ((c.detalleEspecie?.toUpperCase().includes('PENSION') || c.detalleEspecie?.toUpperCase().includes('PENSIÓN')) &&
              (!c.detallesCredito || c.detallesCredito.length === 0))
          );

          if (creditoPension) {
            this.creditoPensionPorDiferir = creditoPension;
            this.numeroCuotasDiferir = 1;
            this.mostrarModalDiferir = true;
            this.toastService.showInfo('Ahora puede diferir el pago de la pensión en cuotas', 'Diferir Pensión');
          } else {
            this.recargarEstudiante.emit(this.estudianteSeleccionado!);
          }
        },
        error: () => {
          this.recargarEstudiante.emit(this.estudianteSeleccionado!);
        }
      });
  }

  mostrarModalDiferirPension(especie: Especie): void {
    if (!this.matriculaPagada) {
      this.mostrarToastDiferirBloqueado();
      return;
    }
    if (!this.estudianteSeleccionado) return;

    this.creditoService.getCreditosConDetallesByMatricula(this.estudianteSeleccionado.idMatricula)
      .subscribe({
        next: (creditos) => {
          const creditoPension = creditos.find(c =>
            (c.estado === 'PENDIENTE_DIFERIR') ||
            ((c.detalleEspecie?.toUpperCase().includes('PENSION') || c.detalleEspecie?.toUpperCase().includes('PENSIÓN')) &&
              (!c.detallesCredito || c.detallesCredito.length === 0))
          );

          if (creditoPension) {
            this.creditoPensionPorDiferir = creditoPension;
            this.numeroCuotasDiferir = 1;
            this.mostrarModalDiferir = true;
          } else {
            this.toastService.showWarning('No se encontró crédito de pensión para diferir', 'Advertencia');
          }
        },
        error: () => {
          this.toastService.showError('Error al obtener información del crédito', 'Error');
        }
      });
  }

  confirmarDiferimiento(): void {
    if (!this.creditoPensionPorDiferir || this.numeroCuotasDiferir < 1) {
      this.toastService.showWarning('Seleccione al menos 1 cuota', 'Inválido');
      return;
    }

    const request = { idCredito: this.creditoPensionPorDiferir.idCredito, numeroCuotas: this.numeroCuotasDiferir };

    this.creditoService.diferirCredito(request).subscribe({
      next: (response) => {
        if (response.isSuccess) {
          this.toastService.showSuccess(`La pensión se diferió en ${this.numeroCuotasDiferir} cuota(s)`, 'Diferimiento Exitoso');
          this.cerrarModalDiferir();
          this.recargarEstudiante.emit(this.estudianteSeleccionado!);
        } else {
          this.toastService.showError(response.message || 'No se pudo diferir la pensión', 'Error');
        }
      },
      error: (err) => {
        const msg = err.error?.message || err.message || 'Error al diferir la pensión.';
        this.toastService.showError(msg, 'Error del Servidor');
      }
    });
  }

  cerrarModalDiferir(): void {
    this.mostrarModalDiferir = false;
    this.creditoPensionPorDiferir = null;
    this.numeroCuotasDiferir = 1;
  }

  omitirDiferimiento(): void {
    this.cerrarModalDiferir();
    this.recargarEstudiante.emit(this.estudianteSeleccionado!);
  }

  // ─── Helpers para historial ───────────────────────────────────────

  getTotalBeneficioHistorial(pago: HistorialPago): number {
    // Busca el montoBeneficio en las cuotas pagadas del crédito correspondiente
    // Se calcula a partir del detallesCreditoAPI si está disponible
    let beneficio = 0;
    if (this.detallesCreditoAPI && pago.cuotasPagadas?.length > 0) {
      const creditoIds = [...new Set(pago.cuotasPagadas.map(c => c.idCredito))];
      creditoIds.forEach(idCredito => {
        const credito = this.detallesCreditoAPI.find((c: any) => c.idCredito === idCredito);
        if (credito?.montoBeneficio) {
          beneficio += credito.montoBeneficio;
        }
      });
    }
    return beneficio;
  }

  getTipoPagoSeverity(tipoPago: string): 'success' | 'info' | 'warn' | 'secondary' {
    const t = tipoPago?.toUpperCase() ?? '';
    if (t.includes('EFECTIVO')) return 'success';
    if (t.includes('TRANSFERENCIA')) return 'info';
    return 'secondary';
  }

  getTipoPagoIcon(tipoPago: string): string {
    const t = tipoPago?.toUpperCase() ?? '';
    if (t.includes('EFECTIVO')) return 'pi pi-money-bill';
    if (t.includes('TRANSFERENCIA')) return 'pi pi-building-columns';
    return 'pi pi-credit-card';
  }

  getEstadoPagoSeverity(estadoPago: string): 'success' | 'info' | 'warn' | 'secondary' | 'danger' {
    const estado = estadoPago?.toUpperCase() ?? '';
    if (estado === 'APROBADO') return 'success';
    if (estado === 'CANCELADO') return 'danger';
    if (estado === 'PENDIENTE') return 'warn';
    if (estado === 'RECHAZADO') return 'danger';
    return 'secondary';
  }

  abrirComprobante(path: string): void {
    if (path) {
      // Si la ruta no empieza con http o https, asumimos que es relativa al backend.
      const fullUrl = path.startsWith('http') ? path : `${API_BASE_URL}/${path}`;
      window.open(fullUrl, '_blank');
    }
  }

  // ─── Observación de Pago Individual ──────────────────────────────

  abrirModalObservacionPago(pago: HistorialPago): void {
    this.pagoObservacionSeleccionado = pago;
    this.textoObservacion = pago.observaciones || '';
    this.mostrarModalObservacion = true;
  }

  cerrarModalObservacionPago(): void {
    this.mostrarModalObservacion = false;
    this.pagoObservacionSeleccionado = null;
    this.textoObservacion = '';
    this.guardandoObservacion = false;
  }

  guardarObservacionPago(): void {
    if (!this.pagoObservacionSeleccionado) return;
    this.guardandoObservacion = true;
    const idPago = this.pagoObservacionSeleccionado.idPago;
    const nuevaObs = this.textoObservacion.trim();

    this.pagoService.actualizarObservacionPago(idPago, nuevaObs).subscribe({
      next: (res) => {
        this.guardandoObservacion = false;
        if (res.isSuccess) {
          this.toastService.showSuccess(`Observación del pago #${idPago} guardada correctamente`, 'Guardado');
          if (this.pagoObservacionSeleccionado) {
            this.pagoObservacionSeleccionado.observaciones = nuevaObs;
          }
          const pagoEnLista = this.historialPagos.find(p => p.idPago === idPago);
          if (pagoEnLista) {
            pagoEnLista.observaciones = nuevaObs;
          }
          this.cerrarModalObservacionPago();
          this.cdr.detectChanges();
        } else {
          this.toastService.showError(res.message || 'No se pudo guardar la observación', 'Error');
        }
      },
      error: (err) => {
        this.guardandoObservacion = false;
        console.error('Error al guardar observación:', err);
        this.toastService.showError(err.error?.message || err.message || 'No se pudo guardar la observación', 'Error');
      }
    });
  }

  // ─── Anulación de Arancel / Costo Extra ─────────────────────────
  abrirModalAnularEspecie(especie: Especie, event?: Event): void {
    if (event) event.stopPropagation();
    this.especieAAnular = especie;
    this.mostrarModalAnularEspecie = true;
  }

  cerrarModalAnularEspecie(): void {
    this.mostrarModalAnularEspecie = false;
    this.especieAAnular = null;
    this.anulandoEspecie = false;
  }

  confirmarAnularEspecie(): void {
    if (!this.especieAAnular) return;
    this.anulandoEspecie = true;
    this.creditoService.anularCreditoExtra(this.especieAAnular.idCredito).subscribe({
      next: (res) => {
        this.anulandoEspecie = false;
        if (res.isSuccess) {
          this.toastService.showSuccess(res.message || 'Arancel extra anulado correctamente', 'Éxito');
          this.mostrarModalAnularEspecie = false;
          this.especieAAnular = null;
          this.recargarEstudiante.emit(this.estudianteSeleccionado);
        } else {
          this.toastService.showError(res.message || 'No se pudo anular el arancel', 'Error');
        }
      },
      error: (err) => {
        this.anulandoEspecie = false;
        console.error('Error al anular arancel extra:', err);
        const msg = err.error?.message || 'Error al procesar la anulación';
        this.toastService.showError(msg, 'Error');
      }
    });
  }
}
