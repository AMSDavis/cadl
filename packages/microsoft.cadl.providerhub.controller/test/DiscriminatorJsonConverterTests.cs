// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using NUnit.Framework;
using ProviderHubControllerTests.Models;
using ProviderHubControllerTests.Models.Other;

namespace ProviderHubControllerTests
{
    [TestFixture]
    public class DiscriminatorJsonConverterTests
    {
        [SetUp]
        public void Init()
        {
        }

        [TestCase("dog", "{'akcBreed':'Cavapoo','akcId':'A10000','type':'Dog','gender':'F','age':2}")]
        [TestCase("cat", "{'acfaBreed':'Persian','acfaId':'B9999','longhair':false,'type':'Cat','gender':'M','age':7}")]
        [TestCase("german-shepard", "{'isPurebred': true, 'akcBreed':'Cavapoo','akcId':'A10000','type':'german-shepard','gender':'F','age':2}")]
        [TestCase("golden-retriever", "{'coatColor': 'Red','akcBreed':'Cavapoo','akcId':'A10000','type':'golden-retriever','gender':'F','age':2}")]
        public void SerializeSingle(string type, string jsonResult)
        {
            Pet p = GeneratePet(type);
            var jsonStr = JsonConvert.SerializeObject(p);
            Assert.IsTrue(JObject.DeepEquals(JToken.Parse(jsonResult), JToken.Parse(jsonStr)));
        }

        [TestCase("dog", "{'akcBreed':'Cavapoo','akcId':'A10000','type':'Dog','gender':'F','age':2}")]
        [TestCase("cat", "{'acfaBreed':'Persian','acfaId':'B9999','longhair':false,'type':'Cat','gender':'M','age':7}")]
        [TestCase("german-shepard", "{'isPurebred': true, 'akcBreed':'Cavapoo','akcId':'A10000','type':'german-shepard','gender':'F','age':2}")]
        [TestCase("golden-retriever", "{'coatColor': 'Red','akcBreed':'Cavapoo','akcId':'A10000','type':'golden-retriever','gender':'F','age':2}")]
        public void DeserializeSingle(string type, string jsonResult)
        {
            var petObj = JsonConvert.DeserializeObject<Pet>(jsonResult);

            Pet p = GeneratePet(type);
            var jsonStr = JsonConvert.SerializeObject(p);
            Assert.IsTrue(petObj.GetType() == p.GetType());
        }

        [TestCase("{'type':'anythingelse','gender':null,'age':1000}")]
        public void InvalidDiscriminatorDeserialize(string jsonResult)
        {
            try
            {
                var petObj = JsonConvert.DeserializeObject<Pet>(jsonResult);
                Assert.Fail("Invalid discriminator exception not thrown");
            }
            catch (JsonSerializationException e)
            {
                Assert.IsTrue(e.Message.Contains("Unrecognized discriminator value"));
                return;
            }
        }

        [TestCase]
        public void TestNestedCase()
        {
            var pets = new List<Pet>();
            var owner = new Owner { Pets = pets, Name = "John" };
            pets.Add(GeneratePet("dog"));
            pets.Add(GeneratePet("cat"));
            pets.Add(GeneratePet("german-shepard"));
            pets.Add(GeneratePet("golden-retriever"));
            owner.Favorite = pets.First();

            var jsonStr = JsonConvert.SerializeObject(owner);
            var expected = @"
          {
              'type': 'John',
              'pets': [{
                      'akcBreed': 'Cavapoo',
                      'akcId': 'A10000',
                      'type': 'Dog',
                      'gender': 'F',
                      'age': 2
                  }, {
                      'acfaBreed': 'Persian',
                      'acfaId': 'B9999',
                      'longhair': false,
                      'type': 'Cat',
                      'gender': 'M',
                      'age': 7
                  }, {
                      'isPurebred': true,
                      'akcBreed': 'Cavapoo',
                      'akcId': 'A10000',
                      'type': 'german-shepard',
                      'gender': 'F',
                      'age': 2
                  }, {
                      'coatColor': 'Red',
                      'akcBreed': 'Cavapoo',
                      'akcId': 'A10000',
                      'type': 'golden-retriever',
                      'gender': 'F',
                      'age': 2
                  }
              ],
              'favorite': {
                  'akcBreed': 'Cavapoo',
                  'akcId': 'A10000',
                  'type': 'Dog',
                  'gender': 'F',
                  'age': 2
              }
          }";
            Assert.IsTrue(JObject.DeepEquals(JToken.Parse(jsonStr), JToken.Parse(expected)));

            var rtOwner = JsonConvert.DeserializeObject<Owner>(jsonStr);
            Assert.IsTrue(rtOwner != null);
            Assert.IsTrue(rtOwner.Pets != null);
            Assert.IsTrue(rtOwner.Favorite.GetType().Name == "Dog");
            Assert.IsTrue(rtOwner.Pets.Select(p => p.GetType().Name).Distinct().Count() == 4);
        }

        private Pet GeneratePet(string type) => type
        switch
        {
            "dog" => new Dog { Age = 2, AkcBreed = "Cavapoo", AkcId = "A10000", Gender = "F" },
            "cat" => new Cat { Age = 7, AcfaBreed = "Persian", AcfaId = "B9999", Gender = "M" },
            "german-shepard" => new GermanShepard { Age = 2, AkcBreed = "Cavapoo", AkcId = "A10000", Gender = "F", IsPurebred = true },
            "golden-retriever" => new GoldenRetriever { Age = 2, AkcBreed = "Cavapoo", AkcId = "A10000", Gender = "F", CoatColor = "Red" },
            _ =>
             throw new ArgumentException("invalid type")
        };
    }
}
