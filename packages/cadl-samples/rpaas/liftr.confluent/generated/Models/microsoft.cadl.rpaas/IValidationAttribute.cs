using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Microsoft.Cadl.RPaaS
{
    public interface IValidationAttribute
    {
        /// <summary>
        /// 
        /// </summary>
        /// <returns></returns>
        bool Validate(string target);
    }
}
