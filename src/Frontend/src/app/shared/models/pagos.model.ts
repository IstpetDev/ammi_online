export interface DetalleCredito {
    idDetalleCredito: number;
    numeroCuota: number;
    valor: number;
    valorCancelado: number;
    valorOriginal: number;
    saldoCuota: number;
    fechaLimite: string | null;
    estado: string;
    pagado: boolean;
}

export interface Especie {
    idEspecie: number;
    idCredito: number;       // ID del crédito al que pertenece
    nombre: string;
    tipo: 'matricula' | 'pension' | 'extra';
    estado: string;          // 'ACTIVO' | 'PENDIENTE_DIFERIR' | etc.
    ciclo: string;
    valor: number;           // montoOriginal
    montoFinal: number;      // montoFinal (montoOriginal - montoBeneficio)
    montoBeneficio: number;  // descuento aplicado
    valorPagado: number;     // pagado hasta ahora
    pagado: boolean;
    fechaLimite: string;
    detallesCredito: DetalleCredito[];
    esPensionNoDiferida?: boolean;
    esExtra?: boolean;
}

export interface PagoEstudiante {
    idMatricula: number;
    cedula: string;
    nombreEstudiante: string;
    modalidad: string;
    detalleCiclo: string;
    totalDeuda: number;
    totalBeneficio?: number;
    totalPagado: number;
    tienePagosEnRevision?: boolean;   // true si hay cuotas PENDIENTE_APROBACION
    montoEnRevision?: number;         // total de cuotas en revisión por contabilidad
    tieneObservaciones?: boolean;     // true si tiene notas/observaciones pendientes
    observaciones?: string;           // notas/observaciones del comprobante
    cargandoProgreso?: boolean;       // indica si se están consultando los créditos/pagos de la matrícula
    especies: Especie[];
    idPersona?: number;
}

export interface CuotaPagadaHistorial {
    idPagoCuota: number;
    idDetalleCredito: number;
    numeroCuota: number;
    valorAplicado: number;
    valorOriginalCuota: number;
    saldoCuota: number;
    estadoCuota: string;
    idCredito: number;
    detalleEspecie: string;
    esDiferible: boolean;
    esPension?: boolean;
    esMatricula?: boolean;
}

export interface ResumenAlumnoContabilidad {
    idPersona: number;
    idMatricula: number;
    documento: string;
    nombreCompleto: string;
    nombreCiclo: string;
    nombreCurso: string;
    saldoPendiente: number;
    saldoAprobado: number;
    saldoPendienteAprobacion: number;
}

export interface HistorialPago {
    idPago: number;
    fechaPago: string;
    valorPago: number;
    tipoPago: string;
    estadoPago: string;
    estadoCredito?: string;
    esValidado: boolean | null;
    documento: string;
    numeroDeposito: string;
    bancoDeposito: string;
    alumnoNombre: string;
    pathComprobante?: string;
    idMatricula: number;
    idCliente?: number;
    clienteNombre?: string;
    clienteDocumento?: string;
    observaciones?: string | null;
    usuarioAprueba?: number | null;
    usuarioApruebaNombre?: string | null;
    fechaAprobacion?: string | null;
    cuotasPagadas: CuotaPagadaHistorial[];
}
