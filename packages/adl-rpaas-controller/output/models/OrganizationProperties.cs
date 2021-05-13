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
    /// Details of the subscriber.
    /// </summary>
    public class OrganizationProperties
    {
    
        /// <summary>
        ///  UTC Time when Organization resource was created.
        /// </summary>
        [Visibility("read")]
        public DateTime CreatedTime { get; set; }
        /// <summary>
        ///  The provisioning state of the resource.
        /// </summary>
        [Visibility("read")]
        public ProvisioningState? ProvisioningState { get; set; }
        /// <summary>
        ///  Id of the Confluent organization.
        /// </summary>
        [Visibility("read")]
        public string OrganizationId { get; set; }
        /// <summary>
        ///  Single sign-on url for the Confluent organization.
        /// </summary>
        [Visibility("read")]
        public Uri SsoUrl { get; set; }
        /// <summary>
        ///  Details of the product offering.
        /// </summary>
        public OfferDetail OfferDetail { get; set; }
        /// <summary>
        ///  Subscriber Details.
        /// </summary>
        public UserDetail UserDetail { get; set; }
    }
}
