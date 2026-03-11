import React from 'react';
import Container from '@/components/layout/Container';
import { PageHeader } from '@/components/layout/PageHeader';

export default function BlogPage() {
  return (
    <Container className="py-12">
      <PageHeader 
        title="ScruPeak Blog"
        description="Insights, news, and updates from the Sierra Leone real estate market." 
      />
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">Blog posts coming soon. Stay tuned!</p>
      </div>
    </Container>
  );
}
