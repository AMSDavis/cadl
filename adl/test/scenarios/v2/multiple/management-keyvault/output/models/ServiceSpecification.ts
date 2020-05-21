import { LogSpecification } from './LogSpecification';
/**
 * @description One property of operation, include log specifications.
 */
export interface ServiceSpecification {
    /**
     * @description Log specifications of operation.
     */
    logSpecifications: Array<LogSpecification>;
}
