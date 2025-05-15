# Model Context Protocol Overview

The Model Context Protocol (MCP) allows applications to provide context for Large Language Models (LLMs) in a standardized way, separating the concerns of providing context from the actual LLM interaction.

## Key Concepts

MCP enables your application to:

- **Provide Data Context**: Expose information from your application through Resources
- **Enable Actions**: Let LLMs perform operations in your app through Tools
- **Define Interactions**: Create reusable prompt templates through Prompts
- **Standardize Communication**: Use a consistent protocol for all LLM context needs

## Core Components

### Resources

Resources expose data to LLMs, similar to GET endpoints in a REST API. They provide information but don't perform significant computation or have side effects.

See [resource.md](./resource.md) for more details or use:
```typescript
getDetailedDocFor({ project: "model_context_protocol", document: "resource" })
```

### Tools

Tools let LLMs take actions through your server. Unlike resources, tools are expected to perform computation and have side effects.

See [tool.md](./tool.md) for more details or use:
```typescript
getDetailedDocFor({ project: "model_context_protocol", document: "tool" })
```

### Prompts

Prompts are reusable templates that help LLMs interact with your server effectively. They provide structured ways to format messages for LLM communication.

See [prompt.md](./prompt.md) for more details or use:
```typescript
getDetailedDocFor({ project: "model_context_protocol", document: "prompt" })
```

### Server Setup

Setting up an MCP server involves configuring your environment, creating server instances, defining resources/tools/prompts, and connecting to a transport layer (like stdio or HTTP). The server acts as the foundation for all MCP interactions.

See [setup.md](./setup.md) for more details or use:
```typescript
getDetailedDocFor({ project: "model_context_protocol", document: "setup" })
```

## Basic Implementation

To use MCP in your application, you need to:

1. Set up an MCP server
2. Define your resources, tools, and/or prompts
3. Connect your server to a transport (stdio, HTTP, etc.)
4. Clients can then connect to your server to access the defined capabilities

For detailed implementation instructions, refer to the [MCP TypeScript SDK documentation](https://github.com/modelcontextprotocol/typescript-sdk). 