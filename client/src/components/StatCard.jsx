import { Card, CardContent } from '@/components/ui/card';

export function StatCard({ label, value, icon: Icon }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{label}</p>
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        </div>
        <p className="text-3xl font-bold mt-2">{value ?? 0}</p>
      </CardContent>
    </Card>
  );
}
