import { Metadata } from 'next';
import { AICatalogContent } from '@/components/catalog/AICatalogContent';

export const metadata: Metadata = {
  title: 'AI Каталог | Интеллект',
  description: 'Каталог AI-сервисов и инструментов',
};

export default function AICatalogPage() {
  return <AICatalogContent />;
}