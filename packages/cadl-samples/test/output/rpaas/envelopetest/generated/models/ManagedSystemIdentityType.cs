//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

namespace Microsoft.EnvelopeTest.Service.Models
{
    public struct ManagedSystemIdentityType 
    {
        string _value;

        public static readonly ManagedSystemIdentityType None = "None", SystemAssigned = "SystemAssigned"; 
        public ManagedSystemIdentityType( string value)
        {
            _value = value;
        }

        public override string ToString()
        {
            return _value;
        }

        public static implicit operator string( ManagedSystemIdentityType objValue) => objValue.ToString();
        public static implicit operator ManagedSystemIdentityType( string other) => new ManagedSystemIdentityType(other);
    }
}