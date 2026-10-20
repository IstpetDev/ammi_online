import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validador de Cédula Ecuatoriana
 * La cédula ecuatoriana tiene 10 dígitos y usa el algoritmo de módulo 10
 */
export function validarCedulaEcuatoriana(cedula: string): boolean {
  if (!cedula || cedula.length !== 10) {
    return false;
  }

  // Verificar que solo contenga dígitos
  if (!/^\d{10}$/.test(cedula)) {
    return false;
  }

  // Obtener el código de provincia (primeros 2 dígitos)
  const provincia = parseInt(cedula.substring(0, 2), 10);

  // La provincia debe estar entre 01 y 24, o ser 30 (ecuatorianos en el exterior)
  if ((provincia < 1 || provincia > 24) && provincia !== 30) {
    return false;
  }

  // El tercer dígito debe ser menor a 6 para personas naturales
  const tercerDigito = parseInt(cedula.charAt(2), 10);
  if (tercerDigito >= 6) {
    return false;
  }

  // Algoritmo de validación módulo 10
  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;

  for (let i = 0; i < 9; i++) {
    let valor = parseInt(cedula.charAt(i), 10) * coeficientes[i];
    if (valor >= 10) {
      valor -= 9;
    }
    suma += valor;
  }

  const digitoVerificador = parseInt(cedula.charAt(9), 10);
  const residuo = suma % 10;
  const resultado = residuo === 0 ? 0 : 10 - residuo;

  return resultado === digitoVerificador;
}

/**
 * Validador de RUC Ecuatoriano
 * El RUC tiene 13 dígitos:
 * - Personas naturales: cédula + 001
 * - Sociedades privadas: tercer dígito = 9, validación módulo 11
 * - Sociedades públicas: tercer dígito = 6, validación módulo 11
 */
export function validarRucEcuatoriano(ruc: string): boolean {
  if (!ruc || ruc.length !== 13) {
    return false;
  }

  // Verificar que solo contenga dígitos
  if (!/^\d{13}$/.test(ruc)) {
    return false;
  }

  // Obtener el código de provincia (primeros 2 dígitos)
  const provincia = parseInt(ruc.substring(0, 2), 10);

  // La provincia debe estar entre 01 y 24, o ser 30
  if ((provincia < 1 || provincia > 24) && provincia !== 30) {
    return false;
  }

  const tercerDigito = parseInt(ruc.charAt(2), 10);

  // Persona natural (tercer dígito < 6)
  if (tercerDigito < 6) {
    // Los últimos 3 dígitos deben ser 001
    if (ruc.substring(10, 13) !== '001') {
      return false;
    }
    // Validar los primeros 10 dígitos como cédula
    return validarCedulaEcuatoriana(ruc.substring(0, 10));
  }

  // Sociedad pública (tercer dígito = 6)
  if (tercerDigito === 6) {
    return validarRucPublico(ruc);
  }

  // Sociedad privada (tercer dígito = 9)
  if (tercerDigito === 9) {
    return validarRucPrivado(ruc);
  }

  return false;
}

/**
 * Validación de RUC de sociedades públicas (tercer dígito = 6)
 */
function validarRucPublico(ruc: string): boolean {
  const coeficientes = [3, 2, 7, 6, 5, 4, 3, 2];
  let suma = 0;

  for (let i = 0; i < 8; i++) {
    suma += parseInt(ruc.charAt(i), 10) * coeficientes[i];
  }

  const digitoVerificador = parseInt(ruc.charAt(8), 10);
  const residuo = suma % 11;
  const resultado = residuo === 0 ? 0 : 11 - residuo;

  return resultado === digitoVerificador;
}

/**
 * Validación de RUC de sociedades privadas (tercer dígito = 9)
 */
function validarRucPrivado(ruc: string): boolean {
  const coeficientes = [4, 3, 2, 7, 6, 5, 4, 3, 2];
  let suma = 0;

  for (let i = 0; i < 9; i++) {
    suma += parseInt(ruc.charAt(i), 10) * coeficientes[i];
  }

  const digitoVerificador = parseInt(ruc.charAt(9), 10);
  const residuo = suma % 11;
  const resultado = residuo === 0 ? 0 : 11 - residuo;

  return resultado === digitoVerificador;
}

/**
 * Validador de Pasaporte Ecuatoriano
 * Formato: Una letra seguida de 6-9 dígitos (ej: A1234567)
 * También acepta pasaportes con formato alfanumérico más flexible
 */
export function validarPasaporteEcuatoriano(pasaporte: string): boolean {
  if (!pasaporte || pasaporte.length < 6 || pasaporte.length > 12) {
    return false;
  }

  // Formato típico: letra + dígitos o alfanumérico
  // Acepta: A1234567, AA123456, 123456789
  const regex = /^[A-Z]{0,2}\d{6,10}$|^[A-Z0-9]{6,12}$/i;
  return regex.test(pasaporte);
}

/**
 * Tipo de documento enum para identificación
 */
export enum TipoDocumentoEnum {
  CEDULA = 'CEDULA',
  RUC = 'RUC',
  PASAPORTE = 'PASAPORTE'
}

/**
 * ValidatorFn para Angular Reactive Forms
 * Valida el documento según el tipo seleccionado
 */
export function documentoEcuatorianoValidator(tipoDocumentoControl: AbstractControl): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const documento = control.value;
    const tipoDocumento = tipoDocumentoControl.value;

    if (!documento) {
      return null; // El required se maneja por separado
    }

    // Obtener el nombre del tipo de documento (puede ser string o número)
    const tipoNombre = getTipoDocumentoNombre(tipoDocumento);

    if (!tipoNombre) {
      return null; // Si no hay tipo seleccionado, no validar formato
    }

    switch (tipoNombre.toUpperCase()) {
      case 'CEDULA':
      case 'CÉDULA':
      case 'CEDULA DE IDENTIDAD':
      case 'CÉDULA DE IDENTIDAD':
        if (!validarCedulaEcuatoriana(documento)) {
          return { cedulaInvalida: { message: 'La cédula no es válida' } };
        }
        break;

      case 'RUC':
        if (!validarRucEcuatoriano(documento)) {
          return { rucInvalido: { message: 'El RUC no es válido' } };
        }
        break;

      case 'PASAPORTE':
        if (!validarPasaporteEcuatoriano(documento)) {
          return { pasaporteInvalido: { message: 'El pasaporte no tiene un formato válido' } };
        }
        break;

      default:
        // Para otros tipos de documento, solo validar que tenga contenido
        return null;
    }

    return null;
  };
}

/**
 * Función auxiliar para obtener el nombre del tipo de documento
 * Esto dependerá de cómo se almacene en tu sistema
 */
function getTipoDocumentoNombre(tipoDocumento: any): string | null {
  if (!tipoDocumento) {
    return null;
  }

  // Si es un string, devolverlo directamente
  if (typeof tipoDocumento === 'string') {
    return tipoDocumento;
  }

  // Si es un objeto con propiedad nombre
  if (typeof tipoDocumento === 'object' && tipoDocumento.nombre) {
    return tipoDocumento.nombre;
  }

  return null;
}

/**
 * Obtener mensaje de error específico según el tipo de documento
 */
export function getDocumentoErrorMessage(tipoDocumento: string | null): string {
  if (!tipoDocumento) {
    return 'Documento no válido';
  }

  switch (tipoDocumento.toUpperCase()) {
    case 'CEDULA':
    case 'CÉDULA':
    case 'CEDULA DE IDENTIDAD':
    case 'CÉDULA DE IDENTIDAD':
      return 'La cédula debe tener 10 dígitos y ser válida';
    case 'RUC':
      return 'El RUC debe tener 13 dígitos y ser válido';
    case 'PASAPORTE':
      return 'El pasaporte debe tener entre 6 y 12 caracteres alfanuméricos';
    default:
      return 'Documento no válido';
  }
}

/**
 * Obtener placeholder según el tipo de documento
 */
export function getDocumentoPlaceholder(tipoDocumento: string | null): string {
  if (!tipoDocumento) {
    return 'Ingrese su documento';
  }

  switch (tipoDocumento.toUpperCase()) {
    case 'CEDULA':
    case 'CÉDULA':
    case 'CEDULA DE IDENTIDAD':
    case 'CÉDULA DE IDENTIDAD':
      return 'Ej: 1712345678';
    case 'RUC':
      return 'Ej: 1712345678001';
    case 'PASAPORTE':
      return 'Ej: A1234567';
    default:
      return 'Ingrese su documento';
  }
}

/**
 * Obtener longitud máxima según el tipo de documento
 */
export function getDocumentoMaxLength(tipoDocumento: string | null): number {
  if (!tipoDocumento) {
    return 20;
  }

  switch (tipoDocumento.toUpperCase()) {
    case 'CEDULA':
    case 'CÉDULA':
    case 'CEDULA DE IDENTIDAD':
    case 'CÉDULA DE IDENTIDAD':
      return 10;
    case 'RUC':
      return 13;
    case 'PASAPORTE':
      return 12;
    default:
      return 20;
  }
}
