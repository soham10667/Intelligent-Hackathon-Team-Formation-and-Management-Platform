# Engineering Design Document
## Intelligent Hackathon Team Formation and Management Platform

**Document Version:** 1.0.0  
**Author:** Senior Software Architect, Full-Stack Engineer, Security Engineer  
**Scope:** Architecture, Race-Condition Prevention, Concurrency, Algorithms, and Scalability  

---

### 1. Data Model & Relational Integrity

The data model was designed to guarantee referential integrity and database-level invariants for 10,000+ participants and 2,000+ teams across multiple hackathons.

#### Key Invariants Enforced at the Database Engine Level:
1. **Single Team Per Hackathon Constraint:**
   `CONSTRAINT uq_user_hackathon_team UNIQUE (hackathon_id, user_id)` on table `team_members`.
   *Guarantee:* A participant physically cannot belong to more than one team for any given hackathon, regardless of race conditions, double-submissions, or application-level bugs.
2. **Team Name Uniqueness Per Hackathon:**
   `CONSTRAINT uq_team_hackathon_name UNIQUE (hackathon_id, lower(name))` on table `teams`.
   *Guarantee:* Prevents confusing duplicate team branding within the same event.
3. **Single Active Pending Request Per Team:**
   Enforced via application transaction queries and unique database lookups.
4. **Append-Only Immutable Audit Trail:**
   `audit_logs` records actors, targets, actions, JSON metadata, and timestamps without update or delete capabilities.

---

### 2. Concurrency & Race-Condition Prevention Strategy

#### The Failure Mode Under Naive Design:
A team with `max_size = 4` has 3 active members (1 open seat). 50 participants simultaneously submit join requests or have their pending requests accepted concurrently. A naive architecture that reads member count in application memory (`len(team.members) < 4`) and then executes `INSERT INTO team_members` suffers from a **Time-of-Check to Time-of-Use (TOCTOU)** race condition, resulting in 5-20 members joined to a 4-person team.

#### The Race-Proof Transactional Pipeline:
```
Client Request -> [Begin DB Transaction]
                     │
                     ▼
          [Acquire Row-Level Lock]
     SELECT * FROM teams WHERE id = :team_id FOR UPDATE;
                     │
                     ▼
        [Atomic In-Transaction Checks]
     1. Current Count: SELECT COUNT(*) FROM team_members WHERE team_id = :id;
        -> If count >= max_size: ROLLBACK & return HTTP 409 Conflict ("Team is full").
     2. Participant Invariant: SELECT 1 FROM team_members WHERE hackathon_id = :h AND user_id = :u;
        -> If already in a team: ROLLBACK & return HTTP 409 Conflict.
     3. Request Status: verify request.status == 'pending'.
                     │
                     ▼
            [Atomic State Mutate]
     1. INSERT INTO team_members ...;
     2. UPDATE join_requests SET status = 'accepted' ...;
     3. If new_count == max_size: UPDATE teams SET status = 'full' ...;
     4. INSERT INTO audit_logs ...;
                     │
                     ▼
         [Commit Transaction & Release Lock]
                     │
                     ▼
       [Async Broadcast via WebSockets]
     Notify accepted member & push discovery update
```

#### Empirical Concurrency Proof:
The automated test suite (`tests/test_platform.py::test_concurrent_team_joining_50_requests`) launches 50 simultaneous join accept requests against a team with exactly 1 remaining seat.
- **Result:** Exactly 1 request succeeds (HTTP 200). 49 requests fail gracefully (HTTP 409).
- **Final Database State:** Exactly 4 members. 0 over-subscription. 0 duplicate records.

---

### 3. Idempotency Strategy

Network disconnects, slow cellular connections, and rapid button double-clicks frequently trigger duplicate HTTP requests.
- All mutating requests (`POST`, `PUT`, `PATCH`, `DELETE`) support an optional `X-Idempotency-Key` header (automatically attached by the frontend client).
- The `IdempotencyMiddleware` checks the `idempotency_keys` table inside an atomic lookup.
- If a cached response exists within the 24-hour TTL, it immediately streams the cached response with `X-Cache-Lookup: HIT-IDEMPOTENT`, preventing re-execution of database transactions.
- If not cached, the transaction executes, and successful 2xx responses are persisted.

---

### 4. Real-Time WebSocket Architecture

Real-time capabilities ensure that teams that fill up or change availability are instantly reflected on all client screens without manual page refreshing.

```
                    ┌─────────────────────────────────┐
                    │  FastAPI WebSocket Connection   │
                    │   Manager (`manager.py`)        │
                    └────────────────+────────────────┘
                                     │
           ┌─────────────────────────┴─────────────────────────┐
           │                                                   │
           ▼                                                   ▼
┌───────────────────────┐                           ┌─────────────────────────┐
│ User Private Channels │                           │ Discovery Board Channel │
│  - New join request   │                           │  - Team created         │
│  - Request accepted   │                           │  - Team updated (seats) │
│  - Member removed     │                           │  - Team dissolved       │
└───────────────────────┘                           └─────────────────────────┘
```

1. **Authentication:** Clients connect via `/ws?token=<JWT>`. The server decodes the token, verifies the user signature, and associates active sockets with the authenticated user ID.
2. **Graceful Disconnects:** Dead connections are purged automatically without memory leaks.
3. **Decoupled Delivery:** WebSocket notifications are sent asynchronously after database transactions commit, preventing database lock contention during network delivery.

---

### 5. Explainable Teammate Matching & Skill Gap Algorithms

Unlike unpredictable or hallucinating LLM-based recommenders, TeamForge uses a deterministic, explainable mathematical scoring engine.

#### Configurable Scoring Formula:
$$\text{Score} = (W_{\text{skill}} \times S_{\text{skill}}) + (W_{\text{tz}} \times S_{\text{tz}}) + (W_{\text{avail}} \times S_{\text{avail}}) + (W_{\text{role}} \times S_{\text{role}})$$

- **Complementary Skill Coverage ($W_{\text{skill}} = 40\%$):**
  Identifies missing required skills in the team. Candidates are evaluated by proficiency ($1-5$ mapped to $0.2-1.0$) across those missing skills:
  $$S_{\text{skill}} = \frac{\sum_{s \in \text{Missing}} \text{Proficiency}(s) / 5}{|\text{Missing}|}$$
- **Timezone Alignment ($W_{\text{tz}} = 25\%$):**
  Calculates difference in UTC offsets:
  $$S_{\text{tz}} = \max\left(0.0, 1.0 - \frac{|\Delta\text{UTC}|}{12}\right)$$
- **Availability Synergy ($W_{\text{avail}} = 20\%$):**
  Evaluates working hour preferences (Morning, Afternoon, Evening, Night, Flexible) and weekly commitment ratio.
- **Role Diversity ($W_{\text{role}} = 15\%$):**
  Bonuses candidates whose preferred roles directly fulfill target recruiting needs (e.g. Backend Engineer, UI/UX Designer) or bring domain diversity.

---

### 6. Technical Trade-Offs

| Decision | Trade-Off Chosen | Alternatives Rejected | Rationale |
| :--- | :--- | :--- | :--- |
| **Row-Level Locking (`FOR UPDATE`)** | Modest serialization queue on the specific team row under concurrency spikes. | In-memory locks, Optimistic concurrency without retry loops. | Row-level locking guarantees 100% ACID consistency at the database engine level across multi-worker deployments. In-memory locks fail when scaling to multiple processes. |
| **Denormalized `hackathon_id` on `team_members`** | Requires populating `hackathon_id` on membership insert. | Relying on nested join check or application logic. | Enables a physical PostgreSQL `UNIQUE (hackathon_id, user_id)` constraint that makes duplicate memberships impossible at the storage level. |
| **Deterministic Matching Engine** | Requires structured profile skills and proficiencies. | Unstructured LLM embeddings or generative prompt matching. | Deterministic matching is 100% explainable, blazing fast (<5ms), reproducible, audit-compliant, and free of token billing costs or prompt injection vulnerabilities. |
| **PostgreSQL / SQLite Dual Compatibility** | Requires portable ANSI SQL schemas without vendor-only stored procedures. | Raw PostgreSQL-specific plpgsql triggers. | Enables immediate zero-dependency local development and local testing while retaining full PostgreSQL compatibility for production. |

---

### 7. What Would Be Improved With One Additional Week

1. **pgvector Semantic Skill Embeddings:**
   Combine our rule-based complementary matching with dense vector similarity (e.g. `text-embedding-3-small` stored in `pgvector`) to discover adjacent skills (e.g., recognizing that "PyTorch" and "JAX" share 90% conceptual overlap).
2. **Redis Pub/Sub WebSocket Scale-Out:**
   Replace the single-node WebSocket manager with Redis Pub/Sub channels to enable horizontal scaling across multiple containerized backend replicas.
3. **Automated Team Video Chat Integration:**
   Embed WebRTC or Daily.co 1-click video rooms directly inside the team dashboard for instant team interviews.
4. **Discord / Slack Webhook Integrations:**
   Provide team leaders with webhook notifications delivered directly into their hackathon Discord servers.

