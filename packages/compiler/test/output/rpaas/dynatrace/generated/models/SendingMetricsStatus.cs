//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

namespace Microsoft.Observability.Service.Models
{
    public struct SendingMetricsStatus 
    {
        string _value;

        public static readonly SendingMetricsStatus Enabled = "Enabled", Disabled = "Disabled"; 
        public SendingMetricsStatus( string value)
        {
            _value = value;
        }

        public override string ToString()
        {
            return _value;
        }

        public static implicit operator string( SendingMetricsStatus objValue) => objValue.ToString();
        public static implicit operator SendingMetricsStatus( string other) => new SendingMetricsStatus(other);
    }
}
