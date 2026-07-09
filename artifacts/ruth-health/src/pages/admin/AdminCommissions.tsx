import { useListCommissionEvents, getListCommissionEventsQueryKey, useMarkCommissionPaid } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

export default function AdminCommissions() {
  const { data: events, isLoading } = useListCommissionEvents({ query: { queryKey: getListCommissionEventsQueryKey() } });
  const markPaidMutation = useMarkCommissionPaid();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleMarkPaid = (id: number) => {
    if (!confirm("Mark this commission as paid out to the member?")) return;
    
    markPaidMutation.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCommissionEventsQueryKey() });
        toast({ title: "Commission marked as paid" });
      },
      onError: (err: any) => {
        toast({ title: "Action failed", description: err.error, variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif mb-1">Commissions Ledger</h1>
        <p className="text-muted-foreground">Track and fulfill referral payouts.</p>
      </div>

      <div className="bg-card border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Referring Member</TableHead>
              <TableHead>Event Type</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>
            ) : events?.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No commission events found</TableCell></TableRow>
            ) : (
              events?.map(event => (
                <TableRow key={event.id}>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(event.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{event.referringMemberName || `Member #${event.referringMemberId}`}</div>
                  </TableCell>
                  <TableCell>
                    <span className="capitalize">{event.type}</span>
                  </TableCell>
                  <TableCell className="text-right font-medium text-primary">
                    {formatPrice(event.amount)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={event.status === 'paid' ? 'secondary' : 'default'} className="capitalize">
                      {event.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {event.status === 'pending' && (
                      <Button variant="ghost" size="sm" className="h-8 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleMarkPaid(event.id)}>
                        <CheckCircle2 size={16} className="mr-2" /> Mark Paid
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
