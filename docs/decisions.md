## Tracking Tool

We decided to use Taiga as our tracking tool.

**Rationale:** Taiga is free to use , lightweight, and purpose-built for Scrum/Agile workflows,making it well suited foo s project using scrum methodology.

## Documentation Platform

We decided to use MkDocs for project documentation.

**Rationale:** MkDocs is simple to setup, intergrates well with git-based workflow, and produces clean, easily navigable documentation sites which is suitable for a techncal project campus Quest.

## Software Architecure 

Wit's Quest follows a **Client server Architecuture**, with a restiction between fronted and backend applications,communicating via a REST API over HTTP.

### Components

- **Fronted:** Next.js (App Router) - handle UI, routing, and client-side state.No backed logic is implemented within this application.
- **Backed:** Node.js with Express - handles all business logic, authentication, and database access. Exposes REST API endpoints consumed by the frontend.
- **Database:** Supabase - persistent data storage for users, quests, location, and progress/scoring data.

### Communication

Thr fronted and backed communicate exclusively through HTTP requests to RESTful API endpoint.No shared code or direct database access occurs from the fronted.

### Rationale 

This architecture was chosen to satisfy the project rquirement of maintaining non-monolithic fronted and backend applications, ensuring each framework is used strictly for its intended layer.


## Software Design 


## Authentication System 

Superbase Auth ???
