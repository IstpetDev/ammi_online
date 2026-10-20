import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { Router } from '@angular/router';
import { PostulacionService } from '../../../../core/services/postulaciones/postulacion.service';
import { PostulacionCompletaDTO } from '../../../../data/models/Entities';
import { TipoOfertaService } from '../../../../core/services/postulaciones/tipo-oferta.service';
import { CicloService } from '../../../../core/services/postulaciones/ciclo.service';
import { CursoService } from '../../../../core/services/postulaciones/curso.service';
import { TipoEstadoAprobacionService } from '../../../../core/services/postulaciones/tipo-estado-aprovacion.service';
import { TipoOfertaDTO, CicloDTO, CursoDTO, TipoEstadoAprobacionDTO } from '../../../../data/models/Entities';

@Component({
  selector: 'app-manage-postulations',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule, TooltipModule],
  templateUrl: './manage-postulations.component.html',
  styleUrls: ['./manage-postulations.component.css']
})
export class ManagePostulationsComponent implements OnInit {

  postulaciones: PostulacionCompletaDTO[] = [];

  // Opciones para selects
  tiposOferta: TipoOfertaDTO[] = [];
  ciclos: CicloDTO[] = [];
  cursos: CursoDTO[] = [];
  estados: TipoEstadoAprobacionDTO[] = [];

  // Filtros
  filtroOferta: TipoOfertaDTO | null = null;
  filtroCiclo: CicloDTO | null = null;
  filtroEstado: TipoEstadoAprobacionDTO | null = null;
  filtroNombre: string = '';

  constructor(
    private postulacionService: PostulacionService,
    private tipoOfertaService: TipoOfertaService,
    private cicloService: CicloService,
    private cursoService: CursoService,
    private tipoEstadoAprobacionService: TipoEstadoAprobacionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadPostulaciones();
    this.loadFiltros();
  }

  loadFiltros(): void {
    this.tipoOfertaService.getTiposOferta().subscribe({
      next: (data) => this.tiposOferta = data,
      error: () => {}
    });
    this.cicloService.getAll().subscribe({
      next: (data) => this.ciclos = data,
      error: () => {}
    });
    this.cursoService.getCursos().subscribe({
      next: (data) => this.cursos = data,
      error: () => {}
    });
    this.tipoEstadoAprobacionService.getEstadosPostulacion().subscribe({
      next: (data) => this.estados = data,
      error: () => {}
    });
  }

  limpiarFiltros(): void {
    this.filtroOferta = null;
    this.filtroCiclo = null;
    this.filtroEstado = null;
    this.filtroNombre = '';
  }

  loadPostulaciones(): void {
    this.postulacionService.getPostulacionesFromAPI().subscribe({
      next: (data) => {
        this.postulaciones = data.filter(p => p.Estado !== 'APROBADO');
        console.log('Postulaciones cargadas desde API:', data.length);
        console.log('Primera postulación:', data[0]); // Para depurar
      },
      error: (err) => {
        console.error('Error loading postulaciones:', err);
      }
    });
  }

  verDetalles(postulacion: PostulacionCompletaDTO): void {
    this.router.navigate(['/dashboard/postulacion', postulacion.Documento]);
  }

  editarPostulacion(postulacion: PostulacionCompletaDTO): void {

  }


  // Método para filtrar postulaciones
  get postulacionesFiltradas(): PostulacionCompletaDTO[] {
    return this.postulaciones.filter(p => {
      const matchOferta = !this.filtroOferta || p.OfertaAcademica === this.filtroOferta.detalle;
      const matchCiclo = !this.filtroCiclo || p.Ciclo === this.filtroCiclo.detalle;
      const matchEstado = !this.filtroEstado || p.Estado === this.filtroEstado.detalle;
      const matchNombre = !this.filtroNombre || p.NombreCompleto?.toLowerCase().includes(this.filtroNombre.toLowerCase());
      return matchOferta && matchCiclo && matchEstado && matchNombre;
    });
  }
}
