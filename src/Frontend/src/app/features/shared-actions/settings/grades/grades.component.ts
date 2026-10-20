import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlantillaListComponent } from './components/plantilla-list/plantilla-list.component';
import { PlantillaEvaluacionDTO } from '../../../../data/models/notas';

import { PlantillaFormComponent } from './components/plantilla-form/plantilla-form.component';
import { ConfigurarPlantillaComponent } from './pages/configurar-plantilla/configurar-plantilla.component';

@Component({
  selector: 'app-grades',
  standalone: true,
  imports: [
    CommonModule,
    PlantillaListComponent,
    PlantillaFormComponent,
    ConfigurarPlantillaComponent
  ],
  templateUrl: './grades.component.html',
  styleUrls: ['./grades.component.css']
})
export class GradesComponent {
  activeView: 'list' | 'create' | 'edit' | 'configure' = 'list';
  selectedPlantilla: PlantillaEvaluacionDTO | null = null;

  showList() {
    this.activeView = 'list';
    this.selectedPlantilla = null;
  }

  showCreate() {
    this.activeView = 'create';
    this.selectedPlantilla = null;
  }

  showEdit(plantilla: PlantillaEvaluacionDTO) {
    this.activeView = 'edit';
    this.selectedPlantilla = plantilla;
  }

  showConfigure(plantilla: PlantillaEvaluacionDTO) {
    this.activeView = 'configure';
    this.selectedPlantilla = plantilla;
  }

  // Hndlers para eventos de hijos
  onFormSave() {
    this.showList();
  }
}
