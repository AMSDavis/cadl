// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Microsoft.Observability.Service.Controllers
{
    public static class ObservabilityServiceRoutes
    {
        public const string ListOperations = "providers/Microsoft.Observability/operations";
        public const string MonitorResourceItem = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Dynatrace.Observability/monitors/{monitorName}";
        public const string MonitorResourceValidateRead = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Dynatrace.Observability/monitors/{monitorName}/resourceReadValidate";
        public const string MonitorResourceValidateCreate = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Dynatrace.Observability/monitors/{monitorName}/resourceCreationValidate";
        public const string MonitorResourceEndCreate = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Dynatrace.Observability/monitors/{monitorName}/resourceCreationCompleted";
        public const string MonitorResourceValidatePatch = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Dynatrace.Observability/monitors/{monitorName}/resourcePatchValidate";
        public const string MonitorResourceEndPatch = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Dynatrace.Observability/monitors/{monitorName}/resourcePatchCompleted";
        public const string MonitorResourceValidateDelete = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Dynatrace.Observability/monitors/{monitorName}/resourceDeletionValidate";
        public const string MonitorResourceEndDelete = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Dynatrace.Observability/monitors/{monitorName}/resourceDeletionCompleted";
        public const string MonitorResourceItemGetAccountCredentials = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Dynatrace.Observability/monitors/{monitorName}/getAccountCredentials";
        public const string MonitorResourceItemListMonitoredResources = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Dynatrace.Observability/monitors/{monitorName}/listMonitoredResources";
        public const string MonitorResourceItemGetVMHostPayload = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Dynatrace.Observability/monitors/{monitorName}/vmHostPayload";
        public const string MonitorResourceItemListVmHostUpdate = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Dynatrace.Observability/monitors/{monitorName}/vmHostUpdate";
        public const string MonitorResourceItemListVMHosts = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Dynatrace.Observability/monitors/{monitorName}/listVMHosts";
        public const string MonitorResourceItemListSingleSignOnConfigurations = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Dynatrace.Observability/monitors/{monitorName}/singleSignOnConfigurations";
        public const string TagRuleItem = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Dynatrace.Observability/monitors/{monitorName}/tagRules/{ruleSetName}";
        public const string TagRuleValidateRead = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Dynatrace.Observability/monitors/{monitorName}/tagRules/{ruleSetName}/resourceReadValidate";
        public const string TagRuleValidateCreate = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Dynatrace.Observability/monitors/{monitorName}/tagRules/{ruleSetName}/resourceCreationValidate";
        public const string TagRuleEndCreate = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Dynatrace.Observability/monitors/{monitorName}/tagRules/{ruleSetName}/resourceCreationCompleted";
        public const string TagRuleValidatePatch = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Dynatrace.Observability/monitors/{monitorName}/tagRules/{ruleSetName}/resourcePatchValidate";
        public const string TagRuleEndPatch = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Dynatrace.Observability/monitors/{monitorName}/tagRules/{ruleSetName}/resourcePatchCompleted";
        public const string TagRuleValidateDelete = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Dynatrace.Observability/monitors/{monitorName}/tagRules/{ruleSetName}/resourceDeletionValidate";
        public const string TagRuleEndDelete = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Dynatrace.Observability/monitors/{monitorName}/tagRules/{ruleSetName}/resourceDeletionCompleted";
        public const string DynatraceSingleSignOnResourceItem = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Dynatrace.Observability/monitors/{monitorName}/singleSignOnConfigurations/{configurationName}";
        public const string DynatraceSingleSignOnResourceValidateCreate = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Dynatrace.Observability/monitors/{monitorName}/singleSignOnConfigurations/{configurationName}/resourceCreationValidate";
        public const string DynatraceSingleSignOnResourceEndCreate = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Dynatrace.Observability/monitors/{monitorName}/singleSignOnConfigurations/{configurationName}/resourceCreationCompleted";
        public const string DynatraceSingleSignOnResourceValidateRead = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Dynatrace.Observability/monitors/{monitorName}/singleSignOnConfigurations/{configurationName}/resourceReadValidate";
    }
}
