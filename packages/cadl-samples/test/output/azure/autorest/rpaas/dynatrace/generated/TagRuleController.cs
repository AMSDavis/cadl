// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Extensions.Logging;

namespace Microsoft.Observability.Service
{
    /// <summary>
    /// Controller for user RP operations on the TagRule resource.
    /// </summary>
    public partial class TagRuleController : TagRuleControllerBase
    {
        public TagRuleController(ILogger<TagRuleController> logger) : base(logger)
        {
        }
    }
}
