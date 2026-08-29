## Tracking Tool: Taiga

We decided to use Taiga as our project tracking and management tool.

**Rationale:** 
- Taiga was selected because it is a free, lightweight project management tool specifically designed to support Agile and Scrum development workflows. It provides useful Scrum features such as product backlogs, user stories, sprint planning, task assignment, status tracking, and progress monitoring. These features align well with the development process used for our project and allow the team to organise work into sprints and track the progress of individual user stories and tasks.
- Another important reason for selecting Taiga is that the team already has previous experience using it from our group project last semester. This familiarity reduces the time required to learn and configure a new tracking system, allowing the team to focus more on project development and collaboration.

**Alternatives considered:** 

We also considered Trello and Notion. While both provide useful task management and collaboration features, they require more manual setup to support Scrum practices such as sprints, user stories, and product backlogs. Taiga provides these Agile and Scrum features by default, making it more suitable for our project's workflow.




## Documentation Platform: MkDocs

We decided to use MkDocs for project documentation.

**Rationale:** 

MkDocs was selected because it is lightweight, easy to set up, and allows us to write documentation using Markdown, which is simple to maintain and works well with our Git-based development workflow. Documentation can be stored and version-controlled alongside the project code, making it easier for team members to contribute and keep it up to date. MkDocs also generates a clean, structured, and easily navigable documentation website

**Alternatives considered:** 

We considered Docusaurus, GitBook, and a standard GitHub README. Docusaurus provides more advanced customisation but requires additional setup that was unnecessary for our project. GitBook provides a user-friendly documentation platform but introduces an additional external platform to manage. A README would be the simplest option, but it becomes difficult to organise as documentation grows. MkDocs provided a good balance between simplicity, organisation, and maintainability.

## Software Architecture: Client-Server Architecture

We chose a client-server architecture with a clear separation between the frontend and backend, communicating through a REST API over HTTP.

**Rationale:** 

This architecture was chosen because it separates the user interface from the application's business logic and data handling. The frontend is responsible for displaying information and handling user interactions, while the backend processes requests, applies business logic, and communicates with the database. This separation satisfies the project requirement for a non-monolithic frontend and backend and also makes the system easier to develop, test, maintain, and extend.

**Alternatives considered:**

We considered a monolithic architecture and GraphQL as an alternative API approach. A monolithic architecture would tightly couple the frontend and backend, which does not meet the project's separation requirements. GraphQL provides flexible data querying but would introduce additional complexity that is unnecessary for the scope of our application. REST was chosen because it is simpler to implement, widely supported, and provides clear HTTP-based endpoints that suit the operations required by our application.