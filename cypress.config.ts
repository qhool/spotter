import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    setupNodeEvents() {
      // no-op placeholder; extend when e2e tests are added
    },
    specPattern: 'src/tests/e2e/**/*.cy.{ts,tsx}',
    supportFile: false
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite'
    },
    specPattern: 'src/tests/cypress/**/*.cy.{ts,tsx}',
    supportFile: false
  }
});
