//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

namespace Microsoft.Confluent.Service.Models
{
    /// <summary>
    /// SaaS offer ststus.
    /// </summary>
    public struct OfferStatus
    {
        string _value;

        public static readonly OfferStatus Started = "Started", PendingFulfillmentStart = "PendingFulfillmentStart",
            InProgress = "InProgress", Subscribed = "Subscribed", Suspended = "Suspended", Reinstated = "Reinstated",
            Succeeded = "Succeeded", Failed = "Failed", Unsubscribed = "Unsubscribed", Updating = "Updating";
        public OfferStatus( string status)
        {
            _value = status;
        }

        public override string ToString()
        {
            return _value;
        }

        public static implicit operator string( OfferStatus status) => status.ToString();
        public static implicit operator OfferStatus( string status) => new OfferStatus(status);
    }
}