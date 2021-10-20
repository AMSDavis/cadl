using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Microsoft.Cadl.RPaaS
{
    public class ProxyResource
    {
        public string Id { get; set;}
        public string Name { get; set;}
        public string Type { get; set;}
    }

    public class ProxyResource<T> : ProxyResource where T: class
    {
        public T Properties { get; set;}
    }
}
