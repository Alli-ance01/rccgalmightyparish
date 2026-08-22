# Follow-up Validation Notes

The recovered local preview rendered the supplied official parish contact information on `/contact`, including the full Ibadan address, `ogundereoluwatimileyin@gmail.com`, and `07046611108`.

A route-scroll regression exercise was executed from a scrolled contact page toward `/give`. The new route-level reset is also covered by `client/src/lib/scroll.test.ts`, which asserts that every route change invokes `window.scrollTo({ top: 0, left: 0, behavior: "auto" })`.
