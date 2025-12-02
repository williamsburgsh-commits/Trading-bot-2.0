import { Skeleton } from './ui/skeleton';

export function SignalsTableSkeleton() {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Asset
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Signal Type
            </th>
            <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
              Entry
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              TP
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              SL
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Timeframe
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Generated At
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Confidence
            </th>
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3, 4, 5].map((i) => (
            <tr key={i} className="border-b border-border">
              <td className="h-12 px-4 align-middle">
                <Skeleton className="h-4 w-20" />
              </td>
              <td className="h-12 px-4 align-middle">
                <Skeleton className="h-6 w-16" />
              </td>
              <td className="h-12 px-4 align-middle">
                <Skeleton className="h-4 w-24" />
              </td>
              <td className="h-12 px-4 align-middle">
                <Skeleton className="h-4 w-24" />
              </td>
              <td className="h-12 px-4 align-middle">
                <Skeleton className="h-4 w-24" />
              </td>
              <td className="h-12 px-4 align-middle">
                <Skeleton className="h-4 w-12" />
              </td>
              <td className="h-12 px-4 align-middle">
                <Skeleton className="h-4 w-28" />
              </td>
              <td className="h-12 px-4 align-middle">
                <Skeleton className="h-4 w-20" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
