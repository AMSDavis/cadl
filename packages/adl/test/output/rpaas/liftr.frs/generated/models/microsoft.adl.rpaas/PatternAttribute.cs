﻿using System;
using System.Text.RegularExpressions;

namespace Microsoft.Adl.RPaaS
{
    public class PatternAttribute : Attribute, IValidationAttribute
    {
        Regex _regex;

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
        public bool Validate(string target)
        {
            return _regex.IsMatch(target);
        }
    }
}
