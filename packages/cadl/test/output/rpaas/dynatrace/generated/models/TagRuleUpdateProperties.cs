//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

using Microsoft.Cadl.RPaaS;
using System;
using System.Security.Policy;
using System.Collections.Generic; 

namespace Microsoft.Observability.Service.Models
{
    /// <summary>
    /// The updatable properties of MonitoringTagRulesProperties 
    /// </summary>
    public class TagRuleUpdateProperties    {
        /// <summary>
        ///  Set of rules for sending logs for the Monitor resource. 
        /// </summary>
        public LogRules LogRules { get; set; }
    }
}
