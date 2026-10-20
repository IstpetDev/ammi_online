using AMMI_Online_API.Application.Common.Wrapper;
using MediatR;

namespace AMMI_Online_API.Application.Features.Person.Commands;

public class  CreateParentescoCommand : IRequest<Response<int>>
{
    public CreateParentescoItem[] Parentescos { get; set; } = Array.Empty<CreateParentescoItem>();
}
public record CreateParentescoItem
{
    public int IdParentesco { get; set; }
    public int IdPersonaOrigen { get; set; }
    public int IdPersonaDestino { get; set; }
    public int IdTipoParentesco { get; set; }
    public bool Representante { get; set; }
    public bool Tutor { get; set; }
    public bool ResponsableFinciero { get; set; }
    public bool ConviveAlumno { get; set; }
}
public record UpdateParentescoCommand(
    int IdParentesco,
    int IdPersonaOrigen,
    int IdPersonaDestino,
    int IdTipoParentesco,
    bool Representante,
    bool Tutor,
    bool ResponsableFinciero,
    bool ConviveAlumno
    ) : IRequest<Response<bool>>;
public record DeleteParentescoCommand(int IdParentesco) : IRequest<Response<bool>>;



