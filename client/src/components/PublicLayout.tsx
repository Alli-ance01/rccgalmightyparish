import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";
import BrandTerminologyGuard from "./BrandTerminologyGuard";

const logoUrl = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663804076298/hIMtHTrGgFsxuoBl.png";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <BrandTerminologyGuard><div className="min-h-screen overflow-x-clip"><SiteHeader /><main className="relative"><div aria-hidden="true" className="parish-watermark-sticky"><img src={logoUrl} alt="" className="parish-watermark" /></div><div className="relative z-10">{children}</div></main><SiteFooter /></div></BrandTerminologyGuard>;
}
