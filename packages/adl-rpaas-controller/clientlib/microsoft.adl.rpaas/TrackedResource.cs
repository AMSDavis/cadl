using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Microsoft.Adl.RPaaS
{
    public class TrackedResource
    {
        public string Id { get; internal set; }
        public string Location { get; }
        public IDictionary<string, string> Tags { get; }
    }
}
