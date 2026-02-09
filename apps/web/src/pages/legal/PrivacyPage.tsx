import React from 'react';
import Container from '@/components/layout/Container';
import { PageHeader } from '@/components/layout/PageHeader';

export default function PrivacyPage() {
  return (
    <Container className="py-12">
      <PageHeader 
        title="Privacy Policy" 
        description="How we collect, use, and protect your data." 
      />
      <div className="prose max-w-none">
        <p>At LandBiznes, we take your privacy seriously.</p>
        <h3>Information We Collect</h3>
        <p>We collect information you provide directly to us, such as when you create an account, list land, or contact us.</p>
        <h3>How We Use Your Information</h3>
        <p>We use your information to provide, maintain, and improve our services, and to communicate with you.</p>
      </div>
    </Container>
  );
}
