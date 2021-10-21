using Microsoft.Cadl.RPaaS;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Microsoft.FluidRelay.Service.Models
{
    /// <summary>
    /// Paged list of RP operations.
    /// </summary>
    public class OperationListResult : Pageable<Operation>
    {
    }
}
