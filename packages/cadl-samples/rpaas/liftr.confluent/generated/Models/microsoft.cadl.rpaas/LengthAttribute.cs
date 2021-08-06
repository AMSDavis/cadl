using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Microsoft.Cadl.RPaaS
{
    [AttributeUsage(AttributeTargets.Property)]
    public class LengthAttribute : Attribute, IValidationAttribute
    {
        public LengthAttribute(int length)
        {
            Length = length;
        }

        public LengthAttribute(int minimum, int maximum)
        {
            MinLength = minimum;
            Length = maximum;
        }

        public int Length { get; set; }

        public int MinLength { get; set; } = 0;

        public bool Validate(string target)
        {
            return target?.Length >= MinLength && target?.Length <= Length;
        }
    }
}
