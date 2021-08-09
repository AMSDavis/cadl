# Change Log - @azure-tools/cadl-openapi

This log was last generated on Mon, 09 Aug 2021 21:14:12 GMT and should not be manually modified.

## 0.4.1
Mon, 09 Aug 2021 21:14:12 GMT

_Version update only_

## 0.4.0
Mon, 02 Aug 2021 18:17:00 GMT

### Minor changes

- Rename ADL to Cadl

## 0.3.2
Wed, 28 Jul 2021 19:40:06 GMT

### Patches

- Fix swagger generation bugs for empt schema and support host property

## 0.3.1
Fri, 09 Jul 2021 20:21:06 GMT

### Patches

- Catch ErrorType instances while walking ADL types so that it's easier to diagnose syntax issues in source files
- Absorb base templated model instance into derived type's schema definition when it's the only base type

## 0.3.0
Thu, 24 Jun 2021 03:57:43 GMT

### Minor changes

- Add semantic error recovery

### Patches

- Fix decorator application to OpenAPI output when the target is a model property or operation parameter

## 0.2.1
Tue, 18 May 2021 23:43:31 GMT

_Version update only_

## 0.2.0
Thu, 06 May 2021 14:56:01 GMT

### Minor changes

- Implement alias and enum, remove model =

### Patches

- Replace several internal compiler errors with diagnostics

## 0.1.2
Tue, 20 Apr 2021 15:23:29 GMT

### Patches

- Trim base service namespace from parameter definition names
- Use new virtual file to emit output

