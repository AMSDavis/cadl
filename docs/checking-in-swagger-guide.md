# Guide for checking in generated swagger to azure-rest-api-specs repo.
This documentation describes how to check in the swagger generated from `cadl` into the [azure-rest-api-specs](https://github.com/Azure/azure-rest-api-specs#azure-rest-api-specifications) which is the canonical source for REST API specifications for Microsoft Azure.

## Authoring cadl and generating swagger

follow the [getting started](../readme.md##Getting-Started)

## Checking into private repo.
New RPaaS Resource provider or new RPaaS api version should be reviewed in the [azure-rest-api-specs-pr](https://github.com/Azure/azure-rest-api-specs-pr) and once it's ready for publishing it to public repository, you can move it to the public repository.

### Prepare and Send a Pull Request for reviewing.

1. Fork and clone the forked 'azure-rest-api-specs-pr' repository. (```https://github.com/azure/azure-rest-api-specs-pr```)

2. Move your generated swagger 'openapi.json' into corresponding api-version folder
refer to the [directory structure](https://github.com/Azure/azure-rest-api-specs#directory-structure) to create a folder to place the swagger.
Example:
``` bash
mkdir -p specification/<your-RP-Name>/resource-manager/Microsoft.<your-RP-Name>/preview/2021-08-01-preview
cp <adl/output/folder>/openapi specification/<your-RP-Name>/resource-manager/Microsoft.<your-RP-Name>/preview/2021-08-01-preview
```
3. Add 'readme' files to the 'resource-manager' folder
the `readme.md` is the configuration file for `autorest` , see [generating client with autorest ](https://github.com/Azure/autorest/blob/main/docs/generate/readme.md#keeping-your-options-in-one-place-the-preferred-option). you should add a `readme.md` with multiple specific language 'readme', like `readme.go.md`

Example:
[network/readme](https://github.com/Azure/azure-rest-api-specs/blob/main/specification/network/resource-manager/readme.md)

4. Send a pull request .
   - commit all you changes.
   - push to the remote forked repo
   - send a pull request to the original repo from your forked repo.

Note:
the target branch of the pull request is RPSaaSMaster (or RPSaaSDev for dogfood).

## Fix the errors of PR reviewing CI checks
The CI checks result will be commented on the PR. you can refer to the [CI fix Guide](https://github.com/Azure/azure-rest-api-specs/blob/main/documentation/ci-fix.md). 

Note:
Since the swagger is generated from cadl, to change the swagger, you must update the cadl file and regenerate the swagger and avoid updating swagger directly to keep the consistency between swagger and cadl.


## Move your PR to public repo.
Once the RP get approved and added label 'Approved-OkToMerge' , you can follow the `last comment` on the PR to publish your specs to the public repo on demand.
