import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ToastController, LoadingController, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { merge, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ChangePasswordData } from '../../services/auth.interfaces';

interface ValidationMessage {
  [key: string]: string;
}

interface ValidationMessages {
  [key: string]: ValidationMessage;
}

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss']
})
export class ChangePasswordComponent implements OnInit, OnDestroy {
  // Inicializar el FormGroup en la declaración
  passwordForm: FormGroup = this.fb.group({
    email: ['', [
      Validators.required,
      Validators.email,
      Validators.pattern(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/)
    ]],
    oldPassword: ['', [
      Validators.required,
      Validators.minLength(6)
    ]],
    newPassword: ['', [
      Validators.required,
      Validators.minLength(8),
      this.createPasswordStrengthValidator()
    ]],
    confirmPassword: ['', [
      Validators.required
    ]]
  });

  showOldPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  isLoading = false;
  private destroy$ = new Subject<void>();

  passwordPatterns = {
    hasUpperCase: /[A-Z]/,
    hasLowerCase: /[a-z]/,
    hasNumber: /[0-9]/,
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/
  };

  validationMessages: ValidationMessages = {
    email: {
      required: 'El correo electrónico es requerido',
      email: 'Por favor, ingresa un correo electrónico válido',
      pattern: 'El formato del correo electrónico no es válido'
    },
    oldPassword: {
      required: 'La contraseña actual es requerida',
      minlength: 'La contraseña debe tener al menos 6 caracteres'
    },
    newPassword: {
      required: 'La nueva contraseña es requerida',
      minlength: 'La nueva contraseña debe tener al menos 8 caracteres',
      passwordStrength: 'La contraseña no cumple con los requisitos de seguridad'
    },
    confirmPassword: {
      required: 'Por favor, confirma tu nueva contraseña',
      passwordMismatch: 'Las contraseñas no coinciden'
    }
  };

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private alertController: AlertController,
    private router: Router
  ) {}

  ngOnInit() {
    this.setupFormValidationSubscription();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }


  private setupFormValidationSubscription(): void {
    const newPasswordControl = this.passwordForm.get('newPassword');
    const confirmPasswordControl = this.passwordForm.get('confirmPassword');

    if (newPasswordControl && confirmPasswordControl) {
      merge(
        newPasswordControl.valueChanges,
        confirmPasswordControl.valueChanges
      ).pipe(
        takeUntil(this.destroy$)
      ).subscribe(() => {
        this.validatePasswordMatch();
      });
    }

    // Debug info
    this.passwordForm.statusChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      console.log('Form Status:', {
        valid: this.passwordForm.valid,
        errors: this.passwordForm.errors,
        controls: {
          email: this.passwordForm.get('email')?.errors,
          oldPassword: this.passwordForm.get('oldPassword')?.errors,
          newPassword: this.passwordForm.get('newPassword')?.errors,
          confirmPassword: this.passwordForm.get('confirmPassword')?.errors
        }
      });
    });
  }

  private validatePasswordMatch(): void {
    const newPassword = this.passwordForm.get('newPassword')?.value;
    const confirmPassword = this.passwordForm.get('confirmPassword')?.value;

    if (newPassword && confirmPassword) {
      if (newPassword !== confirmPassword) {
        this.passwordForm.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      } else {
        const confirmControl = this.passwordForm.get('confirmPassword');
        const currentErrors = { ...confirmControl?.errors };
        delete currentErrors['passwordMismatch'];
        confirmControl?.setErrors(Object.keys(currentErrors).length ? currentErrors : null);
      }
    }
  }

  private createPasswordStrengthValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value) {
        return null;
      }

      const hasUpperCase = this.passwordPatterns.hasUpperCase.test(value);
      const hasLowerCase = this.passwordPatterns.hasLowerCase.test(value);
      const hasNumber = this.passwordPatterns.hasNumber.test(value);
      const hasSpecialChar = this.passwordPatterns.hasSpecialChar.test(value);

      const passwordValid = hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;

      return !passwordValid ? {
        passwordStrength: {
          hasUpperCase,
          hasLowerCase,
          hasNumber,
          hasSpecialChar
        }
      } : null;
    };
  }

  getErrorMessage(controlName: string): string {
    const control = this.passwordForm.get(controlName);
    if (!control?.errors || !control.touched) return '';

    const messages = this.validationMessages[controlName];
    if (!messages) return '';

    const firstError = Object.keys(control.errors)[0];
    return messages[firstError] || 'Error de validación';
  }

  getMismatchError(): string {
    if (this.passwordForm.get('confirmPassword')?.errors?.['passwordMismatch'] && 
        this.passwordForm.get('confirmPassword')?.touched) {
      return this.validationMessages['confirmPassword']['passwordMismatch'];
    }
    return '';
  }

  async onSubmit() {
    if (!this.passwordForm.valid) {
      this.markFormGroupTouched(this.passwordForm);
      await this.presentValidationErrorToast();
      return;
    }

    await this.presentLoading();

    try {
      const changePasswordData: ChangePasswordData = {
        email: this.passwordForm.get('email')?.value,
        oldPassword: this.passwordForm.get('oldPassword')?.value,
        newPassword: this.passwordForm.get('newPassword')?.value
      };

      await this.authService.changePassword(changePasswordData).toPromise();
      await this.dismissLoading();
      await this.presentSuccessAlert();
      this.router.navigate(['/login']);
    } catch (error: any) {
      await this.dismissLoading();
      await this.presentErrorToast(error);
    }
  }

  togglePasswordVisibility(field: 'old' | 'new' | 'confirm'): void {
    switch (field) {
      case 'old':
        this.showOldPassword = !this.showOldPassword;
        break;
      case 'new':
        this.showNewPassword = !this.showNewPassword;
        break;
      case 'confirm':
        this.showConfirmPassword = !this.showConfirmPassword;
        break;
    }
  }

  // Helpers para contraseña
  passwordMeetsLength(password: string | undefined): boolean {
    return password ? password.length >= 8 : false;
  }

  passwordHasUpperCase(password: string | undefined): boolean {
    return password ? this.passwordPatterns.hasUpperCase.test(password) : false;
  }

  passwordHasLowerCase(password: string | undefined): boolean {
    return password ? this.passwordPatterns.hasLowerCase.test(password) : false;
  }

  passwordHasNumber(password: string | undefined): boolean {
    return password ? this.passwordPatterns.hasNumber.test(password) : false;
  }

  passwordHasSpecialChar(password: string | undefined): boolean {
    return password ? this.passwordPatterns.hasSpecialChar.test(password) : false;
  }

  private async presentLoading(): Promise<void> {
    this.isLoading = true;
    const loading = await this.loadingController.create({
      message: 'Cambiando contraseña...',
      spinner: 'circular',
    });
    await loading.present();
  }

  private async dismissLoading(): Promise<void> {
    this.isLoading = false;
    await this.loadingController.dismiss();
  }

  private async presentSuccessAlert(): Promise<void> {
    const alert = await this.alertController.create({
      header: '¡Éxito!',
      message: 'Tu contraseña ha sido actualizada correctamente.',
      buttons: ['OK'],
      cssClass: 'success-alert'
    });
    await alert.present();
  }

  private async presentErrorToast(error: any): Promise<void> {
    let message = 'Error al cambiar la contraseña';
    if (error.error?.message) {
      message = error.error.message;
    } else if (error.message) {
      message = error.message;
    }

    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color: 'danger',
      buttons: [{ text: 'OK', role: 'cancel' }]
    });
    await toast.present();
  }

  private async presentValidationErrorToast(): Promise<void> {
    const toast = await this.toastController.create({
      message: 'Por favor, completa todos los campos correctamente',
      duration: 3000,
      position: 'bottom',
      color: 'warning',
      buttons: [{ text: 'OK', role: 'cancel' }]
    });
    await toast.present();
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/login']);
  }

  // Getters para el template
  get isFormValid(): boolean {
    return this.passwordForm.valid && !this.isLoading;
  }

  get formErrors(): string[] {
    const errors: string[] = [];
    
    if (this.passwordForm.get('email')?.errors) {
      errors.push('El email es inválido');
    }
    if (this.passwordForm.get('oldPassword')?.errors) {
      errors.push('La contraseña actual es requerida');
    }
    if (this.passwordForm.get('newPassword')?.errors) {
      errors.push('La nueva contraseña no cumple con los requisitos');
    }
    if (this.passwordForm.get('confirmPassword')?.errors) {
      errors.push('Las contraseñas no coinciden');
    }
  
    return errors;
  }
}