import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-shared-image-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './shared-image-preview.component.html',
  styleUrls: ['./shared-image-preview.component.css']
})
export class SharedImagePreviewComponent {
  @Input() src: string | null = null;
  @Input() fileName: string | null = null;

  scale: number = 1;
  rotation: number = 0;
  showGrid: boolean = false;

  zoomIn(): void {
    if (this.scale < 4) {
      this.scale = Math.round((this.scale + 0.2) * 10) / 10;
    }
  }

  zoomOut(): void {
    if (this.scale > 0.4) {
      this.scale = Math.round((this.scale - 0.2) * 10) / 10;
    }
  }

  rotateLeft(): void {
    this.rotation = (this.rotation - 90) % 360;
  }

  rotateRight(): void {
    this.rotation = (this.rotation + 90) % 360;
  }

  toggleGrid(): void {
    this.showGrid = !this.showGrid;
  }

  reset(): void {
    this.scale = 1;
    this.rotation = 0;
    this.showGrid = false;
  }

  downloadImage(): void {
    if (!this.src) return;
    const link = document.createElement('a');
    link.href = this.src;
    link.download = this.fileName || 'documento-previsualizacion';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
