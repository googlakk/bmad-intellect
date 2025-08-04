# AI-CONTEXT.md

This file helps AI assistants understand your project structure, conventions, and patterns.
It's automatically loaded by AI tools to provide consistent context across sessions.

## Project Overview

**Project**: Образовательная платформа «Интеллект» (BMAD Intelligence Platform)
**Framework**: Next.js (модульный монолит)
**Language**: TypeScript/JavaScript
**Last Updated**: 2025-07-30

### Description
Образовательная платформа с AI-каталогом сервисов и обучающими модулями. MVP включает Learning Center (обучающий модуль) и Service Catalog (каталог AI-сервисов).

### Key Features
- AI-каталог сервисов с управлением админами
- Обучающие курсы и уроки с прогрессом пользователей
- Система аутентификации и авторизации
- Адаптивный интерфейс с современными UI компонентами
- Интеграция с AI-сервисами через API

## Tech Stack

### Core Technologies
- **Framework**: Next.js (React-based full-stack framework)
- **Language**: TypeScript/JavaScript
- **Package Manager**: npm
- **Platform**: Vercel (deployment)
- **Database**: Supabase (PostgreSQL)

### Key Dependencies
- **UI Framework**: React с Radix UI компонентами
- **Styling**: Tailwind CSS
- **State Management**: Zustand (легковесная альтернатива Redux)
- **API Client**: React Query (TanStack Query) для data fetching
- **Database ORM**: Prisma для взаимодействия с БД
- **Backend as a Service**: Supabase (БД, аутентификация, файловое хранилище)
- **Authentication**: Supabase Auth

## Project Structure

```
bmad/
├── .bmad-core/           # BMAD методология и агенты
│   ├── agents/          # AI агенты для разработки
│   ├── workflows/       # Рабочие процессы разработки
│   ├── templates/       # Шаблоны документов
│   └── data/           # База знаний и техпредпочтения
├── docs/                # Проектная документация
│   ├── architecture.md  # Архитектурная документация
│   ├── prd.md          # Product Requirements Document
│   ├── stories/        # User Stories
│   └── PROJECT-SUMMARY.md
├── .claude/             # Claude Code конфигурация
│   ├── commands/       # Кастомные команды
│   └── settings.local.json
└── web-bundles/         # Скомпилированные агенты для веб
```

## Development Guidelines

### Code Style
- **Naming**: camelCase для переменных, PascalCase для компонентов
- **Components**: Функциональные компоненты с TypeScript интерфейсами
- **State Management**: Zustand для глобального состояния, useState для локального
- **Styling**: Tailwind CSS классы с responsive дизайном

### Best Practices
1. Используйте TypeScript интерфейсы для всех props и данных
2. Компоненты должны быть переиспользуемыми и модульными
3. Применяйте принципы Radix UI для доступности
4. Следуйте паттернам React Query для управления серверным состоянием

### Common Patterns
- **Component Structure**: Функциональные компоненты с хуками
- **Data Flow**: Server State через React Query, Client State через Zustand
- **Error Handling**: Error boundaries и graceful degradation

## API Patterns

### Database Schema (Prisma)
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  role      UserRole @default(USER)
  createdAt DateTime @default(now())
}

model Course {
  id          String   @id @default(cuid())
  title       String
  description String?
  lessons     CourseLesson[]
}

model ServiceCatalogEntry {
  id          String   @id @default(cuid())
  name        String
  description String
  category    String
  isActive    Boolean  @default(true)
}
```

### Supabase Integration
- **Authentication**: Supabase Auth с email/password и social providers
- **Database**: PostgreSQL через Supabase с Prisma ORM
- **Storage**: Supabase Storage для файлов и медиа

## Testing Strategy

### Test Types
- **Unit Tests**: Jest с React Testing Library
- **Integration Tests**: Тестирование компонентов с mock данными
- **E2E Tests**: Playwright для критических пользовательских сценариев

### Coverage Goals
- Минимальное покрытие: 80%
- Критические пути (аутентификация, курсы) должны иметь 100% покрытие

## Performance Considerations

### Optimization Strategies
- Next.js App Router для оптимизации загрузки
- React Query кеширование для API запросов
- Lazy loading компонентов и изображений
- Tailwind CSS purging для минимизации CSS

### Bundle Size Targets
- Initial load: <200kb
- Lazy loaded chunks: <100kb

## Security Guidelines

### Authentication
- Supabase Auth с JWT токенами
- Role-based access control (USER/ADMIN)
- Защищенные API роуты с middleware

### Data Protection
- Валидация входных данных на клиенте и сервере
- Sanitization пользовательского контента
- HTTPS для всех соединений

### API Security
- CORS настройки через Supabase
- Rate limiting на уровне Supabase
- Input validation с Zod схемами

## Deployment

### Environments
- **Development**: localhost:3000
- **Staging**: Vercel preview deployments
- **Production**: Vercel production deployment

### CI/CD Pipeline
- Автоматический deploy через Vercel при push в main
- Preview deployments для pull requests
- Supabase migrations при изменении схемы БД

## Quick Commands

```bash
# Development
npm run dev

# Testing
npm test
npm run test:watch

# Build
npm run build

# Lint
npm run lint
npm run lint:fix

# Database
npx prisma generate
npx prisma db push
npx prisma studio
```

## AI Assistant Notes

### When generating code:
1. Используйте паттерны из AI-PATTERNS.md
2. Применяйте Tailwind CSS для стилизации
3. Создавайте TypeScript интерфейсы для всех данных
4. Используйте Radix UI компоненты для UI элементов
5. Применяйте React Query для server state management

### Common tasks:
- Добавление компонента: Создавайте в соответствующей папке с TypeScript интерфейсами
- API интеграция: Используйте React Query хуки с Supabase клиентом
- Стилизация: Применяйте Tailwind CSS классы и Radix UI
- База данных: Обновляйте Prisma схему и выполняйте миграции

### Architecture Principles:
- Модульный монолит на Next.js
- Supabase как Backend-as-a-Service
- Компонентный подход с переиспользованием
- TypeScript-first разработка
- Responsive и accessible дизайн

---

*This file is part of the AI Context system. Update it when project structure changes significantly.*