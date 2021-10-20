using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Microsoft.EnvelopeTest.Service.Models
{
    /// <summary>
    /// The intended executor of the operation; as in Resource Based Access Control (RBAC) and audit logs UX. Default value is \"user,system\".
    /// </summary>
    public struct OperationOrigin
    {
        string _value;

        public static readonly OperationOrigin User = "user", System = "system", UserAndSystem = "user,system";
        public OperationOrigin( string value)
        {
            _value = value;
        }

        public override string ToString()
        {
            return _value;
        }

        public static implicit operator string( OperationOrigin objValue) => objValue.ToString();
        public static implicit operator OperationOrigin( string other) => new OperationOrigin(other);
    }
}
