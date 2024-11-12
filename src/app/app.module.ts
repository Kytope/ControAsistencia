import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { QRCodeModule } from 'angularx-qrcode';
import { CommonModule } from '@angular/common';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { LoginComponent } from './components/login/login.component';
import { ProfesorComponent } from './components/profesor/profesor.component';
import { QrModalComponent } from './components/qr-modal/qr-modal.component';
import { AlumnosModalComponent } from './components/alumnos-modal/alumnos-modal.component';
import { Error404Component } from './components/error-404/error-404.component';
import { ChangePasswordComponent } from './components/change-password/change-password.component';

@NgModule({
  declarations: [
    AppComponent, 
    LoginComponent, 
    ProfesorComponent,
    QrModalComponent,
    AlumnosModalComponent,
    Error404Component,
    ChangePasswordComponent
  ],
  imports: [
    BrowserModule,
    CommonModule, 
    IonicModule.forRoot({
      mode: 'ios', // Para una experiencia más consistente entre plataformas
      backButtonText: '',
    }),
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    QRCodeModule
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule {}