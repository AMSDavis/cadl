//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

namespace Microsoft.FluidRelay.Service.Models
{    public struct ProvisioningState    {
        string _value;

        public static readonly ProvisioningState Succeeded = "Succeeded", Failed = "Failed", Cancelled = "Cancelled";
        public ProvisioningState( string value)
        {
            _value = value;
        }

        public override string ToString()
        {
            return _value;
        }

        public static implicit operator string( ProvisioningState objValue) => objValue.ToString();
        public static implicit operator ProvisioningState( string other) => new ProvisioningState(other);
    }
}
