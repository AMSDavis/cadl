# Getting Started for Cadl Dogfood Days

Thank you for participating in Cadl Dogfood Days. In this doc, you'll find pointers for installation, how to get started, what kinds of things to try with Cadl, and where to go for help and to report issues.

## Installing Cadl

There are three simple options for getting Cadl up and running in your environment:

- Fork and clone the [cadl-dogfood repo](https://github.com/timotheeguerin/cadl-dogfood)
  - use npm install at the top level to install cadl dependencies
  - use npx cadl from this directory to install the cadl vs/vs code extensions
    ```bash
    npx cadl code install
    ```
    or
    ```bash
    npx cadl vs install
    ```
  - use npx cadl compile to compile the cadl specs in the local directory
    ```bash
    npx cadl compile ./main.cadl
    ```
- Use the [cadl docker images](https://github.com/microsoft/cadl/blob/main/docs/docker.md)
- [Install directly from npm](https://github.com/microsoft/cadl#using-node--npm)

Once Cadl is installed, the [Cadl language tutorial](https://github.com/microsoft/cadl/blob/main/docs/tutorial.md) provides a good overview of the basics of the language.

## Getting Started for Azure Data Plane Services

- Documentation
  - [Getting started with Cadl for REST APIs](https://github.com/microsoft/cadl/blob/main/README.md#getting-started)
  - [Cadl language tutorial](https://github.com/microsoft/cadl/blob/main/docs/tutorial.md)
  - [Cadl Swagger Cheat Sheet](https://github.com/microsoft/cadl/blob/ba062e52cae04e9cb78a8969863c9b21a45ceed7/docs/cadl-for-openapi-dev.md)
- Samples
  - [Petstore Sample using Low-level Http APIs](https://github.com/microsoft/cadl/tree/main/packages/samples/petstore)
  - [Petstore Sample using High-level Resource APis](https://github.com/microsoft/cadl/tree/main/packages/samples/rest/petstore)
  - You can also browse the [Samples package](https://github.com/microsoft/cadl/tree/main/packages/samples)
- Video Walkthroughs
  - [Getting Started with Cadl](https://microsoft.sharepoint.com/:v:/t/AzureDeveloperExperience/EaWkjLRlTG1JuZCOZFajxZABYZHF1GR4nygOIn-uOnRrWQ?e=huFQVZ)

## What to do on Dogfood Day

- Model a data plane service you are currently working on
- Alternately, try to model an existing data plane service
- Give feedback on Cadl tooling, Cadl installation, and the Cadl language through [github issues](https://github.com/azure/cadl-azure/issues)

## How to Get Help

Cadl Engineers will be online to help throughout the day.

- Ask questions in the [Cadl Discussions Teams Channel](https://teams.microsoft.com/l/channel/19%3a906c1efbbec54dc8949ac736633e6bdf%40thread.skype/Cadl%2520Discussion?groupId=3e17dcb0-4257-4a30-b843-77f47f1d4121&tenantId=72f988bf-86f1-41af-91ab-2d7cd011db47)
- File issues in the [cadl-azure github repo](https://github.com/azure/cadl-azure/issues)

### Troubleshooting VSCode Tooling and Filing Issues

If you run into a problem with the Cadl-specific tooling in vscode, please try to capture the issue, and include any log information. If IntelliSense, syntax highlighting or other language features don't appear to be working:

- Ensure that 'Cadl' is the selected language format for your document (this should happen automatically if your file uses the .cadl suffix)
  ![image](https://user-images.githubusercontent.com/1054056/144310539-4e9bfbb9-1366-4b6f-a490-875e9bd68669.png)
- Choose Output from the View menu to see the output of the language server (View -> Output)
  ![image](https://user-images.githubusercontent.com/1054056/144310719-4bca242f-f11c-484c-91c7-6914fcf7fe3a.png)
- Capture any output, including stack traces, and include in your [github issue](https://github.com/azure/cadl-azure/issues).
  ![image](https://user-images.githubusercontent.com/1054056/144310907-ec945f54-0fd8-40a4-936c-60669f4a052f.png)
- Restart VS Code to restart the language server

## More Information About Cadl

Cadl (Compact API Definition Language) is a TypeScript-like language for defining APIs. Cadl is designed for code reuse,
and for Azure services, there are service extensions for Cadl that provide high level building blocks you should use to build
your service. These libraries also contain rules that encourage following established patterns for Azure APIs. Using these building blocks
and guard rails, your service API will be easier to build, will have an easier time passing API reviews, will be consistent with other Azure
services, and will produce good API documentation, good SDKs, and good CLIs.
Cadl can emit the following artifacts for your service:

- OpenAPI3 specs
- OpenAPI2 specs, suitable for check-in in to the azure-rest-api-specs repo
- _Management Plane_ Cadl produces ASP.NET MVC controllers and supporting models for your UserRP. Cadl tooling also helps produce manifests, and aids in hosting your service in the ProviderHub OneBox environment for local testing and debugging.

For more information on the Cadl language and core libraries, see [Getting started with Cadl](https://github.com/microsoft/cadl/blob/main/docs/tutorial.md), or some of these additional sources:

- Recordings
  - [Cadl Brownbag for ARM](https://microsoft-my.sharepoint.com/:v:/p/markcowl/EQcfmjJ4MXhDmwqfo_e5KNcBvayWd63KwK-WJNPykZC88Q)
  - [Cadl Brownbag for Azure SDK](https://microsoft-my.sharepoint.com/:v:/r/personal/scotk_microsoft_com/Documents/Recordings/Lunch%20Learning%20Series%20_%20Mark%20Cowlishaw%20-%20Cadl%20Walkthrough-20211117_120334-Meeting%20Recording.mp4?csf=1&web=1&e=27IgaX)

## Getting Started for ProviderHub (RPaaS) Management Services

- Documentation
  - [RPaaS Project Templates](https://github.com/Azure/cadl-azure/blob/main/packages/cadl-rpaas-templates/README.md)
  - [Getting Started with RPaaS](https://aka.ms/cadl/rpass-start)
  - [Checking in Cadl Generated Swagger](https://github.com/Azure/cadl-azure/blob/main/docs/checking-in-swagger-guide.md)
- Video Walkthroughs
  - [Getting Started with Cadl for RPaaS](https://microsoft.sharepoint.com/:v:/t/AzureDeveloperExperience/EYTV39X351FAlHb8tIPHdCgB1zgVDUGfcCE2mOoQAlVAcw?e=0D1IIW)
  - [Service Code Generation](https://microsoft.sharepoint.com/:v:/t/AzureDeveloperExperience/EUqfqSySRipChjKAciFLHfMBXHnjti49ZTrLKvHW0UWL-Q?e=EDtBNk)
