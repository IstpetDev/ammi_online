using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.ChatBot;
using AMMI_Online_API.Application.Features.ChatBot.Query;
using AMMI_Online_API.Domain.Interfaces.ChatBot;
using MediatR;

namespace AMMI_Online_API.Application.Features.ChatBot.Handler;

public class ChatBotHandler : IRequestHandler<GetActiveChatBotInfoQuery, Response<IEnumerable<ChatBotCicloDTO>>>
{
    private readonly IChatBotRepository _repository;

    public ChatBotHandler(IChatBotRepository repository)
    {
        _repository = repository;
    }

    public async Task<Response<IEnumerable<ChatBotCicloDTO>>> Handle(GetActiveChatBotInfoQuery request, CancellationToken cancellationToken)
    {
        var fechaActual = DateOnly.FromDateTime(DateTime.Now);
        var ciclos = await _repository.GetActiveInformationAsync(fechaActual, cancellationToken);

        if (!ciclos.Any())
            return Response<IEnumerable<ChatBotCicloDTO>>.Failure("No se encontró información activa para la fecha actual.");

        var result = ciclos.Select(c => new ChatBotCicloDTO
        {
            TipoOferta = c.IdTipoOfertaNavigation?.Detalle ?? string.Empty,
            PeriodoLectivo = c.IdPeriodoNavigation?.Detalle ?? string.Empty,
            DetalleCiclo = c.Detalle,
            EsActivo = c.EsActivo,
            Mallas = c.Malla.Select(m => new ChatBotMallaDTO
            {
                MallaDetalle = m.Detalle,
                CursoDetalle = m.IdCursosNavigation?.Detalle ?? string.Empty,
                Requisitos = m.MallaRequisitos.Select(mr => new ChatBotRequisitoDTO
                {
                    Detalle = mr.IdRequisitosNavigation?.Detalle ?? string.Empty,
                    EsObligatorio = mr.IdRequisitosNavigation?.EsObligatorio ?? false
                }),
                CostosMatricula = m.EspecieCiclo
                    .Where(ec => ec.IdEspecieNavigation.EsMatricula)
                    .Select(ec => new ChatBotCostoMatriculaDTO
                    {
                        CostoMatricula = ec.ValorEspecie,
                        EsDiferible = ec.IdEspecieNavigation.EsPension // Es diferible si es pensión
                    }),
                CostosPension = m.EspecieCiclo
                    .Where(ec => ec.IdEspecieNavigation.EsPension)
                    .Select(ec => new ChatBotCostoPensionDTO
                    {
                        CostoPension = ec.ValorEspecie,
                        EsDiferible = ec.IdEspecieNavigation.EsPension // Es diferible si es pensión
                    })
            })
        });

        return Response<IEnumerable<ChatBotCicloDTO>>.Success(result, "Información activa consultada exitosamente");
    }
}
