using System.Collections.Generic;
using System.Net;
using System.Net.Http.Json;
using System.Threading.Tasks;
using LoopVisualizerSystem.Controllers;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace LoopVisualizerSystem.Tests
{
    public class ExecutionControllerTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly WebApplicationFactory<Program> _factory;

        public ExecutionControllerTests(WebApplicationFactory<Program> factory)
        {
            _factory = factory;
        }

        [Fact]
        public async Task HealthEndpoint_ReturnsOk()
        {
            var client = _factory.CreateClient();
            var response = await client.GetAsync("api/execution/health");
            response.EnsureSuccessStatusCode();

            var health = await response.Content.ReadFromJsonAsync<PythonHealth>();
            Assert.NotNull(health);
            Assert.False(string.IsNullOrWhiteSpace(health.Message));
        }

        [Fact]
        public async Task RunEndpoint_ReturnsTraceForValidCode()
        {
            var client = _factory.CreateClient();
            var request = new CodeRequest
            {
                Code = "x = 1\ny = x + 2\n"
            };

            var response = await client.PostAsJsonAsync("api/execution/run", request);
            response.EnsureSuccessStatusCode();

            var steps = await response.Content.ReadFromJsonAsync<List<TelemetryStep>>();
            Assert.NotNull(steps);
            Assert.Contains(steps, step => step.SourceLine.Contains("x = 1"));
        }

        [Fact]
        public async Task RunEndpoint_ReturnsErrorForSyntaxError()
        {
            var client = _factory.CreateClient();
            var request = new CodeRequest
            {
                Code = "def foo()\n    return 1\n"
            };

            var response = await client.PostAsJsonAsync("api/execution/run", request);
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var steps = await response.Content.ReadFromJsonAsync<List<TelemetryStep>>();
            Assert.NotNull(steps);
            Assert.Contains(steps, step => step.ErrorType == "SyntaxError");
        }

        [Fact]
        public async Task ReviewTestsEndpoint_ReturnsPassedTestsForValidExpressions()
        {
            var client = _factory.CreateClient();
            var request = new ReviewTestRequest
            {
                Code = "def add(a, b):\n    return a + b\n",
                Tests = new List<ReviewTestCase>
                {
                    new ReviewTestCase { Id = "t1", Name = "add(1,2)", Expression = "add(1, 2)", ExpectedExpression = "3" },
                    new ReviewTestCase { Id = "t2", Name = "add(0,0)", Expression = "add(0, 0)", ExpectedExpression = "0" }
                }
            };

            var response = await client.PostAsJsonAsync("api/execution/review-tests", request);
            response.EnsureSuccessStatusCode();

            var result = await response.Content.ReadFromJsonAsync<ReviewTestResponse>();
            Assert.NotNull(result);
            Assert.True(result.Passed);
            Assert.All(result.Tests, test => Assert.True(test.Passed));
        }

        [Fact]
        public async Task ReviewTestsEndpoint_ReturnsErrorForInvalidExpression()
        {
            var client = _factory.CreateClient();
            var request = new ReviewTestRequest
            {
                Code = "def add(a, b):\n    return a + b\n",
                Tests = new List<ReviewTestCase>
                {
                    new ReviewTestCase { Id = "t1", Name = "missing", Expression = "add(1, )", ExpectedExpression = "2" }
                }
            };

            var response = await client.PostAsJsonAsync("api/execution/review-tests", request);
            response.EnsureSuccessStatusCode();

            var result = await response.Content.ReadFromJsonAsync<ReviewTestResponse>();
            Assert.NotNull(result);
            Assert.False(result.Passed);
            Assert.Single(result.Tests);
            Assert.False(result.Tests[0].Passed);
            Assert.NotEmpty(result.Tests[0].Error);
        }
    }
}
