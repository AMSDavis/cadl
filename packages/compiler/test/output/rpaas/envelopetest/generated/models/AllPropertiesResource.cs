//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

using Microsoft.Cadl.RPaaS;
using System;
using System.Security.Policy;
using System.Collections.Generic; 

namespace Microsoft.EnvelopeTest.Service.Models
{
    /// <summary>
    /// Concrete tracked resource types can be created by aliasing this type using a specific property type. 
    /// </summary>
    public class AllPropertiesResource : TrackedResource 
    {
        /// <summary>
        ///  The resource-specific properties for this resource. 
        /// </summary>
        public AllPropertiesProperties Properties { get; set; }

        /// <summary>
        ///  If eTag is provided in the response body, it may also be provided as a header per the normal etag convention.  Entity tags are used for comparing two or more entities from the same requested resource. HTTP/1.1 uses entity tags in the etag (section 14.19), If-Match (section 14.24), If-None-Match (section 14.26), and If-Range (section 14.27) header fields. 
        /// </summary>
        public string ETag { get; set; }

        /// <summary>
        ///  The fully qualified resource ID of the resource that manages this resource. Indicates if this resource is managed by another Azure resource. If this is present, complete mode deployment will not delete the resource if it is removed from the template since it is managed by another resource. 
        /// </summary>
        public string ManagedBy { get; set; }

        /// <summary>
        ///  Metadata used by portal/tooling/etc to render different UX experiences for resources of the same type; e.g. ApiApps are a kind of Microsoft.Web/sites type.  If supported, the resource provider must validate and persist this value. 
        /// </summary>
        [Pattern(@"^[-\w\._,\(\\\)]+$")]
        public string Kind { get; set; }

        /// <summary>
        ///  Details of the resource plan. 
        /// </summary>
        public ResourcePlanType Plan { get; set; }

        /// <summary>
        ///  The SKU (Stock Keeping Unit) assigned to this resource. 
        /// </summary>
        public ResourceSkuType Sku { get; set; }

        /// <summary>
        ///  The managed service identities assigned to this resource. 
        /// </summary>
        public ManagedIdentityProperties Identity { get; set; }

    }
}
