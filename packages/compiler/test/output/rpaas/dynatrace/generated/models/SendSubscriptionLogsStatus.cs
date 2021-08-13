//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

namespace Microsoft.Observability.Service.Models
{    public struct SendSubscriptionLogsStatus    {
        string _value;

        public static readonly SendSubscriptionLogsStatus Enabled = "Enabled", Disabled = "Disabled";
        public SendSubscriptionLogsStatus( string value)
        {
            _value = value;
        }

        public override string ToString()
        {
            return _value;
        }

        public static implicit operator string( SendSubscriptionLogsStatus objValue) => objValue.ToString();
        public static implicit operator SendSubscriptionLogsStatus( string other) => new SendSubscriptionLogsStatus(other);
    }
}
