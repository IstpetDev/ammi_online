using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Postulations;
using MediatR;
using System.Collections.Generic;

namespace AMMI_Online_API.Application.Features.Postulation.Queries;

// NUEVO: Por Matricula y Materia
public record GetDetalleMatriculaByMatriculaYMateriaQuery(int IdMatricula, int IdDetalleMalla)
    : IRequest<Response<DetalleMatriculaConAlumnoDTO>>;

// NUEVO: Por MallaParalelo y Materia
public record GetDetallesMatriculaByMallaParaleloYMateriaQuery(int IdMallaParalelo, int IdDetalleMalla)
    : IRequest<Response<IEnumerable<DetalleMatriculaConAlumnoDTO>>>;
