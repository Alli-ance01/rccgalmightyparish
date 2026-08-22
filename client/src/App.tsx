import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import About from "./pages/About";
import Account from "./pages/Account";
import Admin from "./pages/Admin";
import Approvals from "./pages/Approvals";
import Contact from "./pages/Contact";
import EventDetail from "./pages/EventDetail";
import Events from "./pages/Events";
import Give from "./pages/Give";
import Home from "./pages/Home";
import JuniorChurch from "./pages/JuniorChurch";
import Leadership from "./pages/Leadership";
import Media from "./pages/Media";
import MediaDetail from "./pages/MediaDetail";
import MasterSetup from "./pages/MasterSetup";
import Ministries from "./pages/Ministries";
import MinistryDetail from "./pages/MinistryDetail";
import News from "./pages/News";
import NotFound from "./pages/NotFound";
import PostDetail from "./pages/PostDetail";
import SermonDetail from "./pages/SermonDetail";
import Sermons from "./pages/Sermons";
import SignIn from "./pages/SignIn";
import Visit from "./pages/Visit";
import { useEffect } from "react";
import { resetRouteScroll } from "./lib/scroll";
import { Route, Switch, useLocation } from "wouter";

function RouteScrollReset() {
  const [location] = useLocation();
  useEffect(() => { resetRouteScroll(); }, [location]);
  return null;
}

function Router() {
  return <Switch>
    <Route path="/" component={Home} />
    <Route path="/about" component={About} />
    <Route path="/ministries" component={Ministries} />
    <Route path="/ministries/:slug" component={MinistryDetail} />
    <Route path="/junior-church" component={JuniorChurch} />
    <Route path="/sermons" component={Sermons} />
    <Route path="/sermons/:slug" component={SermonDetail} />
    <Route path="/events" component={Events} />
    <Route path="/events/:slug" component={EventDetail} />
    <Route path="/give" component={Give} />
    <Route path="/visit" component={Visit} />
    <Route path="/contact" component={Contact} />
    <Route path="/leadership" component={Leadership} />
    <Route path="/media" component={Media} />
    <Route path="/media/:id" component={MediaDetail} />
    <Route path="/news" component={News} />
    <Route path="/news/:slug" component={PostDetail} />
    <Route path="/sign-in" component={SignIn} />
    <Route path="/account" component={Account} />
    <Route path="/master-setup" component={MasterSetup} />
    <Route path="/admin" component={Admin} />
    <Route path="/admin/approvals" component={Approvals} />
    <Route component={NotFound} />
  </Switch>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><RouteScrollReset /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
