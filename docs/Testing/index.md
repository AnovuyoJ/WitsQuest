# Testing

Wits Quest testing combines automated checks with observed player and administrator tasks. It covers software behaviour, game rules and usability across desktop and mobile devices.

## Documentation guide

| Area | Documentation |
|---|---|
| Responsibilities, test quality and release criteria | [Testing policy](testing-policy.md) |
| Tools, commands, continuous integration and failure diagnosis | [Automated testing procedure](automated-testing.md) |
| Participant sessions, feedback analysis and acceptance | [User feedback and UAT](user-feedback.md) |
| Feature coverage and manual scenarios | [Test plan](test-plan.md) |
| Results, defects and acceptance traceability | [Evidence and reporting](test-evidence.md) |

## Testing lifecycle

Testing starts with the acceptance criteria for a user story. Development checks focus on changed behaviour, followed by package-level regression checks and peer review. Continuous integration checks the proposed revision, while user acceptance testing evaluates complete tasks on a candidate build.

Feedback enters the defect and improvement tracking process. Fixes return through regression testing and acceptance review before closure. Release assessment brings together automated results, user-task outcomes and outstanding risks.

## Automated and manual coverage

The repository contains Jest tests for frontend interactions, services and backend API flows. The Gitea workflow configures checks for pushes and pull requests targeting `main` and `develop`.

Manual coverage complements automation for browser layout, GPS and camera permissions, authentication email delivery and multi-device play. The package scripts do not currently configure a browser end-to-end runner.
