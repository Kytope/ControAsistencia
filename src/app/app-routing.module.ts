import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { ProfesorComponent } from './components/profesor/profesor.component';
import { Error404Component } from './components/error-404/error-404.component';
import { ChangePasswordComponent } from './components/change-password/change-password.component';
import { AuthGuard } from './guards/auth.guard';

interface RouteData {
  roles?: string[];
}

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { 
    path: 'alumno',
    loadChildren: () => import('./components/alumno/alumno.module').then(m => m.AlumnoModule),
    canActivate: [AuthGuard],
    data: { roles: ['alumno'] } as RouteData
  },
  { 
    path: 'profesor', 
    component: ProfesorComponent, 
    canActivate: [AuthGuard],
    data: { roles: ['profesor'] } as RouteData
  },
  { path: 'change-password', component: ChangePasswordComponent },
  { path: '404', component: Error404Component },
  { path: '**', redirectTo: '/404' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }