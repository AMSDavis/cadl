import { Program } from "../compiler/program";
import { ModelTypeProperty, NamespaceType, Type } from "../compiler/types";

const docs = new Map<Type, string>();

export function doc(program: Program, target: Type, text: string) {
  docs.set(target, text);
}

export function getDoc(target: Type) {
  return docs.get(target);
}

export function inspectType(program: Program, target: Type, text: string) {
  if (text) console.log(text);
  console.dir(target, { depth: 3 });
}

export function inspectTypeName(program: Program, target: Type, text: string) {
  if (text) console.log(text);
  console.log(program.checker!.getTypeName(target));
}

const intrinsics = new Set<Type>();
export function intrinsic(program: Program, target: Type) {
  intrinsics.add(target);
}

export function isIntrinsic(target: Type) {
  return intrinsics.has(target);
}

// Walks the assignmentType chain to find the core intrinsic type, if any
export function getIntrinsicType(target: Type | undefined): string | undefined {
  while (target) {
    if (target.kind === "Model") {
      if (isIntrinsic(target)) {
        return target.name;
      }

      target = (target.assignmentType?.kind === "Model" && target.assignmentType) || undefined;
    } else if (target.kind === "ModelProperty") {
      return getIntrinsicType(target.type);
    } else {
      break;
    }
  }

  return undefined;
}

// -- @format decorator ---------------------

const formatValues = new Map<Type, string>();

export function format(program: Program, target: Type, format: string) {
  if (target.kind === "Model") {
    // Is it a model type that ultimately derives from 'string'?
    if (getIntrinsicType(target) === "string") {
      formatValues.set(target, format);
    } else {
      throw new Error("Cannot apply @format to a non-string type");
    }
  } else {
    throw new Error("Cannot apply @format to anything that isn't a Model");
  }
}

export function getFormat(target: Type): string | undefined {
  return formatValues.get(target);
}

// -- @minLength decorator ---------------------

const minLengthValues = new Map<Type, number>();

export function minLength(program: Program, target: Type, minLength: number) {
  if (target.kind === "Model" || target.kind === "ModelProperty") {
    // Is it a model type that ultimately derives from 'string'?
    if (getIntrinsicType(target) === "string") {
      minLengthValues.set(target, minLength);
    } else {
      throw new Error("Cannot apply @minLength to a non-string type");
    }
  } else {
    throw new Error("Cannot apply @minLength to anything that isn't a Model or ModelProperty");
  }
}

export function getMinLength(target: Type): number | undefined {
  return minLengthValues.get(target);
}

// -- @maxLength decorator ---------------------

const maxLengthValues = new Map<Type, number>();

export function maxLength(program: Program, target: Type, maxLength: number) {
  if (target.kind === "Model" || target.kind === "ModelProperty") {
    // Is it a model type that ultimately derives from 'string'?
    if (getIntrinsicType(target) === "string") {
      maxLengthValues.set(target, maxLength);
    } else {
      throw new Error("Cannot apply @maxLength to a non-string type");
    }
  } else {
    throw new Error("Cannot apply @maxLength to anything that isn't a Model or ModelProperty");
  }
}

export function getMaxLength(target: Type): number | undefined {
  return maxLengthValues.get(target);
}

// -- @secret decorator ---------------------

const secretTypes = new Map<Type, boolean>();

export function secret(program: Program, target: Type) {
  if (target.kind === "Model") {
    // Is it a model type that ultimately derives from 'string'?
    if (getIntrinsicType(target) === "string") {
      secretTypes.set(target, true);
    } else {
      throw new Error("Cannot apply @secret to a non-string type");
    }
  } else {
    throw new Error("Cannot apply @secret to anything that isn't a Model");
  }
}

export function isSecret(target: Type): boolean | undefined {
  return secretTypes.get(target);
}

// -- @visibility decorator ---------------------

const visibilitySettings = new Map<Type, string>();

export function visibility(program: Program, target: Type, visibility: string) {
  if (target.kind === "ModelProperty") {
    visibilitySettings.set(target, visibility);
  } else {
    throw new Error("The @visibility decorator can only be applied to model properties.");
  }
}

export function getVisibility(target: Type): string | undefined {
  return visibilitySettings.get(target);
}

export function withVisibility(program: Program, target: Type, ...visibilities: string[]) {
  if (target.kind !== "Model") {
    throw new Error("The @withVisibility decorator can only be applied to models.");
  }

  const filter = (_: any, prop: ModelTypeProperty) => {
    const vis = getVisibility(prop);
    return vis ? !visibilities.includes(vis) : false;
  };

  mapFilterOut(target.properties, filter);
}

function mapFilterOut(
  map: Map<string, ModelTypeProperty>,
  pred: (key: string, prop: ModelTypeProperty) => boolean
) {
  for (const [key, prop] of map) {
    if (pred(key, prop)) {
      map.delete(key);
    }
  }
}

// -- @list decorator ---------------------

const listProperties = new Set<Type>();

export function list(program: Program, target: Type) {
  if (target.kind === "Operation" || target.kind === "ModelProperty") {
    listProperties.add(target);
  } else {
    throw new Error("The @list decorator can only be applied to interface or model properties.");
  }
}

export function isList(target: Type): boolean {
  return listProperties.has(target);
}

// -- @tag decorator ---------------------
const tagProperties = new Map<Type, string[]>();

// Set a tag on an operation or namespace.  There can be multiple tags on either an
// operation or namespace.
export function tag(program: Program, target: Type, tag: string) {
  if (target.kind === "Operation" || target.kind === "Namespace") {
    const tags = tagProperties.get(target);
    if (tags) {
      tags.push(tag);
    } else {
      tagProperties.set(target, [tag]);
    }
  } else {
    throw new Error("The @tag decorator can only be applied to namespace or operation.");
  }
}

// Return the tags set on an operation or namespace
export function getTags(target: Type): string[] {
  return tagProperties.get(target) || [];
}

// Merge the tags for a operation with the tags that are on the namespace it resides within.
//
// TODO: (JC) We'll need to update this for nested namespaces
export function getAllTags(namespace: NamespaceType, target: Type): string[] | undefined {
  const tags = new Set<string>();

  for (const t of getTags(namespace)) {
    tags.add(t);
  }
  for (const t of getTags(target)) {
    tags.add(t);
  }
  return tags.size > 0 ? Array.from(tags) : undefined;
}
