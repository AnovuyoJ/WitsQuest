# Sprint 2 Plan

**Sprint duration:** 25 August 2026 – 15 September 2026

## Preparatory Work Completed

- Project documentation was reviewed and updated following feedback from the Sprint 1 marking
- The Sprint 2 rubric was reviewed in detail
- User stories for the intermediate features were identified and added to the Taiga backlog

## Sprint 2 Rubric Checklist

The following requirements were set for Sprint 2 marking. Each item below still needs an owner, assigned once the team meets.

### Core Development
- [ ] Core features implemented with at most one non-severe bug

### Testing
- [ ] UI and API tests implemented — testing real behaviour and edge cases, not just that code runs
- [ ] Security-critical logic tested (authentication, account deletion)
- [ ] Testing implemented across all features
- [ ] Testing Document written, covering:
  - Tools used, and rationale for each
  - Testing policy (e.g. "critical logic — auth, location verification — requires tests before merge")
  - User feedback process

### Client Engagement
- [ ] Extensive evidence of client meetings collected (screenshots, detailed minutes), with emphasis on feedback received

### Deployment & APIs
- [ ] APIs deployed (not only accessed locally)
- [ ] API documentation written: what each endpoint accepts, returns, and what authentication it requires (request/response shape)
- [ ] Confirm with Calvin whether the OpenStreetMap/Leaflet map tiles count as the required external API integration

### User Testing
- [ ] Recruit 3–5 external users to try the game
- [ ] Collect formal feedback (e.g. a Google Form survey)
- [ ] Make at least one concrete change to the game based on that feedback

### Project Methodology
- [ ] Continue using Taiga for sprint tracking
- [ ] Document stand-up meetings
- [ ] Hold a sprint retrospective (what worked, what didn't)

### Bug Tracking
- [ ] Use Gitea's Issues log for bug tracking
- [ ] Reference bug tracker IDs in commit messages when fixing an issue

### Database Documentation
- [ ] Dedicated documentation page listing all tables, columns, types, and relationships
- [ ] ER diagram
- [ ] Deployment info documented
- [ ] Key database design decisions motivated/explained

### Third-Party Code Documentation
- [ ] All external libraries and packages documented, with rationale for each (cross-check against `package.json`)

## Backlog: Intermediate Features

[List the user stories added to Taiga for the intermediate features here — pull directly from the backlog once finalised]

## Open Items for the Sprint 2 Planning Meeting

- Confirm sprint start date
- Set the Sprint 2 goal
- Assign user stories to team members
- Estimate story points
- Decide who owns each rubric checklist item aboves


## Unit Testing Plan

For Sprint 2, we plan to introduce **unit testing gradually**, starting with the easiest and most isolated functionality before moving to tests that require mocking external services.

### 1. Location Verification (Haversine)

This will be tested first because the Haversine calculation is a pure mathematical function with no database, authentication, or external dependencies.

**Planned tests:**

- Test two coordinates with a known distance between them.
- Test a location exactly at the allowed radius boundary.
- Test a location clearly outside the allowed radius.

### 2. Authentication Service (`authService.ts`)

The authentication logic will be tested next. The Supabase client will need to be mocked so that the tests do not interact with the real database or authentication service.

**Planned tests:**

- Test that sign-up with valid input succeeds.
- Test that sign-up with an invalid or duplicate email fails correctly.
- Test that sign-in with incorrect credentials returns the correct error.

### 3. Challenge Submission Logic

The challenge submission logic will be tested to ensure that answers are scored correctly and that players cannot submit the same challenge more than once. Supabase interactions will also need to be mocked.

**Planned tests:**

- Test that a first-time submission is accepted.
- Test that a duplicate submission is rejected.
- Test that each supported question type is scored correctly.

### 4. Authentication Forms (`SignUpForm.tsx` / `SignInForm.tsx`)

Frontend form components will be tested after the main application logic. These are considered lower priority because they mainly handle UI behaviour.

**Planned tests:**

- Test that the form displays an error for empty or invalid fields.
- Test that the form calls `authService` with the entered values.

### Testing Order

The planned testing order is:

`Haversine → authService → Challenge Submission → Authentication Forms`

This allows the team to start with simple unit tests and gradually move towards more involved tests that require mocking and frontend component testing.

