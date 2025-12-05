import { IconTrendingUp, IconSearch, IconWorld, IconDatabase, IconActivity } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type SectionCardsProps = {
  totalSearches: number
  totalSites: number
  activeSites: number
  totalPagesIndexed: number
}

export function SectionCards({ totalSearches, totalSites, activeSites, totalPagesIndexed }: SectionCardsProps) {
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Searches</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalSearches.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconSearch className="size-4" />
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Search queries this month <IconActivity className="size-4" />
          </div>
          <div className="text-muted-foreground">
            All sites combined
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Sites</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalSites}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconWorld className="size-4" />
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {activeSites} active sites <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Indexed and searchable
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Active Sites</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {activeSites}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              {totalSites > 0 ? Math.round((activeSites / totalSites) * 100) : 0}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Sites with search enabled <IconWorld className="size-4" />
          </div>
          <div className="text-muted-foreground">Ready to serve searches</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Pages Indexed</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalPagesIndexed.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconDatabase className="size-4" />
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Total pages crawled <IconDatabase className="size-4" />
          </div>
          <div className="text-muted-foreground">Available for search</div>
        </CardFooter>
      </Card>
    </div>
  )
}
