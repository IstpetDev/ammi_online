import {
  Component, Input, Output, EventEmitter,
  OnChanges, SimpleChanges, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { TabsModule } from 'primeng/tabs';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SharedDrawerComponent } from '../../../../../shared/shared-drawer/shared-drawer.component';

// Sub-components
import { ViewStudentSubjectsComponent } from '../../../matricula/view-student-subject/view-student-subjects.component';
import { CompleteDataDialogComponent } from '../../manage-aproved/complete-data-dialog/complete-data-dialog.component';
import { ViewStudentBenefitsComponent } from '../../manage-aproved/view-student-benefits/view-student-benefits.component';
import { ViewStudentDocumentsComponent } from '../view-student-documents/view-student-documents.component';
import { ViewStudentPaymentsComponent } from '../view-student-payments/view-student-payments.component';

// Services
import { MallaParaleloService } from '../../../../../core/services/infrastructure/malla-paralelo.service';
import { MatriculaService } from '../../../../../core/services/postulaciones/matricula.service';
import { EstadoMatriculaService } from '../../../../../core/services/postulaciones/estado-matricula.service';
import { AuthService } from '../../../../../core/auth/index';

// Models
import { MatriculaDTO, MallaParaleloDTO } from '../../../../../data/models/Entities';
import { EstadoMatriculaDTO } from '../../../../../data/models/rematricula.model';
import { SharedToastComponent } from '../../../../../shared/shared-toast/shared-toast.component';

@Component({
  selector: 'app-student-panel-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TabsModule,
    ButtonModule,
    ProgressSpinnerModule,
    SelectModule,
    ConfirmDialogModule,
    ViewStudentSubjectsComponent,
    CompleteDataDialogComponent,
    ViewStudentBenefitsComponent,
    ViewStudentDocumentsComponent,
    ViewStudentPaymentsComponent,
    SharedDrawerComponent,
    SharedToastComponent
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './student-panel-dialog.component.html',
  styleUrls: ['./student-panel-dialog.component.css']
})
export class StudentPanelDialogComponent implements OnChanges {

  @Input() matricula: MatriculaDTO | null = null;
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() onSaved = new EventEmitter<void>();

  // ── Tab state ──────────────────────────────────
  private _activeTab = '0';

  get activeTab(): string { return this._activeTab; }

  set activeTab(value: string) {
    this._activeTab = value;
    if (value !== '3') {
      this.showCompleteData = false;
    }
  }

  // ── Tab 0: Materias + Editar Matrícula ─────────
  mallaParalelos: MallaParaleloDTO[] = [];
  estadosMatricula: EstadoMatriculaDTO[] = [];
  estadoInicialMatriculaId: number | null = null;
  loadingParalelos = false;
  editForm: { idMallaParalelo: number | undefined; idEstadoMatricula: number | null } = {
    idMallaParalelo: undefined,
    idEstadoMatricula: null
  };
  saving = false;

  // ── Tab 1: Completar Datos ─────────────────────
  showCompleteData = false;

  // ── Services ───────────────────────────────────
  private mallaParaleloService = inject(MallaParaleloService);
  private matriculaService = inject(MatriculaService);
  private estadoMatriculaService = inject(EstadoMatriculaService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  // ── Lifecycle ──────────────────────────────────
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']) {
      if (this.visible && this.matricula) {
        this._activeTab = '0';
        this.resetState();
        this.cargarEstadosMatricula();
        this.initMateriasTab();
      } else if (!this.visible) {
        this.showCompleteData = false;
      }
    }
  }

  // ── Internals ──────────────────────────────────
  private resetState(): void {
    this.mallaParalelos = [];
    this.estadosMatricula = [];
    this.estadoInicialMatriculaId = null;
    this.editForm = {
      idMallaParalelo: undefined,
      idEstadoMatricula: null
    };
    this.saving = false;
    this.showCompleteData = false;
  }

  private cargarEstadosMatricula(): void {
    this.estadoMatriculaService.getAll().subscribe({
      next: (items) => {
        this.estadosMatricula = items ?? [];
        // Prefer the backend-provided idEstadoMatricula when available on the matrícula
        let estadoInicial: number | null = null;
        const idEstadoFromMatricula = this.matricula ? (this.matricula as any).idEstadoMatricula : null;
        if (idEstadoFromMatricula && this.estadosMatricula.find(e => e.idEstadoMatricula === idEstadoFromMatricula)) {
          estadoInicial = idEstadoFromMatricula;
        } else {
          estadoInicial = this.inferirEstadoActualDesdeMatricula();
        }

        this.estadoInicialMatriculaId = estadoInicial;
        this.editForm.idEstadoMatricula = estadoInicial;
      },
      error: () => {
        this.estadosMatricula = [];
        this.estadoInicialMatriculaId = null;
        this.editForm.idEstadoMatricula = null;
        this.messageService.add({
          severity: 'warn',
          summary: 'Aviso',
          detail: 'No se pudo cargar el catálogo de estados de matrícula.'
        });
      }
    });
  }

  private inferirEstadoActualDesdeMatricula(): number | null {
    if (!this.matricula || !this.estadosMatricula.length) return null;

    const normalize = (value: string | undefined | null): string =>
      (value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

    const isFinalizada = !!((this.matricula && (this.matricula as any).esFinalizada) || (this.matricula && (this.matricula as any).estadoCompletado) || false);
    if (isFinalizada) {
      const porDetalle = this.estadosMatricula.find(e => {
        const d = normalize(e.detalle);
        return d.includes('aprob') || d.includes('finaliz') || d.includes('complet');
      });
      return porDetalle?.idEstadoMatricula
        ?? this.estadosMatricula.find(e => e.completado)?.idEstadoMatricula
        ?? this.estadosMatricula[0]?.idEstadoMatricula
        ?? null;
    }

    const porDetalle = this.estadosMatricula.find(e => {
      const d = normalize(e.detalle);
      return d.includes('curso') || d.includes('activo') || d.includes('proceso');
    });
    return porDetalle?.idEstadoMatricula
      ?? this.estadosMatricula.find(e => !e.completado)?.idEstadoMatricula
      ?? this.estadosMatricula[0]?.idEstadoMatricula
      ?? null;
  }

  private initMateriasTab(): void {
    if (!this.matricula?.idMalla) return;
    this.loadingParalelos = true;
    this.mallaParaleloService.getByMalla(this.matricula.idMalla).subscribe({
      next: (data) => {
        this.mallaParalelos = data.filter(mp => mp.esActivo);
        this.loadingParalelos = false;
      },
      error: () => { this.loadingParalelos = false; }
    });
  }

  // ── Tab 0 helpers ──────────────────────────────
  get idMalla(): number | null {
    return this.matricula?.idMalla ?? null;
  }

  get estadoLabel(): string {
    if (!this.matricula) return 'En curso';
    // Prefer the catalog label if available
    if (this.estadoInicialMatriculaId != null && this.estadosMatricula.length) {
      const e = this.estadosMatricula.find(x => x.idEstadoMatricula === this.estadoInicialMatriculaId);
      if (e) return e.detalle;
    }
    // If backend provided a textual detalle, prefer it
    if ((this.matricula as any).detalleEstado) return (this.matricula as any).detalleEstado;

    // Fallback to boolean/completed flag
    if (this.matricula.esFinalizada || (this.matricula as any).estadoCompletado) return 'Aprobada';
    return 'En curso';
  }

  private normalizarTexto(value: string | undefined | null): string {
    return (value || '')
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  }

  esParaleloActual(mp: MallaParaleloDTO): boolean {
    // 1) Match por idParalelo cuando esté disponible
    if (this.matricula?.idParalelo && mp.idParalelo) {
      return mp.idParalelo === this.matricula.idParalelo;
    }

    // 2) Fallback por nombre de paralelo (ej: "A")
    const actual = this.normalizarTexto(this.matricula?.detalleParalelo);
    const candidato = this.normalizarTexto(mp.nombreParalelo);
    return !!actual && !!candidato && actual === candidato;
  }

  getCuposOcupados(mp: MallaParaleloDTO): number {
    return mp.alumnosMatriculados ?? mp.cantidadAlumnos ?? 0;
  }

  getCuposDisponibles(mp: MallaParaleloDTO): number {
    const max = mp.cupoMaximo ?? 0;
    const ocupados = this.getCuposOcupados(mp);
    return Math.max(max - ocupados, 0);
  }

  get paraleloSeleccionado(): MallaParaleloDTO | undefined {
    return this.mallaParalelos.find(mp => mp.idMallaParalelo === this.editForm.idMallaParalelo);
  }

  get mallaParalelosDisponiblesCambio(): MallaParaleloDTO[] {
    return this.mallaParalelos.filter(mp => !this.esParaleloActual(mp));
  }

  private getCurrentMallaParaleloId(): number | null {
    if (!this.matricula) return null;

    // Prioridad 1: match por idParalelo
    if (this.matricula.idParalelo) {
      const byIdParalelo = this.mallaParalelos.find(mp => mp.idParalelo === this.matricula!.idParalelo);
      if (byIdParalelo?.idMallaParalelo) return byIdParalelo.idMallaParalelo;
    }

    // Prioridad 2: fallback por nombre de paralelo
    const actual = this.normalizarTexto(this.matricula.detalleParalelo);
    const byNombre = this.mallaParalelos.find(mp => this.normalizarTexto(mp.nombreParalelo) === actual);
    if (byNombre?.idMallaParalelo) return byNombre.idMallaParalelo;

    return null;
  }

  guardarEdicion(): void {
    // Validar que existan cambios pendientes
    if (!this.hasPendingChanges()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sin cambios',
        detail: 'No se han realizado cambios para guardar.'
      });
      return;
    }

    // Si intenta cambiar paralelo pero la matrícula está finalizada, bloquear
    const paraleloDestino = this.paraleloSeleccionado;
    const paraleloChanged = !!paraleloDestino && !this.esParaleloActual(paraleloDestino);

    if (!!this.matricula?.esFinalizada && paraleloChanged) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Acción no permitida',
        detail: 'No se puede cambiar el paralelo porque la matrícula está finalizada.'
      });
      return;
    }

    // Si se está cambiando paralelo, pedir confirmación específica por pérdida de notas
    if (paraleloChanged) {
      if (paraleloDestino && this.esParaleloActual(paraleloDestino)) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Acción no permitida',
          detail: 'No puede cambiar al mismo paralelo que ya tiene asignado.'
        });
        return;
      }

      this.confirmationService.confirm({
        header: 'Confirmar cambio de paralelo',
        message: 'Advertencia: cambiar de paralelo eliminará todas las notas registradas de esta matrícula. ¿Desea continuar?',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Sí, cambiar paralelo',
        rejectLabel: 'Cancelar',
        accept: () => this.ejecutarGuardadoMatricula(),
        reject: () => { }
      });
      return;
    }

    // Si sólo cambia el estado (sin cambiar paralelo), guardar directamente
    this.ejecutarGuardadoMatricula();
  }

  hasPendingChanges(): boolean {
    if (!this.matricula) return false;
    const estadoChanged = this.editForm.idEstadoMatricula !== this.estadoInicialMatriculaId;
    const paraleloDestino = this.paraleloSeleccionado;
    const paraleloChanged = !!paraleloDestino && !this.esParaleloActual(paraleloDestino);
    return estadoChanged || paraleloChanged;
  }

  private ejecutarGuardadoMatricula(): void {
    if (!this.matricula?.idMatricula || !this.matricula?.idUsuarioAlumno) {
      return;
    }

    if (this.editForm.idEstadoMatricula == null) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Datos incompletos',
        detail: 'Debe seleccionar un estado de matrícula.'
      });
      return;
    }

    const paraleloDestino = this.paraleloSeleccionado;
    const paraleloChanged = !!paraleloDestino && !this.esParaleloActual(paraleloDestino);
    const estadoChanged = this.editForm.idEstadoMatricula !== this.estadoInicialMatriculaId;

    if (!paraleloChanged && !estadoChanged) {
      return;
    }

    const idMallaParaleloActual = this.getCurrentMallaParaleloId();
    const idMallaParaleloToSend = paraleloChanged
      ? (this.editForm.idMallaParalelo ?? null)
      : idMallaParaleloActual;

    if (!idMallaParaleloToSend || idMallaParaleloToSend <= 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Datos incompletos',
        detail: 'No se pudo determinar el paralelo actual de la matrícula para enviar la actualización.'
      });
      return;
    }

    this.saving = true;
    const payload = {
      idMatricula: this.matricula!.idMatricula,
      idUsuarioAlumno: this.matricula!.idUsuarioAlumno,
      idMallaParalelo: idMallaParaleloToSend,
      idEstadoMatricula: this.editForm.idEstadoMatricula
    };

    this.matriculaService.actualizarMatricula(payload).subscribe({
      next: () => {
        this.saving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Actualizado',
          detail: 'Matrícula actualizada correctamente'
        });
        this.onSaved.emit();
      },
      error: () => {
        this.saving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo actualizar la matrícula'
        });
      }
    });
  }

  // ── Tab 1 helpers ──────────────────────────────
  onCompleteDataSaved(): void {
    this.showCompleteData = false;
    this.onSaved.emit();
  }

  // ── Tab 2 helpers ──────────────────────────────
  get idPersona(): number | null {
    return this.matricula?.idUsuarioAlumno ?? null;
  }

  get idCiclo(): number | null {
    return this.matricula?.idCiclo ?? null;
  }

  get idAprobadoPor(): number | null {
    return this.authService.getCurrentUser()?.id ?? null;
  }

  // ── Dialog close ──────────────────────────────
  closeDialog(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }
}
