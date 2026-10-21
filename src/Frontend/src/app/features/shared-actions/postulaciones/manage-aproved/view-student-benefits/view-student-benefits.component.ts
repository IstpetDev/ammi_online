import { Component, Input, OnInit, OnChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { EstudianteBeneficioService } from '../../../../../core/services/pagos/estudiante-beneficio.service';
import { BeneficioService } from '../../../../../core/services/pagos/beneficio.service';
import { EspecieService } from '../../../../../core/services/infrastructure/especie.service';
import { AuthService } from '../../../../../core/auth/index';
import { EstudianteBeneficioDTO, BeneficioDTO, EspecieDTO } from '../../../../../data/models/Entities';
import { ButtonModule } from 'primeng/button';
import { SharedDrawerComponent } from '../../../../../shared/shared-drawer/shared-drawer.component';
@Component({
  selector: 'app-view-student-benefits',
  standalone: true,
  imports: [CommonModule, FormsModule, AutoCompleteModule, ButtonModule, SharedDrawerComponent ],
  templateUrl: './view-student-benefits.component.html',
  styleUrls: ['./view-student-benefits.component.css']
})
export class ViewStudentBenefitsComponent implements OnInit, OnChanges {

  @Input() idPersona!: number;
  @Input() idCiclo: number | null = null;
  @Input() idAprobadoPor: number | null = null;

  benefits: EstudianteBeneficioDTO[] = [];
  loading = false;
  error: string | null = null;
  especies: EspecieDTO[] = [];

  // Modal colocar beneficio
  showAsignarDialog = false;
  beneficiosDisponibles: BeneficioDTO[] = [];
  suggestions: BeneficioDTO[] = [];
  loadingBeneficios = false;
  beneficioSeleccionado: BeneficioDTO | null = null;
  fechaInicio: string = '';
  fechaFin: string = '';
  observaciones: string = '';
  asignando = false;
  asignarError: string | null = null;

  // Modal desactivar beneficio
  showDesactivarDialog = false;
  beneficioADesactivar: EstudianteBeneficioDTO | null = null;
  desactivarObservaciones: string = '';
  desactivando = false;
  desactivarError: string | null = null;

  private beneficioService = inject(EstudianteBeneficioService);
  private catalogoBeneficioService = inject(BeneficioService);
  private especieService = inject(EspecieService);
  private authService = inject(AuthService);

  ngOnInit(): void {
    if (this.idPersona) {
      this.loadBenefits();
    }
    this.loadEspecies();
  }

  ngOnChanges(): void {
    if (this.idPersona) {
      this.loadBenefits();
    }
  }

  loadEspecies(): void {
    this.especieService.getAll().subscribe({
      next: (data) => {
        this.especies = data ?? [];
      }
      // No mostramos error al cargar especies, solo dejamos la lista vacía
    });
  }

  private loadBenefits(): void {
    this.loading = true;
    this.error = null;
    this.benefits = [];

    this.beneficioService.getByAlumno(this.idPersona).subscribe({
      next: (data) => {
        this.benefits = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar los beneficios';
        this.loading = false;
        console.error('Error loading student benefits:', err);
      }
    });
  }

  get activeBenefits(): EstudianteBeneficioDTO[] {
    return this.benefits.filter(b => b.activo);
  }

  get inactiveBenefits(): EstudianteBeneficioDTO[] {
    return this.benefits.filter(b => !b.activo);
  }

  formatValue(benefit: EstudianteBeneficioDTO): string {
    if (benefit.tipoValor === 'PORCENTAJE') {
      return `${benefit.valor ?? 0}%`;
    }
    return `$${(benefit.valor ?? 0).toFixed(2)}`;
  }

  formatBeneficioValue(beneficio: BeneficioDTO | null): string {
    if (!beneficio) return '—';
    if (beneficio.tipoValor === 'PORCENTAJE') {
      return `${beneficio.valor ?? 0}%`;
    }
    return `$${(beneficio.valor ?? 0).toFixed(2)}`;
  }

  getEspecieLabel(aplicaA?: number): string {
    if (!aplicaA) return '—';
    return this.especies.find(e => e.idEspecie === aplicaA)?.detalle ?? '—';
  }

  abrirModalAsignar(): void {
    this.beneficioSeleccionado = null;
    this.fechaInicio = new Date().toISOString().split('T')[0];
    this.fechaFin = '';
    this.observaciones = '';
    this.asignarError = null;
    this.showAsignarDialog = true;

    if (this.beneficiosDisponibles.length === 0) {
      this.loadingBeneficios = true;
      this.catalogoBeneficioService.getAll().subscribe({
        next: (data) => {
          this.beneficiosDisponibles = data.filter(b => b.activo);
          this.suggestions = [...this.beneficiosDisponibles];
          this.loadingBeneficios = false;
        },
        error: () => { this.loadingBeneficios = false; }
      });
    } else {
      this.suggestions = [...this.beneficiosDisponibles];
    }
  }

  seleccionarBeneficio(b: BeneficioDTO): void {
    this.beneficioSeleccionado = b;
  }

  filterBeneficios(event: any): void {
    const query = event.query.toLowerCase();
    this.suggestions = this.beneficiosDisponibles.filter(b => b.detalle?.toLowerCase().includes(query));
  }

  confirmarAsignar(): void {
    if (!this.beneficioSeleccionado?.idBeneficio || !this.fechaInicio) {
      this.asignarError = 'Selecciona un beneficio y completa la fecha de inicio.';
      return;
    }

    const idAprobadoPor = this.idAprobadoPor ?? this.authService.getCurrentUser()?.id ?? 0;
    const idCiclo = this.idCiclo ?? 0;

    this.asignando = true;
    this.asignarError = null;

    this.beneficioService.asignarBeneficioCompleto({
      idPersona: this.idPersona,
      idBeneficio: this.beneficioSeleccionado.idBeneficio,
      idCiclo,
      fechaInicio: this.fechaInicio,
      fechaFin: this.fechaFin || null,
      idAprobadoPor,
      observaciones: this.observaciones
    }).subscribe({
      next: () => {
        this.asignando = false;
        this.showAsignarDialog = false;
        this.loadBenefits();
      },
      error: (err) => {
        this.asignando = false;
        this.asignarError = err.error?.message || 'Error al asignar el beneficio. Intenta nuevamente.';
      }
    });
  }

  cancelarAsignar(): void {
    this.showAsignarDialog = false;
  }

  abrirModalDesactivar(benefit: EstudianteBeneficioDTO): void {
    this.beneficioADesactivar = benefit;
    this.desactivarObservaciones = '';
    this.desactivarError = null;
    this.showDesactivarDialog = true;
  }

  confirmarDesactivar(): void {
    if (!this.beneficioADesactivar?.idEstudianteBeneficio) return;
    this.desactivando = true;
    this.desactivarError = null;
    this.beneficioService.desactivar({
      idEstudianteBeneficio: this.beneficioADesactivar.idEstudianteBeneficio,
      observaciones: this.desactivarObservaciones
    }).subscribe({
      next: () => {
        this.desactivando = false;
        this.showDesactivarDialog = false;
        this.beneficioADesactivar = null;
        this.loadBenefits();
      },
      error: (err) => {
        this.desactivando = false;
        this.desactivarError = err.error?.message || 'Error al desactivar el beneficio.';
      }
    });
  }

  cancelarDesactivar(): void {
    this.showDesactivarDialog = false;
    this.beneficioADesactivar = null;
  }
}
