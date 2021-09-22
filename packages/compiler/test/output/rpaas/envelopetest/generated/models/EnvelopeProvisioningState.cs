//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

namespace Microsoft.EnvelopeTest.Service.Models
{
    public struct EnvelopeProvisioningState 
    {
        string _value;

        public static readonly EnvelopeProvisioningState Working = "Working", Succeeded = "Succeeded", Canceled = "Canceled", Failed = "Failed"; 
        public EnvelopeProvisioningState( string value)
        {
            _value = value;
        }

        public override string ToString()
        {
            return _value;
        }

        public static implicit operator string( EnvelopeProvisioningState objValue) => objValue.ToString();
        public static implicit operator EnvelopeProvisioningState( string other) => new EnvelopeProvisioningState(other);
    }
}
