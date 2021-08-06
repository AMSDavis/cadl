using Microsoft.Cadl.RPaaS;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Confluent.Service.Models;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;

namespace Microsoft.Confluent.Service
{
    public class OperationController : OperationControllerBase
    {
        public OperationController(ILogger<OperationControllerBase> logger) : base(logger)
        {
        }

        internal override Task<OperationListResult> OnOperationListAsync(HttpRequest request)
        {
            return Task.FromResult(new OperationListResult { Values = new[] { new Operation { Name = "GetOrganization" } } });
        }
    }
}
