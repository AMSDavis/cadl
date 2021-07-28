using System;

namespace Microsoft.Adl.RPaaS
{
    public interface IValidationAttribute
    {
        /// <summary>
        /// Perform the implemented validation over the target.
        /// </summary>
        /// <returns></returns>
        bool Validate(string target);
    }
}
