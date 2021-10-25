// ------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// ------------------------------------------------------------
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace {Provider}
{
    /// <summary>
    /// The entry point class.
    /// </summary>
    public static class Program
    {
      /// <summary>
      /// The main function.
      /// </summary>
      /// <param name="args">Main args.</param>
      public static void Main(string[] args) {
        CreateHostBuilder(args).Build().Run();
      }

      public static IHostBuilder CreateHostBuilder(string[] args) =>
          Host.CreateDefaultBuilder(args)
              .ConfigureWebHostDefaults(webBuilder => {
                webBuilder.UseStartup<Startup>();
              });
    }
}
