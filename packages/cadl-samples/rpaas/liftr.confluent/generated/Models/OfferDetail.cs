//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

using Microsoft.Cadl.RPaaS;

namespace Microsoft.Confluent.Service.Models
{
    /// <summary>
    /// Details of the product offering.
    /// </summary>
    public class OfferDetail
    {
        /// <summary>
        /// Id of the product publisher.
        /// </summary>
        [Length(50)]
        public string PublisherId { get; set; }

        /// <summary>
        /// Id of the product offering.
        /// </summary>
        [Length(50)]
        public string Id { get; set; }

        /// <summary>
        /// Id of the product offer plan.
        /// </summary>
         [Length(50)]
         public string PlanId { get; set; }

        /// <summary>
        /// Name of the product offer plan.
        /// </summary>
        [Length(50)]
        public string PlanName { get; set; }

        /// <summary>
        ///  Offer plan term unit. 
        /// </summary>
        [Length(25)]
        public string TermUnit { get; set; }
  
        /// <summary>
        /// SaaS Offer Status.
        /// </summary>
        public OfferStatus Status { get; set; }
    }
}
