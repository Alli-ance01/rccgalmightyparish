import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import About from "./pages/About";
import Admin from "./pages/Admin";
import Contact from "./pages/Contact";
import EventDetail from "./pages/EventDetail";
import Events from "./pages/Events";
import Give from "./pages/Give";
import Home from "./pages/Home";
import JuniorChurch from "./pages/JuniorChurch";
import Leadership from "./pages/Leadership";
import Media from "./pages/Media";
import MediaDetail from "./pages/MediaDetail";
import Ministries from "./pages/Ministries";
import MinistryDetail from "./pages/MinistryDetail";
import News from "./pages/News";
import NotFound from "./pages/NotFound";
import PostDetail from "./pages/PostDetail";
import SermonDetail from "./pages/SermonDetail";
import Sermons from "./pages/Sermons";
import Visit from "./pages/Visit";
import { Route, Switch } from "wouter";

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
    <Route path="/admin" component={Admin} />
    <Route component={NotFound} />
  </Switch>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
