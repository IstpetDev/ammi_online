import { Component, Input, OnInit, OnChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DetalleMallaService } from '../../../../core/services/infrastructure/detalle-malla.service';
import { DetalleMallaDTO } from '../../../../data/models/detalle-malla/detalle-malla.model';

@Component({
  selector: 'app-view-student-subjects',
  templateUrl: './view-student-subjects.component.html',
  styleUrls: ['./view-student-subjects.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class ViewStudentSubjectsComponent implements OnInit, OnChanges {
  @Input() idMalla!: number;

  subjects: DetalleMallaDTO[] = [];
  loading = false;
  error: string | null = null;

  private detalleMallaService = inject(DetalleMallaService);

  ngOnInit(): void {
    if (this.idMalla) {
      this.loadSubjects();
    }
  }

  ngOnChanges(): void {
    if (this.idMalla) {
      this.loadSubjects();
    }
  }

  private loadSubjects(): void {
    this.loading = true;
    this.error = null;
    this.detalleMallaService.getByMalla(this.idMalla, 1, 200).subscribe({
      next: (data: DetalleMallaDTO[]) => {
        this.subjects = data;
        this.loading = false;
      },
      error: (err: any) => {
        this.error = 'Error al cargar las materias';
        this.loading = false;
        console.error('Error loading subjects:', err);
      }
    });
  }
}
