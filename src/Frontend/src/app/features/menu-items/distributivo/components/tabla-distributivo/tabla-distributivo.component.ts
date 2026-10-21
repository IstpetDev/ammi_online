import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { DistributivoDTO, DocenteDisponibleDTO } from '../../../../../data/models/distributivo/distributivo.model';
import { MallaDTO, ParaleloDTO } from '../../../../../data/models/Entities';

@Component({
  selector: 'app-tabla-distributivo',
  standalone: true,
  imports: [CommonModule, ButtonModule, TooltipModule, TagModule],
  templateUrl: './tabla-distributivo.component.html',
  styles: [`
    .distributivo-lista {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    /* ─── CARDS ─── */
    .docente-card, .curso-card {
      background-color: var(--surface-card);
      border-radius: 8px;
      border: 1px solid var(--surface-border);
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .docente-card.docente-sin-asignaciones {
      opacity: 0.75;
      border-style: dashed;
    }

    .docente-header, .curso-header {
      background: linear-gradient(135deg, var(--surface-ground) 0%, var(--surface-100) 100%);
      padding: 0.75rem 1rem;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid var(--surface-border);
    }

    .docente-info, .curso-info {
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
      flex: 1;
    }

    .docente-title, .curso-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .docente-title i, .curso-title i {
      font-size: 1.1rem;
      color: var(--primary-color);
    }

    .docente-nombre {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-color);
    }

    /* ─── PARALELO CHIPS ─── */
    .paralelos-summary {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      padding-left: 1.6rem;
    }

    .paralelo-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      border-radius: 20px;
      padding: 0.2rem 0.6rem;
      font-size: 0.72rem;
      font-weight: 600;
      border: 1px solid transparent;
    }

    .paralelo-chip.chip-completo {
      background-color: color-mix(in srgb, var(--green-100, #dcfce7) 80%, transparent);
      border-color: var(--green-300, #86efac);
      color: var(--green-700, #15803d);
    }

    .paralelo-chip.chip-incompleto {
      background-color: color-mix(in srgb, var(--orange-100, #ffedd5) 80%, transparent);
      border-color: var(--orange-300, #fdba74);
      color: var(--orange-700, #c2410c);
    }

    .chip-label {
      font-weight: 700;
    }

    .chip-sep {
      opacity: 0.5;
    }

    .chip-asignadas {
      color: var(--green-600, #16a34a);
    }

    .chip-pendiente {
      color: var(--red-500, #ef4444);
    }

    /* ─── DOCENTE / CURSO STATS ─── */
    .docente-stats {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      padding-left: 1.6rem;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.78rem;
      color: var(--text-color-secondary);
      font-weight: 500;
    }

    .stat-item i {
      font-size: 0.78rem;
      color: var(--primary-color);
    }

    .stat-item.stat-asignadas i { color: var(--green-500, #22c55e); }
    .stat-item.stat-asignadas   { color: var(--green-600, #16a34a); }

    .stat-item.stat-pendiente i { color: var(--orange-500, #f97316); }
    .stat-item.stat-pendiente   { color: var(--orange-600, #ea580c); }

    .stat-item.stat-sinasig i   { color: var(--surface-400); }
    .stat-item.stat-sinasig     { color: var(--text-color-secondary); font-style: italic; }

    /* ─── MATERIAS ─── */
    .materias-lista {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .materia-item {
      background-color: var(--surface-card);
      border-bottom: 1px solid var(--surface-border);
      transition: background-color 0.12s;
    }

    .materia-item:last-child { border-bottom: none; }

    .materia-item:hover {
      background-color: var(--surface-hover);
    }

    .materia-item.materia-sin-docente {
      border-left: 3px solid var(--orange-400, #fb923c);
    }

    .materia-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.65rem 1rem;
    }

    .materia-row-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex: 1;
      min-width: 0;
    }

    .materia-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 1.9rem;
      height: 1.9rem;
      background-color: var(--primary-color);
      color: white;
      border-radius: 6px;
      flex-shrink: 0;
    }

    .materia-icon.materia-icon-pendiente {
      background-color: var(--orange-400, #fb923c);
    }

    .materia-icon i { font-size: 0.9rem; }

    .materia-info { flex: 1; min-width: 0; }

    .materia-nombre {
      font-size: 0.88rem;
      font-weight: 600;
      color: var(--text-color);
      display: block;
      margin-bottom: 0.2rem;
    }

    .materia-meta {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      flex-wrap: wrap;
      font-size: 0.74rem;
      color: var(--text-color-secondary);
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 0.2rem;
    }

    .meta-item.pendiente-text { color: var(--orange-600, #ea580c); font-style: italic; }

    .materia-row-right, .materia-actions {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      flex-shrink: 0;
    }

    /* ─── DOCENTE VIEW: materia-info-principal ─── */
    .materia-info-principal {
      flex: 1;
      min-width: 0;
    }

    .materia-detalle { display: flex; flex-direction: column; gap: 0.2rem; }

    :host ::ng-deep .p-tag { font-size: 0.68rem; padding: 0.18rem 0.45rem; }
    :host ::ng-deep .p-button.p-button-sm { padding: 0.3rem; font-size: 0.78rem; }

    /* ─── NO PARALELOS MESSAGE ─── */
    .no-paralelos-msg {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      font-size: 0.82rem;
      color: var(--text-color-secondary);
      background: color-mix(in srgb, var(--orange-100, #ffedd5) 60%, var(--surface-card));
    }
    .no-paralelos-msg i { color: var(--orange-500, #f97316); flex-shrink: 0; }

    /* ─── PARALELO LEVEL-2 ─── */
    .paralelos-lista { display: flex; flex-direction: column; gap: 0; }

    .paralelo-section {
      border-bottom: 1px solid var(--surface-border);
    }
    .paralelo-section:last-child { border-bottom: none; }

    .paralelo-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.55rem 1rem 0.55rem 2rem;
      background: color-mix(in srgb, var(--primary-color) 4%, var(--surface-card));
      cursor: pointer;
      transition: background-color 0.12s;
    }
    .paralelo-header:hover {
      background: color-mix(in srgb, var(--primary-color) 9%, var(--surface-card));
    }

    .paralelo-header-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex: 1;
      flex-wrap: wrap;
    }

    .paralelo-header-info i { color: var(--primary-color); font-size: 0.8rem; }

    .paralelo-titulo {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-color);
    }

    .paralelo-mini-stats {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.74rem;
    }

    .mini-stat { color: var(--text-color-secondary); font-weight: 500; }
    .mini-sep { color: var(--surface-400); }
    .mini-stat.asig { color: var(--green-600, #16a34a); }
    .mini-stat.pend { color: var(--orange-600, #ea580c); }

    @media (max-width: 768px) {
      .docente-header, .curso-header { flex-direction: column; gap: 0.5rem; }
      .docente-stats { flex-direction: column; gap: 0.3rem; padding-left: 1.6rem; }
      .paralelos-summary { padding-left: 0; }
      .materia-row { padding: 0.5rem 0.75rem; }
      .materia-nombre { white-space: normal; }
      .paralelo-header { padding-left: 1rem; }
    }
  `]
})
export class TablaDistributivoComponent implements OnChanges {
  // Estado de acordeón
  cursoAccordion: Record<number, boolean> = {};
  docenteAccordion: Record<string, boolean> = {};
  paraleloAccordion: Record<string, boolean> = {};

  toggleCursoAccordion(idMalla: number): void {
    this.cursoAccordion[idMalla] = !this.cursoAccordion[idMalla];
  }

  toggleDocenteAccordion(nombreDocente: string): void {
    this.docenteAccordion[nombreDocente] = !this.docenteAccordion[nombreDocente];
  }

  toggleParaleloAccordion(idMalla: number, nombreParalelo: string): void {
    const key = this.paraleloKey(idMalla, nombreParalelo);
    this.paraleloAccordion[key] = !this.paraleloAccordion[key];
  }

  paraleloKey(idMalla: number, nombreParalelo: string): string {
    return `${idMalla}_${nombreParalelo}`;
  }

  @Input() distributivos: DistributivoDTO[] = [];
  @Input() tipoVisualizacion: 'docente' | 'curso' = 'curso';
  @Input() docentes: DocenteDisponibleDTO[] = [];
  @Input() paralelos: ParaleloDTO[] = [];
  @Input() mallas: MallaDTO[] = [];
  @Output() editar = new EventEmitter<DistributivoDTO>();
  @Output() editarFechas = new EventEmitter<DistributivoDTO>();
  @Output() eliminar = new EventEmitter<number>();
  @Output() verCarga = new EventEmitter<number>();
  @Output() crearParalelo = new EventEmitter<void>();

  docentesAgrupados: Array<{
    nombreDocente: string;
    idPersona: number | null;
    materias: DistributivoDTO[];
    totalHoras: number;
    sinAsignaciones: boolean;
    esPendiente: boolean;
  }> = [];

  cursosAgrupados: Array<{
    nombreCurso: string;
    idMalla: number;
    sinParalelos: boolean;
    totalMaterias: number;
    asignadas: number;
    sinAsignar: number;
    totalHoras: number;
    paralelos: Array<{
      idParalelo: number | null;
      nombreParalelo: string;
      total: number;
      asignadas: number;
      sinAsignar: number;
      totalHoras: number;
      materias: DistributivoDTO[];
    }>;
  }> = [];

  materiaAccordionState: { [key: number]: { expanded: boolean } } = {};

  onEditar(item: DistributivoDTO): void { this.editar.emit(item); }
  onEditarFechas(item: DistributivoDTO): void { this.editarFechas.emit(item); }
  onEliminar(id: number): void { this.eliminar.emit(id); }
  onVerCarga(idPersona: number): void { this.verCarga.emit(idPersona); }

  getStatusSeverity(status?: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (status) {
      case 'InProgress': return 'success';
      case 'GracePeriod': return 'warn';
      case 'Closed': return 'danger';
      case 'NotStarted': return 'info';
      default: return 'secondary';
    }
  }

  getStatusLabel(status?: string): string {
    switch (status) {
      case 'InProgress': return 'Activo';
      case 'GracePeriod': return 'Prórroga';
      case 'Closed': return 'Cerrado';
      case 'NotStarted': return 'No iniciado';
      default: return status || 'Sin fechas';
    }
  }

  toggleMateriaAccordion(materia: DistributivoDTO): void {
    const id = materia.idDistributivo!;
    if (!this.materiaAccordionState[id]) {
      this.materiaAccordionState[id] = { expanded: false };
    }
    this.materiaAccordionState[id].expanded = !this.materiaAccordionState[id].expanded;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['distributivos'] || changes['tipoVisualizacion'] || changes['docentes'] || changes['paralelos'] || changes['mallas']) {
      if (this.tipoVisualizacion === 'curso') {
        this.agruparPorCurso();
      } else {
        this.agruparPorDocente();
      }
    }
  }

  getNombreParalelo(idParalelo?: number | null): string {
    if (!idParalelo) return 'Sin paralelo';
    const p = this.paralelos.find(x => x.idParalelo === idParalelo);
    return p?.detalle || p?.nombreParalelo || `P-${idParalelo}`;
  }

  tieneDocente(d: DistributivoDTO): boolean {
    return !!(d.nombreDocente &&
      d.nombreDocente !== 'Sin asignar' &&
      d.nombreDocente !== 'PENDIENTE ASIGNACIÓN' &&
      d.nombreDocente.trim() !== '');
  }

  private agruparPorDocente(): void {
    const grupos = new Map<string, DistributivoDTO[]>();

    this.distributivos.forEach(dist => {
      const key = this.tieneDocente(dist) ? dist.nombreDocente : '__PENDIENTE__';
      if (!grupos.has(key)) grupos.set(key, []);
      grupos.get(key)!.push(dist);
    });

    const result: typeof this.docentesAgrupados = [];

    grupos.forEach((materias, key) => {
      if (key === '__PENDIENTE__') {
        result.push({
          nombreDocente: 'Pendientes de asignación',
          idPersona: null,
          materias,
          totalHoras: materias.reduce((s, m) => s + (m.horasMateria || 0), 0),
          sinAsignaciones: false,
          esPendiente: true
        });
      } else {
        result.push({
          nombreDocente: key,
          idPersona: materias[0]?.idPersona || null,
          materias,
          totalHoras: materias.reduce((s, m) => s + (m.horasMateria || 0), 0),
          sinAsignaciones: false,
          esPendiente: false
        });
      }
    });

    // Add teachers from docentes list that have no distributivos in current ciclo
    const assignedIds = new Set(
      result.filter(r => !r.esPendiente && r.idPersona).map(r => r.idPersona)
    );

    this.docentes
      .filter(d => !assignedIds.has(d.idPersona))
      .forEach(d => {
        result.push({
          nombreDocente: d.nombreCompleto,
          idPersona: d.idPersona,
          materias: [],
          totalHoras: 0,
          sinAsignaciones: true,
          esPendiente: false
        });
      });

    // Sort: assigned first (alphabetically), then pendientes, then sin asignaciones
    result.sort((a, b) => {
      if (a.esPendiente) return 0.5 - (b.esPendiente ? 0.5 : 1);
      if (a.sinAsignaciones !== b.sinAsignaciones) return a.sinAsignaciones ? 1 : -1;
      return a.nombreDocente.localeCompare(b.nombreDocente);
    });

    this.docentesAgrupados = result;
  }

  private agruparPorCurso(): void {
    // Build map: idMalla → distributivos
    const distribByMalla = new Map<number, DistributivoDTO[]>();
    this.distributivos.forEach(dist => {
      const id = dist.idMalla || 0;
      if (!distribByMalla.has(id)) distribByMalla.set(id, []);
      distribByMalla.get(id)!.push(dist);
    });

    // Start from all mallas input (all courses in ciclo)
    const mallasMap = new Map<number, MallaDTO>();
    this.mallas.forEach(m => { if (m.idMalla) mallasMap.set(m.idMalla, m); });
    // Also include mallas from distributivos not present in mallas input
    this.distributivos.forEach(dist => {
      if (dist.idMalla && !mallasMap.has(dist.idMalla)) {
        mallasMap.set(dist.idMalla, { idMalla: dist.idMalla, detalle: dist.nombreMalla });
      }
    });

    const result: typeof this.cursosAgrupados = [];

    mallasMap.forEach((malla, idMalla) => {
      const materias = distribByMalla.get(idMalla) || [];
      const sinParalelos = materias.length === 0;

      // Group materias by paralelo
      const paraleloMap = new Map<string, { idParalelo: number | null; items: DistributivoDTO[] }>();
      materias.forEach(m => {
        const nombre = this.getNombreParalelo(m.idParalelo);
        if (!paraleloMap.has(nombre)) paraleloMap.set(nombre, { idParalelo: m.idParalelo ?? null, items: [] });
        paraleloMap.get(nombre)!.items.push(m);
      });

      const paralelos = Array.from(paraleloMap.entries())
        .map(([nombreParalelo, { idParalelo, items }]) => ({
          idParalelo,
          nombreParalelo,
          total: items.length,
          asignadas: items.filter(i => this.tieneDocente(i)).length,
          sinAsignar: items.filter(i => !this.tieneDocente(i)).length,
          totalHoras: items.reduce((s, m) => s + (m.horasMateria || 0), 0),
          materias: [...items].sort((a, b) => (a.nombreMateria || '').localeCompare(b.nombreMateria || ''))
        }))
        .sort((a, b) => a.nombreParalelo.localeCompare(b.nombreParalelo));

      const asignadas = materias.filter(m => this.tieneDocente(m)).length;

      result.push({
        nombreCurso: malla.detalle || 'Sin nombre',
        idMalla,
        sinParalelos,
        totalMaterias: materias.length,
        asignadas,
        sinAsignar: materias.length - asignadas,
        totalHoras: materias.reduce((s, m) => s + (m.horasMateria || 0), 0),
        paralelos
      });
    });

    result.sort((a, b) => {
      const oA = mallasMap.get(a.idMalla)?.ordenCurso ?? 9999;
      const oB = mallasMap.get(b.idMalla)?.ordenCurso ?? 9999;
      return oA - oB;
    });
    this.cursosAgrupados = result;
  }
}
