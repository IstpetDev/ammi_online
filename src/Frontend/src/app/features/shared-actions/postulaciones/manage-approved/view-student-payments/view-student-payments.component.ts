import { Component, Input, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';

import { CreditoService } from '../../../../../core/services/pagos/credito.service';
import { MatriculaDTO, CreditoConDetallesDTO, DetalleCreditoDTO } from '../../../../../data/models/Entities';
import { PagoEstudiante, Especie } from '../../../../../shared/models/pagos.model';
import { VerDetallesComponent } from '../../../../menu-items/pagos/ver-detalles/ver-detalles';

@Component({
  selector: 'app-view-student-payments',
  standalone: true,
  imports: [
    CommonModule,
    ProgressSpinnerModule,
    VerDetallesComponent
  ],
  providers: [MessageService],
  templateUrl: './view-student-payments.component.html',
  styleUrls: ['./view-student-payments.component.css']
})
export class ViewStudentPaymentsComponent implements OnInit, OnChanges {
  @Input() matricula: MatriculaDTO | null = null;

  loading = false;
  estudianteDetalles: PagoEstudiante | null = null;
  detallesCreditoDialog: DetalleCreditoDTO[] = [];

  private creditoService = inject(CreditoService);
  private messageService = inject(MessageService);

  ngOnInit(): void {
    if (this.matricula?.idMatricula) {
      this.cargarDetallesPagos();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['matricula'] && this.matricula?.idMatricula) {
      this.cargarDetallesPagos();
    }
  }

  cargarDetallesPagos(): void {
    const idMatricula = this.matricula?.idMatricula;
    if (!idMatricula) return;

    this.loading = true;
    const m = this.matricula!;

    const pagoBase: PagoEstudiante = {
      idMatricula: idMatricula,
      idPersona: m.idUsuarioAlumno,
      cedula: m.numeroDocumento || '',
      nombreEstudiante: [
        m.primerNombre,
        m.segundoNombre,
        m.primerApellido,
        m.segundoApellido
      ].filter(Boolean).join(' '),
      modalidad: m.detalleMalla || '',
      detalleCiclo: m.detalleCiclo || '',
      totalDeuda: 0,
      totalPagado: 0,
      especies: []
    };

    this.creditoService.getCreditosConDetallesByMatricula(idMatricula).subscribe({
      next: (creditos: CreditoConDetallesDTO[]) => {
        const especies: Especie[] = (creditos || []).map((credito: CreditoConDetallesDTO) => {
          const detalleEspecie = credito.detalleEspecie || 'Especie';
          const esPension = detalleEspecie.toUpperCase().includes('PENSION') ||
            detalleEspecie.toUpperCase().includes('PENSIÓN');
          const montoOriginal = credito.montoOriginal ?? credito.montoFinal ?? 0;
          const montoFinal = credito.montoFinal ?? 0;
          const montoBeneficio = credito.montoBeneficio ?? 0;
          const esPendienteDiferir = credito.estado === 'PENDIENTE_DIFERIR';

          let valorPagado = 0;
          if (!esPendienteDiferir && credito.detallesCredito && credito.detallesCredito.length > 0) {
            valorPagado = credito.detallesCredito.reduce((s, d) => {
              if (d.estado?.toUpperCase() === 'PENDIENTE_APROBACION') {
                return s + (d.valorOriginal ?? 0);
              }
              return s + ((d.valorOriginal ?? 0) - (d.saldoCuota ?? 0));
            }, 0);
          }

          const primeraFecha = credito.detallesCredito?.[0]?.fechaLimite ?? null;

          const todasCuotasLiquidadas = !esPendienteDiferir &&
            (credito.detallesCredito?.length ?? 0) > 0 &&
            (credito.detallesCredito ?? []).every(
              d => d.pagado === true || d.estado?.toUpperCase() === 'PENDIENTE_APROBACION'
            );

          return {
            idEspecie: credito.idCredito ?? 0,
            idCredito: credito.idCredito ?? 0,
            nombre: detalleEspecie,
            tipo: (esPension ? 'pension' : 'matricula') as 'matricula' | 'pension',
            estado: credito.estado ?? 'ACTIVO',
            ciclo: pagoBase.detalleCiclo || 'Sin ciclo',
            valor: montoOriginal,
            montoFinal: montoFinal,
            montoBeneficio: montoBeneficio,
            valorPagado: valorPagado,
            pagado: todasCuotasLiquidadas,
            fechaLimite: primeraFecha ?? (esPendienteDiferir ? 'Por definir al diferir' : 'Sin fecha'),
            detallesCredito: (credito.detallesCredito ?? []).map(d => ({
              idDetalleCredito: d.idDetalleCredito ?? 0,
              numeroCuota: d.numeroCuota ?? 0,
              valorOriginal: d.valorOriginal ?? 0,
              saldoCuota: d.saldoCuota ?? 0,
              fechaLimite: d.fechaLimite ?? null,
              estado: d.estado ?? 'PENDIENTE',
              pagado: d.pagado ?? false
            })),
            esPensionNoDiferida: esPendienteDiferir
          } as Especie;
        });

        const totalDeuda = (creditos || []).reduce((s, c) => s + (c.montoOriginal ?? c.montoFinal ?? 0), 0);

        let totalPagado = 0;
        let tienePagosEnRevision = false;
        (creditos || []).forEach(c => {
          if (c.estado === 'PENDIENTE_DIFERIR' || !c.detallesCredito || c.detallesCredito.length === 0) return;
          c.detallesCredito.forEach(d => {
            if (d.estado?.toUpperCase() === 'PENDIENTE_APROBACION') {
              totalPagado += (d.valorOriginal ?? 0);
              tienePagosEnRevision = true;
            } else {
              totalPagado += (d.valorOriginal ?? 0) - (d.saldoCuota ?? 0);
            }
          });
        });

        this.estudianteDetalles = {
          ...pagoBase,
          totalDeuda,
          totalPagado,
          tienePagosEnRevision,
          especies
        };
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando créditos del estudiante:', err);
        this.estudianteDetalles = pagoBase;
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los créditos del estudiante.'
        });
      }
    });
  }

  onRecargar(): void {
    this.cargarDetallesPagos();
  }
}
