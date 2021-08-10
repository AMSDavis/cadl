# Cadl RPaaS Library

This is a library to define an Azure Resource Manager service API.

## Getting started

### Using `init`

1. Run `cadl init https://raw.githubusercontent.com/Azure/cadl-rpaas/main/scaffolding.json` in a new folder
1. Enter the project name

This should have generate the initial files and included the necessary libraries.

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
    "@azure-tools/cadl": "latest",
    "@azure-tools/cadl-openapi": "latest",
    "@azure-tools/cadl-rest": "latest",
    "@azure-tools/cadl-rpaas": "latest"
  },
  "devDependencies": {}
}
```

2. Run `npm install` to install the dependencies
3. Create a `main.cadl` file with this content

```cadl
import "@azure-tools/cadl-rest";
import "@azure-tools/cadl-openapi";
import "@azure-tools/cadl-rpaas";
```

## Concepts

[General Cadl information](https://github.com/Azure/adl/blob/main/docs/tutorial.md)

### Service definition

First thing is the global definition of the RPaaS service. For that you can add the `serviceTite`, `serviceVersion` and `armNamespace` decorator on your root namespace.

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

RPaaS is composed of resources. Cadl RPaaS library makes it much easier to define the structure and endpoints of such resources.

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

2. Define a model representing the parameter used to find the resource. `subscriptionId` and `resourceGroupName` will automatically be added.

```cadl
model UserResourceNameParameter {
  @doc("UserResource resource name")
  @path UserResourceName: string;
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
model UserResource extends TrackedResource<UserResourceProperties> {};
```

This will now produce all the endpoints(`get`, `post`, `put`, `patch` and `delete`) for a resource called `UserResources` and the `operations` endpoint for the service:

| Method & Path                                                                                                                              | Description                          |
| ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------ |
| `GET /providers/Microsoft.MyService/operations`                                                                                            | List all operations for your service |
| `GET /subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.MyService/UserResources`                       | list all UserResource                |
| `GET /subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.MyService/UserResources/{UserResourceName}`    | get item                             |
| `PUT /subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.MyService/UserResources/{UserResourceName}`    | insert item                          |
| `PATCH /subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.MyService/UserResources/{UserResourceName}`  | patch item                           |
| `DELETE /subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.MyService/UserResources/{UserResourceName}` | delete item                          |

### Sub resources

Azure Management resources can be a sub resource of another.
This can easily be defined by setting the `parentResourceType` property on the `@armResource`.
The value is the parent resource type(Model with the `@armResource` decorator)

For example to create a new `AddressResource` resource under the `UserResource` defined above.

```cadl
@doc("A AddressResource")
@armResource({
  path: "AddressResources",
  parameterType: SubResourceNameParameter,
  collectionName: "AddressResource",
  parentResourceType: UserResource
})
model UserResource extends TrackedResource<UserResourceProperties> {};
```

### Additional endpoints/operations

Some resources will provide more than the basic CRUD operations and will need to define a custom endpoint.
For that you can create a new namespace containing the operations and use the `@armResourceOperations` decorator referencing the resource those operations belong to.

Example: To add a `GET /parent` and `PUT /parent` operation on the `UserResource` to create a relation between

```cadl
@armResourceOperations(UserResource)
namespace Users {
  @get("parent")
  op getParent(
    ...CommonResourceParameters,
  ): ArmResponse<UserResource> | ErrorResponse;

  @put("parent")
  op getParent(
    ...CommonResourceParameters,
    @body parent: UserResource
  ): ArmResponse<UserResource> | ErrorResponse;
}
```

#### Response

Custom operations in ARM still need to respect the correct response schema. Cadl-rpaas provide some models to help with reusablility and compliance.

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

### Reference

#### `ArmResource`

Base model for an arm resource with common properties.

#### `TrackedResource<TProperties>`

Concrete tracked resource types can be created by aliasing this type using a specific property type.

#### `ProxyResource<TProperties>`

Concrete proxy resource types can be created by aliasing this type using a specific property type.

#### `ExtensionResource<TProperties>`

Concrete proxy resource types can be created by aliasing this type using a specific property type.

#### `NameParameter`

Generic parameter model for the `{name}` parameter.

### `ArmResponse<T>`

Model of a generic arm response.
