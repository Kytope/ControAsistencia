import { Component, OnInit } from '@angular/core';
import { Platform } from '@ionic/angular';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { Camera } from '@capacitor/camera';
import { App } from '@capacitor/app';
import { StatusBar } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';


@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {
  darkMode: boolean = false;
  currentUser: any = null;

  constructor(
    private platform: Platform,
    private authService: AuthService,
    private router: Router
  ) {
    this.initializeApp();
  }

  ngOnInit() {
    // Suscribirse a los cambios del usuario
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
    });

    // Recuperar preferencia de tema del localStorage
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme !== null) {
      this.darkMode = savedTheme === 'true';
      this.updateDarkMode(this.darkMode);
    }
  }

  async initializeApp() {
    await this.platform.ready();

    if (this.platform.is('capacitor')) {
      try {
        // Configurar StatusBar
        await StatusBar.setBackgroundColor({ color: '#3880ff' });
        
        // Ocultar SplashScreen después de la inicialización
        await SplashScreen.hide();

        // Solicitar permisos de cámara al inicio
        await this.requestCameraPermissions();

        // Manejar el botón de retroceso en Android
        App.addListener('backButton', ({ canGoBack }) => {
          if (!canGoBack) {
            App.exitApp();
          } else {
            window.history.back();
          }
        });

      } catch (error) {
        console.error('Error initializing app:', error);
      }
    }

    // Verificar la preferencia del sistema si no hay preferencia guardada
    if (localStorage.getItem('darkMode') === null) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
      this.darkMode = prefersDark.matches;
      
      // Escuchar cambios en la preferencia del sistema
      prefersDark.addListener((mediaQuery) => {
        if (localStorage.getItem('darkMode') === null) {
          this.updateDarkMode(mediaQuery.matches);
        }
      });

      this.updateDarkMode(this.darkMode);
    }
  }

  private async requestCameraPermissions() {
    try {
      const permissionStatus = await Camera.checkPermissions();
      if (permissionStatus.camera !== 'granted') {
        await Camera.requestPermissions();
      }
    } catch (error) {
      console.error('Error requesting camera permissions:', error);
    }
  }

  updateDarkMode(shouldAdd: boolean) {
    this.darkMode = shouldAdd;
    document.body.classList.toggle('dark', shouldAdd);
    localStorage.setItem('darkMode', shouldAdd.toString());
    
    // Actualizar StatusBar en Android
    if (this.platform.is('capacitor')) {
      StatusBar.setBackgroundColor({
        color: shouldAdd ? '#000000' : '#3880ff'
      });
    }
  }

  toggleDarkMode() {
    this.updateDarkMode(!this.darkMode);
  }

  async logout() {
    this.authService.logout();
    await this.router.navigate(['/login']);
  }
}