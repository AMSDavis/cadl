//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

namespace Microsoft.ZeroTrustSystemIntegrity.Service.Models
{
    public struct ManagedIdentityType 
    {
        string _value;

        public static readonly ManagedIdentityType None = "None", SystemAssigned = "SystemAssigned", UserAssigned = "UserAssigned", SystemAssigned,UserAssigned = "SystemAssigned,UserAssigned"; 
        public ManagedIdentityType( string value)
        {
            _value = value;
        }

        public override string ToString()
        {
            return _value;
        }

        public static implicit operator string( ManagedIdentityType objValue) => objValue.ToString();
        public static implicit operator ManagedIdentityType( string other) => new ManagedIdentityType(other);
    }
}
