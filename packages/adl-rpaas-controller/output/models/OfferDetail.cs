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
    public class OfferDetail
    {
    
        [Length(50)]
        public string PublisherId { get; set; }
        [Length(50)]
        public string Id { get; set; }
        [Length(50)]
        public string PlanId { get; set; }
        [Length(50)]
        public string PlanName { get; set; }
        [Length(25)]
        public string TermUnit { get; set; }
        public OfferStatus Status { get; set; }
    }
}