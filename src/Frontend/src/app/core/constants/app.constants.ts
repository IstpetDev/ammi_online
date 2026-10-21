// Constantes para datos de prueba y configuración
import { environment } from '../../environments/environment';

export const API_BASE_URL = environment.apiUrl;

export const API_ENDPOINTS = {
  // Endpoints de autenticación
  auth: {
    login: `${API_BASE_URL}/api/Auth/login`,
    register: `${API_BASE_URL}/api/Auth/register`,
    changePassword: `${API_BASE_URL}/api/Auth/change-password`,
    logout: '/api/auth/logout',
    refresh: `${API_BASE_URL}/api/Auth/refresh`,
    forgotPassword: `${API_BASE_URL}/api/Auth/forgot-password`,
    resetPassword: `${API_BASE_URL}/api/Auth/reset-password`,
    cambiarContraseniaPrimerIngreso: `${API_BASE_URL}/api/Auth/cambiar-contrasenia-primer-ingreso`
  },
  // Endpoints de postulaciones
  postulaciones: {
    persona: {
      getByDocumento: (documento: string) => `/Persona/GetByPersona?Documento=${documento}`,
      getByIdPersona: (idPersona: number) => `/Persona/GetByPersona?IdPersona=${idPersona}`
    },
    tipoDocumento: {
      getAll: '/TipoDocumento/GetAllTipoDocumento',
      create: '/TipoDocumento/CreateTipoDocumento'
    },
    estadoCivil: {
      getAll: '/EstadoCivil/GetAllEstadoCivil'
    },
    etnia: {
      getAll: '/Etnia/GetAllEtnias',
      create: '/Etnia/CreateEtnia'
    },
    nacionalidadEtnica: {
      getAll: '/NacionalidadEtnica/GetAllNacionalidadEtnica',
      getByEtnia: (id: number) => `/NacionalidadEtnica/GetNacionalidadEtnicaByEtnia/by-etnia/${id}`,
      create: '/NacionalidadEtnica/CreateNacionalidadEtnica'
    },
    tipoDatoContacto: {
      getAll: '/TipoDatoContacto/GetAllTipoDatoContacto',
      create: '/TipoDatoContacto/CreateTipoDatoContacto'
    },
    tipoOferta: {
      getAll: '/TipoOferta/GetAllTipoOferta',
      create: '/TipoOferta/CreateTipoOferta'
    },
    genero: {
      getAll: '/Genero/GetAllGenero'
    },
    tipoActividadEconomica: {
      getAll: '/TipoActividadEconomica/GetAllTipoActividadEconomica',
      create: '/TipoActividadEconomica/CreateTipoActividadEconomica'
    },
    tipoDiscapacidad: {
      getAll: '/TipoDiscapacidad/GetAllTipoDiscapacidad',
      create: '/TipoDiscapacidad/CreateTipoDiscapacidad'
    },
    tipoDocumentoPersonal: {
      getAll: '/TipoDocumentoPersonal/GetAllTipoDocumentoPersonal'
    },
    tipoEstadoAprobacion: {
      getAll: '/TipoEstadoAprobacion/GetAllTipoEstadoAprobacion'
    },
    pais: {
      getAll: '/Pais/GetAllPais'
    },
    provincia: {
      getByPais: (id: number) => `/Provincia/GetProvinciasByPais/by-pais/${id}`
    },
    canton: {
      getAll: '/Canton/GetAllCanton',
      getByProvincia: (id: number) => `/Canton/GetCantonesByProvincia/by-provincia/${id}`,
      create: '/Canton/CreateCanton'
    },
    parroquia: {
      getAll: '/Parroquia/GetAllParroquia',
      getByCanton: (id: number) => `/Parroquia/GetParroquiasByCanton/by-canton/${id}`,
      create: '/Parroquia/CreateParroquia'
    },
    mallaRequisitos: {
      getAll: '/MallaRequisitos',
      getByMalla: (idMalla: number) => `/MallaRequisitos/ByMalla/${idMalla}`
    },
    postulacion: {
      crearPostulacionExterna: '/PersonaPostulacion/CrearPostulacion/create-postulacion',
      crearPostulacionManual: '/PersonaPostulacion/CrearPostulacionManual/postulacion',
      getPostulacionBy: '/PersonaPostulacion/GetPostulacionBy',
      getAllPostulaciones: '/Postulacion',
      updateMalla: (idPostulacion: number) => `/Postulacion/${idPostulacion}/malla`,
      eliminarPostulacion: (idPostulacion: number) => `/Postulacion/${idPostulacion}`,
      actualizarDatosBasicos: (idPostulacion: number) => `/Postulacion/${idPostulacion}/datos-basicos`,
      actualizarPostulacionContacto: '/PersonaPostulacion/ActualizarPostulacionContacto/actualizar-postulacion-contacto'
    },
    requisitos: {
      getAll: '/Requisitos',
      getByMalla: (idMalla: number) => `/Requisitos/GetRequisitosByMalla/${idMalla}`
    },
    periodosLectivos: {
      getAll: '/PeriodoLectivo/GetPeriodosLectivos',
      post: '/PeriodoLectivo/CreatePeriodoLectivo',
      put: '/PeriodoLectivo/UpdatePeriodoLectivo',
      delete: (id: number) => `/PeriodoLectivo/DeletePeriodoLectivo/${id}`
    },
    regimen: {
      getAll: '/Regimen/GetRegimenes',
      post: '/Regimen/CreateRegimen',
      put: '/Regimen/UpdateRegimen',
      delete: (id: number) => `/Regimen/DeleteRegimen/${id}`
    },
    ciclo: {
      getAll: '/Ciclo/GetCiclo',
      post: '/Ciclo/CreateCiclo',
      put: '/Ciclo/UpdateCiclo',
      delete: (id: number) => `/Ciclo/DeleteCiclo/${id}`,
      desactivate: (id: number) => `/Ciclo/DeactivateCiclo/${id}/desactivar`
    },
    estadoMatricula: {
      getAll: '/api/EstadoMatricula'
    },
    rematriculacion: {
      getInfo: (numeroDocumento: string, idCicloDestino: number) => `/api/ReMatriculacion/${numeroDocumento}/info?idCicloDestino=${idCicloDestino}`,
      ejecutar: '/api/ReMatriculacion'
    },
    paralelo: {
      getAll: '/Paralelo/GetParalelo'
    },
    malla: {
      getAll: '/Malla/GetAllMalla',
      getByTipoOferta: (idTipoOferta: number) => `/Malla/GetMallaByTipoOferta/${idTipoOferta}`,
      getByParams: (params?: { IdTipoOferta?: number, IdCiclo?: number, IdMalla?: number, IdCursos?: number, Detalle?: string }) => {
        const queryParams = new URLSearchParams();
        if (params?.IdTipoOferta) queryParams.append('IdTipoOferta', params.IdTipoOferta.toString());
        if (params?.IdCiclo) queryParams.append('IdCiclo', params.IdCiclo.toString());
        if (params?.IdMalla) queryParams.append('IdMalla', params.IdMalla.toString());
        if (params?.IdCursos) queryParams.append('IdCursos', params.IdCursos.toString());
        if (params?.Detalle) queryParams.append('Detalle', params.Detalle);
        return `/Malla${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      }
    },
    matricula: {
      getAll: (pageSize: number, pageNumber: number, idCiclo?: number, idOfertaAcademica?: number, documentoNombre?: string, idMalla?: number): string => {
        let url = `/api/Matricula?PageSize=${pageSize}&PageNumber=${pageNumber}`;
        if (idCiclo != null) url += `&idCiclo=${idCiclo}`;
        if (idOfertaAcademica != null) url += `&idOfertaAcademica=${idOfertaAcademica}`;
        if (idMalla != null) url += `&idMalla=${idMalla}`;
        if (documentoNombre != null && documentoNombre.trim() !== '') url += `&documentoNombre=${encodeURIComponent(documentoNombre.trim())}`;
        return url;
      },
      getById: (id: number) => `/api/Matricula/${id}`,
      getByParalelo: (idParalelo: number) => `/api/Matricula/ByParalelo/${idParalelo}`,
      getAlumnosByParalelo: (idParalelo: number) => `/api/Matricula/ByParalelo/${idParalelo}`,
      getByMallaParalelo: (idMallaParalelo: number) => `/api/Matricula/ByMallaParalelo/${idMallaParalelo}`,
      getByMallaParaleloYMateria: (idMallaParalelo: number, idDetalleMalla: number) =>
        `/api/Matricula/ByMallaParalelo/${idMallaParalelo}/Materia/${idDetalleMalla}`,
      getByAlumno: (idUsuario: number) => `/api/Matricula/ByAlumno/${idUsuario}`,
      getHistorialCompleto: (idUsuario: number) => `/api/Matricula/ByAlumno/${idUsuario}/Completo`,
      getByIdConDetalle: (id: number) => `/api/Matricula/${id}/Detalle`,
      // AGREGAR nuevo endpoint
      getByParaleloYMateria: (idParalelo: number, idDetalleMalla: number) =>
        `/api/Matricula/ByParalelo/${idParalelo}/Materia/${idDetalleMalla}`,
      getByMalla: (idMalla: number) => `/api/Matricula/ByMalla/${idMalla}`,
    },
    cambiarEstadoPostulacion: {
      changeState: '/CambiarEstadoPostulacion/CambiarEstado',
    },
    documentos: {
      getDocumentosPersonalesByPersona: (idPersona: number) => `/DocumentosPersonales/GetByDocumentosPersonales?IdPersona=${idPersona}`,
      uploadAdjunto: '/DocumentosPersonales/CreateDocumentosPersonales',
      createDocumentoPersonal: '/DocumentoPersonal/Create',
      updateDocumentoPersonal: '/DocumentosPersonales/UpdateDocumentosPersonales',
      deleteDocumentoPersonal: (idDocumentosPersonales: number) => `/DocumentosPersonales/DeleteDocumentosPersonales?IdDocumentosPersonales=${idDocumentosPersonales}`,
      getAdjunto: (idAdjunto: number) => `/Adjuntos/${idAdjunto}`,
      deleteAdjunto: (idAdjunto: number) => `/Adjuntos/${idAdjunto}`
    },
    fotoPerfil: {
      getByPersona: (idPersona: number) => `/FotoPerfil/GetByPersonaId/${idPersona}`
    },
    area: {
      getAll: '/Area/GetArea',
      post: '/Area/CreateArea',
      put: '/Area/UpdateArea',
      delete: (id: number) => `/Area/DeleteArea/${id}`
    },
    areaCompetencia: {
      getAll: '/AreaCompetencia/GetAreaCompetencia',
      post: '/AreaCompetencia/CreateAreaCompetencia',
      put: '/AreaCompetencia/UpdateAreaCompetencia',
      delete: (id: number) => `/AreaCompetencia/DeleteAreaCompetencia/${id}`
    }
  },
  // Endpoints de pagos
  pagos: {
    // Especies
    especie: {
      getAll: '/api/Especie/GetAll'
    },
    // Especie por Ciclo
    especieCiclo: {
      getAll: '/api/EspecieCiclo/GetAllEspecieCiclo',
      getByCiclo: (idCiclo: number) => `/api/EspecieCiclo/GetEspecieCicloByCiclo/${idCiclo}`
    },
    // Tipos de Pago
    tipoPago: {
      getAll: '/api/TipoPago/GetAllTipoPago'
    },
    // Créditos
    credito: {
      getAll: '/api/Credito/GetAllCredito',
      getById: (id: number) => `/api/Credito/GetCredito/${id}`,
      getByMatricula: (idMatricula: number) => `/api/Credito/GetCreditoByMatricula/${idMatricula}`,
      getByDocumento: (documento: string) => `/api/Credito/GetCreditoByDocumento/${documento}`,
      getCreditosConDetalles: (idMatricula: number) => `/api/Credito/GetCreditosByMatricula/GetCreditosByMatricula/${idMatricula}`,
      diferirCredito: '/api/Credito/DiferirCredito/Diferir',
      asignarCreditoExtra: '/api/Credito/AsignarCreditoExtra',
      asignarCreditoExtraMasivo: '/api/Credito/asignar-masivo',
      anularCreditoExtra: (idCredito: number) => `/api/Credito/AnularCreditoExtra/${idCredito}`,
      getCreditosExtras: (idMatricula?: number) => idMatricula ? `/api/Credito/GetCreditosExtras?idMatricula=${idMatricula}` : '/api/Credito/GetCreditosExtras'
    },
    // Detalle de Crédito
    detalleCredito: {
      getByCredito: (idCredito: number) => `/api/DetalleCredito/GetDetalleCreditoByCredito/${idCredito}`,
      getPendientes: (idCredito: number) => `/api/DetalleCredito/GetDetallesCreditoPendientes/${idCredito}`,
      getByMatricula: (idMatricula: number) => `/api/Credito/GetDetallesCreditoByMatricula/GetDetallesCreditoByMatricula/${idMatricula}`,
      actualizarFechaLimite: (id: number) => `/api/Credito/ActualizarFechaLimiteCuota/ActualizarFechaLimiteCuota/${id}`
    },
    // Pagos
    pagoCredito: {
      crear: '/api/Pagos',
      getByCredito: (idCredito: number) => `/api/PagoCredito/GetPagosByCredito/${idCredito}`
    },
    // Beneficios - Catálogo
    beneficio: {
      getAll: '/api/Beneficio/GetAll',
      getById: (id: number) => `/api/Beneficio/GetById/ById?id=${id}`,
      getByIdEspecie: (idEspecie: number) => `/api/Beneficio/GetByIdEspecie/ByEspecie?idEspecie=${idEspecie}`,
      create: '/api/Beneficio/Create',
      update: '/api/Beneficio/Update',
      delete: (id: number) => `/api/Beneficio/Delete/${id}`
    },
    // EstudianteBeneficio - Asignaciones
    estudianteBeneficio: {
      getByAlumno: (idPersona: number) => `/api/EstudianteBeneficio/GetByAlumno/ByAlumno/${idPersona}`,
      create: '/api/EstudianteBeneficio/Asignar',
      desactivar: '/api/EstudianteBeneficio/Desactivar/Desactivar'
    },
    // TipoCuenta
    tipoCuenta: {
      getAll: '/api/TipoCuenta/GetTipoCuenta'
    },
    // CuentaBancaria
    cuentaBancaria: {
      getAll: '/api/CuentaBancaria/GetCuentaBancaria',
      create: '/api/CuentaBancaria/CreateCuentaBancaria',
      update: '/api/CuentaBancaria/UpdateCuentaBancaria',
      delete: (id: number) => `/api/CuentaBancaria/DeactivateCuentaBancaria/${id}/desactivar`
    },
    // Cliente
    cliente: {
      getByDocumento: (documento: string) => `/api/Cliente/GetClientes?Documento=${documento}`,
      getById: (idCliente: number) => `/api/Cliente/GetClientes?IdCliente=${idCliente}`,
      create: '/api/Cliente/CreateCliente'
    },
    // Contabilidad - Resumen por alumno
    contabilidad: {
      resumenAlumnos: `/api/Contabilidad/resumen-alumnos`
    }
  },

  infraestructura: {
    area: {
      getAll: '/Area/GetArea',
      create: '/Area/CreateArea',
      update: '/Area/UpdateArea',
      delete: (id: number) => `/Area/DeleteArea/${id}`
    },
    areaCompetencia: {
      getAll: '/AreaCompetencia/GetAreaCompetencia',
      create: '/AreaCompetencia/CreateAreaCompetencia',
      update: '/AreaCompetencia/UpdateAreaCompetencia',
      delete: (id: number) => `/AreaCompetencia/DeleteAreaCompetencia/${id}`
    },
    mallas: {
      getAll: '/Malla',
      getByCiclo: (idCiclo: number) => `/Malla/ByCiclo/${idCiclo}`,
      create: '/Malla',
      update: '/Malla',
      delete: (id: number) => `/Malla/${id}`
    },

    tipoOferta: {
      getAll: '/TipoOferta/GetAllTipoOferta',
      create: '/TipoOferta/CreateTipoOferta',
      update: '/TipoOferta/UpdateTipoOferta',
      delete: (id: number) => `/TipoOferta/DeleteTipoOferta/${id}`
    },
    curso: {
      getAll: '/Cursos/GetCursos',
      create: '/Cursos/CreateCurso',
      update: '/Cursos/UpdateCurso',
      delete: (id: number) => `/Cursos/DeleteCurso/${id}`
    },
    materia: {
      getAll: '/Materia/GetMaterias',
      create: '/Materia/CreateMateria',
      update: '/Materia/UpdateMateria',
      delete: (id: number) => `/Materia/DeleteMateria/${id}`
    },
    especialidad: {
      getAll: '/Especialidad/GetEspecialidad',
      create: '/Especialidad/CreateEspecialidad',
      update: '/Especialidad/UpdateEspecialidad',
      delete: (id: number) => `/Especialidad/DeleteEspecialidad/${id}`
    },
    requisitos: {
      getAll: '/Requisitos',
      create: '/Requisitos',
      update: '/Requisitos',
      delete: (id: number) => `/Requisitos/${id}`
    },
    mallaRequisitos: {
      getAll: '/MallaRequisitos',
      getByMalla: (idMalla: number) => `/MallaRequisitos/ByMalla/${idMalla}`,
      create: '/MallaRequisitos',
      asignacionMasica: '/MallaRequisitos/AsignarRequisitos',
      delete: (id: number) => `/MallaRequisitos/${id}`
    },
    mallaParalelo: {
      getByMalla: (idMalla: number) => `/MallaParalelo/GetByMalla/ByMalla/${idMalla}`,
      create: '/MallaParalelo/Crear',
      activar: (id: number) => `/MallaParalelo/ActivarMallaParalelo/${id}/activar`,
      desactivar: (id: number) => `/MallaParalelo/DesactivarMallaParalelo/${id}/desactivar`
    },
    mallaCompleta: {
      crear: '/api/MallaCompleta/Crear',
      duplicar: '/api/MallaCompleta/Duplicar',
      clonar: '/api/MallaCompleta/Duplicar',
      clonarParaCiclo: '/api/MallaCompleta/ClonarParaCiclo'
    }
  },
  // Endpoints de seguridad
  seguridad: {
    rol: {
      getAll: '/Rol/GetAllRol',
      create: '/Rol/CreateRol',
      update: '/Rol/UpdateRol',
      delete: (id: number) => `/Rol/DeleteRol/${id}`
    },
    rolOperacion: {
      getAll: '/RolOperacion/GetAllRolOperacion',
      getByRol: (idRol: number) => `/RolOperacion/GetByRol/by-rol/${idRol}`,
      getByModuloOperacion: (idModuloOperacion: number) => `/RolOperacion/GetByModuloOperacion/by-modulo-operacion/${idModuloOperacion}`,
      getActivos: '/RolOperacion/GetActivos/activos',
      create: '/RolOperacion/CreateRolOperacion',
      update: '/RolOperacion/UpdateRolOperacion',
      delete: (id: number) => `/RolOperacion/DeleteRolOperacion/${id}`
    },
    rolUsuario: {
      getAll: '/RolUsuario/GetAllRolUsuario',
      getByRol: (idRol: number) => `/RolUsuario/GetByRol/by-rol/${idRol}`,
      getByPersona: (idPersona: number) => `/RolUsuario/GetByPersona/by-persona/${idPersona}`,
      create: '/RolUsuario/CreateRolUsuario',
      update: '/RolUsuario/UpdateRolUsuario',
      delete: (id: number) => `/RolUsuario/DeleteRolUsuario/${id}`
    },
    persona: {
      getByDocumento: '/Persona/GetByPersona',
      create: '/Persona/CreatePersona',
      update: '/Persona/UpdatePersona',
      delete: '/Persona/DeletePersona'
    },
    usuario: {
      getAll: '/Usuario/GetAll',
      create: '/Usuario/Create'
    },
    modulo: {
      getAll: '/Modulo/GetAllModulo'
    },
    moduloOperacion: {
      getAll: '/ModuloOperacion/GetAllModuloOperacion',
      getByModulo: (idModulo: number) => `/ModuloOperacion/GetByModulo/by-modulo/${idModulo}`,
      getByOperacion: (idOperacion: number) => `/ModuloOperacion/GetByOperacion/by-operacion/${idOperacion}`,
      getActivos: '/ModuloOperacion/GetActivos/activos',
      create: '/ModuloOperacion/CreateModuloOperacion',
      update: '/ModuloOperacion/UpdateModuloOperacion',
      delete: (id: number) => `/ModuloOperacion/DeleteModuloOperacion/${id}`
    }
  },
  notas: {
    // PlantillaEvaluacion - Plantillas de evaluacion
    plantillaEvaluacion: {
      getAll: '/PlantillaEvaluacion',
      getActivos: '/PlantillaEvaluacion/activos',
      getById: (id: number) => `/PlantillaEvaluacion/${id}`,
      create: '/PlantillaEvaluacion',
      update: '/PlantillaEvaluacion',
      delete: (id: number) => `/PlantillaEvaluacion/${id}`
    },
    // PlantillaEstructura - Estructura jerarquica de evaluacion
    plantillaEstructura: {
      getArbol: (idPlantilla: number) => `/PlantillaEstructura/Arbol/${idPlantilla}`,
      getNodos: (idPlantilla: number) => `/PlantillaEstructura/Nodos/${idPlantilla}`,
      getById: (id: number) => `/PlantillaEstructura/${id}`,
      validar: (idPlantilla: number) => `/PlantillaEstructura/Validar/${idPlantilla}`,
      create: '/PlantillaEstructura',
      createCompleta: '/PlantillaEstructura/Completa',
      update: '/PlantillaEstructura',
      reordenar: '/PlantillaEstructura/Reordenar',
      delete: (id: number) => `/PlantillaEstructura/${id}`,
      duplicar: (id: number) => `/PlantillaEstructura/DuplicarPlantilla/${id}`
    },
    // TipoPlantillaEstructura - Tipos de nodo (PARCIAL, EXAMEN, etc.)
    tipoPlantillaEstructura: {
      getAll: '/TipoPlantillaEstructura',
      create: '/TipoPlantillaEstructura',
      update: '/TipoPlantillaEstructura',
      delete: (id: number) => `/TipoPlantillaEstructura/${id}`
    },
    // ReglasCalculo - Reglas de calculo por nodo
    reglasCalculo: {
      getById: (id: number) => `/ReglasCalculo/${id}`,
      getByEstructura: (idPlantillaEstructura: number) => `/ReglasCalculo/ByEstructura/${idPlantillaEstructura}`,
      getByPlantilla: (idPlantillaEvaluacion: number) => `/ReglasCalculo/ByPlantilla/${idPlantillaEvaluacion}`,
      create: '/ReglasCalculo',
      update: '/ReglasCalculo',
      delete: (id: number) => `/ReglasCalculo/${id}`
    },
    // TipoReglaCalculo - Tipos de regla (PROMEDIO, SUMA, etc.)
    tipoReglaCalculo: {
      getAll: '/TipoReglaCalculo',
      create: '/TipoReglaCalculo',
      update: '/TipoReglaCalculo',
      delete: (id: number) => `/TipoReglaCalculo/${id}`
    },
    // NotasAlumno - Notas de estudiantes
    notasAlumno: {
      getById: (id: number) => `/NotasAlumno/${id}`,
      getByMatricula: (idMatricula: number) => `/NotasAlumno/ByMatricula/${idMatricula}`,
      // AGREGAR nuevos endpoints
      getByMallaParalelo: (idMallaParalelo: number) => `/NotasAlumno/ByMallaParalelo/${idMallaParalelo}`,
      getByDetalleMatricula: (id: number) => `/NotasAlumno/ByDetalleMatricula/${id}`,
      getByMatriculaYMateria: (idMatricula: number, idDetalleMalla: number) =>
        `/NotasAlumno/ByMatricula/${idMatricula}/Materia/${idDetalleMalla}`,
      getByMatriculaYPlantilla: (idMatricula: number, idPlantilla: number) => `/NotasAlumno/ByMatricula/${idMatricula}/Plantilla/${idPlantilla}`,
      getBoletin: (idMatricula: number) => `/NotasAlumno/Boletin/${idMatricula}`,
      create: '/NotasAlumno',
      createMasivo: '/NotasAlumno/Masivo',
      update: '/NotasAlumno',
      delete: (id: number) => `/NotasAlumno/${id}`,
      recalcular: (idMatricula: number, idPlantilla: number) => `/NotasAlumno/Recalcular/${idMatricula}/${idPlantilla}`
    }
  },
  // Endpoints de usuarios
  users: {
    list: '/users',
    create: '/users',
    update: (id: number) => `/users/${id}`,
    delete: (id: number) => `/users/${id}`
  },
  // Endpoints de distributivo
  distributivo: {
    getAll: '/Distributivo',
    getById: (id: number) => `/Distributivo/${id}`,
    getByDocente: (idPersona: number) => `/Distributivo/ByDocente/${idPersona}`,
    getByMalla: (idMalla: number) => `/Distributivo/ByMalla/${idMalla}`,
    getByParalelo: (idParalelo: number) => `/Distributivo/ByParalelo/${idParalelo}`,
    getByCiclo: (idCiclo: number) => `/Distributivo/ByCiclo/${idCiclo}`,
    getCargaDocente: (idPersona: number) => `/Distributivo/CargaDocente/${idPersona}`,
    getDocentes: '/Distributivo/Docentes',
    create: '/Distributivo',
    createMasivo: '/Distributivo/Masivo',
    update: '/Distributivo',
    delete: (id: number) => `/Distributivo/${id}`
  },
  // Endpoints de DetalleMalla
  detalleMalla: {
    getById: (id: number) => `/DetalleMalla/${id}`,
    getByMalla: (idMalla: number) => `/DetalleMalla/ByMalla/${idMalla}`,
    create: '/DetalleMalla',
    createBulk: '/DetalleMalla/Bulk',
    update: '/DetalleMalla',
    delete: (id: number) => `/DetalleMalla/${id}`
  },
  // Endpoints de Ciclo
  ciclo: {
    getAll: '/Ciclo/GetCiclo',
    create: '/Ciclo/CreateCiclo',
    update: '/Ciclo/UpdateCiclo',
    delete: (id: number) => `/Ciclo/DeleteCiclo/${id}`,
    desactivate: (id: number) => `/Ciclo/DeactivateCiclo/${id}/desactivar`
  },
  // Endpoints de Especie
  especie: {
    getAll: '/Especie/GetAll',
    create: '/Especie/Create',
    update: '/Especie/Update',
    delete: (id: number) => `/api/Especie/Delete/${id}`
  },
  // Endpoints de EspecieCiclo
  especieCiclo: {
    getAll: '/EspecieCiclo',
    create: '/EspecieCiclo',
    update: '/EspecieCiclo',
    getByMalla: (idMalla: number) => `/EspecieCiclo/malla/${idMalla}`,
    getById: (id: number) => `/EspecieCiclo/${id}`,
    delete: (id: number) => `/EspecieCiclo/${id}`
  },
  // Endpoints de PersonaInfo
  personaInfo: {
    getByPersona: (idPersona: number) => `/PersonaInfo/GetByPersonaInfo?IdPersona=${idPersona}`,
    create: '/PersonaInfo/CreatePersonaInfo',
    update: '/PersonaInfo/UpdatePersonaInfo'
  },
  // Endpoints de PersonaDireccion
  personaDireccion: {
    getByPersona: (idPersona: number) => `/PersonaDireccion/GetByPersonaDireccion?IdPersona=${idPersona}`,
    create: '/PersonaDireccion/CreatePersonaDireccion',
    update: '/PersonaDireccion/UpdatePersonaDireccion'
  },
  // Endpoints de DatosContactos
  datosContactos: {
    getByPersona: (idPersona: number) => `/DatosContactos/GetByDatosContacto?IdPersona=${idPersona}`,
    create: '/DatosContactos/CreateDatosContacto',
    update: '/DatosContactos/UpdateDatosContacto'
  },
  // Endpoints de PersonaNacionalidad
  personaNacionalidad: {
    getByPersona: (idPersona: number) => `/PersonaNacionalidad/GetByPersonaNacionalidad?IdPersona=${idPersona}`,
    create: '/PersonaNacionalidad/CreatePersonaNacionalidad',
    update: '/PersonaNacionalidad/UpdatePersonaNacionalidad'
  },
  // Endpoints de PersonaActividadEconomica
  personaActividadEconomica: {
    getByPersona: (idPersona: number) => `/PersonaActividadEconomica/GetByPersonaActividadEconomica?IdPersona=${idPersona}`,
    create: '/PersonaActividadEconomica/CreatePersonaActividadEconomica',
    update: '/PersonaActividadEconomica/UpdatePersonaActividadEconomica'
  },
  // Endpoints de TipoSangre
  tipoSangre: {
    getAll: '/TipoSangre/GetAll'
  },
  // Endpoints de Email
  email: {
    send: `${API_BASE_URL}/api/Email/SendEmail/send`,
    sendMultiple: `${API_BASE_URL}/api/Email/SendEmailMultiple/send-multiple`,
    sendWithAttachment: `${API_BASE_URL}/api/Email/SendEmailWithAttachment/send-with-attachment`
  }
};

export const STORAGE_KEYS = {
  currentUser: 'currentUser',
  token: 'authToken',
  refreshToken: 'refreshToken'
};
