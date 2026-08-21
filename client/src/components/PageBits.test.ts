import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { QueryError } from "./PageBits";

describe("public interface recovery components", () => {
  it("renders a clear retryable error message for failed content loads", () => {
    const html = renderToStaticMarkup(
      createElement(QueryError, {
        label: "We could not load the sermon archive.",
        retry: () => undefined,
      }),
    );

    expect(html).toContain('role="alert"');
    expect(html).toContain("We could not load the sermon archive.");
    expect(html).toContain("Try again");
  });
});
