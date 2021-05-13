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
    public class UserDetail
    {
    
        /// <summary>
        ///  Subscriber first name.
        /// </summary>
        [Length(50)]
        public string FirstName { get; set; }
        /// <summary>
        ///  Subscriber last name.
        /// </summary>
        [Length(50)]
        public string LastName { get; set; }
        /// <summary>
        ///  Subscriber email address.
        /// </summary>
        [Pattern("\w+\@\w+\.\w+")]
        public string EmailAddress { get; set; }
    }
}
