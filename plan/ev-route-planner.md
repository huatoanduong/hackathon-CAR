# EV Route Planner Requirements

## Goal

Build an EV route planning app that draws a driving route and automatically adds charging stops based on the user's current battery, selected vehicle model, official vehicle range, and the actual route.

## MVP Inputs

- Start location
- Destination
- Vehicle model
- Current battery percentage
- Charge threshold, defaulting to `30%`

The charge target is fixed at `80%` for the MVP and does not need to be exposed as a primary user setting.

## Core Assumptions

- All EVs are assumed to be compatible with all charging stations.
- Vehicle range is calculated from the official technical specification for each vehicle model.
- Charging time is not included in route calculation.
- After each charging stop, the vehicle is assumed to charge back to `80%`.
- The destination is treated as a special case: if the vehicle can reach the destination with at least `20%` battery remaining, no additional charging stop is required.

## Main Flow

1. Find the fastest route from the current point to the destination.
2. Estimate the battery percentage at arrival using the route distance and the official vehicle range.
3. If the estimated arrival battery is at least `20%`, draw the direct route without adding a charging stop.
4. If the destination cannot be reached with at least `20%` battery:
   - Estimate the location on the route where the battery reaches the charge threshold, defaulting to `30%`.
   - Search for a charging station in the preferred battery window from the threshold down to `20%`.
   - Select a charging station based on real detour time, not straight-line distance.
   - If no valid station is found, expand the search earlier along the route:
     - `40%` to threshold
     - `50%` to `40%`
     - `60%` to `50%`
     - Continue expanding upward until a valid station is found or the current battery limit is reached.
5. Add the selected charging station to the waypoint list.
6. Recalculate the route through the selected charging station.
7. From the charging station, assume the vehicle leaves with `80%` battery.
8. Repeat the process from the charging station to the destination until the destination is reachable with at least `20%` battery.

## Charging Station Selection Rules

- Prefer the station with the lowest real detour time.
- The station should be generally aligned with the forward direction of travel.
- Do not select a charging station that has already been added to the route.
- Do not select a station that causes the route to clearly backtrack.
- If the app selects a station earlier than the charge threshold because no better station is available later, the UI should clearly explain that the stop was selected earlier due to charger availability.

## Outputs

The app should show both a map route and route details.

### Map View

The map should display one complete route containing:

- Start location
- Charging stop or stops
- Destination

### Route Detail Panel

The route detail panel should show each leg of the trip:

- Leg start point
- Leg end point
- Estimated battery on arrival
- For charging stops:
  - Battery before charging
  - Battery after charging, fixed at `80%`

## Out of Scope for MVP

- Charging connector compatibility
- Charging station power level
- Charging station live availability or operational status
- Charging duration
- Real-world driving efficiency adjustment
- Detailed max charging stop or max iteration handling
- User-selectable route optimization strategy

## Future Enhancements

- Adjust estimated range using real driving data from the user.
- Add a safety buffer based on weather, speed, elevation, traffic, or road type.
- Filter charging stations by connector type, charging power, and live station status.
- Include total trip ETA with charging duration.
- Allow users to customize the charge target instead of always charging to `80%`.
