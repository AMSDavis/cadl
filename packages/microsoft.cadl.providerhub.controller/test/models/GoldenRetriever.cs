using Microsoft.Cadl.ProviderHub.Controller;
using Newtonsoft.Json;

namespace ProviderHubControllerTests.Models.Other
{
    [Discriminator("type", "golden-retriever")]
    [JsonConverter(typeof(DiscriminatorJsonConverter<Pet>))]
    public class GoldenRetriever : Dog
    {
        private static readonly string DiscriminatorValue = "golden-retriever";

        public GoldenRetriever()
        {
            Type = DiscriminatorValue;
        }

        [JsonProperty(PropertyName = "coatColor")]
        public string CoatColor { get; set; }
    }
}
