import { DashboardNav } from "@/components/dashboard-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { fetchReferenceData } from "@/lib/api";
import { insertReferenceDataSchema, type ReferenceData } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus } from "lucide-react";

export default function ReferenceManagement() {
  const { toast } = useToast();
  const { data: referenceData, isLoading } = useQuery({
    queryKey: ['/api/reference-data'],
    queryFn: fetchReferenceData
  });

  const form = useForm({
    resolver: zodResolver(insertReferenceDataSchema),
    defaultValues: {
      category: "",
      key: "",
      value: ""
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: ReferenceData) => {
      // Ensure value is parsed as JSON before sending
      const formattedData = {
        ...data,
        value: typeof data.value === 'string' ? JSON.parse(data.value) : data.value
      };
      const res = await apiRequest("POST", "/api/reference-data", formattedData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reference-data'] });
      toast({ title: "Reference data created successfully" });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create reference data",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const onSubmit = form.handleSubmit((data) => {
    try {
      // Validate JSON before submitting
      JSON.parse(data.value as string);
      createMutation.mutate(data as ReferenceData);
    } catch (e) {
      toast({
        title: "Invalid JSON value",
        description: "Please enter valid JSON for the value field",
        variant: "destructive"
      });
    }
  });

  return (
    <div className="flex h-screen">
      <DashboardNav />
      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Reference Data Management</h1>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Reference Data
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Reference Data</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={onSubmit} className="space-y-4">
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
                  <FormField
                    control={form.control}
                    name="key"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Key</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Value (JSON)</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={5} placeholder='{"example": "value"}' />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                    {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Reference Data
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Reference Data</CardTitle>
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
                    <TableHead>Category</TableHead>
                    <TableHead>Key</TableHead>
                    <TableHead>Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referenceData?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>{item.key}</TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted p-1 rounded">
                          {JSON.stringify(item.value)}
                        </code>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
