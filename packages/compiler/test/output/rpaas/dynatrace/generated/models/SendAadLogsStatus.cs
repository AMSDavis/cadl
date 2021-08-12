//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

namespace Microsoft.Observability.Service.Models
{    public struct SendAadLogsStatus    {
        string _value;

        public static readonly SendAadLogsStatus Enabled = "Enabled", Disabled = "Disabled";
        public SendAadLogsStatus( string value)
        {
            _value = value;
        }

        public override string ToString()
        {
            return _value;
        }

        public static implicit operator string( SendAadLogsStatus objValue) => objValue.ToString();
        public static implicit operator SendAadLogsStatus( string other) => new SendAadLogsStatus(other);
    }
}
