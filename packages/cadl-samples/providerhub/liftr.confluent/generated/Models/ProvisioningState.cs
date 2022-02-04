//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

namespace Microsoft.Confluent.Service.Models
{
    /// <summary>
    /// Status of the resource operation.
    /// </summary>
    public struct ProvisioningState
    {
        public static readonly ProvisioningState Completed = "Creating", ResolvingDNS = "ResolvingDNS", Moving = "Moving",
            Deleting = "Deleting", Succeeded = "Succeeded", Failed = "Failed";
        
        string _value;

        public ProvisioningState( string state)
        {
            _value = state;
        }

        public override string ToString()
        {
            return _value;
        }

        public static implicit operator string(ProvisioningState state) => state.ToString();
        public static implicit operator ProvisioningState( string state) => new ProvisioningState(state);
    }
}