import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Suspense } from "react";
import { LocaleProvider, useLocale } from "@/lib/locale";

import HomePage from "@/pages/home";
import FeedPage from "@/pages/feed";
import MatchesPage from "@/pages/matches";
import MessagesPage from "@/pages/messages";
import ProfilePage from "@/pages/profile";
import OnboardingPage from "@/pages/onboarding";
import SignalDetailPage from "@/pages/signal-detail";
import MapExplorePage from "@/pages/map-explore";
import OpportunitySpacePage from "@/pages/opportunity-space";
import DevReportsPage from "@/pages/dev-reports";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 60_000,
      gcTime: 300_000,
    },
  },
});

function PageLoader() {
  const { t } = useLocale();
  return (
    <div className="flex-1 flex items-center justify-center min-h-[40vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        <span className="text-xs text-muted-foreground">{t("common.loading")}</span>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/semnale" component={FeedPage} />
        <Route path="/semnale/:id/oportunitate" component={OpportunitySpacePage} />
        <Route path="/semnale/:id" component={SignalDetailPage} />
        <Route path="/potriviri" component={MatchesPage} />
        <Route path="/mesaje" component={MessagesPage} />
        <Route path="/profil" component={ProfilePage} />
        <Route path="/onboarding" component={OnboardingPage} />
        <Route path="/explorare-rapida" component={MapExplorePage} />
        <Route path="/laborator-rapoarte" component={DevReportsPage} />
      </Switch>
    </Suspense>
  );
}

const BASE_PATH = import.meta.env.BASE_URL;

function App() {
  return (
    <WouterRouter base={BASE_PATH === "/" ? "" : BASE_PATH.replace(/\/$/, "")}>
      <LocaleProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Router />
            <Toaster />
          </TooltipProvider>
        </QueryClientProvider>
      </LocaleProvider>
    </WouterRouter>
  );
}

export default App;
