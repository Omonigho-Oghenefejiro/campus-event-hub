import { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export const AuthLayout = ({ children, title, subtitle }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            Campus Events
          </h1>
          <p className="text-muted-foreground">University Event Management System</p>
        </div>
        
        <div className="bg-card shadow-xl rounded-lg p-8 border border-border">
          <h2 className="text-2xl font-semibold mb-2">{title}</h2>
          {subtitle && <p className="text-muted-foreground mb-6">{subtitle}</p>}
          {children}
        </div>
      </div>
    </div>
  );
};
