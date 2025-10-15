module.exports = {
   preset: 'ts-jest',
   testEnvironment: 'node',
   transform: {
       "^.+\\.ts$": "ts-jest",
   },
   testMatch: ["**/src/**/*.test.ts"],
};