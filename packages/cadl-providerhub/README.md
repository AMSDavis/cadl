# Cadl ProviderHub Library

This is a library to define an Azure Resource Manager service API.

## Getting started

### Using `init`

1. Run `cadl init https://raw.githubusercontent.com/Azure/cadl-providerhub/main/scaffolding.json` in a new folder
1. Enter the project name

This should have generated the initial files and included the necessary libraries.

- `package.json`:
- `main.cadl`: Entrypoint of your api definition.

### Manually

1. Create a `package.json` file with this content replacing the placeholders

```json
{
  "name": "<name of your project>",
  "version": "1.0.0",
  "author": "<Author>",
  "description": "<description>",
  "license": "MIT",
  "type": "module",
  "engines": {
    "node": ">=14.0.0"
  },
  "scripts": {
    "build": "echo \"nothing to do for samples\""
  },
  "dependencies": {
    "@cadl-lang/compiler": "latest",
    "@cadl-lang/rest": "latest",
    "@azure-tools/cadl-autorest": "latest",
    "@azure-tools/cadl-providerhub": "latest"
  },
  "devDependencies": {}
}
```

2. Run `npm install` to install the dependencies
3. Create a `main.cadl` file with this content

```cadl
import "@cadl-lang/rest";
import "@azure-tools/cadl-autorest";
import "@azure-tools/cadl-providerhub";

```

## Concepts

[General Cadl information](https://github.com/Azure/adl/blob/main/docs/tutorial.md)

### Service definition

First thing is the global definition of the ProviderHub service. For that you can add the `serviceTite`, `serviceVersion` and `armNamespace` decorator on your root namespace.

```cadl
@armNamespace
@serviceTitle("<service name>")
@serviceVersion("<service version>")
namespace <mynamespace>;
```

Example:

```cadl
@armNamespace
@serviceTitle("Microsoft.MyService")
@serviceVersion("2020-10-01-preview")
namespace Microsoft.MyService;

```

### Models/Arm Resources

See [Cadl Models docs](https://github.com/Azure/adl/blob/main/docs/tutorial.md#models) for the basic on models.

ProviderHub is composed of resources. Cadl ProviderHub library makes it much easier to define the structure and endpoints of such resources.

1. Define a model representing the `properties` of the ARM resource.

```cadl
@doc("Properties of UserResource")
model UserResourceProperties {
  @doc("The name of my resource")
  name: string;

  @doc("Details of my resource")
  details?: string;
}

```

2. Define a model representing the parameter that corresponds to the resource name. Other resource identity parameters, like `subscriptionId` and `resourceGroupName` will automatically be added.

```cadl
model UserResourceNameParameter {
  @doc("UserResource resource name")
  @path
  userResourceName: string;
}

```

3. Define the resource model as an Arm Tracked Resource

```cadl
@doc("A UserResource")
@armResource({
  path: "UserResources",
  parameterType: AccountNameParameter,
  collectionName: "UserResources",
})
model UserResource is TrackedResource<UserResourceProperties> {}

```

This will now produce all the endpoints(`get`, `post`, `put`, `patch` and `delete`, listByResourceGroup, listBySubscription) for a resource called `UserResources` and the `operations` endpoint for the service:

| Method & Path                                                                                                                              | Description                             |
| ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------- |
| `GET /providers/Microsoft.MyService/operations`                                                                                            | List all operations for your service    |
| `GET /subscriptions/{subscriptionId}/providers/Microsoft.MyService/userResources`                                                          | list all UserResource by subscription   |
| `GET /subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.MyService/userResources`                       | list all UserResource by resource group |
| `GET /subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.MyService/userResources/{userResourceName}`    | get item                                |
| `PUT /subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.MyService/userResources/{userResourceName}`    | insert item                             |
| `PATCH /subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.MyService/userResources/{userResourceName}`  | patch item                              |
| `DELETE /subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.MyService/userResources/{userResourceName}` | delete item                             |

#### Reference

Types of resources and common models for defining arm resources

| Name                           | Description                                                                             |
| ------------------------------ | --------------------------------------------------------------------------------------- |
| TrackedResource<TProperties>   | Defines a normal ARM resource, where `TProperties` is the model of the `properties`     |
| ProxyResource<TProperties>     | Defines a proxy Proxy resource, where `TProperties` is the model of the `properties`    |
| ExtensionResource<TProperties> | Defines an extension ARM resource, where `TProperties` is the model of the `properties` |

#### x-ms-identifier

For array type with object item , the x-ms-identifier is used to the identifying properties, see [x-ms-identifier](https://github.com/Azure/autorest/tree/main/docs/extensions#x-ms-identifiers) for detail.
If the array type does not contain 'id' and no 'x-ms-identifier' is specified explicitly, an "x-ms-identifier" with empty array will be added for the array type by default. And there is a linter rule to check it and show below waring :

```txt
Missing identifying properties of objects in the array item, please add @extension('x-ms-identifier',...) to specify it.
```

### Sub resources

Azure Management resources can be a sub resource of another.
This can easily be defined by setting the `parentResourceType` property on the `@armResource`.
The value is the parent resource type(Model with the `@armResource` decorator)

For example to create a new `AddressResource` resource under the `UserResource` defined above.

```cadl
@doc("An AddressResource")
@armResource({
  path: "AddressResources",
  parameterType: SubResourceNameParameter,
  collectionName: "AddressResource",
  parentResourceType: UserResource,
})
model AddressResource is TrackedResource<AddressResourceProperties> {}

```

### Additional endpoints/operations

Some resources will provide more than the basic CRUD operations and will need to define a custom endpoint.
For that you can create a new namespace containing the operations and use the `@armResourceOperations` decorator referencing the resource those operations belong to.

Example: To add a `POST /notify` operation on the `UserResource`.

```cadl
@armResourceOperations(UserResource)
namespace Users {
  @post("notify")
  @doc("Send a notification to the user")
  op notifyUser(...CommonResourceParameters): ArmResponse<bool> | ErrorResponse;
}

```

#### Response

Custom operations in ARM still need to respect the correct response schema. Cadl-providerhub provide some models to help with reusablility and compliance.

| Model                         | Code | Description                                   |
| ----------------------------- | ---- | --------------------------------------------- |
| `ArmResponse<T>`              | 200  | Base Arm 200 response.                        |
| `ArmCreatedResponse<T>`       | 201  | Resource created response                     |
| `ArmDeletedResponse`          | 200  | Resource deleted response                     |
| `ArmDeleteAcceptedResponse`   | 202  | Resource deletion in progress response        |
| `ArmDeletedNoContentResponse` | 204  | Resource deleted response                     |
| `Page<T>`                     | 200  | Return a list of resource with ARM pagination |
| `ErrorResponse<T>`            | x    | Error response                                |

#### Parameters

Common parameters that can be used in operation

| Model                        | In           | Description                                                        |
| ---------------------------- | ------------ | ------------------------------------------------------------------ |
| `ApiVersionParameter`        | query        | `api-version` parameter                                            |
| `SubscriptionIdParameter`    | path         | Subscription ID path parameter                                     |
| `ResourceGroupNameParameter` | path         | Resource Group Name path parameter                                 |
| `CommonResourceParameters`   | path & query | Group of Api version, Subscription ID and Resource group parameter |
| `ResourceUriParameter`       | path         | Resource uri path parameter                                        |
| `OperationIdParameter`       | path         | Operation Id path parameter                                        |
