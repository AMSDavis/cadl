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

### Run OneBox
* Option 1: with `docker-compose`
```bash
cd onebox
docker-compose up
```
The OneBox will be running on http://localhost:6000. To stop OneBox, run `docker-compose down`.

* Option 2: with [Porter](https://porter.sh/install/)
```bash
porter install rpaas-onebox --reference rpaasoneboxacr.azurecr.io/rpaas-onebox-installer:v0.1.0 --allow-docker-host-access
```
To stop, run `porter uninstall rpaas-onebox`.

If no permission to pull image, you can use following command to log in to the registry:
```bash
az login
az acr login --name rpaasoneboxacr
```

### Register resourceProvider and resourceTypes
The resourceProvider and resourceTypes registration is kept in the `registrations` folder:
```
.
├── docker-compose.yml
├── register.sh
└── registrations
    ├── Microsoft.Contoso
    │   └── employees.json
    └── Microsoft.Contoso.json
```
With following command, you can register the resourceProvider and resourceTypes to OneBox ServiceRp:
```bash
./register.sh
```
or with `docker`:
```bash
docker run --rm -v $(pwd)/registrations:/app/registrations:ro rpaasoneboxacr.azurecr.io/rpaas-onebox/register
```

## API Test

TBD
