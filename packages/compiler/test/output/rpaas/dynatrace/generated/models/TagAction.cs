//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

namespace Microsoft.Observability.Service.Models
{
    public struct TagAction 
    {
        string _value;

        public static readonly TagAction Include = "Include", Exclude = "Exclude"; 
        public TagAction( string value)
        {
            _value = value;
        }

        public override string ToString()
        {
            return _value;
        }

        public static implicit operator string( TagAction objValue) => objValue.ToString();
        public static implicit operator TagAction( string other) => new TagAction(other);
    }
}
