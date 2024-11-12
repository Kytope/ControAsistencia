import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-error-404',
  template: `
    <ion-content class="ion-padding">
      <div class="error-container">
        <h1>404</h1>
        <p>Oops! Página no encontrada.</p>
        <ion-button (click)="goHome()">Volver al Inicio</ion-button>
      </div>
    </ion-content>
  `,
  styles: [`
    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      text-align: center;
    }
    h1 {
      font-size: 6em;
      margin-bottom: 20px;
    }
  `]
})
export class Error404Component {
  constructor(private router: Router) {}

  goHome() {
    this.router.navigate(['/']);
  }
}