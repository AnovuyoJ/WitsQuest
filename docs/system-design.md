# Wits Quest – Software Design

## 1. Introduction

Wits Quest is a location-based campus game designed for students at the University of the Witwatersrand. Players move around campus, discover active events, verify that they are physically within an event area, and complete challenges to earn collectible cards.

The system also provides an administrative interface where authorised administrators can create events, create challenges, manage cards, and control game content.

The application is implemented using **Next.js, React, TypeScript, Supabase, Tailwind CSS, and Leaflet**.

---

## 2. System Architecture

Wits Quest follows a layered web application architecture consisting of three main layers:

### Presentation Layer

The presentation layer contains the user interface of the application. It is implemented using **Next.js, React, TypeScript, and Tailwind CSS**.

It includes:

- Player dashboard
- Events interface
- Campus map
- Challenge interface
- Admin interface
- Profile and navigation components

### Application Logic Layer

The application logic layer handles the main rules and functionality of the game.

This includes:

- Location verification
- Event status checking
- Challenge validation
- Challenge answer submission
- Authentication and access control
- Card awarding

### Data Layer

The data layer uses **Supabase** and its PostgreSQL database.

It is responsible for storing:

- Users
- Events
- Challenges
- Cards
- Location verifications
- Player progress

The overall architecture can be represented as:

```text
User
  |
  v
Next.js / React Frontend
  |
  v
Application / API Logic
  |
  v
Supabase
  |
  +-- Authentication
  |
  +-- PostgreSQL Database
```

---

## 3. Technologies

| Technology | Purpose |
|---|---|
| Next.js | Main web application framework |
| React | Building reusable user interface components |
| TypeScript | Type-safe application development |
| Tailwind CSS | Styling and responsive design |
| Supabase | Authentication and database services |
| PostgreSQL | Persistent data storage |
| Leaflet | Interactive campus map |
| React Leaflet | Integration of Leaflet with React |
| Browser Geolocation API | Obtaining the player's current location |
| GitHub OAuth | User authentication |

---

## 4. Frontend Design

The frontend uses the **Next.js App Router**.

Important application routes include:

```text
/dashboard
/dashboard/events
/dashboard/admin/events
/dashboard/admin/challenges
/dashboard/admin/cards
/map
/notifications
```

### 4.1 Player Dashboard

The player dashboard acts as the main page after authentication.

It allows players to:

- Navigate through the game
- View events
- Access the campus map
- View notifications
- Access their profile
- Log out

### 4.2 Events Interface

The events interface displays events created for the game.

Each event contains information such as:

- Event title
- Description
- Latitude
- Longitude
- Allowed radius
- Start time
- End time

Players must be within the allowed event radius before they can participate in its challenge.

### 4.3 Campus Map

The campus map is implemented using **Leaflet** and **React Leaflet**.

The map displays the locations of game events using their stored latitude and longitude coordinates.

Events can be represented using map markers and their associated location radius.

---

## 5. Location Verification Design

Location verification ensures that players are physically close enough to an event before attempting its challenge.

The browser uses the **Geolocation API** to obtain the player's current:

- Latitude
- Longitude
- Location accuracy

The player's location is sent to the location verification API.

The backend retrieves the event's coordinates and compares them with the player's coordinates.

### Location Verification Flow

```text
Player selects event
        |
        v
Browser requests location
        |
        v
Player coordinates obtained
        |
        v
Coordinates sent to API
        |
        v
Event coordinates retrieved
        |
        v
Distance calculated
        |
        v
Is player within event radius?
       / \
     Yes  No
      |    |
      v    v
 Challenge Access
 available denied
```

The system uses the **Haversine formula** to calculate the distance between the player and the event.

The calculated distance is compared with the event's `radius_meters`.

```text
distance <= radius_meters
```

If this condition is true, the player's location is successfully verified.

The system also checks whether the event is currently active using its start and end times.

---

## 6. Authentication Design

Authentication is handled using **Supabase Auth**.

The application supports authentication methods such as:

- Email and password
- GitHub OAuth

Supabase manages the authenticated user's session.

Protected application functionality checks whether a valid authenticated user exists before allowing access.

---

## 7. Administrator Access

Administrative functionality is separated from normal player functionality.

The main administrative routes are:

```text
/dashboard/admin/events
/dashboard/admin/challenges
/dashboard/admin/cards
```

Admin pages perform an additional authorisation check.

If a user does not have administrator access, they are redirected to the normal dashboard.

Administrators can manage:

- Events
- Challenges
- Cards

---

## 8. Event Management

Administrators can create, view, update, and delete events.

An event contains:

```text
Event
-------------------------
id
title
description
latitude
longitude
radius_meters
starts_at
ends_at
created_at
```

The administrator provides the event's coordinates and radius. These values are later used during player location verification.

---

## 9. Challenge Management

Each event can have one or more challenges.

Administrators manage challenges through:

```text
/dashboard/admin/challenges
```

A challenge contains information such as:

```text
Challenge
-------------------------
id
event_id
question_text
question_type
options
correct_answer
card_id
created_at
```

The `event_id` associates a challenge with an event.

The application supports three challenge question types:

- Multiple choice
- True / False
- Text answer

### Multiple Choice

Multiple-choice challenges contain a list of possible answers.

The administrator must provide at least two options and specify the correct answer.

The correct answer must match one of the provided options.

### True / False

True/False challenges allow the administrator to select either `True` or `False` as the correct answer.

### Text Answer

Text challenges allow players to manually enter an answer which can be compared with the expected answer stored for the challenge.

---

## 10. Challenge Submission

After a player's location has been successfully verified, the player can attempt the challenge associated with the event.

The general challenge flow is:

```text
Player
  |
  v
Verify location
  |
  v
Display challenge
  |
  v
Submit answer
  |
  v
Validate answer
  |
  +----------------+
  |                |
Correct          Incorrect
  |                |
  v                v
Award card      Show result
```

The player's submitted answer is compared with the challenge's stored correct answer.

If the answer is correct, the player can receive the associated card.

---

## 11. Card System

Cards are rewards that players can earn by successfully completing challenges.

Administrators can manage cards from:

```text
/dashboard/admin/cards
```

A card can contain information such as:

- Title
- Description
- Rarity
- Theme
- Associated challenge or event

Cards provide a reward and progression mechanism for players participating in Wits Quest.

---

## 12. Database Design

The application uses a **Supabase PostgreSQL database**.

### Events

```text
events
-------------------------
id
title
description
latitude
longitude
radius_meters
starts_at
ends_at
created_at
```

### Challenges

```text
challenges
-------------------------
id
event_id
question_text
question_type
options
correct_answer
card_id
created_at
```

### Location Verifications

```text
location_verifications
-------------------------
id
player_id
event_id
distance_meters
verified_at
```

### Database Relationships

An event can contain multiple challenges:

```text
Event
  |
  | 1
  |
  +--------< Challenges
              many
```

A location verification connects a player with an event and records the calculated distance.

---

## 13. Component Design

The frontend uses reusable React components to reduce duplicated code.

Examples include:

```text
Sidebar
ProfileMenu
ProfileMenuContainer
LogoutButton
CampusMap
```

### Sidebar

The sidebar provides navigation between the main application pages.

It contains links such as:

- Dashboard
- Events
- Notifications

The sidebar can also be collapsed to provide more screen space.

### Profile Menu

The profile menu displays information about the authenticated user and provides account-related functionality.

### Campus Map

The `CampusMap` component displays game events geographically using React Leaflet.

It retrieves event information and displays event markers on the campus map.

---

## 14. Service and Utility Design

Reusable application logic is separated from UI components where appropriate.

Utility and service functions handle functionality such as:

- Supabase configuration
- Event retrieval
- Geographic calculations
- Location verification
- Event status calculation
- Authentication

This reduces duplicated code and keeps components focused on presentation.

---

## 15. Security Design

### Authentication

Users must authenticate before accessing protected functionality.

### Administrator Authorisation

Admin functionality performs additional checks to prevent normal players from accessing administrative pages.

### Location Validation

The player's reported location is compared with the stored event location before the challenge is made available.

The application can reject location readings when the reported GPS accuracy is too poor.

### Server-Side Validation

Important game rules should be validated by backend/API logic rather than relying only on frontend validation.

This reduces the possibility of users bypassing game restrictions by modifying frontend behaviour.

---

## 16. Error Handling

The system provides feedback when operations fail.

Possible errors include:

- User is not authenticated
- User does not have administrator access
- Location permission is denied
- Player location cannot be determined
- GPS accuracy is insufficient
- Player is outside the event radius
- Event is inactive
- Challenge information is invalid
- Database operation fails

The application also displays confirmation messages when administrative operations are successful.

Examples include:

```text
Challenge added successfully.
Challenge updated successfully.
Challenge deleted successfully.
```

---

## 17. Overall System Flow

```text
                    WITS QUEST
                         |
                         v
                       User
                         |
                         v
                Authentication
                         |
                         v
                Player Dashboard
                         |
              +----------+----------+
              |                     |
              v                     v
            Events               Campus Map
              |                     |
              +----------+----------+
                         |
                         v
                  Select Event
                         |
                         v
                Verify Location
                         |
                         v
                Attempt Challenge
                         |
                         v
                  Submit Answer
                         |
                   +-----+-----+
                   |           |
                   v           v
                Correct     Incorrect
                   |
                   v
                Earn Card
```

---

## 18. Design Summary

Wits Quest uses a modular web application design that separates the **user interface, application logic, authentication, and database functionality**.

Next.js and React provide the frontend interface, while Supabase provides authentication and persistent database storage. Leaflet provides the interactive campus map, and the browser's Geolocation API provides player location information.

The core game flow consists of:

1. A player authenticating into the application.
2. The player discovering an event.
3. The application verifying the player's location.
4. The player attempting the event's challenge.
5. The application validating the submitted answer.
6. The player receiving a card after successfully completing the challenge.

This structure allows Wits Quest to combine location-based gameplay, campus exploration, challenges, and collectible rewards in a single web application.