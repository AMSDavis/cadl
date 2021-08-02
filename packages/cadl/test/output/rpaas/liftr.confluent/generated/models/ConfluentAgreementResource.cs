//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

using Microsoft.Cadl.RPaaS;
using System;
using System.Security.Policy;
using System.Collections.Generic; 

namespace Microsoft.Confluent.Service.Models
{
    public class ConfluentAgreementResource    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string Type { get; set; }
        public ConfluentAgreementResourceProperties Properties { get; set; }
    }
}
