import { StackServerApp } from "@stackframe/stack";

export const stackApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
});
