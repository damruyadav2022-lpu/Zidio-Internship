# Contributing to RetailPulse Enterprise

Thank you for contributing to RetailPulse! This document outlines our engineering standards, pull request workflow, and quality gates.

---

## 1. Development Setup

### Prerequisites
- Python 3.10+ (Python 3.11/3.14 compatible)
- Node.js 20+ and npm 10+
- Git

### Initial Setup
```bash
# 1. Clone repository
git clone https://github.com/retailpulse/retailpulse.git
cd retailpulse

# 2. Setup Python environment & dependencies
pip install -r requirements.txt

# 3. Setup Frontend dependencies
cd frontend
npm install
cd ..

# 4. Generate local SQLite database and model artifacts
python run_pipeline.py
```

---

## 2. Coding Standards & Conventions

- **Python**: Follow PEP 8 guidelines. Type hints are required for all function arguments and return types.
- **TypeScript**: Strict mode enabled (`tsconfig.json`). Zero untyped `any` in new services and components.
- **Security**: Never commit credentials, tokens, or live private keys. All sensitive configurations must use environment variables loaded through `backend/config.py`.

---

## 3. Pull Request (PR) Checklist

Before submitting a pull request:
1. `pytest tests/ -v` passes 100% of test cases.
2. `npm run build` inside `frontend/` builds without TypeScript or Vite errors.
3. No hardcoded credentials or unauthenticated operational endpoints.
4. Update `CHANGELOG.md` with a summary of your changes.
