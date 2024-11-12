export interface Usuario {
    id: number;
    nombre: string;
    email: string;
    tipo: 'alumno' | 'profesor';
  }
  
  export interface Horario {
    dia_semana: string;
    hora_inicio: string;
    hora_fin: string;
  }
  
  export interface Clase {
    id: number;
    nombre: string;
    profesor?: string;
    profesor_id?: number;
    alumnosCount?: number;
    ultimaAsistencia?: string | null;  // Permitimos null o undefined
    horarios?: Horario[];
  }
  
  export interface Asistencia {
    alumno_id: number;
    alumno_nombre: string;
    fecha: string;
    estado: string;
  }
  
  export interface ResumenClase {
    fecha: string;
    total_alumnos: number;
    presentes: number;
    ausentes: number;
  }

  export interface AsistenciaAlumno {
    fecha: string;
    estado: string;
  }
  
  export interface AlumnoAsistencia {
    alumno_id: number;
    alumno_nombre: string;
    total_asistencias: number;
    asistencias: AsistenciaAlumno[];
  }
  
  export interface ResumenDia {
    total_alumnos: number;
    presentes: number;
    ausentes: number;
    fecha: string;
  }
  
// Nueva interfaz para el cambio de contraseña
export interface ChangePasswordData {
  email: string;
  oldPassword: string;
  newPassword: string;
}

// Nueva interfaz para la respuesta del cambio de contraseña
export interface ChangePasswordResponse {
  message: string;
}