//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

using Microsoft.Cadl.RPaaS;
using System;
using System.Security.Policy;
using System.Collections.Generic; 

namespace Microsoft.EnvelopeTest.Service.Models
{
    /// <summary>
    /// The SKU (Stock Keeping Unit) assigned to this resource. 
    /// </summary>
    public class ResourceSkuType 
    {
        /// <summary>
        ///  The name of the SKU, usually a combination of letters and numbers, for example, &#39;P3&#39; 
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        ///  The service tier for this SKU. 
        /// </summary>
        public SkuTier Tier { get; set; }

        /// <summary>
        ///  The SKU size. When the name field is the combination of tier and some other value, this would be the standalone code. 
        /// </summary>
        public int Size { get; set; }

        /// <summary>
        ///  If the service has different generations of hardware, for the same SKU, then that can be captured here. 
        /// </summary>
        public string Family { get; set; }

        /// <summary>
        ///  If the SKU supports scale out/in then the capacity integer should be included. If scale out/in is not possible for the resource this may be omitted. 
        /// </summary>
        public int Capacity { get; set; }

    }
}
