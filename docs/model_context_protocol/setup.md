# MCP Server Setup

Setting up a Model Context Protocol (MCP) server involves configuring your environment, creating server instances, and connecting to transport layers. This document provides detailed information on how to set up and run an MCP server using the TypeScript SDK.

## Installation

First, install the MCP SDK in your Node.js project:

```bash
npm install @modelcontextprotocol/sdk
```

## Creating a Server

The core of any MCP implementation is the `McpServer` class:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const server = new McpServer({
  name: "My MCP Server",
  version: "1.0.0"
});
```

## Defining Components

After creating a server instance, you'll need to define your resources, tools, and prompts:

```typescript
// Add resources
server.resource(
  "config",
  "config://app",
  async (uri) => ({
    contents: [{
      uri: uri.href,
      text: "App configuration here"
    }]
  })
);

// Add tools
server.tool(
  "calculate",
  { a: z.number(), b: z.number(), operation: z.enum(["add", "subtract", "multiply", "divide"]) },
  async ({ a, b, operation }) => {
    let result;
    switch(operation) {
      case "add": result = a + b; break;
      case "subtract": result = a - b; break;
      case "multiply": result = a * b; break;
      case "divide": result = a / b; break;
    }
    return {
      content: [{ type: "text", text: String(result) }]
    };
  }
);

// Add prompts
server.prompt(
  "task-analysis",
  { task: z.string() },
  ({ task }) => ({
    messages: [{
      role: "user",
      content: {
        type: "text",
        text: `Please analyze this task and break it down into steps:\n\n${task}`
      }
    }]
  })
);
```

## Transport Options

MCP servers can use different transports depending on your use case:

### stdio Transport

For command-line tools and direct integrations:

```typescript
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const transport = new StdioServerTransport();
await server.connect(transport);
```

This setup allows your server to communicate via standard input/output, making it ideal for command-line applications.

### Streamable HTTP Transport

For web services, the Streamable HTTP transport provides a RESTful interface:

```typescript
import express from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { randomUUID } from "node:crypto";

const app = express();
app.use(express.json());

// Map to store transports by session ID
const transports = {};

app.post('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];
  let transport;

  if (sessionId && transports[sessionId]) {
    transport = transports[sessionId];
  } else if (!sessionId && isInitializeRequest(req.body)) {
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (sessionId) => {
        transports[sessionId] = transport;
      }
    });

    transport.onclose = () => {
      if (transport.sessionId) {
        delete transports[transport.sessionId];
      }
    };

    await server.connect(transport);
  } else {
    res.status(400).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Bad Request: No valid session ID provided',
      },
      id: null,
    });
    return;
  }

  await transport.handleRequest(req, res, req.body);
});

// Handle GET and DELETE requests
app.get('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }
  
  const transport = transports[sessionId];
  await transport.handleRequest(req, res);
});

app.delete('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }
  
  const transport = transports[sessionId];
  await transport.handleRequest(req, res);
});

app.listen(3000, () => {
  console.log('MCP Server running on port 3000');
});
```

You can also implement a stateless version for simpler use cases as described in the [MCP TypeScript SDK documentation](https://github.com/modelcontextprotocol/typescript-sdk).

## Dynamic Server Configuration

MCP servers can be configured dynamically, allowing you to add, update, or remove components based on runtime conditions:

```typescript
// Create a tool that's initially disabled
const sendMessageTool = server.tool(
  "sendMessage",
  { message: z.string() },
  async ({ message }) => ({
    content: [{ type: "text", text: `Message sent: ${message}` }]
  })
);

// Disable the tool until authentication
sendMessageTool.disable();

// Create an authentication tool that enables the send message tool
server.tool(
  "authenticate",
  { token: z.string() },
  async ({ token }) => {
    const isValid = validateToken(token);
    
    if (isValid) {
      // Enable the send message tool after authentication
      sendMessageTool.enable();
      return {
        content: [{ type: "text", text: "Authentication successful" }]
      };
    }
    
    return {
      content: [{ type: "text", text: "Authentication failed" }],
      isError: true
    };
  }
);
```

## Testing and Debugging

For testing and debugging your MCP server, you can use the [MCP Inspector](https://github.com/modelcontextprotocol/inspector), which provides a UI for interacting with your server.

## Example: Simple File Explorer Server

Here's a complete example of a simple file explorer server:

```typescript
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";

const server = new McpServer({
  name: "File Explorer",
  version: "1.0.0"
});

// Resource to list directory contents
server.resource(
  "directory",
  new ResourceTemplate("file://{dirPath}"),
  async (uri, { dirPath }) => {
    try {
      const items = await fs.readdir(decodeURIComponent(dirPath));
      const itemsWithTypes = await Promise.all(
        items.map(async (item) => {
          const stats = await fs.stat(path.join(decodeURIComponent(dirPath), item));
          return `${item} (${stats.isDirectory() ? "directory" : "file"})`;
        })
      );
      
      return {
        contents: [{
          uri: uri.href,
          text: itemsWithTypes.join("\n")
        }]
      };
    } catch (error) {
      return {
        contents: [{
          uri: uri.href,
          text: `Error reading directory: ${error.message}`
        }]
      };
    }
  }
);

// Resource to read file contents
server.resource(
  "file",
  new ResourceTemplate("file://{filePath}/content"),
  async (uri, { filePath }) => {
    try {
      const content = await fs.readFile(decodeURIComponent(filePath), "utf-8");
      return {
        contents: [{
          uri: uri.href,
          text: content
        }]
      };
    } catch (error) {
      return {
        contents: [{
          uri: uri.href,
          text: `Error reading file: ${error.message}`
        }]
      };
    }
  }
);

// Tool to create a new file
server.tool(
  "createFile",
  { path: z.string(), content: z.string() },
  async ({ path, content }) => {
    try {
      await fs.writeFile(path, content);
      return {
        content: [{ type: "text", text: `File created at ${path}` }]
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error creating file: ${error.message}` }],
        isError: true
      };
    }
  }
);

// Start the server with stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);
```

## Next Steps

After setting up your server, you might want to:

1. Explore more advanced server configurations in the [MCP TypeScript SDK documentation](https://github.com/modelcontextprotocol/typescript-sdk)
2. Learn about authentication and authorization options
3. Implement custom error handling and logging
4. Create client applications that connect to your server

For more information on specific components, see the following documents:
- [Resources](./resource.md)
- [Tools](./tool.md)
- [Prompts](./prompt.md) 