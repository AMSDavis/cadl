//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

using Microsoft.Cadl.RPaaS;
using System;
using System.Security.Policy;
using System.Collections.Generic; 

namespace Microsoft.Observability.Service.Models
{
    /// <summary>
    /// Request of a list VM Host Update Operation. 
    /// </summary>
    public class VMHostUpdateRequest    {
        /// <summary>
        ///  VM resource ID on which agent is installed/deleted 
        /// </summary>
        public VMResources[] VmResourceIds { get; set; }
        /// <summary>
        ///  Specifies the state of the operation - install/ delete. 
        /// </summary>
        public VMHostUpdateState State { get; set; }
    }
}