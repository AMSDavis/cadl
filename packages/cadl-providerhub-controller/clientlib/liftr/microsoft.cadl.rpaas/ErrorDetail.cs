using System;

namespace Microsoft.Cadl.ProviderHub
{
    public class ErrorDetail 
    {
        public string Code { get; set;}
        public string Message { get; set;}
        public string Target { get; set;}
        public ErrorDetail[] Details { get; set;}
        public ErrorAdditionalInfo[] AdditionalInfo { get; set;}
    }
}