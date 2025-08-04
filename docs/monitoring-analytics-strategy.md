# Monitoring & Analytics Strategy
# Образовательная платформа «Интеллект»

## Обзор стратегии

Система мониторинга и аналитики для отслеживания ключевых метрик обучения, использования ИИ-сервисов и общей производительности платформы.

## 📊 Ключевые метрики (KPIs)

### Образовательные метрики
- **Course Completion Rate** - процент завершивших обязательный курс
- **Lesson Progress** - средний прогресс по урокам
- **Test Success Rate** - процент успешно пройденных тестов
- **Time to Completion** - среднее время завершения курса
- **Drop-off Points** - где пользователи чаще всего останавливаются

### Использование ИИ-сервисов
- **AI Service Adoption** - процент учителей, использующих каталог
- **Popular Services** - топ ИИ-инструментов по использованию
- **Subject Distribution** - использование по предметам
- **Service Engagement** - клики, время использования

### Технические метрики
- **Page Load Times** - производительность SPA
- **API Response Times** - скорость Supabase queries
- **Error Rates** - частота ошибок по компонентам
- **User Session Duration** - время активности пользователей

## 🛠 Техническая реализация

### Phase 1: Базовый мониторинг (MVP)
```javascript
// Simple event tracking
const trackEvent = (event, properties) => {
  // Local analytics store или simple API
  console.log('Analytics:', event, properties);
  
  // Supabase table для хранения events
  supabase.from('analytics_events').insert({
    event_name: event,
    user_id: currentUser.id,
    properties: properties,
    timestamp: new Date()
  });
};

// Usage examples
trackEvent('course_lesson_completed', { 
  lesson_id: 'intro-1', 
  completion_time: 120 
});

trackEvent('ai_service_clicked', { 
  service_id: 'chatgpt', 
  subject: 'математика' 
});
```

### Database Schema
```sql
-- Analytics events table
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name VARCHAR(100) NOT NULL,
  user_id UUID REFERENCES users(id),
  properties JSONB,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- User sessions tracking
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  session_start TIMESTAMP DEFAULT NOW(),
  session_end TIMESTAMP,
  pages_visited INTEGER DEFAULT 0,
  actions_performed INTEGER DEFAULT 0
);
```

### Phase 2: Advanced Analytics (Post-MVP)
- Google Analytics 4 integration
- Custom dashboard для админов
- Real-time metrics
- Automated reports

## 📋 Monitoring Dashboard для Админов

### Admin Analytics Panel (в рамках Story 1.5)
```javascript
// Dashboard components
const AnalyticsDashboard = () => {
  const { data: completionStats } = useQuery(['completion-stats'], getCompletionStats);
  const { data: serviceUsage } = useQuery(['service-usage'], getServiceUsage);
  
  return (
    <div className="analytics-dashboard">
      <MetricCard 
        title="Course Completion" 
        value={`${completionStats.percentage}%`}
        trend={completionStats.trend}
      />
      <ServiceUsageChart data={serviceUsage} />
      <RecentActivity />
    </div>
  );
};
```

## 🔧 Error Monitoring

### Error Tracking Strategy
```javascript
// Custom error boundary с reporting
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    // Log to analytics
    trackEvent('application_error', {
      error: error.message,
      stack: error.stack,
      component: errorInfo.componentStack
    });
    
    // For production: Sentry или similar service
  }
}

// API error tracking
const apiClient = {
  async request(url, options) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        trackEvent('api_error', {
          url,
          status: response.status,
          method: options.method
        });
      }
      return response;
    } catch (error) {
      trackEvent('network_error', { url, error: error.message });
      throw error;
    }
  }
};
```

## 📈 Performance Monitoring

### Core Web Vitals Tracking
```javascript
// Performance monitoring
const trackPerformance = () => {
  // Core Web Vitals
  new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (entry.entryType === 'navigation') {
        trackEvent('page_performance', {
          page: window.location.pathname,
          load_time: entry.loadEventEnd - entry.loadEventStart,
          dom_content_loaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart
        });
      }
    });
  }).observe({ entryTypes: ['navigation'] });
};
```

## 🎯 Privacy & Compliance

### Data Privacy Principles
- **Minimal Data Collection** - только необходимые для образовательных целей метрики
- **User Consent** - явное согласие на сбор аналитики
- **Data Anonymization** - где возможно, анонимизация личных данных
- **GDPR Compliance** - возможность удаления пользовательских данных

### Реализация Privacy
```javascript
// Privacy-first analytics
const trackEventWithConsent = (event, properties) => {
  const hasConsent = localStorage.getItem('analytics-consent') === 'true';
  if (!hasConsent) return;
  
  // Remove PII from properties
  const sanitizedProperties = sanitizeData(properties);
  trackEvent(event, sanitizedProperties);
};
```

## 📋 Implementation Priority

### High Priority (MVP)
1. ✅ Basic event tracking в Stories (уже включено)
2. ✅ Course completion analytics (Story 1.5)
3. ✅ AI service usage tracking (Story 2.2)
4. Simple error logging

### Medium Priority (Post-MVP)
1. Performance monitoring
2. Real-time dashboard
3. Automated reports
4. Advanced error tracking (Sentry)

### Low Priority (Future)
1. A/B testing framework
2. Predictive analytics
3. Advanced user behavior analysis
4. Integration с внешними analytics tools

## 🔗 Integration Points

### С существующими Stories:
- **Story 1.4 (Learning Center):** Course progress tracking
- **Story 1.5 (Admin Panel):** Analytics dashboard
- **Story 2.1 (AI Catalog User):** Service usage tracking  
- **Story 2.2 (AI Catalog Admin):** Service management analytics

### Dependencies:
```json
{
  "devDependencies": {
    "@types/web-vitals": "^3.0.0"
  },
  "dependencies": {
    "web-vitals": "^3.0.0"
  }
}
```

## ✅ Success Criteria

**MVP Launch готов к мониторингу если:**
- ✅ Basic event tracking работает
- ✅ Course completion metrics доступны админам
- ✅ AI service usage отслеживается
- ✅ Critical errors логируются
- ✅ Privacy compliance реализован

---

*Эта стратегия обеспечивает необходимый мониторинг для успешного запуска и развития образовательной платформы.*