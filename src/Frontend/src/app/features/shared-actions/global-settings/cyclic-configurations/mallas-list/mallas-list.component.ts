import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { MallaDTO, CursoDTO, CicloDTO, PeriodoLectivoDTO } from '../../../../../data/models/Entities';
import { MallaService } from '../../../../../core/services/infrastructure/malla.service';
import { CursoService } from '../../../../../core/services/infrastructure/curso.service';
import { CicloService } from '../../../../../core/services/postulaciones/ciclo.service';
import { PeriodoLectivoService } from '../../../../../core/services/postulaciones/periodo-lectivo.service';
import { ConfirmationModalComponent } from '../../../../../shared/modal-confirmation/confirmation-modal.component';
import { MessageService } from 'primeng/api';
import { SharedToastComponent } from '../../../../../shared/shared-toast/shared-toast.component';

@Component({
  selector: 'app-mallas-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, TableModule, DialogModule, ButtonModule, InputTextModule, InputNumberModule, SelectModule, DividerModule, TooltipModule, ConfirmationModalComponent, SharedToastComponent],
  templateUrl: './mallas-list.component.html',
  styleUrls: ['./mallas-list.component.css'],
  providers: [MessageService]
})
export class MallasListComponent implements OnInit {
  mallas: MallaDTO[] = [];
  cursos: CursoDTO[] = [];
  periodos: PeriodoLectivoDTO[] = [];
  ciclos: CicloDTO[] = [];
  selectedPeriodo: PeriodoLectivoDTO | null = null;
  selectedCiclo: CicloDTO | null = null;
  mallaForm: FormGroup;
  // Si true, el campo 'detalle' se autogenera cuando cambian curso/ciclo/tipo
  private detalleAuto: boolean = true;
  private lastGeneratedDetalle: string = '';
  displayDialog: boolean = false;
  isEditing: boolean = false;
  selectedMalla: MallaDTO | null = null;
  showConfirmDelete: boolean = false;
  mallaToDelete: MallaDTO | null = null;
  showDuplicateDialog: boolean = false;
  sourceCiclo: CicloDTO | null = null;
  sourceMallas: MallaDTO[] = [];
  destinationCiclo: CicloDTO | null = null;
  sourceCiclos: CicloDTO[] = [];
  destinationCiclos: CicloDTO[] = [];
  showAllSource: boolean = false;
  showAllDest: boolean = false;
  activeCiclosSorted: CicloDTO[] = [];
  allCiclos: CicloDTO[] = []; // Almacenar todos los ciclos para los contadores

  constructor(
    private fb: FormBuilder,
    private mallaService: MallaService,
    private cursoService: CursoService,
    private cicloService: CicloService,
    private periodoService: PeriodoLectivoService,
    private messageService: MessageService
  ) {
    this.mallaForm = this.fb.group({
      detalle: ['', Validators.required],
      idCursos: [null, Validators.required],
      idCiclo: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadCursos();
    this.loadPeriodos();
    // Suscribir cambios para autogenerar detalle cuando corresponda
    this.setupAutoDetalleSubscription();
  }

  private setupAutoDetalleSubscription(): void {
    this.mallaForm.get('idCursos')?.valueChanges.subscribe(() => this.updateGeneratedDetalleIfAllowed());
    this.mallaForm.get('idCiclo')?.valueChanges.subscribe(() => this.updateGeneratedDetalleIfAllowed());
  }

  private updateGeneratedDetalleIfAllowed(): void {
    const generated = this.generateDetalleFromFields();
    // Solo sobrescribir si está en modo autogenerado o el valor actual coincide con el último generado
    const current = this.mallaForm.get('detalle')?.value || '';
    if (this.detalleAuto || current === this.lastGeneratedDetalle || !current) {
      this.lastGeneratedDetalle = generated;
      this.mallaForm.patchValue({ detalle: generated }, { emitEvent: false });
    }
  }

  private generateDetalleFromFields(): string {
    const idCurso = this.mallaForm.get('idCursos')?.value;
    const idCiclo = this.mallaForm.get('idCiclo')?.value;

    const curso = idCurso ? this.getCursoName(idCurso) : '';
    const ciclo = idCiclo ? this.getCicloName(idCiclo) : '';

    return [curso, ciclo].filter(s => s).join(' ');
  }

  // Llamar cuando el usuario edita manualmente el campo detalle
  onDetalleInput(): void {
    this.detalleAuto = false;
  }

  // Cursos disponibles para crear (excluye cursos ya añadidos en el ciclo seleccionado)
  get availableCursos(): CursoDTO[] {
    if (this.isEditing) {
      return this.cursos;
    }
    if (!this.cursos || !this.mallas) return this.cursos || [];
    const usedCursoIds = new Set(this.mallas.map(m => m.idCursos));
    return this.cursos.filter(c => !usedCursoIds.has(c.idCursos));
  }

  loadPeriodos(): void {
    this.periodoService.getPeriodosLectivos().subscribe({
      next: (data) => {
        this.periodos = data;
      },
      error: (err) => {
        console.error('Error cargando períodos:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los períodos'
        });
      }
    });
  }

  /**
   * Cuando cambia el período seleccionado
   */
  onPeriodoChange(): void {
    // Resetear ciclos
    this.selectedCiclo = null;
    this.ciclos = [];
    this.mallas = [];

    if (this.selectedPeriodo?.idPeriodoLectivo) {
      this.cicloService.getByPeriodo(this.selectedPeriodo.idPeriodoLectivo).subscribe({
        next: (data) => { this.ciclos = (data || []).filter(c => c.esActivo === true); },
        error: (err) => {
          console.error('Error cargando ciclos:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron cargar los ciclos'
          });
        }
      });
    }
  }

  onCicloChange(): void {
    if (this.selectedCiclo) {
      this.loadMallas();
    } else {
      this.mallas = [];
    }
  }

  loadMallas(): void {
    if (this.selectedCiclo) {
      this.mallaService.getByCiclo(this.selectedCiclo.idCiclo!).subscribe({
        next: (data) => {
          // Ordenar por ordenCurso si existe, si no por idCursos
          this.mallas = (Array.isArray(data) ? data : []).sort((a, b) => {
            if (a.ordenCurso != null && b.ordenCurso != null) {
              return a.ordenCurso - b.ordenCurso;
            }
            if (a.idCursos != null && b.idCursos != null) {
              return a.idCursos - b.idCursos;
            }
            return 0;
          });
        },
        error: (error) => {
          console.error('Error al cargar mallas:', error);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar mallas' });
        }
      });
    } else {
      this.mallas = [];
    }
  }

  loadCursos(): void {
    this.cursoService.getAll().subscribe({
      next: (data) => {
        this.cursos = data;
      },
      error: (error) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar cursos' });
      }
    });
  }


  openCreateDialog(): void {
    if (!this.selectedPeriodo) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atención',
        detail: 'Primero seleccione un período lectivo'
      });
      return;
    }

    this.isEditing = false;
    this.mallaForm.reset();
    // Preseleccionar ciclo si ya está seleccionado en la vista principal
    if (this.selectedCiclo?.idCiclo) {
      this.mallaForm.patchValue({ idCiclo: this.selectedCiclo.idCiclo });
    }
    // Activar autogeneración inicial
    this.detalleAuto = true;
    this.lastGeneratedDetalle = '';
    // Forzar generación inicial según valores actuales
    this.updateGeneratedDetalleIfAllowed();
    this.displayDialog = true;
  }

  openEditDialog(malla: MallaDTO): void {
    this.isEditing = true;
    this.selectedMalla = malla;
    this.mallaForm.patchValue(malla);
    // En edición, no queremos sobrescribir el detalle automáticamente
    this.detalleAuto = false;
    this.displayDialog = true;
  }

  saveMalla(): void {
    if (this.mallaForm.valid) {
      const malla: MallaDTO = this.mallaForm.value;
      if (this.isEditing) {
        malla.idMalla = this.selectedMalla?.idMalla || 0;
        this.mallaService.update(malla).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Malla actualizada correctamente' });
            this.loadMallas();
            this.displayDialog = false;
          },
          error: (error) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar malla' });
          }
        });
      } else {
        this.mallaService.create(malla).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Malla creada correctamente' });
            this.loadMallas();
            this.displayDialog = false;
          },
          error: (error) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al crear malla' });
          }
        });
      }
    }
  }

  hideDialog(): void {
    this.displayDialog = false;
    this.mallaForm.reset();
  }

  confirmDelete(malla: MallaDTO): void {
    this.mallaToDelete = malla;
    this.showConfirmDelete = true;
  }

  openDuplicateDialog(): void {
    this.showDuplicateDialog = true;
    this.sourceCiclo = null;
    this.sourceMallas = [];
    this.destinationCiclo = this.selectedCiclo;
    this.loadCiclosForDuplication();
  }

  loadCiclosForDuplication(): void {
    this.cicloService.getAll().subscribe({
      next: (data) => {
        this.allCiclos = data; // Guardar todos los ciclos
        const sortedCiclos = data.sort((a, b) => {
          const dateA = a.fechaInicioEstimada ? new Date(a.fechaInicioEstimada).getTime() : 0;
          const dateB = b.fechaInicioEstimada ? new Date(b.fechaInicioEstimada).getTime() : 0;
          return dateB - dateA; // descending
        });
        const inactiveCiclos = sortedCiclos.filter(c => !c.esActivo);
        this.sourceCiclos = this.showAllSource ? inactiveCiclos : inactiveCiclos.slice(0, 10);
        const activeCiclos = sortedCiclos.filter(c => c.esActivo);
        this.destinationCiclos = this.showAllDest ? activeCiclos : activeCiclos.slice(0, 10);
      },
      error: (error) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar ciclos' });
      }
    });
  }

  toggleShowAllSource(): void {
    this.showAllSource = true;
    this.loadCiclosForDuplication();
  }

  toggleShowAllDest(): void {
    this.showAllDest = true;
    this.loadCiclosForDuplication();
  }

  get inactiveCiclosCount(): number {
    return this.allCiclos.filter(c => !c.esActivo).length;
  }

  get activeCiclosCount(): number {
    return this.allCiclos.filter(c => c.esActivo).length;
  }

  onSourceCicloChange(): void {
    if (this.sourceCiclo) {
      this.loadSourceMallas();
    } else {
      this.sourceMallas = [];
    }
  }

  loadSourceMallas(): void {
    if (this.sourceCiclo) {
      this.mallaService.getByCiclo(this.sourceCiclo.idCiclo!).subscribe({
        next: (mallas) => {
          this.sourceMallas = mallas;
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.message || 'Error al cargar mallas fuente'
          });
        }
      });
    }
  }

  deleteMalla(): void {
    if (this.mallaToDelete?.idMalla) {
      this.mallaService.delete(this.mallaToDelete.idMalla).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Malla eliminada correctamente' });
          this.loadMallas();
          this.showConfirmDelete = false;
          this.mallaToDelete = null;
        },
        error: (error) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar malla' });
        }
      });
    }
  }

  cancelDelete(): void {
    this.showConfirmDelete = false;
    this.mallaToDelete = null;
  }

  confirmDuplicate(): void {
    if (this.sourceCiclo && this.destinationCiclo) {
      // Get mallas from source ciclo
      this.mallaService.getByCiclo(this.sourceCiclo.idCiclo!).subscribe({
        next: (sourceMallas) => {
          // Create each malla with the new ciclo
          const createPromises = sourceMallas.map(malla => {
            const newMalla: MallaDTO = {
              ...malla,
              idCiclo: this.destinationCiclo!.idCiclo,
              idMalla: 0 // New ID
            };
            return this.mallaService.create(newMalla).toPromise();
          });

          // Execute all creates
          Promise.all(createPromises).then(() => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Mallas duplicadas correctamente' });
            this.loadMallas();
            this.showDuplicateDialog = false;
            this.sourceCiclo = null;
            this.sourceMallas = [];
            this.destinationCiclo = null;
          }).catch((error) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al duplicar mallas' });
          });
        },
        error: (error) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al obtener mallas del ciclo fuente' });
        }
      });
    }
  }

  cancelDuplicate(): void {
    this.showDuplicateDialog = false;
    this.sourceCiclo = null;
    this.sourceMallas = [];
    this.destinationCiclo = null;
  }

  getCursoName(idCursos: number): string {
    const curso = this.cursos.find(c => c.idCursos === idCursos);
    return curso?.detalle || '';
  }

  getCicloName(idCiclo: number): string {
    const ciclo = this.ciclos.find(c => c.idCiclo === idCiclo);
    return ciclo?.detalle || '';
  }

}