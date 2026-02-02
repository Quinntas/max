# How We Built DealSmart AI: Tool Choices and Tradeoffs

When building a system that handles lead qualification for hundreds of car dealerships, we had to make some tough calls about our tech stack. We wanted something fast and reliable, but every choice comes with its own set of baggage. Here is a look at what we picked and why.

## 1. The Foundation: Bun and Elysia
We went with Bun and Elysia because they are incredibly fast. Bun gives us a modern runtime with native TypeScript support, and Elysia's "Eden" client lets us share types between the frontend and backend without any extra code generation.

**The Tradeoff:** Bun is still the new kid on the block compared to Node.js. We occasionally run into library compatibility issues, and because Elysia isn't as popular as something like Express, we sometimes have to build our own middleware from scratch.

## 2. Orchestrating the AI: Mastra Workflows
Instead of just sending a bunch of random prompts to OpenAI, we used Mastra to build a structured pipeline. It works like a state machine, moving from compliance checks to info extraction, then scoring, and finally generating a response. This makes it much easier to debug when something goes wrong.

**The Tradeoff:** It is a lot more complex than just calling an API. There was a real learning curve for the team, and it adds some overhead compared to a simpler script. We also have fewer "off the shelf" integrations than we would if we used a massive framework like LangChain.

## 3. Multiple Agents vs. One Big Prompt
We don't use just one AI agent. We have "Max" for qualification, an "Advisor" for suggestions, and a "Condensor" to fix the formatting for SMS. Splitting these up makes each agent better at its specific job.

**The Tradeoff:** Every extra agent call adds latency and costs more money. A single text message might trigger three different LLM calls behind the scenes, so we have to be very careful about how we manage that state and timing.

## 4. Keeping it Legal: Regex Guardrails
In the car business, if an AI promises a specific price or a low interest rate, it can cause massive legal headaches. We use system prompts to tell the AI what to do, but we also have a "hard" layer of Regex code that scans every response. If it sees a dollar sign or a percentage, it blocks or replaces it before the customer sees it.

**The Tradeoff:** Regex is a blunt instrument. It doesn't understand context, so it sometimes flags perfectly normal sentences as "illegal" just because they have numbers in them. We decided that being a bit too strict is better than getting a dealership sued.

## 5. The Database: Postgres and pgvector
We decided to keep everything in one place using PostgreSQL with the pgvector extension. This handles our regular data like contacts and dealership settings, plus our AI embeddings for search.

**The Tradeoff:** A dedicated vector database might be faster if we were handling billions of items, but for our current scale, it is just not worth the extra infrastructure headache. pgvector is "good enough" and keeps our architecture simple.

## 6. Token Costs and Context
We feed the entire conversation history into the AI every time a new message comes in. This ensures the AI never "forgets" what was said three messages ago and keeps the conversation feeling natural.

**The Tradeoff:** As a conversation gets longer, it gets more expensive to process. We are paying for every single token, so long-winded customers actually cost more to qualify. We could summarize the history to save money, but we didn't want to risk the AI losing important details.

## 7. Using LiteLLM as a Safety Net
We use LiteLLM as a proxy for all our AI calls. It lets us write code once and then swap between OpenAI, Anthropic, or even a local model if we want to.

**The Tradeoff:** It's another "hop" in the network, which adds a tiny bit of delay. It is also one more service that could potentially go down, but the ability to fail over to a different provider if OpenAI has an outage is worth it.
