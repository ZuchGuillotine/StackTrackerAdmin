
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { DashboardNav } from "@/components/dashboard-nav";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Loader2, Eye, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ResearchDocument } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import React from "react";
import { Badge } from "@/components/ui/badge";

export default function ResearchManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [_, navigate] = useLocation();
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [documentToDelete, setDocumentToDelete] = React.useState<number | null>(null);

  const { data: documents = [], isLoading } = useQuery<ResearchDocument[]>({
    queryKey: ['/api/research'],
    queryFn: async () => {
      const res = await fetch('/api/research');
      if (!res.ok) throw new Error('Failed to fetch research documents');
      return res.json();
    }
  });

  const deleteDocument = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/research/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/research'] });
      toast({ title: "Success", description: "Research document deleted successfully" });
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    }
  });

  const handleDelete = (id: number) => {
    setDeleteDialogOpen(true);
    setDocumentToDelete(id);
  };

  const handleEdit = (id: number) => {
    console.log(`Navigating to edit research document with ID: ${id}`);
    navigate(`/research-editor/${id}`);
  };

  return (
    <div className="flex h-screen">
      <DashboardNav />
      <main className="flex-1 p-8 overflow-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Research Document Management</h1>
          <Button onClick={() => navigate('/research-editor/new')}>
            <Plus className="w-4 h-4 mr-2" />
            New Research Document
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Research Documents</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Authors</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents?.map((document) => (
                    <TableRow key={document.id}>
                      <TableCell className="font-medium">{document.title}</TableCell>
                      <TableCell>{document.authors}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {Array.isArray(document.tags) && document.tags.map((tag, idx) => (
                            <Badge key={idx} variant="outline">{tag}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(document.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEdit(document.id)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDelete(document.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {documents.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        <FileText className="h-10 w-10 mx-auto mb-2 opacity-20" />
                        <p>No research documents found</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Research Document</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            Are you sure you want to delete this research document? This action cannot be undone.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (documentToDelete) deleteDocument.mutate(documentToDelete);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
