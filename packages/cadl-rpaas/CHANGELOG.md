# Change Log - @azure-tools/cadl-rpaas

This log was last generated on Tue, 10 Aug 2021 20:23:04 GMT and should not be manually modified.

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

