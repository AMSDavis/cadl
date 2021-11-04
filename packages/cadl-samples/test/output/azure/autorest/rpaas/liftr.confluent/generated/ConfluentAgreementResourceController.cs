// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Extensions.Logging;

namespace Microsoft.Confluent.Service
{
    /// <summary>
    /// Controller for user RP operations on the ConfluentAgreementResource resource.
    /// </summary>
    public partial class ConfluentAgreementResourceController : ConfluentAgreementResourceControllerBase
    {
        public ConfluentAgreementResourceController(ILogger<ConfluentAgreementResourceController> logger) : base(logger)
        {
        }
    }
}
