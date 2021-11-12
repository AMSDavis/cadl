// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Cadl.ProviderHubController.Common;
using System;
using System.Security.Policy;
using System.Collections.Generic; 

namespace Microsoft.Observability.Service.Models
{
    /// <summary>
    /// Dynatrace account API Key 
    /// </summary>
    public class AccountInfoSecure 
    {
        /// <summary>
        ///  Account Id of the account this environment is linked to 
        /// </summary>
        public string AccountId { get; set; }

        /// <summary>
        ///  API Key of the user account 
        /// </summary>
        public string ApiKey { get; set; }

        /// <summary>
        ///  Region in which the account is created 
        /// </summary>
        public string RegionId { get; set; }

    }
}