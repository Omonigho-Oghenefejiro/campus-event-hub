import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Package, Search, MapPin, Users, Plus, Trash2, AlertTriangle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useUserRole } from "@/hooks/use-user-role";
import { useToast } from "@/hooks/use-toast";

const Resources = () => {
  const { role } = useUserRole();
  const { toast } = useToast();
  const [resources, setResources] = useState<any[]>([]);
  const [filteredResources, setFilteredResources] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [newResource, setNewResource] = useState({
    name: "",
    type: "room",
    location: "",
    capacity: "",
    description: "",
  });

  useEffect(() => {
    fetchResources();
  }, []);

  useEffect(() => {
    filterResources();
  }, [resources, searchTerm, typeFilter]);

  const fetchResources = async () => {
    const { data } = await supabase
      .from("resources")
      .select("*")
      .order("name", { ascending: true });

    if (data) {
      setResources(data);
    }
  };

  const filterResources = () => {
    let filtered = resources;

    if (searchTerm) {
      filtered = filtered.filter(resource =>
        resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter(resource => resource.type === typeFilter);
    }

    setFilteredResources(filtered);
  };

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("resources")
        .insert([{
          name: newResource.name,
          type: newResource.type as "room" | "av_equipment" | "furniture" | "other",
          location: newResource.location || null,
          capacity: newResource.capacity ? parseInt(newResource.capacity) : null,
          description: newResource.description || null,
          available: true,
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Resource added successfully",
      });

      setNewResource({
        name: "",
        type: "room",
        location: "",
        capacity: "",
        description: "",
      });

      fetchResources();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    if (!confirm("Are you sure you want to delete this resource?")) return;

    try {
      const { error } = await supabase
        .from("resources")
        .delete()
        .eq("id", resourceId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Resource deleted successfully",
      });

      fetchResources();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleMarkAsUnavailable = async (resourceId: string, available: boolean) => {
    try {
      const { error } = await supabase
        .from("resources")
        .update({ available: !available })
        .eq("id", resourceId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Resource marked as ${!available ? "unavailable (faulty)" : "available"}`,
      });

      fetchResources();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "room":
        return "🏛️";
      case "av_equipment":
        return "🎤";
      case "furniture":
        return "🪑";
      default:
        return "📦";
    }
  };

  const getTypeBadge = (type: string) => {
    return (
      <Badge variant="outline">
        {type.replace(/_/g, " ").toUpperCase()}
      </Badge>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Resources</h2>
            <p className="text-muted-foreground mt-1">
              {role === "admin" 
                ? "Manage campus resources and equipment"
                : "Browse available rooms, equipment, and facilities"}
            </p>
          </div>
          {role === "admin" && (
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Resource
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Resource</DialogTitle>
                  <DialogDescription>
                    Add a new room, equipment, or facility to the system
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddResource} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Resource Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Main Auditorium"
                      value={newResource.name}
                      onChange={(e) => setNewResource({ ...newResource, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Type *</Label>
                    <Select value={newResource.type} onValueChange={(val) => setNewResource({ ...newResource, type: val })}>
                      <SelectTrigger id="type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="room">Room</SelectItem>
                        <SelectItem value="av_equipment">A/V Equipment</SelectItem>
                        <SelectItem value="furniture">Furniture</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      placeholder="e.g., Building A, Floor 3"
                      value={newResource.location}
                      onChange={(e) => setNewResource({ ...newResource, location: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="capacity">Capacity</Label>
                    <Input
                      id="capacity"
                      type="number"
                      placeholder="e.g., 100"
                      value={newResource.capacity}
                      onChange={(e) => setNewResource({ ...newResource, capacity: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      placeholder="Additional details..."
                      value={newResource.description}
                      onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Adding..." : "Add Resource"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4 items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search resources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="w-48">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <Package className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="room">Rooms</SelectItem>
                    <SelectItem value="av_equipment">A/V Equipment</SelectItem>
                    <SelectItem value="furniture">Furniture</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resources Grid */}
        {filteredResources.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No resources found</h3>
              <p className="text-muted-foreground">
                {searchTerm || typeFilter !== "all"
                  ? "Try adjusting your filters"
                  : "No resources are available at this time"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredResources.map((resource) => (
              <Card key={resource.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-3xl">{getTypeIcon(resource.type)}</span>
                      <div>
                        <CardTitle className="text-lg">{resource.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {getTypeBadge(resource.type)}
                        </CardDescription>
                      </div>
                    </div>
                    {resource.available ? (
                      <Badge className="bg-success">Available</Badge>
                    ) : (
                      <Badge variant="destructive">Faulty</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    {resource.location && (
                      <div className="flex items-center text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-2" />
                        {resource.location}
                      </div>
                    )}
                    {resource.capacity && (
                      <div className="flex items-center text-muted-foreground">
                        <Users className="h-4 w-4 mr-2" />
                        Capacity: {resource.capacity}
                      </div>
                    )}
                    {resource.description && (
                      <p className="text-muted-foreground pt-2 border-t border-border">
                        {resource.description}
                      </p>
                    )}
                  </div>

                  {role === "admin" && (
                    <div className="flex gap-2 pt-2 border-t border-border">
                      <Button
                        size="sm"
                        variant={resource.available ? "outline" : "default"}
                        onClick={() => handleMarkAsUnavailable(resource.id, resource.available)}
                      >
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        {resource.available ? "Mark Faulty" : "Mark Available"}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteResource(resource.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Resources;
