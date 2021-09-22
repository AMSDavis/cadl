//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

namespace Microsoft.EnvelopeTest.Service.Models
{
    public struct SkuTier 
    {
        string _value;

        public static readonly SkuTier Free = "Free", Basic = "Basic", Standard = "Standard", Premium = "Premium"; 
        public SkuTier( string value)
        {
            _value = value;
        }

        public override string ToString()
        {
            return _value;
        }

        public static implicit operator string( SkuTier objValue) => objValue.ToString();
        public static implicit operator SkuTier( string other) => new SkuTier(other);
    }
}
