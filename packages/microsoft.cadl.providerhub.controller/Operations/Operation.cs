// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Cadl.Providerhub.Controller
{
    /// <summary>
    /// Description of an RP Operation.
    /// </summary>
    public class Operation
    {
        /// <summary>
        /// Gets the name of the operation, as per Resource-Based Access Control (RBAC). Examples: \"Microsoft.Compute/virtualMachines/write\", \"Microsoft.Compute/virtualMachines/capture/action\
        /// </summary>
        public string Name { get; internal set; }

        /// <summary>
        /// Gets or sets a value indicating whether the operation applies to data-plane. This is \"true\" for data-plane operations and \"false\" for ARM/control-plane operations.
        /// </summary>
        public bool IsDataAction {get; internal set;}

        /// <summary>
        /// Gets or sets the localized display information for this particular operation.
        /// </summary>
        public OperationDisplay Display {get; internal set;}

        /// <summary>
        /// Gets or sets the intended executor of the operation; as in Resource Based Access Control (RBAC) and audit logs UX. Default value is \"user,system\"
        /// </summary>
        public OperationOrigin Origin {get; internal set;}

        /// <summary>
        /// Gets or sets the action type. \"Internal\" refers to actions that are for internal only APIs.
        /// </summary>
        public OperationAction ActionType {get; internal set;}
    }
}
