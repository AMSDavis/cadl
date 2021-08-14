//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

namespace Microsoft.Observability.Service.Models
{    public struct SingleSignOnStates    {
        string _value;

        public static readonly SingleSignOnStates Initial = "Initial", Enable = "Enable", Disable = "Disable", Existing = "Existing";
        public SingleSignOnStates( string value)
        {
            _value = value;
        }

        public override string ToString()
        {
            return _value;
        }

        public static implicit operator string( SingleSignOnStates objValue) => objValue.ToString();
        public static implicit operator SingleSignOnStates( string other) => new SingleSignOnStates(other);
    }
}
