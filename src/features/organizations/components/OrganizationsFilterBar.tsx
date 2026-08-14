import { Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ADMIN_REGION_OPTIONS } from '@/config/constants'
import { useState } from 'react'

interface OrganizationsFilterBarProps {
  totalInPipeline: number,
  selectedRegion: string,
  searchValue: string
  onRegionChange: (value: string) => void,
  onSearchChange: (value: string) => void,
  onClearFilters: () => void
}

export function OrganizationsFilterBar({
  totalInPipeline,
  selectedRegion,
  searchValue,
  onRegionChange,
  onSearchChange,
  onClearFilters,
}: OrganizationsFilterBarProps) {
    const [searchInput, setSearchInput] = useState(searchValue)

  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-card p-4 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-1 flex-col gap-3 md:flex-row">
        <div className="relative flex-1">

        {/*Search by organization name or contact name.*/}
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search organizations or contacts..."
            className="pl-9"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            onKeyDown={(event) => {
                if (event.key === 'Enter') {
                    onSearchChange(searchInput)
                }
            }}
          />
        </div>

        {/*Filter by region.*/}
        <Select
            value={selectedRegion}
            onValueChange={onRegionChange}
        >
            <SelectTrigger className="w-full md:w-[220px]">
                <SelectValue placeholder="All regions" />
            </SelectTrigger>

            <SelectContent>
                <SelectItem value="all">
                All regions
                </SelectItem>
                {ADMIN_REGION_OPTIONS.map((region) => (
                <SelectItem
                    key={`${region.city}-${region.province}`}
                    value={`${region.city}|${region.province}`}
            >
                    {region.label}
                </SelectItem>
                ))}
            </SelectContent>
        </Select>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          >
          Clear filters
        </Button>
      </div>

      <div className="flex items-center gap-3 md:justify-end">
        {/*Display number of pending and approved organizations. Rejected not included.*/}
        <span className="text-sm text-muted-foreground">
          Organizations in pipeline
        </span>
        <Badge
          variant="secondary"
          className="flex h-9 min-w-9 items-center justify-center rounded-full px-3 text-sm font-semibold"
        >
          {totalInPipeline}
        </Badge>
      </div>
    </div>
  )
}