// qr-modal.component.ts
import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-qr-modal',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ nombreClase }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismissModal()">
            <ion-icon name="close-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="qr-container">
        <div class="qr-info">
          <h2>{{ nombreClase }}</h2>
          <p>Escanea este código para registrar tu asistencia</p>
          <div class="stats">
            <div>
              <ion-icon name="people-outline"></ion-icon>
              <span>Total: {{ totalAlumnos }}</span>
            </div>
            <div>
              <ion-icon name="checkmark-circle-outline"></ion-icon>
              <span>Presentes: {{ presentesHoy }}</span>
            </div>
          </div>
        </div>

        <div class="qr-code">
          <qrcode
            [qrdata]="qrData"
            [width]="300"
            [errorCorrectionLevel]="'H'"
            [margin]="2"
            [scale]="10"
            backgroundColor="#ffffff"
            foregroundColor="#000000">
          </qrcode>
        </div>

        <div class="qr-footer">
          <p class="timer">Este código expirará en 5 minutos</p>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .qr-container {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      height: 100%;
      text-align: center;
      padding: 20px;
    }

    .qr-info {
      margin-bottom: 20px;
    }

    .qr-info h2 {
      font-size: 24px;
      font-weight: bold;
      color: var(--ion-color-primary);
      margin-bottom: 10px;
    }

    .qr-info p {
      color: var(--ion-color-medium);
      margin-bottom: 20px;
    }

    .stats {
      display: flex;
      justify-content: center;
      gap: 20px;
      margin-bottom: 20px;
    }

    .stats div {
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .stats ion-icon {
      font-size: 20px;
      color: var(--ion-color-primary);
    }

    .qr-code {
      padding: 20px;
      background: white;
      border-radius: 10px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .qr-footer {
      margin-top: 20px;
    }

    .timer {
      color: var(--ion-color-danger);
      font-weight: 500;
    }

    @media (max-height: 600px) {
      .qr-code {
        transform: scale(0.8);
      }
    }
  `]
})
export class QrModalComponent {
  @Input() qrData: string = '';
  @Input() nombreClase: string = '';
  @Input() totalAlumnos: number = 0;
  @Input() presentesHoy: number = 0;

  constructor(private modalController: ModalController) {}

  dismissModal() {
    this.modalController.dismiss();
  }
}