using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Microsoft.Cadl.RPaaS
{
    public class TrackedResource : ProxyResource
    {
        public string Location { get; set;}
        public IDictionary<string, string> Tags { get; set;} = new Dictionary<string, string>(StringComparer.InvariantCultureIgnoreCase);
    }

    public class TrackedResource<T> : TrackedResource where T: class
    {
        public T Properties { get; set;}
    }
}
