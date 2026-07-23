import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, Router as WouterRouter } from "wouter";
import { PageShell } from "@/components/layout/PageShell";
import { AdminLayout } from "@/components/layout/AdminLayout";
import Home from "@/pages/Home";
import Products from "@/pages/Products";
import ProductDetail from "@/pages/ProductDetail";
import Services from "@/pages/Services";
import ServiceDetail from "@/pages/ServiceDetail";
import Courses from "@/pages/Courses";
import CourseDetail from "@/pages/CourseDetail";
import Testimonials from "@/pages/Testimonials";
import BookCall from "@/pages/BookCall";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import CheckoutSuccess from "@/pages/CheckoutSuccess";
import CheckoutCancel from "@/pages/CheckoutCancel";
import Privacy from "@/pages/Privacy";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminProducts from "@/pages/admin/AdminProducts";
import AdminServices from "@/pages/admin/AdminServices";
import AdminCourses from "@/pages/admin/AdminCourses";
import AdminTestimonials from "@/pages/admin/AdminTestimonials";
import AdminEvents from "@/pages/admin/AdminEvents";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminBookings from "@/pages/admin/AdminBookings";
import AdminCommissions from "@/pages/admin/AdminCommissions";
import AdminShipping from "@/pages/admin/AdminShipping";
import NotFound from "@/pages/not-found";

function AdminRoutes() {
  return (
    <AdminLayout>
      <Switch>
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/products" component={AdminProducts} />
        <Route path="/admin/services" component={AdminServices} />
        <Route path="/admin/courses" component={AdminCourses} />
        <Route path="/admin/testimonials" component={AdminTestimonials} />
        <Route path="/admin/events" component={AdminEvents} />
        <Route path="/admin/users" component={AdminUsers} />
        <Route path="/admin/bookings" component={AdminBookings} />
        <Route path="/admin/commission" component={AdminCommissions} />
        <Route path="/admin/shipping" component={AdminShipping} />
        <Route component={NotFound} />
      </Switch>
    </AdminLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/admin/*" component={AdminRoutes} />
      <Route path="/admin" component={AdminRoutes} />
      <Route>
        <PageShell>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/products" component={Products} />
            <Route path="/products/:id" component={ProductDetail} />
            <Route path="/services" component={Services} />
            <Route path="/services/:id" component={ServiceDetail} />
            <Route path="/courses" component={Courses} />
            <Route path="/courses/:id" component={CourseDetail} />
            <Route path="/testimonials" component={Testimonials} />
            <Route path="/book-a-call" component={BookCall} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/login" component={Login} />
            <Route path="/checkout/success" component={CheckoutSuccess} />
            <Route path="/checkout/cancel" component={CheckoutCancel} />
            <Route path="/privacy" component={Privacy} />
            <Route component={NotFound} />
          </Switch>
        </PageShell>
      </Route>
    </Switch>
  );
}

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
