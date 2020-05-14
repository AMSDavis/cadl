import { Path } from '@azure-tools/sourcemap';
import { fail } from 'assert';
import { Node, Project } from 'ts-morph';
import { ApiModel } from '../model/api-model';

/**
 * returns the best possible identifier for the node
 * @param node the node to create an identifier for.
 */
export function getNodeIdentifier(node: Node) {

  return (<any>node).getName ? (<any>node).getName() : 
    (<any>node).getFilePath ? (<any>node).getFilePath() : 
      (<any>node).getValue ? (<any>node).getValue() : 
        node.getChildIndex(); 
}
/**
 * returns a Path to the node that we can use to find it again.
 * 
 * @param node the node to create the path for.
 */
export function getPath(node: Node, ...args: Path ): Path{
  return [...node.getAncestors().map(getNodeIdentifier),getNodeIdentifier(node),...args];
}

/**
 * gets the node, given the path and the node/project it is relative to.
 */
export function getNode(path: Path, from: Node|Project ): Node | undefined {
  let index = path.shift();
  if( from instanceof Project) {
    from = from.getSourceFile(<string>index)?.getChildAtIndex(0) || fail(`SourceFile ${<string>index} is not in the project`);
    index = path.shift();
  }
  
  const result = (<any>from).getChildren().find((each: any) => { 
    if ((<any>each).getName && (<any>each).getName() === index ) {
      return true;
    }
    if ((<any>each).getValue && (<any>each).getValue() === index) {
      return true;
    }
    return false;
  }) || (typeof index === 'number' ? from.getChildAtIndex(index) : undefined);
  return result && path.length ? getNode( path, result) : result;
}

/**
 * Creates a reference to the node that will reacquire the target if the AST forces the node object to be forgotten or invalid.
 * 
 * @param input the node to create a reference for.
 */
export function referenceTo<T extends Node>(input: T): T { 
  const project = input.getProject();
  let current = input;
  const path = getPath(input);

  return new Proxy(input,{
    get:(originalTarget: T, property: keyof T, proxy: T): any => {
      return Reflect.get(current.wasForgotten() ? (current = <T>getNode([...path], project)) : current, property);
    },
    getOwnPropertyDescriptor: (originalTarget: T, property: keyof T) => {
      return Reflect.getOwnPropertyDescriptor(current.wasForgotten() ? (current = <T>getNode([...path], project)) : current, property);
    },
    has: (originalTarget: T, property: keyof T): boolean => {
      return Reflect.has(current.wasForgotten() ? (current = <T>getNode([...path], project)) : current, property);
    },
    set: (originalTarget: T, property: keyof T, value: any, receiver: any)=> {
      return Reflect.set(current.wasForgotten() ? (current = <T>getNode([...path], project)) : current, property, value);
    }
  });
}

export function project<T extends Node>(input: T): ApiModel {
  return (<any>input.getProject()).api;
}