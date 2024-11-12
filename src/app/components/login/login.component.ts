import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LoadingController, ToastController } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  tipo: 'alumno' | 'profesor';
}

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  showPassword: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private fb: FormBuilder
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {
    const currentUser = this.authService.currentUserValue;
    if (currentUser && currentUser.tipo) {
      this.redirectBasedOnUserType(currentUser.tipo);
    }
  }

  async login() {
    if (this.loginForm.valid) {
      const loading = await this.loadingController.create({
        message: 'Iniciando sesión...',
        spinner: 'circular'
      });
      await loading.present();

      try {
        const response = await this.authService.login(
          this.loginForm.get('email')?.value,
          this.loginForm.get('password')?.value
        ).toPromise();

        await loading.dismiss();

        if (response && response.tipo) {
          this.redirectBasedOnUserType(response.tipo);
        } else {
          throw new Error('Respuesta de login inválida');
        }
      } catch (error) {
        await loading.dismiss();
        await this.presentToast('Credenciales inválidas', 'danger');
      }
    } else {
      this.loginForm.markAllAsTouched();
      await this.presentToast('Por favor, complete todos los campos correctamente', 'warning');
    }
  }

  redirectBasedOnUserType(tipo: 'alumno' | 'profesor') {
    const route = tipo === 'alumno' ? '/alumno' : '/profesor';
    this.router.navigate([route]);
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  getErrorMessage(controlName: string): string {
    const control = this.loginForm.get(controlName);
    if (!control?.errors || !control.touched) return '';

    if (control.errors['required']) {
      return 'Este campo es requerido';
    }
    if (control.errors['email']) {
      return 'Ingrese un email válido';
    }
    if (control.errors['minlength']) {
      return `La contraseña debe tener al menos ${control.errors['minlength'].requiredLength} caracteres`;
    }
    return '';
  }

  forgotPassword() {
    this.router.navigate(['/change-password']);
  }

  async presentToast(message: string, color: 'danger' | 'warning' | 'success' = 'danger') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color,
      buttons: [
        {
          text: 'OK',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }

  // Helpers para el formulario
  get emailControl() {
    return this.loginForm.get('email');
  }

  get passwordControl() {
    return this.loginForm.get('password');
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return field ? (field.invalid && field.touched) : false;
  }
}