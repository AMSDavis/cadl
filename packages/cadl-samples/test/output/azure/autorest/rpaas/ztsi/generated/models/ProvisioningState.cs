//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

namespace Microsoft.ZeroTrustSystemIntegrity.Service.Models
{
    public struct ProvisioningState 
    {
        string _value;

        public static readonly ProvisioningState Accepted = "Accepted", Creating = "Creating", Updating = "Updating", Deleting = "Deleting", Succeeded = "Succeeded", Failed = "Failed", Canceled = "Canceled", Deleted = "Deleted", NotSpecified = "NotSpecified"; 
        public ProvisioningState( string value)
        {
            _value = value;
        }

        public override string ToString()
        {
            return _value;
        }

        public static implicit operator string( ProvisioningState objValue) => objValue.ToString();
        public static implicit operator ProvisioningState( string other) => new ProvisioningState(other);
    }
}
