---
name: project-strict-schema-native-skew
description: API response schemas are z.strictObject and the web client parses strictly; the Capacitor app bundles web, so adding a response field breaks installed apps
metadata:
  type: project
---

Response schemas in `packages/schema` are often `z.strictObject`, and `apps/web/src/ui/api-client.ts` calls `schema.parse`. Because of that, a new key in a server response makes old clients throw. The Capacitor app (`apps/mobile`, `webDir: ../web/dist-native`) ships the web bundle inside the app, so installed versions lag behind the server. PWA tabs left open during a deploy have the same problem.

**Why:** found in the review of c2960942 (25/10/2026): `goTo` was added to `TrophyRoomResponse.plaques`. As a result, an old native client cannot open the trophy room, and the home trophy shelves show empty.

**How to apply:** whenever a diff adds a field to a server response, check whether the client schema for it is strict. If it is, flag a version-skew risk for the native app and suggest one of these fixes:
- a separate endpoint for the new data;
- a client that parses in strip mode;
- a decision recorded in the deploy docs.
