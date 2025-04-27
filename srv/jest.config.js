module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    setupFiles: ['dotenv/config'],
    testTimeout: 30000,
    collectCoverage: true, // ensures coverage is actually collected
    collectCoverageFrom: [
        "src/**",
        '!test/**/*.ts',  // exclude test files
        '!dist/**/*',  // exclude test files
    ]
};
