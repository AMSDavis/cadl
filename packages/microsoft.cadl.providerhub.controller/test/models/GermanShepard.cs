using Microsoft.Cadl.ProviderHub.Controller;
using Newtonsoft.Json;

namespace ProviderHubControllerTests.Models
{
    [Discriminator("type", "german-shepard")]
    [JsonConverter(typeof(DiscriminatorJsonConverter<Pet>))]
    public class GermanShepard : Dog
    {
        private static readonly string DiscriminatorValue = "german-shepard";

        public GermanShepard()
        {
            Type = DiscriminatorValue;
        }

        [JsonProperty(PropertyName = "isPurebred")]
        public bool IsPurebred { get; set; }
    }
}
