//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

namespace Microsoft.Observability.Service.Models
{    public struct VMHostUpdateState    {
        string _value;

        public static readonly VMHostUpdateState Install = "Install", Delete = "Delete";
        public VMHostUpdateState( string value)
        {
            _value = value;
        }

        public override string ToString()
        {
            return _value;
        }

        public static implicit operator string( VMHostUpdateState objValue) => objValue.ToString();
        public static implicit operator VMHostUpdateState( string other) => new VMHostUpdateState(other);
    }
}