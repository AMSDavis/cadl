//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

namespace Microsoft.Confluent.Service.Models
{
    public struct ResourceProvisioningState 
    {
        string _value;

        public static readonly ResourceProvisioningState Succeeded = "Succeeded", Failed = "Failed", Canceled = "Canceled"; 
        public ResourceProvisioningState( string value)
        {
            _value = value;
        }

        public override string ToString()
        {
            return _value;
        }

        public static implicit operator string( ResourceProvisioningState objValue) => objValue.ToString();
        public static implicit operator ResourceProvisioningState( string other) => new ResourceProvisioningState(other);
    }
}
