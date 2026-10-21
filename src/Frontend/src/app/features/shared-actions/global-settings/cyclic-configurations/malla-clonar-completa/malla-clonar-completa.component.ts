import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageService } from 'primeng/api';
import { CicloDTO, EspecieCicloDTO, EspecieDTO, MallaDTO } from '../../../../../data/models/Entities';
import { CicloService } from '../../../../../core/services/postulaciones/ciclo.service';
import { MallaService } from '../../../../../core/services/infrastructure/malla.service';
import { EspecieService } from '../../../../../core/services/infrastructure/especie.service';
import { DuplicarMallaCompletaRequest, MallaCompletaService } from '../../../../../core/services/infrastructure/malla-completa.service';
import { EspecieCicloService } from '../../../../../core/services/infrastructure/especie-ciclo.service';
import { DetalleMallaService } from '../../../../../core/services/infrastructure/detalle-malla.service';
import { MallaRequisitosService } from '../../../../../core/services/postulaciones/malla-requisitos.service';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { SharedToastComponent } from '../../../../../shared/shared-toast/shared-toast.component';

@Component({
  selector: 'app-malla-clonar-completa',
  standalone: true,
  imports: [CommonModule,
    FormsModule,
    ButtonModule,
    SelectModule,
    InputNumberModule, SharedToastComponent],
  templateUrl: './malla-clonar-completa.component.html',
  styleUrls: ['./malla-clonar-completa.component.css'],
  providers: [MessageService]
})
export class MallaClonarCompletaComponent implements OnInit {
  clonadoModo: 'malla' | 'ciclo' = 'ciclo';

  sourceCiclos: CicloDTO[] = [];
  destinationCiclos: CicloDTO[] = [];
  especies: EspecieDTO[] = [];
  sourceMallas: MallaDTO[] = [];
  destinationMallas: MallaDTO[] = [];
  destinationEspecies: EspecieCicloDTO[] = [];

  sourceCiclo: CicloDTO | null = null;
  destinationCiclo: CicloDTO | null = null;
  selectedMalla: MallaDTO | null = null;

  idEspecie1: number | null = null;
  valorEspecie1: number | null = null;
  idEspecie2: number | null = null;
  valorEspecie2: number | null = null;

  loading = false;
  checkingDestinationEspecies = false;
  checkingDestinationMallas = false;
  destinationHasEspecies = false;
  destinationMallasError = false;

  get destinationMallasCount(): number {
    return this.destinationMallas.length;
  }

  expandedMallas: Record<number, boolean> = {};
  expandedDestinationMallas: Record<number, boolean> = {};
  mallaDetalleLoading: Record<number, boolean> = {};
  mallaDetalleError: Record<number, string | null> = {};
  mallaDetalleData: Record<number, {
    requisitos: string[];
    materias: Array<{
      asignatura: string;
      horas: number;
      area: string;
      plantilla: string;
    }>;
  }> = {};

  destinationMallaDetalleLoading: Record<number, boolean> = {};
  destinationMallaDetalleError: Record<number, string | null> = {};
  destinationMallaDetalleData: Record<number, {
    requisitos: string[];
    materias: Array<{
      asignatura: string;
      horas: number;
      area: string;
      plantilla: string;
    }>;
  }> = {};

  constructor(
    private cicloService: CicloService,
    private mallaService: MallaService,
    private especieService: EspecieService,
    private especieCicloService: EspecieCicloService,
    private detalleMallaService: DetalleMallaService,
    private mallaRequisitosService: MallaRequisitosService,
    private mallaCompletaService: MallaCompletaService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadCiclos();
    this.loadEspecies();
  }

  get sourceCicloMallasCount(): number {
    return this.sourceMallas.length;
  }

  get mallasParaClonar(): MallaDTO[] {
    if (this.clonadoModo === 'ciclo') {
      return this.sourceMallas;
    }

    return this.selectedMalla ? [this.selectedMalla] : [];
  }

  get isDestinationSpeciesInvalid(): boolean {
    return this.destinationHasEspecies && this.destinationEspecies.length < 2;
  }

  get shouldRequestEspecies(): boolean {
    return !!this.destinationCiclo?.idCiclo && !this.destinationHasEspecies;
  }

  get especiesPayload(): { idEspecie: number; valorEspecie: number }[] | null {
    if (!this.shouldRequestEspecies) {
      return null;
    }

    if (!this.idEspecie1 || !this.idEspecie2 || this.valorEspecie1 == null || this.valorEspecie2 == null) {
      return null;
    }

    if (this.idEspecie1 === this.idEspecie2 || this.valorEspecie1 < 0 || this.valorEspecie2 < 0) {
      return null;
    }

    return [
      { idEspecie: this.idEspecie1, valorEspecie: this.valorEspecie1 },
      { idEspecie: this.idEspecie2, valorEspecie: this.valorEspecie2 }
    ];
  }

  get canSubmit(): boolean {
    const hasSourceAndDestination = !!(
      this.sourceCiclo?.idCiclo &&
      this.destinationCiclo?.idCiclo &&
      this.sourceCiclo?.idCiclo !== this.destinationCiclo?.idCiclo
    );

    if (!hasSourceAndDestination || this.checkingDestinationEspecies || this.isDestinationSpeciesInvalid) {
      return false;
    }

    const hasEntityToClone = this.clonadoModo === 'malla'
      ? !!this.selectedMalla?.idMalla
      : this.sourceMallas.length > 0;

    if (!hasEntityToClone) {
      return false;
    }

    return true;
  }

  loadCiclos(): void {
    this.cicloService.getAll().subscribe({
      next: (ciclos) => {
        this.sourceCiclos = ciclos.filter(c => !c.esActivo);
        this.destinationCiclos = ciclos.filter(c => c.esActivo);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'No pudimos cargar los ciclos',
          detail: 'Inténtalo de nuevo en un momento, por favor.'
        });
      }
    });
  }

  loadEspecies(): void {
    this.especieService.getAll().subscribe({
      next: (data) => {
        this.especies = data;
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'No pudimos cargar las especies',
          detail: 'Inténtalo de nuevo en un momento, por favor.'
        });
      }
    });
  }

  onSourceCicloChange(): void {
    this.selectedMalla = null;
    this.sourceMallas = [];
    this.expandedMallas = {};
    this.mallaDetalleLoading = {};
    this.mallaDetalleError = {};
    this.mallaDetalleData = {};

    if (!this.sourceCiclo?.idCiclo) {
      return;
    }

    this.mallaService.getByCiclo(this.sourceCiclo.idCiclo).subscribe({
      next: (mallas) => {
        this.sourceMallas = mallas;

        if (this.clonadoModo === 'malla' && mallas.length === 1) {
          this.selectedMalla = mallas[0];
        }
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'No pudimos cargar las mallas',
          detail: err?.error?.message ?? 'No se pudieron cargar las mallas del ciclo de origen.'
        });
      }
    });
  }

  onDestinationCicloChange(): void {
    this.destinationHasEspecies = false;
    this.destinationMallas = [];
    this.destinationMallasError = false;
    this.expandedDestinationMallas = {};
    this.destinationMallaDetalleLoading = {};
    this.destinationMallaDetalleError = {};
    this.destinationMallaDetalleData = {};
    this.destinationEspecies = [];
    this.idEspecie1 = null;
    this.idEspecie2 = null;
    this.valorEspecie1 = null;
    this.valorEspecie2 = null;

    if (!this.destinationCiclo?.idCiclo) {
      return;
    }

    this.checkingDestinationEspecies = true;
    this.checkingDestinationMallas = true;

    let especiesError = false;
    let mallasError = false;

    this.mallaService.getByCiclo(this.destinationCiclo.idCiclo).pipe(
      catchError(() => { mallasError = true; return of([] as MallaDTO[]); }),
      switchMap(mallasDestino => {
        this.destinationMallas = mallasDestino || [];
        this.checkingDestinationMallas = false;

        if (mallasDestino.length === 0) {
          return of([] as EspecieCicloDTO[]);
        }

        return forkJoin(
          mallasDestino.map(m => this.especieCicloService.getByMalla(m.idMalla!).pipe(
            catchError(() => { especiesError = true; return of([] as EspecieCicloDTO[]); })
          ))
        ).pipe(map(arrays => arrays.flat()));
      })
    ).subscribe(especiesCiclo => {
      this.checkingDestinationEspecies = false;

      this.destinationEspecies = especiesCiclo || [];
      this.destinationHasEspecies = this.destinationEspecies.length > 0;
      this.destinationMallasError = mallasError;

      if (especiesError) {
        this.messageService.add({
          severity: 'error',
          summary: 'No pudimos revisar especies del destino',
          detail: 'No fue posible validar las especies del ciclo destino.'
        });
      } else if (this.destinationHasEspecies) {
        this.messageService.add({
          severity: 'info',
          summary: 'Ciclo destino revisado',
          detail: `Ya encontramos ${this.destinationEspecies.length} especie(s) configurada(s), no necesitas registrarlas otra vez.`
        });
      } else {
        this.messageService.add({
          severity: 'info',
          summary: 'Faltan especies por registrar',
          detail: 'Este ciclo aún no tiene especies. Ingresa 2 para continuar.'
        });
      }

      if (!mallasError) {
        this.messageService.add({
          severity: this.destinationMallas.length > 0 ? 'warn' : 'info',
          summary: 'Estado de mallas en ciclo destino',
          detail: this.destinationMallas.length > 0
            ? `El ciclo destino ya tiene ${this.destinationMallas.length} malla(s) registradas.`
            : 'El ciclo destino aún no tiene mallas registradas.'
        });
      }
    });
  }

  onModoChange(mode: 'malla' | 'ciclo'): void {
    this.clonadoModo = mode;
    if (mode === 'ciclo') {
      this.selectedMalla = null;
    }
  }

  onEspecie1Change(): void {
    if (!this.idEspecie1) {
      return;
    }

    const parId = this.findPairedEspecieId(this.idEspecie1);
    if (parId && parId !== this.idEspecie1) {
      this.idEspecie2 = parId;
    }
  }

  onEspecie2Change(): void {
    if (!this.idEspecie2) {
      return;
    }

    const parId = this.findPairedEspecieId(this.idEspecie2);
    if (parId && parId !== this.idEspecie2) {
      this.idEspecie1 = parId;
    }
  }

  ejecutarClonado(): void {
    if (!this.canSubmit || !this.sourceCiclo?.idCiclo || !this.destinationCiclo?.idCiclo) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Te faltan datos por completar',
        detail: 'Revisa los campos obligatorios antes de continuar.'
      });
      return;
    }

    if (this.clonadoModo === 'malla') {
      this.ejecutarClonadoMallaUnica();
      return;
    }

    this.ejecutarClonadoCicloCompleto();
  }

  private ejecutarClonadoMallaUnica(): void {
    if (!this.selectedMalla?.idMalla || !this.destinationCiclo?.idCiclo) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Aún falta información',
        detail: 'Selecciona una malla de origen y un ciclo destino.'
      });
      return;
    }

    const especiesPayload = this.especiesPayload;

    const payload = this.mallaCompletaService.construirRequestClonado(
      this.selectedMalla.idMalla,
      this.destinationCiclo.idCiclo,
      especiesPayload ?? undefined
    );

    this.loading = true;

    this.mallaCompletaService.clonarMallaCompleta(payload).subscribe({
      next: (response) => {
        this.loading = false;

        if (response.isSuccess) {
          this.messageService.add({
            severity: 'success',
            summary: '¡Listo!',
            detail: response.message || 'La malla se copió correctamente.'
          });
          this.resetForm();
          return;
        }

        this.messageService.add({
          severity: 'warn',
          summary: 'No se pudo completar la copia',
          detail: response.message || 'No pudimos terminar la operación. Inténtalo otra vez.'
        });
      },
      error: (err) => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Ocurrió un problema',
          detail: err?.error?.message ?? 'No pudimos copiar la malla completa.'
        });
      }
    });
  }

  private ejecutarClonadoCicloCompleto(): void {
    if (!this.destinationCiclo?.idCiclo) {
      return;
    }

    if (!this.sourceMallas.length) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No hay mallas para copiar',
        detail: 'El ciclo de origen no tiene mallas disponibles.'
      });
      return;
    }

    const especiesPayload = this.especiesPayload;

    const requests: DuplicarMallaCompletaRequest[] = this.sourceMallas
      .filter((m) => !!m.idMalla)
      .map((malla, index) =>
        this.mallaCompletaService.construirRequestClonado(
          malla.idMalla!,
          this.destinationCiclo!.idCiclo!,
          !this.destinationHasEspecies && index === 0 ? (especiesPayload ?? undefined) : undefined
        )
      );

    this.loading = true;

    this.mallaCompletaService.clonarMallasSecuencial(requests).subscribe({
      next: (responses) => {
        this.loading = false;

        const total = responses.length;
        const ok = responses.filter(r => r?.isSuccess).length;

        if (ok === total) {
          this.messageService.add({
            severity: 'success',
            summary: '¡Proceso completado!',
            detail: `Se copiaron ${ok} de ${total} mallas al ciclo destino.`
          });
          this.resetForm(false);
          return;
        }

        this.messageService.add({
          severity: 'warn',
          summary: 'Proceso completado parcialmente',
          detail: `Se copiaron ${ok} de ${total} mallas. Revisa el detalle para continuar.`
        });
      },
      error: (err) => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'No pudimos completar el proceso',
          detail: err?.error?.message ?? 'No fue posible copiar el ciclo completo.'
        });
      }
    });
  }

  getEspecieLabelById(idEspecie: number | null): string {
    if (!idEspecie) {
      return 'No seleccionada';
    }

    const detalle = this.especies.find((e) => e.idEspecie === idEspecie)?.detalle?.trim();
    return detalle || 'Especie sin nombre';
  }

  isMallaExpanded(idMalla?: number): boolean {
    return !!idMalla && !!this.expandedMallas[idMalla];
  }

  toggleMallaDetalle(malla: MallaDTO): void {
    const idMalla = malla.idMalla;
    if (!idMalla) {
      return;
    }

    const willExpand = !this.expandedMallas[idMalla];
    this.expandedMallas[idMalla] = willExpand;

    if (willExpand && !this.mallaDetalleData[idMalla] && !this.mallaDetalleLoading[idMalla]) {
      this.cargarDetalleMalla(idMalla);
    }
  }

  isDestinationMallaExpanded(idMalla?: number): boolean {
    return !!idMalla && !!this.expandedDestinationMallas[idMalla];
  }

  toggleDestinationMallaDetalle(malla: MallaDTO): void {
    const idMalla = malla.idMalla;
    if (!idMalla) {
      return;
    }

    const willExpand = !this.expandedDestinationMallas[idMalla];
    this.expandedDestinationMallas[idMalla] = willExpand;

    if (
      willExpand &&
      !this.destinationMallaDetalleData[idMalla] &&
      !this.destinationMallaDetalleLoading[idMalla]
    ) {
      this.cargarDetalleMallaDestino(idMalla);
    }
  }

  private cargarDetalleMalla(idMalla: number): void {
    this.mallaDetalleLoading[idMalla] = true;
    this.mallaDetalleError[idMalla] = null;

    forkJoin({
      detalleMalla: this.detalleMallaService.getByMalla(idMalla, 1, 1000),
      requisitosMalla: this.mallaRequisitosService.getMallaRequisitosByMalla(idMalla)
    }).subscribe({
      next: ({ detalleMalla, requisitosMalla }) => {
        const requisitos = this.uniqueValues(
          (requisitosMalla || []).map((r) => r.detalleRequisito || '').filter(Boolean)
        );

        const materias = (detalleMalla || []).map((d: any) => ({
          asignatura: d?.nombreMateria || 'Sin nombre',
          horas: Number(d?.duracionHoras ?? d?.horasMateria ?? 0),
          area: d?.nombreAreaCompetencia || 'N/A',
          plantilla: d?.nombrePlantilla || 'N/A'
        }));

        this.mallaDetalleData[idMalla] = { requisitos, materias };
        this.mallaDetalleLoading[idMalla] = false;
      },
      error: () => {
        this.mallaDetalleLoading[idMalla] = false;
        this.mallaDetalleError[idMalla] = 'No pudimos cargar el detalle de esta malla en este momento.';
      }
    });
  }

  private cargarDetalleMallaDestino(idMalla: number): void {
    this.destinationMallaDetalleLoading[idMalla] = true;
    this.destinationMallaDetalleError[idMalla] = null;

    forkJoin({
      detalleMalla: this.detalleMallaService.getByMalla(idMalla, 1, 1000),
      requisitosMalla: this.mallaRequisitosService.getMallaRequisitosByMalla(idMalla)
    }).subscribe({
      next: ({ detalleMalla, requisitosMalla }) => {
        const requisitos = this.uniqueValues(
          (requisitosMalla || []).map((r) => r.detalleRequisito || '').filter(Boolean)
        );

        const materias = (detalleMalla || []).map((d: any) => ({
          asignatura: d?.nombreMateria || 'Sin nombre',
          horas: Number(d?.duracionHoras ?? d?.horasMateria ?? 0),
          area: d?.nombreAreaCompetencia || 'N/A',
          plantilla: d?.nombrePlantilla || 'N/A'
        }));

        this.destinationMallaDetalleData[idMalla] = { requisitos, materias };
        this.destinationMallaDetalleLoading[idMalla] = false;
      },
      error: () => {
        this.destinationMallaDetalleLoading[idMalla] = false;
        this.destinationMallaDetalleError[idMalla] = 'No pudimos cargar el detalle de esta malla destino en este momento.';
      }
    });
  }

  private uniqueValues(values: string[]): string[] {
    return Array.from(new Set(values.map((v) => v.trim()).filter((v) => !!v)));
  }

  private findPairedEspecieId(idEspecie: number): number | null {
    const especieActual = this.especies.find((e) => e.idEspecie === idEspecie);
    if (!especieActual) {
      return null;
    }

    const categoria = this.getEspecieCategoria(especieActual.detalle);
    const tipo = this.getEspecieTipo(especieActual.detalle);

    if (!categoria || !tipo) {
      return null;
    }

    const tipoComplementario = tipo === 'MATRICULA' ? 'PENSION' : 'MATRICULA';

    const pareja = this.especies.find((e) => {
      if (!e.idEspecie || e.idEspecie === idEspecie) {
        return false;
      }

      return this.getEspecieCategoria(e.detalle) === categoria && this.getEspecieTipo(e.detalle) === tipoComplementario;
    });

    return pareja?.idEspecie ?? null;
  }

  private getEspecieCategoria(detalle?: string): 'FORMAL' | 'ACELERADO' | null {
    const texto = this.normalizeText(detalle);
    if (texto.includes('FORMAL')) {
      return 'FORMAL';
    }
    if (texto.includes('ACELERADO')) {
      return 'ACELERADO';
    }

    return null;
  }

  private getEspecieTipo(detalle?: string): 'MATRICULA' | 'PENSION' | null {
    const texto = this.normalizeText(detalle);
    if (texto.includes('MATRICULA')) {
      return 'MATRICULA';
    }
    if (texto.includes('PENSION')) {
      return 'PENSION';
    }

    return null;
  }

  private normalizeText(value?: string): string {
    return (value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase();
  }

  resetForm(clearSource = true): void {
    if (clearSource) {
      this.sourceCiclo = null;
      this.sourceMallas = [];
      this.selectedMalla = null;
    }

    this.destinationCiclo = null;
    this.idEspecie1 = null;
    this.valorEspecie1 = null;
    this.idEspecie2 = null;
    this.valorEspecie2 = null;
    this.destinationEspecies = [];
    this.destinationMallas = [];
    this.destinationHasEspecies = false;
    this.checkingDestinationEspecies = false;
    this.checkingDestinationMallas = false;
    this.destinationMallasError = false;
    this.expandedMallas = {};
    this.expandedDestinationMallas = {};
    this.mallaDetalleLoading = {};
    this.mallaDetalleError = {};
    this.mallaDetalleData = {};
    this.destinationMallaDetalleLoading = {};
    this.destinationMallaDetalleError = {};
    this.destinationMallaDetalleData = {};
  }
}
