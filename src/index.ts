import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as fs from "fs/promises";
import * as path from "path";
import { z } from "zod";

// Create server instance
const server = new McpServer({
  name: "mcp_documentation_server",
  version: "1.0.0",
  capabilities: {
    resources: {}, 
    tools: {},
  },
});

server.tool(
  "getOverviewDocFor",
  { name: z.string() },
  async ({ name }) => {
    try {
      // Let's use path.resolve with __dirname to get the proper path
      // __dirname is the directory where the current module (file) is located
      // NOTE: In ESM, __dirname isn't available directly, so we'll construct it
      
      const moduleURL = new URL(import.meta.url);
      const modulePath = path.dirname(decodeURIComponent(moduleURL.pathname));
      
      // Go up one level from src to the project root
      const projectRoot = path.resolve(modulePath, '..');
      
      console.error(`Module path: ${modulePath}`);
      console.error(`Project root: ${projectRoot}`);
      
      // Construct the absolute path to the overview.md file
      const docPath = path.join(projectRoot, "docs", name, "overview.md");
      
      console.error(`Attempting to read file at: ${docPath}`);
      
      // Check if the file exists
      await fs.access(docPath, fs.constants.F_OK);
      console.error(`File exists at: ${docPath}`);
      
      // Try to read the file
      const content = await fs.readFile(docPath, "utf-8");
      console.error(`Successfully read file with ${content.length} characters`);
      
      return {
        content: [{ 
          type: "text", 
          text: content 
        }]
      };
    } catch (error) {
      // Handle file not found or other errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error reading doc: ${errorMessage}`);
      
      // Try to list what's in the docs directory to help debug
      try {
        const projectRoot = process.cwd();
        const docsDir = path.join(projectRoot, "docs");
        const files = await fs.readdir(docsDir);
        console.error(`Files in docs directory: ${JSON.stringify(files)}`);
        
        if (files.includes(name)) {
          const subDir = path.join(docsDir, name);
          const subFiles = await fs.readdir(subDir);
          console.error(`Files in docs/${name} directory: ${JSON.stringify(subFiles)}`);
        }
      } catch (e) {
        console.error(`Error listing directory: ${e instanceof Error ? e.message : String(e)}`);
      }
      
      return {
        content: [{ 
          type: "text", 
          text: `Error: Could not find overview document for "${name}". ${errorMessage}` 
        }],
        isError: true
      };
    }
  }
);

// Add getDetailedDocFor tool
server.tool(
  "getDetailedDocFor",
  { 
    project: z.string(),
    document: z.string() 
  },
  async ({ project, document }) => {
    try {
      // Get project root path
      const moduleURL = new URL(import.meta.url);
      const modulePath = path.dirname(decodeURIComponent(moduleURL.pathname));
      const projectRoot = path.resolve(modulePath, '..');
      
      // Construct the absolute path to the specific document file
      const docPath = path.join(projectRoot, "docs", project, `${document}.md`);
      
      console.error(`Attempting to read detailed doc at: ${docPath}`);
      
      // Check if the file exists
      await fs.access(docPath, fs.constants.F_OK);
      console.error(`Detailed doc exists at: ${docPath}`);
      
      // Read the file
      const content = await fs.readFile(docPath, "utf-8");
      console.error(`Successfully read detailed doc with ${content.length} characters`);
      
      return {
        content: [{ 
          type: "text", 
          text: content 
        }]
      };
    } catch (error) {
      // Handle file not found or other errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error reading detailed doc: ${errorMessage}`);
      
      // Try to list available documents in the project directory
      try {
        const moduleURL = new URL(import.meta.url);
        const modulePath = path.dirname(decodeURIComponent(moduleURL.pathname));
        const projectRoot = path.resolve(modulePath, '..');
        const projectDir = path.join(projectRoot, "docs", project);
        
        // Check if project directory exists
        await fs.access(projectDir, fs.constants.F_OK);
        
        // List available documents
        const files = await fs.readdir(projectDir);
        console.error(`Available documents in ${project}: ${JSON.stringify(files)}`);
        
        return {
          content: [{ 
            type: "text", 
            text: `Error: Could not find document "${document}.md" for project "${project}". 
Available documents: ${files.join(', ')}. ${errorMessage}` 
          }],
          isError: true
        };
      } catch (e) {
        // Project directory doesn't exist
        return {
          content: [{ 
            type: "text", 
            text: `Error: Could not find project "${project}" or document "${document}.md". ${errorMessage}` 
          }],
          isError: true
        };
      }
    }
  }
);

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Personal MCP Server running on stdio");
}
  
main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});