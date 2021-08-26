using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Microsoft.Cadl.RPaaS
{
    public class TrackedResource : ProxyResource
    {
        public string Location { get; internal set;}
        public IDictionary<string, string> Tags { get; internal set;}
    }

    public class TrackedResource<T> : TrackedResource where T: class
    {
        public T Properties { get; set;}
    }
}
