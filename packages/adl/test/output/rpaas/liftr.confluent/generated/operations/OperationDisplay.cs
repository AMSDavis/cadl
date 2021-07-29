using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Microsoft.Confluent.Service.Models
{
    /// <summary>
    /// Localized display information for this particular operation.
    /// </summary>
    public class OperationDisplay
    {
        /// <summary>
        /// The localized friendly form of the resource provider name, e.g. \"Microsoft Monitoring Insights\" or \"Microsoft Compute\".
        /// </summary>
        public string Provider { get; internal set; }

        /// <summary>
        /// The localized friendly name of the resource type related to this operation. E.g. \"Virtual Machines\" or \"Job Schedule Collections\".
        /// </summary>
        public string Resource {get; internal set;}

        /// <summary>
        /// The concise, localized friendly name for the operation; suitable for dropdowns. E.g. \"Create or Update Virtual Machine\", \"Restart Virtual Machine\".
        /// </summary>
        public string Operation {get; internal set;}

        /// <summary>
        /// The short, localized friendly description of the operation; suitable for tool tips and detailed views.
        /// </summary>
        public string Description {get; internal set;}
    }
}
