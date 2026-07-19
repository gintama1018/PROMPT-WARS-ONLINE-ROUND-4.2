import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { Layout } from '@/components/Layout';
import FanPortal from '@/pages/FanPortal';
import OpsDashboard from '@/pages/OpsDashboard';
import VolunteerHub from '@/pages/VolunteerHub';
import SustainabilityTracker from '@/pages/SustainabilityTracker';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={FanPortal} />
        <Route path="/ops" component={OpsDashboard} />
        <Route path="/volunteer" component={VolunteerHub} />
        <Route path="/sustainability" component={SustainabilityTracker} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
