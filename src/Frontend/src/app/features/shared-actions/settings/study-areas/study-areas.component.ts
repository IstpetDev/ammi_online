import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AreasComponent } from './areas/areas.component';
import { AreasCompetenciaComponent } from './areas-competencia/areas-competencia.component';

@Component({
  selector: 'app-study-areas',
  standalone: true,
  imports: [CommonModule, AreasComponent, AreasCompetenciaComponent],
  templateUrl: './study-areas.component.html',
  styleUrls: ['./study-areas.component.css']
})
export class StudyAreasComponent implements OnInit {
  activeTab: string = 'areas';

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