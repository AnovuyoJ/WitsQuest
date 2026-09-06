# Third-party dependencies and attribution

This register supports the requirement **“All third-party libraries/code documented and the choice motivated.”** It covers all direct npm dependencies in the frontend and backend manifests, documentation tools, external services, and identified assets. Rationales explain their fit in the current implementation, rather than claiming a historical comparison of alternatives.

Versions and licence identifiers below were read from installed package metadata. Requested ranges come from `package.json`; the respective `package-lock.json` files record exact dependency trees, including transitive dependencies. This is a direct-dependency register, not a complete transitive licence audit. Package licence files remain the authoritative notices.

## Frontend libraries

| Package / source | Requested → installed | Licence identifier | Purpose and rationale |
| --- | --- | --- | --- |
| [@supabase/ssr](https://github.com/supabase/ssr#readme) | ^0.12.4 → 0.12.4 | MIT | Declared but no application import found. Provides cookie-based server authentication helpers; the current browser Auth flow does not need it. |
| [@supabase/supabase-js](https://github.com/supabase/supabase-js/tree/master/packages/core/supabase-js) | ^2.112.3 → 2.112.3 | MIT | Sign-in and token validation through the Auth client; avoids implementing identity-provider protocols while keeping application CRUD in Express. |
| [@types/leaflet](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/leaflet) | ^1.9.22 → 1.9.22 | MIT | Type declarations for leaflet; catch integration mistakes at compile time without adding runtime behavior. |
| [leaflet](https://leafletjs.com/) | ^1.9.4 → 1.9.4 | BSD-2-Clause | Interactive map and markers; supports campus coordinates and OpenStreetMap tiles without a proprietary map SDK. |
| [next](https://nextjs.org) | 16.3.1 → 16.3.1 | MIT | App Router, layouts and frontend build tooling; keeps page navigation and React delivery in one framework. |
| [react](https://react.dev/) | 19.2.8 → 19.2.8 | MIT | Reusable stateful UI components for event forms, cards and game screens. |
| [react-dom](https://react.dev/) | 19.2.8 → 19.2.8 | MIT | Renders React components into the browser DOM; required by the React frontend. |
| [react-leaflet](https://react-leaflet.js.org) | ^5.0.0 → 5.0.0 | Hippocratic-2.1 | Connects Leaflet layers to React components, simplifying map updates from event state. |
| [@tailwindcss/postcss](https://tailwindcss.com) | ^4 → 4.3.3 | MIT | Build-time Tailwind integration; generates the utility styles used by the interface. |
| [@testing-library/jest-dom](https://github.com/testing-library/jest-dom#readme) | ^7.0.1 → 7.0.1 | MIT | Loaded by Jest setup for readable DOM assertions. |
| [@testing-library/react](https://github.com/testing-library/react-testing-library#readme) | ^16.3.3 → 16.3.3 | MIT | Declared component-testing helper; no current test import found. Intended for testing user-visible React behavior. |
| [@types/node](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/node) | ^20.19.43 → 20.19.43 | MIT | Type declarations for node; catch integration mistakes at compile time without adding runtime behavior. |
| [@types/react](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/react) | ^19.2.18 → 19.2.18 | MIT | Type declarations for react; catch integration mistakes at compile time without adding runtime behavior. |
| [@types/react-dom](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/react-dom) | ^19.2.4 → 19.2.4 | MIT | Type declarations for react-dom; catch integration mistakes at compile time without adding runtime behavior. |
| [eslint](https://eslint.org) | ^9 → 9.39.5 | MIT | Static checks for JavaScript and TypeScript; catches common implementation mistakes. |
| [eslint-config-next](https://nextjs.org/docs/app/api-reference/config/eslint) | 16.3.1 → 16.3.1 | MIT | Framework-specific lint rules suited to Next.js code. |
| [jest](https://jestjs.io/) | ^30.5.1 → 30.5.1 | MIT | Runs automated tests with mocks and assertions; verifies authentication and API behavior. |
| [jest-environment-jsdom](https://www.npmjs.com/package/jest-environment-jsdom) | ^30.5.1 → 30.5.1 | MIT | Browser-like test environment without launching a real browser. |
| [tailwindcss](https://tailwindcss.com) | ^4 → 4.3.3 | MIT | Utility styling for consistent colours, spacing and responsive screens without a separate component framework. |
| [ts-node](https://typestrong.org/ts-node) | ^10.9.2 → 10.9.2 | MIT | Declared TypeScript execution helper; not directly invoked by the current frontend npm scripts. |
| [typescript](https://www.typescriptlang.org/) | ^5 → 5.9.3 | Apache-2.0 | Static types for client/server contracts and validation of code before deployment. |

## Backend libraries

| Package / source | Requested → installed | Licence identifier | Purpose and rationale |
| --- | --- | --- | --- |
| [@supabase/supabase-js](https://github.com/supabase/supabase-js/tree/master/packages/core/supabase-js) | ^2.112.3 → 2.112.3 | MIT | Sign-in and token validation through the Auth client; avoids implementing identity-provider protocols while keeping application CRUD in Express. |
| [cors](https://www.npmjs.com/package/cors) | ^2.8.6 → 2.8.6 | MIT | Enforces the configured browser origin list for the separate frontend and backend deployments. |
| [dotenv](https://github.com/motdotla/dotenv#readme) | ^17.4.2 → 17.4.2 | BSD-2-Clause | Loads local backend configuration from environment files instead of embedding configuration in code. |
| [express](https://expressjs.com/) | ^5.2.1 → 5.2.1 | MIT | Explicit handwritten HTTP routes and middleware; keeps authorization and validation under project control. |
| [pg](https://github.com/brianc/node-postgres) | ^8.23.0 → 8.23.0 | MIT | Direct parameterized PostgreSQL queries and transactions; supports handwritten data access without generated CRUD endpoints. |
| [@electric-sql/pglite](https://pglite.dev) | ^0.5.8 → 0.5.8 | Apache-2.0 | Embedded PostgreSQL for integration tests; exercises SQL without modifying the hosted database. |
| [@types/cors](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/cors) | ^2.8.19 → 2.8.19 | MIT | Type declarations for cors; catch integration mistakes at compile time without adding runtime behavior. |
| [@types/express](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/express) | ^5.0.6 → 5.0.6 | MIT | Type declarations for express; catch integration mistakes at compile time without adding runtime behavior. |
| [@types/jest](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/jest) | ^30.0.0 → 30.0.0 | MIT | Type declarations for jest; catch integration mistakes at compile time without adding runtime behavior. |
| [@types/node](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/node) | ^26.2.0 → 26.2.0 | MIT | Type declarations for node; catch integration mistakes at compile time without adding runtime behavior. |
| [@types/pg](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/pg) | ^8.23.1 → 8.23.1 | MIT | Type declarations for pg; catch integration mistakes at compile time without adding runtime behavior. |
| [jest](https://jestjs.io/) | ^30.5.1 → 30.5.1 | MIT | Runs automated tests with mocks and assertions; verifies authentication and API behavior. |
| [ts-jest](https://kulshekhar.github.io/ts-jest) | ^29.4.12 → 29.4.12 | MIT | Transforms backend TypeScript for Jest tests. |
| [tsx](https://tsx.hirok.io) | ^4.23.12 → 4.23.12 | MIT | Runs and watches TypeScript backend code during development and starts it in deployment. |

## Documentation tools

These packages are declared without version pins in `requirements.txt`; the versions below describe the inspected local environment, not guaranteed deployment versions.

| Tool / source | Local version | Licence metadata | Purpose and rationale |
| --- | --- | --- | --- |
| [MkDocs](https://www.mkdocs.org/) | 1.6.1 | BSD-2-Clause | Builds the Markdown docs into a navigable site, keeping documentation reviewable with the code. |
| [Material for MkDocs](https://squidfunk.github.io/mkdocs-material/) | 9.7.7 | MIT | Declared dependency, but not the active theme; `mkdocs.yml` selects MkDocs' bundled `readthedocs` theme. |
| [mkdocs-mermaid2-plugin](https://github.com/fralau/mkdocs-mermaid2-plugin) | 1.2.3 | MIT | Renders architecture diagrams from text so diagrams can evolve with the documentation. |

MkDocs' bundled search plugin provides documentation search. Mermaid is loaded by the Mermaid plugin to render diagrams; its runtime version is selected by plugin configuration/defaults rather than a project npm dependency.

## External services and platform APIs

| Service / source | Use and rationale | Attribution / version notes |
| --- | --- | --- |
| [Supabase Auth](https://supabase.com/docs/guides/auth) | Managed sessions and GitHub/Google sign-in avoid custom password and OAuth implementations. Express still validates tokens and enforces application access. | Hosted service, not version-pinned in this repository; the client SDK is listed above. Service terms are separate from SDK licensing. |
| [Supabase PostgreSQL hosting](https://supabase.com/docs/guides/database) | Relational constraints and transactions support linked events, cards and game results. Direct SQL preserves handwritten API control. | Hosted database version is not recorded here. Supabase Data API is not used for application CRUD. |
| [OpenStreetMap](https://www.openstreetmap.org/copyright) tile service | Supplies the campus map background displayed through Leaflet. | OpenStreetMap data is ODbL; display © OpenStreetMap contributors and retain the copyright link. Tile hosting has its own usage policy. |
| [Overpass API](https://wiki.openstreetmap.org/wiki/Overpass_API) | Returns mapped campus landmarks; results validate event coordinates and suggest event titles, making external data affect application behavior. | Uses OpenStreetMap data with its attribution. Public service availability and map coverage are limitations; see the [API reference](handwritten-api.md#post-apiadminlandmarkslookup). |
| Browser Geolocation API | Gets player coordinates for the backend's distance check; uses native device/browser support. | Browser platform API, not an installed package or external web data service; requires location permission. |
| GitHub and Google OAuth | Allow users to sign in with existing identities through Supabase Auth. | Provider integrations, not direct game-data APIs. Provider branding is distinct from code licensing. |
| Render and Vercel | Host the backend and frontend respectively, fitting their separate deployment configuration. | Hosting services, not libraries bundled with the app. |

## Reused code, fonts and visual assets

| Item | Origin and use | Rationale / attribution status |
| --- | --- | --- |
| Next.js starter | `frontend/README.md` records scaffolding with `create-next-app`. The application has been extended with project pages, authentication and gameplay. | Standard framework setup supplies build conventions; upstream Next.js uses MIT. |
| Geist and Geist Mono | Loaded from `next/font/google` in `frontend/app/layout.tsx`; upstream project: [Vercel Geist](https://github.com/vercel/geist-font). | Consistent sans-serif and monospace typography. Font licences are separate from Next.js; retain the font distribution's licence notices when redistributing font files. |
| Background SVG | `frontend/public/question-mark-pattern.svg` was authored for this project with OpenAI Codex assistance, then adjusted for size, rotation and opacity. | Lightweight repeating vector pattern of question marks, brains and magnifying glasses. It is not a downloaded emoji pack. |
| Inline icons and provider marks | SVGs appear inside project components. | The repository does not establish the original source/licence of every pre-existing SVG. Contributors should record original sources for any copied paths; do not assume all inline SVG is original. |
| Project-specific API, SQL and Overpass query | Handwritten routes/services and schema files, with AI assistance during migration and implementation. | Explicit validation, transactions and game rules meet the handwritten-API requirement. Overpass query syntax follows the reference linked in the API documentation. |

The repository root `LICENSE` declares MIT, while `backend/package.json` declares ISC; this metadata discrepancy should be resolved by the project owners. Neither declaration replaces third-party licences. In particular, React Leaflet's installed metadata declares **Hippocratic-2.1**, whereas Leaflet declares **BSD-2-Clause**.

## Maintaining this register

When adding a library or copied asset, record its name/version, original source, licence/notice, where it is used, why it is needed, and any adaptations. For copied snippets, include the original page or repository and identify which code was adapted. Update package lockfiles when dependencies change.

The tables cover every current direct npm declaration, including unused declarations explicitly marked above. Unknown historical snippet/icon origins remain attribution gaps; this page does not certify that those origins have been verified. Transitive package details are recorded in the lockfiles and distributed package notices.

See [System Design](Design/system-design.md#3-technologies) for the architecture and [API Reference](handwritten-api.md) for endpoint behavior.
