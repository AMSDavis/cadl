// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Cadl.ProviderHubController.Common;
using System;
using System.Security.Policy;
using System.Collections.Generic; 

namespace Microsoft.Confluent.Service.Models
{
    /// <summary>
    /// Details of the product offering. 
    /// </summary>
    public class OfferDetail 
    {
        /// <summary>
        ///  Id of the product publisher. 
        /// </summary>
        [Length(5, 50)]
        public string PublisherId { get; set; }

        /// <summary>
        ///  Id of the product offering. 
        /// </summary>
        [Length(5, 50)]
        public string Id { get; set; }

        /// <summary>
        ///  Id of the product offer plan. 
        /// </summary>
        [Length(5, 50)]
        public string PlanId { get; set; }

        /// <summary>
        ///  Name of the product offer plan. 
        /// </summary>
        [Length(5, 50)]
        public string PlanName { get; set; }

        /// <summary>
        ///  Offer plan term unit. 
        /// </summary>
        [Length(25)]
        public string TermUnit { get; set; }

        /// <summary>
        ///  SaaS offer status. 
        /// </summary>
        public OfferStatus Status { get; set; }

    }
}
