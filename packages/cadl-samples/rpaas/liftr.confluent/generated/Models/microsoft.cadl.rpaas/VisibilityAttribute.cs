using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Microsoft.Cadl.RPaaS
{
    [AttributeUsage(AttributeTargets.Property)]
    public class VisibilityAttribute : Attribute
    {
        public VisibilityAttribute(string level)
        {
            Level = level;
        }
        public string Level { get; set; }
    }
}
