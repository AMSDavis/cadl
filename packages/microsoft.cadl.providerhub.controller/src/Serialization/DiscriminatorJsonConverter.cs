// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
using System.Reflection;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json.Serialization;

namespace Microsoft.Cadl.ProviderHub.Controller
{
    /// <summary>
    /// JSON converter for discriminated polymorphic objects.
    /// </summary>
    public class DiscriminatorJsonConverter<T> : JsonConverter where T : class
    {
        /// <summary>
        /// Initializes an instance of the PolymorphicDeserializeJsonConverter.
        /// This T class need to have [Discriminator] attribute;
        /// </summary>
        public DiscriminatorJsonConverter()
        {
            var discriminatorValue = typeof(T).GetCustomAttribute<DiscriminatorAttribute>()?.FieldName;

            if (string.IsNullOrWhiteSpace(discriminatorValue))
            {
                throw new ArgumentException(
                  $"Unable to locate the discriminator information on class {typeof(T).Name}");
            }

            Discriminator = discriminatorValue;
        }

        /// <summary>
        /// Returns false for serialization.
        /// </summary>
        public override bool CanWrite => false;

        /// <summary>
        /// Returns true for deserialization.
        /// </summary>
        public override bool CanRead => true;

        /// <summary>
        /// Discriminator property name.
        /// </summary>
        public string Discriminator { get; }

        /// <summary>
        /// Returns true if the object being deserialized is assignable to the base type. False otherwise.
        /// </summary>
        /// <param name="objectType">The type of the object to check.</param>
        /// <returns>True if the object being deserialized is assignable to the base type. False otherwise.</returns>
        public override bool CanConvert(Type objectType)
        {
            return typeof(T).GetTypeInfo().IsAssignableFrom(objectType.GetTypeInfo())
              && objectType.GetCustomAttributes<DiscriminatorAttribute>()
                .Any(attr => string.Equals(attr?.FieldName, Discriminator, StringComparison.InvariantCultureIgnoreCase));
        }

        /// <summary>Writes the JSON representation of the object.</summary>
        /// <param name="writer">The <see cref="T:Newtonsoft.Json.JsonWriter" /> to write to.</param>
        /// <param name="value">The value.</param>
        /// <param name="serializer">The calling serializer.</param>
        public override void WriteJson(JsonWriter writer, object value, JsonSerializer serializer)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Reads a JSON field and deserializes into an appropriate object based on discriminator
        /// field and object name. If JsonObject attribute is available, its value is used instead.
        /// </summary>
        /// <param name="reader">The JSON reader.</param>
        /// <param name="objectType">The type of the object.</param>
        /// <param name="existingValue">The existing value.</param>
        /// <param name="serializer">The JSON serializer.</param>
        /// <returns></returns>
        public override object ReadJson(JsonReader reader, Type objectType, object existingValue, JsonSerializer serializer)
        {
            if (reader.TokenType == JsonToken.Null)
            {
                return null;
            }

            var item = JObject.Load(reader);
            var discriminatorValue = (string)item[Discriminator];
            if (string.IsNullOrWhiteSpace(discriminatorValue))
            {
                throw new JsonSerializationException($"Unable to find required discriminator field {Discriminator}");
            }

            var resultType = GetDerivedType(objectType, Discriminator, discriminatorValue);
            if (resultType is null)
            {
                throw new JsonSerializationException($"Unrecognized discriminator value {discriminatorValue}.");
            }

            // create instance of correct type
            var contract = (JsonObjectContract)serializer.ContractResolver.ResolveContract(resultType);
            var result = contract.DefaultCreator();
            serializer.Populate(item.CreateReader(), result);

            return result as T;
        }

        private static Type GetDerivedType(Type baseType, string discriminator, string discriminatorValue)
        {
            // Priority check within same assembly
            var baseTypeAssembly = baseType.GetTypeInfo().Assembly;
            var derivedType = GetDerivedTypeFromAssembly(baseTypeAssembly, baseType, discriminator, discriminatorValue);
            if (derivedType != null)
                return derivedType;

            // If not found, then search among all assemblies in the current AppDomain
            foreach (var assembly in AppDomain.CurrentDomain.GetAssemblies().Where(a => a != baseTypeAssembly))
            {
                derivedType = GetDerivedTypeFromAssembly(baseTypeAssembly, baseType, discriminator, discriminatorValue);

                if (derivedType != null)
                    break;
            }

            return derivedType;
        }

        private static Type GetDerivedTypeFromAssembly(Assembly assembly, Type baseType, string discriminator, string discriminatorValue)
        {
            return assembly.DefinedTypes
              .FirstOrDefault(t =>
                baseType.IsAssignableFrom(t)
                && t.GetCustomAttributes<DiscriminatorAttribute>()
                  .Any(attr =>
                    string.Equals(attr?.FieldName, discriminator, StringComparison.InvariantCultureIgnoreCase)
                    && string.Equals(attr?.Value, discriminatorValue, StringComparison.InvariantCultureIgnoreCase)));
        }
    }
}
