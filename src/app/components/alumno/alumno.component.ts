import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Clase, Horario } from '../../services/auth.interfaces';
import { LoadingController, ToastController, Platform } from '@ionic/angular';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { BrowserQRCodeReader, IScannerControls } from '@zxing/browser';


interface Photo {
  dataUrl?: string;
  base64String?: string;
  path?: string;
  webPath?: string;
}

@Component({
  selector: 'app-alumno',
  templateUrl: './alumno.component.html',
  styleUrls: ['./alumno.component.scss']
})
export class AlumnoComponent implements OnInit {
  clases: Clase[] = [];
  selectedSegment: 'hoy' | 'todas' = 'hoy';
  alumnoId: number = 0;
  private codeReader = new BrowserQRCodeReader();
  private scannerControls?: IScannerControls;
  isScanning = false;
  

  readonly DIAS_SEMANA: Record<number, string> = {
    0: 'Domingo',
    1: 'Lunes',
    2: 'Martes',
    3: 'Miércoles',
    4: 'Jueves',
    5: 'Viernes',
    6: 'Sábado'
  };

  constructor(
    private authService: AuthService,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private platform: Platform,
    private router: Router
  ){
    this.checkAuth();
  }

  currentUser: any;

  ngOnInit() {
    this.cargarClases();
    this.currentUser = this.authService.currentUserValue;
  }

  private checkAuth(): void {
    const user = this.authService.currentUserValue;
    if (!user || user.tipo !== 'alumno') {
      this.router.navigate(['/login']);
      return;
    }
    this.alumnoId = user.id;
  }

  async cargarClases() {
    if (!this.alumnoId) return;

    const loading = await this.loadingController.create({
      message: 'Cargando clases...',
      spinner: 'circular'
    });
    await loading.present();

    try {
      const clasesResult = await firstValueFrom(this.authService.getClasesAlumno(this.alumnoId));
      
      const clasesConHorarios = await Promise.all(
        clasesResult.map(async (clase) => {
          if (clase.id) {
            const horarios = await firstValueFrom(this.authService.getHorariosClase(clase.id));
            const asistencias = await firstValueFrom(
              this.authService.getAsistenciaAlumno(this.alumnoId, clase.id)
            );
            
            return {
              ...clase,
              horarios: horarios || [],
              ultimaAsistencia: asistencias?.[0]?.fecha || null
            };
          }
          return clase;
        })
      );

      this.clases = clasesConHorarios;
      console.log('Clases cargadas:', this.clases);

    } catch (error) {
      console.error('Error al cargar las clases:', error);
      await this.presentToast('Error al cargar las clases', 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  getDiaActual(): string {
    return this.DIAS_SEMANA[new Date().getDay()];
  }

  getClasesFiltradas(): Clase[] {
    if (this.selectedSegment === 'hoy') {
      return this.clases.filter(clase => 
        this.getHorariosDelDia(clase).length > 0
      );
    }
    return this.clases;
  }

  getHorariosDelDia(clase: Clase): Horario[] {
    if (!clase.horarios) return [];
    const diaActual = this.getDiaActual();
    return clase.horarios.filter(horario => horario.dia_semana === diaActual);
  }

  formatHora(hora: string): string {
    try {
      return new Date(`2000-01-01T${hora}`).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return hora;
    }
  }

  tieneAsistenciaHoy(clase: Clase): boolean {
    if (!clase.ultimaAsistencia) return false;
    const hoy = new Date().toISOString().split('T')[0];
    return clase.ultimaAsistencia === hoy;
  }

  getEstadoColor(clase: Clase): string {
    return this.tieneAsistenciaHoy(clase) ? 'success' : 'warning';
  }

  async doRefresh(event: any) {
    try {
      await this.cargarClases();
    } finally {
      event.target.complete();
    }
  }

  async presentToast(message: string, color: 'success' | 'warning' | 'danger' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color,
      buttons: [{ text: 'OK', role: 'cancel' }]
    });
    await toast.present();
  }

  async escanearQR() {
    try {
      this.isScanning = true;
  
      const videoInputDevices = await BrowserQRCodeReader.listVideoInputDevices();
      
      // Intentar encontrar la cámara trasera
      const backCamera = videoInputDevices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('trasera') ||
        device.label.toLowerCase().includes('rear')
      );
  
      // Usar la cámara trasera si está disponible, si no, usar la primera cámara
      const selectedDeviceId = backCamera ? backCamera.deviceId : videoInputDevices[0].deviceId;
  
      this.scannerControls = await this.codeReader.decodeFromVideoDevice(
        selectedDeviceId,
        'video-preview',
        async (result) => {
          if (result) {
            // Detener el escaneo antes de procesar el resultado
            this.stopScanning();
            await this.procesarResultadoQR(result.getText());
          }
        }
      );
  
    } catch (error) {
      console.error('Error al escanear:', error);
      await this.presentToast('Error al escanear el código QR', 'danger');
      this.stopScanning();
    }
  }

  private async procesarResultadoQR(scannedText: string) {
    try {
      const qrData = JSON.parse(scannedText);
      
      const data = {
        qrData: scannedText,
        alumnoId: this.alumnoId
      };

      await firstValueFrom(this.authService.registrarAsistenciaQR(data));
      await this.presentToast('Asistencia registrada correctamente', 'success');
      await this.cargarClases();
      this.stopScanning();

    } catch (error) {
      console.error('Error procesando QR:', error);
      await this.presentToast('Código QR inválido', 'danger');
      this.stopScanning();
    }
  }

  stopScanning() {
    if (this.scannerControls) {
      this.scannerControls.stop();
      this.scannerControls = undefined;
    }
    this.isScanning = false;
  }

  ngOnDestroy() {
    this.stopScanning();
  }

  async logout() {
    this.authService.logout();
    await this.router.navigate(['/login']);
  }
}