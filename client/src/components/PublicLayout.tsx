import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen overflow-x-clip"><SiteHeader /><main>{children}</main><SiteFooter /></div>;
}
