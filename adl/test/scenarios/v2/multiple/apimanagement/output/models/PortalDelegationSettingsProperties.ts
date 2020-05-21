import { RegistrationDelegationSettingsProperties } from './RegistrationDelegationSettingsProperties';
import { SubscriptionsDelegationSettingsProperties } from './SubscriptionsDelegationSettingsProperties';
/**
 * @description Delegation settings contract properties.
 */
export interface PortalDelegationSettingsProperties {
    /**
     * @description A delegation Url.
     */
    url: string;
    /**
     * @description A base64-encoded validation key to validate, that a request is coming from Azure API Management.
     */
    validationKey: string;
    /**
     * @description Subscriptions delegation settings.
     */
    subscriptions: SubscriptionsDelegationSettingsProperties;
    /**
     * @description User registration delegation settings.
     */
    userRegistration: RegistrationDelegationSettingsProperties;
}
