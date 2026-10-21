using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.ChatBot;
using MediatR;

namespace AMMI_Online_API.Application.Features.ChatBot.Query;

public record GetActiveChatBotInfoQuery() : IRequest<Response<IEnumerable<ChatBotCicloDTO>>>;
