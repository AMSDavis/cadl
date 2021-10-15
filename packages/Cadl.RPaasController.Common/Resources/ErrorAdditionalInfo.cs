// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Cadl.RPaasController.Common
{
    /// <summary>
    /// ErrorAdditionalInfo class
    /// </summary>
    public class ErrorAdditionalInfo 
    {
        /// <summary>
        /// Gets or sets the type of the additional error info.
        /// </summary>
        public string Type { get; set; }

        /// <summary>
        /// Gets or sets the additional error info.
        /// </summary>
        public object Info { get; set; }
    }
}
