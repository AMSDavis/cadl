using Microsoft.Cadl.ProviderHub.Controller;
using Newtonsoft.Json;

namespace ProviderHubControllerTests.Models
{
    [Discriminator("type", "Cat")]
    [JsonConverter(typeof(DiscriminatorJsonConverter<Pet>))]
    public class Cat : Pet
    {
        private static readonly string DiscriminatorValue = "Cat";

        public Cat()
        {
            Type = DiscriminatorValue;
        }

        [JsonProperty(PropertyName = "acfaBreed")]
        public string AcfaBreed { get; set; }

        [JsonProperty(PropertyName = "acfaId")]
        public string AcfaId { get; set; }

        [JsonProperty(PropertyName = "longhair")]
        public bool IsLongHair { get; set; }
    }
}
