using System;

namespace Microsoft.Cadl.ProviderHub
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
