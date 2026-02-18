import { Link } from "react-router-dom";
import { Shield, Globe, Twitter, Linkedin, Github } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-white py-24 px-4 border-t border-white/5">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
          <div className="space-y-8">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center shadow-lg shadow-orange-600/20">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-black tracking-tighter">
                LAND<span className="text-orange-500">BIZNES</span>
              </span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              Sierra Leone's leading land registry and marketplace. Delivering institutional-grade security for the next generation of property investors.
            </p>
            <div className="flex gap-4">
              <SocialLink icon={Twitter} href="#" />
              <SocialLink icon={Linkedin} href="#" />
              <SocialLink icon={Github} href="#" />
            </div>
          </div>

          <FooterColumn
            title="Registry"
            links={[
              { label: "Marketplace", href: "/marketplace" },
              { label: "Title Verification", href: "/features" },
              { label: "Interactive Map", href: "/map" },
              { label: "ULID Standards", href: "/features" },
            ]}
          />

          <FooterColumn
            title="Company"
            links={[
              { label: "About Us", href: "/about" },
              { label: "Legal Registry", href: "/about" },
              { label: "Contact", href: "/contact" },
              { label: "Careers", href: "/careers" },
            ]}
          />

          <FooterColumn
            title="Legal"
            links={[
              { label: "Terms of Service", href: "/terms" },
              { label: "Privacy Policy", href: "/privacy" },
              { label: "Compliance", href: "/privacy" },
              { label: "Licenses", href: "/licenses" },
            ]}
          />
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
            &copy; {new Date().getFullYear()} LandBiznes. National Land Registry Infrastructure.
          </p>
          <div className="flex items-center gap-2 text-slate-500 hover:text-orange-500 transition-colors cursor-pointer">
            <Globe size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Global Standards Implemented</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div className="space-y-8">
      <h4 className="font-black text-white uppercase tracking-[0.2em] text-[10px]">{title}</h4>
      <ul className="space-y-4">
        {links.map((link) => (
          <li key={link.label}>
            <Link to={link.href} className="text-slate-400 hover:text-orange-500 transition-colors text-sm font-medium">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SocialLink({ icon: Icon, href }: { icon: any, href: string }) {
  return (
    <a href={href} className="w-10 h-10 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center text-slate-400 hover:bg-orange-600 hover:text-white hover:border-orange-600 transition-all">
      <Icon size={18} />
    </a>
  );
}
