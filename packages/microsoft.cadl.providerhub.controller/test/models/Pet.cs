using Microsoft.Cadl.ProviderHub.Controller;
using Newtonsoft.Json;

namespace ProviderHubControllerTests.Models
{

    /// <summary>
    /// Remark: For service code model, the base class is generated as abstract
    /// For client code model, to support different api versions, the base class
    /// should not be abstract. It should ideally have a property bag for holding
    /// unrecognized properties. This should be verified with each language codegen.
    /// </summary>
    [Discriminator("type", default)]
    [JsonConverter(typeof(DiscriminatorJsonConverter<Pet>))]
    public abstract class Pet
    {
        [JsonProperty(PropertyName = "type")]
        public string Type { get; set; }

        [JsonProperty(PropertyName = "gender")]
        public string Gender { get; set; }

        [JsonProperty(PropertyName = "age")]
        public int Age { get; set; }
    }
}
