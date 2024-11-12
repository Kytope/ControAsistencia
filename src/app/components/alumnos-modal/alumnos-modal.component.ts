import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';

interface AsistenciaAlumno {
  fecha: string;
  estado: string;
}

interface AlumnoAsistencia {
  alumno_id: number;
  alumno_nombre: string;
  total_asistencias: number;
  asistencias: AsistenciaAlumno[];
}

@Component({
  selector: 'app-alumnos-modal',
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>{{ nombreClase }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismissModal()">
            <ion-icon name="close-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-card>
        <ion-card-content>
          <div class="resumen">
            <h2>Resumen de Asistencia</h2>
            <div class="estadisticas">
              <ion-chip color="primary">
                <ion-label>Total: {{ alumnos.length }}</ion-label>
              </ion-chip>
              <ion-chip color="success">
                <ion-label>Presentes: {{ presentesHoy || 0 }}</ion-label>
              </ion-chip>
            </div>
          </div>
        </ion-card-content>
      </ion-card>

      <ion-list>
        <ion-item *ngFor="let alumno of alumnos">
          <ion-avatar slot="start">
            <ion-icon name="person"></ion-icon>
          </ion-avatar>
          <ion-label>
            <h2>{{ alumno.alumno_nombre }}</h2>
            <p>Total asistencias: {{ alumno.total_asistencias }}</p>
            <div *ngIf="tieneAsistencias(alumno)" class="ultima-asistencia">
              <ion-badge [color]="getEstadoColor(getUltimoEstado(alumno))">
                {{ getUltimoEstado(alumno) }}
              </ion-badge>
              <span>{{ getUltimaFecha(alumno) }}</span>
            </div>
          </ion-label>
        </ion-item>
      </ion-list>

      <div *ngIf="alumnos.length === 0" class="empty-state">
        <ion-icon name="people-outline" size="large"></ion-icon>
        <h3>No hay alumnos registrados</h3>
        <p>Esta clase aún no tiene alumnos inscritos</p>
      </div>
    </ion-content>
  `,
  styles: [`
    .resumen {
      text-align: center;
      h2 {
        margin: 0 0 16px;
        font-size: 1.2em;
        font-weight: 500;
      }
      .estadisticas {
        display: flex;
        justify-content: center;
        gap: 8px;
      }
    }

    ion-item {
      --padding-start: 16px;
      --padding-end: 16px;
      margin-bottom: 8px;

      ion-avatar {
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--ion-color-light);
        
        ion-icon {
          font-size: 1.5em;
          color: var(--ion-color-medium);
        }
      }

      h2 {
        font-weight: 500;
        margin-bottom: 4px;
      }

      p {
        margin: 4px 0;
        color: var(--ion-color-medium);
      }

      .ultima-asistencia {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 4px;

        ion-badge {
          text-transform: capitalize;
        }

        span {
          font-size: 0.9em;
          color: var(--ion-color-medium);
        }
      }
    }

    .empty-state {
      text-align: center;
      padding: 40px 20px;

      ion-icon {
        font-size: 48px;
        color: var(--ion-color-medium);
        margin-bottom: 16px;
      }

      h3 {
        margin: 0;
        color: var(--ion-color-dark);
      }

      p {
        margin: 8px 0 0;
        color: var(--ion-color-medium);
      }
    }
  `]
})
export class AlumnosModalComponent {
  @Input() nombreClase: string = '';
  @Input() alumnos: AlumnoAsistencia[] = [];
  @Input() totalAlumnos?: number;
  @Input() presentesHoy?: number;

  constructor(private modalController: ModalController) {}

  tieneAsistencias(alumno: AlumnoAsistencia): boolean {
    return Array.isArray(alumno.asistencias) && alumno.asistencias.length > 0;
  }

  getUltimoEstado(alumno: AlumnoAsistencia): string {
    if (!this.tieneAsistencias(alumno)) return 'Sin registro';
    return alumno.asistencias[0].estado;
  }

  getUltimaFecha(alumno: AlumnoAsistencia): string {
    if (!this.tieneAsistencias(alumno)) return 'No registrada';
    return this.formatFecha(alumno.asistencias[0].fecha);
  }

  getEstadoColor(estado: string): string {
    const estadoLower = estado.toLowerCase();
    if (estadoLower === 'presente') return 'success';
    if (estadoLower === 'ausente') return 'danger';
    return 'medium';
  }

  formatFecha(fecha: string): string {
    if (!fecha) return 'No registrada';
    
    try {
      const date = new Date(fecha);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Fecha inválida';
    }
  }

  dismissModal() {
    this.modalController.dismiss();
  }
}