﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Microsoft.Cadl.ProviderHub
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