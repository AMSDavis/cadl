# Getting Started with CADL for Azure Services
## CADL Features
CADL (Compact API Definition Language) is a typescript-like language for defining APIs.  CADL is designed for code reuse, 
and for Azure services, there are Azure service extensions for CADL that provide high level building blocks you should use to build 
your service, these libraries also contain rules that encourage following established patterns for Azure APIs - using these building blocks 
and guard rails, your service API will be easier to build, will have an easier time passing API reviews, will be consistent with other Azure 
services, and will produce good API documentation, good SDKs, and good CLIs. 
CADL can emit the following artifacts for your service:
- OpenAPI3 specs
- OpenAPI2 specs, suitable for check-in in to the azure-rest-api-specs repo
- *Management Plane* CADL produces ASP/NET MVC controllers and supporting models for your UserRP.  CADL tooling also helps produce manifests, and hosting your service in the ProviderHub OneBox environment for local testing and debugging.

For more information on the CADL language and core libraries, see [Getting started with CADL](https://github.com/microsoft/cadl/blob/main/docs/tutorial.md)
 
## Getting Started for ProviderHub (RPaaS) Management Services
- Documentation
  - [RPaaS Project Templates](https://github.com/Azure/cadl-azure/blob/main/packages/cadl-rpaas-templates/README.md)
  - [Getting Started with RPaaS](https://aka.ms/cadl/rpass-start)
- Walkthroughs
  - [Getting Started with CADL for RPaaS](https://microsoft.sharepoint.com/:v:/t/AzureDeveloperExperience/EYTV39X351FAlHb8tIPHdCgB1zgVDUGfcCE2mOoQAlVAcw?e=0D1IIW)
  - [Service Code Generation](https://microsoft.sharepoint.com/:v:/t/AzureDeveloperExperience/EUqfqSySRipChjKAciFLHfMBXHnjti49ZTrLKvHW0UWL-Q?e=EDtBNk)
## Getting Started for Azure Data Plane Services
## More Information
## Help and Questions
