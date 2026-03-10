import React from 'react';
import Container from '@/components/layout/Container';
import { PageHeader } from '@/components/layout/PageHeader';

export default function AboutPage() {
  return (
    <Container className="py-12">
      <PageHeader 
        title="About ScruPeak"
        description="Revolutionizing land ownership and trade in Sierra Leone." 
      />
      <div className="prose max-w-none">
        <p>ScruPeak is Sierra Leone's premier digital land marketplace, dedicated to bringing transparency, security, and efficiency to real estate transactions.</p>
        <h3 className="text-xl font-semibold mt-6">Our Mission</h3>
        <p>To digitize the land registry and marketplace, making land ownership accessible and secure for everyone.</p>
      </div>
    </Container>
  );
}
