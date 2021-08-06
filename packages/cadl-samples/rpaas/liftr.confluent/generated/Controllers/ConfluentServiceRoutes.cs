using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Microsoft.Confluent.Service.Controllers
{
    public static class ConfluentServiceRoutes
    {
        public const string ListOperations = "providers/Microsoft.Confluent/operations", 
            OrganizationItem = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Confluent/organizations/{organizationName}", 
            OrganizationListBySubscription = "subscriptions/{subscriptionId}/providers/Microsoft.Confluent/organizations", 
            OrganizationListByResourceGroup = "subscriptions/{subscriptionId}/resourceGroups{resourceGroupName}/providers/Microsoft.Confluent/organizations";
        public const string ValidateCreate = "subscriptions/{subscriptionId}/resourceGroups{resourceGroupName}/providers/Microsoft.Confluent/organizations/{organizationName}/validateCreate", 
            ValidatePatch = "subscriptions/{subscriptionId}/resourceGroups{resourceGroupName}/providers/Microsoft.Confluent/organizations/{organizationName}/validatePatch", 
            ValidateDelete = "subscriptions/{subscriptionId}/resourceGroups{resourceGroupName}/providers/Microsoft.Confluent/organizations/{organizationName}/validateDelete";
    }
}
