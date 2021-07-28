using System;

namespace Microsoft.Adl.RPaaS
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
