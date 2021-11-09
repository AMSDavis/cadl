# Cadl RPaaS Template

This package provide a project template to help create your first RPaaS services using Cadl. The generated project has integrated with cadl and rpaas onebox, so that it can be simply to use cadl & rpaas onebox .

## Getting started

1. install the template by following:
via git clone locally：
```
git clone <this repo>
dotnet new -i  path-to-the-repo/packages/cadl-rpaas-templates/templates/cadl-rpaas
dotnet new --list
```
via nuget(TBD)：

2. create cadl-rpaas prject using this template:
```
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


## Debug with onebox
TBD

## Test with Api Test




