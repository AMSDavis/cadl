// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Text.RegularExpressions;

namespace Microsoft.Cadl.ProviderHub.Controller
{
    /// <summary>
    /// Attribute class that provides string pattern validation on properties
    /// </summary>
    [AttributeUsage(AttributeTargets.Property)]
    public class PatternAttribute : Attribute, IValidationAttribute
    {
        Regex _regex;

        /// <summary>
        /// Initializes a new instance of the <see cref="PatternAttribute"/> class.
        /// </summary>
        /// <param name="regex">The validation regex pattern</param>
        public PatternAttribute(string regex)
        {
            Pattern = regex;
        }

        /// <summary>
        /// Regex pattern that should apply to this attribute
        /// </summary>
        public string Pattern 
        { 
            get => _regex?.ToString(); 
            set => _regex = new Regex(value);
        }

        /// <inheritdoc/>
        public bool Validate(string target)
        {
            return _regex.IsMatch(target);
        }
    }
}
