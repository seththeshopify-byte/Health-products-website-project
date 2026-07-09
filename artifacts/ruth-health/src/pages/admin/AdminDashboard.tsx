import { useGetDashboardSummary, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import { Users, ShoppingBag, DollarSign, Wallet } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboard() {
  const { data: summary, isLoading } = useGetDashboardSummary({
    query: { queryKey: getGetDashboardSummaryQueryKey() }
  });

  if (isLoading) return <div>Loading dashboard...</div>;
  if (!summary) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-serif mb-2">Overview</h1>
        <p className="text-muted-foreground">High-level metrics and recent activity.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Total Revenue</CardTitle>
            <DollarSign size={16} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-serif">{formatPrice(summary.totalRevenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Total Orders</CardTitle>
            <ShoppingBag size={16} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-serif">{summary.totalOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Total Members</CardTitle>
            <Users size={16} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-serif">{summary.totalMembers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Pending Commissions</CardTitle>
            <Wallet size={16} className="text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-serif text-amber-600">{formatPrice(summary.totalCommissionPending)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.recentOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">No recent orders</TableCell>
                  </TableRow>
                ) : (
                  summary.recentOrders.map(order => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">#{order.id}</TableCell>
                      <TableCell>
                        <div className="font-medium">{order.itemName}</div>
                        <div className="text-xs text-muted-foreground capitalize">{order.itemType}</div>
                      </TableCell>
                      <TableCell>{formatPrice(order.totalAmount)}</TableCell>
                      <TableCell>
                        <Badge variant={order.status === 'paid' ? 'default' : 'secondary'} className="capitalize">
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Referrers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {summary.topReferrers.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">No referrals yet</div>
              ) : (
                summary.topReferrers.map((referrer, i) => (
                  <div key={referrer.memberId} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm">
                        {i + 1}
                      </div>
                      <div>
                        <div className="font-medium">{referrer.memberName}</div>
                        <div className="text-xs text-muted-foreground">{referrer.referralCount} referrals</div>
                      </div>
                    </div>
                    <div className="font-medium text-primary">
                      {formatPrice(referrer.totalCommission)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
