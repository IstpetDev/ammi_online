import { Routes, CanDeactivateFn } from '@angular/router';
import { AuthGuard } from './core/auth/auth.guard';
import { CanComponentDeactivate } from './features/menu-items/mi-postulacion/mi-postulacion.component';

export const unsavedChangesGuard: CanDeactivateFn<CanComponentDeactivate> = (component) => {
  return component.canDeactivate ? component.canDeactivate() : true;
};

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/landing-page/landing-page.component').then(m => m.LandingPageComponent)
  },
  {
    path: 'verify-email-token',
    loadComponent: () => import('./features/shared-actions/postulaciones/verify-email/verify-email.component').then(m => m.VerifyEmailComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./features/shared-actions/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./features/shared-actions/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./features/shared-actions/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
  },
  {
    path: 'cambiar-contrasenia',
    loadComponent: () => import('./features/shared-actions/auth/cambiar-contrasenia-primer-ingreso/cambiar-contrasenia-primer-ingreso.component').then(m => m.CambiarContraseniaPrimerIngresoComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'acelerado-virtual',
    loadComponent: () => import('./features/landing-page/acelerado-virtual/acelerado-virtual').then(m => m.AceleradoVirtualComponent)
  },
  {
    path: 'formal-virtual',
    loadComponent: () => import('./features/landing-page/formal-virtual/formal-virtual').then(m => m.FormalVirtualComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/roles/admin/dashboard-home.component').then(m => m.DashboardHomeComponent)
      },
      // POSTULACIONES
      {
        path: 'create-postulation-externo',
        loadComponent: () => import('./features/shared-actions/postulaciones/create-externo/create-postulation-externo.component').then(m => m.CreatePostulationExternoComponent)
      },
      {
        path: 'manage-approved',
        loadComponent: () => import('./features/shared-actions/postulaciones/manage-aproved/manage-approved.component').then(m => m.ManageApprovedComponent)
      },
      {
        path: 'postulacion/:id',
        loadComponent: () => import('./features/shared-actions/postulaciones/get-by-id/get-postulacion-by-id.component').then(m => m.GetPostulacionByidComponent)
      },
      {
        path: 'mi-postulacion',
        loadComponent: () => import('./features/menu-items/mi-postulacion/mi-postulacion.component').then(m => m.MiPostulacionComponent),
        canDeactivate: [unsavedChangesGuard]
      },
      {
        path: 'upload-requisitos',
        loadComponent: () => import('./features/shared-actions/postulaciones/get-by-id/get-postulacion-by-id.component').then(m => m.GetPostulacionByidComponent) // Temporal, crear componente específico
      },
      // MENU ITEMS
      {
        path: 'postulaciones',
        loadComponent: () => import('./features/menu-items/postulaciones/postulaciones.component').then(m => m.PostulacionesComponent),
        children: [
          {
            path: '',
            pathMatch: 'full',
            redirectTo: 'manage-postulations'
          },
          {
            path: 'manage-postulations',
            loadComponent: () => import('./features/shared-actions/postulaciones/manage/manage-postulations.component').then(m => m.ManagePostulationsComponent)
          },
          {
            path: 'create-postulation-manual',
            loadComponent: () => import('./features/shared-actions/postulaciones/create-manual/create-postulation-manual.component').then(m => m.CreatePostulationManualComponent)
          }
        ]
      },
      {
        path: 'matriculas',
        loadComponent: () => import('./features/menu-items/matrículas/matriculas.component').then(m => m.MatriculasComponent)
      },
      {
        path: 'pagos',
        loadComponent: () => import('./features/menu-items/pagos/pagos.component').then(m => m.PagosComponent)
      },
      {
        path: 'calificaciones',
        loadComponent: () => import('./features/menu-items/calificaciones/calificaciones.component').then(m => m.CalificacionesComponent),
        children: [
          {
            path: '',
            pathMatch: 'full',
            redirectTo: 'seleccion'
          },
          {
            path: 'seleccion',
            loadComponent: () => import('./features/menu-items/calificaciones/seleccion/calificaciones-seleccion.component').then(m => m.CalificacionesSeleccionComponent)
          },
          {
            path: 'ingreso/:idMallaParalelo/:idDetalleMalla',
            loadComponent: () => import('./features/menu-items/calificaciones/ingreso/calificaciones-ingreso.component').then(m => m.CalificacionesIngresoComponent)
          }
        ]
      },
      {
        path: 'mis-pagos',
        loadComponent: () => import('./features/menu-items/mis-pagos/mis-pagos.component').then(m => m.MisPagosComponent)
      },
      {
        path: 'mis-calificaciones',
        loadComponent: () => import('./features/menu-items/mis-calificaciones/mis-calificaciones.component').then(m => m.MisCalificacionesComponent)
      },
      {
        path: 'mis-materias',
        loadComponent: () => import('./features/menu-items/mis-materias/mis-materias.component').then(m => m.MisMateriasComponent)
      },
      {
        path: 'distributivo',
        loadComponent: () => import('./features/menu-items/distributivo/distributivo.component').then(m => m.DistributivoComponent)
      },
      {
        path: 'distributivo-docente',
        loadComponent: () => import('./features/menu-items/distributivo-docente/distributivo-docente').then(m => m.DistributivoDocente)
      },
      {
        path: 'parametrizacion',
        loadComponent: () => import('./features/menu-items/infraestructura/infraestructura.component').then(m => m.InfraestructuraComponent)
      },
      {
        path: 'configuraciones',
        loadComponent: () => import('./features/menu-items/configuraciones/configuraciones.component').then(m => m.ConfiguracionesComponent)
      },
      {
        path: 'reportes',
        loadComponent: () => import('./features/menu-items/reportes/reportes.component').then(m => m.ReportesComponent)
      },
      {
        path: 'seasons',
        loadComponent: () => import('./features/shared-actions/settings/seasons/seasons.component').then(m => m.SeasonsComponent),
        children: [
          {
            path: 'periodos',
            loadComponent: () => import('./features/shared-actions/settings/seasons/periodos/periodos.component').then(m => m.PeriodosComponent)
          },
          {
            path: 'regimenes',
            loadComponent: () => import('./features/shared-actions/settings/seasons/regimenes/regimenes.component').then(m => m.RegimenesComponent)
          },
          {
            path: 'ciclos',
            loadComponent: () => import('./features/shared-actions/settings/seasons/ciclos/ciclos.component').then(m => m.CiclosComponent)
          },
          {
            path: '',
            redirectTo: 'periodos',
            pathMatch: 'full'
          }
        ]
      },
      {
        path: 'species',
        loadComponent: () => import('./features/shared-actions/settings/species/species.component').then(m => m.SpeciesComponent)
      },
      {
        path: 'modules-permissions',
        loadComponent: () => import('./features/shared-actions/global-settings/modules-permissions/modules-permissions.component').then(m => m.ModulesPermissionsComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./features/shared-actions/global-settings/persona/persona.component').then(m => m.PersonaComponent)
      },
      {
        path: 'study-areas',
        loadComponent: () => import('./features/shared-actions/settings/study-areas/study-areas.component').then(m => m.StudyAreasComponent)
      },
      {
        path: 'grades',
        loadComponent: () => import('./features/shared-actions/settings/grades/grades.component').then(m => m.GradesComponent)
      },
      {
        path: 'teaching',
        loadComponent: () => import('./features/shared-actions/settings/teaching/teaching.component').then(m => m.TeachingComponent)
      },
      {
        path: 'cyclic-configurations',
        loadComponent: () => import('./features/shared-actions/global-settings/cyclic-configurations/cyclic-configurations.component').then(m => m.CyclicConfigurationsComponent)
      },
      {
        path: 'crear-malla-completa',
        loadComponent: () => import('./features/shared-actions/settings/mallas/crear-malla-completa/crear-malla-completa.component').then(m => m.CrearMallaCompletaComponent)
      },
      {
        path: 'planificacion',
        loadComponent: () => import('./features/shared-actions/settings/mallas/materias/materias.component').then(m => m.MateriasComponent)
      },
      {
        path: 'requisitos',
        loadComponent: () => import('./features/shared-actions/settings/mallas/requisitos/requisitos.component').then(m => m.RequisitosComponent)
      },
      {
        path: 'historial-pagos',
        loadComponent: () => import('./features/menu-items/historial-pagos/historial-pagos.component').then(m => m.HistorialPagosComponent)
      },
      {
        path: 'historial-por-alumno',
        loadComponent: () => import('./features/menu-items/historial-por-alumno/historial-por-alumno.component').then(m => m.HistorialPorAlumnoComponent)
      },
      {
        path: 'crear-curso-rapido',
        loadComponent: () => import('./features/shared-actions/settings/crear-curso-rapido/crear-curso-rapido.component').then(m => m.CrearCursoRapidoComponent)
      },
      {
        path: 'apertura-ciclo',
        loadComponent: () => import('./features/shared-actions/global-settings/cyclic-configurations/apertura-ciclo/apertura-ciclo.component').then(m => m.AperturaCicloComponent)
      },
      {
        path: 're-matriculacion',
        loadComponent: () => import('./features/shared-actions/postulaciones/re-matriculacion/re-matriculacion.component').then(m => m.ReMatriculacionComponent)
      },
      {
        path: 'configurar-cursos-postulacion',
        loadComponent: () => import('./features/shared-actions/settings/configurar-cursos-postulacion/configurar-cursos-postulacion.component').then(m => m.ConfigurarCursosPostulacionComponent)
      }
    ]
  },
  {
    path: '',
    redirectTo: '',
    pathMatch: 'full'
  }
];

