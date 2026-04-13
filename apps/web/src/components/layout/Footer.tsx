import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Footer() {
  const { user, isAuthenticated } = useAuth();

  const platformLinks = [
    { label: "Listings", href: "/marketplace" },
  ];

  if (isAuthenticated && (user?.role === 'owner' || user?.role === 'agent')) {
    platformLinks.push({ label: "Dashboard", href: "/sell" });
  }

  if (isAuthenticated) {
    platformLinks.push({ label: "Escrow", href: "/escrow" });
    platformLinks.push({ label: "Verification", href: "/kyc" });
  }

  return (
    <footer className="bg-white text-text py-12 px-4 sm:px-6 lg:px-8 border-t border-border">
      <div className="max-w-7xl mx-auto">
        {/* Main Footer Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand Column */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <img
                src="/images/logo.jpg"
                alt="ScruPeak Logo"
                className="w-10 h-10 rounded-xl object-cover"
              />
              <span className="text-xl font-bold">
                Scru<span className="text-primary">Peak</span>
              </span>
            </Link>
            <p className="text-sm text-text-secondary">
              Sierra Leone's most trusted land marketplace with verified
              secure transactions.
            </p>
          </div>

          {/* Platform Links */}
          <FooterColumn
            title="Platform"
            links={platformLinks}
          />

          {/* Company Links */}
          <FooterColumn
            title="Company"
            links={[
              { label: "About Us", href: "/about" },
              { label: "Blog", href: "/blog" },
              { label: "Contact", href: "/contact" },
              { label: "Careers", href: "/careers" },
            ]}
          />

          {/* Legal Links */}
          <FooterColumn
            title="Legal"
            links={[
              { label: "Terms of Service", href: "/terms" },
              { label: "Privacy Policy", href: "/privacy" },
              { label: "Cookie Policy", href: "/cookies" },
              { label: "Licenses", href: "/licenses" },
            ]}
          />
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Bottom Section */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p className="text-sm text-text-secondary">
            &copy; 2026 ScruPeak Digital Property. All rights reserved.
          </p>
          <div className="flex flex-col items-center sm:items-end">
            <p className="text-sm text-text-secondary font-medium">
              Made with trust for Sierra Leone
            </p>
            <a 
              href="https://www.watchmann.dev" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs font-bold text-primary tracking-wide mt-1 hover:text-primary/80 transition-colors"
            >
              by Watchmann
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div className="space-y-4">
      <h4 className="font-semibold">{title}</h4>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              to={link.href}
              className="text-sm text-text-secondary hover:text-primary transition-all duration-300"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
