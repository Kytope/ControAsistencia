// src/app/components/alumno/alumno.module.ts
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { QRCodeModule } from 'angularx-qrcode';

import { AlumnoComponent } from './alumno.component';

const routes: Routes = [
  {
    path: '',
    component: AlumnoComponent
  }
];

@NgModule({
  declarations: [
    AlumnoComponent
  ],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    QRCodeModule,
    RouterModule.forChild(routes)
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AlumnoModule { }