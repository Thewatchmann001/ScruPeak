import React from 'react';
import Container from '@/components/layout/Container';
import { PageHeader } from '@/components/layout/PageHeader';

export default function EscrowPage() {
  return (
    <Container className="py-12">
      <PageHeader 
        title="Secure Escrow Services" 
        description="Protecting your funds during land transactions with our secure escrow platform." 
      />
      <div className="prose max-w-none">
        <p>Our escrow service ensures that your funds are safe until all conditions of the land sale are met. We act as a neutral third party to hold funds and release them only when both buyer and seller have fulfilled their obligations.</p>
        <p>This service is currently being integrated directly into our marketplace flow.</p>
      </div>
    </Container>
  );
}
