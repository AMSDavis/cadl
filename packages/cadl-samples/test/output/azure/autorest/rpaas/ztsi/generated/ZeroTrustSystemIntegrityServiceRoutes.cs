// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Microsoft.ZeroTrustSystemIntegrity.Service.Controllers
{
    public static class ZeroTrustSystemIntegrityServiceRoutes
    {
        public const string ListOperations = "providers/Microsoft.ZeroTrustSystemIntegrity/operations";
        public const string ZTSIResourceItem = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.ZeroTrustSystemIntegrity/ztsi/{ztsiName}";
        public const string ZTSIResourceValidateRead = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.ZeroTrustSystemIntegrity/ztsi/{ztsiName}/resourceReadValidate";
        public const string ZTSIResourceValidateCreate = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.ZeroTrustSystemIntegrity/ztsi/{ztsiName}/resourceCreationValidate";
        public const string ZTSIResourceEndCreate = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.ZeroTrustSystemIntegrity/ztsi/{ztsiName}/resourceCreationCompleted";
        public const string ZTSIResourceValidatePatch = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.ZeroTrustSystemIntegrity/ztsi/{ztsiName}/resourcePatchValidate";
        public const string ZTSIResourceEndPatch = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.ZeroTrustSystemIntegrity/ztsi/{ztsiName}/resourcePatchCompleted";
        public const string ZTSIResourceValidateDelete = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.ZeroTrustSystemIntegrity/ztsi/{ztsiName}/resourceDeletionValidate";
        public const string ZTSIResourceEndDelete = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.ZeroTrustSystemIntegrity/ztsi/{ztsiName}/resourceDeletionCompleted";
        public const string ZTSIResourceItemGetMAAURL = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.ZeroTrustSystemIntegrity/ztsi/{ztsiName}/getMAAURL";
        public const string ZTSIResourceItemGetZTSIURL = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.ZeroTrustSystemIntegrity/ztsi/{ztsiName}/getZTSIURL";
        public const string ZTSIResourceItemInitiateRequest = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.ZeroTrustSystemIntegrity/ztsi/{ztsiName}/initiateRequest";
        public const string ZTSIResourceItemReportRequest = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.ZeroTrustSystemIntegrity/ztsi/{ztsiName}/reportRequest";
    }
}
