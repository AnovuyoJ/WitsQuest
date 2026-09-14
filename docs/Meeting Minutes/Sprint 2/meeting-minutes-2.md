## Meeting 2 — Development and Testing Progress

**Date:** 1 September 2026

**Attendees:**

* Busisiwe Dlamini
* Lerato Sikhumbana
* Anovuyo Dlamini

### Discussion:

### 1. **Development Progress**

* The team reviewed the progress of the intermediate features assigned for Sprint 2.
* Each team member provided an update on their assigned user stories.
* Any implementation problems and dependencies between features were discussed.

### 2. **Unit Testing**

* The team discussed introducing unit testing gradually into the project.
* We agreed to begin with functionality that is isolated and easier to test before testing components that require external services.

### 3. **Location Verification Testing**

* The Haversine location calculation was identified as the first functionality to test because it does not depend on the database or authentication service.
* Planned tests include:

  * Testing coordinates with a known distance.
  * Testing a location exactly on the allowed radius boundary.
  * Testing a location outside the allowed radius.

### 4. **Authentication Testing**

* The team discussed testing the authentication service.
* Supabase will need to be mocked so that unit tests do not interact with the live authentication service.
* Planned tests include:

  * Successful sign-up.
  * Invalid or duplicate email handling.
  * Incorrect sign-in credentials.

### 5. **Challenge Submission Testing**

* The team discussed testing challenge submission and scoring.
* Tests should confirm that:

  * A first-time submission is accepted.
  * Duplicate submissions are rejected.
  * Supported question types are scored correctly.

### 6. **Frontend Testing**

* Authentication form tests will be implemented after the main application logic tests.
* Tests will verify form validation and calls to the authentication service.

### Action Items:

* Begin unit testing with the Haversine calculation.
* Add tests for authentication services.
* Add tests for challenge submission logic.
* Add authentication form tests.
* Ensure tests cover real behaviour and edge cases rather than only checking whether code executes.
