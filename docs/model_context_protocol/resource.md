# Resources in Model Context Protocol

Resources are how you expose data to LLMs. They're similar to GET endpoints in a REST API - they provide data but shouldn't perform significant computation or have side effects.

## Basic Usage

### Static Resource

```typescript
// Static resource
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
```

### Dynamic Resource with Parameters

```typescript
// Dynamic resource with parameters
server.resource(
  "user-profile",
  new ResourceTemplate("users://{userId}/profile", { list: undefined }),
  async (uri, { userId }) => ({
    contents: [{
      uri: uri.href,
      text: `Profile data for user ${userId}`
    }]
  })
);
```

## Examples

### Greeting Resource

```typescript
// Add a dynamic greeting resource
server.resource(
  "greeting",
  new ResourceTemplate("greeting://{name}", { list: undefined }),
  async (uri, { name }) => ({
    contents: [{
      uri: uri.href,
      text: `Hello, ${name}!`
    }]
  })
);
```

### Database Schema Resource

```typescript
server.resource(
  "schema",
  "schema://main",
  async (uri) => {
    const db = getDb();
    try {
      const tables = await db.all(
        "SELECT sql FROM sqlite_master WHERE type='table'"
      );
      return {
        contents: [{
          uri: uri.href,
          text: tables.map((t: {sql: string}) => t.sql).join("\n")
        }]
      };
    } finally {
      await db.close();
    }
  }
);
```

## Client-Side Resource Usage

To read a resource from a client:

```typescript
// List available resources
const resources = await client.listResources();

// Read a resource
const resource = await client.readResource({
  uri: "file:///example.txt"
});
```

## Resource Templates

Resource templates allow you to define parameterized URIs for dynamic resource access:

```typescript
// Creating a resource with a template
const template = new ResourceTemplate("users://{userId}/profile", { 
  list: undefined 
});

server.resource("user-profile", template, async (uri, params) => {
  // params.userId will contain the extracted parameter
  return {
    contents: [{
      uri: uri.href,
      text: `Profile data for user ${params.userId}`
    }]
  };
});
```

The `list` parameter in the template configuration determines how the resource behaves when listing resources. Setting it to `undefined` means this resource won't show specific instances when listing available resources. 