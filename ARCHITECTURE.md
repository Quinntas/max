# DealSmart AI - Architecture Document

## System Overview

DealSmart AI is an intelligent lead qualification and response system for automotive dealerships. It processes incoming SMS messages through a multi-step AI workflow, qualifies leads, and generates contextual responses while maintaining TCPA compliance.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              EXTERNAL SYSTEMS                                    │
├─────────────────────┬─────────────────────┬─────────────────────────────────────┤
│     Twilio SMS      │    HubSpot CRM      │         LiteLLM Proxy               │
│   (Webhook Inbound) │  (Contact Sync)     │    (OpenAI/Anthropic/etc)           │
└─────────┬───────────┴──────────┬──────────┴─────────────────┬───────────────────┘
          │                      │                            │
          ▼                      ▼                            ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              ELYSIA API (Bun Runtime)                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────────┐  │
│  │  SMS Webhook    │    │  WebSocket      │    │     REST Endpoints          │  │
│  │  /sms/incoming  │    │  /livechat      │    │  /conversations, /messages  │  │
│  └────────┬────────┘    └────────┬────────┘    └─────────────────────────────┘  │
│           │                      │                                               │
│           ▼                      ▼                                               │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                    COMMAND LAYER (Instrumented)                             │ │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────────┐  │ │
│  │  │ HandleIncomingSms│  │  LiveChatCommand │  │  TextSuggestionCommand   │  │ │
│  │  │    Command       │  │                  │  │                          │  │ │
│  │  └────────┬─────────┘  └────────┬─────────┘  └────────────┬─────────────┘  │ │
│  └───────────┼─────────────────────┼─────────────────────────┼────────────────┘ │
│              │                     │                         │                   │
│              ▼                     │                         ▼                   │
│  ┌────────────────────────────────┐│    ┌─────────────────────────────────────┐ │
│  │   QUALIFICATION WORKFLOW       ││    │    TEXT SUGGESTION WORKFLOW         │ │
│  │         (Mastra)               ││    │          (Mastra)                   │ │
│  │                                ││    │                                     │ │
│  │  1. checkCompliance            ││    │  1. respondToConversation           │ │
│  │  2. extractContactInfo         ││    │     (Dealership Advisor Agent)      │ │
│  │  3. lookupInventory            ││    │  2. breakIntoMessages               │ │
│  │  4. scoreQualification         ││    │     (Text Condensor Agent)          │ │
│  │  5. checkEscalation            ││    │                                     │ │
│  │  6. generateResponse           ││    └─────────────────────────────────────┘ │
│  │  7. validateResponse           ││                                            │
│  │  8. formatForChannel           ││                                            │
│  └────────────────────────────────┘│                                            │
│                                    │                                            │
└────────────────────────────────────┼────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DATA LAYER                                          │
├─────────────────────┬─────────────────────┬─────────────────────────────────────┤
│    PostgreSQL       │   Redis/Dragonfly   │           Repositories              │
│    (pgvector)       │   (Cache/Sessions)  │   Contact, Message, Conversation    │
└─────────────────────┴─────────────────────┴─────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                           OBSERVABILITY STACK                                    │
├─────────────────────┬─────────────────────┬─────────────────────────────────────┤
│   Grafana Tempo     │    Grafana Loki     │         Prometheus                  │
│   (Distributed      │    (Log             │         (Metrics)                   │
│    Tracing)         │    Aggregation)     │                                     │
└─────────────────────┴─────────────────────┴─────────────────────────────────────┘
```

---

## Qualification Workflow Detail

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        QUALIFICATION WORKFLOW STEPS                              │
└─────────────────────────────────────────────────────────────────────────────────┘

    Incoming SMS
         │
         ▼
┌─────────────────┐     ┌─────────────────────────────────────────────────────┐
│ 1. CHECK        │     │ - Detect STOP/UNSUBSCRIBE keywords (TCPA)           │
│    COMPLIANCE   │────▶│ - Verify consent status                              │
│                 │     │ - Early exit if opt-out detected                     │
└────────┬────────┘     └─────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────────────────────────────────────────┐
│ 2. EXTRACT      │     │ - Intent: SALES | SERVICE | TRADE_IN | UNKNOWN      │
│    CONTACT INFO │────▶│ - Vehicle interest (make, model, year, trim)        │
│    (AI)         │     │ - Timeline, budget, trade-in status                 │
└────────┬────────┘     │ - Sentiment score, wants human flag                 │
         │              └─────────────────────────────────────────────────────┘
         ▼
┌─────────────────┐     ┌─────────────────────────────────────────────────────┐
│ 3. LOOKUP       │     │ - Query inventory if vehicle interest detected      │
│    INVENTORY    │────▶│ - Inject context for response generation            │
│                 │     │ - Never expose exact counts or specific units       │
└────────┬────────┘     └─────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────────────────────────────────────────┐
│ 4. SCORE        │     │ Scoring Rubric (0-100):                             │
│    QUALIFICATION│────▶│ - Intent clarity: 0-30 points                       │
│    (AI)         │     │ - Timeline urgency: 0-25 points                     │
└────────┬────────┘     │ - Budget mentioned: 0-20 points                     │
         │              │ - Specific vehicle: 0-15 points                     │
         │              │ - Trade-in: 0-10 points                             │
         │              │ Output: QUALIFIED | NURTURE | ESCALATE              │
         ▼              └─────────────────────────────────────────────────────┘
┌─────────────────┐     ┌─────────────────────────────────────────────────────┐
│ 5. CHECK        │     │ Escalation triggers:                                │
│    ESCALATION   │────▶│ - Angry sentiment (lawsuit, complaint, etc.)        │
│                 │     │ - Explicit human request                            │
└────────┬────────┘     │ - Price negotiation ("best price", "OTD")           │
         │              │ - Low AI confidence (< 0.6)                         │
         ▼              └─────────────────────────────────────────────────────┘
┌─────────────────┐     ┌─────────────────────────────────────────────────────┐
│ 6. GENERATE     │     │ - Use Max Agent with dealership-specific config     │
│    RESPONSE     │────▶│ - Inject inventory context if available             │
│    (AI)         │     │ - Pre-built escalation responses for routing        │
└────────┬────────┘     └─────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────────────────────────────────────────┐
│ 7. VALIDATE     │     │ Anti-hallucination checks:                          │
│    RESPONSE     │────▶│ - Block: $X,XXX prices, X% APR, guarantees          │
│                 │     │ - Block: inventory claims, trade values             │
└────────┬────────┘     │ - Sanitize violations: "[price available on request]"│
         │              └─────────────────────────────────────────────────────┘
         ▼
┌─────────────────┐     ┌─────────────────────────────────────────────────────┐
│ 8. FORMAT FOR   │     │ - SMS: Split into 160-char chunks                   │
│    CHANNEL      │────▶│ - Email: Keep as single message                     │
│                 │     │ - Add dealership signature                          │
└────────┬────────┘     └─────────────────────────────────────────────────────┘
         │
         ▼
    Send Response
```

---

## Text Suggestion Workflow (LiveChat)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      TEXT SUGGESTION WORKFLOW                                    │
└─────────────────────────────────────────────────────────────────────────────────┘

    WebSocket Request
    (READY_FOR_AI_SUGGESTION)
            │
            ▼
┌───────────────────────┐     ┌───────────────────────────────────────────────┐
│ 1. RESPOND TO         │     │ - Format conversation history                 │
│    CONVERSATION       │────▶│ - Use Dealership Advisor Agent                │
│    (AI)               │     │ - Generate professional response              │
└───────────┬───────────┘     └───────────────────────────────────────────────┘
            │
            ▼
┌───────────────────────┐     ┌───────────────────────────────────────────────┐
│ 2. BREAK INTO         │     │ - Generate 1-3 message variations             │
│    MESSAGES           │────▶│ - Different tones: casual vs professional     │
│    (AI)               │     │ - Different structures and lengths            │
└───────────┬───────────┘     │ - User picks one to send                      │
            │                 └───────────────────────────────────────────────┘
            ▼
    Return Suggestions Array
```

---

## Data Model

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              ENTITY RELATIONSHIPS                                │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   User       │       │  Dealership  │       │   Contact    │
│              │       │              │       │              │
│ id (PK)      │──────▶│ id (PK)      │◀──────│ id (PK)      │
│ email        │   1:N │ name         │   N:1 │ name         │
│ dealershipId │       │ brand        │       │ phone        │
│              │       │ config (JSON)│       │ email        │
└──────────────┘       │ - tone       │       │ provider     │
                       │ - questions  │       │ intent       │
                       │ - hours      │       │ score        │
                       └──────────────┘       │ dealershipId │
                                              └──────┬───────┘
                                                     │
                                                     │ 1:N
                                                     ▼
                       ┌──────────────┐       ┌──────────────┐
                       │  Escalation  │       │ Conversation │
                       │              │       │              │
                       │ id (PK)      │◀──────│ id (PK)      │
                       │ reason       │   N:1 │ status       │
                       │ priority     │       │ contactId    │
                       │ contactId    │       │ userId       │
                       └──────────────┘       └──────┬───────┘
                                                     │
                                                     │ 1:N
                                                     ▼
                                              ┌──────────────┐
                                              │   Message    │
                                              │              │
                                              │ id (PK)      │
                                              │ content      │
                                              │ senderType   │
                                              │ contentType  │
                                              │ conversationId│
                                              └──────────────┘
```

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Runtime | Bun 1.3.5 | Fast JS runtime with native TypeScript |
| API Framework | Elysia | Type-safe, high-performance web framework |
| Database | PostgreSQL 16 + pgvector | Relational data + vector embeddings |
| Cache | Dragonfly (Redis-compatible) | Session storage, rate limiting |
| AI Orchestration | Mastra | Workflow engine for multi-step AI pipelines |
| LLM Gateway | LiteLLM | Unified API for OpenAI, Anthropic, etc. |
| Tracing | OpenTelemetry + Tempo | Distributed tracing |
| Logging | Pino + Loki | Structured logging with trace correlation |
| Metrics | Prometheus | System and business metrics |
| CRM Integration | HubSpot API | Contact sync, activity logging |
| SMS Provider | Twilio | Inbound/outbound SMS |
| Frontend | React + Vite + TailwindCSS | Admin dashboard |

---

## Security & Compliance

### TCPA Compliance
- Automatic STOP/UNSUBSCRIBE detection
- Consent tracking per contact
- Opt-out honored immediately
- No messages sent without consent

### Anti-Hallucination
- Regex-based validation layer
- Blocks: specific prices, APR rates, guarantees
- Blocks: inventory claims, trade-in values
- Sanitization fallback for violations

### Data Protection
- All API endpoints authenticated
- User scoped to single dealership
- WebSocket connections authenticated
- Sensitive data not logged
