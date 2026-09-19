import server from "../dist/server/server.js";

export default async function handler(request, response) {
  const protocol = request.headers["x-forwarded-proto"] || "https";
  const host = request.headers.host;
  const url = `${protocol}://${host}${request.url}`;
  const headers = new Headers();

  for (const [name, value] of Object.entries(request.headers)) {
    if (value) headers.set(name, Array.isArray(value) ? value.join(", ") : value);
  }

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const webRequest = new Request(url, {
    method: request.method,
    headers,
    body: hasBody ? request : undefined,
    duplex: "half",
  });
  const webResponse = await server.fetch(webRequest, {}, {});

  response.statusCode = webResponse.status;
  webResponse.headers.forEach((value, name) => {
    response.setHeader(name, value);
  });
  response.end(Buffer.from(await webResponse.arrayBuffer()));
}
