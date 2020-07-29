# Cookbook

To develop Cookbook, copy `.env.sample` to `.env` and fill in the values to
refer to your local mysql server.

## File arrangement

There are two main components in this repository:

* An [Express](https://expressjs.com/) server meant to run on Node 12 (the
  latest version Dreamhost supports on Shared servers). This server both handles
  API calls and serves the client.
* A [Svelte 3](https://svelte.dev/) client meant to run on evergreen browsers.

The server's root is [`src/app.ts`](./src/app.ts) (matching Dreamhost's
requirement that the entrypoint for Passenger be `app.js`). The client code is
under [`src/client`](./src/client).

## URL arrangement

### JSON-based API under /api

See src/app.ts for API routes.

### Frontend routes and static data elsewhere

See ... for frontend routes. `sirv` routes every unknown path to `public/index.html`.
