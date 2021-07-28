using System;
using System.Linq;

namespace Microsoft.Adl.RPaaS
{
    public static class ValidationHelpers
    {
        public static ValidationResponse ValidateModel<T>(T model)
        {
            bool valid = true;
            foreach (var property in model.GetType().GetProperties())
            {
                foreach (var attribute in property.GetCustomAttributes(true).Where(a => a is IValidationAttribute))
                {
                    var validator = attribute as IValidationAttribute;
                    valid = valid && validator.Validate(property.GetValue(model) as string);
                }
            }

            return new ValidationResponse { Valid = valid };           
        }

    }
}
