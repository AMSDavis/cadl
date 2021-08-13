//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

using Microsoft.Cadl.RPaaS;
using System;
using System.Security.Policy;
using System.Collections.Generic; 

namespace Microsoft.Confluent.Service.Models
{
    /// <summary>
    /// The updateable properties of OrganizationProperties 
    /// </summary>
    public class OrganizationUpdateProperties    {
        /// <summary>
        ///  Details of the product offering. 
        /// </summary>
        public OfferDetail OfferDetail { get; set; }
        /// <summary>
        ///  Subscriber details. 
        /// </summary>
        public UserDetail UserDetail { get; set; }
    }
}
