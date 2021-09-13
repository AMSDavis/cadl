//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

namespace Microsoft.Observability.Service.Models
{
    public struct SendingLogsStatus 
    {
        string _value;

        public static readonly SendingLogsStatus Enabled = "Enabled", Disabled = "Disabled"; 
        public SendingLogsStatus( string value)
        {
            _value = value;
        }

        public override string ToString()
        {
            return _value;
        }

        public static implicit operator string( SendingLogsStatus objValue) => objValue.ToString();
        public static implicit operator SendingLogsStatus( string other) => new SendingLogsStatus(other);
    }
}
