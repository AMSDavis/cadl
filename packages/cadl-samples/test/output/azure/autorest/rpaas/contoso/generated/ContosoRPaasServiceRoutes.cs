// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Microsoft.ContosoRPaas.Service.Controllers
{
    public static class ContosoRPaasServiceRoutes
    {
        public const string ListOperations = "providers/Microsoft.ContosoRPaas/operations";
        public const string EmployeeItem = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.ContosoRPaas/employees/{employeeName}";
        public const string EmployeeValidateRead = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.ContosoRPaas/employees/{employeeName}/resourceReadValidate";
        public const string EmployeeValidateCreate = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.ContosoRPaas/employees/{employeeName}/resourceCreationValidate";
        public const string EmployeeEndCreate = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.ContosoRPaas/employees/{employeeName}/resourceCreationCompleted";
        public const string EmployeeValidatePatch = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.ContosoRPaas/employees/{employeeName}/resourcePatchValidate";
        public const string EmployeeEndPatch = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.ContosoRPaas/employees/{employeeName}/resourcePatchCompleted";
        public const string EmployeeValidateDelete = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.ContosoRPaas/employees/{employeeName}/resourceDeletionValidate";
        public const string EmployeeEndDelete = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.ContosoRPaas/employees/{employeeName}/resourceDeletionCompleted";
    }
}