# Cadl ProviderHub Template

This package provides a project template to help create your first ProviderHub service using Cadl. The generated project has integrated Cadl and ProviderHub OneBox, so that the Cadl specifications can be simply deployed with ProviderHub OneBox.

## Getting started

1. install the template by following:

via nuget:

```bash
dotnet new -i Microsoft.Cadl.ProviderHub.Templates --nuget-source <the nuget source >

```

note:
Currently, the nuget source is not public and you can supply the nuget source with https://pkgs.dev.azure.com/azure-sdk/29ec6040-b234-4e31-b139-33dc4287b756/_packaging/f447d164-3bb4-7555-baa1-706f3a8d3704/nuget/v3/index.json which is a feed in azure artifact.You can install the [azure-artifacts-credential-provider](https://github.com/microsoft/artifacts-credprovider#azure-artifacts-credential-provider) to automate the acquisition of credentials needed to azure feed.

via git clone locally：

```bash
git clone <this repo>
dotnet new -i path-to-the-repo/packages/cadl-providerhub-templates/templates/cadl-providerhub
dotnet new --list
```

2. create cadl-providerhub project using this template:

```bash
dotnet new cadl-providerhub -P <provider> -o <project folder>

Options:
  -P|--Provider           Your provider name.
                          string - Optional
                          Default: Contoso

  -F|--FirstResourceType  Your resource type.
                          string - Optional
                          Default: Employee

Note:
  1. a 'Yes' | 'Y' is needed by the prompt to allow the post script , the post script is to install cadl tools.
  2. the project name (by default is the project folder name, you can specify it through the '-n' option) should not contains special characters like '-', or it will be replaced by '_'.

```

3. open the project either in visual studio or vscode , then you can modify the api description in the 'cadl/main.cadl' and the generated code will be auto-refreshed.

## Debug with OneBox

To debug your UserRP project with [ProviderHub OneBox](https://armwiki.azurewebsites.net/rpaas/onebox.html) in local environment, you need basically perform following 2 steps:

1. Run OneBox locally
2. Register your resourceProvider and resourceTypes

### Prerequisites

1. Install [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)
1. Install [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli?view=azure-cli-latest)

To authenticate with the ProviderHub OneBox ACR, use following commands:

```bash
az login
az acr login --name rpaasoneboxacr
```

If you are not authorized to access rpaasoneboxacr, you may need to be added to the [RPaaS Partners Security Group](https://idweb.microsoft.com/identitymanagement/aspx/groups/AllGroups.aspx?popupFromClipboard=%2Fidentitymanagement%2Faspx%2FGroups%2FEditGroup.aspx%3Fid%3Dfc4a82d5-c2fb-4519-8e14-6b9582de07fe).

### Run OneBox

#### Option 1: Run OneBox with `docker-compose`

```bash
cd onebox
docker-compose up
```

The OneBox will be running on http://localhost:5000.

Available environment variables:

- `RPAAS_ONEBOX_IMAGE_TAG`: The tag of the OneBox images to use. Default is `latest`.
- `RPAAS_ONEBOX_REGISTRY`: The registry to use for OneBox images. Default is `rpaasoneboxacr.azurecr.io`.
- `RPAAS_ONEBOX_PORT`: The port to expose the OneBox on. Default is `5000`.
- `RPAAS_ONEBOX_SERVICERP_PORT`: The port to expose the OneBox ServiceRP on. Default is `6012`.
- `RPAAS_ONEBOX_METARP_PORT`: The port to expose the OneBox MetaRP on. Default is `6010`.

For example, to run the OneBox on another port:

```bash
RPAAS_ONEBOX_PORT=8080 docker-compose up
```

To stop OneBox, run `docker-compose down`.

#### Option 2: Run OneBox with [Porter](https://porter.sh/install/)

```bash
porter install --reference rpaasoneboxacr.azurecr.io/rpaas-onebox:v0.1.1 --allow-docker-host-access
```

Available parameters:

- `tag`: The tag of the OneBox images to use. Default is `latest`.
- `registry`: The registry to use for OneBox images. Default is `rpaasoneboxacr.azurecr.io`.
- `port`: The port to expose the OneBox on. Default is `5000`.
- `port_servicerp`: The port to expose the OneBox ServiceRP on. Default is `6012`.
- `port_metarp`: The port to expose the OneBox MetaRP on. Default is `6010`.

For example, to run the OneBox on another port:

```bash
porter install --reference rpaasoneboxacr.azurecr.io/rpaas-onebox:v0.1.1 --allow-docker-host-access --param port=8080
```

To stop, run `porter uninstall rpaas-onebox`.

### Register resourceProvider and resourceTypes

The resourceProvider and resourceTypes registration contents are put in the `registrations` folder:

```
.
├── register.sh
└── registrations
    ├── Microsoft.Contoso
    │   └── employees.json
    └── Microsoft.Contoso.json
```

With following command, you can register the resourceProvider and resourceTypes to OneBox ServiceRP:

```bash
./register.sh
```

or with `docker`:

```bash
docker run --rm -v $(pwd)/registrations:/app/registrations:ro rpaasoneboxacr.azurecr.io/rpaas-onebox/register
```

or directly do the registration with Curl or other REST tools. See [ProviderHub wiki As RP owner section](https://armwiki.azurewebsites.net/rpaas/onebox.html#as-rp-owner-userrp).

## API Test

TBD. For now, please refer to [ProviderHub wiki As an end user section](https://armwiki.azurewebsites.net/rpaas/onebox.html#as-an-end-user-uses-metarp).
