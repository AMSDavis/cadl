using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Microsoft.FluidRelay.Service.Controllers
{
    public static class FluidRelayServiceRoutes
    {
        public const string ListOperations = "providers/Microsoft.FluidRelay/operations";        public const string FluidRelayServerItem = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.FluidRelay/fluidRelayServers/{name}";        public const string FluidRelayServerListBySubscription = "/subscriptions/{subscriptionId}/providers/Microsoft.FluidRelay/fluidRelayServers";        public const string FluidRelayServerListByResourceGroup = "/subscriptions/{subscriptionId}/resourceGroups{resourceGroupName}/providers/Microsoft.FluidRelay/fluidRelayServers";        public const string FluidRelayServerValidateCreate = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.FluidRelay/fluidRelayServers/{name}/validateCreate";        public const string FluidRelayServerValidatePatch = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.FluidRelay/fluidRelayServers/{name}/validatePatch";        public const string FluidRelayServerValidateDelete = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.FluidRelay/fluidRelayServers/{name}/validateDelete";        public const string FluidRelayServerValidateRegenerateKey = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.FluidRelay/fluidRelayServers/{name}/validateRegenerateKey";
        public const string FluidRelayServerItemRegenerateKey = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.FluidRelay/fluidRelayServers/{name}/regenerateKey";        public const string FluidRelayServerValidateGetKeys = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.FluidRelay/fluidRelayServers/{name}/validateGetKeys";
        public const string FluidRelayServerItemGetKeys = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.FluidRelay/fluidRelayServers/{name}/getKeys";    }
}
