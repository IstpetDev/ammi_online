import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlantillaListComponent } from './components/plantilla-list/plantilla-list.component';
import { PlantillaEvaluacionDTO } from '../../../../data/models/notas';

import { PlantillaFormComponent } from './components/plantilla-form/plantilla-form.component';
import { ConfigurarPlantillaComponent } from './pages/configurar-plantilla/configurar-plantilla.component';
import { SharedDrawerComponent } from '../../../../shared/shared-drawer/shared-drawer.component';
import { SharedModalComponent } from '../../../../shared/shared-modal/shared-modal.component';
import { SharedToastComponent } from '../../../../shared/shared-toast/shared-toast.component';

@Component({
  selector: 'app-grades',
  standalone: true,
  imports: [CommonModule,
    PlantillaListComponent,
    PlantillaFormComponent,
    ConfigurarPlantillaComponent,
    SharedDrawerComponent,
    SharedModalComponent, SharedToastComponent],
  templateUrl: './grades.component.html',
  styleUrls: ['./grades.component.css']
})
export class GradesComponent {
  @ViewChild(PlantillaListComponent) plantillaListComponent?: PlantillaListComponent;
  @ViewChild(PlantillaFormComponent) plantillaFormComponent?: PlantillaFormComponent;

  selectedPlantilla: PlantillaEvaluacionDTO | null = null;
  showFormDialog = false;
  showConfigureDialog = false;
  isEditing = false;

  showCreate() {
    this.isEditing = false;
    this.selectedPlantilla = null;
    this.showFormDialog = true;
  }

  showEdit(plantilla: PlantillaEvaluacionDTO) {
    this.isEditing = true;
    this.selectedPlantilla = plantilla;
    this.showFormDialog = true;
  }

  showConfigure(plantilla: PlantillaEvaluacionDTO) {
    this.selectedPlantilla = plantilla;
    this.showConfigureDialog = true;
  }

  // Hndlers para eventos de hijos
  submitForm() {
    this.plantillaFormComponent?.onSubmit();
  }

  onFormSave() {
    this.closeFormDialog();
    this.plantillaListComponent?.loadPlantillas();
  }

  closeFormDialog() {
    this.showFormDialog = false;
    this.selectedPlantilla = null;
    this.isEditing = false;
  }

  closeConfigureDialog() {
    this.showConfigureDialog = false;
    this.selectedPlantilla = null;
  }
}
