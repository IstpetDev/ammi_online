import { Component, OnInit, Output, EventEmitter, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PeriodosComponent } from './periodos/periodos.component';
import { RegimenesComponent } from './regimenes/regimenes.component';
import { CiclosComponent } from './ciclos/ciclos.component';

@Component({
  selector: 'app-seasons',
  standalone: true,
  imports: [CommonModule, PeriodosComponent, RegimenesComponent, CiclosComponent],
  templateUrl: './seasons.component.html',
  styleUrls: ['./seasons.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class SeasonsComponent implements OnInit {
  activeTab: string = 'periodos';

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