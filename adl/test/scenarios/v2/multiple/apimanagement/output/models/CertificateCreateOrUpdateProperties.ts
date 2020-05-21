
/**
 * @description Parameters supplied to the CreateOrUpdate certificate operation.
 */
export interface CertificateCreateOrUpdateProperties {
    /**
     * @description Base 64 encoded certificate using the application/x-pkcs12 representation.
     */
    data?: string;
    /**
     * @description Password for the Certificate
     */
    password?: string;
}
