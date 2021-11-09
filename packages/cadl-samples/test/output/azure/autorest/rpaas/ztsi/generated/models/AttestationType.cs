//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

namespace Microsoft.ZeroTrustSystemIntegrity.Service.Models
{
    public struct AttestationType 
    {
        string _value;

        public static readonly AttestationType Boot = "Boot", Runtime = "Runtime"; 
        public AttestationType( string value)
        {
            _value = value;
        }

        public override string ToString()
        {
            return _value;
        }

        public static implicit operator string( AttestationType objValue) => objValue.ToString();
        public static implicit operator AttestationType( string other) => new AttestationType(other);
    }
}
