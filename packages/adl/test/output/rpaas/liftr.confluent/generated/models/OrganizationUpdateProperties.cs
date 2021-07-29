//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

using Microsoft.Adl.RPaaS;
using System;
using System.Security.Policy;
using System.Collections.Generic; 

namespace Microsoft.Confluent.Service.Models
{
    /// <summary>
    /// The updatable properties of OrganizationProperties 
    /// </summary>
    public class OrganizationUpdateProperties    {
        /// <summary>
        ///  UTC Time when Organization resource was created. 
        /// </summary>
        public DateTime CreatedTime { get; set; }
        /// <summary>
        ///  Id of the Confluent organization. 
        /// </summary>
        public string OrganizationId { get; set; }
        /// <summary>
        ///  Single sign-on url for the Confluent organization. 
        /// </summary>
        public string SsoUrl { get; set; }
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
