// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.AspNetCore.Http;

namespace Microsoft.Cadl.Providerhub.Controller
{
    /// <summary>
    /// Extension class for helper functions on HttpRequest
    /// </summary>
    public static class HttpRequestExtensions
    {
        private const string RPaasApiVersionHeader = "";

        /// <summary>
        /// Extract the incoming user requested api-version from RPaas extension request
        /// </summary>
        /// <param name="request">The HTTP request from incoming RPaas call</param>
        /// <returns></returns>
        public static string GetRPaasRequestApiVersion(this HttpRequest request)
        {
            // TODO, parse out request API version from RPaas Header
            // Verify it is always passed. If so, throw InvalidOperationException
            if (request.Headers.ContainsKey(RPaasApiVersionHeader))
            {
                var headerValues = request.Headers[RPaasApiVersionHeader];

                return headerValues[headerValues.Count - 1];
            }
            
            return string.Empty;
        }
    }
}
