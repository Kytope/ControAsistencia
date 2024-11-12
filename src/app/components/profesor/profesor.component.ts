import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { ModalController, ToastController, LoadingController } from '@ionic/angular';
import { QrModalComponent } from '../qr-modal/qr-modal.component';
import { AlumnosModalComponent } from '../alumnos-modal/alumnos-modal.component';
import { firstValueFrom } from 'rxjs';

// Definir las interfaces necesarias
interface Alumno {
  id: number;
  nombre: string;
  ultimo_estado?: string;
  ultima_fecha?: string;
}

interface AlumnoAsistencia {
  alumno_id: number;
  alumno_nombre: string;
  total_asistencias: number;
  asistencias: Array<{
    fecha: string;
    estado: string;
  }>;
}

interface Clase {
  id: number;
  nombre: string;
  total_alumnos?: number;
  presentes_hoy?: number;
  ultima_asistencia?: string;
}

@Component({
  selector: 'app-profesor',
  templateUrl: './profesor.component.html',
  styleUrls: ['./profesor.component.scss']
})
export class ProfesorComponent implements OnInit {
  clases: Clase[] = [];
  profesorId: number = 0;
  loading: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private modalController: ModalController,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {
    this.checkAuth();
  }

  private checkAuth(): void {
    const user = this.authService.currentUserValue;
    if (!user || user.tipo !== 'profesor') {
      this.router.navigate(['/login']);
      return;
    }
    this.profesorId = user.id;
  }

  ngOnInit() {
    this.cargarClases();
  }

  async cargarClases() {
    this.loading = true;
    const loading = await this.loadingController.create({
      message: 'Cargando clases...',
      spinner: 'circular'
    });
    await loading.present();

    try {
      const clasesResult = await firstValueFrom(this.authService.getClasesProfesor(this.profesorId));
      this.clases = clasesResult;
      
      if (this.clases.length === 0) {
        await this.presentToast('No tienes clases asignadas', 'warning');
      }
    } catch (error) {
      console.error('Error al cargar las clases:', error);
      await this.presentToast('Error al cargar las clases', 'danger');
    } finally {
      this.loading = false;
      await loading.dismiss();
    }
  }

  async verAlumnos(clase: Clase) {
    const loading = await this.loadingController.create({
      message: 'Cargando alumnos...',
      spinner: 'circular'
    });
    await loading.present();
  
    try {
      // Primero, obtener los datos
      const [alumnos, asistencias] = await Promise.all([
        firstValueFrom(this.authService.getAlumnosClase(clase.id)),
        firstValueFrom(this.authService.getAsistenciaClase(this.profesorId, clase.id))
      ]);
  
      // Procesar los datos
      const alumnosConAsistencias = alumnos.map(alumno => ({
        ...alumno,
        asistencias: asistencias.find(a => a.alumno_id === alumno.alumno_id)?.asistencias || []
      }));
  
      // Ocultar el loading antes de mostrar el modal
      await loading.dismiss();
  
      // Crear y mostrar el modal
      const modal = await this.modalController.create({
        component: AlumnosModalComponent,
        componentProps: {
          nombreClase: clase.nombre,
          alumnos: alumnosConAsistencias,
          totalAlumnos: clase.total_alumnos,
          presentesHoy: clase.presentes_hoy
        },
        breakpoints: [0, 0.5, 0.8, 1],
        initialBreakpoint: 0.8
      });
  
      await modal.present();
  
      const { data } = await modal.onWillDismiss();
      if (data?.reload) {
        await this.cargarClases();
      }
    } catch (error) {
      console.error('Error al cargar los alumnos:', error);
      await this.presentToast('Error al cargar los datos de los alumnos', 'danger');
      await loading.dismiss();
    }
  }

  async generarQR(clase: Clase) {
    const qrData = {
      clase_id: clase.id,
      timestamp: Date.now(),
      nombre_clase: clase.nombre
    };
  
    const modal = await this.modalController.create({
      component: QrModalComponent,
      componentProps: {
        qrData: JSON.stringify(qrData),
        nombreClase: clase.nombre,
        totalAlumnos: clase.total_alumnos || 0,
        presentesHoy: clase.presentes_hoy || 0
      },
      cssClass: 'qr-modal'
    });
  
    await modal.present();
  }

  async doRefresh(event: any) {
    try {
      await this.cargarClases();
    } finally {
      event.target.complete();
    }
  }

  async cerrarSesion() {
    const loading = await this.loadingController.create({
      message: 'Cerrando sesión...',
      spinner: 'circular'
    });
    await loading.present();

    try {
      this.authService.logout();
      await loading.dismiss();
      await this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      await this.presentToast('Error al cerrar sesión', 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  async presentToast(message: string, color: 'success' | 'warning' | 'danger') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color,
      buttons: [{ text: 'OK', role: 'cancel' }]
    });
    await toast.present();
  }

  getAsistenciaColor(clase: Clase): string {
    if (!clase.total_alumnos || clase.total_alumnos === 0) return 'medium';
    const porcentaje = ((clase.presentes_hoy || 0) / clase.total_alumnos) * 100;
    if (porcentaje >= 75) return 'success';
    if (porcentaje >= 50) return 'warning';
    return 'danger';
  }
}