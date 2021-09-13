using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Microsoft.FluidRelay.Service.Controllers
{
    public static class FluidRelayServiceRoutes
    {
        public const string ListOperations = "providers/Microsoft.FluidRelay/operations";
        public const string FluidRelayServerItem = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.FluidRelay/fluidRelayServers/{name}";
        public const string FluidRelayServerValidateRead = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.FluidRelay/fluidRelayServers/{name}/resourceReadValidate";
        public const string FluidRelayServerValidateCreate = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.FluidRelay/fluidRelayServers/{name}/resourceCreationValidate";
        public const string FluidRelayServerEndCreate = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.FluidRelay/fluidRelayServers/{name}/resourceCreationCompleted";
        public const string FluidRelayServerValidatePatch = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.FluidRelay/fluidRelayServers/{name}/resourcePatchValidate";
        public const string FluidRelayServerEndPatch = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.FluidRelay/fluidRelayServers/{name}/resourcePatchCompleted";
        public const string FluidRelayServerValidateDelete = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.FluidRelay/fluidRelayServers/{name}/resourceDeletionValidate";
        public const string FluidRelayServerEndDelete = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.FluidRelay/fluidRelayServers/{name}/resourceDeletionCompleted";
        public const string FluidRelayServerItemRegenerateKey = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.FluidRelay/fluidRelayServers/{name}/regenerateKey";
        public const string FluidRelayServerItemGetKeys = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.FluidRelay/fluidRelayServers/{name}/getKeys";
    }
}
