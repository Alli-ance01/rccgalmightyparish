import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";
import BrandTerminologyGuard from "./BrandTerminologyGuard";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <BrandTerminologyGuard><div className="min-h-screen overflow-x-clip"><SiteHeader /><main>{children}</main><SiteFooter /></div></BrandTerminologyGuard>;
}
