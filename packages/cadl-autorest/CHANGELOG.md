# Change Log - @azure-tools/cadl-autorest

This log was last generated on Thu, 16 Dec 2021 08:03:03 GMT and should not be manually modified.

## 0.10.0
Thu, 16 Dec 2021 08:03:03 GMT

### Minor changes

- generate resource provider subfolder

### Patches

- Update emitter to use simplified getAllTags arguments
- Adjust emitter to support new @route model

## 0.9.2
Wed, 01 Dec 2021 22:56:37 GMT

### Patches

- Fix mapping of update method name to HTTP verb

## 0.9.1
Thu, 18 Nov 2021 13:58:37 GMT

### Patches

- Respond to new API changes in @cadl-lang/rest

## 0.9.0
Thu, 11 Nov 2021 21:46:47 GMT

### Minor changes

- **Added** Support for duration type

### Patches

- Define response body for primitive response type

## 0.8.1
Thu, 28 Oct 2021 21:20:34 GMT

### Patches

- Use strict diagnostics
- Fix logic for maxValue decorator
- Sort paths and definitions in cadl-autorest OpenAPI output files

## 0.8.0
Fri, 15 Oct 2021 21:33:37 GMT

### Minor changes

- **Added** Support for server default

## 0.7.0
Fri, 17 Sep 2021 00:49:37 GMT

### Minor changes

- Remove support for multiple inheritance

### Patches

- Updates for cadl namespace addition
- Support for emitting `bytes` and new number types

## 0.6.0
Sat, 21 Aug 2021 00:04:02 GMT

### Minor changes

- Introduce naming convention `$name` for JavaScript-defined Cadl functions and decorators

### Patches

- Allow x-ms-pageable in non-list operations (POST)

## 0.5.1
Fri, 13 Aug 2021 19:10:21 GMT

### Patches

- Fixes for retaining state over multiple compilations, allowing lro extensions, minimizing produces/consumes usage, removing empty response schema, fixes for dictionaries with complex value types

## 0.5.0
Tue, 10 Aug 2021 20:23:04 GMT

### Minor changes

- Rename package to @azure-tools/cadl-autorest

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

