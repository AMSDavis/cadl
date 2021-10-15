// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Cadl.RPaasController.Common
{
    /// <summary>
    /// ErrorDetail class
    /// </summary>
    public class ErrorDetail 
    {
        /// <summary>
        /// Gets or sets the error code.
        /// </summary>
        public string Code { get; set;}

        /// <summary>
        /// Gets or sets the error message.
        /// </summary>
        public string Message { get; set;}

        /// <summary>
        /// Gets or sets the error target.
        /// </summary>
        public string Target { get; set;}

        /// <summary>
        /// Gets or sets the error details.
        /// </summary>
        public ErrorDetail[] Details { get; set;}

        /// <summary>
        /// Gets or sets the additional error info.
        /// </summary>
        public ErrorAdditionalInfo[] AdditionalInfo { get; set;}
    }
}
