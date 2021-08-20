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
    /// The details of a DynaTrace single sign-on. 
    /// </summary>
    public class DynatraceSingleSignOnProperties    {
        /// <summary>
        ///  State of Single Sign On 
        /// </summary>
        public SingleSignOnStates SingleSignOnState { get; set; }
        /// <summary>
        ///  Version of the Dynatrace agent installed on the VM. 
        /// </summary>
        public string EnterpriseAppId { get; set; }
        /// <summary>
        ///  The login URL specific to this Dynatrace Environment 
        /// </summary>
        public string SingleSignOnUrl { get; set; }
        /// <summary>
        ///  array of Aad(azure active directory) domains 
        /// </summary>
        public string[] AadDomains { get; set; }
        /// <summary>
        ///  Provisioning state of the resource. 
        /// </summary>
        public ProvisioningState ProvisioningState { get; set; }
    }
}
