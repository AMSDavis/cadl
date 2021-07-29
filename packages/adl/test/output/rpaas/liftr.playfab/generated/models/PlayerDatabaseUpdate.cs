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
    /// The updatable properties of the PlayerDatabase. 
    /// </summary>
    public class PlayerDatabaseUpdate    {
        /// <summary>
        ///  Resource tags. 
        /// </summary>
        public IDictionary<string, string> Tags { get; set; }
        /// <summary>
        ///  The updatable properties of PlayerDatabaseProperties 
        /// </summary>
        public PlayerDatabaseUpdateProperties Properties { get; set; }
    }
}
