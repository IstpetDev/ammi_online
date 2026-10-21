import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';

// Shared
import { ConfirmationModalComponent } from '../../../../../shared/modal-confirmation/confirmation-modal.component';

// Services
import { EspecieCicloService } from '../../../../../core/services/infrastructure/especie-ciclo.service';
import { EspecieService } from '../../../../../core/services/infrastructure/especie.service';
import { CicloService } from '../../../../../core/services/postulaciones/ciclo.service';
import { MallaService } from '../../../../../core/services/infrastructure/malla.service';
import { PeriodoLectivoService } from '../../../../../core/services/postulaciones/periodo-lectivo.service';

// Models
import { EspecieCicloDTO, EspecieDTO, CicloDTO, MallaDTO, PeriodoLectivoDTO } from '../../../../../data/models/Entities';
import { SharedToastComponent } from '../../../../../shared/shared-toast/shared-toast.component';

@Component({
  selector: 'app-especie-ciclo',
  standalone: true,
  imports: [CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    ConfirmDialogModule,
    DialogModule,
    SelectModule,
    InputNumberModule,
    TooltipModule,
    ConfirmationModalComponent, SharedToastComponent],
  providers: [MessageService, ConfirmationService],
  templateUrl: './especie-ciclo.component.html',
  styleUrls: ['./especie-ciclo.component.css']
})
export class EspecieCicloComponent implements OnInit {
  // Services
  private especieCicloService = inject(EspecieCicloService);
  private especieService = inject(EspecieService);
  private cicloService = inject(CicloService);
  private mallaService = inject(MallaService);
  private periodoService = inject(PeriodoLectivoService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  // Data
  especiesCiclo: EspecieCicloDTO[] = [];
  especies: EspecieDTO[] = [];
  periodos: PeriodoLectivoDTO[] = [];
  ciclos: CicloDTO[] = [];
  mallas: MallaDTO[] = [];
  especieCicloSeleccionada: EspecieCicloDTO | null = null;

  // Filtros
  selectedPeriodo: PeriodoLectivoDTO | null = null;
  selectedCiclo: CicloDTO | null = null;

  // UI state
  loading = false;
  saving = false;
  showDialog = false;
  showDuplicarDialog = false;
  isEditing = false;

  // Form
  especieCicloForm: EspecieCicloDTO = {
    idMalla: undefined,
    idEspecie: undefined,
    valorEspecie: 0
  };

  // Duplicar form
  duplicarForm = {
    mallaOrigen: null as MallaDTO | null,
    mallaDestino: null as MallaDTO | null
  };

  sourceMallas: MallaDTO[] = [];
  destinationMallas: MallaDTO[] = [];
  allMallasForDuplicate: MallaDTO[] = [];
  showAllSource: boolean = false;
  showAllDest: boolean = false;

  // Confirm delete
  showConfirmDeleteEspecie = false;
  especieToDelete: any | null = null;

  ngOnInit(): void {
    this.cargarDatos();
  }

  /**
   * Cuando cambia el período: carga ciclos y luego mallas y sus especies
   */
  onPeriodoChange(): void {
    this.selectedCiclo = null;
    this.ciclos = [];
    this.mallas = [];
    this.especiesCiclo = [];

    if (this.selectedPeriodo?.idPeriodoLectivo) {
      this.loading = true;
      this.cicloService.getByPeriodo(this.selectedPeriodo.idPeriodoLectivo).subscribe({
        next: (data) => {
          this.ciclos = (data || []).filter(c => c.esActivo === true);
          this.loading = false;
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los ciclos' });
          this.loading = false;
        }
      });
    }
  }

  /**
   * Cuando cambia el ciclo: carga mallas del ciclo y sus especies
   */
  onCicloChange(): void {
    this.mallas = [];
    this.especiesCiclo = [];

    if (!this.selectedCiclo?.idCiclo) {
      return;
    }

    this.cargarEspeciesPorCicloSeleccionado();
  }

   
  getHintEspecieSelect(): string | null {
    const idMalla = this.especieCicloForm?.idMalla;
    if (!idMalla) return null;
    const especiesAsignadas = this.getEspeciesAsignadasPorMalla(idMalla) || [];
    const tieneMatricula = especiesAsignadas.some((ec: any) => this.isMatriculaEspecie(this.getEspecieById(ec.idEspecie) || {} as any));
    const tienePension = especiesAsignadas.some((ec: any) => this.isPensionEspecie(this.getEspecieById(ec.idEspecie) || {} as any));
    if (especiesAsignadas.length === 0 || !tieneMatricula) {
      return 'Esta malla requiere registrar Matrícula primero';
    }
    if (!tienePension) {
      return 'Ahora corresponde registrar Pensión';
    }
    return null;
  }
  /**
   * Carga mallas de todos los ciclos del período y luego las EspecieCiclo de cada malla
   */
  cargarEspeciesPorCicloSeleccionado(): void {
    if (!this.selectedCiclo?.idCiclo) {
      this.mallas = [];
      this.especiesCiclo = [];
      this.loading = false;
      return;
    }

    this.loading = true;
    this.mallaService.getByCiclo(this.selectedCiclo.idCiclo).subscribe({
      next: (mallas) => {
        this.mallas = mallas || [];

        if (!this.mallas.length) {
          this.especiesCiclo = [];
          this.loading = false;
          return;
        }

        forkJoin(this.mallas.map(m => this.especieCicloService.getByMalla(m.idMalla!))).subscribe({
          next: (especieArrays) => {
            this.especiesCiclo = especieArrays.flat();
            this.loading = false;
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las especies de las mallas' });
            this.loading = false;
          }
        });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las mallas' });
        this.loading = false;
      }
    });
  }

  /**
   * Agrupa las especies por malla. Muestra todas las mallas del período.
   */
  get especiesPorMalla(): any[] {
    return this.mallas.map(malla => ({
      idMalla: malla.idMalla,
      nombreMalla: malla.detalle || `Malla ${malla.idMalla}`,
      detalleCiclo: malla.detalleCiclo || '',
      especies: this.especiesCiclo
        .filter(ec => ec.idMalla === malla.idMalla)
        .map(ec => ({
          idEspecie: ec.idEspecie,
          nombreEspecie: this.getNombreEspecie(ec.idEspecie),
          valor: ec.valorEspecie,
          especieCiclo: ec
        }))
    }));
  }

  get especiesDisponibles(): EspecieDTO[] {
    const idMallaContexto = this.especieCicloForm.idMalla;
    if (!idMallaContexto) return this.especies.filter(e => e.activo !== false);

    const especiesActivas = this.especies.filter(e => e.activo !== false);

    if (this.isEditing) {
      const asignadas = new Set(
        this.especiesCiclo
          .filter(ec => ec.idMalla === idMallaContexto && ec.idEspecie !== this.especieCicloSeleccionada?.idEspecie)
          .map(ec => ec.idEspecie)
      );
      return especiesActivas.filter(e => !asignadas.has(e.idEspecie));
    } else {
      const especiesAsignadas = this.getEspeciesAsignadasPorMalla(idMallaContexto);

      // Máximo 2 especies por malla
      if (especiesAsignadas.length >= 2) {
        return [];
      }

      const asignadas = new Set(
        especiesAsignadas.map(ec => ec.idEspecie)
      );

      // Regla solicitada (orden por tipo faltante):
      // 1) Si falta matrícula, mostrar solo matrícula.
      // 2) Si ya hay matrícula y falta pensión, mostrar solo pensión.
      const tieneMatricula = especiesAsignadas.some(ec => this.isMatriculaEspecie(this.getEspecieById(ec.idEspecie)));
      const tienePension = especiesAsignadas.some(ec => this.isPensionEspecie(this.getEspecieById(ec.idEspecie)));

      if (!tieneMatricula) {
        return especiesActivas.filter(e => !!e.idEspecie && !asignadas.has(e.idEspecie) && this.isMatriculaEspecie(e));
      }

      if (!tienePension) {
        return especiesActivas.filter(e => !!e.idEspecie && !asignadas.has(e.idEspecie) && this.isPensionEspecie(e));
      }

      return [];
    }
  }

  private getEspeciesAsignadasPorMalla(idMalla: number): EspecieCicloDTO[] {
    return this.especiesCiclo.filter(ec => ec.idMalla === idMalla);
  }

  private getEspecieById(idEspecie?: number): EspecieDTO | undefined {
    if (!idEspecie) return undefined;
    return this.especies.find(e => e.idEspecie === idEspecie);
  }

  private isMatriculaEspecie(especie?: EspecieDTO): boolean {
    if (!especie) return false;

    const detalle = this.normalizeText(especie.detalle);
    const byDetalle = detalle.includes('matricula');

    if (especie.esMatricula === true && especie.esPension !== true) return true;
    if (especie.esMatricula === true && especie.esPension === true) return byDetalle;
    if (especie.esMatricula !== true) return byDetalle;

    return false;
  }

  private isPensionEspecie(especie?: EspecieDTO): boolean {
    if (!especie) return false;

    const detalle = this.normalizeText(especie.detalle);
    const byDetalle = detalle.includes('pension');

    if (especie.esPension === true && especie.esMatricula !== true) return true;
    if (especie.esPension === true && especie.esMatricula === true) return byDetalle;
    if (especie.esPension !== true) return byDetalle;

    return false;
  }

  private normalizeText(value: string | undefined | null): string {
    return (value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private preselectEspecieForCurrentMalla(): void {
    const opciones = this.especiesDisponibles;
    if (!opciones.length) {
      this.especieCicloForm.idEspecie = undefined;
      return;
    }

    const idMalla = this.especieCicloForm.idMalla;
    const malla = this.mallas.find(m => m.idMalla === idMalla);
    const mallaDetalle = this.normalizeText(malla?.detalle);

    const mallaTokens = mallaDetalle
      .split(/\s+/)
      .map(t => t.trim())
      .filter(t => t.length >= 3);

    const porNombreMalla = opciones.find(e => {
      const detalleEspecie = this.normalizeText(e.detalle);
      return mallaTokens.some(token => detalleEspecie.includes(token));
    });

    this.especieCicloForm.idEspecie = porNombreMalla?.idEspecie ?? opciones[0].idEspecie;
  }

  private updateFilteredMallas(): void {
    const inactive = this.allMallasForDuplicate.filter(m => !m.cicloEsActivo);
    this.sourceMallas = this.showAllSource ? inactive : inactive.slice(0, 10);
    const active = this.allMallasForDuplicate.filter(m => m.cicloEsActivo);
    this.destinationMallas = this.showAllDest ? active : active.slice(0, 10);
  }

  toggleShowAllSource(): void {
    this.showAllSource = true;
    this.updateFilteredMallas();
  }

  toggleShowAllDest(): void {
    this.showAllDest = true;
    this.updateFilteredMallas();
  }

  get inactiveMallasCount(): number {
    return this.allMallasForDuplicate.filter(m => !m.cicloEsActivo).length;
  }

  get activeMallasCount(): number {
    return this.allMallasForDuplicate.filter(m => m.cicloEsActivo).length;
  }

  /**
   * Cargar datos iniciales
   */
  cargarDatos(): void {
    this.loading = true;
    let loadedCount = 0;
    const totalLoads = 2;

    const checkComplete = () => {
      loadedCount++;
      if (loadedCount >= totalLoads) {
        this.loading = false;
      }
    };

    this.periodoService.getPeriodosLectivos().subscribe({
      next: (data) => { this.periodos = data; checkComplete(); },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los períodos' });
        checkComplete();
      }
    });

    this.especieService.getAll().subscribe({
      next: (data) => { this.especies = data; checkComplete(); },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las especies' });
        checkComplete();
      }
    });

    // Cargar todas las mallas para el diálogo de duplicar
    this.mallaService.getAll().subscribe({
      next: (data) => { this.allMallasForDuplicate = data; this.updateFilteredMallas(); },
      error: () => {}
    });
  }

  nuevaEspecieCiclo(): void {
    this.isEditing = false;
    this.especieCicloForm = { idMalla: undefined, idEspecie: undefined, valorEspecie: 0 };
    this.showDialog = true;
  }

  agregarEspecieEnMalla(mallaGroup: any): void {
    const especiesAsignadas = this.getEspeciesAsignadasPorMalla(mallaGroup.idMalla);
    if (especiesAsignadas.length >= 2) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Límite alcanzado',
        detail: 'Esta malla ya tiene 2 especies configuradas (máximo permitido).'
      });
      return;
    }

    this.isEditing = false;
    this.especieCicloForm = { idMalla: mallaGroup.idMalla, idEspecie: undefined, valorEspecie: 0 };
    this.preselectEspecieForCurrentMalla();
    this.showDialog = true;
  }

  editarEspecieCiclo(especieCiclo: EspecieCicloDTO): void {
    this.isEditing = true;
    this.especieCicloSeleccionada = especieCiclo;
    this.especieCicloForm = { ...especieCiclo };
    this.showDialog = true;
  }

  guardarEspecieCiclo(): void {
    if (!this.especieCicloForm.idEspecie || !this.especieCicloForm.idMalla || this.especieCicloForm.valorEspecie === undefined) {
      this.messageService.add({ severity: 'warn', summary: 'Campos requeridos', detail: 'Debe seleccionar especie y definir un valor' });
      return;
    }

    if (!this.isEditing) {
      const especiesAsignadas = this.getEspeciesAsignadasPorMalla(this.especieCicloForm.idMalla);
      if (especiesAsignadas.length >= 2) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Límite alcanzado',
          detail: 'No puede registrar más de 2 especies por malla.'
        });
        return;
      }
    }

    if (this.especieCicloForm.valorEspecie! <= 0) {
      this.messageService.add({ severity: 'warn', summary: 'Valor inválido', detail: 'El valor debe ser mayor a cero' });
      return;
    }

    this.saving = true;

    if (this.isEditing && this.especieCicloSeleccionada) {
      const dataToUpdate = { ...this.especieCicloSeleccionada, ...this.especieCicloForm };
      this.especieCicloService.update(dataToUpdate).subscribe({
        next: () => {
          this.saving = false;
          this.showDialog = false;
          this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Especie por malla actualizada correctamente' });
          this.cargarEspeciesPorCicloSeleccionado();
        },
        error: () => {
          this.saving = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar la especie por malla' });
        }
      });
    } else {
      this.especieCicloService.create(this.especieCicloForm).subscribe({
        next: () => {
          this.saving = false;
          this.showDialog = false;
          this.messageService.add({ severity: 'success', summary: 'Creado', detail: 'Especie por malla creada correctamente' });
          this.cargarEspeciesPorCicloSeleccionado();
        },
        error: () => {
          this.saving = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear la especie por malla' });
        }
      });
    }
  }

  confirmarEliminarEspecie(especie: any): void {
    this.especieToDelete = especie;
    this.showConfirmDeleteEspecie = true;
  }

  ejecutarEliminarEspecie(): void {
    if (!this.especieToDelete?.especieCiclo?.idEspecieCiclo) return;
    this.especieCicloService.delete(this.especieToDelete.especieCiclo.idEspecieCiclo).subscribe({
      next: (success) => {
        if (success) {
          this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Especie eliminada correctamente' });
          this.cargarEspeciesPorCicloSeleccionado();
        }
        this.showConfirmDeleteEspecie = false;
        this.especieToDelete = null;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la especie' });
        this.showConfirmDeleteEspecie = false;
        this.especieToDelete = null;
      }
    });
  }

  cancelarEliminar(): void {
    this.showConfirmDeleteEspecie = false;
    this.especieToDelete = null;
  }

  cerrarDialog(): void {
    this.showDialog = false;
    this.especieCicloSeleccionada = null;
    this.especieCicloForm = { idMalla: undefined, idEspecie: undefined, valorEspecie: 0 };
  }

  /**
   * Abrir diálogo de duplicación entre mallas
   */
  duplicarDelCicloAnterior(): void {
    this.duplicarForm = { mallaOrigen: null, mallaDestino: null };
    this.showAllSource = false;
    this.showAllDest = false;
    this.updateFilteredMallas();
    this.showDuplicarDialog = true;
  }

  ejecutarDuplicacionDesdeDialogo(): void {
    if (!this.duplicarForm.mallaOrigen || !this.duplicarForm.mallaDestino) {
      this.messageService.add({ severity: 'warn', summary: 'Campos requeridos', detail: 'Debe seleccionar tanto la malla origen como la malla destino' });
      return;
    }

    if (this.duplicarForm.mallaOrigen.idMalla === this.duplicarForm.mallaDestino.idMalla) {
      this.messageService.add({ severity: 'warn', summary: 'Mallas iguales', detail: 'La malla origen y destino no pueden ser la misma' });
      return;
    }

    this.loading = true;
    this.especieCicloService.getByMalla(this.duplicarForm.mallaOrigen.idMalla!).subscribe({
      next: (configuracionesOrigen) => {
        this.loading = false;
        if (configuracionesOrigen.length === 0) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Sin configuraciones',
            detail: `La malla "${this.duplicarForm.mallaOrigen!.detalle}" no tiene configuraciones para duplicar`
          });
          return;
        }
        this.showDuplicarDialog = false;
        this.ejecutarDuplicacion(this.duplicarForm.mallaOrigen!, this.duplicarForm.mallaDestino!, configuracionesOrigen);
      },
      error: () => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la malla origen' });
      }
    });
  }

  private ejecutarDuplicacion(mallaAnterior: MallaDTO, mallaActual: MallaDTO, configuracionesAnteriores: EspecieCicloDTO[]): void {
    this.saving = true;

    const nuevasConfiguraciones: EspecieCicloDTO[] = configuracionesAnteriores.map(config => ({
      idMalla: mallaActual.idMalla,
      idEspecie: config.idEspecie,
      valorEspecie: config.valorEspecie
    }));

    let completadas = 0;
    const total = nuevasConfiguraciones.length;
    let errores = 0;

    nuevasConfiguraciones.forEach(config => {
      this.especieCicloService.create(config).subscribe({
        next: () => {
          completadas++;
          if (completadas + errores >= total) {
            this.finalizarDuplicacion(completadas, errores, mallaActual);
          }
        },
        error: () => {
          errores++;
          if (completadas + errores >= total) {
            this.finalizarDuplicacion(completadas, errores, mallaActual);
          }
        }
      });
    });
  }

  private finalizarDuplicacion(completadas: number, errores: number, mallaActual: MallaDTO): void {
    this.saving = false;

    if (errores === 0) {
      this.messageService.add({
        severity: 'success',
        summary: 'Duplicación exitosa',
        detail: `Se duplicaron ${completadas} configuración(es) a la malla "${mallaActual.detalle}"`
      });
    } else if (completadas > 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Duplicación parcial',
        detail: `Se duplicaron ${completadas} configuración(es), pero ${errores} fallaron`
      });
    } else {
      this.messageService.add({ severity: 'error', summary: 'Error en duplicación', detail: 'No se pudo duplicar ninguna configuración' });
    }

    if (this.selectedPeriodo?.idPeriodoLectivo && this.selectedCiclo?.idCiclo) {
      this.cargarEspeciesPorCicloSeleccionado();
    } else {
      this.cargarDatos();
    }
  }

  cerrarDuplicarDialog(): void {
    this.showDuplicarDialog = false;
    this.duplicarForm = { mallaOrigen: null, mallaDestino: null };
  }

  getMallaLabel(malla: MallaDTO): string {
    return malla.detalleCiclo ? `${malla.detalle} — ${malla.detalleCiclo}` : (malla.detalle || `Malla ${malla.idMalla}`);
  }

  getNombreEspecie(idEspecie?: number): string {
    if (!idEspecie) return '';
    const especie = this.especies.find(e => e.idEspecie === idEspecie);
    return especie?.detalle || `Especie ${idEspecie}`;
  }
}
