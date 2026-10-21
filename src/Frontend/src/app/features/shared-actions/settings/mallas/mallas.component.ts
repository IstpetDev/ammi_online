import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CursosComponent } from './cursos/cursos.component';
import { TipoOfertaComponent } from './tipo-oferta/tipo-oferta.component';
import { MateriasComponent } from './materias/materias.component';
import { EspecialidadesComponent } from './especialidades/especialidades.component';
import { RequisitosComponent } from './requisitos/requisitos.component';
import { BeneficiosComponent } from './beneficios/beneficios.component';

@Component({
  selector: 'app-mallas',
  standalone: true,
  imports: [CommonModule, RouterLink, CursosComponent, TipoOfertaComponent, MateriasComponent, EspecialidadesComponent, RequisitosComponent, BeneficiosComponent],
  templateUrl: './mallas.component.html',
  styleUrls: ['./mallas.component.css']
})
export class MallasComponent implements OnInit {
  activeTab: string = 'cursos';

  @Output() backClicked = new EventEmitter<void>();

  constructor() { }

  ngOnInit(): void {
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  onBackClick() {
    this.backClicked.emit();
  }
}