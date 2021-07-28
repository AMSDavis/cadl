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
    /// The updatable properties of TitleProperties 
    /// </summary>
    public class TitleUpdateProperties    {
        /// <summary>
        ///  The player database for this title 
        /// </summary>
        [Pattern(&quot;\/subscriptions\/[a-z0-9\-]+\/resourceGroups\/[^\/]+\/providers\/Microsoft\.PlayFab\/playerDatabases\/[^\/]+&quot;)]
        public string ParentDatabase { get; set; }
    }
}
