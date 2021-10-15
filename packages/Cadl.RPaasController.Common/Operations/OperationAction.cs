// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Cadl.RPaasController.Common
{
    /// <summary>
    /// Indicates the action type. \"Internal\" refers to actions that are for internal only APIs.
    /// </summary>
    public struct OperationAction
    {
        string _value;

        /// <summary>
        /// Constant value for Internal operation APIs.
        /// </summary>
        public static readonly OperationAction Internal = "internal";

        /// <summary>
        /// Initializes a new instance of the <see cref="OperationAction"/> class.
        /// </summary>
        /// <param name="value">OperationAction string value</param>
        public OperationAction( string value)
        {
            _value = value;
        }

        /// <inheritdoc />
        public override string ToString()
        {
            return _value;
        }

        /// <summary>
        /// Implicit operator to convert OperationAction to string
        /// </summary>
        /// <param name="objValue">OperationAction object</param>
        public static implicit operator string(OperationAction objValue) => objValue.ToString();

        /// <summary>
        /// Implicit operator to convert string to OperationAction
        /// </summary>
        /// <param name="strValue">string value</param>
        public static implicit operator OperationAction(string strValue) => new OperationAction(strValue);
    }
}
