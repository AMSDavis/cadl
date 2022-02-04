// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;

namespace Microsoft.Cadl.ProviderHub.Controller
{
    /// <summary>
    /// Attribute class that provides length validation on properties
    /// </summary>
    [AttributeUsage(AttributeTargets.Property)]
    public class LengthAttribute : Attribute, IValidationAttribute
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="LengthAttribute"/> class.
        /// </summary>
        /// <param name="maximum">The maxixum length allowed</param>
        public LengthAttribute(int maximum)
        {
            Length = maximum;
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="LengthAttribute"/> class.
        /// </summary>
        /// <param name="minimum">The minimal length required</param>
        /// <param name="maximum">The maxixum length allowed</param>
        public LengthAttribute(int minimum, int maximum)
        {
            MinLength = minimum;
            Length = maximum;
        }

        /// <summary>
        /// Gets or sets the maxixum length allowed
        /// </summary>
        public int Length { get; set; }

        /// <summary>
        /// Gets or sets the minimum length required
        /// </summary>
        public int MinLength { get; set; }

        /// <inheritdoc/>
        public bool Validate(string target)
        {
            return target?.Length >= MinLength && target?.Length <= Length;
        }
    }
}
