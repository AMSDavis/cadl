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
    /// Dynatrace Account Information 
    /// </summary>
    public class AccountInfo 
    {
        /// <summary>
        ///  Account Id of the account this environment is linked to 
        /// </summary>
        public string AccountId { get; set; }

        /// <summary>
        ///  Region in which the account is created 
        /// </summary>
        public string RegionId { get; set; }

    }
}
