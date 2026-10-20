import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { Select } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { MessageService, ConfirmationService } from 'primeng/api';

// Services
import { EspecieCicloService } from '../../../../core/services/infrastructure/especie-ciclo.service';
import { EspecieService } from '../../../../core/services/infrastructure/especie.service';
import { CicloService } from '../../../../core/services/infrastructure/ciclo.service';

// Models
import { EspecieCicloDTO, EspecieDTO, CicloDTO } from '../../../../data/models/Entities';

@Component({
  selector: 'app-especie-ciclo',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    CardModule,
    ButtonModule,
    Select,
    InputNumberModule,
    TableModule,
    ToastModule,
    ConfirmDialogModule,
    DialogModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './especie-ciclo.component.html',
  styleUrls: ['./especie-ciclo.component.css']
})
export class EspecieCicloComponent implements OnInit {
  // Services
  private especieCicloService = inject(EspecieCicloService);
  private especieService = inject(EspecieService);
  private cicloService = inject(CicloService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  // Data
  especiesCiclo: EspecieCicloDTO[] = [];
  especies: EspecieDTO[] = [];
  ciclos: CicloDTO[] = [];
  especieCicloSeleccionada: EspecieCicloDTO | null = null;

  // UI state
  loading = false;
  saving = false;
  showDialog = false;
  showDuplicarDialog = false;
  isEditing = false;

  // Form
  especieCicloForm: EspecieCicloDTO = {
    idCiclo: undefined,
    idEspecie: undefined,
    valorEspecie: 0
  };

  // Duplicar form
  duplicarForm = {
    cicloOrigen: null as CicloDTO | null,
    cicloDestino: null as CicloDTO | null
  };

  // Options for dropdowns
  especieOptions: { label: string; value: EspecieDTO }[] = [];
  cicloOptions: { label: string; value: CicloDTO }[] = [];

  ngOnInit(): void {
    this.cargarDatos();
  }

  /**
   * Cargar datos iniciales
   */
  cargarDatos(): void {
    this.loading = true;
    let loadedCount = 0;
    const totalLoads = 3;

    const checkComplete = () => {
      loadedCount++;
      if (loadedCount >= totalLoads) {
        this.loading = false;
      }
    };

    // Cargar especies ciclo
    this.especieCicloService.getAll().subscribe({
      next: (data) => {
        this.especiesCiclo = data;
        checkComplete();
      },
      error: (err) => {
        console.error('Error cargando especies ciclo:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las especies por ciclo'
        });
        checkComplete();
      }
    });

    // Cargar especies
    this.especieService.getAll().subscribe({
      next: (data) => {
        this.especies = data;
        this.especieOptions = data.map(e => ({
          label: e.detalle || `Especie ${e.idEspecie}`,
          value: e
        }));
        checkComplete();
      },
      error: (err) => {
        console.error('Error cargando especies:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las especies'
        });
        checkComplete();
      }
    });

    // Cargar ciclos
    this.cicloService.getAll().subscribe({
      next: (data: CicloDTO[]) => {
        this.ciclos = data;
        this.cicloOptions = data.map(c => ({
          label: c.detalle || `Ciclo ${c.idCiclo}`,
          value: c
        }));
        checkComplete();
      },
      error: (err: any) => {
        console.error('Error cargando ciclos:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los ciclos'
        });
        checkComplete();
      }
    });
  }

  /**
   * Abrir dialog para nueva especie ciclo
   */
  nuevaEspecieCiclo(): void {
    this.isEditing = false;
    this.especieCicloForm = {
      idCiclo: undefined,
      idEspecie: undefined,
      valorEspecie: 0
    };
    this.showDialog = true;
  }

  /**
   * Abrir dialog para editar especie ciclo
   */
  editarEspecieCiclo(especieCiclo: EspecieCicloDTO): void {
    this.isEditing = true;
    this.especieCicloSeleccionada = especieCiclo;
    this.especieCicloForm = { ...especieCiclo };
    this.showDialog = true;
  }

  /**
   * Guardar especie ciclo
   */
  guardarEspecieCiclo(): void {
    if (!this.especieCicloForm.idEspecie || !this.especieCicloForm.idCiclo || this.especieCicloForm.valorEspecie === undefined) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campos requeridos',
        detail: 'Debe seleccionar especie, ciclo y definir un valor'
      });
      return;
    }

    if (this.especieCicloForm.valorEspecie! <= 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Valor inválido',
        detail: 'El valor debe ser mayor a cero'
      });
      return;
    }

    this.saving = true;

    if (this.isEditing && this.especieCicloSeleccionada) {
      // Actualizar
      const dataToUpdate = {
        ...this.especieCicloSeleccionada,
        ...this.especieCicloForm
      };

      this.especieCicloService.update(dataToUpdate).subscribe({
        next: (result) => {
          this.saving = false;
          this.showDialog = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Actualizado',
            detail: 'Especie por ciclo actualizada correctamente'
          });
          this.cargarDatos();
        },
        error: (err) => {
          this.saving = false;
          console.error('Error actualizando especie ciclo:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo actualizar la especie por ciclo'
          });
        }
      });
    } else {
      // Crear nueva
      this.especieCicloService.create(this.especieCicloForm).subscribe({
        next: (result) => {
          this.saving = false;
          this.showDialog = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Creado',
            detail: 'Especie por ciclo creada correctamente'
          });
          this.cargarDatos();
        },
        error: (err) => {
          this.saving = false;
          console.error('Error creando especie ciclo:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo crear la especie por ciclo'
          });
        }
      });
    }
  }

  /**
   * Eliminar especie ciclo
   */
  eliminarEspecieCiclo(especieCiclo: EspecieCicloDTO): void {
    if (!especieCiclo.idEspecieCiclo) return;

    this.confirmationService.confirm({
      message: `¿Está seguro de eliminar esta configuración de especie por ciclo?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.especieCicloService.delete(especieCiclo.idEspecieCiclo!).subscribe({
          next: (success) => {
            if (success) {
              this.messageService.add({
                severity: 'success',
                summary: 'Eliminado',
                detail: 'Especie por ciclo eliminada correctamente'
              });
              this.cargarDatos();
            } else {
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudo eliminar la especie por ciclo'
              });
            }
          },
          error: (err) => {
            console.error('Error eliminando especie ciclo:', err);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo eliminar la especie por ciclo'
            });
          }
        });
      }
    });
  }

  /**
   * Cerrar dialog
   */
  cerrarDialog(): void {
    this.showDialog = false;
    this.especieCicloSeleccionada = null;
    this.especieCicloForm = {
      idCiclo: undefined,
      idEspecie: undefined,
      valorEspecie: 0
    };
  }

  /**
   * Duplicar configuraciones del ciclo anterior
   */
  duplicarDelCicloAnterior(): void {
    if (this.ciclos.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sin ciclos',
        detail: 'No hay ciclos disponibles para duplicar'
      });
      return;
    }

    // Limpiar formulario
    this.duplicarForm = {
      cicloOrigen: null,
      cicloDestino: null
    };

    this.showDuplicarDialog = true;
  }

  /**
   * Ejecutar duplicación desde el diálogo
   */
  ejecutarDuplicacionDesdeDialogo(): void {
    if (!this.duplicarForm.cicloOrigen || !this.duplicarForm.cicloDestino) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campos requeridos',
        detail: 'Debe seleccionar tanto el ciclo origen como el ciclo destino'
      });
      return;
    }

    if (this.duplicarForm.cicloOrigen.idCiclo === this.duplicarForm.cicloDestino.idCiclo) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Ciclos iguales',
        detail: 'El ciclo origen y destino no pueden ser el mismo'
      });
      return;
    }

    // Obtener configuraciones del ciclo origen
    const configuracionesOrigen = this.especiesCiclo.filter(
      ec => ec.idCiclo === this.duplicarForm.cicloOrigen!.idCiclo
    );

    if (configuracionesOrigen.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sin configuraciones',
        detail: `El ciclo "${this.duplicarForm.cicloOrigen!.detalle}" no tiene configuraciones para duplicar`
      });
      return;
    }

    // Verificar si ya existen configuraciones para el ciclo destino
    const configuracionesDestino = this.especiesCiclo.filter(
      ec => ec.idCiclo === this.duplicarForm.cicloDestino!.idCiclo
    );

    if (configuracionesDestino.length > 0) {
      this.confirmationService.confirm({
        message: `El ciclo "${this.duplicarForm.cicloDestino!.detalle}" ya tiene ${configuracionesDestino.length} configuración(es). ¿Desea reemplazarlas?`,
        header: 'Configuraciones existentes',
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
          // Primero eliminar las existentes, luego crear las nuevas
          this.eliminarConfiguracionesExistentes(configuracionesDestino, () => {
            this.ejecutarDuplicacion(this.duplicarForm.cicloOrigen!, this.duplicarForm.cicloDestino!, configuracionesOrigen);
          });
        },
        reject: () => {
          // Solo agregar las que no existen
          const especiesExistentes = new Set(configuracionesDestino.map(c => c.idEspecie));
          const configuracionesNuevas = configuracionesOrigen.filter(
            c => !especiesExistentes.has(c.idEspecie)
          );

          if (configuracionesNuevas.length === 0) {
            this.messageService.add({
              severity: 'info',
              summary: 'Sin cambios',
              detail: 'Todas las especies ya están configuradas para este ciclo'
            });
            this.cerrarDuplicarDialog();
            return;
          }

          this.ejecutarDuplicacion(this.duplicarForm.cicloOrigen!, this.duplicarForm.cicloDestino!, configuracionesNuevas);
        }
      });
      return;
    }

    // No hay configuraciones existentes, proceder normalmente
    this.confirmationService.confirm({
      message: `¿Está seguro de duplicar ${configuracionesOrigen.length} configuración(es) del ciclo "${this.duplicarForm.cicloOrigen!.detalle}" al ciclo "${this.duplicarForm.cicloDestino!.detalle}"?`,
      header: 'Confirmar duplicación',
      icon: 'pi pi-copy',
      accept: () => {
        this.showDuplicarDialog = false;
        this.ejecutarDuplicacion(this.duplicarForm.cicloOrigen!, this.duplicarForm.cicloDestino!, configuracionesOrigen);
      }
    });
  }

  /**
   * Ejecutar la duplicación de configuraciones
   */
  private ejecutarDuplicacion(cicloAnterior: CicloDTO, cicloActual: CicloDTO, configuracionesAnteriores: EspecieCicloDTO[]): void {
    this.saving = true;

    // Crear nuevas configuraciones para el ciclo actual
    const nuevasConfiguraciones: EspecieCicloDTO[] = configuracionesAnteriores.map(config => ({
      idCiclo: cicloActual.idCiclo,
      idEspecie: config.idEspecie,
      valorEspecie: config.valorEspecie
    }));

    console.log('Duplicando configuraciones:', nuevasConfiguraciones);

    // Crear cada configuración individualmente (o en bulk si el servicio lo soporta)
    let completadas = 0;
    const total = nuevasConfiguraciones.length;
    let errores = 0;

    nuevasConfiguraciones.forEach(config => {
      this.especieCicloService.create(config).subscribe({
        next: (resultado) => {
          console.log('Configuración creada:', resultado);
          completadas++;
          if (completadas + errores >= total) {
            this.finalizarDuplicacion(completadas, errores, cicloActual);
          }
        },
        error: (err) => {
          console.error('Error creando configuración:', err);
          errores++;
          if (completadas + errores >= total) {
            this.finalizarDuplicacion(completadas, errores, cicloActual);
          }
        }
      });
    });
  }

  /**
   * Finalizar el proceso de duplicación
   */
  private finalizarDuplicacion(completadas: number, errores: number, cicloActual: CicloDTO): void {
    this.saving = false;

    if (errores === 0) {
      this.messageService.add({
        severity: 'success',
        summary: 'Duplicación exitosa',
        detail: `Se duplicaron ${completadas} configuración(es) al ciclo "${cicloActual.detalle}"`
      });
    } else if (completadas > 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Duplicación parcial',
        detail: `Se duplicaron ${completadas} configuración(es), pero ${errores} fallaron`
      });
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error en duplicación',
        detail: 'No se pudo duplicar ninguna configuración'
      });
    }

    // Recargar datos para mostrar los cambios
    this.cargarDatos();
  }

  /**
   * Eliminar configuraciones existentes antes de duplicar
   */
  private eliminarConfiguracionesExistentes(configuraciones: EspecieCicloDTO[], callback: () => void): void {
    let eliminadas = 0;
    const total = configuraciones.length;

    if (total === 0) {
      callback();
      return;
    }

    configuraciones.forEach(config => {
      if (config.idEspecieCiclo) {
        this.especieCicloService.delete(config.idEspecieCiclo).subscribe({
          next: () => {
            eliminadas++;
            if (eliminadas >= total) {
              callback();
            }
          },
          error: (err) => {
            console.error('Error eliminando configuración existente:', err);
            eliminadas++;
            if (eliminadas >= total) {
              callback();
            }
          }
        });
      } else {
        eliminadas++;
        if (eliminadas >= total) {
          callback();
        }
      }
    });  }
  /**
   * Cerrar diálogo de duplicación
   */
  cerrarDuplicarDialog(): void {
    this.showDuplicarDialog = false;
    this.duplicarForm = {
      cicloOrigen: null,
      cicloDestino: null
    };
  }

  /**
   * Obtener cantidad de configuraciones para un ciclo
   */
  getConfiguracionesCount(ciclo: CicloDTO): number {
    if (!ciclo?.idCiclo) return 0;
    return this.especiesCiclo.filter(ec => ec.idCiclo === ciclo.idCiclo).length;
  }

  /**
   * Obtener nombre de especie por ID
   */
  getNombreEspecie(idEspecie?: number): string {
    if (!idEspecie) return '';
    const especie = this.especies.find(e => e.idEspecie === idEspecie);
    return especie?.detalle || `Especie ${idEspecie}`;
  }

  /**
   * Obtener nombre de ciclo por ID
   */
  getNombreCiclo(idCiclo?: number): string {
    if (!idCiclo) return '';
    const ciclo = this.ciclos.find(c => c.idCiclo === idCiclo);
    return ciclo?.detalle || `Ciclo ${idCiclo}`;
  }
}