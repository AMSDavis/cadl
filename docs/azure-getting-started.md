# Getting Started with Cadl for Azure Services

## Cadl Features

Cadl (Compact API Definition Language) is a typescript-like language for defining APIs. Cadl is designed for code reuse,
and for Azure services, there are Azure service extensions for Cadl that provide high level building blocks you should use to build
your service. These libraries also contain rules that encourage following established patterns for Azure APIs. Using these building blocks
and guard rails, your service API will be easier to build, will have an easier time passing API reviews, will be consistent with other Azure
services, and will produce good API documentation, good SDKs, and good CLIs.
Cadl can emit the following artifacts for your service:

- OpenAPI3 specs
- OpenAPI2 specs, suitable for check-in in to the azure-rest-api-specs repo
- _Management Plane_ Cadl produces ASP.NET MVC controllers and supporting models for your UserRP. Cadl tooling also helps produce manifests, and aids in hosting your service in the ProviderHub OneBox environment for local testing and debugging.

For more information on the Cadl language and core libraries, see [Getting started with Cadl](https://github.com/microsoft/cadl/blob/main/docs/tutorial.md)

## Getting Started for ProviderHub (RPaaS) Management Services

- Documentation
  - [RPaaS Project Templates](https://github.com/Azure/cadl-azure/blob/main/packages/cadl-rpaas-templates/README.md)
  - [Getting Started with RPaaS](https://aka.ms/cadl/rpass-start)
  - [Checking in Cadl Generated Swagger](https://github.com/Azure/cadl-azure/blob/main/docs/checking-in-swagger-guide.md)
- Video Walkthroughs
  - [Getting Started with Cadl for RPaaS](https://microsoft.sharepoint.com/:v:/t/AzureDeveloperExperience/EYTV39X351FAlHb8tIPHdCgB1zgVDUGfcCE2mOoQAlVAcw?e=0D1IIW)
  - [Service Code Generation](https://microsoft.sharepoint.com/:v:/t/AzureDeveloperExperience/EUqfqSySRipChjKAciFLHfMBXHnjti49ZTrLKvHW0UWL-Q?e=EDtBNk)

## Getting Started for Azure Data Plane Services

- Documentation
  - [Getting started with Cadl for REST APIs](https://github.com/microsoft/cadl/blob/main/README.md#getting-started)
  - [Cadl language tutorial](https://github.com/microsoft/cadl/blob/main/docs/tutorial.md)
- Video Walkthroughs
  - [Getting Started with ADL](https://microsoft.sharepoint.com/:v:/t/AzureDeveloperExperience/EaWkjLRlTG1JuZCOZFajxZABYZHF1GR4nygOIn-uOnRrWQ?e=huFQVZ)

## More Information

- Recordings
  - [Cadl Brownbag for ARM](https://microsoft-my.sharepoint.com/:v:/p/markcowl/EQcfmjJ4MXhDmwqfo_e5KNcBvayWd63KwK-WJNPykZC88Q)
  - [Cadl Brownbag for Azure SDK](https://microsoft-my.sharepoint.com/:v:/r/personal/scotk_microsoft_com/Documents/Recordings/Lunch%20Learning%20Series%20_%20Mark%20Cowlishaw%20-%20CADL%20Walkthrough-20211117_120334-Meeting%20Recording.mp4?csf=1&web=1&e=27IgaX)

## Help and Questions

- Teams channels
  - [Cadl Discussions on Teams](https://teams.microsoft.com/l/channel/19%3a906c1efbbec54dc8949ac736633e6bdf%40thread.skype/Cadl%2520Discussion?groupId=3e17dcb0-4257-4a30-b843-77f47f1d4121&tenantId=72f988bf-86f1-41af-91ab-2d7cd011db47)
  - [Cadl Partners on Teams](https://teams.microsoft.com/l/channel/19%3a2d4efc54d99e4d00a568da7cf0643c1b%40thread.skype/Cadl%2520Partners?groupId=3e17dcb0-4257-4a30-b843-77f47f1d4121&tenantId=72f988bf-86f1-41af-91ab-2d7cd011db47)
- Email: adlteam@microsoft.com
- File Issues
  - [Cadl-Azure](https://github.com/Azure/cadl-azure/issues)
