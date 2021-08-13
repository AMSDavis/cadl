//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

namespace Microsoft.Observability.Service.Models
{    public struct LiftrResourceCategories    {
        string _value;

        public static readonly LiftrResourceCategories Unknown = "Unknown", MonitorLogs = "MonitorLogs";
        public LiftrResourceCategories( string value)
        {
            _value = value;
        }

        public override string ToString()
        {
            return _value;
        }

        public static implicit operator string( LiftrResourceCategories objValue) => objValue.ToString();
        public static implicit operator LiftrResourceCategories( string other) => new LiftrResourceCategories(other);
    }
}
