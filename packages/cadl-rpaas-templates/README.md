# Cadl RPaaS Template

This package provide a project template to help create your first RPaaS services using Cadl. The generated project has integrated with cadl and rpaas onebox, so that it can be simply to use cadl & rpaas onebox .

## Getting started

1. install the template by following:

via git clone locally：
```bash
git clone <this repo>
dotnet new -i  path-to-the-repo/packages/cadl-rpaas-templates/templates/cadl-rpaas
dotnet new --list
```

via nuget:

```bash
TBD
```

2. create cadl-rpaas prject using this template:
```bash
dotnet new cadl-rpaas -P <provider> -o <prject folder>

Options:
  -P|--Provider           Your provider name.
                          string - Optional
                          Default: Contoso

  -F|--FirstResourceType  Your resource type.
                          string - Optional
                          Default: Employee

```

3. open the project either in visual studio or vscode , then you can modify the api description in the 'cadl/main.cadl' and the generated code will be auto-refreshed.


## Debug with OneBox

### Prerequisites
1. Install [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)
1. Install [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli?view=azure-cli-latest)

To authenticate with the RPaaS OneBox ACR, use following commands:
```bash
az login
az acr login --name rpaasoneboxacr
```
### Run OneBox

#### Option 1: Run OneBox with `docker-compose`
```bash
cd onebox
docker-compose up
```
The OneBox will be running on http://localhost:6000.

Available environement variables:
* `RPAAS_ONEBOX_IMAGE_LABEL`: The label of the OneBox images to use. Default is `latest`.
* `RPAAS_ONEBOX_REGISTRY`: The registry to use for OneBox images. Default is `rpaasoneboxacr.azurecr.io`.
* `RPAAS_ONEBOX_PORT`: The port to expose the OneBox on. Default is `6000`.
* `RPAAS_ONEBOX_SERVICERP_PORT`: The port to expose the OneBox ServiceRP on. Default is `6012`.
* `RPAAS_ONEBOX_METARP_PORT`: The port to expose the OneBox MetaRP on. Default is `6010`.

For example, to run the OneBox on another port:
```bash
RPAAS_ONEBOX_PORT=8080 docker-compose up
```
To stop OneBox, run `docker-compose down`.

#### Option 2: Run OneBox with [Porter](https://porter.sh/install/)
```bash
porter install rpaas-onebox --reference rpaasoneboxacr.azurecr.io/rpaas-onebox-installer:v0.1.0 --allow-docker-host-access
```

Available parameters:
* `label`: The label of the OneBox images to use. Default is `latest`.
* `registry`: The registry to use for OneBox images. Default is `rpaasoneboxacr.azurecr.io`.
* `port`: The port to expose the OneBox on. Default is `6000`.
* `port_servicerp`: The port to expose the OneBox ServiceRP on. Default is `6012`.
* `port_metarp`: The port to expose the OneBox MetaRP on. Default is `6010`.

For example, to run the OneBox on another port:
```bash
porter install rpaas-onebox --param port=8080
```

To stop, run `porter uninstall rpaas-onebox`.

### Register resourceProvider and resourceTypes
The resourceProvider and resourceTypes registration contents are put in the `registrations` folder:
```
.
├── docker-compose.yml
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
or directly do the registration with Curl or other REST tools. See [RPaaS wiki](https://armwiki.azurewebsites.net/rpaas/onebox.html#as-rp-owner-userrp).

## API Test

TBD
