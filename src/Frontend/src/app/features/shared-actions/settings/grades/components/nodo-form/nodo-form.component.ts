import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  PlantillaEstructuraDTO,
  TipoPlantillaEstructuraDTO,
  PlantillaEstructuraCreateDTO,
  PlantillaEstructuraUpdateDTO,
  TipoReglaCalculoDTO,
  ReglasCalculoDTO,
  ReglasCalculoCreateDTO,
  ReglasCalculoUpdateDTO
} from '../../../../../../data/models/notas';

// Shared Imports
import { SharedDrawerComponent } from '../../../../../../shared/shared-drawer/shared-drawer.component';

// PrimeNG Imports
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';

// Interfaz para emitir datos con regla
export interface NodoConReglaData {
  nodo: PlantillaEstructuraCreateDTO | PlantillaEstructuraUpdateDTO;
  regla?: ReglasCalculoCreateDTO | ReglasCalculoUpdateDTO | null;
  eliminarRegla?: boolean;
}

@Component({
  selector: 'app-nodo-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SharedDrawerComponent,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    CheckboxModule,
    DividerModule,
    TooltipModule
  ],
  templateUrl: './nodo-form.component.html',
  styleUrls: ['./nodo-form.component.css']
})
export class NodoFormComponent implements OnInit, OnChanges {
  @Input() visible: boolean = false;
  @Input() nodo: PlantillaEstructuraDTO | null = null;
  @Input() idPlantillaEvaluacion!: number;
  @Input() idNodoPadre: number | null = null;
  @Input() tiposEstructura: TipoPlantillaEstructuraDTO[] = [];
  @Input() tiposReglaCalculo: TipoReglaCalculoDTO[] = [];
  @Input() reglaExistente: ReglasCalculoDTO | null = null;
  @Input() ordenSugerido: number = 1;

  @Output() save = new EventEmitter<NodoConReglaData>();
  @Output() cancel = new EventEmitter<void>();
  @Output() visibleChange = new EventEmitter<boolean>();

  nodoForm: FormGroup;
  title: string = 'Nuevo Nodo';

  // Flag para saber si es nodo con hijos (tiene sentido configurar regla)
  tieneHijos: boolean = false;

  constructor(private fb: FormBuilder) {
    this.nodoForm = this.fb.group({
      // Datos del nodo
      nodoNombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      peso: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      idTipoPlantillaEstructura: [null as number | null, Validators.required],
      orden: [1, [Validators.required, Validators.min(1)]],
      // Regla de calculo
      configurarRegla: [false],
      idTipoReglaCalculo: [null as number | null],
      notaMinimaAprobar: [7.00],
      notaMinimaRecuperar: [4.01]
    });
  }

  ngOnInit(): void {
    // Suscribirse a cambios en configurarRegla para activar/desactivar validaciones
    this.nodoForm.get('configurarRegla')?.valueChanges.subscribe(checked => {
      const tipoReglaControl = this.nodoForm.get('idTipoReglaCalculo');
      if (checked) {
        tipoReglaControl?.setValidators(Validators.required);
      } else {
        tipoReglaControl?.clearValidators();
        tipoReglaControl?.setValue(null); // Opcional: limpiar valor si se desactiva
      }
      tipoReglaControl?.updateValueAndValidity();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.initForm();
    }
  }

  private initForm(): void {
    if (this.nodo) {
      this.title = 'Editar Nodo';
      this.tieneHijos = (this.nodo.hijos && this.nodo.hijos.length > 0);

      this.nodoForm.patchValue({
        nodoNombre: this.nodo.nodoNombre,
        peso: this.nodo.peso,
        idTipoPlantillaEstructura: this.nodo.idTipoPlantillaEstructura,
        orden: this.nodo.orden,
        configurarRegla: !!this.reglaExistente,
        idTipoReglaCalculo: this.reglaExistente?.idTipoReglaCalculo || null,
        notaMinimaAprobar: this.reglaExistente?.notaMinimaAprobar ?? 7.00,
        notaMinimaRecuperar: this.reglaExistente?.notaMinimaRecuperar ?? 4.01
      });
    } else {
      this.title = 'Nuevo Nodo';
      this.tieneHijos = false;

      this.nodoForm.reset({
        nodoNombre: '',
        peso: 0,
        idTipoPlantillaEstructura: null,
        orden: this.ordenSugerido,
        configurarRegla: false,
        idTipoReglaCalculo: null,
        notaMinimaAprobar: 7.00,
        notaMinimaRecuperar: 4.01
      });
    }
  }

  get configurarRegla(): boolean {
    return this.nodoForm.get('configurarRegla')?.value === true;
  }

  onCancel(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.cancel.emit();
  }

  onSubmit(): void {
    if (this.nodoForm.invalid) {
      this.nodoForm.markAllAsTouched();
      return;
    }

    const formValue = this.nodoForm.value;

    // Construir datos del nodo
    let nodoData: PlantillaEstructuraCreateDTO | PlantillaEstructuraUpdateDTO;

    if (this.nodo) {
      nodoData = {
        idPlantillaEstructura: this.nodo.idPlantillaEstructura,
        nodoNombre: formValue.nodoNombre,
        peso: formValue.peso,
        idTipoPlantillaEstructura: formValue.idTipoPlantillaEstructura,
        orden: formValue.orden
      } as PlantillaEstructuraUpdateDTO;
    } else {
      nodoData = {
        idPlantillaEvaluacion: this.idPlantillaEvaluacion,
        idNodoPadre: this.idNodoPadre,
        nodoNombre: formValue.nodoNombre,
        peso: formValue.peso,
        idTipoPlantillaEstructura: formValue.idTipoPlantillaEstructura,
        orden: formValue.orden
      } as PlantillaEstructuraCreateDTO;
    }

    // Construir datos de regla si está habilitada
    let reglaData: ReglasCalculoCreateDTO | ReglasCalculoUpdateDTO | null = null;
    let eliminarRegla = false;

    if (formValue.configurarRegla && formValue.idTipoReglaCalculo) {
      if (this.reglaExistente) {
        // Actualizar regla existente
        reglaData = {
          idReglasCalculo: this.reglaExistente.idReglasCalculo,
          idTipoReglaCalculo: formValue.idTipoReglaCalculo,
          notaMinimaAprobar: formValue.notaMinimaAprobar,
          notaMinimaRecuperar: formValue.notaMinimaRecuperar
        } as ReglasCalculoUpdateDTO;
      } else if (this.nodo) {
        // Crear nueva regla para nodo existente
        reglaData = {
          idTipoReglaCalculo: formValue.idTipoReglaCalculo,
          idPlantillaEstructura: this.nodo.idPlantillaEstructura,
          notaMinimaAprobar: formValue.notaMinimaAprobar,
          notaMinimaRecuperar: formValue.notaMinimaRecuperar
        } as ReglasCalculoCreateDTO;
      }
      // Si es nodo nuevo, la regla se creará después de crear el nodo
    } else if (!formValue.configurarRegla && this.reglaExistente) {
      // Usuario desactivó la regla -> eliminar
      eliminarRegla = true;
    }

    this.save.emit({
      nodo: nodoData,
      regla: reglaData,
      eliminarRegla
    });
  }
}
