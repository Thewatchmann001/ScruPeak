import React from 'react';
import Container from '@/components/layout/Container';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';

export default function ContactPage() {
  return (
    <Container className="py-12">
      <PageHeader 
        title="Contact Us" 
        description="We'd love to hear from you. Get in touch with our team." 
      />
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-xl font-semibold mb-4">Get in Touch</h3>
          <p className="mb-4">Have questions about buying or selling land? Need support with our platform?</p>
          <div className="space-y-2">
            <p><strong>Email:</strong> support@scrupeak.com</p>
            <p><strong>Phone:</strong> +232 77 000 000</p>
            <p><strong>Address:</strong> Freetown, Sierra Leone</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border">
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input type="text" className="w-full p-2 border rounded-md" placeholder="Your name" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input type="email" className="w-full p-2 border rounded-md" placeholder="your@email.com" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Message</label>
              <textarea className="w-full p-2 border rounded-md h-32" placeholder="How can we help?"></textarea>
            </div>
            <Button>Send Message</Button>
          </form>
        </div>
      </div>
    </Container>
  );
}
