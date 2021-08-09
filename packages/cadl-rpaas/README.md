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

RPaaS is composed of resources. Cadl rpaas library makes it much easier to define the structure and endpoints of such resources.

1. Define a model representing the `properties` of the ARM resource.

```cadl
@doc("Properties of MyResource")
model MyResourceProperties {
  @doc("The name of my resource")
  name: string;

  @doc("Details of my resource")
  details?: string;
}
```

2. Define a model representing the parameter used to find the resource. `subscriptionId` and `resourceGroupName` will automatically be added.

```cadl
model MyResourceNameParameter {
  @doc("MyResource resource name")
  @path myResourceName: string;
}
```

3. Define the resource model as an Arm Tracked Resource

```cadl
@doc("A MyResource")
@armResource({
  path: "myResources",
  parameterType: AccountNameParameter,
  collectionName: "MyResources",
})
model MyResource extends TrackedResource<MyResourceProperties> {};
```

This will now produce all the endpoints(`get`, `post`, `put`, `patch` and `delete`) for a resource called `MyResources` and the `operations` endpoint for the service:

- `GET /providers/Microsoft.MyService/operations`: List all operations for your service
- `GET /subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.MyService/myResources`: list all MyResource
- `GET /subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.MyService/myResources/{myResourceName}`: get item
- `PUT /subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.MyService/myResources/{myResourceName}`: insert item
- `PATCH /subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.MyService/myResources/{myResourceName}`: patch item
- `DELETE /subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.MyService/myResources/{myResourceName}`: delete item
