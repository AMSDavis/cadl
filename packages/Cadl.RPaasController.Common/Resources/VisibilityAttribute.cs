// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;

namespace Cadl.RPaasController.Common
{
    /// <summary>
    /// Attribute class that provides property visibility 
    /// </summary>
    [AttributeUsage(AttributeTargets.Property)]
    public class VisibilityAttribute : Attribute
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="VisibilityAttribute"/> class.
        /// </summary>
        /// <param name="level">The visibility level</param>
        public VisibilityAttribute(string level)
        {
            Level = level;
        }

        /// <summary>
        /// Gets or sets property visiblity level
        /// </summary>
        public string Level { get; set; }
    }
}
