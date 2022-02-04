using Microsoft.Cadl.ProviderHub;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Microsoft.Confluent.Service.Models
{
    /// <summary>
    /// Paged list of RP operations.
    /// </summary>
    public class OperationListResult : Pageable<Operation>
    {
    }
}
