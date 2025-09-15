module.exports = {
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['js', 'jsx'],
  transform: {
    '^.+\\.[tj]sx?$': 'babel-jest',
  },
  transformIgnorePatterns: ['/node_modules/(?!(react-router-dom|react-router)/)'],
  setupFiles: ['./jest.setup.js'],
  moduleNameMapper: {
    '\\.(css)$': 'identity-obj-proxy',
  },
};
