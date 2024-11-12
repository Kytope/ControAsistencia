import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Usuario, Clase, Asistencia, ResumenClase, Horario, AlumnoAsistencia, AsistenciaAlumno,
  ChangePasswordData,
  ChangePasswordResponse } from './auth.interfaces';

interface LoginError {
  error: string;
  message: string;
}


@Injectable({
  providedIn: 'root'
})

export class AuthService {
  private currentUserSubject: BehaviorSubject<Usuario | null>;
  public currentUser: Observable<Usuario | null>;
  private apiUrl = 'https://r268tbzl-5000.brs.devtunnels.ms';

  constructor(private http: HttpClient) {
    this.currentUserSubject = new BehaviorSubject<Usuario | null>(
      JSON.parse(localStorage.getItem('currentUser') || 'null')
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): Usuario | null {
    return this.currentUserSubject.value;
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ocurrió un error inesperado';
    
    if (error.error instanceof ErrorEvent) {
      // Error del cliente
      errorMessage = error.error.message;
    } else {
      // Error del servidor
      if (error.status === 401) {
        errorMessage = error.error.message || 'Credenciales inválidas';
      } else if (error.status === 400) {
        errorMessage = error.error.message || 'Datos invalidos';
      } else if (error.status === 404) {
        errorMessage = error.error.message || 'Recurso no encontrado';
      } else {
        errorMessage = error.error.message || 'Error del servidor';
      }
    }

    return throwError(() => new Error(errorMessage));
  }

  login(email: string, password: string): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.apiUrl}/login`, { email, password })
      .pipe(
        map(user => {
          localStorage.setItem('currentUser', JSON.stringify(user));
          this.currentUserSubject.next(user);
          return user;
        }),
        catchError(this.handleError)
      );
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  getClasesProfesor(profesorId: number): Observable<Clase[]> {
    return this.http.get<Clase[]>(`${this.apiUrl}/profesor/${profesorId}/clases`)
      .pipe(
        map((clases: Clase[]) => clases.map(clase => ({
          ...clase,
          alumnosCount: clase.alumnosCount || 0,
          ultimaAsistencia: clase.ultimaAsistencia || undefined
        } as Clase))),
        catchError((error: HttpErrorResponse) => {
          console.error('Error al obtener clases:', error);
          return of([] as Clase[]);
        })
      );
  }

  getAlumnosClase(claseId: number): Observable<AlumnoAsistencia[]> {
    return this.http.get<any[]>(`${this.apiUrl}/clases/${claseId}/alumnos`).pipe(
      map(alumnos => {
        return alumnos.map(alumno => ({
          alumno_id: alumno.id,
          alumno_nombre: alumno.nombre || 'Sin nombre',
          total_asistencias: alumno.total_asistencias || 0,
          asistencias: [{
            fecha: alumno.ultima_fecha || '',
            estado: alumno.ultimo_estado ? alumno.ultimo_estado.toLowerCase() : 'sin estado'
          }]
        }));
      }),
      catchError(error => {
        console.error('Error al obtener alumnos:', error);
        return of([]);
      })
    );
  }

    // Método para obtener las clases de un alumno
    getClasesAlumno(alumnoId: number): Observable<Clase[]> {
      return this.http.get<Clase[]>(`${this.apiUrl}/alumno/${alumnoId}/clases`)
        .pipe(
          map((clases: Clase[]) => clases.map(clase => ({
            ...clase,
            horarios: clase.horarios || [],
            ultimaAsistencia: clase.ultimaAsistencia || null
          } as Clase))),
          catchError((error: HttpErrorResponse) => {
            console.error('Error al obtener clases del alumno:', error);
            return of([] as Clase[]);
          })
        );
    }
  
    // Método para obtener asistencias de un alumno en una clase específica
    getAsistenciaAlumno(alumnoId: number, claseId: number): Observable<Asistencia[]> {
      return this.http.get<Asistencia[]>(
        `${this.apiUrl}/asistencia/${alumnoId}/${claseId}`
      ).pipe(
        map((asistencias: Asistencia[]) => asistencias.map(asistencia => ({
          ...asistencia,
          estado: asistencia.estado.toLowerCase()
        } as Asistencia))),
        catchError((error: HttpErrorResponse) => {
          console.error('Error al obtener asistencias del alumno:', error);
          return of([] as Asistencia[]);
        })
      );
    }

    getAsistenciaClase(profesorId: number, claseId: number): Observable<AlumnoAsistencia[]> {
      return this.http.get<any[]>(
        `${this.apiUrl}/profesor/${profesorId}/asistencia/${claseId}`
      ).pipe(
        map(response => {
          // Verificar y transformar cada alumno y sus asistencias
          return response.map(alumno => ({
            alumno_id: alumno.alumno_id,
            alumno_nombre: alumno.alumno_nombre || 'Sin nombre',
            total_asistencias: alumno.total_asistencias || 0,
            asistencias: (alumno.asistencias || []).map((asistencia: any) => ({
              fecha: asistencia.fecha || '',
              estado: asistencia.estado ? asistencia.estado.toLowerCase() : 'sin estado'
            }))
          }));
        }),
        catchError(error => {
          console.error('Error al obtener asistencias:', error);
          return of([]);
        })
      );
    }

  getHorariosClase(claseId: number): Observable<Horario[]> {
    return this.http.get<Horario[]>(`${this.apiUrl}/clases/${claseId}/horarios`)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error al obtener horarios:', error);
          return of([]);
        })
      );
  }

  registrarAsistencia(data: {
    alumno_id: number;
    clase_id: number;
    fecha: string;
    estado: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/asistencia`, data)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error al registrar asistencia:', error);
          throw error;
        })
      );
  }

  getResumenClase(profesorId: number, claseId: number): Observable<ResumenClase[]> {
    return this.http.get<ResumenClase[]>(
      `${this.apiUrl}/profesor/${profesorId}/clase/${claseId}/resumen`
    ).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error al obtener resumen:', error);
        return of([]);
      })
    );
  }

  changePassword(data: { email: string; oldPassword: string; newPassword: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/change-password`, data).pipe(
      catchError(error => {
        console.error('Service error:', error);
        return throwError(() => error);
      })
    );
  }

  registrarAsistenciaQR(data: { qrData: string; alumnoId: number }): Observable<any> {
    console.log('Service sending data:', data); // Log para debug
    return this.http.post(`${this.apiUrl}/registrar-asistencia-qr`, data)
      .pipe(
        catchError(error => {
          console.error('Service error:', error);
          if (error.error && typeof error.error === 'string') {
            error.error = { message: error.error };
          }
          return throwError(() => error);
        })
      );
  }

}