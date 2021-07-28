using System;

namespace Microsoft.Adl.RPaaS
{
    public interface IValidationAttribute
    {
        /// <summary>
        /// Perform the implemented validation over the target.
        /// </summary>
        /// <returns>true if validation succeeds, false otherwise.</returns>
        bool Validate(string target);
    }
}
