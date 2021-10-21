// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Microsoft.Confluent.Service.Controllers
{
    public static class ConfluentServiceRoutes
    {
        public const string ListOperations = "providers/Microsoft.Confluent/operations";
        public const string ConfluentAgreementResourceItem = "/subscriptions/{subscriptionId}/providers/Microsoft.Confluent/agreements";
        public const string ConfluentAgreementResourceValidateRead = "/subscriptions/{subscriptionId}/providers/Microsoft.Confluent/agreements/resourceReadValidate";
        public const string ConfluentAgreementResourceValidateCreate = "/subscriptions/{subscriptionId}/providers/Microsoft.Confluent/agreements/resourceCreationValidate";
        public const string ConfluentAgreementResourceEndCreate = "/subscriptions/{subscriptionId}/providers/Microsoft.Confluent/agreements/resourceCreationCompleted";
        public const string OrganizationItem = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Confluent/organizations/{organizationName}";
        public const string OrganizationValidateRead = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Confluent/organizations/{organizationName}/resourceReadValidate";
        public const string OrganizationValidateCreate = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Confluent/organizations/{organizationName}/resourceCreationValidate";
        public const string OrganizationEndCreate = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Confluent/organizations/{organizationName}/resourceCreationCompleted";
        public const string OrganizationValidatePatch = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Confluent/organizations/{organizationName}/resourcePatchValidate";
        public const string OrganizationEndPatch = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Confluent/organizations/{organizationName}/resourcePatchCompleted";
        public const string OrganizationValidateDelete = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Confluent/organizations/{organizationName}/resourceDeletionValidate";
        public const string OrganizationEndDelete = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Confluent/organizations/{organizationName}/resourceDeletionCompleted";
    }
}
