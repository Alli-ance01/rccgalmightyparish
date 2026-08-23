import { trpc } from "@/lib/trpc";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { ensureTapApiJsonResponse } from "./lib/apiResponse";
import { getLocalSessionToken } from "./lib/localSession";
import "./index.css";

const queryClient = new QueryClient();
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "";

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    console.error("[API Query Error]", event.query.state.error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    console.error("[API Mutation Error]", event.mutation.state.error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${apiBaseUrl}/api/trpc`,
      transformer: superjson,
      async fetch(input, init) {
        const headers = new Headers(init?.headers);
        const sessionToken = getLocalSessionToken();
        if (sessionToken) headers.set("Authorization", `Bearer ${sessionToken}`);
        const response = await globalThis.fetch(input, {
          ...(init ?? {}),
          headers,
          credentials: "include",
        });
        return ensureTapApiJsonResponse(response);
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
