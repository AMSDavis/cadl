// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Linq;

namespace Cadl.RPaasController.Common
{
    /// <summary>
    /// Validation helper class
    /// </summary>
    public static class ValidationHelpers
    {
        /// <summary>
        /// Validate the model against all delcared validation attributes
        /// </summary>
        /// <typeparam name="T">Type of the model</typeparam>
        /// <param name="model">The model instance</param>
        /// <returns>A instance of ValidationRespones object</returns>
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

            return new ValidationResponse(valid);           
        }
    }
}
