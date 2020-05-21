import { NamedValueEntityBaseParameters } from './NamedValueEntityBaseParameters';
/**
 * @description NamedValue Contract properties.
 */
export interface NamedValueUpdateParameterProperties extends NamedValueEntityBaseParameters {
    /**
     * @description Unique name of NamedValue. It may contain only letters, digits, period, dash, and underscore characters.
     */
    displayName: string & MaxLength<256> & MinLength<1> & RegularExpression<"^[A-Za-z0-9-._]+$">;
    /**
     * @description Value of the NamedValue. Can contain policy expressions. It may not be empty or consist only of whitespace.
     */
    value: string & MaxLength<4096> & MinLength<1>;
}
