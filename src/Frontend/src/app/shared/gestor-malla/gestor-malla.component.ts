import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { DialogModule } from 'primeng/dialog';
import { CustomSelectComponent } from '../custom-select/custom-select.component';
import { CicloDTO, TipoOfertaDTO, EspecialidadDTO, CursoDTO, MateriaDTO, MallaDTO, RequisitoDTO, ParaleloDTO, EspecieDTO, MallaParaleloCreateDTO } from '../../data/models/Entities';
import { DetalleMallaCreateDTO } from '../../data/models/detalle-malla/detalle-malla.model';
import { CicloService } from '../../core/services/infrastructure/ciclo.service';
import { TipoOfertaService } from '../../core/services/postulaciones/tipo-oferta.service';
import { EspecialidadService } from '../../core/services/infrastructure/especialidad.service';
import { CursoService } from '../../core/services/infrastructure/curso.service';
import { MateriaService } from '../../core/services/infrastructure/materia.service';
import { MallaService } from '../../core/services/infrastructure/malla.service';
import { DetalleMallaService } from '../../core/services/infrastructure/detalle-malla.service';
import { RequisitosService } from '../../core/services/settings/requisitos.service';
import { ParaleloService } from '../../core/services/infrastructure/paralelo.service';
import { EspecieService } from '../../core/services/infrastructure/especie.service';
import { EspecieCicloService } from '../../core/services/infrastructure/especie-ciclo.service';
import { MallaParaleloService } from '../../core/services/infrastructure/malla-paralelo.service';
import { MallaRequisitosService } from '../../core/services/postulaciones/malla-requisitos.service';
import { PlantillaEvaluacionService } from '../../core/services/infrastructure/plantilla-evaluacion.service';
import { AreaCompetenciaService } from '../../core/services/infrastructure/area-competencia.service';
import { environment } from '../../environments/environment';

type TabType = 'materias' | 'requisitos' | 'paralelos' | 'costos';

@Component({
  selector: 'app-gestor-malla',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, DialogModule, CustomSelectComponent],
  template: `
    <div class="gm-wrapper">
      @if (mode === 'create') {
        <div class="gm-duplicar-section">
          <div class="gm-duplicar-header" (click)="showDuplicarSection = !showDuplicarSection">
            <i class="pi" [class.pi-chevron-down]="showDuplicarSection" [class.pi-chevron-right]="!showDuplicarSection"></i>
            <i class="pi pi-copy"></i> Duplicar de ciclo anterior
            @if (duplicadoExitoso) {
              <span class="gm-duplicar-success">✓ Datos cargados</span>
            }
          </div>
          @if (showDuplicarSection) {
            <div class="gm-duplicar-body">
              <div class="gm-form-row">
                <div class="gm-field">
                  <label>Ciclo origen</label>
                  <app-custom-select [items]="ciclosPrevios" labelField="detalle" valueField="idCiclo"
                    [selectedValue]="origenCicloId"
                    (selectedValueChange)="onOrigenCicloChange($event)"
                    placeholder="Seleccione ciclo…">
                  </app-custom-select>
                </div>
                <div class="gm-field">
                  <label>Curso (malla)</label>
                  <app-custom-select [items]="mallasOrigen" labelField="label" valueField="value"
                    [selectedValue]="origenMallaId"
                    (selectedValueChange)="origenMallaId = $event"
                    [disabled]="!origenCicloId || mallasOrigen.length === 0"
                    placeholder="Seleccione curso…">
                  </app-custom-select>
                </div>
              </div>
              <button type="button" class="gm-btn-cargar" (click)="cargarDuplicado()"
                [disabled]="!origenMallaId || loadingDuplicar">
                @if (loadingDuplicar) {
                  <i class="pi pi-spin pi-spinner"></i>
                } @else {
                  <i class="pi pi-copy"></i>
                }
                Cargar datos del curso anterior
              </button>
            </div>
          }
        </div>
      }
      @if (mode === 'create') {
        <div class="gm-basic-section">
          <h3 class="gm-section-title"><i class="pi pi-database"></i> Datos Básicos</h3>
          <div class="gm-form-row">
            <div class="gm-field">
              <label>Especialidad <span class="required">*</span></label>
              <app-custom-select [items]="especialidades" labelField="detalle" valueField="idEspecialidad"
                [selectedValue]="form.get('idEspecialidad')?.value"
                (selectedValueChange)="onEspecialidadChange($event)"
                placeholder="Informática, Ciencias…">
              </app-custom-select>
            </div>
            <div class="gm-field">
              <label>Curso <span class="required">*</span></label>
              <app-custom-select [items]="cursosFiltrados" labelField="detalle" valueField="idCursos"
                [selectedValue]="form.get('idCurso')?.value"
                (selectedValueChange)="form.patchValue({ idCurso: $event })"
                [disabled]="!form.get('idEspecialidad')?.value"
                placeholder="Primero BGU, Segundo BGU…">
              </app-custom-select>
            </div>
          </div>
          <div class="gm-form-row">
            <div class="gm-field">
              <label>Tipo de Oferta <span class="required">*</span></label>
              <app-custom-select [items]="tiposOferta" labelField="detalle" valueField="idtipoOferta"
                [selectedValue]="form.get('idTipoOferta')?.value"
                (selectedValueChange)="form.patchValue({ idTipoOferta: $event })"
                placeholder="Cursos, Talleres…">
              </app-custom-select>
            </div>
          </div>
        </div>
      }

      <div class="gm-tabs">
        @for (tab of tabs; track tab.key) {
          <button type="button" class="gm-tab" [class.gm-tab-active]="activeTab === tab.key"
            (click)="activeTab = tab.key">
            <i [class]="tab.icon"></i>
            <span>{{ tab.label }}</span>
            @if (getCount(tab.key) > 0) {
              <span class="gm-badge">{{ getCount(tab.key) }}</span>
            }
          </button>
        }
      </div>

      @if (activeTab === 'materias') {
        <div class="gm-tab-content">
          <div class="gm-toolbar">
            <button type="button" class="gm-btn-primary" (click)="showMateriaDialog = true">
              <i class="pi pi-plus"></i> Nueva Materia
            </button>
          </div>
          <div class="gm-table-wrap">
            <table class="gm-table">
              <thead>
                <tr>
                  <th style="width:40px"><input type="checkbox" [checked]="todasMateriasSel" (change)="toggleTodasMaterias($event)"></th>
                  <th>Materia</th>
                  <th style="width:60px">Mód.</th>
                  <th style="width:65px">Horas</th>
                  <th style="width:125px">Fecha Inicio</th>
                  <th style="width:125px">Fecha Fin</th>
                </tr>
              </thead>
              <tbody>
                @for (m of materiasDisponibles; track m.idMateria) {
                  <tr [class.gm-row-sel]="m._selected" (click)="toggleMateriaRow(m)" style="cursor:pointer">
                    <td><input type="checkbox" [checked]="m._selected" (click)="$event.stopPropagation()" (change)="toggleMateriaRow(m)"></td>
                    <td style="word-break:break-word">{{ m.detalle }}</td>
                    <td><input type="number" class="gm-input gm-input-narrow" [(ngModel)]="m._modulo" min="1" (click)="$event.stopPropagation()"></td>
                    <td><input type="number" class="gm-input gm-input-narrow" [(ngModel)]="m._horas" min="0" (click)="$event.stopPropagation()"></td>
                    <td><input type="date" class="gm-input gm-input-date" [(ngModel)]="m._fechaInicio" (click)="$event.stopPropagation()" (change)="propagarFechaInicio(m._modulo, m._fechaInicio ?? '')"></td>
                    <td><input type="date" class="gm-input gm-input-date" [(ngModel)]="m._fechaFin" (click)="$event.stopPropagation()" (change)="propagarFechaFin(m._modulo, m._fechaFin ?? '')"></td>
                  </tr>
                } @empty {
                  <tr><td colspan="6" class="gm-empty">No hay materias disponibles. Cree una nueva materia.</td></tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      @if (activeTab === 'requisitos') {
        <div class="gm-tab-content">
          <div class="gm-toolbar">
            <button type="button" class="gm-btn-primary" (click)="showRequisitoDialog = true">
              <i class="pi pi-plus"></i> Nuevo Requisito
            </button>
          </div>
          <div class="gm-table-wrap">
            <table class="gm-table">
              <thead>
                <tr>
                  <th style="width:40px"><input type="checkbox" [checked]="todosRequisitosSel" (change)="toggleTodosRequisitos($event)"></th>
                  <th>Requisito</th>
                  <th style="width:90px">Tipo</th>
                  <th style="width:70px">Oblig.</th>
                </tr>
              </thead>
              <tbody>
                @for (r of todosRequisitos; track r.idRequisitos) {
                  <tr [class.gm-row-sel]="r._sel" (click)="toggleRequisito(r)" style="cursor:pointer">
                    <td><input type="checkbox" [checked]="r._sel" (change)="toggleRequisito(r)"></td>
                    <td>{{ r.detalle }}</td>
                    <td>{{ r.tipoDato === 'ADJUNTO' ? 'Adjunto' : 'Sí/No' }}</td>
                    <td>{{ r.esObligatorio ? 'Sí' : 'No' }}</td>
                  </tr>
                } @empty {
                  <tr><td colspan="4" class="gm-empty">No hay requisitos disponibles. Cree uno nuevo.</td></tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      @if (activeTab === 'paralelos') {
        <div class="gm-tab-content">
          <div class="gm-toolbar">
            <button type="button" class="gm-btn-primary" (click)="showParaleloDialog = true">
              <i class="pi pi-plus"></i> Nuevo Paralelo
            </button>
          </div>
          <div class="gm-table-wrap">
            <table class="gm-table">
              <thead>
                <tr>
                  <th style="width:40px"><input type="checkbox" [checked]="todosParalelosSel" (change)="toggleTodosParalelos($event)"></th>
                  <th>Paralelo</th>
                  <th style="width:80px">Cupo</th>
                </tr>
              </thead>
              <tbody>
                @for (p of todosParalelos; track p.idParalelo) {
                  <tr [class.gm-row-sel]="p._sel" (click)="toggleParalelo(p)" style="cursor:pointer">
                    <td><input type="checkbox" [checked]="p._sel" (change)="toggleParalelo(p)"></td>
                    <td>{{ p.nombreParalelo || p.detalle }}</td>
                    <td>
                      <input type="number" class="gm-input gm-input-narrow" [(ngModel)]="p._cupo" min="1"
                        (click)="$event.stopPropagation()" placeholder="35">
                    </td>
                  </tr>
                } @empty {
                  <tr><td colspan="3" class="gm-empty">No hay paralelos disponibles.</td></tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      @if (activeTab === 'costos') {
        <div class="gm-tab-content">
          <div class="gm-toolbar">
            <button type="button" class="gm-btn-primary" (click)="showEspecieDialog = true">
              <i class="pi pi-plus"></i> Nueva Especie
            </button>
          </div>
          <div class="gm-table-wrap">
            <table class="gm-table">
              <thead>
                <tr>
                  <th style="width:40px"><input type="checkbox" [checked]="todosEspeciesSel" (change)="toggleTodosEspecies($event)"></th>
                  <th>Especie</th>
                  <th style="width:100px">Valor</th>
                  <th style="width:90px">Tipo</th>
                </tr>
              </thead>
              <tbody>
                @for (e of todosEspecies; track e.idEspecie) {
                  <tr [class.gm-row-sel]="e._sel" (click)="toggleEspecie(e)" style="cursor:pointer">
                    <td><input type="checkbox" [checked]="e._sel" (change)="toggleEspecie(e)"></td>
                    <td>{{ e.detalle }}</td>
                    <td>
                      <input type="number" class="gm-input" style="max-width:100px" [(ngModel)]="e._valor" min="0" step="0.01"
                        (click)="$event.stopPropagation()" placeholder="0.00">
                    </td>
                    <td>{{ e.esMatricula ? 'Matrícula' : e.esPension ? 'Pensión' : '—' }}</td>
                  </tr>
                } @empty {
                  <tr><td colspan="4" class="gm-empty">No hay especies disponibles. Cree una nueva.</td></tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <div class="gm-actions">
        <button type="button" class="gm-btn gm-btn-secondary" (click)="cancel.emit()">Cancelar</button>
        <button type="button" class="gm-btn gm-btn-primary" (click)="onSave()" [disabled]="saving || (mode==='create' && form.invalid)">
          @if (saving) {
            <i class="pi pi-spin pi-spinner"></i>
          }
          {{ mode === 'create' ? 'Crear Malla' : 'Guardar Cambios' }}
        </button>
      </div>
    </div>

    <p-dialog [(visible)]="showMateriaDialog" header="Nueva Materia" [modal]="true" [closable]="true" [style]="{ width: '400px' }">
      <div class="gm-dialog-body">
        <div class="gm-dialog-field">
          <label>Nombre *</label>
          <input type="text" class="form-control" [(ngModel)]="newMateriaDetalle" placeholder="Ej: Matemáticas">
        </div>
        <div class="gm-dialog-field">
          <label>Horas Requeridas</label>
          <input type="number" class="form-control" [(ngModel)]="newMateriaHoras" placeholder="Ej: 80" min="0" step="1">
        </div>
      </div>
      <ng-template pTemplate="footer">
        <button type="button" class="gm-btn gm-btn-secondary" (click)="showMateriaDialog = false">Cancelar</button>
        <button type="button" class="gm-btn gm-btn-primary" (click)="guardarNuevaMateria()" [disabled]="!newMateriaDetalle.trim()">Guardar</button>
      </ng-template>
    </p-dialog>

    <p-dialog [(visible)]="showRequisitoDialog" header="Nuevo Requisito" [modal]="true" [closable]="true" [style]="{ width: '450px' }">
      <div class="gm-dialog-body">
        <div class="gm-dialog-field">
          <label>Detalle *</label>
          <input type="text" class="form-control" [(ngModel)]="newRequisitoDetalle" placeholder="Ej: Cédula de identidad">
        </div>
        <div class="gm-dialog-field">
          <label>Tipo de dato *</label>
          <app-custom-select [items]="tipoDatoOptions" labelField="label" valueField="value"
            [selectedValue]="newRequisitoTipoDato"
            (selectedValueChange)="newRequisitoTipoDato = $event"
            placeholder="Seleccione tipo">
          </app-custom-select>
        </div>
        <div class="gm-dialog-check">
          <label><input type="checkbox" [(ngModel)]="newRequisitoObligatorio"> ¿Es obligatorio?</label>
        </div>
        <div class="gm-dialog-check">
          <label><input type="checkbox" [(ngModel)]="newRequisitoBloquea"> ¿Bloquea inscripción?</label>
        </div>
      </div>
      <ng-template pTemplate="footer">
        <button type="button" class="gm-btn gm-btn-secondary" (click)="showRequisitoDialog = false">Cancelar</button>
        <button type="button" class="gm-btn gm-btn-primary" (click)="guardarNuevoRequisito()" [disabled]="!newRequisitoDetalle.trim()">Guardar</button>
      </ng-template>
    </p-dialog>

    <p-dialog [(visible)]="showParaleloDialog" header="Nuevo Paralelo" [modal]="true" [closable]="true" [style]="{ width: '400px' }">
      <div class="gm-dialog-body">
        <div class="gm-dialog-field">
          <label>Nombre *</label>
          <input type="text" class="form-control" [(ngModel)]="newParaleloNombre" placeholder="Ej: A">
        </div>
        <div class="gm-dialog-field">
          <label>Cupo máximo</label>
          <input type="number" class="form-control" [(ngModel)]="newParaleloCupo" placeholder="Ej: 35" min="1" step="1">
        </div>
      </div>
      <ng-template pTemplate="footer">
        <button type="button" class="gm-btn gm-btn-secondary" (click)="showParaleloDialog = false">Cancelar</button>
        <button type="button" class="gm-btn gm-btn-primary" (click)="guardarNuevoParalelo()" [disabled]="!newParaleloNombre.trim()">Guardar</button>
      </ng-template>
    </p-dialog>

    <p-dialog [(visible)]="showEspecieDialog" header="Nueva Especie (Costo)" [modal]="true" [closable]="true" [style]="{ width: '450px' }">
      <div class="gm-dialog-body">
        <div class="gm-dialog-field">
          <label>Detalle *</label>
          <input type="text" class="form-control" [(ngModel)]="newEspecieDetalle" placeholder="Ej: Matrícula 2026">
        </div>
        <div class="gm-dialog-field">
          <label>Valor *</label>
          <input type="number" class="form-control" [(ngModel)]="newEspecieValor" placeholder="Ej: 50" min="0" step="0.01">
        </div>
        <div class="gm-dialog-check">
          <label><input type="checkbox" [(ngModel)]="newEspecieEsMatricula"> Es matrícula</label>
        </div>
        <div class="gm-dialog-check">
          <label><input type="checkbox" [(ngModel)]="newEspecieEsPension"> Es pensión</label>
        </div>
      </div>
      <ng-template pTemplate="footer">
        <button type="button" class="gm-btn gm-btn-secondary" (click)="showEspecieDialog = false">Cancelar</button>
        <button type="button" class="gm-btn gm-btn-primary" (click)="guardarNuevaEspecie()" [disabled]="!newEspecieDetalle.trim()">Guardar</button>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .gm-wrapper { display:flex; flex-direction:column; gap:1rem; font-family:'Poppins',sans-serif; height:100%; }
    .gm-basic-section { padding:1rem; background:var(--surface-ground); border-radius:8px; border:1px solid var(--surface-border); display:flex; flex-direction:column; gap:0.75rem; }
    .gm-section-title { margin:0; font-size:0.82rem; font-weight:700; color:var(--text-color); display:flex; align-items:center; gap:0.35rem; }
    .gm-section-title i { color:var(--brand-yellow-dark); font-size:0.75rem; }
    .gm-form-row { display:grid; grid-template-columns:1fr 1fr; gap:0.65rem; }
    .gm-field { display:flex; flex-direction:column; gap:0.25rem; }
    .gm-field label { font-size:0.75rem; font-weight:600; color:var(--text-color); }
    .required { color:#dc3545; }
    .gm-tabs { display:flex; gap:0.25rem; padding:0.25rem; background:var(--surface-ground); border-radius:10px; }
    .gm-tab {
      flex:1; display:flex; align-items:center; justify-content:center; gap:0.35rem;
      padding:0.5rem 0.65rem; border:none; border-radius:8px; cursor:pointer;
      font-size:0.78rem; font-weight:600; color:var(--text-color-secondary);
      background:transparent; transition:all 0.2s ease; font-family:inherit; white-space:nowrap;
    }
    .gm-tab:hover { color:var(--text-color); background:var(--surface-hover); }
    .gm-tab-active { background:var(--surface-card); color:var(--text-color); box-shadow:0 1px 3px rgba(0,0,0,0.08); }
    .gm-tab i { font-size:0.75rem; }
    .gm-badge {
      display:inline-flex; align-items:center; justify-content:center;
      min-width:18px; height:18px; padding:0 4px; border-radius:9px;
      background:var(--brand-yellow-dark); color:var(--brand-black);
      font-size:0.65rem; font-weight:700;
    }
    .gm-tab-content { flex:1; display:flex; flex-direction:column; gap:0.75rem; min-height:0; overflow:hidden; }
    .gm-toolbar { display:flex; }
    .gm-btn-primary {
      width:100%; justify-content:center;
      padding:0.45rem 0.85rem; font-size:0.8rem; font-weight:600; border-radius:8px; cursor:pointer;
      background:var(--brand-yellow-dark); border:none; color:var(--brand-black);
      display:inline-flex; align-items:center; gap:0.4rem; transition:background 0.2s ease; font-family:inherit;
    }
    .gm-btn-primary:hover:not(:disabled) { background:var(--brand-yellow); }
    .gm-btn-primary:disabled { opacity:0.5; cursor:not-allowed; }
    .gm-table-wrap { overflow:auto; border:1px solid var(--surface-border); border-radius:8px; }
    .gm-table { width:100%; border-collapse:collapse; font-size:0.82rem; }
    .gm-table th { padding:0.5rem 0.45rem; background:var(--surface-ground); color:var(--text-color-secondary); font-weight:600; text-align:left; font-size:0.75rem; border-bottom:1px solid var(--surface-border); white-space:nowrap; }
    .gm-table td { padding:0.4rem 0.45rem; border-bottom:1px solid var(--surface-border); color:var(--text-color); }
    .gm-table tbody tr:hover { background:var(--surface-hover); }
    .gm-row-sel { background:rgba(233,185,2,0.08) !important; }
    .gm-empty { text-align:center; padding:1.5rem 1rem; color:var(--text-color-secondary); font-size:0.82rem; }
    .gm-input {
      width:100%; padding:0.3rem 0.4rem; background:var(--surface-section); border:1px solid var(--surface-border);
      border-radius:6px; font-size:0.78rem; color:var(--text-color); outline:none; font-family:inherit;
      transition:border-color 0.2s ease; box-sizing:border-box;
    }
    .gm-input:focus { border-color:var(--brand-yellow-dark); }
    .gm-input-narrow { max-width:55px; text-align:center; }
    .gm-input-date { max-width:130px; text-align:left; font-size:0.72rem; }
    .gm-actions { display:flex; justify-content:flex-end; gap:0.75rem; padding-top:0.75rem; border-top:1px solid var(--surface-border); }
    .gm-btn {
      padding:0.6rem 1.25rem; border:none; border-radius:10px; font-size:0.8rem; font-weight:700;
      cursor:pointer; display:inline-flex; align-items:center; gap:0.5rem;
      transition:all 0.2s ease; font-family:inherit;
    }
    .gm-btn:disabled { opacity:0.4; cursor:not-allowed; }
    .gm-btn-secondary { background:var(--surface-ground); color:var(--text-color-secondary); border:2px solid var(--surface-border); }
    .gm-btn-secondary:hover:not(:disabled) { border-color:var(--text-color-secondary); color:var(--text-color); }
    .gm-dialog-body { display:flex; flex-direction:column; gap:1rem; padding:0.5rem 0; }
    .gm-dialog-field { display:flex; flex-direction:column; gap:0.25rem; }
    .gm-dialog-field label { font-size:0.75rem; font-weight:600; color:var(--text-color); }
    .gm-dialog-field input[type="text"], .gm-dialog-field input[type="number"] {
      width:100%; padding:0.5rem 0.7rem; background:var(--surface-section); border:2px solid var(--surface-border);
      border-radius:8px; font-size:0.82rem; color:var(--text-color); outline:none; font-family:inherit;
      transition:border-color 0.2s ease; box-sizing:border-box;
    }
    .gm-dialog-field input:focus { border-color:var(--brand-yellow-dark); box-shadow:0 0 0 3px rgba(233,185,2,0.12); }
    .gm-dialog-check label { display:flex; align-items:center; gap:0.4rem; font-size:0.78rem; color:var(--text-color); cursor:pointer; }
    .gm-dialog-check input[type="checkbox"] { width:15px; height:15px; cursor:pointer; }
    .form-control { width:100%; padding:0.5rem 0.7rem; background:var(--surface-section); border:2px solid var(--surface-border); border-radius:8px; font-size:0.82rem; color:var(--text-color); outline:none; font-family:inherit; transition:border-color 0.2s ease; box-sizing:border-box; }
    .form-control:focus { border-color:var(--brand-yellow-dark); box-shadow:0 0 0 3px rgba(233,185,2,0.12); }
    .gm-duplicar-section { padding:0.75rem 1rem; background:color-mix(in srgb, #e0e7ff 20%, var(--surface-card)); border:1px dashed #a5b4fc; border-radius:8px; }
    .gm-duplicar-header { display:flex; align-items:center; gap:0.4rem; font-size:0.82rem; font-weight:600; color:var(--text-color); cursor:pointer; user-select:none; }
    .gm-duplicar-header i.pi-copy { color:#6366f1; }
    .gm-duplicar-header i.pi-chevron-down, .gm-duplicar-header i.pi-chevron-right { font-size:0.65rem; color:var(--text-color-secondary); }
    .gm-duplicar-success { margin-left:auto; font-size:0.72rem; font-weight:600; color:#16a34a; display:flex; align-items:center; gap:0.25rem; }
    .gm-duplicar-body { display:flex; flex-direction:column; gap:0.75rem; padding-top:0.75rem; margin-top:0.5rem; border-top:1px solid #c7d2fe; }
    .gm-duplicar-body .gm-form-row { grid-template-columns:1fr 1fr; }
    .gm-btn-cargar {
      align-self:flex-start; padding:0.5rem 1rem; font-size:0.78rem; font-weight:600; border-radius:8px; cursor:pointer;
      background:#6366f1; border:none; color:#fff;
      display:inline-flex; align-items:center; gap:0.4rem; transition:background 0.2s ease; font-family:inherit;
    }
    .gm-btn-cargar:hover:not(:disabled) { background:#4f46e5; }
    .gm-btn-cargar:disabled { opacity:0.5; cursor:not-allowed; }
    @media (max-width:600px) { .gm-form-row { grid-template-columns:1fr; } .gm-duplicar-body .gm-form-row { grid-template-columns:1fr; } }
  `]
})
export class GestorMallaComponent implements OnInit {
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() cicloId: number | null = null;
  @Input() mallaId: number | null = null;

  @Output() save = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private cicloService = inject(CicloService);
  private tipoOfertaService = inject(TipoOfertaService);
  private especialidadService = inject(EspecialidadService);
  private cursoService = inject(CursoService);
  private materiaService = inject(MateriaService);
  private mallaService = inject(MallaService);
  private detalleMallaService = inject(DetalleMallaService);
  private requisitosService = inject(RequisitosService);
  private paraleloService = inject(ParaleloService);
  private especieService = inject(EspecieService);
  private especieCicloService = inject(EspecieCicloService);
  private mallaParaleloService = inject(MallaParaleloService);
  private mallaRequisitosService = inject(MallaRequisitosService);
  private plantillaEvaluacionService = inject(PlantillaEvaluacionService);
  private areaCompetenciaService = inject(AreaCompetenciaService);
  private http = inject(HttpClient);

  form: FormGroup;

  activeTab: TabType = 'materias';
  saving = false;

  tabs = [
    { key: 'materias' as TabType, label: 'Materias', icon: 'pi pi-book' },
    { key: 'requisitos' as TabType, label: 'Requisitos', icon: 'pi pi-check-square' },
    { key: 'paralelos' as TabType, label: 'Paralelos', icon: 'pi pi-users' },
    { key: 'costos' as TabType, label: 'Costos', icon: 'pi pi-dollar' },
  ];

  especialidades: (EspecialidadDTO & { detalle?: string })[] = [];
  cursosTodos: CursoDTO[] = [];
  tiposOferta: TipoOfertaDTO[] = [];

  materiasDisponibles: (MateriaDTO & { _selected?: boolean; _modulo?: number; _horas?: number; _fechaInicio?: string; _fechaFin?: string })[] = [];
  todosRequisitos: (RequisitoDTO & { _sel?: boolean })[] = [];
  todosParalelos: (ParaleloDTO & { _sel?: boolean; _cupo?: number })[] = [];
  todosEspecies: (EspecieDTO & { _sel?: boolean; _valor?: number })[] = [];

  selectedMaterias: any[] = [];
  selectedRequisitos: RequisitoDTO[] = [];
  selectedParalelos: ParaleloDTO[] = [];
  selectedEspecies: { especie: EspecieDTO; valorEspecie: number }[] = [];

  showMateriaDialog = false;
  showRequisitoDialog = false;
  showParaleloDialog = false;
  showEspecieDialog = false;

  newMateriaDetalle = '';
  newMateriaHoras: number | null = null;
  newRequisitoDetalle = '';
  newRequisitoTipoDato: string = 'ADJUNTO';
  newRequisitoObligatorio = false;
  newRequisitoBloquea = false;
  newParaleloNombre = '';
  newParaleloCupo: number | null = null;
  newEspecieDetalle = '';
  newEspecieValor: number | null = null;
  newEspecieEsMatricula = false;
  newEspecieEsPension = false;

  readonly tipoDatoOptions = [
    { label: 'Adjunto (PDF, imagen)', value: 'ADJUNTO' },
    { label: 'Sí / No', value: 'BOOL' }
  ];

  showDuplicarSection = false;
  ciclosPrevios: CicloDTO[] = [];
  mallasOrigen: { label: string; value: number }[] = [];
  origenCicloId: number | null = null;
  origenMallaId: number | null = null;
  loadingDuplicar = false;
  duplicadoExitoso = false;

  get cursosFiltrados(): CursoDTO[] {
    const idEsp = this.form?.get('idEspecialidad')?.value;
    return idEsp ? this.cursosTodos.filter(c => c.idEspecialidad === +idEsp) : [];
  }

  get todasMateriasSel(): boolean {
    return this.materiasDisponibles.length > 0 && this.materiasDisponibles.every(m => m._selected);
  }

  get todosRequisitosSel(): boolean {
    return this.todosRequisitos.length > 0 && this.todosRequisitos.every(r => r._sel);
  }

  get todosParalelosSel(): boolean {
    return this.todosParalelos.length > 0 && this.todosParalelos.every(p => p._sel);
  }

  get todosEspeciesSel(): boolean {
    return this.todosEspecies.length > 0 && this.todosEspecies.every(e => e._sel);
  }

  constructor() {
    this.form = this.fb.group({
      idEspecialidad: ['', Validators.required],
      idCurso: ['', Validators.required],
      idTipoOferta: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    forkJoin({
      tiposOferta: this.tipoOfertaService.getTiposOfertaActivos(),
      especialidades: this.especialidadService.getAll(),
      cursos: this.cursoService.getAll(),
      materias: this.materiaService.getAll(200),
      requisitos: this.requisitosService.getAll(),
      paralelos: this.paraleloService.getAllParalelos(),
      especies: this.especieService.getAll(),
      todosCiclos: this.cicloService.getAll()
    }).subscribe({
      next: (data) => {
        this.tiposOferta = data.tiposOferta;
        this.especialidades = data.especialidades;
        this.cursosTodos = data.cursos;
        this.materiasDisponibles = (data.materias.items || []).map(m => ({
          ...m, _selected: false, _modulo: 1,
          _horas: m.horasRequeridas ?? 0,
          _fechaInicio: '', _fechaFin: ''
        }));
        this.todosRequisitos = (data.requisitos || []).map(r => ({ ...r, _sel: false }));
        this.todosParalelos = (data.paralelos || []).map(p => ({ ...p, _sel: false, _cupo: p.cupoMaximo ?? 35 }));
        this.todosEspecies = (data.especies || []).map(e => ({ ...e, _sel: false, _valor: 0 }));
        this.ciclosPrevios = data.todosCiclos.filter(c => c.esActivo !== true);
      }
    });
  }

  getCount(tab: TabType): number {
    switch (tab) {
      case 'materias': return this.materiasDisponibles.filter(m => m._selected).length;
      case 'requisitos': return this.todosRequisitos.filter(r => r._sel).length;
      case 'paralelos': return this.todosParalelos.filter(p => p._sel).length;
      case 'costos': return this.todosEspecies.filter(e => e._sel).length;
    }
  }

  onEspecialidadChange(id: any): void {
    this.form.patchValue({ idEspecialidad: id, idCurso: '' });
  }

  toggleMateriaRow(m: any): void {
    m._selected = !m._selected;
  }

  toggleTodasMaterias(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.materiasDisponibles.forEach(m => m._selected = checked);
  }

  toggleRequisito(r: any): void { r._sel = !r._sel; }
  toggleTodosRequisitos(event: Event): void {
    const c = (event.target as HTMLInputElement).checked;
    this.todosRequisitos.forEach(r => r._sel = c);
  }

  toggleParalelo(p: any): void { p._sel = !p._sel; }
  toggleTodosParalelos(event: Event): void {
    const c = (event.target as HTMLInputElement).checked;
    this.todosParalelos.forEach(p => p._sel = c);
  }

  toggleEspecie(e: any): void { e._sel = !e._sel; }
  toggleTodosEspecies(event: Event): void {
    const c = (event.target as HTMLInputElement).checked;
    this.todosEspecies.forEach(e => e._sel = c);
  }

  propagarFechaInicio(modulo: number | undefined, fecha: string): void {
    this.materiasDisponibles.forEach(m => {
      if (m._modulo === modulo) m._fechaInicio = fecha;
    });
  }

  propagarFechaFin(modulo: number | undefined, fecha: string): void {
    this.materiasDisponibles.forEach(m => {
      if (m._modulo === modulo) m._fechaFin = fecha;
    });
  }

  onOrigenCicloChange(id: any): void {
    this.origenCicloId = id;
    this.origenMallaId = null;
    this.mallasOrigen = [];
    if (id) {
      this.mallaService.getByCiclo(id).subscribe({
        next: (mallas) => {
          this.mallasOrigen = mallas
            .filter(m => m.idMalla != null)
            .map(m => ({ label: `${m.detalle} - ${m.nombreTipoOferta || ''}`, value: m.idMalla! }));
        },
        error: () => this.mallasOrigen = []
      });
    }
  }

  cargarDuplicado(): void {
    if (!this.origenMallaId) return;
    this.loadingDuplicar = true;
    this.duplicadoExitoso = false;

    forkJoin({
      detalles: this.detalleMallaService.getByMalla(this.origenMallaId, 1, 999),
      mallaRequisitos: this.mallaRequisitosService.getMallaRequisitosByMalla(this.origenMallaId),
      paralelos: this.mallaParaleloService.getByMalla(this.origenMallaId),
      especies: this.especieCicloService.getByMalla(this.origenMallaId),
      mallaOrigen: this.mallaService.getAll()
    }).subscribe({
      next: (data) => {
        const mallaInfo = data.mallaOrigen.find(m => m.idMalla === this.origenMallaId);

        // Auto-completar Datos Básicos si estamos en modo create
        if (this.mode === 'create' && mallaInfo) {
          if (mallaInfo.idCursos != null) {
            const curso = this.cursosTodos.find(c => c.idCursos === mallaInfo.idCursos);
            if (curso?.idEspecialidad != null) {
              this.form.patchValue({ idEspecialidad: curso.idEspecialidad });
            }
            this.form.patchValue({ idCurso: mallaInfo.idCursos });
          }
          if (mallaInfo.idTipoOferta != null) {
            this.form.patchValue({ idTipoOferta: mallaInfo.idTipoOferta });
          }
        }

        // Materias
        if (data.detalles && data.detalles.length > 0) {
          this.materiasDisponibles = data.detalles.map(d => {
            const match = this.materiasDisponibles.find(m => m.idMateria === d.idMateria);
            return {
              idMateria: d.idMateria,
              detalle: d.nombreMateria || match?.detalle || `Materia #${d.idMateria}`,
              horasRequeridas: d.duracionHoras || match?.horasRequeridas || 0,
              _selected: true,
              _modulo: d.modulo ?? 1,
              _horas: d.duracionHoras || match?.horasRequeridas || 0,
              _fechaInicio: d.fechaInicio || '',
              _fechaFin: d.fechaFin || ''
            };
          });
        }

        // Requisitos
        if (data.mallaRequisitos && data.mallaRequisitos.length > 0) {
          const reqIds = new Set(data.mallaRequisitos.map(r => r.idRequisitos));
          this.todosRequisitos.forEach(r => {
            r._sel = r.idRequisitos != null && reqIds.has(r.idRequisitos);
          });
        }

        // Paralelos
        if (data.paralelos && data.paralelos.length > 0) {
          const paraleloIds = new Set(data.paralelos.filter(p => p.idParalelo != null).map(p => p.idParalelo));
          this.todosParalelos.forEach(p => {
            const match = data.paralelos.find(mp => mp.idParalelo === p.idParalelo);
            p._sel = p.idParalelo != null && paraleloIds.has(p.idParalelo);
            if (match) p._cupo = match.cupoMaximo ?? p._cupo;
          });
        }

        // Costos
        if (data.especies && data.especies.length > 0) {
          const especieMap = new Map(data.especies.map(e => [e.idEspecie, e.valorEspecie]));
          this.todosEspecies.forEach(e => {
            if (e.idEspecie != null && especieMap.has(e.idEspecie)) {
              e._sel = true;
              e._valor = especieMap.get(e.idEspecie) ?? 0;
            }
          });
        }

        this.duplicadoExitoso = true;
        this.loadingDuplicar = false;
        setTimeout(() => this.duplicadoExitoso = false, 3000);
      },
      error: () => {
        this.loadingDuplicar = false;
      }
    });
  }

  guardarNuevaMateria(): void {
    if (!this.newMateriaDetalle.trim()) return;
    const data: MateriaDTO = { detalle: this.newMateriaDetalle.trim(), horasRequeridas: this.newMateriaHoras ?? undefined, esActivo: true };
    this.materiaService.create(data).subscribe({
      next: (nuevo) => {
        const row = {
          idMateria: nuevo.idMateria,
          detalle: nuevo.detalle || this.newMateriaDetalle.trim(),
          horasRequeridas: nuevo.horasRequeridas ?? this.newMateriaHoras ?? 0,
          _selected: true,
          _modulo: 1,
          _horas: nuevo.horasRequeridas ?? this.newMateriaHoras ?? 0,
          _fechaInicio: '',
          _fechaFin: ''
        };
        this.materiasDisponibles = [...this.materiasDisponibles, row];
        this.showMateriaDialog = false;
        this.newMateriaDetalle = '';
        this.newMateriaHoras = null;
      }
    });
  }

  guardarNuevoRequisito(): void {
    if (!this.newRequisitoDetalle.trim()) return;
    const data: RequisitoDTO = {
      detalle: this.newRequisitoDetalle.trim(),
      tipoDato: this.newRequisitoTipoDato,
      esObligatorio: this.newRequisitoObligatorio,
      bloqueaInscripcion: this.newRequisitoBloquea
    };
    this.requisitosService.create(data).subscribe({
      next: (nuevo) => {
        this.todosRequisitos = [...this.todosRequisitos, { ...nuevo, _sel: true }];
        this.showRequisitoDialog = false;
        this.newRequisitoDetalle = '';
        this.newRequisitoTipoDato = 'ADJUNTO';
        this.newRequisitoObligatorio = false;
        this.newRequisitoBloquea = false;
      }
    });
  }

  guardarNuevoParalelo(): void {
    if (!this.newParaleloNombre.trim()) return;
    this.http.post<{ isSuccess: boolean; data: ParaleloDTO }>(
      `${environment.apiUrl}/Paralelo/CreateParalelo`,
      { nombreParalelo: this.newParaleloNombre.trim(), cupoMaximo: this.newParaleloCupo ?? 35 }
    ).subscribe({
      next: (res) => {
        if (res.isSuccess && res.data) {
          this.todosParalelos = [...this.todosParalelos, { ...res.data, _sel: true, _cupo: res.data.cupoMaximo ?? 35 }];
        }
        this.showParaleloDialog = false;
        this.newParaleloNombre = '';
        this.newParaleloCupo = null;
      }
    });
  }

  guardarNuevaEspecie(): void {
    if (!this.newEspecieDetalle.trim()) return;
    const data: EspecieDTO = {
      detalle: this.newEspecieDetalle.trim(),
      esMatricula: this.newEspecieEsMatricula,
      esPension: this.newEspecieEsPension,
      activo: true
    };
    this.especieService.create(data).subscribe({
      next: (nuevo) => {
        this.todosEspecies = [...this.todosEspecies, { ...nuevo, _sel: true, _valor: this.newEspecieValor ?? 0 }];
        this.showEspecieDialog = false;
        this.newEspecieDetalle = '';
        this.newEspecieValor = null;
        this.newEspecieEsMatricula = false;
        this.newEspecieEsPension = false;
      }
    });
  }

  onSave(): void {
    if (this.mode === 'create' && this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;

    const selectedMaterias = this.materiasDisponibles
      .filter(m => m._selected)
      .map(m => ({
        idMateria: m.idMateria,
        detalle: m.detalle,
        modulo: m._modulo ?? 1,
        horas: m._horas ?? m.horasRequeridas ?? 0,
        fechaInicio: m._fechaInicio ?? '',
        fechaFin: m._fechaFin ?? ''
      }));

    const selectedRequisitos = this.todosRequisitos.filter(r => r._sel).map(r => {
      const { _sel, ...req } = r;
      return req as RequisitoDTO;
    });

    const selectedParalelos = this.todosParalelos.filter(p => p._sel).map(p => ({
      idParalelo: p.idParalelo,
      nombreParalelo: p.nombreParalelo,
      cupoMaximo: p._cupo ?? p.cupoMaximo ?? 35
    }));

    const selectedEspecies = this.todosEspecies.filter(e => e._sel).map(e => ({
      especie: { idEspecie: e.idEspecie, detalle: e.detalle, esMatricula: e.esMatricula, esPension: e.esPension } as EspecieDTO,
      valorEspecie: e._valor ?? 0
    }));

    const result = {
      mode: this.mode,
      cicloId: this.cicloId,
      mallaId: this.mallaId,
      ...(this.mode === 'create' ? this.form.value : {}),
      materias: selectedMaterias,
      requisitos: selectedRequisitos,
      paralelos: selectedParalelos,
      especies: selectedEspecies
    };

    this.saving = false;
    this.save.emit(result);
  }
}
