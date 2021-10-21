// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Cadl.ProviderHubController.Common;
using System;
using System.Security.Policy;
using System.Collections.Generic; 

namespace Microsoft.EnvelopeTest.Service.Models
{
    /// <summary>
    /// Details of the resource plan. 
    /// </summary>
    public class ResourcePlanType 
    {
        /// <summary>
        ///  A user defined name of the 3rd Party Artifact that is being procured. 
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        ///  The publisher of the 3rd Party Artifact that is being bought. E.g. NewRelic 
        /// </summary>
        public string Publisher { get; set; }

        /// <summary>
        ///  The 3rd Party artifact that is being procured. E.g. NewRelic. Product maps to the OfferID specified for the artifact at the time of Data Market onboarding.  
        /// </summary>
        public string Product { get; set; }

        /// <summary>
        ///  A publisher provided promotion code as provisioned in Data Market for the said product/artifact. 
        /// </summary>
        public string PromotionCode { get; set; }

        /// <summary>
        ///  The version of the desired product/artifact. 
        /// </summary>
        public string Version { get; set; }

    }
}
