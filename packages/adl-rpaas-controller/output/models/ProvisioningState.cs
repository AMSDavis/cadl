//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

namespace Microsoft.Confluent.Service.Models
{
    /// <summary>
    /// Status of the resource.
    /// </summary>
    public struct ProvisioningState
    {
        string _value;

        public static readonly ProvisioningState Creating = "Creating", ResolvingDNS = "ResolvingDNS", Moving = "Moving", Deleting = "Deleting", Succeeded = "Succeeded", Failed = "Failed";
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