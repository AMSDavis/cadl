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
    /// The properties of a title. 
    /// </summary>
    public class TitleProperties 
    {
        /// <summary>
        ///  The player database for this title 
        /// </summary>
        [Pattern(@"\/subscriptions\/[a-z0-9\-]+\/resourceGroups\/[^\/]+\/providers\/Microsoft\.PlayFab\/playerDatabases\/[^\/]+")]
        public string ParentDatabase { get; set; }

    }
}
