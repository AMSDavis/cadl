// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;

namespace Microsoft.Cadl.ProviderHub.Controller
{

    /// <summary>
    /// The attribute class to decorate class with deserialization discriminator info.
    /// </summary>
    [AttributeUsage(AttributeTargets.Class)]
    public class DiscriminatorAttribute : Attribute
    {
        public DiscriminatorAttribute(string fieldName, string value)
        {
            FieldName = fieldName;
            Value = value;
        }

        /// <summary>
        /// Gets or sets the field name used for discriminator .
        /// </summary>
        public string FieldName { get; set; }

        /// <summary>
        /// Gets or sets the discriminator value for the class. For base class
        /// </summary>
        public string Value { get; set; }
    }
}
