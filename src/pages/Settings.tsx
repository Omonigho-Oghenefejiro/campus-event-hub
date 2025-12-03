import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, Lock, Settings as SettingsIcon } from "lucide-react";

const Settings = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold">System Settings</h2>
          <p className="text-muted-foreground mt-1">
            Manage system-wide configuration and settings
          </p>
        </div>

        {/* Database Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              <div>
                <CardTitle>Database</CardTitle>
                <CardDescription>Manage system data</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-4">
                Resource management has been moved to the <strong>Resources</strong> section where you can add, edit, and manage resources.
              </p>
              <Button variant="outline" disabled>
                Export Data (Coming Soon)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              <div>
                <CardTitle>Security</CardTitle>
                <CardDescription>Authentication and access control</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Security settings are managed through Supabase authentication. User roles and access control are automatically enforced based on user roles (student, organizer, admin).
              </p>
            </div>
          </CardContent>
        </Card>

        {/* General Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              <div>
                <CardTitle>General</CardTitle>
                <CardDescription>System information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center p-2 border rounded-lg">
                <span className="text-muted-foreground">System Version</span>
                <span className="font-mono">1.0.0</span>
              </div>
              <div className="flex justify-between items-center p-2 border rounded-lg">
                <span className="text-muted-foreground">Database</span>
                <span className="font-mono">Supabase PostgreSQL</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
