import React from 'react';
import Container from '@/components/layout/Container';
import { PageHeader } from '@/components/layout/PageHeader';

export default function TermsPage() {
  return (
    <Container className="py-12">
      <PageHeader 
        title="Terms of Service" 
        description="Last updated: February 2026" 
      />
      <div className="prose max-w-none">
        <p>Welcome to ScruPeak Digital Property. By using our website and services, you agree to these Terms of Service.</p>
        <h3>1. Acceptance of Terms</h3>
        <p>By accessing or using our platform, you agree to be bound by these terms.</p>
        <h3>2. User Accounts</h3>
        <p>You are responsible for maintaining the confidentiality of your account credentials.</p>
        <h3>3. Land Listings</h3>
        <p>Sellers must provide accurate information about their land listings. ScruPeak Digital Property verifies listings but does not guarantee the accuracy of all user-provided content.</p>
      </div>
    </Container>
  );
}
