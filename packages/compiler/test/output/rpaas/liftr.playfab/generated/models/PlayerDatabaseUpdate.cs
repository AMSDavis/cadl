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
    /// The updatable properties of the PlayerDatabase. 
    /// </summary>
    public class PlayerDatabaseUpdate 
    {
        /// <summary>
        ///  Resource tags. 
        /// </summary>
        public IDictionary<string, string> Tags { get; set; }

        /// <summary>
        ///  The user id for this player database 
        /// </summary>
        public string UserId { get; set; }

        /// <summary>
        ///  The set of titles belonging to this player database. 
        /// </summary>
        [Pattern(@"\/subscriptions\/[a-z0-9\-]+\/resourceGroups\/[^\/]+\/providers\/Microsoft\.PlayFab\/titles\/[^\/]+")]
        public string[] Titles { get; set; }

    }
}
