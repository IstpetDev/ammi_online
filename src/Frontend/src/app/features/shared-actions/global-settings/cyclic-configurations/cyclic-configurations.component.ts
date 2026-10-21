import { Component, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { EspecieCicloComponent } from './especie-ciclo/especie-ciclo.component';
import { MallasListComponent } from './mallas-list/mallas-list.component';
import { MallaRequisitosComponent } from './malla-requisitos/malla-requisitos.component';
import { DetalleMallaComponent } from './detalle-malla/detalle-malla.component';
import { MallaParaleloComponent } from './malla-paralelo/malla-paralelo.component';
import { MallaClonarCompletaComponent } from './malla-clonar-completa/malla-clonar-completa.component';

@Component({
  selector: 'app-cyclic-configurations',
  standalone: true,
  imports: [
    CommonModule,
    EspecieCicloComponent,
    MallasListComponent,
    MallaClonarCompletaComponent,
    MallaRequisitosComponent,
    DetalleMallaComponent,
    MallaParaleloComponent
  ],
  templateUrl: './cyclic-configurations.component.html',
  styleUrls: ['./cyclic-configurations.component.css']
})
export class CyclicConfigurationsComponent implements OnInit {
  activeTab: string = 'mallas';
  private route = inject(ActivatedRoute);

  @Output() backClicked = new EventEmitter<void>();

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['tab']) {
        this.activeTab = params['tab'];
      }
    });
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  onBackClick() {
    this.backClicked.emit();
  }
}