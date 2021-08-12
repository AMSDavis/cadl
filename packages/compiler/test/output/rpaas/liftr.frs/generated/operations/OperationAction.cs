using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Microsoft.FluidRelay.Service.Models
{
    /// <summary>
    /// Indicates the action type. \"Internal\" refers to actions that are for internal only APIs.
    /// </summary>
    public struct OperationAction
    {
        string _value;

        public static readonly OperationAction Internal = "internal";
        public OperationAction( string value)
        {
            _value = value;
        }

        public override string ToString()
        {
            return _value;
        }

        public static implicit operator string( OperationAction objValue) => objValue.ToString();
        public static implicit operator OperationAction( string other) => new OperationAction(other);
    }
}
