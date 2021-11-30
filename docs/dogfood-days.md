# Getting Started for CADL Dogfood Days

Thank you for participating in CADL Dogfood Days. In this doc, you'll find pointers for installation, how to get started, what kinds of things to try with CADL, and where to go for help and to report issues.

## Installing CADL

There are three simple options for getting CADL up and running in yout environment:

- Fork and clone the [cadl-dogfood repo](https://github.com/timotheeguerin/cadl-dogfood)
- Use the [cadl docker images](https://github.com/microsoft/cadl/blob/main/docs/docker.md)
- [Install directly from npm](https://github.com/microsoft/cadl#using-node--npm)

## Getting Started for Azure Data Plane Services

- Documentation
  - [Getting started with CADL for REST APIs](https://github.com/microsoft/cadl/blob/main/README.md#getting-started)
  - [CADL language tutorial](https://github.com/microsoft/cadl/blob/main/docs/tutorial.md)
- Video Walkthroughs
  - [Getting Started with CADL](https://microsoft.sharepoint.com/:v:/t/AzureDeveloperExperience/EaWkjLRlTG1JuZCOZFajxZABYZHF1GR4nygOIn-uOnRrWQ?e=huFQVZ)

## What to do on Dogfood Day

- Model a data plane service you are currently working on
- Model an existing data plane service
- Give feedback on CADL tooling, CADL installation, and the CADL language through [github issues](https://github.com/azure/cadl-azure/issues)

## How to Get Help

CADL Engineers will be online to help throughout the day.

- Ask questions in the [CADL Discussions Teams Channel](https://teams.microsoft.com/l/channel/19%3a906c1efbbec54dc8949ac736633e6bdf%40thread.skype/Cadl%2520Discussion?groupId=3e17dcb0-4257-4a30-b843-77f47f1d4121&tenantId=72f988bf-86f1-41af-91ab-2d7cd011db47)
- File issues in the [cadl-azure github repo](https://github.com/azure/cadl-azure/issues)

## More Information About CADL

CADL (Compact API Definition Language) is a typescript-like language for defining APIs. CADL is designed for code reuse,
and for Azure services, there are service extensions for CADL that provide high level building blocks you should use to build
your service. These libraries also contain rules that encourage following established patterns for Azure APIs. Using these building blocks
and guard rails, your service API will be easier to build, will have an easier time passing API reviews, will be consistent with other Azure
services, and will produce good API documentation, good SDKs, and good CLIs.
CADL can emit the following artifacts for your service:

- OpenAPI3 specs
- OpenAPI2 specs, suitable for check-in in to the azure-rest-api-specs repo
- _Management Plane_ CADL produces ASP.NET MVC controllers and supporting models for your UserRP. CADL tooling also helps produce manifests, and aids in hosting your service in the ProviderHub OneBox environment for local testing and debugging.

For more information on the CADL language and core libraries, see [Getting started with CADL](https://github.com/microsoft/cadl/blob/main/docs/tutorial.md), or some of these additional sources:

- Recordings
  - [CADL Brownbag for ARM](https://microsoft-my.sharepoint.com/:v:/p/markcowl/EQcfmjJ4MXhDmwqfo_e5KNcBvayWd63KwK-WJNPykZC88Q)
  - [CADL Brownbag for Azure SDK](https://microsoft-my.sharepoint.com/:v:/r/personal/scotk_microsoft_com/Documents/Recordings/Lunch%20Learning%20Series%20_%20Mark%20Cowlishaw%20-%20CADL%20Walkthrough-20211117_120334-Meeting%20Recording.mp4?csf=1&web=1&e=27IgaX)

## Getting Started for ProviderHub (RPaaS) Management Services

- Documentation
  - [RPaaS Project Templates](https://github.com/Azure/cadl-azure/blob/main/packages/cadl-rpaas-templates/README.md)
  - [Getting Started with RPaaS](https://aka.ms/cadl/rpass-start)
  - [Checking in CADL Generated Swagger](https://github.com/Azure/cadl-azure/blob/main/docs/checking-in-swagger-guide.md)
- Video Walkthroughs
  - [Getting Started with CADL for RPaaS](https://microsoft.sharepoint.com/:v:/t/AzureDeveloperExperience/EYTV39X351FAlHb8tIPHdCgB1zgVDUGfcCE2mOoQAlVAcw?e=0D1IIW)
  - [Service Code Generation](https://microsoft.sharepoint.com/:v:/t/AzureDeveloperExperience/EUqfqSySRipChjKAciFLHfMBXHnjti49ZTrLKvHW0UWL-Q?e=EDtBNk)
