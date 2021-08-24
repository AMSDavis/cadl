using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Microsoft.Cadl.RPaaS
{
    public class ProxyResource
    {
        public string Id { get; internal set;}
        public string Name { get; internal set;}
        public string Type { get; internal set;}
    }

    public class ProxyResource<T> : ProxyResource where T: class
    {
        public T Properties { get; set;}
    }
}
