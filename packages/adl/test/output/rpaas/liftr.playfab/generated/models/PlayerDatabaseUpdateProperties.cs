//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

using Microsoft.Adl.RPaaS;
using System;
using System.Security.Policy;
using System.Collections.Generic; 

namespace Microsoft.PlayFab.Service.Models
{
    /// <summary>
    /// The updatable properties of PlayerDatabaseProperties 
    /// </summary>
    public class PlayerDatabaseUpdateProperties    {
        /// <summary>
        ///  The user id for this player database 
        /// </summary>
        public string UserId { get; set; }
        /// <summary>
        ///  The set of titles belonging to this player database. 
        /// </summary>
        [Pattern(&quot;\/subscriptions\/[a-z0-9\-]+\/resourceGroups\/[^\/]+\/providers\/Microsoft\.PlayFab\/titles\/[^\/]+&quot;)]
        public string[] Titles { get; set; }
    }
}
