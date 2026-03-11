import React from 'react';
import Container from '@/components/layout/Container';
import { PageHeader } from '@/components/layout/PageHeader';

export default function CareersPage() {
  return (
    <Container className="py-12">
      <PageHeader 
        title="Careers at ScruPeak"
        description="Join us in building the future of land ownership in Sierra Leone." 
      />
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">We don't have any open positions right now.</p>
        <p>Check back later or follow us on social media for updates.</p>
      </div>
    </Container>
  );
}
