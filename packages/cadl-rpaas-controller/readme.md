# Cadl Service Code Generator for RPaaS
TheCald service code generator for RPaaS creates an abstract UserRP implementation of specs using the cadl-rpaas extension.  Code is generating using ASP.Net MVC framework.  This doc discusses the high-level design, challenges, and remaining work.
## Overview
Service Code is laid out as follows:
- One controller for each resource, containing resource operations
  - Controller is abstract, to ease regeneration
  - Controller contains a validation and completion method for each resource operation
  - Each method has an abstract template method that must be overridden by RP custom code
  - Methods give us scope for default implementations for the service
- One static class containing service routing constants
- A Folder containing operation list functionality
- A Folder containing generated models
- A boilerplate library representing the language implementation of library parts

### Execution
Generation follows this general algorithm:
- Create the top-level ServiceModel from cadl-rpaas metadata
- Populate resources from cadl-rpaas public methods
  - Pre-populate standard operations
- Iterate over the namespaces to collect operations
  - Determine resource association with namespace through cadl-rpaas
  - Get operation verb/path info through cadl-rest
  - Prevent duplication through maps/sets
  - Determine type references
  - Process return types and parameters to create model generation list
- Populate model and enumeration declarations by iterating over generation list
  - Filter out properties that originate in parent classes
- Copy files, and render ServiceModel data through templates to produce c# code
## Type Definitions
ServiceModel
  - service metadata (name, namespace)
  - collection of [Resource]
    - Resource metadata (paths, list)
    - Operations : collection of [Operation]
      - Operation Metadata (name, subpath, verb)
      - ReturnType [TypeReference]
      - [Parameter] collection (ordered)
        - Type [TypeReference]
        - Location
        - Name
  - collection of Models [TypeDefinition]
    - Model metadata (name, namespace)
    - base type [TypeReference]
    - Implements [Collection of [TypeReference]]
    - Properties [Collection of [Property]]
  - collection of Enumerations [Enumeration]
  - [TypeReference]
    - Type metadata (name, namespace)
    - type parameters [TypeReference]
    - builtIn
## Output and Templates
 - Boilerplate c-sharp files for library code
 - Boilerplate templates for Operations
 - ResourceController Template
 - Resource paths template
 - Model Template
 - Closed and Open enumeration templates
## Points of Interest / Questions
- Should we use library types for RPaaS and Cadl primitives? And for which ones?
  - Constraint-related decorators
  - Inheritance / implementation / templating choices per language
- Remove templates?
- Identifying built-in models & operations / models from extensions
  - Operation Resolution
  - Truncating Model resolution / mapping built-in models to language models
- Identify type names for assignment (now alias)
- Managing spread nodes
  - Decorators from spread nodes
- Higher-level representation of Cadl spec
  - Decorator Resolution
  - Collecting Types
  - Operation verbs and subpaths [Rest]
  - Identifying resource operations [RPaaS]
- Logging / tracing in the generator
- Testing Approach
  - Template tests and Model tests
  - End-to-end generation tests
  - Service-level tests
## Remaining Work
### General
- Bring in latest updates from main (assignments, aliases, enumerations)
- Support for default resource
- Support for extension resources
- Versioning prototype
- Factoring out language-agnostic parts
- Command line options for logging, operation list toggle
### Model Generation in C#
- Boilerplate types for all RPaaS models
- C# reserved word protection and renaming scheme
- C# Identifier character set mapping
- Standard handling / prevention of multiple inheritance
  - Extends
  - Templating
  - Spread
- Error models
- Translation for regular expressions / higher level representations
- Refine included namespaces for actual usage
### Dependencies on RPaaS Hosting
- Model serialization
- Logging
- Design for non-resource operations controllers
- Automated error handling
### Validation
- CI Testing
- End-to-end hosting in RPaaS
