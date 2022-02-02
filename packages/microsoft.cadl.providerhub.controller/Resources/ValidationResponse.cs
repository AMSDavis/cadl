// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Newtonsoft.Json;

namespace Microsoft.Cadl.Providerhub.Controller
{
    /// <summary>
    /// ValidationResponse class
    /// </summary>
    public class ValidationResponse
    {
        /// <summary>
        /// Valid response constant
        /// </summary>
        public static readonly ValidationResponse Valid = new ValidationResponse(true);

        /// <summary>
        /// Invalid response constant
        /// </summary>
        public static readonly ValidationResponse Invalid = new ValidationResponse(false);

        /// <summary>
        /// Initializes a new instance of the <see cref="ValidationResponse"/> class.
        /// </summary>
        /// <param name="isValid">The visibility level</param>
        public ValidationResponse(bool isValid)
        {
            IsValid = isValid;
        }

        /// <summary>
        /// Gets or sets a value indicating whether the response is valid or not.
        /// </summary>
        [JsonProperty("Valid")]
        public bool IsValid { get; }
    }
}
