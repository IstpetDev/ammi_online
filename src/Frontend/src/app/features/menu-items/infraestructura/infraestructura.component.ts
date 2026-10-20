import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SeasonsComponent } from '../../shared-actions/settings/seasons/seasons.component';
import { StudyAreasComponent } from '../../shared-actions/settings/study-areas/study-areas.component';
import { MallasComponent } from '../../shared-actions/settings/mallas/mallas.component';
import { GradesComponent } from '../../shared-actions/settings/grades/grades.component';

@Component({
  selector: 'app-infraestructura',
  standalone: true,
  imports: [CommonModule,  SeasonsComponent, StudyAreasComponent, MallasComponent, GradesComponent],
  templateUrl: './infraestructura.component.html',
  styleUrls: ['./infraestructura.component.css']
})
export class InfraestructuraComponent {
  showSeasonsComponent: boolean = false;
  showStudyAreasComponent: boolean = false;
  showMallasComponent: boolean = false;
  showGradesComponent: boolean = false;

  showSeasons() {
    this.showSeasonsComponent = true;
    this.showStudyAreasComponent = false;
    this.showMallasComponent = false;
    this.showGradesComponent = false;
  }

  showStudyAreas() {
    this.showStudyAreasComponent = true;
    this.showSeasonsComponent = false;
    this.showMallasComponent = false;
    this.showGradesComponent = false;
  }

  showMallas() {
    this.showMallasComponent = true;
    this.showSeasonsComponent = false;
    this.showStudyAreasComponent = false;
    this.showGradesComponent = false;
  }

  showGrades() {
    this.showGradesComponent = true;
    this.showSeasonsComponent = false;
    this.showStudyAreasComponent = false;
    this.showMallasComponent = false;
  }

  hideComponents() {
    this.showSeasonsComponent = false;
    this.showStudyAreasComponent = false;
    this.showMallasComponent = false;
    this.showGradesComponent = false;
  }
}