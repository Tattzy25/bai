import { IconTrendingDown, IconTrendingUp, IconSearch, IconFiles, IconServer, IconClock } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface SectionCardsProps {
  totalSearches?: number
  totalSites?: number
  activeSites?: number
  totalPagesIndexed?: number
  storageUsed?: number
  avgLatency?: number
}

export function SectionCards({ 
  totalSearches = 0, 
  totalSites = 0, 
  activeSites = 0, 
  totalPagesIndexed = 0,
  storageUsed = 0,
  avgLatency = 0
}: SectionCardsProps = {}) {
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <IconSearch className="size-4" />
            Total Searches
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalSearches.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              Live
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Powered by Upstash Search
          </div>
          <div className="text-muted-foreground">
            Real-time query tracking
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <IconFiles className="size-4" />
            Documents Indexed
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalPagesIndexed.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconServer />
              {storageUsed}KB
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Storage: {storageUsed.toLocaleString()} KB
          </div>
          <div className="text-muted-foreground">
            Upstash vector index
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <IconServer className="size-4" />
            Active Sites
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {activeSites}/{totalSites}
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
            {activeSites} sites online <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Total {totalSites} registered</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <IconClock className="size-4" />
            Avg Response Time
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {avgLatency}ms
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              Fast
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Edge-optimized queries
          </div>
          <div className="text-muted-foreground">Sub-100ms latency</div>
        </CardFooter>
      </Card>
    </div>
  )
}
