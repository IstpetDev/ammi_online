import { Component, EventEmitter, Input, Output, OnChanges, OnInit, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { lastValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { SharedDrawerComponent } from '../../../../../shared/shared-drawer/shared-drawer.component';
import { CustomSelectComponent } from '../../../../../shared/custom-select/custom-select.component';
import { MallaParaleloService } from '../../../../../core/services/infrastructure/malla-paralelo.service';
import { MallaDTO, ParaleloDTO } from '../../../../../data/models/Entities';

@Component({
  selector: 'app-modal-crear-paralelo-malla',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SharedDrawerComponent, CustomSelectComponent, ButtonModule],
  templateUrl: './modal-crear-paralelo-malla.component.html',
  styles: [`
    .form-grid { display: flex; flex-direction: column; gap: 0; }
    .form-section { padding: 1.25rem 0; border-bottom: 1px solid var(--surface-border); }
    .form-section:last-child { border-bottom: none; padding-bottom: 0; }
    .section-title {
      font-size: 0.72rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.08em; color: var(--text-color-secondary);
      margin-bottom: 1rem; display: flex; align-items: center; gap: 0.4rem;
    }
    .section-title::after { content: ''; flex: 1; height: 1px; background: var(--surface-border); }
    .form-row { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
    .form-field { display: flex; flex-direction: column; gap: 0.4rem; min-width: 0; }
    .field-label { font-size: 0.83rem; font-weight: 600; color: var(--text-color); display: flex; align-items: center; gap: 0.35rem; }
    .field-label i { font-size: 0.85rem; color: var(--brand-yellow-dark, #f59e0b); }
    .required { color: #ef4444; font-size: 0.9rem; }
    .error-text { font-size: 0.77rem; color: #ef4444; display: flex; align-items: center; gap: 0.25rem; }
    .alert-error {
      display: flex; align-items: center; gap: 0.5rem; padding: 0.65rem 0.85rem;
      background: color-mix(in srgb, #ef4444 10%, var(--surface-card));
      border: 1px solid color-mix(in srgb, #ef4444 30%, transparent); border-radius: 8px;
      font-size: 0.83rem; color: #dc2626; margin-bottom: 1rem;
    }
    .info-note {
      display: flex; align-items: flex-start; gap: 0.5rem; padding: 0.65rem 0.85rem;
      background: color-mix(in srgb, #3b82f6 8%, var(--surface-card));
      border: 1px solid color-mix(in srgb, #60a5fa 30%, transparent); border-radius: 8px;
      font-size: 0.8rem; color: var(--text-color-secondary); margin-bottom: 1rem;
    }
    .info-note i { color: #3b82f6; margin-top: 0.1rem; flex-shrink: 0; }
    .alert-warning {
      display: flex; align-items: flex-start; gap: 0.5rem; padding: 0.65rem 0.85rem;
      background: color-mix(in srgb, #f59e0b 10%, var(--surface-card));
      border: 1px solid color-mix(in srgb, #f59e0b 40%, transparent); border-radius: 8px;
      font-size: 0.8rem; color: var(--text-color); margin-bottom: 1rem;
    }
    .alert-warning i { color: #d97706; margin-top: 0.1rem; flex-shrink: 0; font-size: 1rem; }
    .hierarchy-hint {
      font-size: 0.75rem; color: var(--text-color-secondary);
      display: flex; align-items: center; gap: 0.3rem; margin-top: 0.15rem;
    }
    .form-input {
      padding: 0.55rem 0.85rem; border: 2px solid var(--surface-border);
      border-radius: 12px; background: var(--surface-card);
      color: var(--text-color); font-size: 0.875rem; width: 100%;
      transition: border-color 0.2s, box-shadow 0.2s; box-sizing: border-box;
      font-family: inherit; min-height: 46px;
    }
    .form-input:focus { outline: none; border-color: var(--brand-yellow-dark); box-shadow: 0 0 0 3px rgba(233,185,2,0.15); }
    .form-input:disabled { opacity: 0.5; cursor: not-allowed; background: var(--surface-ground); }
    .modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; padding-top: 1.25rem; margin-top: 0.5rem; border-top: 1px solid var(--surface-border); }
    @media (max-width: 600px) {
      .form-row { grid-template-columns: 1fr; }
    }
  `]
})
export class ModalCrearParaleloMallaComponent implements OnChanges, OnInit {
  @Input() show = false;
  @Input() mallas: MallaDTO[] = [];
  @Input() paralelos: ParaleloDTO[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private mallaParaleloService = inject(MallaParaleloService);

  saving = false;
  errorMsg = '';
  loadingParalelos = false;
  paralelosFiltrados: ParaleloDTO[] = [];

  mallasOptions: any[] = [];
  paralelosOptions: any[] = [];

  form = this.fb.group({
    idMalla:    [null as number | null, Validators.required],
    idParalelo: [null as number | null, Validators.required],
    cupoMaximo: [30, [Validators.required, Validators.min(1)]]
  });

  ngOnInit(): void {
    this.form.get('idMalla')?.valueChanges.subscribe(idMalla => {
      this.form.get('idParalelo')?.setValue(null);
      this.paralelosFiltrados = [];
      this.paralelosOptions = [];
      if (idMalla) {
        this.loadingParalelos = true;
        this.mallaParaleloService.getByMalla(idMalla).subscribe({
          next: (existentes) => {
            const usedIds = new Set((existentes || []).map((mp: any) => mp.idParalelo));
            this.paralelosFiltrados = this.paralelos.filter(p => !usedIds.has(p.idParalelo));
            this.paralelosOptions = this.paralelosFiltrados.map(p => ({
              label: p.detalle || p.nombreParalelo || `Paralelo ${p.idParalelo}`,
              value: p.idParalelo
            }));
            this.loadingParalelos = false;
          },
          error: () => {
            this.paralelosFiltrados = [...this.paralelos];
            this.paralelosOptions = this.paralelosFiltrados.map(p => ({
              label: p.detalle || p.nombreParalelo || `Paralelo ${p.idParalelo}`,
              value: p.idParalelo
            }));
            this.loadingParalelos = false;
          }
        });
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['show']?.currentValue === false) {
      this.form.reset({ cupoMaximo: 30 });
      this.errorMsg = '';
      this.paralelosFiltrados = [];
      this.paralelosOptions = [];
    }
    if (changes['paralelos'] && this.paralelos) {
      this.paralelosFiltrados = [...this.paralelos];
      this.paralelosOptions = this.paralelosFiltrados.map(p => ({
        label: p.detalle || p.nombreParalelo || `Paralelo ${p.idParalelo}`,
        value: p.idParalelo
      }));
    }
    if (changes['mallas'] && this.mallas) {
      this.mallasOptions = this.mallas.map(m => ({ label: m.detalle, value: m.idMalla }));
    }
  }

  async onSave(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    this.errorMsg = '';
    const val = this.form.value;
    try {
      await lastValueFrom(
        this.mallaParaleloService.create({
          idMalla:    val.idMalla!,
          idParalelo: val.idParalelo!,
          cupoMaximo: val.cupoMaximo!
        })
      );
      this.saved.emit();
      this.close.emit();
    } catch (err: any) {
      this.errorMsg = err?.error?.message || err?.message || 'No se pudo configurar el paralelo.';
    } finally {
      this.saving = false;
    }
  }

  onClose(): void { this.close.emit(); }

  get f() { return this.form.controls; }

  onMallaChange(value: number | null): void {
    this.form.get('idMalla')?.setValue(value);
  }

  onParaleloChange(value: number | null): void {
    this.form.get('idParalelo')?.setValue(value);
  }

  get mallaSeleccionada(): boolean {
    return !!this.form.get('idMalla')?.value;
  }
}
