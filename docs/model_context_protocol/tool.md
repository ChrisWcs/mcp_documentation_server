# Tools in Model Context Protocol

Tools in MCP let LLMs take actions through your server. Unlike resources, tools are expected to perform computation and have side effects.

## Basic Usage

Creating a simple tool with parameters:

```typescript
server.tool(
  "calculate-bmi",
  {
    weightKg: z.number(),
    heightM: z.number()
  },
  async ({ weightKg, heightM }) => ({
    content: [{
      type: "text",
      text: String(weightKg / (heightM * heightM))
    }]
  })
);
```

Async tool with external API call:

```typescript
server.tool(
  "fetch-weather",
  { city: z.string() },
  async ({ city }) => {
    const response = await fetch(`https://api.weather.com/${city}`);
    const data = await response.text();
    return {
      content: [{ type: "text", text: data }]
    };
  }
);
```

## Examples

### Echo Tool

```typescript
server.tool(
  "echo",
  { message: z.string() },
  async ({ message }) => ({
    content: [{ type: "text", text: `Tool echo: ${message}` }]
  })
);
```

### SQLite Query Tool

```typescript
server.tool(
  "query",
  { sql: z.string() },
  async ({ sql }) => {
    const db = getDb();
    try {
      const results = await db.all(sql);
      return {
        content: [{
          type: "text",
          text: JSON.stringify(results, null, 2)
        }]
      };
    } catch (err: unknown) {
      const error = err as Error;
      return {
        content: [{
          type: "text",
          text: `Error: ${error.message}`
        }],
        isError: true
      };
    } finally {
      await db.close();
    }
  }
);
```

## Dynamic Tools

You can add, update, remove, enable, or disable tools after server initialization:

```typescript
const putMessageTool = server.tool(
  "putMessage",
  { channel: z.string(), message: z.string() },
  async ({ channel, message }) => ({
    content: [{ type: "text", text: await putMessage(channel, string) }]
  })
);
// Disable a tool (won't show up in listTools)
putMessageTool.disable()

// Later enable it
putMessageTool.enable()

// Update a tool's parameters
upgradeAuthTool.update({
  paramSchema: { permission: z.enum(["admin"]) },
})

// Remove a tool completely
upgradeAuthTool.remove()
```

## Client-Side Tool Usage

To call a tool from a client:

```typescript
// Call a tool
const result = await client.callTool({
  name: "example-tool",
  arguments: {
    arg1: "value"
  }
});
```

## Error Handling

Tools can return errors by setting the `isError` flag:

```typescript
try {
  // Tool implementation
  return {
    content: [{ type: "text", text: "Success result" }]
  };
} catch (err) {
  return {
    content: [{ type: "text", text: `Error: ${err.message}` }],
    isError: true
  };
}
``` 