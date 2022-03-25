using Microsoft.Cadl.ProviderHub.Controller;
using Newtonsoft.Json;

namespace ProviderHubControllerTests.Models
{
    [Discriminator("type", "Dog")]
    [JsonConverter(typeof(DiscriminatorJsonConverter<Pet>))]
    public class Dog : Pet
    {
        private static readonly string DiscriminatorValue = "Dog";

        public Dog()
        {
            Type = DiscriminatorValue;
        }

        [JsonProperty(PropertyName = "akcBreed")]
        public string AkcBreed { get; set; }

        [JsonProperty(PropertyName = "akcId")]
        public string AkcId { get; set; }
    }
}
