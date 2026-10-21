import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { lastValueFrom, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { SharedDrawerComponent } from '../../../../../shared/shared-drawer/shared-drawer.component';
import { CustomSelectComponent } from '../../../../../shared/custom-select/custom-select.component';
import { environment } from '../../../../../environments/environment';
import { IResponse } from '../../../../../data/models/IResponse';
import { GeneroDTO, TipoDocumentoDTO } from '../../../../../data/models/Entities';

@Component({
  selector: 'app-modal-crear-docente',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SharedDrawerComponent, CustomSelectComponent, ButtonModule],
  templateUrl: './modal-crear-docente.component.html',
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
    .form-row.single { grid-template-columns: 1fr; }
    .form-field { display: flex; flex-direction: column; gap: 0.4rem; }
    .field-label { font-size: 0.83rem; font-weight: 600; color: var(--text-color); display: flex; align-items: center; gap: 0.35rem; }
    .field-label i { font-size: 0.85rem; color: var(--brand-yellow-dark, #f59e0b); }
    .required { color: #ef4444; font-size: 0.9rem; }
    .form-input {
      padding: 0.55rem 0.85rem; border: 1px solid var(--surface-border);
      border-radius: 8px; background: var(--surface-card);
      color: var(--text-color); font-size: 0.875rem; width: 100%;
      transition: border-color 0.15s, box-shadow 0.15s; box-sizing: border-box;
    }
    .form-input:focus { outline: none; border-color: var(--brand-yellow-dark); box-shadow: 0 0 0 3px rgba(233,185,2,0.15); }
    .error-text { font-size: 0.77rem; color: #ef4444; display: flex; align-items: center; gap: 0.25rem; }
    .alert-error {
      display: flex; align-items: center; gap: 0.5rem; padding: 0.65rem 0.85rem;
      background: color-mix(in srgb, #ef4444 10%, var(--surface-card));
      border: 1px solid color-mix(in srgb, #ef4444 30%, transparent); border-radius: 8px;
      font-size: 0.83rem; color: #dc2626; margin-bottom: 1rem;
    }
    .loading-catalogs {
      text-align: center; padding: 2rem; color: var(--text-color-secondary);
      display: flex; flex-direction: column; align-items: center; gap: 0.75rem;
    }
    @media (max-width: 600px) {
      .form-row { grid-template-columns: 1fr; }
    }
  `]
})
export class ModalCrearDocenteComponent implements OnChanges {
  @Input() show = false;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  private http = inject(HttpClient);
  private fb = inject(FormBuilder);

  generos: GeneroDTO[] = [];
  tiposDocumento: TipoDocumentoDTO[] = [];
  loadingCatalogs = false;
  saving = false;
  errorMsg = '';

  generosOptions: any[] = [];
  tiposDocumentoOptions: any[] = [];

  form = this.fb.group({
    idTipoDocumento: [null as number | null, Validators.required],
    documento:       ['', Validators.required],
    idGenero:        [null as number | null, Validators.required],
    primerNombre:    ['', Validators.required],
    segundoNombre:   [''],
    primerApellido:  ['', Validators.required],
    segundoApellido: [''],
    email:           ['', [Validators.required, Validators.email]]
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['show']?.currentValue === true && !this.generos.length) {
      this.loadCatalogs();
    }
    if (changes['show']?.currentValue === false) {
      this.form.reset();
      this.errorMsg = '';
    }
  }

  private loadCatalogs(): void {
    this.loadingCatalogs = true;
    forkJoin({
      generos: this.http.get<IResponse<GeneroDTO[]>>(`${environment.apiUrl}/Genero/GetAllGenero`)
        .pipe(map(r => (r as any)?.data ?? r ?? [])),
      tipos: this.http.get<IResponse<TipoDocumentoDTO[]>>(`${environment.apiUrl}/TipoDocumento/GetAllTipoDocumento`)
        .pipe(map(r => (r as any)?.data ?? r ?? []))
    }).subscribe({
      next: ({ generos, tipos }) => {
        this.generos = Array.isArray(generos) ? generos : [];
        this.tiposDocumento = Array.isArray(tipos) ? tipos : [];
        this.generosOptions = this.generos.map(g => ({ label: g.nombre, value: g.idGenero }));
        this.tiposDocumentoOptions = this.tiposDocumento.map(t => ({ label: t.nombre, value: t.idTipoDocumento }));
        this.loadingCatalogs = false;
      },
      error: () => { this.loadingCatalogs = false; }
    });
  }

  async onSave(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    this.errorMsg = '';
    try {
      await lastValueFrom(
        this.http.post<any>(`${environment.apiUrl}/Docente/CreateDocente`, this.form.value)
      );
      this.saved.emit();
      this.close.emit();
    } catch (err: any) {
      this.errorMsg = err?.error?.message || err?.message || 'No se pudo crear el docente.';
    } finally {
      this.saving = false;
    }
  }

  onClose(): void { this.close.emit(); }

  get f() { return this.form.controls; }

  onTipoDocumentoChange(value: number | null): void {
    this.form.get('idTipoDocumento')?.setValue(value);
  }

  onGeneroChange(value: number | null): void {
    this.form.get('idGenero')?.setValue(value);
  }
}
