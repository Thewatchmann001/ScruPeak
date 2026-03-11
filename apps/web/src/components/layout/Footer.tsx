import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Main Footer Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand Column */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <img
                src="/logo.jpg"
                alt="ScruPeak Logo"
                className="w-10 h-10 rounded-xl object-cover"
              />
              <span className="text-xl font-bold">
                ScruPeak
              </span>
            </Link>
            <p className="text-sm opacity-70">
              Sierra Leone's most trusted land marketplace with verified
              secure transactions.
            </p>
          </div>

          {/* Platform Links */}
          <FooterColumn
            title="Platform"
            links={[
              { label: "Listings", href: "/marketplace" },
              { label: "Dashboard", href: "/sell" },
              { label: "Escrow", href: "/escrow" },
              { label: "Verification", href: "/kyc" },
            ]}
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
        <div className="border-t border-white/20" />

        {/* Bottom Section */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p className="text-sm opacity-60">
            &copy; 2026 ScruPeak Digital Property. All rights reserved.
          </p>
          <div className="flex flex-col items-center sm:items-end">
            <p className="text-sm opacity-80">
              Made with trust for Sierra Leone
            </p>
            <a 
              href="https://www.watchmann.dev" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs font-bold text-orange-500 tracking-wide mt-1 hover:text-orange-400 transition-colors"
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
              className="text-sm opacity-70 hover:opacity-100 hover:text-primary-400 transition-all duration-300"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
