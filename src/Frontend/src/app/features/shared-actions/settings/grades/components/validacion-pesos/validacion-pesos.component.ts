import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageModule } from 'primeng/message';
import { ValidacionPesosDTO } from '../../../../../../data/models/notas';

@Component({
  selector: 'app-validacion-pesos',
  standalone: true,
  imports: [CommonModule, MessageModule],
  templateUrl: './validacion-pesos.component.html',
  styleUrls: ['./validacion-pesos.component.css']
})
export class ValidacionPesosComponent {
  @Input() validacion: ValidacionPesosDTO | null = null;
}
