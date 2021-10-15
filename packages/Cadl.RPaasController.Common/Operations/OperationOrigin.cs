// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Cadl.RPaasController.Common
{
    /// <summary>
    /// The intended executor of the operation; as in Resource Based Access Control (RBAC) and audit logs UX. Default value is \"user,system\".
    /// </summary>
    public struct OperationOrigin
    {
        string _value;

        public static readonly OperationOrigin User = "user", System = "system", UserAndSystem = "user,system";

        /// <summary>
        /// 
        /// </summary>
        /// <param name="value"></param>
        public OperationOrigin( string value)
        {
            _value = value;
        }

        /// <inheritdoc/>
        public override string ToString()
        {
            return _value;
        }

        /// <summary>
        /// Implicit operator to convert OperationOrigin to string
        /// </summary>
        /// <param name="objValue">OperationOrigin object</param>
        public static implicit operator string( OperationOrigin objValue) => objValue.ToString();

        /// <summary>
        /// Implicit operator to convert string to OperationOrigin
        /// </summary>
        /// <param name="other">string value</param>
        public static implicit operator OperationOrigin( string other) => new OperationOrigin(other);
    }
}
