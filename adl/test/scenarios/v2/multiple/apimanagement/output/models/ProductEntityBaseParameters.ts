import { ProductState } from '../ProductState';
/**
 * @description Product Entity Base Parameters
 */
export interface ProductEntityBaseParameters {
    /**
     * @description Product description. May include HTML formatting tags.
     */
    description: any;
    /**
     * @description Product terms of use. Developers trying to subscribe to the product will be presented and required to accept these terms before they can complete the subscription process.
     */
    terms: any;
    /**
     * @description Whether a product subscription is required for accessing APIs included in this product. If true, the product is referred to as "protected" and a valid subscription key is required for a request to an API included in the product to succeed. If false, the product is referred to as "open" and requests to an API included in the product can be made without a subscription key. If property is omitted when creating a new product it's value is assumed to be true.
     */
    subscriptionRequired: any;
    /**
     * @description whether subscription approval is required. If false, new subscriptions will be approved automatically enabling developers to call the product’s APIs immediately after subscribing. If true, administrators must manually approve the subscription before the developer can any of the product’s APIs. Can be present only if subscriptionRequired property is present and has a value of false.
     */
    approvalRequired: any;
    /**
     * @description Whether the number of subscriptions a user can have to this product at the same time. Set to null or omit to allow unlimited per user subscriptions. Can be present only if subscriptionRequired property is present and has a value of false.
     */
    subscriptionsLimit: any;
    /**
     * @description whether product is published or not. Published products are discoverable by users of developer portal. Non published products are visible only to administrators. Default state of Product is notPublished.
     */
    state: ProductState;
}
