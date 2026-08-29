# Decisions

## Development Methodology: Scrum Agile

We chose Scrum Agile as the development methodology for our project.

**Rationale:**

- Scrum was selected because it allows the team to divide development into manageable sprints, making it easier to plan, prioritise, and track the project's progress. Using user stories and tasks helps divide responsibilities among team members and provides a clear view of what has been completed and what still needs to be done.

- Scrum also supports regular communication and collaboration within the team. Since we meet twice a week, these meetings allow us to review progress, discuss challenges or blockers, and adjust tasks when necessary. The iterative nature of Scrum also allows us to respond to changes and continuously improve the application throughout development.


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

## Frontend Framework: Next.js (React)

We chose Next.js with React and TypeScript as our frontend framework.

**Rationale:**

- Next.js was selected primarily because the team already has experience working with React, which reduced the learning curve and allowed development to begin quickly. Since React uses a component-based approach, the application can be divided into reusable components such as navigation elements, forms, cards, and profile components. This helps reduce duplicated code and makes the frontend easier to maintain.

- Next.js also provides built-in file-based routing through the App Router, which simplifies the organisation of the application's different pages and routes, such as the dashboard, events, authentication, and administrator pages. This removes the need to introduce and configure a separate routing library.

- The framework also works well with TypeScript, which provides type checking and helps identify potential errors during development. Additionally, Next.js integrates well with Vercel, our chosen frontend deployment platform, making the deployment and continuous integration process straightforward.

## Backend Framework: Node.js with Express

We chose Node.js with Express for the backend of the application.

**Rationale:**
- Express was selected because it is a lightweight and flexible framework that allows the team to create REST API endpoints with relatively little configuration. This is suitable for our client-server architecture, where the frontend communicates with the backend through HTTP requests.

- Using Node.js also allows the team to use JavaScript/TypeScript across both the frontend and backend. Having a similar language and development environment across the full stack reduces context-switching and makes it easier for team members to contribute to different parts of the application.

- Express also provides flexibility in how routes, middleware, authentication checks, and business logic are structured. This allows the backend to remain separate from the frontend while providing clearly defined API endpoints for functionality such as events, player actions, location verification, and game-related operations.

-Node.js and Express are also well supported by Render, our chosen backend deployment platform, making it straightforward to deploy the REST API and configure the required environment variables.

## Database Platform: Superbase

We chose Supabase as the database platform for our application.

**Rationale:** 

- Supabase was selected because it provides a hosted PostgreSQL database that is easy to set up, manage, and integrate with our application. It provides a web-based dashboard for managing tables and data, while also supporting features such as relationships, constraints, and secure database access.

- Another major reason for choosing Supabase was its built-in authentication service. Our application already uses Supabase Auth to manage user registration, login, password resets, and third-party authentication such as Google and GitHub sign-in. Using Supabase for both authentication and the database allows user accounts and application data to be managed within the same platform, reducing the need to integrate and maintain separate services.

**Alternatives considered:**

We considered alternatives such as MongoDB and Firebase. MongoDB provides a flexible document-based database but would require a separate authentication solution. Firebase provides both authentication and database services, but Supabase's relational PostgreSQL database was better suited to the structured and related data used in our application.

## Deployment Platform

We chose Vercel to deploy the frontend and project documentation, and Render to deploy the backend.

**Rationale:** 

**Frontend - Vercel**

- Vercel was chosen because it integrates very well with Next.js, which is the framework used for our frontend. It provides a simple Git-based deployment process, automatic deployments when changes are pushed, HTTPS, preview depsloyments, and environment variable management.

- Our main repository is hosted on Gitea; however, Vercel provides better direct integration with GitHub. Therefore, we mirror our Gitea repository to GitHub for deployment purposes. This allows us to continue using Gitea as our primary version-control platform while taking advantage of Vercel's automated deployment workflow through GitHub.

**Backend - Render**

- Render was selected for the b-ackend because it supports deploying Node.js/Express applications as web services and provides an easy way to configure environment variables and connect the deployed frontend to the backend API. It also integrates with Git repositories, which allows the backend to be redeployed automatically when updates are pushed. Render was suitable for our project because it provides the server-side hosting needed for a continuously running REST API.

**Documentation - Vercel**

- Vercel was also chosen to host the project documentation because the static site generated by MkDocs can be deployed as a lightweight website. Hosting the documentation separately from the application keeps it easy to access and allows changes to the documentation to be published through the same Git-based workflow used by the development team


