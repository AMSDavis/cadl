// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Cadl.ProviderHubController.Common
{
    /// <summary>
    /// Interface for validation attribute classes
    /// </summary>
    public interface IValidationAttribute
    {
        /// <summary>
        /// Perform the implemented validation over the target.
        /// </summary>
        /// <returns>true if validation succeeds, false otherwise.</returns>
        bool Validate(string target);
    }
}
