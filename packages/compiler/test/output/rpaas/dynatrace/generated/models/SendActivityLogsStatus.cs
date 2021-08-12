//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

namespace Microsoft.Observability.Service.Models
{    public struct SendActivityLogsStatus    {
        string _value;

        public static readonly SendActivityLogsStatus Enabled = "Enabled", Disabled = "Disabled";
        public SendActivityLogsStatus( string value)
        {
            _value = value;
        }

        public override string ToString()
        {
            return _value;
        }

        public static implicit operator string( SendActivityLogsStatus objValue) => objValue.ToString();
        public static implicit operator SendActivityLogsStatus( string other) => new SendActivityLogsStatus(other);
    }
}
