import React from 'react';
import Container from '@/components/layout/Container';
import { PageHeader } from '@/components/layout/PageHeader';

export default function CookiesPage() {
  return (
    <Container className="py-12">
      <PageHeader 
        title="Cookie Policy" 
        description="Understanding how we use cookies." 
      />
      <div className="prose max-w-none">
        <p>We use cookies to enhance your experience on our website.</p>
        <h3>What are cookies?</h3>
        <p>Cookies are small text files stored on your device when you visit a website.</p>
        <h3>How we use cookies</h3>
        <p>We use cookies for authentication, analytics, and to remember your preferences.</p>
      </div>
    </Container>
  );
}
