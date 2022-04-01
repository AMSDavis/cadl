// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// <auto-generated />

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Microsoft.DiscriminatorTest.Service.Controllers
{
    public static class DiscriminatorTestServiceRoutes
    {
        public const string ListOperations = "providers/Microsoft.DiscriminatorTest/operations";
        public const string EmployeeItem = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.DiscriminatorTest/employees/{employeeName}";
        public const string EmployeeValidateRead = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.DiscriminatorTest/employees/{employeeName}/resourceReadValidate";
        public const string EmployeeBeginRead = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.DiscriminatorTest/employees/{employeeName}/resourceReadBegin";
        public const string EmployeeValidateCreate = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.DiscriminatorTest/employees/{employeeName}/resourceCreationValidate";
        public const string EmployeeEndCreate = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.DiscriminatorTest/employees/{employeeName}/resourceCreationCompleted";
        public const string EmployeeValidatePatch = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.DiscriminatorTest/employees/{employeeName}/resourcePatchValidate";
        public const string EmployeeEndPatch = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.DiscriminatorTest/employees/{employeeName}/resourcePatchCompleted";
        public const string EmployeeValidateDelete = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.DiscriminatorTest/employees/{employeeName}/resourceDeletionValidate";
        public const string EmployeeEndDelete = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.DiscriminatorTest/employees/{employeeName}/resourceDeletionCompleted";
    }
}