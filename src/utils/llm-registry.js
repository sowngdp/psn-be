var createOpenAI = require("@ai-sdk/openai").createOpenAI;
var createMistral = require("@ai-sdk/mistral").createMistral;
var createGoogleGenerativeAI = require("@ai-sdk/google").createGoogleGenerativeAI;
var createProviderRegistry = require("ai").createProviderRegistry;

var LLM_REGISTRY = createProviderRegistry({
    openai: createOpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    }),
    google: createGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_API_KEY,
    }),
    mistral: createMistral({
        apiKey: process.env.MISTRAL_API_KEY,
    }),
},{
    separator: ".",
});

module.exports = {
    LLM_REGISTRY: LLM_REGISTRY
};
