using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.Notas;
using MediatR;
using System;

namespace AMMI_Online_API.Application.Features.Notas.Queries;

public record GetNotaAlumnoByIdQuery(int Id) : IRequest<Response<NotasAlumnoDTO>>;

// NUEVO: Por DetalleMatricula
public record GetNotasByDetalleMatriculaQuery(int IdDetalleMatricula) 
    : IRequest<Response<IEnumerable<NotasAlumnoDTO>>>;

// NUEVO: Por Matricula + DetalleMalla (para el frontend)
public record GetNotasByMatriculaYMateriaQuery(int IdMatricula, int IdDetalleMalla) 
    : IRequest<Response<IEnumerable<NotasAlumnoDTO>>>;

[Obsolete("Usar GetNotasByDetalleMatriculaQuery en su lugar")]
public record GetNotasByMatriculaQuery(int IdMatricula) : IRequest<Response<IEnumerable<NotasAlumnoDTO>>>;

public record GetNotasByMatriculaAndPlantillaQuery(int IdMatricula, int IdPlantillaEvaluacion) : IRequest<Response<IEnumerable<NotasAlumnoDTO>>>;
public record GetBoletinQuery(int IdMatricula) : IRequest<Response<BoletinAlumnoDTO>>;
