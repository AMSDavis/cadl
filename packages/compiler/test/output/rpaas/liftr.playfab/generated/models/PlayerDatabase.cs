//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

using Microsoft.Cadl.RPaaS;
using System;
using System.Security.Policy;
using System.Collections.Generic; 

namespace Microsoft.PlayFab.Service.Models
{
    /// <summary>
    /// Details of the player database. 
    /// </summary>
    public class PlayerDatabase : TrackedResource 
    {
        /// <summary>
        ///  The resource-specific properties for this resource. 
        /// </summary>
        public PlayerDatabaseProperties Properties { get; set; }

    }
}
