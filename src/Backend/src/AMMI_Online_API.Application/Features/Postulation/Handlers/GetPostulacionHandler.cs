using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Postulations;
using AMMI_Online_API.Application.Features.Postulation.Queries;
using AMMI_Online_API.Domain.Entities;
using AMMI_Online_API.Domain.Interfaces.Postulations;
using MediatR;

namespace AMMI_Online_API.Application.Features.Postulation.Handlers;

public class GetPostulacionHandler : IRequestHandler<GetPersonaPostulacionQuery, Response<PaginatedResult<PersonaPostulacionDTO>>>
{
    private readonly IPersonaPostulacion _postulationRepository;

    public GetPostulacionHandler(IPersonaPostulacion postulationRepository)
    {
        _postulationRepository = postulationRepository;
    }

    public async Task<Response<PaginatedResult<PersonaPostulacionDTO>>> Handle(
        GetPersonaPostulacionQuery query,
        CancellationToken cancellationToken)
    {
        var totalCount = await _postulationRepository.CountAsync(
            query.Documento,
            query.IdCiclo,
            query.IdMalla,
            query.IdOferta,
            cancellationToken);

        var postulaciones = await _postulationRepository.FindPagedAsync(
            query.Documento,
            query.IdCiclo,
            query.IdMalla,
            query.IdOferta,
            query.PageNumber,
            query.PageSize,
            cancellationToken);

        if (query.ExcludeContactoPersona)
        {
            const int IdEstadoContactoPersona = 8;
            postulaciones = postulaciones.Where(p => p.IdTipoEstadoAprobacion != IdEstadoContactoPersona).ToList();
            totalCount = postulaciones.Count();
        }

        var postulacionesDTO = postulaciones.Select(p => new PersonaPostulacionDTO
        {
            IdPostulacion = p.IdPostulacion,
            IdPersona = p.IdPersona,
            ObservacionesRevision = p.ObservacionesRevision,
            EsPostulacionRapida = p.EsPostulacionRapida,
            ObservacionesPostulante = p.ObservacionesPostulante,
            FechaPostulacion = p.FechaPostulacion,
            personasimple = MapPersona(p.IdPersonaNavigation),
            tipoestadoaprobacion = p.IdTipoEstadoAprobacionNavigation != null
                ? new TipoEstadoAprobacionSimp
                {
                    Detalle = p.IdTipoEstadoAprobacionNavigation.Detalle
                }
                : null,
            malla = p.IdMallaNavigation != null ? MapMalla(p.IdMallaNavigation) : null
        }).ToList();

        var result = new PaginatedResult<PersonaPostulacionDTO>(postulacionesDTO, totalCount, query.PageNumber, query.PageSize);
        return Response<PaginatedResult<PersonaPostulacionDTO>>.Success(result, "Consulta exitosa");
    }

    private PersonaSimp MapPersona(Persona persona)
    {
        if (persona == null) return null;

        return new PersonaSimp
        {
            Documento = persona.Documento,
            PrimerNombre = persona.PrimerNombre,
            SegundoNombre = persona.SegundoNombre,
            PrimerApellido = persona.PrimerApellido,
            SegundoApellido = persona.SegundoApellido,

            // Mapeo de Genero
            generosimple = persona.IdGeneroNavigation != null ? new GeneroSimp
            {
                Nombre = persona.IdGeneroNavigation.Nombre
            } : null,

            // Mapeo de Discapacidad (tomando la primera si hay varias)
            pdiscapacidad = persona.PersonaDiscapacidad?.FirstOrDefault() != null
                ? MapPersonaDiscapacidad(persona.PersonaDiscapacidad.FirstOrDefault())
                : null,

            // Mapeo de Actividad Económica (tomando la principal o la primera)
            pactividadeconomica = persona.PersonaActividadEconomica?.FirstOrDefault(a => a.EsPrincipal) != null
                ? MapPersonaActividadEconomica(persona.PersonaActividadEconomica.FirstOrDefault(a => a.EsPrincipal))
                : persona.PersonaActividadEconomica?.FirstOrDefault() != null
                    ? MapPersonaActividadEconomica(persona.PersonaActividadEconomica.FirstOrDefault())
                    : null,

            // Mapeo de Contactos (todos)
            pcontacto = persona.DatosContacto != null
                ? persona.DatosContacto.Select(c => MapPersonaContacto(c)).ToList()
                : new List<PersonaContactoSimp>(),

            // Mapeo de Documentos Personales (lista)
            // Mapeo de Documentos Personales (lista)
            pdocumentos = null,

            // Mapeo de Dirección (tomando la primera)
            pdireccion = persona.PersonaDireccion?.FirstOrDefault() != null
                ? MapPersonaDireccion(persona.PersonaDireccion.FirstOrDefault())
                : null,

            // Mapeo de Información Personal
            pinfo = persona.PersonaInfo != null
                ? MapPersonaInformacion(persona.PersonaInfo)
                : null
        };
    }

    private PersonaDiscapacidadSimp MapPersonaDiscapacidad(PersonaDiscapacidad discapacidad)
    {
        if (discapacidad == null) return null;

        return new PersonaDiscapacidadSimp
        {
            Porcentaje = discapacidad.Porcentaje,
            Recomendaciones = discapacidad.Recomendaciones,
            tipodiscpacidad = discapacidad.IdTipoDiscapacidadNavigation != null ? new TipoDiscapacdidadSimp
            {
                Nombre = discapacidad.IdTipoDiscapacidadNavigation.Nombre,
                Recomendaciones = discapacidad.IdTipoDiscapacidadNavigation.Recomendaciones
            } : null,
            pathdiscapacidad = !string.IsNullOrEmpty(discapacidad.IdAdjuntoNavigation.Path)
                ? new AdjuntoSimp { Path = discapacidad.IdAdjuntoNavigation.Path }
                : null
        };
    }

    private PersonaActividadEconomicaSimp MapPersonaActividadEconomica(PersonaActividadEconomica actividad)
    {
        if (actividad == null) return null;

        return new PersonaActividadEconomicaSimp
        {
            Valor = actividad.Valor,
            EsPrincipal = actividad.EsPrincipal,
            tipoactividad = actividad.IdTipoActividadEconomicaNavigation != null
                ? new TipoActividadEconomicaSimp
                {
                    Nombre = actividad.IdTipoActividadEconomicaNavigation.Nombre
                }
                : null
        };
    }

    private PersonaContactoSimp MapPersonaContacto(DatosContacto contacto)
    {
        if (contacto == null) return null;

        return new PersonaContactoSimp
        {
            IdDatosContacto = contacto.IdDatosContacto,
            IdTipoDatoContacto = contacto.IdTipoDatoContacto,
            EsPrincipal = contacto.EsPrincipal,
            Detalle = contacto.Detalle,
            tipocontacto = contacto.IdTipoDatoContactoNavigation != null ? new TipoContactoSimp
            {
                IdTipoDatoContacto = contacto.IdTipoDatoContactoNavigation.IdTipoDatoContacto,
                Detalle = contacto.IdTipoDatoContactoNavigation.Detalle
            } : new TipoContactoSimp
            {
                IdTipoDatoContacto = contacto.IdTipoDatoContacto
            }
        };
    }

    private PersonaDocumentosSimp MapPersonaDocumentos(DocumentosPersonales documento)
    {
        if (documento == null) return null;

        return new PersonaDocumentosSimp
        {
            tipodocumentopersonal = documento.IdTipoDocumentoPersonalNavigation != null ? new TipoDocumentoPersonalSimp
            {
                Detalle = documento.IdTipoDocumentoPersonalNavigation.Detalle
            } : null,
            pathDocumento = !string.IsNullOrEmpty(documento.IdAdjuntoNavigation.Path)
                ? new AdjuntoSimp { Path = documento.IdAdjuntoNavigation.Path }
                : null,
            CodigoRequisito = documento.CodigoRequisito,
            Estado = documento.Estado,
            Observacion = documento.Observacion
        };
    }

    private PersonaDireccionSimp MapPersonaDireccion(PersonaDireccion direccion)
    {
        if (direccion == null) return null;

        return new PersonaDireccionSimp
        {
            DireccionDomiciliaria = direccion.DireccionDomiciliaria
        };
    }

    private PersonaInformacionSimp MapPersonaInformacion(PersonaInfo info)
    {
        if (info == null) return null;

        return new PersonaInformacionSimp
        {
            FechaNacimiento = info.FechaNacimiento,
            estadocivil = info.IdEstadoCivilNavigation != null ? new EstadoCivilSimp
            {
                Nombre = info.IdEstadoCivilNavigation.Nombre
            } : null,
            nacionalidadetnica = info.IdNacionalidadEtnicaNavigation != null
                ? MapNacionalidad(info.IdNacionalidadEtnicaNavigation)
                : null
        };
    }

    private NacionalidadSimp MapNacionalidad(NacionalidadEtnica nacionalidad)
    {
        if (nacionalidad == null) return null;

        return new NacionalidadSimp
        {
            Nombre = nacionalidad.Nombre,
            etnia = nacionalidad.IdEtniaNavigation != null ? new EtniaSimp
            {
                Nombre = nacionalidad.IdEtniaNavigation.Nombre
            } : null
        };
    }

    private MallaSimp MapMalla(Malla malla)
    {
        if (malla == null) return null;

        return new MallaSimp
        {
            IdMalla = malla.IdMalla,
            Detalle = malla.Detalle,
            curso = malla.IdCursosNavigation != null ? new CursosSimp
            {
                Detalle = malla.IdCursosNavigation.Detalle
            } : null,
            mallaCiclo = malla.IdCicloNavigation != null ? new MallaCicloSimp
            {
                Ciclo = new CicloSimp
                {
                    Detalle = malla.IdCicloNavigation.Detalle,
                    FechaInicioEstimada = malla.IdCicloNavigation.FechaInicioEstimada,
                    FechaFinEstimada = malla.IdCicloNavigation.FechaFinEstimada,
                    periodo = malla.IdCicloNavigation.IdPeriodoNavigation != null ? new PeriodoSimp
                    {
                        Detalle = malla.IdCicloNavigation.IdPeriodoNavigation.Detalle
                    } : null,
                    regimen = malla.IdCicloNavigation.IdRegimenNavigation != null ? new RegimenSimp
                    {
                        Detalle = malla.IdCicloNavigation.IdRegimenNavigation.Detalle
                    } : null
                }
            } : null
        };
    }
}