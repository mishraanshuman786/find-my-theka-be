import {defineConfig} from "vitest/config";

export default defineConfig({
  test:{
    globals:true,
    environment:"node",
    setupFiles:["./tests/setup.ts"],
    // Tests using the same PostgreSQL test database 
    // must not run in parallel.
     fileParallelism: false,
    coverage:{
        provider:"v8",
        reporter:["text","html"]
    }
  }
});