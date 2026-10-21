// Constantes para datos de prueba y configuración

import { environment } from '../../environments/environment';

export const API_BASE_URL = environment.apiBaseUrl;

export const API_ENDPOINTS = {
  // Endpoints de autenticación
  auth: {
    login: `${API_BASE_URL}/api/Auth/login`,
    register: `${API_BASE_URL}/api/Auth/register`,
    changePassword: `${API_BASE_URL}/api/Auth/changePassword`,
    logout: '/api/auth/logout',
    refresh: `${API_BASE_URL}/api/Auth/refresh`
  },
  // Endpoints de postulaciones
  postulaciones: {
    persona:{
      getByDocumento: (documento: string) => `/Persona/GetByPersona?Documento=${documento}`
    },
    tipoDocumento: {
      getAll: '/TipoDocumento/GetAllTipoDocumento'
    },
    estadoCivil: {
      getAll: '/EstadoCivil/GetAllEstadoCivil'
    },
    etnia: {
      getAll: '/Etnia/GetAllEtnias'
    },
    nacionalidadEtnica: {
      getAll: '/NacionalidadEtnica/GetAllNacionalidadEtnica',
      getByEtnia: (id: number) => `/NacionalidadEtnica/GetNacionalidadEtnicaByEtnia/by-etnia/${id}`
    },
    tipoDatoContacto: {
      getAll: '/TipoDatoContacto/GetAllTipoDatoContacto'
    },
    tipoOferta: {
      getAll: '/TipoOferta/GetAllTipoOferta'
    },
    genero:{
      getAll: '/Genero/GetAllGenero'
    },
    tipoActividadEconomica: {
      getAll: '/TipoActividadEconomica/GetAllTipoActividadEconomica'
    },
    tipoDiscapacidad: {
      getAll: '/TipoDiscapacidad/GetAllTipoDiscapacidad'
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
      getByProvincia: (id: number) => `/Canton/GetCantonesByProvincia/by-provincia/${id}`
    },
    parroquia: {
      getAll: '/Parroquia/GetAllParroquia',
      getByCanton: (id: number) => `/Parroquia/GetParroquiasByCanton/by-canton/${id}`
    },
    mallaRequisitos: {
      getAll: '/MallaRequisitos'
    },
    postulacion: {
      crearPostulacionExterna: '/PersonaPostulacion/CrearPostulacion/create-postulacion',
      crearPostulacionManual: '/PersonaPostulacion/CrearPostulacionManual/postulacion',
      getPostulacionBy: '/PersonaPostulacion/GetPostulacionBy',
      getAllPostulaciones: '/Postulacion'
    },
    requisitos: {
      getAll: '/Requisitos',
      getByMalla: (idMalla: number) => `/Requisitos/GetRequisitosByMalla/${idMalla}`
    },
    periodosLectivos: {
      getAll:'/PeriodoLectivo/GetPeriodosLectivos',
      post: '/PeriodoLectivo/CreatePeriodoLectivo',
      put: '/PeriodoLectivo/UpdatePeriodoLectivo',
      delete: (id: number) => `/PeriodoLectivo/DeletePeriodoLectivo/${id}`
    },
    regimen:{
      getAll:'/Regimen/GetRegimenes',
      post: '/Regimen/CreateRegimen',
      put: '/Regimen/UpdateRegimen',
      delete: (id: number) => `/Regimen/DeleteRegimen/${id}`
    },
    ciclo: {
      getAll: '/Ciclo/GetCiclo',
      post: '/Ciclo/CreateCiclo',
      put: '/Ciclo/UpdateCiclo',
      delete: (id: number) => `/Ciclo/DeleteCiclo/${id}`
    },
    paralelo: {
      getAll: '/Paralelo/GetParalelo'
    },
    malla: {
      getAll: '/Malla/GetAllMalla',
      getByTipoOferta: (idTipoOferta: number) => `/Malla/GetMallaByTipoOferta/${idTipoOferta}`
    },
    matricula: {
      getAll: '/api/Matricula',
      getById: (id: number) => `/api/Matricula/${id}`,
      getByParalelo: (idParalelo: number) => `/api/Matricula/ByParalelo/${idParalelo}`,
      getAlumnosByParalelo: (idParalelo: number) => `/api/Matricula/ByParalelo/${idParalelo}`,
      getByAlumno: (idUsuario: number) => `/api/Matricula/ByAlumno/${idUsuario}`,
      getHistorialCompleto: (idUsuario: number) => `/api/Matricula/ByAlumno/${idUsuario}/Completo`,
      getByIdConDetalle: (id: number) => `/api/Matricula/${id}/Detalle`,
      // AGREGAR nuevo endpoint
      getByParaleloYMateria: (idParalelo: number, idDetalleMalla: number) =>
        `/api/Matricula/ByParalelo/${idParalelo}/Materia/${idDetalleMalla}`,
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
      getAdjunto: (idAdjunto: number) => `/Adjuntos/${idAdjunto}`
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
      getAll: '/api/Especie/GetAllEspecie'
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
      diferirCredito: '/api/Credito/DiferirCredito/Diferir'
    },
    // Detalle de Crédito
    detalleCredito: {
      getByCredito: (idCredito: number) => `/api/DetalleCredito/GetDetalleCreditoByCredito/${idCredito}`,
      getPendientes: (idCredito: number) => `/api/DetalleCredito/GetDetallesCreditoPendientes/${idCredito}`,
      getByMatricula: (idMatricula: number) => `/api/Credito/GetDetallesCreditoByMatricula/GetDetallesCreditoByMatricula/${idMatricula}`
    },
    // Pagos
    pagoCredito: {
      crear: '/api/Pagos',
      getByCredito: (idCredito: number) => `/api/PagoCredito/GetPagosByCredito/${idCredito}`
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
    mallas:{
      getAll: '/Malla',
      create: '/Malla',
      update: '/Malla',
      delete: (id: number) => `/Malla/${id}`
    },
    tipoOferta:{
      getAll:'/TipoOferta/GetAllTipoOferta',
      create:'/TipoOferta/CreateTipoOferta',
      update:'/TipoOferta/UpdateTipoOferta',
      delete: (id: number) => `/api/TipoOferta/DeleteTipoOferta/${id}`
    },
    curso:{
      getAll:'/Cursos/GetCursos',
      create:'/Cursos/CreateCurso',
      update:'/Cursos/UpdateCurso',
      delete: (id: number) => `/api/Cursos/DeleteCurso/${id}`
    },
    materia:{
      getAll:'/Materia/GetMaterias',
      create:'/Materia/CreateMateria',
      update:'/Materia/UpdateMateria',
      delete: (id: number) => `/api/Materia/DeleteMateria/${id}`
    },
    especialidad:{
      getAll:'/Especialidad/GetEspecialidad',
      create:'/Especialidad/CreateEspecialidad',
      update:'/Especialidad/UpdateEspecialidad',
      delete: (id: number) => `/api/Especialidad/DeleteEspecialidad/${id}`
    },
    requisitos:{
      getAll:'/Requisitos',
      create:'/Requisitos',
      update:'/Requisitos',
      delete: (id: number) => `/Requisitos/${id}`
    },
    mallaRequisitos:{
      getAll:'/MallaRequisitos',
      create:'/MallaRequisitos',
      asignacionMasica:'/MallaRequisitos/AsignarRequisitos',
      delete: (id: number) => `/MallaRequisitos/${id}`
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
    create: '/Ciclo',
    update: '/Ciclo',
    delete: (id: number) => `/Ciclo/${id}`
  },
  // Endpoints de Especie
  especie: {
    getAll: '/Especie',
    create: '/Especie',
    update: '/Especie',
    delete: (id: number) => `/Especie/${id}`
  },
  // Endpoints de EspecieCiclo
  especieCiclo: {
    getAll: '/EspecieCiclo',
    create: '/EspecieCiclo',
    update: '/EspecieCiclo',
    getByCiclo: (idCiclo: number) => `/EspecieCiclo/ciclo/${idCiclo}`,
    getById: (id: number) => `/EspecieCiclo/${id}`,
    delete: (id: number) => `/EspecieCiclo/${id}`
  }
};

export const STORAGE_KEYS = {
  currentUser: 'currentUser',
  token: 'authToken',
  refreshToken: 'refreshToken'
};
