import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';

import { AuthService } from '../../../../core/auth/auth.service';
import { DatosContactoDTO, DatosContactoService } from '../../../../core/services/postulaciones/datos-contacto.service';
import { PersonaService } from '../../../../core/services/seguridad/persona.service';
import { PersonaDTO } from '../../../../data/models/Entities';
import { SharedToastComponent } from '../../../../shared/shared-toast/shared-toast.component';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, FormsModule,
    ButtonModule, InputTextModule, PasswordModule,
    DividerModule, ProgressSpinnerModule, TagModule, SharedToastComponent],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.css',
  providers: [MessageService]
})
export class UserProfileComponent implements OnChanges {
  @Input() userId!: number;
  @Input() userRole = '';
  @Output() back = new EventEmitter<void>();

  private personaService = inject(PersonaService);
  private contactoService = inject(DatosContactoService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);

  // ─── Persona (solo lectura) ───
  persona: PersonaDTO | null = null;
  loading = false;

  // ─── Datos de contacto ───
  emailContacto: DatosContactoDTO | null = null;
  phoneContacto: DatosContactoDTO | null = null;
  emailEdit = '';
  phoneEdit = '';
  savingEmail = false;
  savingPhone = false;

  // ─── Cambio de contraseña ───
  pwActual = '';
  pwNueva = '';
  pwConfirmar = '';
  savingPw = false;
  pwError = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['userId'] && this.userId) {
      this.cargarDatos();
    }
  }

  cargarDatos(): void {
    this.loading = true;
    this.personaService.getPersonaById(this.userId).subscribe({
      next: (data) => {
        this.persona = data ?? null;
        this.loading = false;
        this.cargarContactos();
      },
      error: () => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el perfil' });
      }
    });
  }

  cargarContactos(): void {
    this.contactoService.getByPersona(this.userId).subscribe({
      next: (data) => {
        this.emailContacto = data.find(c => c.idTipoDatoContacto === 1) ?? null;
        this.phoneContacto = data.find(c => c.idTipoDatoContacto === 2) ?? null;
        this.emailEdit = this.emailContacto?.detalle ?? '';
        this.phoneEdit = this.phoneContacto?.detalle ?? '';
      },
      error: () => {
        this.messageService.add({ severity: 'warn', summary: 'Aviso', detail: 'No se pudieron cargar los datos de contacto' });
      }
    });
  }

  guardarContacto(tipo: 'email' | 'phone'): void {
    const contacto = tipo === 'email' ? this.emailContacto : this.phoneContacto;
    const nuevoDetalle = tipo === 'email' ? this.emailEdit : this.phoneEdit;
    if (!contacto || !nuevoDetalle) return;

    if (tipo === 'email') this.savingEmail = true;
    else this.savingPhone = true;

    this.contactoService.update({
      idDatosContacto: contacto.idDatosContacto,
      idPersona: this.userId,
      idTipoDatoContacto: contacto.idTipoDatoContacto!,
      detalle: nuevoDetalle,
      esPrincipal: contacto.esPrincipal ?? true
    }).subscribe({
      next: () => {
        if (tipo === 'email') { this.savingEmail = false; this.emailContacto!.detalle = nuevoDetalle; }
        else { this.savingPhone = false; this.phoneContacto!.detalle = nuevoDetalle; }
        this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Contacto actualizado' });
      },
      error: () => {
        if (tipo === 'email') this.savingEmail = false;
        else this.savingPhone = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el contacto' });
      }
    });
  }

  cambiarContrasenia(): void {
    this.pwError = '';
    if (!this.pwActual || !this.pwNueva || !this.pwConfirmar) {
      this.pwError = 'Complete todos los campos.';
      return;
    }
    if (this.pwNueva !== this.pwConfirmar) {
      this.pwError = 'La nueva contraseña y la confirmación no coinciden.';
      return;
    }
    if (this.pwNueva.length < 6) {
      this.pwError = 'La contraseña debe tener al menos 6 caracteres.';
      return;
    }
    this.savingPw = true;
    this.authService.changePassword({
      currentPassword: this.pwActual,
      newPassword: this.pwNueva,
      confirmNewPassword: this.pwConfirmar
    }).subscribe({
      next: () => {
        this.savingPw = false;
        this.pwActual = this.pwNueva = this.pwConfirmar = '';
        this.messageService.add({ severity: 'success', summary: '¡Listo!', detail: 'Contraseña actualizada correctamente' });
      },
      error: (err) => {
        this.savingPw = false;
        this.pwError = err?.message || 'No se pudo cambiar la contraseña.';
      }
    });
  }

  get fullName(): string {
    if (!this.persona) return '';
    return [
      this.persona.primerNombre,
      this.persona.segundoNombre,
      this.persona.primerApellido,
      this.persona.segundoApellido
    ].filter(Boolean).join(' ');
  }

  get initials(): string {
    const p = this.persona;
    if (!p) return '?';
    return ((p.primerNombre?.[0] ?? '') + (p.primerApellido?.[0] ?? '')).toUpperCase() || '?';
  }
}
