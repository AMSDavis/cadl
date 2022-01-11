# Cadl MSBuild Target Library

This package enables API First development of RPaaS services using Cadl. It adds build targets to generate an ASP.Net MVC controller and OpenAPI definition from a Cadldescription for the service. The package includes msbuild target files and a custom Cadl build task, integrating API-First development using Cadl into the project simply.

## Getting started

1. create a ASP.NET project.
2. add the nuget package reference to the project dependencies in VisualStudio.
3. init a cadl project into './cadl' by following the below instructions:

```sh
cd path/to/your/project
mkdir cadl
cd cadl
npm init -y
npm install @cadl-lang/rest @azure-tools/cadl-autorest @azure-tools/cadl-rpaas @azure-tools/cadl-rpaas-controller
```

4. add a .cadl file into the './cadl' folder.

5. add the following configuration in your project file (using 'main.cadl' as example):

```
  <ItemGroup>
    <CadlCompile Include="cadl\main.cadl"  />
  </ItemGroup>
```

6. then you can edit the cadl file to define models and ARM resources, the service code and swagger will be generated into the output directory automatically.

## Configuration

### Cadl Root directory

Specify the `Root` option if you want to put your .cadl files into other folder instead of the './cadl' , it must be a relative path .

```bash
 <ItemGroup>
    <CadlCompile Include="cadl\main.cadl" Root="<other dir>" />
  </ItemGroup>
```

### Output path

Specify the `OutputDir` option, this changes the directory where the OpenAPI specification (openapi.json) and service code wil be omitted, by default the directory is '$(IntermediateOutputPath)' which is a common msbuild project property.

```bash
 <ItemGroup>
    <CadlCompile Include="cadl\main.cadl" OutputDir="<other dir>" />
  </ItemGroup>
```

### Key Value Options

Specify the `Options`, which is following `key=value` pattern and will passed to the cadl tool directly via '--option', you can specify multiple options and use ';' as the separator.

```bash
 <ItemGroup>
    <CadlCompile Include="cadl\main.cadl" Options="key1=v1;key2=v2" />
  </ItemGroup>
```
