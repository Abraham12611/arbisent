
import { StateGraph } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { SolanaAgentKit } from "solana-agent-kit";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "@langchain/openai";

import { ResearchAgent } from "./research";
import StrategyAgent from "./strategy";
import ExecutionAgent from "./execution";
import { WorkflowState } from "../types/agent";

const END = "__end__";

type Node = "__start__" | "research" | "strategy" | "execution" | typeof END;

interface StateGraphConfig {
  initialState: WorkflowState;
}

export class ArbiSentOrchestrator {
  private graph: StateGraph<StateGraphConfig>;
  private researchAgent: ResearchAgent;
  private strategyAgent: StrategyAgent;
  private executionAgent: ExecutionAgent;

  constructor() {
    // Initialize LLM
    const llm = new ChatOpenAI({
      modelName: "gpt-4-mini",
      temperature: 0.7,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    // Initialize Vector Store
    const vectorStore = new MemoryVectorStore(
      new OpenAIEmbeddings({
        openAIApiKey: process.env.OPENAI_API_KEY,
      })
    );

    // Initialize Agents
    this.researchAgent = new ResearchAgent({
      vectorStore,
      firecrawlApiKey: process.env.FIRECRAWL_API_KEY!,
      llm,
    });

    this.strategyAgent = new StrategyAgent(llm);
    this.executionAgent = new ExecutionAgent({ llm });

    // Initialize StateGraph
    this.graph = StateGraph.fromConfig<StateGraphConfig, Node>({
      channels: {},
    });

    this.setupWorkflow();
  }

  private setupWorkflow() {
    // Add nodes to the graph
    this.graph.addNode("research", {
      value: async (state: WorkflowState): Promise<WorkflowState> => {
        state.activeAgent = "research";
        const result = await this.researchAgent.process({
          urls: state.context.urls,
          marketData: state.context.marketData
        });
        return {
          ...state,
          data: { ...state.data, research: result }
        };
      }
    });

    this.graph.addNode("strategy", {
      value: async (state: WorkflowState): Promise<WorkflowState> => {
        state.activeAgent = "strategy";
        const result = await this.strategyAgent.process({
          marketData: state.context.marketData,
          research: state.data?.research?.strategies || [],
          sentiment: state.context.sentiment
        });
        state.data = { ...state.data, strategy: result };
        return state;
      }
    });

    this.graph.addNode("execution", {
      value: async (state: WorkflowState): Promise<WorkflowState> => {
        state.activeAgent = "execution";
        const result = await this.executionAgent.process({
          strategy: state.data?.strategy?.strategy,
          parameters: state.context.parameters
        });
        state.data = { ...state.data, execution: result };
        state.status = result.status === 'success' ? 'completed' : 'failed';
        return state;
      }
    });

    // Define edges
    this.graph.setEntryPoint("__start__");
    this.graph.addEdge("__start__" as Node, "research" as Node);
    this.graph.addEdge("research" as Node, "strategy" as Node);
    this.graph.addEdge("strategy" as Node, "execution" as Node);
    this.graph.addEdge("execution" as Node, END);

    // Add conditional edges for error handling
    this.graph.addConditionalEdges(
      "research" as Node,
      (state: WorkflowState) => {
        if (state.data?.research?.error) {
          state.status = 'failed';
          return END;
        }
        return "strategy" as Node;
      }
    );

    this.graph.addConditionalEdges(
      "strategy" as Node,
      (state: WorkflowState) => {
        if (state.data?.strategy?.error) {
          state.status = 'failed';
          return END;
        }
        return "execution" as Node;
      }
    );
  }

  async run(input: {
    urls: string[];
    marketData: any;
    sentiment: any;
    parameters: any;
  }): Promise<WorkflowState> {
    const initialState: WorkflowState = {
      query: "arbitrage_execution",
      context: input,
      history: [],
      activeAgent: "__start__",
      status: "running",
      data: {}
    };

    try {
      const app = this.graph.compile();
      const result = await app.invoke({ state: initialState });
      return result.state;
    } catch (error: any) {
      console.error("Workflow execution failed:", error);
      return {
        ...initialState,
        status: "failed",
        data: { 
          ...initialState.data,
          error: error?.message || "Unknown error occurred"
        }
      };
    }
  }
}

export default ArbiSentOrchestrator;
