import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const currentUser = this.authService.currentUserValue;
    const isPasswordReset = route.data['isPasswordReset'] as boolean;

    // Si es una ruta de reset de contraseña, permitir acceso
    if (isPasswordReset) {
      return true;
    }

    // Verificar si el usuario está autenticado
    if (!currentUser) {
      this.router.navigate(['/login']);
      return false;
    }

    // Verificar roles si están especificados en la ruta
    const roles = route.data['roles'] as string[];
    if (roles && !roles.includes(currentUser.tipo)) {
      this.router.navigate(['/404']);
      return false;
    }

    return true;
  }
}