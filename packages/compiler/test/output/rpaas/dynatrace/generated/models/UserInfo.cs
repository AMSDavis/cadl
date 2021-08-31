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
    /// User info. 
    /// </summary>
    public class UserInfo 
    {
        /// <summary>
        ///  First Name of the user 
        /// </summary>
        [Length(50)]
        public string FirstName { get; set; }

        /// <summary>
        ///  Last Name of the user 
        /// </summary>
        [Length(50)]
        public string LastName { get; set; }

        /// <summary>
        ///  Email of the user used by Dynatrace for contacting them if needed 
        /// </summary>
        [Pattern(&quot;^[A-Za-z0-9._%+-]+@(?:[A-Za-z0-9-]+\.)+[A-Za-z]{2,}$&quot;)]
        public string EmailAddress { get; set; }

        /// <summary>
        ///  Phone number of the user used by Dynatrace for contacting them if needed 
        /// </summary>
        [Length(40)]
        public string PhoneNumber { get; set; }

        /// <summary>
        ///  Country of the user 
        /// </summary>
        public string Country { get; set; }

    }
}
