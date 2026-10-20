import { Routes } from '@angular/router';
import { LandingPageComponent } from './features/landing-page/landing-page.component';
import { LoginComponent } from './features/shared-actions/auth/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { DashboardHomeComponent } from './features/roles/admin/dashboard-home.component';
import { AuthGuard } from './core/auth/auth.guard';
import { CreatePostulationExternoComponent } from './features/shared-actions/postulaciones/create-externo/create-postulation-externo.component';
import { ManagePostulationsComponent } from './features/shared-actions/postulaciones/manage/manage-postulations.component';
import { GetPostulacionByidComponent } from './features/shared-actions/postulaciones/get-by-id/get-postulacion-by-id.component';
import { AceleradoVirtualComponent } from './features/landing-page/acelerado-virtual/acelerado-virtual';
import { FormalVirtualComponent } from './features/landing-page/formal-virtual/formal-virtual';
import { CreatePostulationManualComponent } from './features/shared-actions/postulaciones/create-manual/create-postulation-manual.component';
import { PostulacionesComponent } from './features/menu-items/postulaciones/postulaciones.component';
import { MatriculasComponent } from './features/menu-items/matrículas/matriculas.component';
import { PagosComponent } from './features/menu-items/pagos/pagos.component';
import { CalificacionesComponent } from './features/menu-items/calificaciones/calificaciones.component';
import { MisPagosComponent } from './features/menu-items/mis-pagos/mis-pagos.component';
import { MisCalificacionesComponent } from './features/menu-items/mis-calificaciones/mis-calificaciones.component';
import { DistributivoComponent } from './features/menu-items/distributivo/distributivo.component';
import { DistributivoDocente } from './features/menu-items/distributivo-docente/distributivo-docente';
import { InfraestructuraComponent } from './features/menu-items/infraestructura/infraestructura.component';
import { ConfiguracionesComponent } from './features/menu-items/configuraciones/configuraciones.component';
import { MiPostulacionComponent } from './features/menu-items/mi-postulacion/mi-postulacion.component';
import { ManageApprovedComponent } from './features/shared-actions/postulaciones/manage-aproved/manage-approved.component';
import { SeasonsComponent } from './features/shared-actions/settings/seasons/seasons.component';
import { SpeciesComponent } from './features/shared-actions/settings/species/species.component';
import { ModulesPermissionsComponent } from './features/shared-actions/global-settings/modules-permissions/modules-permissions.component';
import { PersonaComponent } from './features/shared-actions/global-settings/persona/persona.component';
import { StudyAreasComponent } from './features/shared-actions/settings/study-areas/study-areas.component';
import { PeriodosComponent } from './features/shared-actions/settings/seasons/periodos/periodos.component';
import { RegimenesComponent } from './features/shared-actions/settings/seasons/regimenes/regimenes.component';
import { CiclosComponent } from './features/shared-actions/settings/seasons/ciclos/ciclos.component';
import { MallasComponent } from './features/shared-actions/settings/mallas/mallas.component';
import { GradesComponent } from './features/shared-actions/settings/grades/grades.component';
import { TeachingComponent } from './features/shared-actions/settings/teaching/teaching.component';
import { CyclicConfigurationsComponent } from './features/shared-actions/settings/cyclic-configurations/cyclic-configurations.component';
import { EspecieCicloComponent } from './features/shared-actions/settings/especie-ciclo/especie-ciclo.component';
export const routes: Routes = [
  {
    path: '',
    component: LandingPageComponent
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'acelerado-virtual',
    component: AceleradoVirtualComponent
  },
  {
    path: 'formal-virtual',
    component: FormalVirtualComponent
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        component: DashboardHomeComponent
      },
      // POSTULACIONES
      {
        path: 'create-postulation-externo',
        component: CreatePostulationExternoComponent
      },
      {
        path: 'create-postulation-manual',
        component: CreatePostulationManualComponent
      },
      {
        path: 'manage-postulations',
        component: ManagePostulationsComponent
      },
      {
        path: 'manage-approved',
        component: ManageApprovedComponent
      },
      {
        path: 'postulacion/:id',
        component: GetPostulacionByidComponent
      },
      {
        path: 'mi-postulacion',
        component: MiPostulacionComponent
      },
      {
        path: 'upload-requisitos',
        component: GetPostulacionByidComponent // Temporal, crear componente específico
      },
      // MENU ITEMS
      {
        path: 'postulaciones',
        component: PostulacionesComponent
      },
      {
        path: 'matriculas',
        component: MatriculasComponent
      },
      {
        path: 'pagos',
        component: PagosComponent
      },
      {
        path: 'calificaciones',
        component: CalificacionesComponent
      },
      {
        path: 'mis-pagos',
        component: MisPagosComponent
      },
      {
        path: 'mis-calificaciones',
        component: MisCalificacionesComponent
      },
      {
        path: 'distributivo',
        component: DistributivoComponent
      },
      {
        path: 'distributivo-docente',
        component: DistributivoDocente
      },
      {
        path: 'infraestructura',
        component: InfraestructuraComponent
      },
      {
        path: 'configuraciones',
        component: ConfiguracionesComponent
      },
      {
        path: 'seasons',
        component: SeasonsComponent,
        children: [
          {
            path: 'periodos',
            component: PeriodosComponent
          },
          {
            path: 'regimenes',
            component: RegimenesComponent
          },
          {
            path: 'ciclos',
            component: CiclosComponent
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
        component: SpeciesComponent
      },
      {
        path: 'modules-permissions',
        component: ModulesPermissionsComponent
      },
      {
        path: 'users',
        component: PersonaComponent
      },
      {
        path: 'study-areas',
        component: StudyAreasComponent
      },
      {
        path: 'grades',
        component: GradesComponent
      },
      {
        path: 'teaching',
        component: TeachingComponent
      },
      {
        path: 'cyclic-configurations',
        component: CyclicConfigurationsComponent,
        children: [
          {
            path: 'species-cycle',
            component: EspecieCicloComponent
          },
          {
            path: 'mallas',
            component: MallasComponent
          },
          {
            path: '',
            redirectTo: 'species-cycle',
            pathMatch: 'full'
          }
        ]
      },
    
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
  
];

