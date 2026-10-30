using System.Security.Claims;
using AMMI_Online_API.Application.Services;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AMMI_Online_API.API.Controllers.Base
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    [Authorize]
    public class ApiController : ControllerBase
    {
        private IMediator? _mediator;
        private IAdjuntosAuthorizationService? _adjuntosAuthService;

        protected IMediator Mediator => _mediator ??= HttpContext.RequestServices.GetService<IMediator>()!;

        protected IAdjuntosAuthorizationService AdjuntosAuthService =>
            _adjuntosAuthService ??= HttpContext.RequestServices.GetService<IAdjuntosAuthorizationService>()!;

        protected int CurrentPersonaId
        {
            get
            {
                var claim = User.FindFirst("idPersona")?.Value;
                return int.TryParse(claim, out var id) ? id : 0;
            }
        }

        protected IEnumerable<string> CurrentRoles =>
            User.FindAll(ClaimTypes.Role).Select(c => c.Value);
    }
}
