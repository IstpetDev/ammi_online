using AMMI_Online_API.API.Controllers.Base;
using AMMI_Online_API.Application.Common.Wrapper;
using AMMI_Online_API.Application.DTOs.ChatBot;
using AMMI_Online_API.Application.Features.ChatBot.Query;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AMMI_Online_API.API.Controllers.ChatBot
{
    [ApiController]
    [Route("api/[controller]")]
    [AllowAnonymous]
    public class ChatBotController : ApiController
    {
        [HttpGet("informacion-activa")]
        public async Task<ActionResult<Response<IEnumerable<ChatBotCicloDTO>>>> GetInformacionActiva(CancellationToken cancellationToken)
        {
            var result = await Mediator.Send(new GetActiveChatBotInfoQuery(), cancellationToken);
            
            if (!result.IsSuccess)
                return NotFound(result);

            return Ok(result);
        }
    }
}
