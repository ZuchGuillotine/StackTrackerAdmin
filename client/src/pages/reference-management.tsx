
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardNav } from "@/components/dashboard-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Define types for supplement reference
interface SupplementReference {
  id: number;
  name: string;
  category: string;
  createdAt?: string;
  updatedAt?: string;
}

// Form validation schema
const supplementFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required")
});

type SupplementFormData = z.infer<typeof supplementFormSchema>;

async function fetchSupplements(): Promise<SupplementReference[]> {
  try {
    console.log("Fetching supplements...");
    const res = await fetch('/api/admin/supplements', { credentials: 'include' });
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Failed fetch response: ${res.status} ${res.statusText}`);
      throw new Error(`Failed to fetch supplements: ${errorText}`);
    }
    const data = await res.json();
    console.log("Fetched supplements:", data);
    return data;
  } catch (error) {
    console.error("Error fetching supplements:", error);
    throw error;
  }
}
</old_str>

export default function ReferenceManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [supplementToEdit, setSupplementToEdit] = useState<SupplementReference | null>(null);
  const [supplementToDelete, setSupplementToDelete] = useState<number | null>(null);

  const form = useForm<SupplementFormData>({
    resolver: zodResolver(supplementFormSchema),
    defaultValues: {
      name: "",
      category: "General"
    }
  });

  const { data: supplements, isLoading } = useQuery({
    queryKey: ['/api/admin/supplements'],
    queryFn: fetchSupplements
  });

  const createSupplement = useMutation({
    mutationFn: async (data: SupplementFormData) => {
      const res = await fetch('/api/admin/supplements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/supplements'] });
      toast({ title: "Success", description: "Supplement created successfully" });
      closeForm();
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: `Failed to create supplement: ${error.message}`,
        variant: "destructive" 
      });
    }
  });

  const updateSupplement = useMutation({
    mutationFn: async (data: { id: number; supplementData: SupplementFormData }) => {
      const res = await fetch(`/api/admin/supplements/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.supplementData),
        credentials: 'include'
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/supplements'] });
      toast({ title: "Success", description: "Supplement updated successfully" });
      closeForm();
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: `Failed to update supplement: ${error.message}`,
        variant: "destructive" 
      });
    }
  });

  const deleteSupplement = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/supplements/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/supplements'] });
      toast({ title: "Success", description: "Supplement deleted successfully" });
      setDeleteDialogOpen(false);
      setSupplementToDelete(null);
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: `Failed to delete supplement: ${error.message}`,
        variant: "destructive" 
      });
    }
  });

  const openCreateForm = () => {
    form.reset({ name: "", category: "General" });
    setSupplementToEdit(null);
    setFormOpen(true);
  };

  const openEditForm = (supplement: SupplementReference) => {
    setSupplementToEdit(supplement);
    form.reset({
      name: supplement.name,
      category: supplement.category
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setSupplementToEdit(null);
    form.reset();
  };

  const handleFormSubmit = (data: SupplementFormData) => {
    if (supplementToEdit) {
      updateSupplement.mutate({ id: supplementToEdit.id, supplementData: data });
    } else {
      createSupplement.mutate(data);
    }
  };

  const handleDelete = (id: number) => {
    setSupplementToDelete(id);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="flex h-screen">
      <DashboardNav />
      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Supplement References</h1>
          <Button onClick={openCreateForm}>
            <Plus className="w-4 h-4 mr-2" />
            New Supplement
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Supplement References</CardTitle>
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
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supplements?.map((supplement) => (
                    <TableRow key={supplement.id}>
                      <TableCell>{supplement.id}</TableCell>
                      <TableCell>{supplement.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {supplement.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" onClick={() => openEditForm(supplement)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="destructive" onClick={() => handleDelete(supplement.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Supplement Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{supplementToEdit ? 'Edit Supplement' : 'Create Supplement'}</DialogTitle>
            <DialogDescription>
              {supplementToEdit 
                ? 'Update supplement details below.' 
                : 'Enter the details for the new supplement reference.'
              }
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeForm}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createSupplement.isPending || updateSupplement.isPending}>
                  {createSupplement.isPending || updateSupplement.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {supplementToEdit ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Supplement</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            Are you sure you want to delete this supplement reference? This action cannot be undone.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (supplementToDelete) deleteSupplement.mutate(supplementToDelete);
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
