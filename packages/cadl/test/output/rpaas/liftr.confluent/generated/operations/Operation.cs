using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Microsoft.Confluent.Service.Models
{
    /// <summary>
    /// Description of an RP Operation.
    /// </summary>
    public class Operation
    {
        /// <summary>
        /// The name of the operation, as per Resource-Based Access Control (RBAC). Examples: \"Microsoft.Compute/virtualMachines/write\", \"Microsoft.Compute/virtualMachines/capture/action\
        /// </summary>
        public string Name { get; internal set; }

        /// <summary>
        /// Whether the operation applies to data-plane. This is \"true\" for data-plane operations and \"false\" for ARM/control-plane operations.
        /// </summary>
        public bool IsDataAction {get; internal set;}

        /// <summary>
        /// Localized display information for this particular operation.
        /// </summary>
        public OperationDisplay Display {get; internal set;}

        /// <summary>
        /// The intended executor of the operation; as in Resource Based Access Control (RBAC) and audit logs UX. Default value is \"user,system\"
        /// </summary>
        public OperationOrigin Origin {get; internal set;}

        /// <summary>
        /// Indicates the action type. \"Internal\" refers to actions that are for internal only APIs.
        /// </summary>
        public OperationActionType ActionType {get; internal set;}
    }
}
