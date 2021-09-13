//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

namespace Microsoft.FluidRelay.Service.Models
{
    public struct KeyName 
    {
        string _value;

        public static readonly KeyName key1 = "key1", key2 = "key2"; 
        public KeyName( string value)
        {
            _value = value;
        }

        public override string ToString()
        {
            return _value;
        }

        public static implicit operator string( KeyName objValue) => objValue.ToString();
        public static implicit operator KeyName( string other) => new KeyName(other);
    }
}
