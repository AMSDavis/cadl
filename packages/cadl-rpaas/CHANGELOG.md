# Change Log - @azure-tools/cadl-rpaas

This log was last generated on Wed, 01 Dec 2021 22:56:37 GMT and should not be manually modified.

## 0.10.3
Wed, 01 Dec 2021 22:56:37 GMT

### Patches

- export resource type.

## 0.10.2
Thu, 18 Nov 2021 13:58:37 GMT

### Patches

- Fix warning punctuation and squiggle more specific node
- Respond to new API changes in @cadl-lang/rest

## 0.10.1
Thu, 11 Nov 2021 21:46:47 GMT

_Version update only_

## 0.10.0
Thu, 28 Oct 2021 21:20:34 GMT

### Minor changes

- **Added** new `OmitDefaults` type to remove default values of a model

### Patches

- add checks: no-underscore-in-operation-name,no-repeated-resource-in-operation,add no-inline-model,model-requires-documentation,property-requires-documentation,operation-requires-documentation,documentation-different-with-node-name.
- Move service host default to RPaaS layer

## 0.9.0
Fri, 15 Oct 2021 21:33:37 GMT

### Minor changes

- Move all types and decorators into Azure.ARM namespace
- Add ARM envelope optional properties

### Patches

- Improve messages for provisioningState checks
- Remove unneeded http headers from base response #815
- Strongly defined diagnostics
- Make nextLink optional in pageable response
- Update scaffolding to include service code generator

## 0.8.0
Fri, 17 Sep 2021 00:49:37 GMT

### Minor changes

- Added a check for the existence of a 'provisioningState' property in any properties type for a resource derived from TrackedResource<T>.
- Remove support for multiple inheritance

### Patches

- Capture standard operation parameter descriptions
- Added documentation and scaffolding template
- Update extension definition to use common types

## 0.7.0
Sat, 21 Aug 2021 00:04:02 GMT

### Minor changes

- Introduce naming convention `$name` for JavaScript-defined Cadl functions and decorators

### Patches

- Flatten PATCH models

## 0.6.1
Fri, 13 Aug 2021 19:10:21 GMT

### Patches

- Added support for Managed Identity, fix documentation issues, fix patch bodies, add required lro support for put and delete

## 0.6.0
Tue, 10 Aug 2021 20:23:04 GMT

### Minor changes

- React to package renames

## 0.5.1
Mon, 09 Aug 2021 21:14:12 GMT

_Version update only_

## 0.5.0
Mon, 02 Aug 2021 18:17:00 GMT

### Minor changes

- Rename ADL to Cadl

## 0.4.2
Wed, 28 Jul 2021 19:40:06 GMT

### Patches

- Add additional api to support code generation and fix modeling of resources and non-content responses.

## 0.4.1
Fri, 09 Jul 2021 20:21:06 GMT

### Patches

- Include 204 NoContent response with generated DELETE operations
- Improve "Update" type generation for PATCH operations to include properties of all resource types

## 0.4.0
Thu, 24 Jun 2021 03:57:43 GMT

### Minor changes

- Add semantic error recovery

### Patches

- Generate proper request body for standard RPaaS update operation

## 0.3.1
Tue, 18 May 2021 23:43:31 GMT

_Version update only_

## 0.3.0
Thu, 06 May 2021 14:56:01 GMT

### Minor changes

- Implement alias and enum, remove model =

### Patches

- **Added** ArmCreatedResponse type
- Add expected response types for the ARM resource delete operation
- Make systemData property optional for resource types
- Replace several internal compiler errors with diagnostics

## 0.2.0
Tue, 20 Apr 2021 15:23:29 GMT

### Minor changes

- Redesign ARM modelling using the new @armResource decorator and base resource types

### Patches

- Add systemData property to base ARM resource types

