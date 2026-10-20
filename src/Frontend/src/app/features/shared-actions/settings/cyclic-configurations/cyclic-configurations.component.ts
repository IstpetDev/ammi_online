import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-cyclic-configurations',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet],
  templateUrl: './cyclic-configurations.component.html',
  styleUrls: ['./cyclic-configurations.component.css']
})
export class CyclicConfigurationsComponent implements OnInit, OnDestroy {
  showMenu = true;
  private routerSubscription: Subscription = new Subscription();

  constructor(private router: Router) {}

  ngOnInit() {
    // Check initial route
    this.updateMenuVisibility();

    // Listen to navigation events
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateMenuVisibility();
      });
  }

  ngOnDestroy() {
    this.routerSubscription.unsubscribe();
  }

  private updateMenuVisibility() {
    // Show menu only when at the base cyclic-configurations route
    this.showMenu = this.router.url === '/dashboard/cyclic-configurations';
  }
}