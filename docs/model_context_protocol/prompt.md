# Prompts in Model Context Protocol

Prompts are reusable templates that help LLMs interact with your server effectively. They provide structured ways to format messages for LLM communication.

## Basic Usage

```typescript
server.prompt(
  "review-code",
  { code: z.string() },
  ({ code }) => ({
    messages: [{
      role: "user",
      content: {
        type: "text",
        text: `Please review this code:\n\n${code}`
      }
    }]
  })
);
```

This example creates a prompt template called "review-code" that takes a code parameter and formats it into a message for the LLM.

## Examples

### Echo Prompt

```typescript
server.prompt(
  "echo",
  { message: z.string() },
  ({ message }) => ({
    messages: [{
      role: "user",
      content: {
        type: "text",
        text: `Please process this message: ${message}`
      }
    }]
  })
);
```

### Multi-Message Prompt

```typescript
server.prompt(
  "analyze-data",
  { 
    dataset: z.string(),
    goal: z.string() 
  },
  ({ dataset, goal }) => ({
    messages: [
      {
        role: "system",
        content: {
          type: "text",
          text: "You are a data analysis assistant."
        }
      },
      {
        role: "user",
        content: {
          type: "text",
          text: `Please analyze this dataset:\n\n${dataset}\n\nMy goal is: ${goal}`
        }
      }
    ]
  })
);
```

## Client-Side Prompt Usage

To use prompts from a client:

```typescript
// List available prompts
const prompts = await client.listPrompts();

// Get a prompt with arguments
const prompt = await client.getPrompt({
  name: "review-code",
  arguments: {
    code: "function hello() { console.log('Hello world'); }"
  }
});

// The prompt result contains formatted messages ready to be sent to an LLM
console.log(prompt.messages);
```

## Parameter Validation

Prompts use Zod schemas to validate parameters:

```typescript
server.prompt(
  "generate-report",
  {
    title: z.string(),
    sections: z.array(z.string()),
    includeCharts: z.boolean().optional().default(false)
  },
  ({ title, sections, includeCharts }) => ({
    messages: [{
      role: "user",
      content: {
        type: "text",
        text: `Generate a report titled "${title}" with the following sections: ${sections.join(", ")}. ${includeCharts ? "Include charts and visualizations." : ""}`
      }
    }]
  })
);
```

This ensures that prompt parameters are properly validated before being used to generate messages for the LLM. 