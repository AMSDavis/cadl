import { SecretAttributes } from './SecretAttributes';
/**
 * @description Properties of the secret
 */
export interface SecretProperties {
    /**
     * @description The value of the secret. NOTE: 'value' will never be returned from the service, as APIs using this model are is intended for internal use in ARM deployments. Users should use the data-plane REST service for interaction with vault secrets.
     */
    value: string;
    /**
     * @description The content type of the secret.
     */
    contentType: string;
    /**
     * @description The attributes of the secret.
     */
    attributes: SecretAttributes;
    /**
     * @description The URI to retrieve the current version of the secret.
     */
    readonly secretUri: string & ;
    /**
     * @description The URI to retrieve the specific version of the secret.
     */
    readonly secretUriWithVersion: string & ;
}
