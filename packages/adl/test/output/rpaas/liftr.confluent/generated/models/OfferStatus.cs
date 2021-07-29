//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

namespace Microsoft.Confluent.Service.Models
{    public struct OfferStatus    {
        string _value;

        public static readonly OfferStatus Started = "Started", PendingFulfillmentStart = "PendingFulfillmentStart", InProgress = "InProgress", Subscribed = "Subscribed", Suspended = "Suspended", Reinstated = "Reinstated", Succeeded = "Succeeded", Failed = "Failed", Unsubscribed = "Unsubscribed", Updating = "Updating";
        public OfferStatus( string value)
        {
            _value = value;
        }

        public override string ToString()
        {
            return _value;
        }

        public static implicit operator string( OfferStatus objValue) => objValue.ToString();
        public static implicit operator OfferStatus( string other) => new OfferStatus(other);
    }
}
