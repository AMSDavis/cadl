using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Microsoft.PlayFab.Service.Controllers
{
    public static class PlayFabServiceRoutes
    {
        public const string ListOperations = "providers/Microsoft.PlayFab/operations";
        public const string PlayerDatabaseItem = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.PlayFab/playerDatabases/{name}";
        public const string PlayerDatabaseValidateRead = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.PlayFab/playerDatabases/{name}/resourceReadValidate";
        public const string PlayerDatabaseValidateCreate = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.PlayFab/playerDatabases/{name}/resourceCreationValidate";
        public const string PlayerDatabaseEndCreate = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.PlayFab/playerDatabases/{name}/resourceCreationCompleted";
        public const string PlayerDatabaseValidatePatch = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.PlayFab/playerDatabases/{name}/resourcePatchValidate";
        public const string PlayerDatabaseEndPatch = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.PlayFab/playerDatabases/{name}/resourcePatchCompleted";
        public const string PlayerDatabaseValidateDelete = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.PlayFab/playerDatabases/{name}/resourceDeletionValidate";
        public const string PlayerDatabaseEndDelete = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.PlayFab/playerDatabases/{name}/resourceDeletionCompleted";
        public const string TitleItem = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.PlayFab/titles/{name}";
        public const string TitleValidateRead = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.PlayFab/titles/{name}/resourceReadValidate";
        public const string TitleValidateCreate = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.PlayFab/titles/{name}/resourceCreationValidate";
        public const string TitleEndCreate = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.PlayFab/titles/{name}/resourceCreationCompleted";
        public const string TitleValidatePatch = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.PlayFab/titles/{name}/resourcePatchValidate";
        public const string TitleEndPatch = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.PlayFab/titles/{name}/resourcePatchCompleted";
        public const string TitleValidateDelete = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.PlayFab/titles/{name}/resourceDeletionValidate";
        public const string TitleEndDelete = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.PlayFab/titles/{name}/resourceDeletionCompleted";
    }
}
