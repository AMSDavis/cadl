//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

namespace Microsoft.Observability.Service.Models
{    public struct MarketplaceSubscriptionStatus    {
        string _value;

        public static readonly MarketplaceSubscriptionStatus Active = "Active", Suspended = "Suspended";
        public MarketplaceSubscriptionStatus( string value)
        {
            _value = value;
        }

        public override string ToString()
        {
            return _value;
        }

        public static implicit operator string( MarketplaceSubscriptionStatus objValue) => objValue.ToString();
        public static implicit operator MarketplaceSubscriptionStatus( string other) => new MarketplaceSubscriptionStatus(other);
    }
}
