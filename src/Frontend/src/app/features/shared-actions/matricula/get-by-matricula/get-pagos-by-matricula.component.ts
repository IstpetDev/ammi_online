import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';

interface Pago {
  tipo: string;
  valorAbonado: number;
}

@Component({
  selector: 'app-get-pagos-by-matricula',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, DialogModule, InputTextModule, FormsModule],
  templateUrl: './get-pagos-by-matricula.component.html',
  styleUrls: ['./get-pagos-by-matricula.component.css']
})
export class GetPagosByMatriculaComponent implements OnInit {

  matriculaId: number | null = null;
  totalMatricula: number = 1000; // Valor de la especie / total a pagar
  pagos: Pago[] = [
    { tipo: 'Efectivo', valorAbonado: 200 },
    { tipo: 'Transferencia', valorAbonado: 300 },
    { tipo: 'Factura', valorAbonado: 150 }
  ];
  tiposPago = [
    { label: 'Efectivo', value: 'Efectivo' },
    { label: 'Transferencia', value: 'Transferencia' },
    { label: 'Factura', value: 'Factura' },
    { label: 'Cheque', value: 'Cheque' }
  ];
  displayModal: boolean = false;
  nuevoPago: { tipo: string; valor: number } = { tipo: '', valor: 0 };

  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.matriculaId = +this.route.snapshot.paramMap.get('id')!;
  }

  get sumaAbonada(): number {
    return this.pagos.reduce((sum, pago) => sum + pago.valorAbonado, 0);
  }

  get restante(): number {
    return this.totalMatricula - this.sumaAbonada;
  }

  abrirModalNuevoAbono() {
    this.displayModal = true;
  }

  agregarPago() {
    if (this.nuevoPago.tipo && this.nuevoPago.valor > 0) {
      this.pagos.push({ tipo: this.nuevoPago.tipo, valorAbonado: this.nuevoPago.valor });
      this.nuevoPago = { tipo: '', valor: 0 };
      this.displayModal = false;
    }
  }

  cancelarNuevoPago() {
    this.nuevoPago = { tipo: '', valor: 0 };
    this.displayModal = false;
  }

  getRemaining(index: number): number {
    return this.totalMatricula - this.pagos.slice(0, index + 1).reduce((sum, p) => sum + p.valorAbonado, 0);
  }
}
