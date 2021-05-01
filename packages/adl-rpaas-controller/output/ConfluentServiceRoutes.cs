using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Microsoft.Confluent.Service.Controllers
{
    public static class ConfluentServiceRoutes
    {
        public const string ListOperations = "providers/Microsoft.Confluent/operations";
        public const string OrganizationItem = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Confluent/organizations/{organizationName}";
        public const string OrganizationListBySubscription = "subscriptions/{subscriptionId}/providers/Microsoft.Confluent/organizations";
        public const string OrganizationListByResourceGroup = "subscriptions/{subscriptionId}/resourceGroups{resourceGroupName}/providers/Microsoft.Confluent/organizations";
        public const string OrganizationValidateCreate = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Confluent/organizations/{organizationName}/validateCreate";
        public const string OrganizationValidatePatch = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Confluent/organizations/{organizationName}/validatePatch";
        public const string OrganizationValidateDelete = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Confluent/organizations/{organizationName}/validateDelete";
    }
}