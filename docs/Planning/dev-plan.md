# Development Plan

## Development Methodology:

The project follows the Scrum Agile methodology, as outlined in our project decisions. Development is organised into sprints, with user stories and tasks planned and tracked using Taiga.

The team meets twice a week to discuss project progress, review completed and outstanding tasks, identify any challenges or blockers, and coordinate the work that needs to be completed next. At the beginning of each sprint, the team conducts sprint planning to select and assign user stories and tasks. At the end of the sprint, the team reviews the work completed and discusses improvements that can be made for the following sprint.

This approach allows the team to track progress continuously, divide responsibilities clearly, and adapt the development plan when requirements or priorities change.

## Tech Stack & Tooling:

The project uses a combination of technologies and development tools to support the frontend, backend, database, collaboration, and deployment workflow.

### Tech Tack:

- **Next.js**, React, TypeScript, and Tailwind CSS are used to develop the frontend and create the application's user interface.
- **Node.js** and Express.js are used for the backend to implement the application's business logic and REST API endpoints.
- **Supabase** is used for the PostgreSQL database and authentication services, including user registration, login, password recovery, and third-party authentication.
- **MkDocs** is used to create and maintain the project's technical documentation.

### Development Tools:

- **VS Code** is the primary development environment used by the team to write, edit, and debug the project code.
- **Taiga** is used for Scrum project management, including managing the product backlog, sprints, user stories, and tasks.
- **Gitea** is used as the team's primary Git repository for version control and collaboration.
- **GitHub** is used as a mirror of the Gitea repository to support integrations with deployment services such as Vercel.
- **Git** is used for version control, allowing team members to work on separate branches, track changes, and merge completed features.
- **Vercel** is used to deploy the frontend and project documentation, while Render is used to deploy the backend.

Together, these technologies and tools provide the development, collaboration, version control, documentation, and deployment infrastructure required for the project.

## Branching & Version Control Strategy:

The team follows a feature-branch workflow using Git and Gitea. The main branch represents the stable version of the project and team members do not develop features directly on it.

### Feature Branches:

Each user story or feature is developed on a separate branch created from main. Branches are given descriptive names related to the work being completed, for example `Lerato/location-verification` or `Busi/password-reset`. This allows team members to work independently without affecting the stable version of the application.

Once a feature is completed and tested, the developer creates a Pull Request (PR) to merge the feature branch into main. The changes can then be reviewed before they are integrated into the main codebase.

When team members are working on dependent or related user stories, they communicate about the files and components they are modifying. This helps reduce merge conflicts and prevents developers from making conflicting changes to the same parts of the application. Team members also regularly update their branches with the latest changes from main.

### Commit Convention:

The team follows the **Conventional Commits** convention to keep the Git history clear and consistent. Commit messages use prefixes that describe the type of change being made, such as:

- `feat`: for a new feature
- `fix`: for a bug fix
- `docs`: for documentation changes
- `test`: for adding or updating tests
- `refactor`: for restructuring code without changing its behaviour

Commit messages should be short but descriptive so that other team members can easily understand what was changed.

When AI-assisted development tools contribute to a change, the commit includes an **Assisted-by:** trailer to acknowledge the use of the tool while maintaining transparency about how the code was developed.

Overall, this strategy keeps the main branch stable, supports parallel development between team members, provides an opportunity for code review, and reduces the likelihood of conflicts when integrating different features.

## Coding Standards / Conventions

To maintain consistency and readability across the codebase, the team follows agreed coding standards and uses automated tools to identify formatting and code-quality issues.

### Project Structure

The project is separated into clearly defined directories based on responsibility

- `frontend`/ – contains the Next.js frontend, React components, pages, and frontend-related logic.
- `backend`/ – contains the Node.js/Express REST API, routes, middleware, and backend business logic.
- `docs`/ – contains the MkDocs project documentation.

This structure supports the project's client-server architecture by keeping the frontend, backend, and documentation clearly separated.

### Naming Conversions
Descriptive and consistent names are used throughout the project. React components use PascalCase, such as ProfileMenu and LogoutButton, while variables and functions use camelCase, such as eventId and verifyLocation. File and folder names are kept descriptive so that their purpose can be easily identified by other team members.

### Code Quality and Formatting

The team uses the following automated checks:

- **Linting** – used to identify code-quality issues and enforce consistent coding practices.
- **Type checking** – TypeScript type checking is used to detect type-related errors before code is merged.
- **Prettier** – used to automatically format code and maintain a consistent style across files.

Team members are expected to run the relevant lint, type-check, and formatting checks before creating a pull request. This helps identify issues early, keeps the codebase consistent, and reduces avoidable formatting differences during code reviews and merges.

## Testing Approach

The project currently uses **manual testing** as its primary testing approach. Each feature is tested by the developer during implementation to ensure that it functions as expected and meets the requirements of the user story. Before being merged into the main branch, the feature is also tested by at least one other team member as part of the **Pull Request review process.**

At the end of each sprint, **User Acceptance Testing (UAT)** is conducted against the predefined acceptance criteria for each user story. This verifies that the implemented functionality meets the expected user requirements before the user story is considered complete. The acceptance criteria and UAT results are recorded in the relevant **Sprint Acceptance Criteria documents.**

Testing also includes checking interactions between the **frontend, backend, authentication, and database** where applicable to ensure that the different parts of the system work correctly together.

**Automated unit and integration testing** has not yet been introduced. However, it is being considered for future sprints as the application grows and the codebase becomes more stable. Introducing automated testing would help identify regressions, improve reliability, and reduce the amount of repetitive manual testing required in later stages of development.

## Definition of Done 

A user story is considered **Done** only when all agreed development, testing, review, and integration requirements have been completed. This ensures that completed work is functional and ready to be included in the project.

For a user story to be considered complete, the following conditions must be met:

- All tasks associated with the user story have been completed.
- The implementation satisfies the acceptance criteria defined for the user story.
- The feature has been tested and all relevant tests pass successfully.
- The code passes **linting, TypeScript type checking, and Prettier formatting checks.**
- The feature has been tested with the frontend and backend integration where applicable.
- The code has been pushed to its **feature branch** and a Pull Request has been created.
- The Pull Request has been **reviewed and approved by at least one other team member.**
- Any issues identified during the code review have been resolved.
- The feature branch has been successfully merged into the `main` branch without unresolved conflicts.
- The latest version of the application has been successfully deployed and the feature works correctly in the deployed environment.
- Any relevant project documentation has been updated.

Once these conditions have been satisfied, the user story can be moved to Done in Taiga.
