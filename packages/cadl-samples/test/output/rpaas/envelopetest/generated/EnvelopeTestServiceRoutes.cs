using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Microsoft.EnvelopeTest.Service.Controllers
{
    public static class EnvelopeTestServiceRoutes
    {
        public const string ListOperations = "providers/Microsoft.EnvelopeTest/operations";
        public const string AllPropertiesResourceItem = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.EnvelopeTest/allProperties/{allPropertiesName}";
        public const string AllPropertiesResourceValidateRead = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.EnvelopeTest/allProperties/{allPropertiesName}/resourceReadValidate";
        public const string AllPropertiesResourceValidateCreate = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.EnvelopeTest/allProperties/{allPropertiesName}/resourceCreationValidate";
        public const string AllPropertiesResourceEndCreate = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.EnvelopeTest/allProperties/{allPropertiesName}/resourceCreationCompleted";
        public const string AllPropertiesResourceValidatePatch = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.EnvelopeTest/allProperties/{allPropertiesName}/resourcePatchValidate";
        public const string AllPropertiesResourceEndPatch = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.EnvelopeTest/allProperties/{allPropertiesName}/resourcePatchCompleted";
        public const string AllPropertiesResourceValidateDelete = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.EnvelopeTest/allProperties/{allPropertiesName}/resourceDeletionValidate";
        public const string AllPropertiesResourceEndDelete = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.EnvelopeTest/allProperties/{allPropertiesName}/resourceDeletionCompleted";
        public const string SystemOnlyResourceItem = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.EnvelopeTest/systems/{systemOnlyPropertiesName}";
        public const string SystemOnlyResourceValidateRead = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.EnvelopeTest/systems/{systemOnlyPropertiesName}/resourceReadValidate";
        public const string SystemOnlyResourceValidateCreate = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.EnvelopeTest/systems/{systemOnlyPropertiesName}/resourceCreationValidate";
        public const string SystemOnlyResourceEndCreate = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.EnvelopeTest/systems/{systemOnlyPropertiesName}/resourceCreationCompleted";
        public const string SystemOnlyResourceValidatePatch = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.EnvelopeTest/systems/{systemOnlyPropertiesName}/resourcePatchValidate";
        public const string SystemOnlyResourceEndPatch = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.EnvelopeTest/systems/{systemOnlyPropertiesName}/resourcePatchCompleted";
        public const string SystemOnlyResourceValidateDelete = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.EnvelopeTest/systems/{systemOnlyPropertiesName}/resourceDeletionValidate";
        public const string SystemOnlyResourceEndDelete = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.EnvelopeTest/systems/{systemOnlyPropertiesName}/resourceDeletionCompleted";
    }
}
