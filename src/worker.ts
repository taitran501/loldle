export default { async fetch(request: Request, env: { ASSETS: { fetch: typeof fetch } }) { return env.ASSETS.fetch(request); } };
