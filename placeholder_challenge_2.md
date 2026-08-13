# 🧩 Algorithm Optimization Challenge

## 💡 The Problem
Our current data processing pipeline is timing out when handling payloads larger than 50MB. Your mission is to analyze the existing data structure and implement a more efficient sorting and filtering algorithm. 

## 📋 Acceptance Criteria
- [ ] Refactor the `processData` function in `src/utils/dataHandler.js`.
- [ ] Reduce the time complexity from `O(n^2)` to at least `O(n log n)`.
- [ ] Memory usage during processing must not exceed 256MB.
- [ ] All existing test suites must pass without modification.

## 🚀 Getting Started
1. Clone the repository locally.
2. Install the necessary dependencies via your package manager:
   ```bash
   yarn install
   ```
3. Run the benchmark tests to see the current baseline performance:
   ```bash
   yarn run benchmark
   ```

## 📬 How to Submit
- Create a new branch named `feat/optimization-<your-username>`.
- Commit your changes with clear, descriptive messages.
- Push to your fork and submit a Pull Request.
- Include a screenshot of your benchmark results in the PR comments!

## 📖 Helpful Links
- [Big O Notation Guide](https://www.bigocheatsheet.com/)
- [Node.js Profiling](https://nodejs.org/en/docs/guides/simple-profiling/)
