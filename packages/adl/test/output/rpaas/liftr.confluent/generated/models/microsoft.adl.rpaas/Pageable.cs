using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Microsoft.Adl.RPaaS
{
    public class Pageable<T> where T: class
    {
        public IEnumerable<T> Values { get; internal set; }
        public Uri NextLink { get; }
    }
}
