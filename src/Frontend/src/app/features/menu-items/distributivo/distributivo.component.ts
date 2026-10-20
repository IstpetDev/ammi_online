
import { Component, OnInit, inject } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';

// Servicios
import { DistributivoService } from '../../../core/services/infrastructure/distributivo.service';
import { MallaService } from '../../../core/services/infrastructure/malla.service';
import { CicloService } from '../../../core/services/postulaciones/ciclo.service';
import { ParaleloService } from '../../../core/services/postulaciones/paralelo.service';

// Modelos
import {
  DistributivoDTO,
  DocenteDisponibleDTO,
  CargaDocenteDTO
} from '../../../data/models/distributivo/distributivo.model';
import { MallaDTO, CicloDTO, ParaleloDTO } from '../../../data/models/Entities';

// Componentes hijos
import { TablaDistributivoComponent } from './components/tabla-distributivo/tabla-distributivo.component';
import { ModalAsignacionComponent } from './components/modal-asignacion/modal-asignacion.component';
import { ModalAsignacionMasivaComponent } from './components/modal-asignacion-masiva/modal-asignacion-masiva.component';
import { FiltrosDistributivoComponent } from './components/filtros-distributivo/filtros-distributivo.component';
import { VistaCargaDocenteComponent } from './components/vista-carga-docente/vista-carga-docente.component';

@Component({
  selector: 'app-distributivo',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TablaDistributivoComponent,
    ModalAsignacionComponent,
    ModalAsignacionMasivaComponent,
    FiltrosDistributivoComponent,
    VistaCargaDocenteComponent,
    ButtonModule,
    TooltipModule,
    ToastModule,
    ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './distributivo.component.html',
  styleUrls: ['./distributivo.component.css']
})
export class DistributivoComponent implements OnInit {
  // Servicios
  private distributivoService = inject(DistributivoService);
  private mallaService = inject(MallaService);
  private cicloService = inject(CicloService);
  private paraleloService = inject(ParaleloService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  // Datos
  distributivos: DistributivoDTO[] = [];
  distributivosFiltrados: DistributivoDTO[] = [];
  mallas: MallaDTO[] = [];
  ciclos: CicloDTO[] = [];
  paralelos: ParaleloDTO[] = [];
  docentes: DocenteDisponibleDTO[] = [];

  // Filtros
  filtros = {
    idCiclo: null as number | null,
    idMalla: null as number | null,
    idParalelo: null as number | null,
    busqueda: ''
  };

  // Estado UI
  loading = false;
  error = '';
  vistaActual: 'tabla' | 'carga-docente' = 'tabla';

  // Modales
  showModalAsignacion = false;
  showModalMasivo = false;
  distributivoEditar: DistributivoDTO | null = null;

  // Vista carga docente
  cargaDocenteSeleccionado: CargaDocenteDTO | null = null;

  ngOnInit(): void {
    this.cargarDatosIniciales();
  }

  async cargarDatosIniciales(): Promise<void> {
    this.loading = true;
    try {
      // Cargar en paralelo
      const [distributivos, mallas, ciclos, paralelos, docentes] = await Promise.all([
        lastValueFrom(this.distributivoService.getAll()),
        lastValueFrom(this.mallaService.getAll()),
        lastValueFrom(this.cicloService.getAll()),
        lastValueFrom(this.paraleloService.getParalelos()),
        lastValueFrom(this.distributivoService.getDocentesDisponibles())
      ]);

      this.distributivos = distributivos || [];
      this.mallas = mallas || [];
      this.ciclos = ciclos || [];
      this.paralelos = paralelos || [];
      this.docentes = docentes || [];
      
      this.aplicarFiltros();
    } catch (err) {
      this.error = 'Error al cargar datos';
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar los datos del distributivo'
      });
      console.error(err);
    } finally {
      this.loading = false;
    }
  }

  onFiltrosChange(filtros: typeof this.filtros): void {
    this.filtros = filtros;
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    this.distributivosFiltrados = this.distributivos.filter(d => {
      if (this.filtros.idCiclo && d.idCiclo !== this.filtros.idCiclo) return false;
      if (this.filtros.idMalla && d.idMalla !== this.filtros.idMalla) return false;
      if (this.filtros.idParalelo && d.idParalelo !== this.filtros.idParalelo) return false;
      if (this.filtros.busqueda) {
        const busqueda = this.filtros.busqueda.toLowerCase();
        return d.nombreMateria.toLowerCase().includes(busqueda) ||
               d.nombreDocente.toLowerCase().includes(busqueda) ||
               d.nombreParalelo.toLowerCase().includes(busqueda);
      }
      return true;
    });
  }

  // Acciones
  abrirModalNuevo(): void {
    this.distributivoEditar = null;
    this.showModalAsignacion = true;
  }

  abrirModalEditar(distributivo: DistributivoDTO): void {
    this.distributivoEditar = distributivo;
    this.showModalAsignacion = true;
  }

  abrirModalMasivo(): void {
    this.showModalMasivo = true;
  }

  cerrarModales(): void {
    this.showModalAsignacion = false;
    this.showModalMasivo = false;
    this.distributivoEditar = null;
  }

  async onGuardarAsignacion(data: { idDetalleMalla: number; idPersona: number; idParalelo: number }): Promise<void> {
    try {
      if (this.distributivoEditar) {
        await lastValueFrom(this.distributivoService.update({
          idDistributivo: this.distributivoEditar.idDistributivo,
          ...data
        }));
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Asignación actualizada correctamente'
        });
      } else {
        await lastValueFrom(this.distributivoService.create(data));
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Asignación creada correctamente'
        });
      }
      this.cerrarModales();
      await this.cargarDatosIniciales();
    } catch (err: any) {
      console.error('Error al guardar:', err);
      const mensaje = err?.message || 'No se pudo guardar la asignación';
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: mensaje
      });
    }
  }

  async onGuardarMasivo(data: { idDetalleMalla: number; idPersona: number; idsParalelos: number[] }): Promise<void> {
    try {
      await lastValueFrom(this.distributivoService.createMasivo(data));
      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: `Se asignaron ${data.idsParalelos.length} paralelos correctamente`
      });
      this.cerrarModales();
      await this.cargarDatosIniciales();
    } catch (err: any) {
      console.error('Error al guardar masivo:', err);
      const mensaje = err?.message || 'No se pudo realizar la asignación masiva';
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: mensaje
      });
    }
  }

  onEliminar(id: number): void {
    this.confirmationService.confirm({
      message: '¿Está seguro de eliminar esta asignación?',
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        try {
          await lastValueFrom(this.distributivoService.delete(id));
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Asignación eliminada correctamente'
          });
          await this.cargarDatosIniciales();
        } catch (err) {
          console.error('Error al eliminar:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo eliminar la asignación'
          });
        }
      }
    });
  }

  async verCargaDocente(idPersona: number): Promise<void> {
    try {
      this.cargaDocenteSeleccionado = await lastValueFrom(this.distributivoService.getCargaDocente(idPersona)) || null;
      this.vistaActual = 'carga-docente';
    } catch (err) {
      console.error('Error al cargar carga docente:', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo cargar la información del docente'
      });
    }
  }

  volverATabla(): void {
    this.vistaActual = 'tabla';
    this.cargaDocenteSeleccionado = null;
  }
}