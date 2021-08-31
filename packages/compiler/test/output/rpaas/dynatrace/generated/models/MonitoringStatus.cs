//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

namespace Microsoft.Observability.Service.Models
{
    public struct MonitoringStatus 
    {
        string _value;

        public static readonly MonitoringStatus Enabled = "Enabled", Disabled = "Disabled"; 
        public MonitoringStatus( string value)
        {
            _value = value;
        }

        public override string ToString()
        {
            return _value;
        }

        public static implicit operator string( MonitoringStatus objValue) => objValue.ToString();
        public static implicit operator MonitoringStatus( string other) => new MonitoringStatus(other);
    }
}
