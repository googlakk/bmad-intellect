# Архитектурный документ v3.0: Образовательная платформа «Интеллект»

### **Раздел 1: Высокоуровневая архитектура**
Проект представляет собой модульный монолит на базе Next.js, развернутый на Vercel, с использованием Supabase в качестве BaaS для БД, аутентификации и хранения файлов. **MVP сфокусирован на обучающем модуле и каталоге сервисов.**

### **Раздел 2: Технологический стек**
* **Менеджер пакетов:** npm
* **Фреймворк:** Next.js
* **UI:** React, Radix UI, Tailwind CSS
* **Состояние (Frontend):** Zustand
* **Работа с API (Frontend):** React Query (TanStack)
* **БД, Аутентификация, Хранение:** Supabase
* **Взаимодействие с БД:** Prisma
* **Платформа:** Vercel

### **Раздел 3: Модели данных (Упрощено для MVP)**
* **Схема включает модели:** `User`, `Course`, `CourseLesson`, `UserCourseProgress` (для обучающего модуля) и `ServiceCatalogEntry` (для каталога).
* **Модели `Test`, `Assignment`, `TeacherMaterial` и `TestResult` удалены из схемы MVP.**

### **Раздел 5: Компоненты (Упрощено для MVP)**
* **Сервисы:** Auth & User Service, **Course Management Service**, **Catalog Management Service**.
* **Сервисы `Prompt Orchestration`, `Testing`, `Assignment & Reporting` удалены из MVP.**