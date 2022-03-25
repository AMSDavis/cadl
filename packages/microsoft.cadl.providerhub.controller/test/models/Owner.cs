using System.Collections.Generic;
using Microsoft.Cadl.ProviderHub.Controller;
using Newtonsoft.Json;

namespace ProviderHubControllerTests.Models
{
    public class Owner
    {
        [JsonProperty(PropertyName = "type")]
        public string Name { get; set; }

        [JsonProperty(PropertyName = "pets")]
        public IList<Pet> Pets { get; set; }

        [JsonProperty(PropertyName = "favorite")]
        public Pet Favorite { get; set; }
    }
}
