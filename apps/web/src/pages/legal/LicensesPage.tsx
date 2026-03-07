import React from 'react';
import Container from '@/components/layout/Container';
import { PageHeader } from '@/components/layout/PageHeader';

export default function LicensesPage() {
  return (
    <Container className="py-12">
      <PageHeader 
        title="Licenses & Certifications" 
        description="Our regulatory compliance and operational licenses." 
      />
      <div className="prose max-w-none">
        <p>ScruPeak Digital Property operates in compliance with Sierra Leonean real estate and digital commerce regulations.</p>
        <p>This page will list our relevant business licenses and certifications.</p>
      </div>
    </Container>
  );
}
