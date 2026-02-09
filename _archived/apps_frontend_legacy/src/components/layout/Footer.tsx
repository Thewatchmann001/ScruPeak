import Link from "next/link";
import { MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-foreground text-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Main Footer Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand Column */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">
                Land<span className="text-primary">Biznes</span>
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
              { label: "Listings", href: "/land" },
              { label: "Dashboard", href: "/dashboard" },
              { label: "Escrow", href: "/escrow" },
              { label: "Verification", href: "#" },
            ]}
          />

          {/* Company Links */}
          <FooterColumn
            title="Company"
            links={[
              { label: "About Us", href: "#" },
              { label: "Blog", href: "#" },
              { label: "Contact", href: "#" },
              { label: "Careers", href: "#" },
            ]}
          />

          {/* Legal Links */}
          <FooterColumn
            title="Legal"
            links={[
              { label: "Terms of Service", href: "#" },
              { label: "Privacy Policy", href: "#" },
              { label: "Cookie Policy", href: "#" },
              { label: "Licenses", href: "#" },
            ]}
          />
        </div>

        {/* Divider */}
        <div className="border-t border-background/20" />

        {/* Bottom Section */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm opacity-70">
            2026 LandBiznes. All rights reserved.
          </p>
          <p className="text-sm opacity-70">
            Made with trust for Sierra Leone
          </p>
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
              href={link.href}
              className="text-sm opacity-70 hover:opacity-100 hover:text-primary transition-all duration-300"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
