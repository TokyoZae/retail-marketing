# Contributing to Local Retail Promotion Hub

Thank you for your interest in contributing to the Local Retail Promotion Hub! This document provides guidelines and instructions for contributing to this project.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Workflow](#development-workflow)
- [Style Guidelines](#style-guidelines)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Community](#community)

## 🎯 Code of Conduct

This project adheres to a code of conduct that we expect all contributors to follow. Please be respectful, constructive, and inclusive in all interactions.

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- Git
- Docker (optional, for containerized development)

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/local-retail-promotion-hub.git
   cd local-retail-promotion-hub
   ```

3. Add the upstream repository:
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/local-retail-promotion-hub.git
   ```

### Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Return to root
cd ..
```

### Set Up Environment Variables

1. Copy the environment template:
   ```bash
   cp backend/.env.example backend/.env
   ```

2. Fill in your environment variables in the `.env` file

### Start Development Environment

```bash
# Using Docker (recommended)
docker-compose -f docker/docker-compose.dev.yml up

# Or manually
cd backend
npm run dev
```

## 🤝 How Can I Contribute?

### Reporting Bugs

Before creating a bug report, please:

1. Check existing issues to avoid duplicates
2. Use the latest version to verify the bug still exists
3. Collect information about the bug

When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce** the issue
- **Expected behavior** vs **actual behavior**
- **Screenshots** (if applicable)
- **Environment details** (OS, browser, Node.js version)
- **Error messages** or logs

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear title** describing the enhancement
- **Provide detailed description** of the proposed feature
- **Explain the use case** and benefits
- **Suggest implementation approach** (if you have ideas)
- **Include mockups or examples** (if applicable)

### Contributing Code

We welcome contributions in the following areas:

#### Frontend Contributions

- **UI/UX improvements**
- **New components** for the design system
- **Responsive design** enhancements
- **Accessibility improvements**
- **Performance optimizations**

#### Backend Contributions

- **New API endpoints**
- **Database optimizations**
- **Security enhancements**
- **Authentication/authorization** improvements
- **Integration** with third-party services

#### Documentation Contributions

- **README improvements**
- **API documentation**
- **Code comments**
- **Tutorial creation**
- **Translation** to other languages

### Other Contributions

- **Testing** and quality assurance
- **Design** and branding
- **Community support** and answering questions
- **Blog posts** and case studies

## 🔄 Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/my-new-feature
# or
git checkout -b fix/bug-description
```

**Branch naming conventions:**
- `feature/feature-name` - new features
- `fix/bug-description` - bug fixes
- `docs/documentation-update` - documentation changes
- `refactor/component-name` - code refactoring
- `test/test-improvements` - test additions/improvements

### 2. Make Your Changes

- Follow the style guidelines (see below)
- Write or update tests as needed
- Update documentation if necessary
- Keep commits atomic and focused

### 3. Test Your Changes

```bash
# Backend tests
cd backend
npm test

# Linting
npm run lint

# Manual testing
# Test your changes locally before submitting
```

### 4. Commit Your Changes

```bash
git add .
git commit -m "feat: add user authentication system"
```

### 5. Push to Your Fork

```bash
git push origin feature/my-new-feature
```

### 6. Create a Pull Request

- Go to your fork on GitHub
- Click "New Pull Request"
- Select `main` branch of the original repo as base
- Fill in the PR template
- Link related issues

## 🎨 Style Guidelines

### JavaScript/Node.js Style Guide

We follow **StandardJS** style guidelines with some modifications:

- **Use 2 spaces** for indentation
- **Use single quotes** for strings
- **No semicolons** (except where necessary)
- **CamelCase** for variables and functions
- **PascalCase** for classes and constructors
- **UPPER_SNAKE_CASE** for constants

**Example:**
```javascript
// Good
const userName = 'john_doe'
const MAX_RETRY_ATTEMPTS = 3

function calculateDiscount (price, percentage) {
  return price * (1 - percentage / 100)
}

class DealManager {
  constructor () {
    this.deals = []
  }
}

// Bad
const user_name = 'john_doe';
function calculate_discount(price, percentage){
  return price * (1 - percentage / 100);
}
```

### HTML/CSS Style Guide

- **Use 2 spaces** for indentation
- **Use lowercase** for HTML tags and attributes
- **Use kebab-case** for CSS classes and IDs
- **Use semantic HTML** elements
- **Use BEM methodology** for CSS naming

**Example:**
```html
<!-- Good -->
<article class="deal-card deal-card--featured">
  <h2 class="deal-card__title">Summer Sale</h2>
  <p class="deal-card__description">50% off all items</p>
</article>

<!-- Bad -->
<DIV CLASS="DealCard">
  <H2>Summer Sale</H2>
  <p>50% off all items</p>
</DIV>
```

### API Design Guidelines

- **Use RESTful principles**
- **Use HTTP status codes** appropriately
- **Use JSON** for request/response bodies
- **Version APIs** in URL or headers
- **Document all endpoints**

**Example:**
```javascript
// Good
app.get('/api/v1/deals/:id', async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id)
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' })
    }
    res.json(deal)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})
```

## 💬 Commit Messages

We follow **Conventional Commits** specification:

**Format:** `<type>(<scope>): <subject>`

### Types:
- **feat**: new feature
- **fix**: bug fix
- **docs**: documentation changes
- **style**: formatting changes
- **refactor**: code restructuring
- **test**: adding or updating tests
- **chore**: maintenance tasks

### Examples:

```bash
feat(auth): add JWT token validation
fix(api): resolve database connection timeout
docs(readme): update installation instructions
style(frontend): format code with prettier
refactor(models): simplify user schema
test(auth): add unit tests for login endpoint
chore(deps): update npm packages
```

### Commit Message Guidelines:

- **Use present tense** ("add feature" not "added feature")
- **Use imperative mood** ("move cursor to..." not "moves cursor to...")
- **Keep it concise** (50 characters or less for subject)
- **Provide detailed description** in commit body if needed
- **Reference issues** using #issue-number

## 🔄 Pull Request Process

### Before Submitting

- [ ] Code follows style guidelines
- [ ] All tests pass locally
- [ ] New tests added for new functionality
- [ ] Documentation updated
- [ ] Commit messages follow conventions
- [ ] Branch is up-to-date with main

### PR Template

When creating a PR, please fill out the template:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## How Has This Been Tested?
Describe testing performed

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Tests pass
- [ ] Documentation updated
```

### Review Process

1. **Automated checks** must pass (tests, linting)
2. **Code review** by maintainers
3. **Feedback addressed** by contributor
4. **Approved** by at least one maintainer
5. **Merged** by maintainer

### After Merge

- Your contribution will be included in the next release
- You'll be added to the contributors list
- Release notes will credit your contribution

## 🌟 Community

### Getting Help

- **GitHub Issues**: For bugs and feature requests
- **Discussions**: For general questions and ideas
- **Email**: For security issues or private matters

### Recognition

We recognize contributors in the following ways:

- **Contributors list** in README
- **Release notes** for each version
- **Hall of Fame** for significant contributions
- **Special badges** for maintainers and top contributors

### Becoming a Maintainer

Regular contributors who demonstrate:

- **Quality contributions** over time
- **Community involvement** and helpfulness
- **Technical expertise** and good judgment
- **Commitment** to project values

...may be invited to become maintainers with merge privileges.

## 📚 Additional Resources

- [Project Architecture](docs/architecture.md)
- [API Documentation](docs/api.md)
- [Deployment Guide](docs/deployment.md)
- [Development Setup](docs/development.md)

## 🙏 Thank You!

Your contributions make this project better for everyone. We appreciate your time, effort, and dedication to helping local retail businesses thrive!

---

*This contributing guide is a living document. Please suggest improvements as you get involved with the project!*