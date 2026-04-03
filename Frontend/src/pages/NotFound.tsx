import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full text-center shadow-float gradient-earth">
        <div className="p-8">
          <div className="text-6xl font-bold text-primary mb-4">404</div>
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Page Not Found
          </h1>
          <p className="text-muted-foreground mb-6">
            यह पेज मौजूद नहीं है। कृपया सही लिंक की जांच करें।
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="space-y-3">
            <Button 
              onClick={() => window.history.back()} 
              variant="outline"
              className="w-full hover:shadow-glow transition-smooth"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
            <Button 
              onClick={() => window.location.href = '/'} 
              className="w-full gradient-primary hover:shadow-glow transition-smooth"
            >
              <Home className="h-4 w-4 mr-2" />
              Return to Home
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default NotFound;
